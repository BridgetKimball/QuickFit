import { hashToken, sessionExpiryIso } from "../lib/auth.js";

export async function requireAuth(c, next) {
  const authHeader = c.req.header("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return c.json({ error: "Not authenticated." }, 401);
  }

  const tokenHash = await hashToken(token);
  const session = await c.env.DB.prepare(
    "SELECT user_id, expires_at FROM sessions WHERE token_hash = ?"
  ).bind(tokenHash).first();

  if (!session || new Date(session.expires_at).getTime() < Date.now()) {
    return c.json({ error: "Not authenticated." }, 401);
  }

  // Sliding expiration: extend the session on use without blocking the response.
  c.executionCtx.waitUntil(
    c.env.DB.prepare("UPDATE sessions SET last_used_at = ?, expires_at = ? WHERE token_hash = ?")
      .bind(new Date().toISOString(), sessionExpiryIso(), tokenHash)
      .run()
  );

  c.set("userId", session.user_id);
  await next();
}
