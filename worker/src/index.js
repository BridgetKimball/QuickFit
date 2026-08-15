const CLOTHING_TYPES = ["Shirts", "Shorts", "Pants", "Skirts", "Sweaters", "Jackets", "Shoes", "Accessories"];
const THEMES = ["Casual", "Business-Casual", "Formal", "Semi-formal", "Professional"];
const SKIRT_LENGTHS = ["Mini", "Knee", "Midi", "Floor"];
const SLEEVE_LENGTHS = ["Short sleeve", "Long sleeve"];
const JEWELRY_TYPES = ["Necklace", "Earrings", "Bracelets", "Rings"];

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const DEFAULT_GEMINI_MODEL = "gemini-flash-latest";

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    type: { type: "STRING", enum: CLOTHING_TYPES, description: "The garment category." },
    style: { type: "STRING", description: "A short style label, e.g. 'Blouse', 'Straight', 'Puffer jacket'." },
    color: { type: "STRING", description: "The item's primary color, in plain English (e.g. 'Dark Blue', 'Multicolor')." },
    pattern: { type: "STRING", description: "Pattern if visible (e.g. 'Striped', 'Floral'), omit if solid/none." },
    material: { type: "STRING", description: "Best guess at fabric or material (e.g. 'Denim', 'Cotton'), omit if unclear." },
    theme: { type: "STRING", enum: THEMES, description: "How formal/casual the item reads." },
    skirtLength: { type: "STRING", enum: SKIRT_LENGTHS, description: "Only set this if type is Skirts." },
    sleeveLength: { type: "STRING", enum: SLEEVE_LENGTHS, description: "Only set this if type is Shirts and it has sleeves." },
    jewelryType: { type: "STRING", enum: JEWELRY_TYPES, description: "Only set this if type is Accessories and the item is jewelry." },
  },
  required: ["type", "style", "color", "theme"],
};

const PROMPT_TEXT = "This is a photo of a single clothing item for a digital closet app. " +
  "Respond with your best guess for each field based only on what's visible in the photo.";

export default {
  async fetch(request, env) {
    const corsHeaders = buildCorsHeaders(env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Only POST is supported." }, 405, corsHeaders);
    }

    if (!env.GEMINI_API_KEY) {
      return jsonResponse({ error: "Worker is missing the GEMINI_API_KEY secret." }, 500, corsHeaders);
    }

    let body;
    try {
      body = await request.json();
    } catch (_error) {
      return jsonResponse({ error: "Request body must be JSON." }, 400, corsHeaders);
    }

    const dataUrl = typeof body?.image === "string" ? body.image : "";
    const parsedImage = parseDataUrl(dataUrl);
    if (!parsedImage) {
      return jsonResponse({ error: "Expected an 'image' field containing a data URL." }, 400, corsHeaders);
    }

    if (parsedImage.base64.length > MAX_IMAGE_BYTES) {
      return jsonResponse({ error: "Image is too large." }, 413, corsHeaders);
    }

    try {
      const suggestion = await analyzeClothingPhoto(parsedImage, env.GEMINI_API_KEY, env.GEMINI_MODEL);
      return jsonResponse(suggestion, 200, corsHeaders);
    } catch (error) {
      return jsonResponse({ error: error.message || "Photo analysis failed." }, 502, corsHeaders);
    }
  },
};

function buildCorsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(payload, status, corsHeaders) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function parseDataUrl(dataUrl) {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { mediaType: match[1], base64: match[2] };
}

async function analyzeClothingPhoto(image, apiKey, model) {
  const modelId = model || DEFAULT_GEMINI_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: PROMPT_TEXT },
            { inline_data: { mime_type: image.mediaType, data: image.base64 } },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorBody.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Model did not return structured clothing fields.");
  }

  try {
    return JSON.parse(text);
  } catch (_error) {
    throw new Error("Model returned malformed JSON.");
  }
}
