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
    const formData = await request.formData();
    const prompt = formData.get('prompt');
    const imageUrl = formData.get('imageUrl');
    const user = formData.get('user');
    const email = formData.get('email');
    const files = formData.getAll('images');

    const airtableUrl = `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${env.AIRTABLE_TABLE_NAME}`;

    const timestamp = new Date().toISOString();
    const uploadedImageUrls = [];

    // Upload files to R2
    if (files && files.length > 0) {
      for (const file of files) {
        if (file instanceof File) {
          // Sanitize email: replace non-alphanumeric characters with underscores
          const safeEmail = email ? email.replace(/[^a-zA-Z0-9]/g, '_') : 'anonymous';
          const key = `${safeEmail}_${Date.now()}_${file.name}`;

          await env.IMAGE_BUCKET.put(key, file.stream());
          const publicUrl = `${env.R2_PUBLIC_URL}/${key}`;
          uploadedImageUrls.push({ url: publicUrl });
        }
      }
    }

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

    if (uploadedImageUrls.length > 0) {
      fields.Image_Upload = uploadedImageUrls;
    }

    console.log(JSON.stringify({ fields }));

    console.log("Prompt:", prompt);
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
