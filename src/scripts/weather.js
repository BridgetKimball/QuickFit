export {
  buildWeatherErrorMessage,
  fetchCurrentWeather,
  fetchForecastWeather,
  formatWeatherSummary,
  getCurrentPosition,
  isSameForecastDay,
  mapWeatherCondition,
  selectRepresentativeForecastEntry,
};

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 20000,
      maximumAge: 3600000,
    });
  });
}

async function fetchCurrentWeather(latitude, longitude) {
  return fetchWeatherData("current", latitude, longitude);
}

async function fetchForecastWeather(latitude, longitude) {
  return fetchWeatherData("forecast", latitude, longitude);
}

// The weather proxy lives on the same Cloudflare Worker as photo analysis and accounts
// (see worker/src/routes/weather.js) — it keeps the OpenWeather key server-side and
// avoids the browser needing to reach api.openweathermap.org directly (which real
// visitors' ad blockers/privacy extensions can silently block).
async function fetchWeatherData(type, latitude, longitude) {
  const base = resolveWeatherProxyBase();
  if (!base) {
    const error = new Error("QuickFit's weather service isn't configured for this deployment yet.");
    error.missingProxy = true;
    throw error;
  }

  const url = new URL(`${base}/weather`);
  url.searchParams.set("type", type);
  url.searchParams.set("lat", latitude);
  url.searchParams.set("lon", longitude);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    let message = `Weather request failed with status ${response.status}`;
    try {
      const errorPayload = await response.json();
      if (errorPayload?.error) {
        message = errorPayload.error;
      }
    } catch (_error) {
      // Keep the default message if the error body isn't JSON.
    }

    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

function resolveWeatherProxyBase() {
  const endpoint = typeof window.QUICKFIT_PHOTO_ANALYSIS_ENDPOINT === "string"
    ? window.QUICKFIT_PHOTO_ANALYSIS_ENDPOINT.trim()
    : "";
  return endpoint.replace(/\/$/, "");
}

function isSameForecastDay(unixSeconds, selectedDate) {
  const entryDate = new Date(unixSeconds * 1000);
  return (
    entryDate.getFullYear() === selectedDate.getFullYear() &&
    entryDate.getMonth() === selectedDate.getMonth() &&
    entryDate.getDate() === selectedDate.getDate()
  );
}

function selectRepresentativeForecastEntry(dayEntries) {
  let bestEntry = dayEntries[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  dayEntries.forEach((entry) => {
    const entryDate = new Date(entry.dt * 1000);
    const distance = Math.abs(entryDate.getHours() - 12);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestEntry = entry;
    }
  });

  return bestEntry;
}

function mapWeatherCondition(mainCondition = "", description = "", windSpeed = 0) {
  const main = mainCondition.toLowerCase();
  const details = description.toLowerCase();

  if (main.includes("snow")) return "snowy";
  if (main.includes("rain") || main.includes("drizzle") || main.includes("thunderstorm")) return "rainy";
  if (windSpeed >= 15) return "windy";
  if (main.includes("cloud")) return "cloudy";
  if (main.includes("clear")) return "sunny";
  if (details.includes("wind") || main.includes("squall") || main.includes("tornado")) return "windy";
  return "cloudy";
}

function buildWeatherErrorMessage(error) {
  if (error?.code === 1) {
    return "Location access was denied, so QuickFit is keeping the planner weather editable with manual defaults.";
  }

  if (error?.code === 2) {
    return "QuickFit could not determine your location, so the planner is using manual defaults for now.";
  }

  if (error?.code === 3) {
    return "Location lookup timed out before the browser returned coordinates, so QuickFit is using manual defaults until you try again.";
  }

  if (error?.status === 401) {
    return "Weather service authentication failed. Check the worker's OPENWEATHER_API_KEY secret.";
  }

  if (error?.missingProxy) {
    return "Weather isn't configured for this deployment. Set PHOTO_ANALYSIS_ENDPOINT (the worker URL) in GitHub Actions.";
  }

  if (error?.status === 429) {
    return "OpenWeather rate-limited the request, so QuickFit is using manual defaults for now.";
  }

  if (error?.forecastUnavailable) {
    return "Forecast data wasn't available for that date, so QuickFit could not fill in the weather automatically.";
  }

  return "QuickFit could not load current weather right now, so the planner is using manual defaults.";
}

function formatWeatherSummary(summary) {
  return summary
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ");
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
