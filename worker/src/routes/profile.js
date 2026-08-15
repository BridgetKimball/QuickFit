import { Hono } from "hono";
import { requireAuth } from "../middleware/requireAuth.js";

const profile = new Hono();
profile.use("*", requireAuth);

const DEFAULTS = { temperatureBias: "neutral", profileStyle: "Casual", presentation: "Unspecified" };

profile.get("/", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT temperature_bias, profile_style, presentation FROM profiles WHERE user_id = ?"
  ).bind(c.get("userId")).first();

  if (!row) {
    return c.json(DEFAULTS);
  }
  return c.json({
    temperatureBias: row.temperature_bias,
    profileStyle: row.profile_style,
    presentation: row.presentation,
  });
});

profile.put("/", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const temperatureBias = body?.temperatureBias || DEFAULTS.temperatureBias;
  const profileStyle = body?.profileStyle || DEFAULTS.profileStyle;
  const presentation = body?.presentation || DEFAULTS.presentation;

  await c.env.DB.prepare(
    `INSERT INTO profiles (user_id, temperature_bias, profile_style, presentation)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       temperature_bias = excluded.temperature_bias,
       profile_style = excluded.profile_style,
       presentation = excluded.presentation`
  ).bind(c.get("userId"), temperatureBias, profileStyle, presentation).run();

  return c.json({ profile: { temperatureBias, profileStyle, presentation } });
});

export default profile;
