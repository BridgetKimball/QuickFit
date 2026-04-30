const STORAGE_KEYS = {
  closet: "quickfit-closet",
  profile: "quickfit-profile",
  lastLocation: "quickfit-last-location",
  favoriteOutfits: "quickfit-favorite-outfits",
};

const WEATHER_PROXY_URL = window.QUICKFIT_WEATHER_PROXY_URL || "/api/weather";
const OPENWEATHER_CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather";
const OPENWEATHER_FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

const clothingStyles = {
  Shirts: [
    "T-shirt",
    "Blouse",
    "Turtleneck",
    "Button Up",
    "Tank top",
    "Tube top",
  ],
  Shorts: [
    "Denim",
    "Boyfriend",
    "Cargo",
    "Pleat",
    "Knee",
    "Gym",
  ],
  Pants: [
    "Straight",
    "Skinny",
    "Boot-cut",
    "Flare",
    "Wide leg",
    "Sweatpants",
    "Cargo pants",
    "Palazzo",
    "Overalls",
    "Jumpsuit",
  ],
  Skirts: [
    "A-Line",
    "Pencil",
    "Trumpet",
    "Tiered",
    "Asymmetrical",
  ],
  Sweaters: [
    "Crewneck",
    "V-neck",
    "Turtleneck",
    "Quarter-zip",
    "Cardigan",
    "Cable knit",
    "Oversized",
    "Fair Isle",
  ],
  Jackets: [
    "Leather jacket",
    "Denim jacket",
    "Vest",
    "Blazer",
    "Fleece jacket",
    "Varsity jacket",
    "Windbreaker",
    "Puffer jacket",
    "Parka",
    "Peacoat",
    "Tuxedo jacket",
    "Quilted jacket",
    "Overcoat",
    "Trench coat",
  ],
  Shoes: [
    "Running shoes",
    "Basketball shoes",
    "Tennis shoes",
    "Canvas shoes",
    "Loafers",
    "Oxfords",
    "Ballet flats",
    "Heels",
    "Stilettos",
    "Wedges",
    "Flip-flops",
    "Slides",
    "Boots",
  ],
  Accessories: [
    "Hat",
    "Sunglasses",
    "Scarf",
    // "Jewelry"
  ],
};

const colorOptions = [
  "Pink",
  "Red",
  "Orange",
  "Yellow",
  "Light Green",
  "Dark Green",
  "Light Blue",
  "Dark Blue",
  "Light Purple",
  "Dark Purple",
  "Brown",
  "Black",
  "Grey",
  "White",
  "Multicolor",
];

const typeGroups = {
  top: ["Shirts", "Sweaters"],
  bottom: ["Skirts", "Shorts", "Pants"],
  layer: ["Jackets", "Accessories"],
  jacket: ["Jackets"],
  accessories: ["Accessories"],
  shoes: ["Shoes"],
};

const seasonOptions = ["Spring", "Summer", "Fall", "Winter"];
const styleDirectionOptions = [
  "Casual",
  "Formal",
  "Romantic",
  "Sporty",
  "Minimalist",
  "Artsy",
  "Retro",
  "Edgy",
  "Elegant",
];
const defaultProfile = {
  temperatureBias: "neutral",
  profileStyle: "Casual",
  presentation: "Unspecified",
};

const defaultCloset = [];
const legacySeedClosets = [
  [
    "Forest weekend tee",
    "Cream straight trousers",
    "Olive bomber layer",
  ],
  [
    "Forest knit tee",
    "Tailored cream trousers",
    "Olive cropped jacket",
  ],
];

const state = {
  closet: normalizeInitialCloset(loadCollection(STORAGE_KEYS.closet, defaultCloset)),
  profile: normalizeProfile(loadObject(STORAGE_KEYS.profile, defaultProfile)),
  weatherLocation: null,
  favoriteOutfits: loadCollection(STORAGE_KEYS.favoriteOutfits, []),
  currentRecommendation: null,
  mannequinControls: {
    tuckedIn: false,
    jacketClosed: false,
  },
};

const mannequinSources = {
  default: "./images/Mannequin_Silhouette.png",
  feminine: "./images/Mannequin_Silhouette2.png",
};

const elements = {
  sections: document.querySelectorAll(".panel-grid"),
  navButtons: document.querySelectorAll(".section-nav__link"),
  heroNavButtons: document.querySelectorAll("[data-nav-target]"),
  plannerForm: document.querySelector("#planner-form"),
  outfitDate: document.querySelector("#outfit-date"),
  stylePreferenceSelect: document.querySelector("#stylePreference"),
  temperature: document.querySelector("#temperature"),
  temperatureValue: document.querySelector("#temperature-value"),
  season: document.querySelector("#season"),
  weatherSummary: document.querySelector("#weather-summary"),
  topRecommendation: document.querySelector("#top-recommendation"),
  bottomRecommendation: document.querySelector("#bottom-recommendation"),
  layerRecommendation: document.querySelector("#layer-recommendation"),
  rationale: document.querySelector("#recommendation-rationale"),
  mannequinTop: document.querySelector("#mannequin-top"),
  mannequinBottom: document.querySelector("#mannequin-bottom"),
  mannequinLayer: document.querySelector("#mannequin-layer"),
  mannequinShoes: document.querySelector("#mannequin-shoes"),
  mannequinSilhouette: document.querySelector("#mannequin-silhouette"),
  mannequinShell: document.querySelector(".mannequin__silhouette-shell"),
  closetForm: document.querySelector("#closet-form"),
  closetList: document.querySelector("#closet-list"),
  closetFilter: document.querySelector("#closet-filter"),
  closetFavoriteFilter: document.querySelector("#closet-favorite-filter"),
  typeSelect: document.querySelector("#type"),
  styleSelect: document.querySelector("#style"),
  skirtLengthField: document.querySelector("#skirt-length-field"),
  skirtLengthSelect: document.querySelector("#skirtLength"),
  sleeveLengthField: document.querySelector("#sleeve-length-field"),
  sleeveLengthSelect: document.querySelector("#sleeveLength"),
  colorSelect: document.querySelector("#color"),
  customColorField: document.querySelector("#custom-color-field"),
  customColorInput: document.querySelector("#customColor"),
  jewelryField: document.querySelector("#jewelry-field"),
  jewelryTypeSelect: document.querySelector("#jewelryType"),
  weatherSelect: document.querySelector("#weather"),
  weatherStatus: document.querySelector("#weather-status"),
  refreshWeatherButton: document.querySelector("#refresh-weather"),
  favoriteOutfitButton: document.querySelector("#favorite-outfit"),
  toggleTuckButton: document.querySelector("#toggle-tuck"),
  toggleJacketButton: document.querySelector("#toggle-jacket"),
  profileForm: document.querySelector("#profile-form"),
  profileSummary: document.querySelector("#profile-summary"),
  profileStyleSelect: document.querySelector("#profileStyle"),
  shoesRecommendation: document.querySelector("#shoes-recommendation"),
  resetProfileButton: document.querySelector("#reset-profile"),
  savedOutfitsList: document.querySelector("#saved-outfits-list"),
};

init();

async function init() {
  populateOutfitDate();
  populateSeasonOptions();
  populateStyleDirectionOptions();
  populateTypeOptions();
  populateColorOptions();
  setClosetFavoriteFilter("all");
  updateStyleOptions(elements.typeSelect.value);
  syncConditionalFields();
  populateClosetFilter();
  bindEvents();
  renderCloset();
  renderProfile();
  generateRecommendation(getPlannerState());
  await initializeWeatherAccess();
}

async function initializeWeatherAccess() {
  if (!elements.weatherStatus || !elements.refreshWeatherButton) {
    return;
  }

  if (!("geolocation" in navigator)) {
    elements.weatherStatus.textContent = "Location access is not supported in this browser, so QuickFit is using manual defaults.";
    elements.refreshWeatherButton.disabled = true;
    return;
  }

  elements.weatherStatus.textContent = "Click 'Use My Current Weather' to share location and load weather from the secure proxy.";

  if (!("permissions" in navigator) || typeof navigator.permissions.query !== "function") {
    return;
  }

  try {
    const geolocationPermission = await navigator.permissions.query({ name: "geolocation" });

    if (geolocationPermission.state === "granted") {
      elements.weatherStatus.textContent = "Location already allowed. Refreshing your local weather defaults.";
      await loadCurrentWeatherDefaults(false);
      return;
    }

    if (geolocationPermission.state === "denied") {
      elements.weatherStatus.textContent = "Location access is blocked in browser settings, so QuickFit is using manual defaults.";
    }
  } catch (_error) {
    // Ignore permissions API failures and keep the click-to-consent flow.
  }
}

