import { Hono } from "hono";
import { requireAuth } from "../middleware/requireAuth.js";
import { rowToClosetItem } from "../lib/db.js";
import { generateId } from "../lib/auth.js";

const closet = new Hono();
closet.use("*", requireAuth);

const REQUIRED_FIELDS = ["name", "color", "type", "style"];

const INSERT_SQL = `INSERT INTO closet_items
  (id, user_id, name, color, base_color, pattern, material, type, style, skirt_length, dress_length, sleeve_length, jewelry_type, theme, is_favorite, photo)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

function bindItemValues(statement, userId, item, id) {
  return statement.bind(
    id,
    userId,
    item.name || "",
    item.color || "",
    item.baseColor || item.color || "",
    item.pattern || "",
    item.material || "",
    item.type || "",
    item.style || "",
    item.skirtLength || "",
    item.dressLength || "",
    item.sleeveLength || "",
    item.jewelryType || "",
    item.theme || "",
    item.isFavorite ? 1 : 0,
    item.photo || null
  );
}

closet.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM closet_items WHERE user_id = ? ORDER BY created_at DESC"
  ).bind(c.get("userId")).all();
  return c.json({ items: results.map(rowToClosetItem) });
});

closet.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || REQUIRED_FIELDS.some((field) => !body[field])) {
    return c.json({ error: "Missing required closet item fields." }, 400);
  }

  const id = generateId();
  await bindItemValues(c.env.DB.prepare(INSERT_SQL), c.get("userId"), body, id).run();
  const row = await c.env.DB.prepare("SELECT * FROM closet_items WHERE id = ?").bind(id).first();
  return c.json({ item: rowToClosetItem(row) }, 201);
});

closet.delete("/:id", async (c) => {
  const result = await c.env.DB.prepare(
    "DELETE FROM closet_items WHERE id = ? AND user_id = ?"
  ).bind(c.req.param("id"), c.get("userId")).run();

  if (!result.meta.changes) {
    return c.json({ error: "Item not found." }, 404);
  }
  return c.body(null, 204);
});

closet.patch("/:id/favorite", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const result = await c.env.DB.prepare(
    "UPDATE closet_items SET is_favorite = ? WHERE id = ? AND user_id = ?"
  ).bind(body?.isFavorite ? 1 : 0, c.req.param("id"), c.get("userId")).run();

  if (!result.meta.changes) {
    return c.json({ error: "Item not found." }, 404);
  }
  const row = await c.env.DB.prepare("SELECT * FROM closet_items WHERE id = ?").bind(c.req.param("id")).first();
  return c.json({ item: rowToClosetItem(row) });
});

closet.post("/import", async (c) => {
  const body = await c.req.json().catch(() => null);
  const items = Array.isArray(body?.items) ? body.items : [];
  const userId = c.get("userId");

  if (!items.length) {
    return c.json({ imported: 0, skipped: 0 });
  }

  const statements = items.map((item) => {
    const id = typeof item.id === "string" && item.id ? item.id : generateId();
    return bindItemValues(
      c.env.DB.prepare(INSERT_SQL.replace("INSERT INTO", "INSERT OR IGNORE INTO")),
      userId,
      item,
      id
    );
  });

  const results = await c.env.DB.batch(statements);
  const imported = results.filter((result) => result.meta.changes).length;
  return c.json({ imported, skipped: items.length - imported });
});

export default closet;
