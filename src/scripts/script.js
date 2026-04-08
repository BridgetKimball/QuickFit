const STORAGE_KEYS = {
  closet: "quickfit-closet",
  profile: "quickfit-profile",
};

const OPENWEATHER_API_KEY = "";
const OPENWEATHER_ONE_CALL_URL = "https://api.openweathermap.org/data/3.0/onecall";

const clothingStyles = {
  Jackets: [
    "Leather jacket",
    "Denim jacket",
    "Bomber jacket",
    "Motorcycle jacket",
    "Vest",
    "Blazer",
    "Fleece jacket",
    "Shirt jacket",
    "Chore jacket",
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
  Pants: [
    "Hot pants",
    "Straight",
    "Skinny",
    "Boot-cut",
    "Flare",
    "Wide leg",
    "Pegged",
    "Harem",
    "Carpenter / overall",
    "Sweat pants",
    "Stirrup",
    "5-pocket jeans",
    "Bush pants",
    "Cargo pants",
    "Sailor pants",
    "Jodhpurs",
    "Palazzo",
    "Jumpsuit",
  ],
  Shirts: [
    "Tube top",
    "Sports bra",
    "Tank top",
    "Sleeveless shirt",
    "V-neck shirt",
    "T-shirt",
    "Blouse",
    "Shirt",
    "Western shirt",
    "Smock",
    "Peplum",
    "Gypsy",
    "Tunic",
    "Polo",
    "Turtleneck",
  ],
  Shorts: [
    "Denim",
    "Boyfriend",
    "Cargo",
    "Skort",
    "Bloomer",
    "Pleat",
    "Culottes",
    "Boxer",
    "Bermuda",
    "Knee",
    "Bike",
    "Pedal",
    "Gym",
  ],
  Skirts: [
    "Pencil",
    "A-Line",
    "Waist Pleat",
    "Hip Pleat",
    "Godet",
    "Tulip",
    "Trumpet",
    "Sarong",
    "Gypsy",
    "Tiered",
    "Gore",
    "Handkerchief",
    "Wrap",
    "Asymmetrical",
    "Circle",
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
  "Other",
];

const typeGroups = {
  top: ["Shirts", "Sweaters"],
  bottom: ["Skirts", "Shorts", "Pants"],
  layer: ["Jackets", "Accessories"],
};

const seasonOptions = ["Spring", "Summer", "Fall", "Winter"];

const defaultCloset = [
  {
    id: crypto.randomUUID(),
    name: "Forest weekend tee",
    color: "Dark Green",
    material: "Cotton",
    type: "Shirts",
    style: "T-shirt",
    theme: "Casual",
    warmth: "light",
  },
  {
    id: crypto.randomUUID(),
    name: "Cream straight trousers",
    color: "White",
    material: "",
    type: "Pants",
    style: "Straight",
    theme: "Business-Casual",
    warmth: "medium",
  },
  {
    id: crypto.randomUUID(),
    name: "Olive bomber layer",
    color: "Dark Green",
    material: "",
    type: "Jackets",
    style: "Bomber jacket",
    theme: "Casual",
    warmth: "medium",
  },
];

const state = {
  closet: loadCollection(STORAGE_KEYS.closet, defaultCloset),
  profile: loadObject(STORAGE_KEYS.profile, {
    temperatureBias: "neutral",
    profileStyle: "Balanced",
    presentation: "Unspecified",
  }),
};

const elements = {
  sections: document.querySelectorAll(".panel-grid"),
  navButtons: document.querySelectorAll(".section-nav__link"),
  heroNavButtons: document.querySelectorAll("[data-nav-target]"),
  plannerForm: document.querySelector("#planner-form"),
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
  closetForm: document.querySelector("#closet-form"),
  closetList: document.querySelector("#closet-list"),
  closetFilter: document.querySelector("#closet-filter"),
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
  profileForm: document.querySelector("#profile-form"),
  profileSummary: document.querySelector("#profile-summary"),
};

init();

async function init() {
  populateSeasonOptions();
  populateTypeOptions();
  populateColorOptions();
  updateStyleOptions(elements.typeSelect.value);
  syncConditionalFields();
  populateClosetFilter();
  bindEvents();
  renderCloset();
  renderProfile();
  generateRecommendation(getPlannerState());
  await loadCurrentWeatherDefaults();
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
    await loadCurrentWeatherDefaults(true);
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

  elements.profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.profile = Object.fromEntries(new FormData(event.currentTarget).entries());
    persistObject(STORAGE_KEYS.profile, state.profile);
    renderProfile();
    generateRecommendation(getPlannerState());
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

async function loadCurrentWeatherDefaults(triggeredManually = false) {
  if (!("geolocation" in navigator)) {
    elements.weatherStatus.textContent = "Location access is not supported in this browser, so QuickFit is using manual defaults.";
    return;
  }

  elements.refreshWeatherButton.disabled = true;
  elements.weatherStatus.textContent = triggeredManually
    ? "Refreshing your current weather defaults."
    : "Checking your local weather for the default planner values.";

  try {
    const position = await getCurrentPosition();
    const weatherData = await fetchCurrentWeather(position.coords.latitude, position.coords.longitude);
    applyWeatherDefaults(weatherData);
  } catch (error) {
    elements.weatherStatus.textContent = buildWeatherErrorMessage(error);
  } finally {
    elements.refreshWeatherButton.disabled = false;
  }
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 600000,
    });
  });
}