function bindEvents() {
  elements.navButtons.forEach((button) => {
    button.addEventListener("click", () => setActiveSection(button.dataset.section));
  });

  elements.heroNavButtons.forEach((button) => {
    button.addEventListener("click", () => setActiveSection(button.dataset.navTarget));
  });

  elements.temperature.addEventListener("input", () => {
    elements.temperatureValue.textContent = `${elements.temperature.value}°F`;
  });

  elements.refreshWeatherButton.addEventListener("click", async () => {
    elements.outfitDate.value = formatDateInput(new Date());
    await loadWeatherDefaultsForSelection(true);
  });

  elements.outfitDate.addEventListener("change", async () => {
    await loadWeatherDefaultsForSelection(true);
  });

  elements.plannerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    generateRecommendation(getPlannerState(new FormData(event.currentTarget)));
  });

  elements.typeSelect.addEventListener("change", (event) => {
    updateStyleOptions(event.target.value);
    syncConditionalFields();
  });

  elements.styleSelect.addEventListener("change", syncConditionalFields);
  elements.colorSelect.addEventListener("change", syncConditionalFields);
  elements.toggleTuckButton.addEventListener("click", () => {
    state.mannequinControls.tuckedIn = !state.mannequinControls.tuckedIn;
    generateRecommendation(getPlannerState());
  });
  elements.toggleJacketButton.addEventListener("click", () => {
    state.mannequinControls.jacketClosed = !state.mannequinControls.jacketClosed;
    generateRecommendation(getPlannerState());
  });

  elements.closetForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const item = buildClosetItem(formData);
    if (!item) return;

    state.closet.unshift({
      id: crypto.randomUUID(),
      ...item,
    });

    persistCollection(STORAGE_KEYS.closet, state.closet);
    event.currentTarget.reset();
    elements.typeSelect.selectedIndex = 0;
    elements.colorSelect.selectedIndex = 0;
    updateStyleOptions(elements.typeSelect.value);
    syncConditionalFields();
    populateClosetFilter();
    renderCloset();
    generateRecommendation(getPlannerState());
  });

  elements.closetFilter.addEventListener("change", renderCloset);
  elements.closetFavoriteFilter.addEventListener("click", () => {
    const favoritesOnly = elements.closetFavoriteFilter.dataset.mode === "favorites";
    setClosetFavoriteFilter(favoritesOnly ? "all" : "favorites");
    renderCloset();
  });

  elements.profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.profile = Object.fromEntries(new FormData(event.currentTarget).entries());
    persistObject(STORAGE_KEYS.profile, state.profile);
    renderProfile();
    generateRecommendation(getPlannerState());
  });

  elements.resetProfileButton.addEventListener("click", async () => {
    state.profile = { ...defaultProfile };
    state.closet = [];
    state.favoriteOutfits = [];
    state.currentRecommendation = null;
    state.mannequinControls = {
      tuckedIn: false,
      jacketClosed: false,
    };
    state.weatherLocation = null;

    persistObject(STORAGE_KEYS.profile, state.profile);
    persistCollection(STORAGE_KEYS.closet, state.closet);
    persistCollection(STORAGE_KEYS.favoriteOutfits, state.favoriteOutfits);
    localStorage.removeItem(STORAGE_KEYS.lastLocation);

    elements.profileForm.reset();
    elements.closetForm.reset();
    elements.typeSelect.selectedIndex = 0;
    elements.colorSelect.selectedIndex = 0;
    elements.stylePreferenceSelect.value = defaultProfile.profileStyle;
    setClosetFavoriteFilter("all");
    populateOutfitDate();
    updateStyleOptions(elements.typeSelect.value);
    syncConditionalFields();
    populateClosetFilter();
    renderProfile();
    renderCloset();
    generateRecommendation(getPlannerState());
    await loadWeatherDefaultsForSelection(false);
  });

  elements.favoriteOutfitButton.addEventListener("click", () => {
    toggleFavoriteCurrentOutfit();
  });
}

function setActiveSection(sectionId) {
  elements.sections.forEach((section) => {
    section.classList.toggle("is-active", section.id === sectionId);
  });

  elements.navButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.section === sectionId);
  });

  document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function populateSeasonOptions() {
  const detectedSeason = detectSeason(new Date());
  elements.season.innerHTML = "";
  seasonOptions.forEach((season) => {
    const option = document.createElement("option");
    option.value = season;
    option.textContent = season;
    option.selected = season === detectedSeason;
    elements.season.append(option);
  });
}

function populateStyleDirectionOptions() {
  populateSelectOptions(elements.stylePreferenceSelect, styleDirectionOptions);
  populateSelectOptions(elements.profileStyleSelect, styleDirectionOptions);
  elements.stylePreferenceSelect.value = defaultProfile.profileStyle;
}

function populateSelectOptions(selectElement, options) {
  selectElement.innerHTML = "";
  options.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    selectElement.append(option);
  });
}

function populateOutfitDate() {
  const today = new Date();
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 5);
  elements.outfitDate.value = formatDateInput(today);
  elements.outfitDate.min = formatDateInput(today);
  elements.outfitDate.max = formatDateInput(maxDate);
}

async function loadCurrentWeatherDefaults(triggeredManually = false) {
  return loadWeatherDefaultsForSelection(triggeredManually);
}

async function loadWeatherDefaultsForSelection(triggeredManually = false) {
  if (!("geolocation" in navigator)) {
    elements.weatherStatus.textContent = "Location access is not supported in this browser, so QuickFit is using manual defaults.";
    return;
  }

  elements.refreshWeatherButton.disabled = true;
  elements.outfitDate.disabled = true;
  const selectedDate = parseSelectedDate();
  elements.weatherStatus.textContent = triggeredManually
    ? `Loading weather for ${formatDisplayDate(selectedDate)} in your current location.`
    : "Checking your local weather for the default planner values.";

  try {
    const position = await getCurrentPosition();
    const location = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    state.weatherLocation = location;
    persistObject(STORAGE_KEYS.lastLocation, location);

    if (isToday(selectedDate)) {
      const [weatherData, forecastData] = await Promise.all([
        fetchCurrentWeather(location.latitude, location.longitude),
        fetchForecastWeather(location.latitude, location.longitude),
      ]);
      applyCurrentWeatherDefaults(weatherData, forecastData, selectedDate);
    } else {
      const forecastData = await fetchForecastWeather(location.latitude, location.longitude);
      applyForecastWeatherDefaults(forecastData, selectedDate);
    }
  } catch (error) {
    const cachedLocation = loadObject(STORAGE_KEYS.lastLocation, null);
    if (error?.code === 3 && cachedLocation?.latitude && cachedLocation?.longitude) {
      state.weatherLocation = cachedLocation;
      elements.weatherStatus.textContent = `Location lookup timed out, so QuickFit is using your last saved location for ${formatDisplayDate(selectedDate)}.`;

      try {
        if (isToday(selectedDate)) {
          const [weatherData, forecastData] = await Promise.all([
            fetchCurrentWeather(cachedLocation.latitude, cachedLocation.longitude),
            fetchForecastWeather(cachedLocation.latitude, cachedLocation.longitude),
          ]);
          applyCurrentWeatherDefaults(weatherData, forecastData, selectedDate);
        } else {
          const forecastData = await fetchForecastWeather(cachedLocation.latitude, cachedLocation.longitude);
          applyForecastWeatherDefaults(forecastData, selectedDate);
        }
        return;
      } catch (cachedLocationError) {
        elements.weatherStatus.textContent = buildWeatherErrorMessage(cachedLocationError);
      }
    } else {
      elements.weatherStatus.textContent = buildWeatherErrorMessage(error);
    }
  } finally {
    elements.refreshWeatherButton.disabled = false;
    elements.outfitDate.disabled = false;
  }
}

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

function parseSelectedDate() {
  if (!elements.outfitDate.value) return new Date();
  return new Date(`${elements.outfitDate.value}T12:00:00`);
}

function isToday(date) {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date) {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function populateTypeOptions() {
  Object.keys(clothingStyles).forEach((type, index) => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    option.selected = index === 0;
    elements.typeSelect.append(option);
  });
}

function populateColorOptions() {
  colorOptions.forEach((color, index) => {
    const option = document.createElement("option");
    option.value = color;
    option.textContent = color;
    option.selected = index === 0;
    elements.colorSelect.append(option);
  });
}

function updateStyleOptions(type) {
  elements.styleSelect.innerHTML = "";
  clothingStyles[type].forEach((style, index) => {
    const option = document.createElement("option");
    option.value = style;
    option.textContent = style;
    option.selected = index === 0;
    elements.styleSelect.append(option);
  });
}

function syncConditionalFields() {
  const showCustomColor = elements.colorSelect.value === "Multicolor";
  const showJewelrySubtype =
    elements.typeSelect.value === "Accessories" && elements.styleSelect.value === "Jewelry";
  const showSkirtLength = elements.typeSelect.value === "Skirts";
  const sleevelessShirtStyles = new Set(["Tank top", "Sleeveless shirt", "Sports bra", "Tube top"]);
  const showSleeveLength =
    elements.typeSelect.value === "Shirts" && !sleevelessShirtStyles.has(elements.styleSelect.value);

  elements.customColorField.classList.toggle("is-hidden", !showCustomColor);
  elements.customColorInput.required = showCustomColor;
  if (!showCustomColor) elements.customColorInput.value = "";

  elements.jewelryField.classList.toggle("is-hidden", !showJewelrySubtype);
  elements.jewelryTypeSelect.required = showJewelrySubtype;
  if (!showJewelrySubtype) elements.jewelryTypeSelect.value = "";

  elements.skirtLengthField.classList.toggle("is-hidden", !showSkirtLength);
  elements.skirtLengthSelect.required = showSkirtLength;
  if (!showSkirtLength) elements.skirtLengthSelect.value = "";

  elements.sleeveLengthField.classList.toggle("is-hidden", !showSleeveLength);
  elements.sleeveLengthSelect.required = showSleeveLength;
  if (!showSleeveLength) elements.sleeveLengthSelect.value = "";
}

function buildClosetItem(formData) {
  const rawItem = Object.fromEntries(formData.entries());
  const color = rawItem.color === "Multicolor" ? rawItem.customColor.trim() || "Multicolor" : rawItem.color;

  if (!color) return null;

  return {
    name: buildAutoItemName({
      color,
      style: rawItem.style,
      jewelryType: rawItem.jewelryType || "",
    }),
    color,
    baseColor: rawItem.color,
    pattern: rawItem.pattern.trim(),
    material: rawItem.material.trim(),
    type: rawItem.type,
    style: rawItem.style,
    skirtLength: rawItem.skirtLength || "",
    sleeveLength: rawItem.sleeveLength || "",
    jewelryType: rawItem.jewelryType || "",
    theme: rawItem.theme,
    warmth: rawItem.warmth,
    isFavorite: false,
  };
}

function buildAutoItemName({ color, style, jewelryType }) {
  const styleLabel = jewelryType || style;
  return `${color} ${styleLabel}`
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function populateClosetFilter() {
  const currentValue = elements.closetFilter.value || "all";
  elements.closetFilter.innerHTML = '<option value="all">All items</option>';

  Object.keys(clothingStyles).forEach((type) => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    option.selected = currentValue === type;
    elements.closetFilter.append(option);
  });
}

