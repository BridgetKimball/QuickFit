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
    "Polo",
    "Turtleneck",
    "Tank top",
    "Sleeveless shirt",
    "Tube top",
    "Sports bra",
  ],
  Shorts: [
    "Denim",
    "Boyfriend",
    "Cargo",
    "Skort",
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
    "Sweat pants",
    "Cargo pants",
    "Palazzo",
    "Overalls",
    "Jumpsuit",
  ],
  Skirts: [
    "A-Line",
    "Pencil",
    "Trumpet",
    "Sarong",
    "Tiered",
    "Wrap",
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
  Accessories: ["Hat", "Sunglasses", "Scarf", "Jewelry"],
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
  mannequinSilhouette: document.querySelector("#mannequin-silhouette"),
  mannequinShell: document.querySelector(".mannequin__silhouette-shell"),
  closetForm: document.querySelector("#closet-form"),
  closetList: document.querySelector("#closet-list"),
  closetFilter: document.querySelector("#closet-filter"),
  closetFavoriteFilter: document.querySelector("#closet-favorite-filter"),
  typeSelect: document.querySelector("#type"),
  styleSelect: document.querySelector("#style"),
  colorSelect: document.querySelector("#color"),
  customColorField: document.querySelector("#custom-color-field"),
  customColorInput: document.querySelector("#customColor"),
  jewelryField: document.querySelector("#jewelry-field"),
  jewelryTypeSelect: document.querySelector("#jewelryType"),
  weatherSelect: document.querySelector("#weather"),
  weatherStatus: document.querySelector("#weather-status"),
  refreshWeatherButton: document.querySelector("#refresh-weather"),
  favoriteOutfitButton: document.querySelector("#favorite-outfit"),
  profileForm: document.querySelector("#profile-form"),
  profileSummary: document.querySelector("#profile-summary"),
  profileStyleSelect: document.querySelector("#profileStyle"),
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

  elements.resetProfileButton.addEventListener("click", () => {
    state.profile = { ...defaultProfile };
    persistObject(STORAGE_KEYS.profile, state.profile);
    renderProfile();
    generateRecommendation(getPlannerState());
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

  elements.customColorField.classList.toggle("is-hidden", !showCustomColor);
  elements.customColorInput.required = showCustomColor;
  if (!showCustomColor) elements.customColorInput.value = "";

  elements.jewelryField.classList.toggle("is-hidden", !showJewelrySubtype);
  elements.jewelryTypeSelect.required = showJewelrySubtype;
  if (!showJewelrySubtype) elements.jewelryTypeSelect.value = "";
}

function buildClosetItem(formData) {
  const rawItem = Object.fromEntries(formData.entries());
  const color = rawItem.color === "Multicolor" ? rawItem.customColor.trim() || "Multicolor" : rawItem.color;

  if (!color) return null;

  return {
    name: rawItem.name.trim(),
    color,
    baseColor: rawItem.color,
    pattern: rawItem.pattern.trim(),
    material: rawItem.material.trim(),
    type: rawItem.type,
    style: rawItem.style,
    jewelryType: rawItem.jewelryType || "",
    theme: rawItem.theme,
    warmth: rawItem.warmth,
    isFavorite: false,
  };
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
  const layerItem = chooseItem("layer", { effectiveTemperature, theme, stylePreference, weather });

  elements.weatherSummary.textContent = `${temperature}°F · ${capitalize(weather)} · ${season}`;
  elements.topRecommendation.textContent = topItem
    ? describeItem(topItem)
    : "Closet is empty, add a piece of clothing to get started.";
  elements.bottomRecommendation.textContent = bottomItem
    ? describeItem(bottomItem)
    : "Once you add clothes, QuickFit will suggest bottoms here.";
  elements.layerRecommendation.textContent = layerItem
    ? describeItem(layerItem)
    : "Layers and accessories will appear here after you build your closet.";

  state.currentRecommendation = {
    planner: { temperature, weather, season, theme, stylePreference, outfitDate: elements.outfitDate.value },
    topItemId: topItem?.id || null,
    bottomItemId: bottomItem?.id || null,
    layerItemId: layerItem?.id || null,
  };

  applyMannequinStyles(topItem, bottomItem, layerItem, effectiveTemperature);
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
  });
}

