// functions/airtable.js

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { prompt, imageUrl, user, email, files } = await request.json();

    const airtableUrl = `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${env.AIRTABLE_TABLE_NAME}`;


    const timestamp = new Date().toISOString();

    const fields = {
      Prompt: prompt,
      User: user || 'Anonymous',
      Email: email,
      Image: [
        {
          url: imageUrl
        }
      ],
      Timestamp: timestamp
    };

    // Note: Airtable requires a public URL for attachments. 
    // Since we don't have a storage service yet, we can't attach the uploaded files directly.
    // If 'files' contained URLs, we would map them here:
    // if (files && files.length > 0) {
    //   fields.Image_Upload = files.map(f => ({ url: f.url }));
    // }

    console.log(JSON.stringify({ fields }));

    console.log("Prompt:", prompt);

    console.log("Type of Prompt:", typeof prompt);
    console.log("Image URL:", imageUrl);
    console.log("User:", user);

    /// mw

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "Missing imageUrl" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
    /// mw

    const airtableRes = await fetch(airtableUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields })
    });

    const data = await airtableRes.json();

    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}