function renderCloset() {
  const filterValue = elements.closetFilter.value;
  const favoriteFilterValue = elements.closetFavoriteFilter.dataset.mode || "all";
  let filteredItems = filterValue === "all"
    ? state.closet
    : state.closet.filter((item) => item.type === filterValue);

  if (favoriteFilterValue === "favorites") {
    filteredItems = filteredItems.filter((item) => item.isFavorite);
  }

  if (!filteredItems.length) {
    elements.closetList.innerHTML = `
      <div class="empty-state">
        Closet is empty, add a piece of clothing to get started.
      </div>
    `;
    return;
  }

  elements.closetList.innerHTML = "";

  filteredItems.forEach((item) => {
    const materialLabel = item.material ? item.material : "Material not specified";
    const patternLabel = item.pattern ? `${item.pattern} ` : "";
    const detailLine = `${item.color} ${patternLabel}${describeStyle(item).toLowerCase()}${item.material ? ` in ${item.material.toLowerCase()}` : ""}`;
    const card = document.createElement("article");
    card.className = "closet-card fade-in";
    card.innerHTML = `
      <div class="closet-card__header">
        <div>
          <div class="closet-card__title">${item.name}</div>
          <p>${detailLine}</p>
        </div>
        <div class="closet-card__actions">
          <button
            class="favorite-toggle ${item.isFavorite ? "is-active" : ""}"
            data-favorite-id="${item.id}"
            type="button"
            aria-pressed="${item.isFavorite ? "true" : "false"}"
          >
            ${item.isFavorite ? "♥" : "♡"}
          </button>
          <button class="closet-card__delete" data-delete-id="${item.id}" type="button">Remove</button>
        </div>
      </div>
      <div class="closet-card__meta">
        <span class="tag">${item.type}</span>
        <span class="tag">${describeStyle(item)}</span>
        ${item.pattern ? `<span class="tag">${item.pattern} pattern</span>` : ""}
        ${item.skirtLength ? `<span class="tag">${item.skirtLength} length</span>` : ""}
        ${item.sleeveLength ? `<span class="tag">${item.sleeveLength}</span>` : ""}
        <span class="tag">${item.theme}</span>
        <span class="tag">${capitalize(item.warmth)} warmth</span>
        <span class="tag">${materialLabel}</span>
      </div>
    `;

    card.querySelector("[data-delete-id]")?.addEventListener("click", () => {
      state.closet = state.closet.filter((entry) => entry.id !== item.id);
      persistCollection(STORAGE_KEYS.closet, state.closet);
      renderCloset();
      renderSavedOutfits();
      generateRecommendation(getPlannerState());
    });

    card.querySelector("[data-favorite-id]")?.addEventListener("click", () => {
      state.closet = state.closet.map((entry) => (
        entry.id === item.id ? { ...entry, isFavorite: !entry.isFavorite } : entry
      ));
      persistCollection(STORAGE_KEYS.closet, state.closet);
      renderCloset();
    });

    elements.closetList.append(card);
  });
}

function setClosetFavoriteFilter(mode) {
  const favoritesOnly = mode === "favorites";
  elements.closetFavoriteFilter.dataset.mode = mode;
  elements.closetFavoriteFilter.classList.toggle("is-active", favoritesOnly);
  elements.closetFavoriteFilter.setAttribute("aria-pressed", favoritesOnly ? "true" : "false");
  elements.closetFavoriteFilter.textContent = favoritesOnly
    ? "Showing Favorites Only"
    : "Show Favorites Only";
}

function renderProfile() {
  const normalizedProfile = normalizeProfile(state.profile);
  state.profile = normalizedProfile;
  const { temperatureBias, profileStyle, presentation } = normalizedProfile;
  const summaryItems = [
    `Temperature preference: ${formatLabel(temperatureBias)}`,
    `Style direction: ${profileStyle}`,
    `Presentation preference: ${presentation}`,
  ];

  elements.profileSummary.innerHTML = summaryItems
    .map((item) => `<div class="profile-summary__item">${item}</div>`)
    .join("");

  elements.profileForm.temperatureBias.value = temperatureBias;
  elements.profileForm.profileStyle.value = profileStyle;
  elements.profileForm.presentation.value = presentation;
  updateMannequinPresentation(presentation);
  renderSavedOutfits();
}

function updateMannequinPresentation(presentation) {
  const silhouetteSource = presentation === "Feminine"
    ? mannequinSources.feminine
    : mannequinSources.default;

  elements.mannequinSilhouette.src = silhouetteSource;
  elements.mannequinShell.style.setProperty("--mannequin-mask", `url("${silhouetteSource}")`);
}

function generateRecommendation({ temperature, weather, season, theme, stylePreference }) {
  const effectiveTemperature = applyTemperatureBias(temperature, state.profile.temperatureBias);
  const topItem = chooseItem("top", { effectiveTemperature, theme, stylePreference });
  const bottomItem = chooseItem("bottom", { effectiveTemperature, theme, stylePreference });
  const layerItem = chooseItem("jacket", { effectiveTemperature, theme, stylePreference, weather });
  const accessoryItems = chooseAccessoryItems({ effectiveTemperature, theme, stylePreference, weather });
  const shoesItem = chooseItem("shoes", { effectiveTemperature, theme, stylePreference, weather });
  const layerAndAccessoryDescriptions = [layerItem, ...accessoryItems].filter(Boolean).map(describeItem);

  elements.weatherSummary.textContent = `${temperature}°F · ${capitalize(weather)} · ${season}`;
  elements.topRecommendation.textContent = topItem
    ? describeItem(topItem)
    : "Closet is empty, add a piece of clothing to get started.";
  elements.bottomRecommendation.textContent = bottomItem
    ? describeItem(bottomItem)
    : "Once you add clothes, QuickFit will suggest bottoms here.";
  elements.layerRecommendation.textContent = layerItem
    ? layerAndAccessoryDescriptions.join(" ")
    : accessoryItems.length
      ? layerAndAccessoryDescriptions.join(" ")
    : "Layers and accessories will appear here after you build your closet.";
  elements.shoesRecommendation.textContent = shoesItem
    ? describeItem(shoesItem)
    : "Shoes will appear here after you add them to your closet.";

  state.currentRecommendation = {
    planner: { temperature, weather, season, theme, stylePreference, outfitDate: elements.outfitDate.value },
    topItemId: topItem?.id || null,
    bottomItemId: bottomItem?.id || null,
    layerItemId: layerItem?.id || null,
    accessoryItemIds: accessoryItems.map((item) => item.id),
    shoesItemId: shoesItem?.id || null,
    tuckedIn: state.mannequinControls.tuckedIn,
    jacketClosed: state.mannequinControls.jacketClosed,
  };

  applyMannequinStyles(topItem, bottomItem, layerItem, shoesItem, effectiveTemperature, accessoryItems);
  syncFavoriteOutfitButton();
  elements.rationale.textContent = buildRationale({
    temperature,
    effectiveTemperature,
    weather,
    season,
    theme,
    stylePreference,
    topItem,
    bottomItem,
    layerItem,
    accessoryItems,
    shoesItem,
  });
}

function toggleFavoriteCurrentOutfit() {
  const recommendation = state.currentRecommendation;
  if (!recommendation || (!recommendation.topItemId && !recommendation.bottomItemId && !recommendation.layerItemId && !recommendation.accessoryItemIds?.length && !recommendation.shoesItemId)) {
    return;
  }

  const existingIndex = state.favoriteOutfits.findIndex((outfit) => isSameSavedOutfit(outfit, recommendation));

  if (existingIndex >= 0) {
    state.favoriteOutfits.splice(existingIndex, 1);
  } else {
    state.favoriteOutfits.unshift({
      id: crypto.randomUUID(),
      planner: recommendation.planner,
      topItemId: recommendation.topItemId,
      bottomItemId: recommendation.bottomItemId,
      layerItemId: recommendation.layerItemId,
      accessoryItemIds: recommendation.accessoryItemIds || [],
      shoesItemId: recommendation.shoesItemId,
      tuckedIn: recommendation.tuckedIn,
      jacketClosed: recommendation.jacketClosed,
      createdAt: new Date().toISOString(),
    });
  }

  persistCollection(STORAGE_KEYS.favoriteOutfits, state.favoriteOutfits);
  syncFavoriteOutfitButton();
  renderSavedOutfits();
}

function syncFavoriteOutfitButton() {
  const recommendation = state.currentRecommendation;
  const canSave = recommendation && (
    recommendation.topItemId ||
    recommendation.bottomItemId ||
    recommendation.layerItemId ||
    recommendation.accessoryItemIds?.length
  );
  const isSaved = canSave && state.favoriteOutfits.some((outfit) => isSameSavedOutfit(outfit, recommendation));

  elements.favoriteOutfitButton.disabled = !canSave;
  elements.favoriteOutfitButton.classList.toggle("is-active", Boolean(isSaved));
  elements.favoriteOutfitButton.setAttribute("aria-pressed", isSaved ? "true" : "false");
  elements.favoriteOutfitButton.textContent = isSaved ? "♥ Saved Outfit" : "♡ Save This Outfit";
}

function isSameSavedOutfit(savedOutfit, recommendation) {
  return (
      savedOutfit.topItemId === recommendation.topItemId &&
      savedOutfit.bottomItemId === recommendation.bottomItemId &&
      savedOutfit.layerItemId === recommendation.layerItemId &&
      areSameIdLists(savedOutfit.accessoryItemIds || [], recommendation.accessoryItemIds || []) &&
      savedOutfit.shoesItemId === recommendation.shoesItemId &&
      savedOutfit.planner.theme === recommendation.planner.theme &&
      savedOutfit.planner.stylePreference === recommendation.planner.stylePreference &&
      Boolean(savedOutfit.tuckedIn) === Boolean(recommendation.tuckedIn) &&
      Boolean(savedOutfit.jacketClosed) === Boolean(recommendation.jacketClosed)
  );
}

function areSameIdLists(firstIds, secondIds) {
  if (firstIds.length !== secondIds.length) return false;
  const sortedFirst = [...firstIds].sort();
  const sortedSecond = [...secondIds].sort();
  return sortedFirst.every((id, index) => id === sortedSecond[index]);
}

