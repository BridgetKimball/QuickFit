import { Hono } from "hono";

const CLOTHING_TYPES = ["Shirts", "Shorts", "Pants", "Skirts", "Sweaters", "Jackets", "Shoes", "Accessories", "Dresses"];
const THEMES = ["Casual", "Business-Casual", "Formal", "Semi-formal", "Professional"];
const SKIRT_LENGTHS = ["Mini", "Knee", "Midi", "Floor"];
const DRESS_LENGTHS = ["Mini", "Knee", "Midi", "Floor"];
const SLEEVE_LENGTHS = ["Short sleeve", "Long sleeve"];
const JEWELRY_TYPES = ["Necklace", "Earrings", "Bracelets", "Rings"];

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const DEFAULT_GEMINI_MODEL = "gemini-flash-latest";

const MAX_CLOSET_ITEMS = 20;

function buildItemProperties(extra) {
  return {
    type: { type: "STRING", enum: CLOTHING_TYPES, description: "The garment category." },
    style: { type: "STRING", description: "A short style label, e.g. 'Blouse', 'Straight', 'Puffer jacket'." },
    color: { type: "STRING", description: "The item's primary color, in plain English (e.g. 'Dark Blue', 'Multicolor')." },
    pattern: { type: "STRING", description: "Pattern if visible (e.g. 'Striped', 'Floral'), omit if solid/none." },
    material: { type: "STRING", description: "Best guess at fabric or material (e.g. 'Denim', 'Cotton'), omit if unclear." },
    theme: { type: "STRING", enum: THEMES, description: "How formal/casual the item reads." },
    skirtLength: { type: "STRING", enum: SKIRT_LENGTHS, description: "Only set this if type is Skirts." },
    dressLength: { type: "STRING", enum: DRESS_LENGTHS, description: "Only set this if type is Dresses." },
    sleeveLength: { type: "STRING", enum: SLEEVE_LENGTHS, description: "Only set this if type is Shirts or Dresses and it has sleeves." },
    jewelryType: { type: "STRING", enum: JEWELRY_TYPES, description: "Only set this if type is Accessories and the item is jewelry." },
    ...extra,
  };
}

const SINGLE_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: buildItemProperties({
    photoIssue: {
      type: "STRING",
      description: "Set this if the photo does not meet the app's requirements: it shows a person wearing the item, " +
        "shows more than one clothing item, or the item is too small/unclear to identify. Briefly describe the issue " +
        "in one short sentence. Omit this field entirely if the photo is a clean shot of a single item, laid flat, " +
        "on a hanger, or on a mannequin.",
    },
  }),
  required: ["type", "style", "color", "theme"],
};

const CLOSET_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    items: {
      type: "ARRAY",
      description: `Each distinct clothing item you can confidently identify in the photo, up to ${MAX_CLOSET_ITEMS}.`,
      items: {
        type: "OBJECT",
        properties: buildItemProperties({
          label: {
            type: "STRING",
            description: "A short 3-6 word description identifying this specific item for the user, " +
              "e.g. 'Pink floral short-sleeve dress' or 'Blue chambray button-up'.",
          },
        }),
        required: ["type", "style", "color", "theme", "label"],
      },
    },
  },
  required: ["items"],
};

const ONE_GARMENT_RULE = "Important: a single physical garment counts as exactly ONE item, even if it has a visually " +
  "distinct bodice and skirt, a contrasting fabric panel, a lace overlay, or multiple colors/patterns in different " +
  "sections (for example, a dress with a lace top half and a printed skirt half is still one dress). Never split one " +
  "physical garment into multiple items just because it has multiple colors, fabrics, or design sections.";

const SINGLE_PROMPT_TEXT = "This app expects photos of a single clothing item for a digital closet, laid flat, on a hanger, " +
  "or on a mannequin — not worn by a person, and not showing multiple items. " +
  `${ONE_GARMENT_RULE} ` +
  "First check whether this photo meets that spec and set photoIssue if it doesn't. " +
  "Then respond with your best guess for each field based only on what's visible in the photo.";

const CLOSET_PROMPT_TEXT = "This is a photo of a closet or clothes rack holding multiple clothing items, for a digital " +
  "closet app. Identify each distinct clothing item that is clearly visible enough to describe with reasonable " +
  "confidence — ignore storage boxes, luggage, bags, pillows, shoe organizers, and other non-clothing objects. Skip " +
  "items that are too small, cut off, or too occluded by other items to identify confidently, rather than guessing. " +
  `${ONE_GARMENT_RULE} ` +
  `List at most ${MAX_CLOSET_ITEMS} items, prioritizing the most clearly visible ones. For each item, give a short ` +
  "label plus your best guess for the other fields, based only on what's visible in the photo.";

const photo = new Hono();

photo.post("/", async (c) => {
  if (!c.env.GEMINI_API_KEY) {
    return c.json({ error: "Worker is missing the GEMINI_API_KEY secret." }, 500);
  }

  let body;
  try {
    body = await c.req.json();
  } catch (_error) {
    return c.json({ error: "Request body must be JSON." }, 400);
  }

  const dataUrl = typeof body?.image === "string" ? body.image : "";
  const parsedImage = parseDataUrl(dataUrl);
  if (!parsedImage) {
    return c.json({ error: "Expected an 'image' field containing a data URL." }, 400);
  }

  if (parsedImage.base64.length > MAX_IMAGE_BYTES) {
    return c.json({ error: "Image is too large." }, 413);
  }

  const isClosetMode = body?.mode === "closet";
  const promptText = isClosetMode ? CLOSET_PROMPT_TEXT : SINGLE_PROMPT_TEXT;
  const responseSchema = isClosetMode ? CLOSET_RESPONSE_SCHEMA : SINGLE_RESPONSE_SCHEMA;

  try {
    const suggestion = await analyzeClothingPhoto(parsedImage, c.env.GEMINI_API_KEY, c.env.GEMINI_MODEL, promptText, responseSchema);
    return c.json(suggestion, 200);
  } catch (error) {
    return c.json({ error: error.message || "Photo analysis failed." }, 502);
  }
});

function parseDataUrl(dataUrl) {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { mediaType: match[1], base64: match[2] };
}

async function analyzeClothingPhoto(image, apiKey, model, promptText, responseSchema) {
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
            { text: promptText },
            { inline_data: { mime_type: image.mediaType, data: image.base64 } },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
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

export default photo;
