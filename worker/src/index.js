import { Hono } from "hono";
import { cors } from "hono/cors";
import photo from "./routes/photo.js";
import weather from "./routes/weather.js";
import auth from "./routes/auth.js";
import closet from "./routes/closet.js";
import profile from "./routes/profile.js";
import favorites from "./routes/favorites.js";

const app = new Hono();

// CORS depends on env.ALLOWED_ORIGIN, which is only available per-request in Workers,
// so the middleware is constructed fresh on each request rather than at module scope.
app.use("*", (c, next) => cors({
  origin: c.env.ALLOWED_ORIGIN,
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
})(c, next));

app.route("/", photo); // POST / — unchanged photo-analysis contract, no path suffix
app.route("/weather", weather);
app.route("/auth", auth);
app.route("/closet", closet);
app.route("/profile", profile);
app.route("/favorites", favorites);

export default app;