function renderSavedOutfits() {
  if (!state.favoriteOutfits.length) {
    elements.savedOutfitsList.innerHTML = `
      <div class="empty-state">
        Save an outfit from the planner to build your personal favorites list.
      </div>
    `;
    return;
  }

  elements.savedOutfitsList.innerHTML = "";

  state.favoriteOutfits.forEach((outfit) => {
    const card = document.createElement("article");
    card.className = "saved-outfit-card";
    const topItem = findClosetItem(outfit.topItemId);
    const bottomItem = findClosetItem(outfit.bottomItemId);
    const layerItem = findClosetItem(outfit.layerItemId);
    const accessoryItems = (outfit.accessoryItemIds || []).map(findClosetItem).filter(Boolean);
    const shoesItem = findClosetItem(outfit.shoesItemId);
    const itemLabels = [topItem?.name, bottomItem?.name, layerItem?.name, ...accessoryItems.map((item) => item.name), shoesItem?.name].filter(Boolean).join(" · ");

    card.innerHTML = `
      <strong>${outfit.planner.theme} · ${outfit.planner.stylePreference}</strong>
      <div class="saved-outfit-card__items">${itemLabels || "Some saved items are no longer in the closet."}</div>
      <div class="saved-outfit-card__actions">
        <button class="button button--ghost button--small" type="button" data-load-outfit="${outfit.id}">Load Outfit</button>
        <button class="button button--ghost button--small" type="button" data-remove-outfit="${outfit.id}">Remove</button>
      </div>
    `;

    card.querySelector("[data-load-outfit]")?.addEventListener("click", () => {
      loadSavedOutfit(outfit.id);
    });

    card.querySelector("[data-remove-outfit]")?.addEventListener("click", () => {
      state.favoriteOutfits = state.favoriteOutfits.filter((entry) => entry.id !== outfit.id);
      persistCollection(STORAGE_KEYS.favoriteOutfits, state.favoriteOutfits);
      renderSavedOutfits();
      syncFavoriteOutfitButton();
    });

    elements.savedOutfitsList.append(card);
  });
}

function loadSavedOutfit(outfitId) {
  const savedOutfit = state.favoriteOutfits.find((outfit) => outfit.id === outfitId);
  if (!savedOutfit) return;

  elements.outfitDate.value = savedOutfit.planner.outfitDate || elements.outfitDate.value;
  elements.temperature.value = String(savedOutfit.planner.temperature);
  elements.temperatureValue.textContent = `${savedOutfit.planner.temperature}°F`;
  elements.weatherSelect.value = savedOutfit.planner.weather;
  elements.season.value = savedOutfit.planner.season;
  document.querySelector("#theme").value = savedOutfit.planner.theme;
  elements.stylePreferenceSelect.value = savedOutfit.planner.stylePreference;
  state.mannequinControls.tuckedIn = Boolean(savedOutfit.tuckedIn);
  state.mannequinControls.jacketClosed = Boolean(savedOutfit.jacketClosed);
  generateRecommendation(savedOutfit.planner);
  setActiveSection("planner");
}

function findClosetItem(itemId) {
  return state.closet.find((item) => item.id === itemId) || null;
}

function chooseItem(group, context) {
  const allowedTypes = typeGroups[group];
  const typedItems = state.closet.filter((item) => allowedTypes.includes(item.type));
  const exactTheme = typedItems.filter((item) => item.theme === context.theme);
  const themePool = exactTheme.length ? exactTheme : typedItems;
  const warmthTarget = desiredWarmth(context.effectiveTemperature, group, context.weather);
  const warmthMatches = themePool.filter((item) => item.warmth === warmthTarget);
  const warmthPool = warmthMatches.length ? warmthMatches : themePool;
  const styleMatches = warmthPool.filter((item) => {
    const descriptor = `${item.name} ${describeStyle(item)}`.toLowerCase();
    return descriptor.includes(context.stylePreference.toLowerCase());
  });
  const finalPool = [
    ...styleMatches,
    ...warmthPool.filter((item) => !styleMatches.includes(item)),
  ];
  return finalPool[0] || null;
}

function chooseAccessoryItems(context) {
  const allowedTypes = typeGroups.accessories;
  const typedItems = state.closet.filter((item) => allowedTypes.includes(item.type));
  const exactTheme = typedItems.filter((item) => item.theme === context.theme);
  const themePool = exactTheme.length ? exactTheme : typedItems;
  const warmthTarget = desiredWarmth(context.effectiveTemperature, "layer", context.weather);
  const warmthMatches = themePool.filter((item) => item.warmth === warmthTarget);
  const warmthPool = warmthMatches.length ? warmthMatches : themePool;
  const styleMatches = warmthPool.filter((item) => {
    const descriptor = `${item.name} ${describeStyle(item)}`.toLowerCase();
    return descriptor.includes(context.stylePreference.toLowerCase());
  });
  const finalPool = [
    ...styleMatches,
    ...warmthPool.filter((item) => !styleMatches.includes(item)),
  ];
  const accessoriesByStyle = new Map();

  finalPool.forEach((item) => {
    if (!accessoriesByStyle.has(item.style)) {
      accessoriesByStyle.set(item.style, item);
    }
  });

  return [...accessoriesByStyle.values()];
}

function desiredWarmth(temperature, group, weather) {
  if (group === "shoes") {
    if (weather === "rainy" || weather === "snowy") return "heavy";
    if (temperature <= 55) return "medium";
    return "light";
  }

  if (group === "layer") {
    if (temperature <= 50 || weather === "rainy" || weather === "snowy") return "heavy";
    if (temperature <= 68 || weather === "windy") return "medium";
    return "light";
  }

  if (temperature <= 45) return "heavy";
  if (temperature <= 70) return "medium";
  return "light";
}

function applyMannequinStyles(topItem, bottomItem, layerItem, shoesItem, effectiveTemperature, accessoryItems = []) {
  const jumpsuitActive = Boolean(bottomItem) && bottomItem.style === "Jumpsuit";
  const overallsActive = Boolean(bottomItem) && bottomItem.style === "Overalls";
  const sortedAccessoryItems = sortAccessoryItemsForRendering(accessoryItems);
  setMannequinGarment(
    elements.mannequinTop,
    jumpsuitActive
      ? ""
      : renderTopSvg(
        topItem,
        state.mannequinControls,
        state.profile.presentation,
        overallsActive ? "sleeves-only" : "full",
      ),
  );
  setMannequinGarment(
    elements.mannequinBottom,
    renderBottomSvg(bottomItem, state.mannequinControls, effectiveTemperature, state.profile.presentation),
  );
  setMannequinGarment(
    elements.mannequinLayer,
    `${renderLayerSvg(layerItem, state.mannequinControls)}${sortedAccessoryItems.map(renderAccessorySvg).join("")}`,
  );
  setMannequinGarment(elements.mannequinShoes, renderShoesSvg(shoesItem, state.profile.presentation));
  syncMannequinButtons(topItem, bottomItem, layerItem);
}

function sortAccessoryItemsForRendering(accessoryItems) {
  const renderOrder = {
    Hat: 0,
    Scarf: 1,
    Sunglasses: 2,
  };

  return [...accessoryItems].sort((firstItem, secondItem) => (
    (renderOrder[firstItem.style] ?? 10) - (renderOrder[secondItem.style] ?? 10)
  ));
}

function setMannequinGarment(element, svgMarkup) {
  element.innerHTML = svgMarkup || "";
  element.style.opacity = svgMarkup ? "1" : "0";
  element.style.display = svgMarkup ? "block" : "none";
}

function syncMannequinButtons(topItem, bottomItem, layerItem) {
  const onePieceBottom = Boolean(bottomItem) && ["Overalls", "Jumpsuit"].includes(bottomItem.style);
  const tuckable = Boolean(topItem) && !onePieceBottom && !["Sports bra"].includes(topItem.style);
  elements.toggleTuckButton.disabled = !tuckable;
  elements.toggleTuckButton.textContent = state.mannequinControls.tuckedIn ? "Untuck" : "Tuck";
  elements.toggleTuckButton.setAttribute("aria-pressed", state.mannequinControls.tuckedIn ? "true" : "false");

  const jacketPresent = Boolean(layerItem) && layerItem.type === "Jackets";
  elements.toggleJacketButton.disabled = !jacketPresent;
  elements.toggleJacketButton.textContent = state.mannequinControls.jacketClosed ? "Open Jacket" : "Close Jacket";
  elements.toggleJacketButton.setAttribute("aria-pressed", state.mannequinControls.jacketClosed ? "true" : "false");
}

