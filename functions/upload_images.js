
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
        const name = formData.get('name');
        const email = formData.get('email');
        const files = formData.getAll('images');

        if (uploadedImageUrls.length > 0) {
            fields.Image_Upload = uploadedImageUrls;
        }

        console.log("Saving upload to Airtable:", JSON.stringify({ fields }));

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
