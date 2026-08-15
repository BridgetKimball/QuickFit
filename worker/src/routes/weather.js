import { Hono } from "hono";

const weather = new Hono();

// Transparent proxy: returns the exact OpenWeather response shape unchanged so the
// frontend's existing parsing (applyCurrentWeatherDefaults/applyForecastWeatherDefaults
// in script.js) needs no changes.
weather.get("/", async (c) => {
  const lat = c.req.query("lat");
  const lon = c.req.query("lon");
  if (!lat || !lon) {
    return c.json({ error: "lat and lon are required." }, 400);
  }

  const upstreamPath = c.req.query("type") === "forecast" ? "forecast" : "weather";
  const upstream = new URL(`https://api.openweathermap.org/data/2.5/${upstreamPath}`);
  upstream.searchParams.set("lat", lat);
  upstream.searchParams.set("lon", lon);
  upstream.searchParams.set("units", "imperial");
  upstream.searchParams.set("appid", c.env.OPENWEATHER_API_KEY);

  const response = await fetch(upstream.toString());
  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
});

export default weather;