async function fetchCurrentWeather(latitude, longitude) {
  if (!OPENWEATHER_API_KEY) {
    throw new Error("OpenWeather API key is not configured");
  }

  const url = new URL(OPENWEATHER_ONE_CALL_URL);
  url.searchParams.set("lat", latitude);
  url.searchParams.set("lon", longitude);
  url.searchParams.set("exclude", "minutely,hourly,daily,alerts");
  url.searchParams.set("units", "imperial");
  url.searchParams.set("appid", OPENWEATHER_API_KEY);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`OpenWeather request failed with status ${response.status}`);
  }

  return response.json();
}

function applyWeatherDefaults(weatherData) {
  const current = weatherData.current;
  const temperature = Math.round(current.temp);
  const weatherCategory = mapWeatherCondition(current.weather?.[0]?.main, current.weather?.[0]?.description);
  const season = detectSeason(new Date((current.dt + weatherData.timezone_offset) * 1000));

  elements.temperature.value = String(temperature);
  elements.temperatureValue.textContent = `${temperature}°F`;
  elements.weatherSelect.value = weatherCategory;
  elements.season.value = season;
  elements.weatherStatus.textContent = `Using your current local weather: ${temperature}°F and ${formatWeatherSummary(current.weather?.[0]?.description || current.weather?.[0]?.main || weatherCategory)}.`;
  generateRecommendation(getPlannerState());
}

function mapWeatherCondition(mainCondition = "", description = "") {
  const main = mainCondition.toLowerCase();
  const details = description.toLowerCase();

  if (main.includes("snow")) return "snowy";
  if (main.includes("rain") || main.includes("drizzle") || main.includes("thunderstorm")) return "rainy";
  if (main.includes("cloud")) return "cloudy";
  if (main.includes("clear")) return "sunny";
  if (details.includes("wind") || main.includes("squall") || main.includes("tornado")) return "windy";
  return "sunny";
}

function buildWeatherErrorMessage(error) {
  if (error?.code === 1) {
    return "Location access was denied, so QuickFit is keeping the planner weather editable with manual defaults.";
  }

  if (error?.code === 2) {
    return "QuickFit could not determine your location, so the planner is using manual defaults for now.";
  }

  if (error?.code === 3) {
    return "Location lookup timed out, so QuickFit is using manual defaults until you try again.";
  }

  return "QuickFit could not load current weather right now, so the planner is using manual defaults.";
}

