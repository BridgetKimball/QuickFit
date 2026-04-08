const OPENWEATHER_ENDPOINTS = {
  current: "https://api.openweathermap.org/data/2.5/weather",
  forecast: "https://api.openweathermap.org/data/2.5/forecast",
};

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const type = String(req.query.type || "current");
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);

  if (!OPENWEATHER_ENDPOINTS[type]) {
    return res.status(400).json({ message: "Invalid weather request type" });
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ message: "Latitude and longitude are required" });
  }

  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return res.status(400).json({ message: "Latitude or longitude is out of range" });
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ message: "Weather proxy is not configured" });
  }

  const upstreamUrl = new URL(OPENWEATHER_ENDPOINTS[type]);
  upstreamUrl.searchParams.set("lat", String(lat));
  upstreamUrl.searchParams.set("lon", String(lon));
  upstreamUrl.searchParams.set("units", "imperial");
  upstreamUrl.searchParams.set("appid", apiKey);

  try {
    const upstreamResponse = await fetch(upstreamUrl);
    const text = await upstreamResponse.text();

    res.status(upstreamResponse.status);
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    if (!upstreamResponse.ok) {
      let upstreamMessage = "OpenWeather request failed";
      try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed.message === "string") {
          upstreamMessage = parsed.message;
        }
      } catch (_error) {
        // Keep fallback message when upstream response is not JSON.
      }

      return res.end(JSON.stringify({ message: upstreamMessage }));
    }

    return res.end(text);
  } catch (_error) {
    return res.status(502).json({ message: "Weather proxy could not reach OpenWeather" });
  }
};

module.exports.config = {
  runtime: "nodejs18.x",
};