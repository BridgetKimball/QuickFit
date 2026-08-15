import { Hono } from "hono";
import { requireAuth } from "../middleware/requireAuth.js";
import { rowToFavoriteOutfit } from "../lib/db.js";
import { generateId } from "../lib/auth.js";

const favorites = new Hono();
favorites.use("*", requireAuth);

favorites.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM favorite_outfits WHERE user_id = ? ORDER BY created_at DESC"
  ).bind(c.get("userId")).all();
  return c.json({ outfits: results.map(rowToFavoriteOutfit) });
});

favorites.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.planner) {
    return c.json({ error: "Missing planner data." }, 400);
  }

  const id = generateId();
  const createdAt = new Date().toISOString();
  await c.env.DB.prepare(
    `INSERT INTO favorite_outfits
      (id, user_id, planner_json, top_item_id, bottom_item_id, layer_item_id, accessory_item_ids_json, shoes_item_id, tucked_in, jacket_closed, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    c.get("userId"),
    JSON.stringify(body.planner),
    body.topItemId || null,
    body.bottomItemId || null,
    body.layerItemId || null,
    JSON.stringify(body.accessoryItemIds || []),
    body.shoesItemId || null,
    body.tuckedIn ? 1 : 0,
    body.jacketClosed ? 1 : 0,
    createdAt
  ).run();

  const row = await c.env.DB.prepare("SELECT * FROM favorite_outfits WHERE id = ?").bind(id).first();
  return c.json({ outfit: rowToFavoriteOutfit(row) }, 201);
});

favorites.delete("/:id", async (c) => {
  const result = await c.env.DB.prepare(
    "DELETE FROM favorite_outfits WHERE id = ? AND user_id = ?"
  ).bind(c.req.param("id"), c.get("userId")).run();

  if (!result.meta.changes) {
    return c.json({ error: "Outfit not found." }, 404);
  }
  return c.body(null, 204);
});

export default favorites;
