
// functions/ai.js

export async function onRequest({ request, env }) {
  // ✅ CORS Preflight Handling
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  // ✅ Only accept POST
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const contentType = request.headers.get("Content-Type") || "";
    let prompt = "";
    let imageFile = null;

    // Handle both JSON and FormData
    if (contentType.includes("application/json")) {
      const body = await request.json();
      prompt = body.prompt;
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      prompt = formData.get("prompt");
      imageFile = formData.get("image");
    }

    if (!prompt && !imageFile) {
      return new Response(
        JSON.stringify({ error: "Missing 'prompt' or 'image'" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let finalPrompt = prompt;

    // ✅ If an image is provided, describe it first using GPT-4o
    if (imageFile) {
      console.log("🖼️ Image received. Analyzing with GPT-4o...");
      const arrayBuffer = await imageFile.arrayBuffer();

      // Fix: Use a loop to convert large buffers to string to avoid "Maximum call stack size exceeded"
      let binary = '';
      const bytes = new Uint8Array(arrayBuffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Image = btoa(binary);

      const dataUrl = `data:${imageFile.type};base64,${base64Image}`;

      const descriptionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.VITE_APP_OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "Describe this image in detail, focusing on the main subject, setting, lighting, and style. Be concise but descriptive." },
                { type: "image_url", image_url: { url: dataUrl } },
              ],
            },
          ],
          max_tokens: 300,
        }),
      });

      const descriptionData = await descriptionResponse.json();

      if (descriptionData.error) {
        throw new Error(`GPT-4o Error: ${descriptionData.error.message}`);
      }

      const description = descriptionData.choices[0].message.content;
      console.log("📝 Image Description:", description);

      // Combine description with user's modification prompt
      finalPrompt = `Create an image based on this description: "${description}". \n\nModification request: ${prompt}. \n\nEnsure the modification is applied while keeping the original vibe.`;
    }

    console.log("🎨 Generating image with prompt:", finalPrompt);

    // ✅ Generate image using OpenAI API (DALL-E 3)
    const apiResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.VITE_APP_OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: finalPrompt,
        n: 1,
        size: "1024x1024",
      }),
    });

    const data = await apiResponse.json();

    if (data.error) {
      throw new Error(`DALL-E 3 Error: ${data.error.message}`);
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // ✅ CORS
      },
    });
  } catch (error) {
    console.error("❌ Error in /ai function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}