function renderTopSvg(item, controls, presentation = "Unspecified", mode = "full") {
  if (!item) return "";

  const fill = colorForItem(item.color, "#7fb28a");
  const stroke = accentColor(fill);
  const tucked = controls.tuckedIn;
  const silhouette = resolveTopSilhouette(item);
  const feminine = presentation === "Feminine";
  const isButtonUp = item.style === "Button Up";
  const isTurtleneckSilhouette = silhouette.includes("turtleneck");
  const hemMap = {
    "short-sleeve": tucked ? 165 : (feminine ? 180 : 180),
    "long-sleeve": tucked ? 160 : (feminine ? 180 : 180),
    "short-sleeve-turtleneck": tucked ? 168 : (feminine ? 200 : 212),
    "long-sleeve-turtleneck": tucked ? 168 : (feminine ? 198 : 210),
    "tube-top": tucked ? (feminine ? 195 : 164) : 176,
    "tank-top": tucked ? (feminine ? 164 : 170) : (feminine ? 184 : 190),
  };
  const hemY = isButtonUp ? (tucked ? 172 : 204) : hemMap[silhouette];
  const masculineUntuckedShortSleeve = !feminine && !tucked && silhouette === "short-sleeve";

  if (silhouette === "tube-top") {
    return `<svg viewBox="0 0 176 420" aria-hidden="true">
      <rect
        x="${feminine ? 58 : 54}"
        y="108"
        width="${feminine ? 60 : 68}"
        height="${hemY - 108}"
        rx="6"
        fill="${fill}"
        stroke="${stroke}"
        stroke-width="2"
      />
    </svg>`;
  }

  if (silhouette === "tank-top") {
    const tankBodyY = feminine ? 106 : 108;
    const tankStrapY = feminine ? 82 : 78;
    const tankStrapHeight = feminine ? 28 : 32;
    return `<svg viewBox="0 0 176 420" aria-hidden="true">
      <rect
        x="${feminine ? 58 : 54}"
        y="${tankBodyY}"
        width="${feminine ? 60 : 68}"
        height="${hemY - tankBodyY}"
        rx="6"
        fill="${fill}"
        stroke="${stroke}"
        stroke-width="2"
      />
      <rect
        x="${feminine ? 62 : 60}"
        y="${tankStrapY}"
        width="${feminine ? 8 : 9}"
        height="${tankStrapHeight}"
        rx="4"
        fill="${fill}"
        stroke="${stroke}"
        stroke-width="2"
      />
      <rect
        x="${feminine ? 106 : 107}"
        y="${tankStrapY}"
        width="${feminine ? 8 : 9}"
        height="${tankStrapHeight}"
        rx="4"
        fill="${fill}"
        stroke="${stroke}"
        stroke-width="2"
      />
    </svg>`;
  }

  const feminineTuckedShortSleeve = feminine && tucked && silhouette === "short-sleeve";
  const body = feminine
    ? (isTurtleneckSilhouette
      ? `<path d="M44 78 C58 66, 76 66, 88 78 C100 66, 118 66, 132 78 L126 ${hemY} C112 ${hemY + 2}, 64 ${hemY + 2}, 50 ${hemY} Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`
      : isButtonUp
      ? (tucked
        ? `<path d="M50 82 C60 70, 76 70, 88 82 C100 70, 116 70, 126 82 L120 ${hemY} C108 ${hemY + 2}, 68 ${hemY + 2}, 56 ${hemY} Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`
        : `<path d="M44 82 C58 70, 76 70, 88 82 C100 70, 118 70, 132 82 L126 ${hemY} C112 ${hemY + 2}, 64 ${hemY + 2}, 50 ${hemY} Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`)
      : feminineTuckedShortSleeve
      ? `<path d="M51 80 C61 68, 76 68, 88 80 C100 68, 115 68, 125 80 L115 ${hemY} C105 ${hemY + 2}, 71 ${hemY + 2}, 61 ${hemY} Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`
      : `<path d="M51 80 C61 68, 76 68, 88 80 C100 68, 115 68, 125 80 L117 ${hemY} C107 ${hemY + 2}, 69 ${hemY + 2}, 59 ${hemY} Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`)
    : (isTurtleneckSilhouette
      ? `<path d="M46 84 L64 72 L78 72 L78 76 L83 84 L93 84 L98 76 L98 72 L112 72 L130 84 L124 ${hemY} C110 ${hemY + 2}, 66 ${hemY + 2}, 52 ${hemY} Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`
      : isButtonUp
      ? (tucked
        ? `<path d="M50 84 L66 72 L78 72 L78 76 L83 84 L93 84 L98 76 L98 72 L110 72 L126 84 L120 ${hemY} C108 ${hemY + 2}, 68 ${hemY + 2}, 56 ${hemY} Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`
        : `<path d="M44 84 L62 72 L78 72 L78 76 L83 84 L93 84 L98 76 L98 72 L114 72 L132 84 L126 ${hemY} C112 ${hemY + 2}, 64 ${hemY + 2}, 50 ${hemY} Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`)
      : masculineUntuckedShortSleeve
      ? `<path d="M50 86 L66 74 L76 74 L76 78 L82 86 L94 86 L100 78 L100 74 L110 74 L126 86 L120 ${hemY + 12} C108 ${hemY + 14}, 68 ${hemY + 14}, 56 ${hemY + 12} Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`
      : `<path d="M54 86 L68 74 L78 74 L78 78 L83 86 L93 86 L98 78 L98 74 L108 74 L122 86 L116 ${hemY} C106 ${hemY + 2}, 70 ${hemY + 2}, 60 ${hemY} Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`);
  let sleeves = "";
  let collar = "";
  let trim = "";

  if (silhouette === "short-sleeve" || silhouette === "short-sleeve-turtleneck") {
    sleeves = `
      <path d="M${feminine ? 55 : 58} 74 L${feminine ? 35 : 35} 84 L${feminine ? 31 : 30} 132 L${feminine ? 57 : 60} 134 L${feminine ? 67 : 68} 89 Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <path d="M${feminine ? 121 : 118} 74 L${feminine ? 141 : 140} 84 L${feminine ? 145 : 145} 132 L${feminine ? 119 : 116} 134 L${feminine ? 109 : 108} 89 Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
    `;
  } else {
    const shoulderY = feminine ? 84 : 83;
    const leftOuterShoulderX = feminine ? 41 : 34;
    const leftInnerShoulderX = feminine ? 60 : 68;
    const leftOuterCuffX = feminine ? 29 : 22;
    const leftInnerCuffX = feminine ? 48 : 44;
    const rightOuterShoulderX = feminine ? 135 : 142;
    const rightInnerShoulderX = feminine ? 116 : 108;
    const rightOuterCuffX = feminine ? 147 : 154;
    const rightInnerCuffX = feminine ? 128 : 132;
    const cuffY = feminine ? 210 : 216;
    const elbowY = feminine ? 146 : 154;
    sleeves = `
      <path d="M58 88 Q51 80 ${leftOuterShoulderX} ${shoulderY} L${leftOuterCuffX} ${cuffY} L${leftInnerCuffX} ${cuffY} L${leftInnerShoulderX} ${elbowY} Q64 100 58 88 Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <path d="M118 88 Q125 80 ${rightOuterShoulderX} ${shoulderY} L${rightOuterCuffX} ${cuffY} L${rightInnerCuffX} ${cuffY} L${rightInnerShoulderX} ${elbowY} Q112 100 118 88 Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
    `;
  }

  if (silhouette === "long-sleeve-turtleneck" || silhouette === "short-sleeve-turtleneck") {
    collar = `<rect x="73" y="66" width="30" height="20" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  } else {
    collar = silhouette === "short-sleeve"
      ? (feminine
        ? `<path d="M75 80 Q88 98 101 80" fill="none" stroke="${stroke}" stroke-width="2"/>`
        : `<path d="M76 76 L76 82 L82 88 L94 88 L100 82 L100 76" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`)
      : feminine
        ? `<path d="M75 86 Q88 104 101 86" fill="none" stroke="${stroke}" stroke-width="2"/>`
        : `<path d="M76 82 L76 88 L82 94 L94 94 L100 88 L100 82" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  if (!feminine && !silhouette.includes("turtleneck")) {
    collar = `<path d="M74 82 L76 88 L82 92 L94 92 L100 88 L102 82" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  if (isButtonUp) {
    collar = `
      <path d="M70 72 L86 72 L83 92 L66 86 Z" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M90 72 L106 72 L110 86 L93 92 Z" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M82 74 L88 92 L94 74" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    `;
    trim = `
      <path d="M88 78 L88 ${hemY}" stroke="${stroke}" stroke-width="2"/>
      <circle cx="88" cy="96" r="2.25" fill="${stroke}"/>
      <circle cx="88" cy="114" r="2.25" fill="${stroke}"/>
      <circle cx="88" cy="132" r="2.25" fill="${stroke}"/>
      <circle cx="88" cy="150" r="2.25" fill="${stroke}"/>
    `;
  }

  const showBody = mode !== "sleeves-only";
  const bodyMarkup = showBody ? body : "";
  const collarMarkup = showBody ? collar : "";
  const trimMarkup = showBody ? trim : "";

  return `<svg viewBox="0 0 176 420" aria-hidden="true">${sleeves}${bodyMarkup}${collarMarkup}${trimMarkup}</svg>`;
}

function resolveTopSilhouette(item) {
  if (item.style === "Tube top") return "tube-top";
  if (item.style === "Tank top" || item.style === "Sleeveless shirt" || item.style === "Sports bra") {
    return "tank-top";
  }

  const shirtDefaultSleeve = item.style === "Blouse" || item.style === "Button Up" ? "Long sleeve" : "Short sleeve";
  const sleeveLength = item.sleeveLength || shirtDefaultSleeve;
  const isTurtleneck = item.style === "Turtleneck";
  const isLongSleeve = item.type === "Sweaters" || sleeveLength === "Long sleeve";

  if (isTurtleneck) {
    return isLongSleeve ? "long-sleeve-turtleneck" : "short-sleeve-turtleneck";
  }

  return isLongSleeve ? "long-sleeve" : "short-sleeve";
}

function renderBottomSvg(item, controls, effectiveTemperature, presentation = "Unspecified") {
  if (!item) return "";

  const fill = colorForItem(item.color, "#b8d8c2");
  const stroke = accentColor(fill);
  const ignoresTuck = item.type === "Pants" && ["Overalls", "Jumpsuit"].includes(item.style);
  const tucked = ignoresTuck ? false : controls.tuckedIn;
  const waistY = item.type === "Pants"
    ? (tucked ? 165 : 180)
    : item.type === "Shorts"
      ? (tucked ? 160 : 176)
    : item.type === "Skirts"
      ? 164
    : (tucked ? 190 : 210);

  if (item.type === "Skirts") {
    return `<svg viewBox="0 0 176 420" aria-hidden="true">${buildSkirtSvg(item, fill, stroke, waistY)}</svg>`;
  }

  if (item.type === "Shorts") {
    return `<svg viewBox="0 0 176 420" aria-hidden="true">${buildShortsSvg(item, fill, stroke, waistY)}</svg>`;
  }

  return `<svg viewBox="0 0 176 420" aria-hidden="true">${buildPantsSvg(item, fill, stroke, waistY, effectiveTemperature, presentation)}</svg>`;
}

function renderLayerSvg(item, controls) {
  if (!item || item.type !== "Jackets") return "";

  const fill = colorForItem(item.color, "#3b3f44");
  const stroke = accentColor(fill);
  const closed = controls.jacketClosed;
  const longJacketStyles = new Set(["Parka", "Peacoat", "Overcoat", "Trench coat"]);
  const sleevelessStyles = new Set(["Vest"]);
  const isLeatherJacket = item.style === "Leather jacket";
  const isVest = item.style === "Vest";
  const isPeacoat = item.style === "Peacoat";
  const isPufferStyle = item.style === "Puffer jacket" || item.style === "Parka";
  const hemY = isLeatherJacket
    ? 212
    : isVest
      ? 232
    : (isPeacoat || isPufferStyle)
      ? (isPufferStyle ? 258 : 294)
      : (longJacketStyles.has(item.style) ? 318 : 248);
  const sleevePath = sleevelessStyles.has(item.style)
    ? ""
    : `
      <path d="${isLeatherJacket
        ? `M48 74 L28 92 L18 226 L33 226 L62 118 Z`
        : isPeacoat
          ? `M48 74 L24 88 L18 218 L39 218 L61 124 Z`
        : isPufferStyle
          ? `M42 72 L16 86 L8 222 L34 222 L59 124 Z`
        : `M57 86 L47 114 L52 ${Math.min(hemY + 24, 288)} L60 ${Math.min(hemY + 20, 284)} L67 138 Z`
      }" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <path d="${isLeatherJacket
        ? `M128 74 L148 92 L158 226 L143 226 L114 118 Z`
        : isPeacoat
          ? `M128 74 L152 88 L158 218 L137 218 L115 124 Z`
        : isPufferStyle
          ? `M134 72 L160 86 L168 222 L142 222 L117 124 Z`
        : `M119 86 L129 114 L124 ${Math.min(hemY + 24, 288)} L116 ${Math.min(hemY + 20, 284)} L109 138 Z`
      }" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
    `;

  let body = "";
  if (closed) {
    body = `<path d="${isLeatherJacket
      ? `M44 78 C58 66, 73 68, 88 82 C103 68, 118 66, 132 78 L127 ${hemY} C108 ${hemY + 7}, 68 ${hemY + 7}, 49 ${hemY} Z`
      : isVest
        ? buildVestSvg(fill, stroke, hemY)
      : isPeacoat
        ? `M46 76 C58 66, 74 66, 88 80 C102 66, 118 66, 130 76 L136 ${hemY} C114 ${hemY + 8}, 62 ${hemY + 8}, 40 ${hemY} Z`
      : isPufferStyle
        ? `M38 74 C54 62, 74 62, 88 78 C102 62, 122 62, 138 74 L144 ${hemY} C120 ${hemY + 9}, 56 ${hemY + 9}, 32 ${hemY} Z`
      : `M58 86 C64 76, 76 76, 88 90 C100 76, 112 76, 118 86 L120 ${hemY} C106 ${hemY + 6}, 70 ${hemY + 6}, 56 ${hemY} Z`
    }" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  } else {
    body = `
      <path d="${isLeatherJacket
        ? `M44 78 C56 68, 70 68, 78 92 L76 ${hemY} C66 ${hemY + 5}, 56 ${hemY + 4}, 48 ${hemY} Z`
        : isVest
          ? `M48 82 C58 72, 72 72, 82 86 L76 ${hemY} L62 ${hemY + 18} L46 ${hemY} Z`
        : isPeacoat
          ? `M46 76 C58 66, 74 66, 82 90 L78 ${hemY} C66 ${hemY + 6}, 52 ${hemY + 5}, 40 ${hemY} Z`
        : isPufferStyle
          ? `M38 74 C54 62, 74 62, 82 90 L78 ${hemY} C64 ${hemY + 8}, 48 ${hemY + 6}, 32 ${hemY} Z`
        : `M58 86 C63 78, 74 78, 82 98 L82 ${hemY} C72 ${hemY + 4}, 62 ${hemY + 3}, 56 ${hemY} Z`
      }" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <path d="${isLeatherJacket
        ? `M132 78 C120 68, 106 68, 98 92 L100 ${hemY} C110 ${hemY + 5}, 120 ${hemY + 4}, 128 ${hemY} Z`
        : isVest
          ? `M128 82 C118 72, 104 72, 94 86 L100 ${hemY} L114 ${hemY + 18} L130 ${hemY} Z`
        : isPeacoat
          ? `M130 76 C118 66, 102 66, 94 90 L98 ${hemY} C110 ${hemY + 6}, 124 ${hemY + 5}, 136 ${hemY} Z`
        : isPufferStyle
          ? `M138 74 C122 62, 102 62, 94 90 L98 ${hemY} C112 ${hemY + 8}, 128 ${hemY + 6}, 144 ${hemY} Z`
        : `M118 86 C113 78, 102 78, 94 98 L94 ${hemY} C104 ${hemY + 4}, 114 ${hemY + 3}, 120 ${hemY} Z`
      }" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
    `;
  }

  const pufferLines = isPufferStyle
    ? buildPufferLines(stroke, closed)
    : "";
  const vestDetails = isVest ? buildVestDetails(stroke, fill, hemY) : "";
  const puffLines = item.style === "Quilted jacket"
    ? Array.from({ length: 5 }, (_, index) => `<path d="M62 ${126 + index * 18} L114 ${126 + index * 18}" stroke="${stroke}" stroke-width="1.5"/>`).join("")
    : "";
  const belt = item.style === "Trench coat"
    ? `<path d="M58 188 L118 188" stroke="${stroke}" stroke-width="3"/><path d="M88 182 L88 198" stroke="${stroke}" stroke-width="2"/>`
    : "";

  return `<svg viewBox="0 0 176 420" aria-hidden="true">${sleevePath}${body}${vestDetails}${pufferLines}${puffLines}${belt}</svg>`;
}

