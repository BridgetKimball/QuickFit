const WEATHER_PROXY_URL = window.QUICKFIT_WEATHER_PROXY_URL || "/api/weather";
const OPENWEATHER_CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather";
const OPENWEATHER_FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

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

async function fetchWeatherData(type, latitude, longitude) {
  try {
    return await fetchWeatherFromProxy(type, latitude, longitude);
  } catch (error) {
    if (!error?.proxyUnavailable) {
      throw error;
    }

    return fetchWeatherDirect(type, latitude, longitude);
  }
}

async function fetchWeatherFromProxy(type, latitude, longitude) {
  const url = new URL(WEATHER_PROXY_URL, window.location.origin);
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
      if (errorPayload?.message) {
        message = errorPayload.message;
      }
    } catch (_error) {
      // Keep default message if payload is not JSON.
    }

    const error = new Error(message);
    error.status = response.status;
    if (response.status === 404 || response.status === 503) {
      error.proxyUnavailable = true;
    }
    throw error;
  }

  return response.json();
}

async function fetchWeatherDirect(type, latitude, longitude) {
  const apiKey = readWeatherApiKey();

  if (!apiKey) {
    const error = new Error("OpenWeather API key is not configured for this deployment");
    error.missingClientKey = true;
    throw error;
  }

  const upstreamUrl = new URL(type === "forecast" ? OPENWEATHER_FORECAST_URL : OPENWEATHER_CURRENT_URL);
  upstreamUrl.searchParams.set("lat", String(latitude));
  upstreamUrl.searchParams.set("lon", String(longitude));
  upstreamUrl.searchParams.set("units", "imperial");
  upstreamUrl.searchParams.set("appid", apiKey);

  const response = await fetch(upstreamUrl.toString(), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const error = new Error(`OpenWeather request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

function readWeatherApiKey() {
  const runtimeKey =
    typeof window.QUICKFIT_OPENWEATHER_API_KEY === "string"
      ? window.QUICKFIT_OPENWEATHER_API_KEY.trim()
      : "";

  return runtimeKey;
}

function applyCurrentWeatherDefaults(weatherData, forecastData, selectedDate) {
  const temperature = Math.round(weatherData.main.temp);
  const dayEntries = forecastData?.list?.filter((entry) => isSameForecastDay(entry.dt, selectedDate)) || [];
  const forecastHigh = dayEntries.length
    ? Math.max(...dayEntries.map((entry) => entry.main.temp_max))
    : weatherData.main.temp_max;
  const forecastLow = dayEntries.length
    ? Math.min(...dayEntries.map((entry) => entry.main.temp_min))
    : weatherData.main.temp_min;
  const highTemperature = Math.round(Math.max(weatherData.main.temp, forecastHigh));
  const lowTemperature = Math.round(Math.min(weatherData.main.temp, forecastLow));
  const weatherCategory = mapWeatherCondition(
    weatherData.weather?.[0]?.main,
    weatherData.weather?.[0]?.description,
    weatherData.wind?.speed
  );
  const season = detectSeason(new Date((weatherData.dt + weatherData.timezone) * 1000));
  const locationName = weatherData.name || "your area";
  const conditionLabel = weatherData.weather?.[0]?.description || weatherData.weather?.[0]?.main || weatherCategory;

  elements.temperature.value = String(temperature);
  elements.temperatureValue.textContent = `${temperature}°F`;
  elements.weatherSelect.value = weatherCategory;
  elements.season.value = season;
  elements.weatherStatus.textContent = `Using current weather for ${locationName}:\nHigh of ${highTemperature}°F and Low of ${lowTemperature}°F and ${formatWeatherSummary(conditionLabel)}.`;
  generateRecommendation(getPlannerState());
}

function applyForecastWeatherDefaults(forecastData, selectedDate) {
  const dayEntries = forecastData.list.filter((entry) => isSameForecastDay(entry.dt, selectedDate));
  if (!dayEntries.length) {
    const error = new Error("Forecast unavailable for selected date");
    error.forecastUnavailable = true;
    throw error;
  }

  const representativeEntry = selectRepresentativeForecastEntry(dayEntries);
  const highTemperature = Math.round(Math.max(...dayEntries.map((entry) => entry.main.temp_max)));
  const lowTemperature = Math.round(Math.min(...dayEntries.map((entry) => entry.main.temp_min)));
  const temperature = Math.round(representativeEntry.main.temp);
  const weatherCategory = mapWeatherCondition(
    representativeEntry.weather?.[0]?.main,
    representativeEntry.weather?.[0]?.description,
    representativeEntry.wind?.speed
  );
  const timezoneOffset = forecastData.city?.timezone || 0;
  const season = detectSeason(new Date((representativeEntry.dt + timezoneOffset) * 1000));
  const locationName = forecastData.city?.name || "your area";
  const conditionLabel =
    representativeEntry.weather?.[0]?.description || representativeEntry.weather?.[0]?.main || weatherCategory;

  elements.temperature.value = String(temperature);
  elements.temperatureValue.textContent = `${temperature}°F`;
  elements.weatherSelect.value = weatherCategory;
  elements.season.value = season;
  elements.weatherStatus.textContent = `Using forecast weather for ${locationName} on ${formatDisplayDate(selectedDate)}:\nHigh of ${highTemperature}°F and Low of ${lowTemperature}°F and ${formatWeatherSummary(conditionLabel)}.`;
  generateRecommendation(getPlannerState());
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
    return "Weather service authentication failed. Check the server-side OpenWeather API key configuration.";
  }

  if (error?.missingClientKey) {
    return "Weather is not configured for this deployment. Set OPENWEATHER_API_KEY in GitHub Actions or your serverless host.";
  }

  if (error?.proxyUnavailable) {
    return "The weather proxy is unavailable right now. QuickFit is using the deployment key fallback if available.";
  }

  if (error?.status === 429) {
    return "OpenWeather rate-limited the request, so QuickFit is using manual defaults for now.";
  }

  if (error?.forecastUnavailable) {
    return "OpenWeather forecast data is only available for the next 5 days in this app, so QuickFit could not fill weather for that date.";
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
