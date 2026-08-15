import { Hono } from "hono";
import { generateId, hashPassword, hashToken, generateSessionToken, sessionExpiryIso, verifyPassword } from "../lib/auth.js";
import { requireAuth } from "../middleware/requireAuth.js";

const auth = new Hono();

auth.post("/signup", async (c) => {
  const body = await c.req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !email.includes("@")) {
    return c.json({ error: "A valid email is required." }, 400);
  }
  if (password.length < 8) {
    return c.json({ error: "Password must be at least 8 characters." }, 400);
  }

  const existing = await c.env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (existing) {
    return c.json({ error: "An account with that email already exists." }, 409);
  }

  const { hash, salt, iterations } = await hashPassword(password);
  const userId = generateId();
  await c.env.DB.prepare(
    "INSERT INTO users (id, email, password_hash, password_salt, password_iterations) VALUES (?, ?, ?, ?, ?)"
  ).bind(userId, email, hash, salt, iterations).run();

  const token = await createSession(c.env.DB, userId);
  return c.json({ token, user: { id: userId, email } }, 201);
});

auth.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const user = await c.env.DB.prepare(
    "SELECT id, email, password_hash, password_salt, password_iterations FROM users WHERE email = ?"
  ).bind(email).first();

  const valid = user
    ? await verifyPassword(password, { hash: user.password_hash, salt: user.password_salt, iterations: user.password_iterations })
    : false;

  if (!valid) {
    return c.json({ error: "Incorrect email or password." }, 401);
  }

  const token = await createSession(c.env.DB, user.id);
  return c.json({ token, user: { id: user.id, email: user.email } });
});

auth.post("/logout", requireAuth, async (c) => {
  const token = (c.req.header("Authorization") || "").slice(7).trim();
  await c.env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await hashToken(token)).run();
  return c.body(null, 204);
});

auth.get("/session", requireAuth, async (c) => {
  const user = await c.env.DB.prepare("SELECT id, email FROM users WHERE id = ?").bind(c.get("userId")).first();
  if (!user) {
    return c.json({ error: "Not authenticated." }, 401);
  }
  return c.json({ user: { id: user.id, email: user.email } });
});

// Permanently deletes the account and everything owned by it (sessions, closet items,
// profile, favorite outfits) via ON DELETE CASCADE — there is no recovery after this.
auth.delete("/account", requireAuth, async (c) => {
  await c.env.DB.prepare("DELETE FROM users WHERE id = ?").bind(c.get("userId")).run();
  return c.body(null, 204);
});

async function createSession(db, userId) {
  const token = generateSessionToken();
  await db.prepare(
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)"
  ).bind(await hashToken(token), userId, sessionExpiryIso()).run();
  return token;
}

export default auth;