function buildVestSvg(fill, stroke, hemY) {
  return `
    M48 82
    C58 72, 72 72, 82 86
    L88 120
    L94 86
    C104 72, 118 72, 128 82
    L130 ${hemY}
    L114 ${hemY + 18}
    L88 ${hemY - 4}
    L62 ${hemY + 18}
    L46 ${hemY}
    Z
  `;
}

function buildVestDetails(stroke, fill, hemY) {
  return `
    <path d="M48 82 C58 72, 72 72, 82 86 L88 120" fill="none" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M128 82 C118 72, 104 72, 94 86 L88 120" fill="none" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M88 120 L88 ${hemY - 4}" stroke="${stroke}" stroke-width="2"/>
    <circle cx="88" cy="144" r="2.6" fill="${stroke}"/>
    <circle cx="88" cy="170" r="2.6" fill="${stroke}"/>
    <circle cx="88" cy="196" r="2.6" fill="${stroke}"/>
    <path d="M55 194 L76 194" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/>
    <path d="M100 194 L121 194" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/>
    <path d="M62 ${hemY + 18} L88 ${hemY - 4} L114 ${hemY + 18}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>
  `;
}

function buildPufferLines(stroke, closed) {
  const bodyLines = closed
    ? `
      ${[116, 148, 180, 212]
        .map((y) => `<path d="M10 ${y} C48 ${y + 6}, 128 ${y + 6}, 166 ${y}" stroke="${stroke}" stroke-width="2" fill="none" stroke-linecap="round"/>`)
        .join("")}
      <path d="M32 244 C58 249, 118 249, 144 244" stroke="${stroke}" stroke-width="2" fill="none" stroke-linecap="round"/>
    `
    : `
      ${[116, 148, 180, 212]
        .map((y) => `
          <path d="M14 ${y} C30 ${y + 4}, 58 ${y + 5}, 78 ${y}" stroke="${stroke}" stroke-width="2" fill="none" stroke-linecap="round"/>
          <path d="M98 ${y} C118 ${y + 5}, 146 ${y + 4}, 162 ${y}" stroke="${stroke}" stroke-width="2" fill="none" stroke-linecap="round"/>
        `)
        .join("")}
      <path d="M32 244 C46 248, 64 248, 78 244" stroke="${stroke}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M98 244 C112 248, 130 248, 144 244" stroke="${stroke}" stroke-width="2" fill="none" stroke-linecap="round"/>
    `;

  return bodyLines;
}

function renderAccessorySvg(item) {
  if (!item || item.type !== "Accessories") return "";

  const fill = colorForItem(item.color, "#d6c6a3");
  const stroke = accentColor(fill);

  if (item.style === "Hat") {
    return `<svg viewBox="0 0 176 420" aria-hidden="true">
      <ellipse cx="88" cy="30" rx="32" ry="8" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <path d="M62 28 L114 28 L106 8 L70 8 Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
    </svg>`;
  }

  if (item.style === "Sunglasses") {
    return `<svg viewBox="0 0 176 420" aria-hidden="true">
      <path d="M80 45 L96 45" stroke="${stroke}" stroke-width="2"/>
      <rect x="69" y="39" width="16" height="10" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <rect x="91" y="39" width="16" height="10" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
    </svg>`;
  }

  if (item.style === "Scarf") {
    return `<svg viewBox="0 0 176 420" aria-hidden="true">
      <path d="M72 72 L78 154 L90 154 L86 72" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <path d="M72 72 C78 68, 98 68, 104 72 C100 86, 76 86, 72 72 Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
    </svg>`;
  }

  return `<svg viewBox="0 0 176 420" aria-hidden="true">
    <circle cx="88" cy="88" r="10" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
  </svg>`;
}