function formatWeatherSummary(summary) {
  return summary
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ");
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
  const showCustomColor = elements.colorSelect.value === "Other";
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
  const color = rawItem.color === "Other" ? rawItem.customColor.trim() : rawItem.color;

  if (!color) return null;

  return {
    name: rawItem.name.trim(),
    color,
    baseColor: rawItem.color,
    material: rawItem.material.trim(),
    type: rawItem.type,
    style: rawItem.style,
    jewelryType: rawItem.jewelryType || "",
    theme: rawItem.theme,
    warmth: rawItem.warmth,
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
  const filteredItems = filterValue === "all"
    ? state.closet
    : state.closet.filter((item) => item.type === filterValue);

  if (!filteredItems.length) {
    elements.closetList.innerHTML = `
      <div class="empty-state">
        No items match this filter yet. Add a few pieces so QuickFit has more to work with.
      </div>
    `;
    return;
  }

  elements.closetList.innerHTML = "";

  filteredItems.forEach((item) => {
    const materialLabel = item.material ? item.material : "Material not specified";
    const detailLine = `${item.color} ${describeStyle(item).toLowerCase()}${item.material ? ` in ${item.material.toLowerCase()}` : ""}`;
    const card = document.createElement("article");
    card.className = "closet-card fade-in";
    card.innerHTML = `
      <div class="closet-card__header">
        <div>
          <div class="closet-card__title">${item.name}</div>
          <p>${detailLine}</p>
        </div>
        <button class="closet-card__delete" data-delete-id="${item.id}" type="button">Remove</button>
      </div>
      <div class="closet-card__meta">
        <span class="tag">${item.type}</span>
        <span class="tag">${describeStyle(item)}</span>
        <span class="tag">${item.theme}</span>
        <span class="tag">${capitalize(item.warmth)} warmth</span>
        <span class="tag">${materialLabel}</span>
      </div>
    `;

    card.querySelector("[data-delete-id]")?.addEventListener("click", () => {
      state.closet = state.closet.filter((entry) => entry.id !== item.id);
      persistCollection(STORAGE_KEYS.closet, state.closet);
      renderCloset();
      generateRecommendation(getPlannerState());
    });

    elements.closetList.append(card);
  });
}

function renderProfile() {
  const { temperatureBias, profileStyle, presentation } = state.profile;
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
}

function generateRecommendation({ temperature, weather, season, theme, stylePreference }) {
  const effectiveTemperature = applyTemperatureBias(temperature, state.profile.temperatureBias);
  const topItem = chooseItem("top", { effectiveTemperature, theme, stylePreference });
  const bottomItem = chooseItem("bottom", { effectiveTemperature, theme, stylePreference });
  const layerItem = chooseItem("layer", { effectiveTemperature, theme, stylePreference, weather });

  elements.weatherSummary.textContent = `${temperature}°F · ${capitalize(weather)} · ${season}`;
  elements.topRecommendation.textContent = topItem
    ? describeItem(topItem)
    : "Add shirts or sweaters so QuickFit can suggest a top.";
  elements.bottomRecommendation.textContent = bottomItem
    ? describeItem(bottomItem)
    : "Add pants, shorts, or skirts so QuickFit can finish the outfit.";
  elements.layerRecommendation.textContent = layerItem
    ? describeItem(layerItem)
    : effectiveTemperature < 60 || weather === "rainy"
      ? "A jacket, scarf, or weather-ready accessory would help here."
      : "No extra layer needed right now, but accessories can elevate the look.";

  applyMannequinStyles(topItem, bottomItem, layerItem, effectiveTemperature);
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

  const longTop = topItem?.type === "Sweaters";
  elements.mannequinTop.style.height = longTop || effectiveTemperature < 55 ? "126px" : "112px";
  elements.mannequinBottom.style.height = effectiveTemperature > 75 ? "98px" : "132px";
  elements.mannequinBottom.style.top = "198px";

  if (layerItem && layerItem.type === "Jackets") {
    elements.mannequinLayer.style.height = effectiveTemperature < 60 ? "154px" : "126px";
    elements.mannequinLayer.style.opacity = "0.9";
    elements.mannequinLayer.style.background = colorForItem(layerItem.color, "#083910");
  } else {
    elements.mannequinLayer.style.height = "0";
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
  const biasMessage = effectiveTemperature !== temperature
    ? `Your profile adjusts ${temperature}°F to feel more like ${effectiveTemperature}°F. `
    : "";

  const outfitMessage = [
    topItem ? `${topItem.name} handles the top layer.` : "You still need a saved top option.",
    bottomItem ? `${bottomItem.name} anchors the outfit.` : "A saved bottom will help complete the look.",
    layerItem ? `${layerItem.name} adds extra weather protection.` : "No extra layer was required from your closet.",
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
  return `${item.name} in ${item.color}, tagged ${item.theme.toLowerCase()} with a ${describeStyle(item).toLowerCase()} silhouette${materialNote}.`;
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