function toggleFavoriteCurrentOutfit() {
  const recommendation = state.currentRecommendation;
  if (!recommendation || (!recommendation.topItemId && !recommendation.bottomItemId && !recommendation.layerItemId)) {
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
      createdAt: new Date().toISOString(),
    });
  }

  persistCollection(STORAGE_KEYS.favoriteOutfits, state.favoriteOutfits);
  syncFavoriteOutfitButton();
  renderSavedOutfits();
}

function syncFavoriteOutfitButton() {
  const recommendation = state.currentRecommendation;
  const canSave = recommendation && (recommendation.topItemId || recommendation.bottomItemId || recommendation.layerItemId);
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
    savedOutfit.planner.theme === recommendation.planner.theme &&
    savedOutfit.planner.stylePreference === recommendation.planner.stylePreference
  );
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
    const itemLabels = [topItem?.name, bottomItem?.name, layerItem?.name].filter(Boolean).join(" · ");

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
  const finalPool = styleMatches.length ? styleMatches : warmthPool;
  return finalPool[0] || null;
}

function desiredWarmth(temperature, group, weather) {
  if (group === "layer") {
    if (temperature <= 50 || weather === "rainy" || weather === "snowy") return "heavy";
    if (temperature <= 68 || weather === "windy") return "medium";
    return "light";
  }

  if (temperature <= 45) return "heavy";
  if (temperature <= 70) return "medium";
  return "light";
}

function applyMannequinStyles(topItem, bottomItem, layerItem, effectiveTemperature) {
  elements.mannequinTop.style.background = colorForItem(topItem?.color, "#4ea35f");
  elements.mannequinBottom.style.background = colorForItem(bottomItem?.color, "#dbe8d7");
  elements.mannequinLayer.style.background = colorForItem(layerItem?.color, "#083910");

  if (topItem) {
    const topClip = topItem.type === "Sweaters"
      ? "inset(14% 18% 34% 18%)"
      : "inset(16% 20% 42% 20%)";
    elements.mannequinTop.style.clipPath = topClip;
    elements.mannequinTop.style.opacity = "0.92";
  } else {
    elements.mannequinTop.style.opacity = "0";
  }

  if (bottomItem) {
    const bottomClip = effectiveTemperature > 75
      ? "inset(58% 24% 24% 24%)"
      : "inset(52% 24% 10% 24%)";
    elements.mannequinBottom.style.clipPath = bottomClip;
    elements.mannequinBottom.style.opacity = "0.9";
  } else {
    elements.mannequinBottom.style.opacity = "0";
  }

  if (layerItem && layerItem.type === "Jackets") {
    const layerClip = effectiveTemperature < 60
      ? "inset(12% 12% 30% 12%)"
      : "inset(14% 14% 38% 14%)";
    elements.mannequinLayer.style.clipPath = layerClip;
    elements.mannequinLayer.style.opacity = "0.82";
  } else {
    elements.mannequinLayer.style.opacity = "0";
  }
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
}) {
  if (!topItem && !bottomItem && !layerItem) {
    return "No outfit to explain yet. Add clothing to your closet to generate a recommendation.";
  }

  const biasMessage = effectiveTemperature !== temperature
    ? `Your profile adjusts ${temperature}°F to feel more like ${effectiveTemperature}°F. `
    : "";

  const outfitMessage = [
    topItem ? `${topItem.name} handles the top layer.` : "You still need a saved top option.",
    bottomItem ? `${bottomItem.name} anchors the outfit.` : "A saved bottom will help complete the look.",
    layerItem ? `${layerItem.name} adds extra weather protection.` : "No extra layer was selected from your closet.",
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
  return `${item.name} in ${item.color}${patternNote}, tagged ${item.theme.toLowerCase()} with a ${describeStyle(item).toLowerCase()} silhouette${materialNote}.`;
}

function describeStyle(item) {
  return item.jewelryType ? `${item.style} (${item.jewelryType})` : item.style;
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