function renderShoesSvg(item, presentation = "Unspecified") {
  if (!item) return "";

  const fill = colorForItem(item.color, "#8a4a4a");
  const stroke = accentColor(fill);
  const feminine = presentation === "Feminine";
  const sneakerStyles = new Set(["Running shoes", "Basketball shoes", "Tennis shoes", "Canvas shoes"]);
  const dressShoeStyles = new Set(["Loafers", "Oxfords"]);
  const flatStyles = new Set(["Ballet flats", "Slides"]);
  const heelStyles = new Set(["Heels", "Stilettos", "Wedges"]);
  const sandalStyles = new Set(["Flip-flops", "Gladiator sandals"]);
  const bootStyles = new Set(["Boots"]);

  let left = "";
  let right = "";

  if (sneakerStyles.has(item.style)) {
    left = `
      <path d="M38 399 C42 388, 58 384, 74 388 C80 390, 83 395, 82 401 C73 413, 53 411, 40 404 Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <path d="M48 392 L67 392" stroke="${stroke}" stroke-width="1.5"/>
      <path d="M51 396 L70 396" stroke="${stroke}" stroke-width="1.5"/>
    `;
    right = `
      <path d="M94 399 C98 388, 114 384, 130 388 C136 390, 139 395, 138 401 C129 413, 109 411, 96 404 Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <path d="M104 392 L123 392" stroke="${stroke}" stroke-width="1.5"/>
      <path d="M107 396 L126 396" stroke="${stroke}" stroke-width="1.5"/>
    `;
  } else if (dressShoeStyles.has(item.style)) {
    left = `
      <path d="M37 410 L37 404 C39 396, 50 392, 62 392 C72 392, 77 397, 77 404 L77 410 Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <path d="M37 410 L37 404 C40 399, 44 396, 49 396 C53 396, 56 399, 57 404 L57 410 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
      <path d="M43 398 C51 393, 62 392, 71 397" fill="none" stroke="${stroke}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M65 394 L55 400" stroke="${stroke}" stroke-width="1.5" stroke-linecap="round"/>
    `;
    right = `
      <path d="M139 410 L139 404 C137 396, 126 392, 114 392 C104 392, 99 397, 99 404 L99 410 Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <path d="M119 410 L119 404 C120 399, 124 396, 129 396 C133 396, 136 399, 139 404 L139 410 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
      <path d="M133 398 C125 393, 114 392, 105 397" fill="none" stroke="${stroke}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M111 394 L121 400" stroke="${stroke}" stroke-width="1.5" stroke-linecap="round"/>
    `;
  } else if (flatStyles.has(item.style)) {
    if (feminine) {
      left = `
        <path d="M72 406 L70 383 Q70 380 72 380 L76 403 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
        <path d="M51 406 C54 400, 58 397, 62 397 C66 397, 69 400, 71 406 C67 409, 55 409, 51 406 Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      `;
      right = `
        <path d="M104 406 L106 383 Q106 380 104 380 L100 403 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
        <path d="M125 406 C122 400, 118 397, 114 397 C110 397, 107 400, 105 406 C109 409, 121 409, 125 406 Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      `;
    } else {
      left = `
        <path d="M69 403 L69 384 Q71 384 72 388 L73 403 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
        <path d="M46 408 C49 402, 55 399, 60 399 C66 399, 71 402, 74 408 C70 412, 50 412, 46 408 Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      `;
      right = `
        <path d="M103 403 L106 388 Q107 384 109 384 L109 403 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
        <path d="M102 408 C105 402, 111 399, 116 399 C122 399, 127 402, 130 408 C126 412, 106 412, 102 408 Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      `;
    }
  } else if (heelStyles.has(item.style)) {
    if (feminine) {
      left = `
        <path d="M72 406 L70 383 Q70 380 72 380 L76 403 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
        <path d="M51 406 C54 400, 58 397, 62 397 C66 397, 69 400, 71 406 C67 409, 55 409, 51 406 Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      `;
      right = `
        <path d="M104 406 L106 383 Q106 380 104 380 L100 403 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
        <path d="M125 406 C122 400, 118 397, 114 397 C110 397, 107 400, 105 406 C109 409, 121 409, 125 406 Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      `;
    } else {
      left = `
        <path d="M69 403 L69 384 Q71 384 72 388 L73 403 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
        <path d="M46 408 C49 402, 55 399, 60 399 C66 399, 71 402, 74 408 C70 412, 50 412, 46 408 Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      `;
      right = `
        <path d="M103 403 L106 388 Q107 384 109 384 L109 403 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
        <path d="M102 408 C105 402, 111 399, 116 399 C122 399, 127 402, 130 408 C126 412, 106 412, 102 408 Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      `;
    }
  } else if (sandalStyles.has(item.style)) {
    left = `
      <rect x="45" y="407" width="28" height="5" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <path d="M53 400 L58 405 L70 400" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    `;
    right = `
      <rect x="104" y="407" width="28" height="5" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <path d="M105 400 L118 405 L124 400" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    `;
  } else if (bootStyles.has(item.style)) {
    left = `
      <rect x="50" y="340" width="25" height="60" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <ellipse cx="53" cy="399" rx="25" ry="12" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
    `;
    right = `
      <rect x="101" y="340" width="25" height="60" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <ellipse cx="125" cy="399" rx="25" ry="12" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
    `;
  } else {
    left = `<ellipse cx="57" cy="399" rx="18" ry="12" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
    right = `<ellipse cx="118" cy="399" rx="18" ry="12" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  }

  return `<svg viewBox="0 0 176 420" aria-hidden="true">${left}${right}</svg>`;
}

function buildSkirtSvg(item, fill, stroke, waistY) {
  const lengthMap = {
    Mini: 72,
    Knee: 108,
    Midi: 144,
    Floor: 196,
  };
  const skirtLength = lengthMap[item.skirtLength || "Knee"];
  const bottomY = waistY + skirtLength;
  const hipY = waistY + 34;
  const isMiniTrumpet = item.style === "Trumpet" && item.skirtLength === "Mini";
  const trumpetHipY = isMiniTrumpet ? waistY + 24 : hipY;
  const trumpetNarrowY = Math.round(waistY + skirtLength * (isMiniTrumpet ? 0.62 : 0.68));
  const trumpetPath = isMiniTrumpet
    ? `M58 ${waistY} L118 ${waistY} C128 ${waistY + 10}, 130 ${trumpetHipY}, 126 ${trumpetHipY} C125 ${trumpetNarrowY - 6}, 124 ${trumpetNarrowY}, 124 ${trumpetNarrowY} C128 ${trumpetNarrowY + 9}, 134 ${bottomY - 4}, 138 ${bottomY} L38 ${bottomY} C42 ${bottomY - 4}, 48 ${trumpetNarrowY + 9}, 52 ${trumpetNarrowY} C52 ${trumpetNarrowY}, 51 ${trumpetNarrowY - 6}, 50 ${trumpetHipY} C46 ${trumpetHipY}, 48 ${waistY + 10}, 58 ${waistY} Z`
    : `M58 ${waistY} L118 ${waistY} C128 ${waistY + 12}, 136 ${trumpetHipY}, 132 ${trumpetHipY} C130 ${trumpetNarrowY - 8}, 126 ${trumpetNarrowY}, 124 ${trumpetNarrowY} C132 ${trumpetNarrowY + 12}, 142 ${bottomY - 6}, 146 ${bottomY} L30 ${bottomY} C34 ${bottomY - 6}, 44 ${trumpetNarrowY + 12}, 52 ${trumpetNarrowY} C50 ${trumpetNarrowY}, 46 ${trumpetNarrowY - 8}, 44 ${trumpetHipY} C40 ${trumpetHipY}, 48 ${waistY + 12}, 58 ${waistY} Z`;
  const tierOneY = Math.round(waistY + skirtLength * 0.34);
  const tierTwoY = Math.round(waistY + skirtLength * 0.66);
  const tieredPath = `M58 ${waistY} L118 ${waistY} C126 ${tierOneY - 8}, 132 ${tierOneY}, 132 ${tierOneY} L142 ${tierTwoY} L154 ${bottomY} L22 ${bottomY} L34 ${tierTwoY} L44 ${tierOneY} C44 ${tierOneY}, 50 ${tierOneY - 8}, 58 ${waistY} Z`;
  const tieredLines = `
    <path d="M44 ${tierOneY} C62 ${tierOneY + 5}, 114 ${tierOneY + 5}, 132 ${tierOneY}" fill="none" stroke="${stroke}" stroke-width="2"/>
    <path d="M34 ${tierTwoY} C58 ${tierTwoY + 6}, 118 ${tierTwoY + 6}, 142 ${tierTwoY}" fill="none" stroke="${stroke}" stroke-width="2"/>
  `;
  const asymmetricalTopY = waistY;
  const asymmetricalBottomY = bottomY;

  const stylePaths = {
    "A-Line": `M62 ${waistY} L114 ${waistY} L144 ${bottomY} L32 ${bottomY} Z`,
    Pencil: `M56 ${waistY} L120 ${waistY} L130 ${hipY} L126 ${bottomY} L50 ${bottomY} L46 ${hipY} Z`,
    Trumpet: trumpetPath,
    Tiered: tieredPath,
    Wrap: `M58 ${waistY} L118 ${waistY} L100 ${bottomY} L56 ${bottomY} Z`,
    Asymmetrical: `M56 ${asymmetricalTopY} L120 ${asymmetricalTopY} L134 ${asymmetricalBottomY - 34} L36 ${asymmetricalBottomY + 24} Z`,
  };

  const skirtPath = `<path d="${stylePaths[item.style] || stylePaths["A-Line"]}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  return item.style === "Tiered" ? `${skirtPath}${tieredLines}` : skirtPath;
}

function buildShortsSvg(item, fill, stroke, waistY) {
  const lengthMap = {
    Denim: 56,
    Boyfriend: 64,
    Cargo: 74,
    Skort: 64,
    Pleat: 70,
    Knee: 96,
    Gym: 54,
  };
  const hemY = 210 + (lengthMap[item.style] || 64);
  if (item.style === "Skort") {
    return `<path d="M46 ${waistY} L130 ${waistY} L136 ${hemY} L40 ${hemY} Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/><path d="M88 ${waistY} L84 ${hemY}" stroke="${stroke}" stroke-width="2"/>`;
  }
  const pockets = item.style === "Cargo"
    ? `<rect x="52" y="${waistY + 36}" width="13" height="18" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="2"/><rect x="111" y="${waistY + 36}" width="13" height="18" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`
    : "";
  return `
    <path d="M46 ${waistY} L130 ${waistY} L124 ${hemY} L100 ${hemY} L88 ${hemY - 14} L76 ${hemY} L52 ${hemY} Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
    <path d="M88 ${waistY} L88 ${hemY - 10}" stroke="${stroke}" stroke-width="2"/>
    ${pockets}
  `;
}

function buildPantsSvg(item, fill, stroke, waistY, effectiveTemperature, presentation = "Unspecified") {
  const floorY = 386;
  const style = item.style;
  const feminine = presentation === "Feminine";
  let leftHem = 46;
  let rightHem = 134;
  let leftUpper = 58;
  let rightUpper = 118;
  let leftHip = 46;
  let rightHip = 130;

  const cuffs = style === "Sweatpants"
    ? `<path d="M56 ${floorY} L78 ${floorY}" stroke="${stroke}" stroke-width="3"/><path d="M98 ${floorY} L120 ${floorY}" stroke="${stroke}" stroke-width="3"/>`
    : "";
  const pockets = style === "Cargo pants"
    ? `<rect x="46" y="${waistY + 56}" width="16" height="24" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="2"/><rect x="114" y="${waistY + 56}" width="16" height="24" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`
    : "";
  const overallsTop = style === "Overalls"
    ? `
      <path d="M57 84 L69 84 L73 112 L63 112 Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <path d="M119 84 L107 84 L103 112 L113 112 Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <path d="M54 112 L122 112 L118 ${waistY} L58 ${waistY} Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <path d="M88 112 L88 ${waistY}" stroke="${stroke}" stroke-width="2"/>
      <path d="M69 90 L69 108" stroke="${stroke}" stroke-width="2"/>
      <path d="M107 90 L107 108" stroke="${stroke}" stroke-width="2"/>
    `
    : "";
  const jumpsuitTop = style === "Jumpsuit"
    ? `
      <path d="${feminine
        ? `M56 84 L40 96 L34 ${waistY + 6} L50 ${waistY + 6} L68 112 Z`
        : `M56 80 L36 92 L20 ${waistY + 30} L40 ${waistY + 30} L68 108 Z`
      }" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <path d="${feminine
        ? `M120 84 L136 96 L142 ${waistY + 6} L126 ${waistY + 6} L108 112 Z`
        : `M120 80 L140 92 L156 ${waistY + 30} L136 ${waistY + 30} L108 108 Z`
      }" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <path d="${feminine
        ? `M56 84 L72 84 L78 92 L98 92 L104 84 L120 84 L118 ${waistY} C108 ${waistY + 2}, 68 ${waistY + 2}, 58 ${waistY} Z`
        : `M54 80 L72 80 L78 88 L98 88 L104 80 L122 80 L118 ${waistY} C108 ${waistY + 2}, 68 ${waistY + 2}, 58 ${waistY} Z`
      }" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <path d="M88 92 L88 ${waistY}" stroke="${stroke}" stroke-width="2"/>
      <circle cx="88" cy="108" r="1.8" fill="${stroke}"/>
      <circle cx="88" cy="122" r="1.8" fill="${stroke}"/>
      <circle cx="88" cy="136" r="1.8" fill="${stroke}"/>
      <circle cx="88" cy="150" r="1.8" fill="${stroke}"/>
    `
    : "";

  return `
    ${jumpsuitTop}
    <path d="M${leftUpper} ${waistY} L${rightUpper} ${waistY} L${rightHip} ${waistY + 24} L${rightHem} ${floorY} L98 ${floorY} L94 238 L82 238 L78 ${floorY} L${leftHem} ${floorY} L${leftHip} ${waistY + 24} Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
    <path d="M${leftHip} ${waistY + 24} L74 ${waistY + 24} L${leftHem} ${floorY}" fill="none" stroke="${stroke}" stroke-width="2"/>
    <path d="M${rightHip} ${waistY + 24} L102 ${waistY + 24} L${rightHem} ${floorY}" fill="none" stroke="${stroke}" stroke-width="2"/>
    <path d="M88 ${waistY} L88 238" stroke="${stroke}" stroke-width="2"/>
    ${cuffs}
    ${pockets}
    ${overallsTop}
  `;
}

function accentColor(hexColor) {
  const normalized = hexColor.replace("#", "");
  if (normalized.length !== 6) return "#2d3a31";
  const numeric = parseInt(normalized, 16);
  const red = Math.max(0, ((numeric >> 16) & 255) - 40);
  const green = Math.max(0, ((numeric >> 8) & 255) - 40);
  const blue = Math.max(0, (numeric & 255) - 40);
  return `rgb(${red}, ${green}, ${blue})`;
}

function buildRationale({
  temperature,
  effectiveTemperature,
  weather,
  season,
  theme,
  stylePreference,
  topItem,
  bottomItem,
  layerItem,
  accessoryItems = [],
  shoesItem,
}) {
  if (!topItem && !bottomItem && !layerItem && !accessoryItems.length && !shoesItem) {
    return "No outfit to explain yet. Add clothing to your closet to generate a recommendation.";
  }

  const biasMessage = effectiveTemperature !== temperature
    ? `Your profile adjusts ${temperature}°F to feel more like ${effectiveTemperature}°F. `
    : "";

  const outfitMessage = [
    topItem ? `${topItem.name} handles the top layer.` : "You still need a saved top option.",
    bottomItem ? `${bottomItem.name} anchors the outfit.` : "A saved bottom will help complete the look.",
    layerItem ? `${layerItem.name} adds extra weather protection.` : "No extra layer was selected from your closet.",
    accessoryItems.length ? `${accessoryItems.map((item) => item.name).join(", ")} add accessories.` : "No accessories were selected from your closet.",
    shoesItem ? `${shoesItem.name} finishes the look.` : "Shoes can complete the outfit once they are in your closet.",
  ].join(" ");

  return `${biasMessage}${capitalize(weather)} ${season.toLowerCase()} weather and a ${theme.toLowerCase()} theme push this suggestion toward ${stylePreference.toLowerCase()} styling. ${outfitMessage}`;
}

function getPlannerState(formData = null) {
  const source = formData || new FormData(elements.plannerForm);
  return {
    temperature: Number(source.get("temperature")),
    weather: source.get("weather"),
    season: source.get("season"),
    theme: source.get("theme"),
    stylePreference: source.get("stylePreference"),
  };
}

function applyTemperatureBias(temperature, bias) {
  if (bias === "runs_cold") return temperature - 5;
  if (bias === "runs_hot") return temperature + 5;
  return temperature;
}

function detectSeason(date) {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return "Spring";
  if (month >= 6 && month <= 8) return "Summer";
  if (month >= 9 && month <= 11) return "Fall";
  return "Winter";
}

function loadCollection(key, fallback) {
  const value = localStorage.getItem(key);
  if (!value) {
    persistCollection(key, fallback);
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    persistCollection(key, fallback);
    return fallback;
  }
}

function normalizeInitialCloset(closet) {
  const itemNames = closet.map((item) => item.name).sort();
  const isLegacySeedCloset = legacySeedClosets.some((seedCloset) => (
    closet.length === seedCloset.length &&
    seedCloset.every((name) => itemNames.includes(name))
  ));

  if (!isLegacySeedCloset) {
    return closet;
  }

  persistCollection(STORAGE_KEYS.closet, []);
  return [];
}

function normalizeProfile(profile) {
  const normalizedProfileStyle = styleDirectionOptions.includes(profile?.profileStyle)
    ? profile.profileStyle
    : defaultProfile.profileStyle;

  return {
    temperatureBias: profile?.temperatureBias || defaultProfile.temperatureBias,
    profileStyle: normalizedProfileStyle,
    presentation: profile?.presentation || defaultProfile.presentation,
  };
}

function persistCollection(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadObject(key, fallback) {
  const value = localStorage.getItem(key);
  if (!value) {
    persistObject(key, fallback);
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    persistObject(key, fallback);
    return fallback;
  }
}

function persistObject(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function describeItem(item) {
  const materialNote = item.material ? ` in ${item.material.toLowerCase()}` : "";
  const patternNote = item.pattern ? ` with a ${item.pattern.toLowerCase()} pattern` : "";
  const garmentLabel = describeGarmentLabel(item);
  const displayType = item.type === "Shorts" ? "shorts" : item.type.toLowerCase();
  const normalizedName = normalizeDescriptionText(item.name);
  const lengthAlreadyNamed = item.skirtLength && normalizedName.includes(normalizeDescriptionText(item.skirtLength));
  const skirtLengthLabel = item.skirtLength && !lengthAlreadyNamed ? ` ${item.skirtLength}` : "";
  const displayName = item.type === "Pants" && !normalizedName.includes("pants")
    ? `${item.name} Pants`
    : item.type === "Skirts" && !normalizedName.includes("skirt")
      ? `${item.name}${skirtLengthLabel} Skirt`
      : item.type === "Skirts" && item.skirtLength && !lengthAlreadyNamed
        ? `${item.name} (${item.skirtLength})`
      : item.name;
  const colorAlreadyNamed = normalizedName.includes(normalizeDescriptionText(item.color));
  const styleAlreadyNamed = normalizedName.includes(normalizeDescriptionText(item.style));
  const summaryParts = [
    colorAlreadyNamed ? "" : item.color,
    styleAlreadyNamed ? "" : garmentLabel,
  ].filter(Boolean);
  const detailNotes = [
    patternNote,
    item.theme ? ` tagged ${item.theme.toLowerCase()}` : "",
    materialNote,
  ].filter(Boolean).join(",");
  const summary = summaryParts.length
    ? `${displayName}: ${summaryParts.join(" ")}.`
    : `${displayName}.`;

  return `${summary} Displayed as ${displayType}${detailNotes}.`;
}

function describeStyle(item) {
  const styleNotes = [item.style];
  if (item.skirtLength) styleNotes.push(item.skirtLength);
  if (item.sleeveLength) styleNotes.push(item.sleeveLength);
  if (item.jewelryType) styleNotes.push(item.jewelryType);
  return styleNotes.length > 1 ? `${styleNotes[0]} (${styleNotes.slice(1).join(", ")})` : styleNotes[0];
}

function describeGarmentLabel(item) {
  const details = [];
  if (item.skirtLength) details.push(`${item.skirtLength.toLowerCase()} length`);
  if (item.sleeveLength) details.push(item.sleeveLength.toLowerCase());
  if (item.jewelryType) details.push(item.jewelryType.toLowerCase());

  const detailText = details.length ? ` (${details.join(", ")})` : "";
  return `${item.style.toLowerCase()}${detailText}`;
}

function normalizeDescriptionText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function colorForItem(colorName, fallback) {
  const colorMap = {
    pink: "#d98eac",
    red: "#ba5757",
    orange: "#d78847",
    yellow: "#d8c95a",
    "light green": "#8fcb8d",
    "dark green": "#2f6f3b",
    "light blue": "#98c3e6",
    "dark blue": "#416c9e",
    "light purple": "#c2a6dc",
    "dark purple": "#7c5aa7",
    brown: "#8a644b",
    grey: "#9da6ab",
    gray: "#9da6ab",
    black: "#243428",
    white: "#f5f7f2",
  };

  if (!colorName) return fallback;
  const lower = colorName.toLowerCase();
  return colorMap[lower] || fallback;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatLabel(value) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}
