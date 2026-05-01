import {
  renderAccessorySvg,
  renderBottomSvg,
  renderLayerSvg,
  renderShoesSvg,
  renderTopSvg,
  resolveTopSilhouette,
} from "./clothes_rendering.js";

import {
  buildWeatherErrorMessage,
  fetchCurrentWeather,
  fetchForecastWeather,
  formatWeatherSummary,
  getCurrentPosition,
  isSameForecastDay,
  mapWeatherCondition,
  selectRepresentativeForecastEntry,
} from "./weather.js";

const STORAGE_KEYS = {
  closet: "quickfit-closet",
  profile: "quickfit-profile",
  lastLocation: "quickfit-last-location",
  favoriteOutfits: "quickfit-favorite-outfits",
};

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
  lastWeatherMismatchAlertKey: "",
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
  closetThemeField: document.querySelector("#closet-theme-field"),
  closetThemeSelect: document.querySelector("#closet-theme"),
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
  appAlert: document.querySelector("#app-alert"),
  appAlertMessage: document.querySelector("#app-alert-message"),
  appAlertClose: document.querySelector("#app-alert-close"),
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

  elements.appAlertClose?.addEventListener("click", closeAppAlert);
  elements.appAlert?.querySelector("[data-close-alert]")?.addEventListener("click", closeAppAlert);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAppAlert();
    }
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
  const showClosetTheme = elements.typeSelect.value !== "Accessories";
  const showJewelrySubtype =
    elements.typeSelect.value === "Accessories" && elements.styleSelect.value === "Jewelry";
  const showSkirtLength = elements.typeSelect.value === "Skirts";
  const sleevelessShirtStyles = new Set(["Tank top", "Sleeveless shirt", "Sports bra", "Tube top"]);
  const showSleeveLength =
    elements.typeSelect.value === "Shirts" && !sleevelessShirtStyles.has(elements.styleSelect.value);

  elements.customColorField.classList.toggle("is-hidden", !showCustomColor);
  elements.customColorInput.required = showCustomColor;
  if (!showCustomColor) elements.customColorInput.value = "";

  elements.closetThemeField.classList.toggle("is-hidden", !showClosetTheme);
  elements.closetThemeSelect.required = showClosetTheme;
  elements.closetThemeSelect.disabled = !showClosetTheme;

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
    theme: rawItem.type === "Accessories" ? "" : rawItem.theme,
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
    const displayName = getClosetCardDisplayName(item);
    const card = document.createElement("article");
    card.className = "closet-card fade-in";
    card.innerHTML = `
      <div class="closet-card__header">
        <div>
          <div class="closet-card__title">${displayName}</div>
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
        ${getClosetCardTags(item, materialLabel).map((label) => `<span class="tag">${label}</span>`).join("")}
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

function getClosetCardTags(item, materialLabel) {
  return [
    shouldShowClosetStyleTag(item) ? describeStyle(item) : "",
    item.pattern ? `${item.pattern} pattern` : "",
    item.type === "Skirts" && item.skirtLength ? `${item.skirtLength} length` : "",
    shouldShowClosetSleeveTag(item) ? item.sleeveLength : "",
    item.theme,
    materialLabel,
  ].filter(Boolean);
}

function getClosetCardDisplayName(item) {
  if (item.type === "Skirts") {
    return `${item.color} Skirt`;
  }

  return getDisplayItemName(item);
}

function shouldShowClosetStyleTag(item) {
  return item.type !== "Shirts";
}

function shouldShowClosetSleeveTag(item) {
  return Boolean(item.sleeveLength) && item.type === "Shirts";
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
  let layerItem = chooseItem("jacket", { effectiveTemperature, theme, stylePreference, weather });
  let topItem = chooseItem("top", { effectiveTemperature, theme, stylePreference, layerItem });
  let bottomItem = chooseItem("bottom", { effectiveTemperature, theme, stylePreference });
  let accessoryItems = chooseAccessoryItems({ effectiveTemperature, theme, stylePreference, weather });
  let shoesItem = chooseItem("shoes", { effectiveTemperature, theme, stylePreference, weather });
  const missingRequiredCategories = getMissingRequiredOutfitCategories({ topItem, bottomItem, shoesItem });
  const hasCompleteOutfit = !missingRequiredCategories.length;

  if (!hasCompleteOutfit) {
    topItem = null;
    bottomItem = null;
    layerItem = null;
    accessoryItems = [];
    shoesItem = null;
  }

  const layerAndAccessoryDescriptions = [layerItem, ...accessoryItems].filter(Boolean).map(describeItem);

  elements.weatherSummary.textContent = `${temperature}°F · ${capitalize(weather)} · ${season}`;
  elements.topRecommendation.textContent = topItem
    ? describeItem(topItem)
    : !hasCompleteOutfit && state.closet.some((item) => typeGroups.top.includes(item.type))
      ? "No complete outfit found for this theme and weather."
    : state.closet.some((item) => typeGroups.top.includes(item.type))
      ? "No applicable top found for this theme and weather."
      : "Closet is empty, add a piece of clothing to get started.";
  elements.bottomRecommendation.textContent = bottomItem
    ? describeItem(bottomItem)
    : !hasCompleteOutfit && state.closet.some((item) => typeGroups.bottom.includes(item.type))
      ? "No complete outfit found for this theme and weather."
    : state.closet.some((item) => typeGroups.bottom.includes(item.type))
      ? "No applicable bottom found for this theme and weather."
      : "Once you add clothes, QuickFit will suggest bottoms here.";
  elements.layerRecommendation.textContent = layerItem
    ? layerAndAccessoryDescriptions.join(" ")
    : accessoryItems.length
      ? layerAndAccessoryDescriptions.join(" ")
    : "Layers and accessories will appear here after you build your closet.";
  elements.shoesRecommendation.textContent = shoesItem
    ? describeItem(shoesItem)
    : !hasCompleteOutfit && state.closet.some((item) => typeGroups.shoes.includes(item.type))
      ? "No complete outfit found for this theme and weather."
    : state.closet.some((item) => typeGroups.shoes.includes(item.type))
      ? "No applicable shoes found for this theme and weather."
      : "Shoes will appear here after you add them to your closet.";
  maybeAlertWeatherMismatch({ missingRequiredCategories, effectiveTemperature, weather, theme });

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
  const weatherPool = filterWeatherEligibleItems(typedItems, group, context);
  if (!weatherPool.length) return null;

  if (group === "jacket" && (context.effectiveTemperature <= 40 || context.weather === "snowy")) {
    const coldWeatherCoats = rankItemsByStylePreference(
      weatherPool.filter((item) => ["Parka", "Puffer jacket"].includes(item.style)),
      context.stylePreference,
    );
    if (coldWeatherCoats.length) return coldWeatherCoats[0];
  }

  if (group === "jacket" && context.weather === "rainy") {
    return chooseWeatherPriorityItem(weatherPool, context);
  }

  if (group === "shoes" && ["rainy", "snowy"].includes(context.weather)) {
    return chooseWeatherPriorityItem(weatherPool, context, (item) => item.style === "Boots");
  }

  const exactTheme = weatherPool.filter((item) => item.theme === context.theme);
  if (!exactTheme.length) return null;
  const finalPool = rankItemsByStylePreference(exactTheme, context.stylePreference);
  return finalPool[0] || null;
}

function chooseWeatherPriorityItem(items, context, priorityFilter = null) {
  const priorityItems = priorityFilter ? items.filter(priorityFilter) : items;
  const pool = priorityItems.length ? priorityItems : items;
  const exactTheme = pool.filter((item) => item.theme === context.theme);
  const themePool = exactTheme.length ? exactTheme : pool;
  const finalPool = rankItemsByStylePreference(themePool, context.stylePreference);
  return finalPool[0] || null;
}

function rankItemsByStylePreference(items, stylePreference) {
  const styleMatches = items.filter((item) => {
    const descriptor = `${item.name} ${describeStyle(item)}`.toLowerCase();
    return descriptor.includes(stylePreference.toLowerCase());
  });
  return [
    ...styleMatches,
    ...items.filter((item) => !styleMatches.includes(item)),
  ];
}

function chooseAccessoryItems(context) {
  const allowedTypes = typeGroups.accessories;
  const typedItems = state.closet.filter((item) => allowedTypes.includes(item.type));
  const weatherPool = filterWeatherEligibleItems(typedItems, "accessories", context);
  if (!weatherPool.length) return [];
  const styleMatches = weatherPool.filter((item) => {
    const descriptor = `${item.name} ${describeStyle(item)}`.toLowerCase();
    return descriptor.includes(context.stylePreference.toLowerCase());
  });
  const finalPool = [
    ...styleMatches,
    ...weatherPool.filter((item) => !styleMatches.includes(item)),
  ];
  const accessoriesByStyle = new Map();

  finalPool.forEach((item) => {
    if (!accessoriesByStyle.has(item.style)) {
      accessoriesByStyle.set(item.style, item);
    }
  });

  return [...accessoriesByStyle.values()];
}

function filterWeatherEligibleItems(items, group, context) {
  return items.filter((item) => isWeatherEligibleItem(item, group, context));
}

function isWeatherEligibleItem(item, group, context) {
  const temperature = context.effectiveTemperature;

  if (group === "top") {
    return isWeatherEligibleTop(item, temperature, context.layerItem);
  }

  if (group === "bottom") {
    return isWeatherEligibleBottom(item, temperature);
  }

  if (group === "jacket") {
    return isWeatherEligibleJacket(item, temperature, context.weather);
  }

  if (group === "accessories") {
    return isWeatherEligibleAccessory(item, temperature, context.weather);
  }

  if (group === "shoes") {
    return isWeatherEligibleShoes(item, temperature, context.weather);
  }

  return true;
}

function isWeatherEligibleTop(item, temperature, layerItem = null) {
  if (item.type === "Sweaters") {
    return temperature >= 51 && temperature <= 70;
  }

  if (item.type !== "Shirts") return true;

  const sleeveLength = item.sleeveLength || defaultSleeveLengthForShirt(item);
  const isShortSleeve = sleeveLength === "Short sleeve";
  const isLongSleeve = sleeveLength === "Long sleeve";
  const pairedWithJacket = Boolean(layerItem) && layerItem.type === "Jackets";

  if (isShortSleeve) {
    return temperature >= 71 || (pairedWithJacket && temperature >= 40 && temperature <= 50);
  }

  if (isLongSleeve) {
    return temperature <= 60;
  }

  return true;
}

function defaultSleeveLengthForShirt(item) {
  return item.style === "Blouse" || item.style === "Button Up" ? "Long sleeve" : "Short sleeve";
}

function isWeatherEligibleBottom(item, temperature) {
  if (item.type === "Shorts") {
    return temperature >= 60;
  }

  if (item.type === "Pants") {
    return temperature <= 60;
  }

  if (item.type === "Skirts") {
    const skirtLength = item.skirtLength || "Knee";
    if (["Mini", "Knee"].includes(skirtLength)) {
      return temperature >= 71;
    }

    return temperature >= 60;
  }

  return true;
}

function isWeatherEligibleJacket(item, temperature, weather) {
  if (item.type !== "Jackets") return true;

  if (weather === "snowy") {
    return ["Parka", "Puffer jacket"].includes(item.style);
  }

  if (weather === "rainy" && temperature > 40) {
    return !["Parka", "Puffer jacket"].includes(item.style);
  }

  if (temperature >= 70) return false;

  if (["Parka", "Puffer jacket"].includes(item.style)) {
    return temperature <= 40;
  }

  if (item.style === "Vest") {
    return temperature >= 65 && temperature < 70;
  }

  return temperature >= 40 && temperature <= 65;
}

function isWeatherEligibleAccessory(item, temperature, weather) {
  if (item.style === "Sunglasses") {
    return weather === "sunny";
  }

  if (item.style === "Scarf") {
    return temperature <= 40;
  }

  return true;
}

function isWeatherEligibleShoes(item, temperature, weather) {
  if (weather === "rainy" || weather === "snowy") {
    return isClosedToeShoe(item);
  }

  if (["Flip-flops", "Slides", "Wedges"].includes(item.style)) {
    return temperature >= 60;
  }

  if (item.style === "Boots") {
    return temperature <= 60;
  }

  return true;
}

function isClosedToeShoe(item) {
  return !["Flip-flops", "Slides", "Wedges"].includes(item.style);
}

function getMissingRequiredOutfitCategories({ topItem, bottomItem, shoesItem }) {
  return [
    hasClosetItemsForGroup("top") && !topItem ? "top" : "",
    hasClosetItemsForGroup("bottom") && !bottomItem ? "bottom" : "",
    hasClosetItemsForGroup("shoes") && !shoesItem ? "shoes" : "",
  ].filter(Boolean);
}

function hasClosetItemsForGroup(group) {
  return state.closet.some((item) => typeGroups[group].includes(item.type));
}

function maybeAlertWeatherMismatch({ missingRequiredCategories, effectiveTemperature, weather, theme }) {
  const missingWeatherMatch = missingRequiredCategories.length > 0;

  if (!missingWeatherMatch) return;

  const alertKey = `${effectiveTemperature}-${weather}-${missingRequiredCategories.join("-")}`;
  if (state.lastWeatherMismatchAlertKey === alertKey) return;

  state.lastWeatherMismatchAlertKey = alertKey;
  showAppAlert(buildWeatherMismatchMessage(missingRequiredCategories, { effectiveTemperature, theme }));
}

function buildWeatherMismatchMessage(missingRequiredCategories, context) {
  const missingLabels = missingRequiredCategories.map((category) => formatMissingCategoryLabel(category, context));
  const missingText = missingLabels.length === 1
    ? missingLabels[0]
    : `${missingLabels.slice(0, -1).join(", ")} and ${missingLabels.at(-1)}`;

  return {
    guidance: "Add more clothes relative to current temperature. ",
    missing: `Missing: ${missingText}.`,
  };
}

function formatMissingCategoryLabel(category, { effectiveTemperature, theme }) {
  const weatherBand = describeTemperatureBand(effectiveTemperature);
  const themeLabel = theme ? `${theme.toLowerCase()} ` : "";

  if (category === "top") {
    return `${themeLabel}${describeNeededTop(effectiveTemperature)} for ${weatherBand}`;
  }

  if (category === "bottom") {
    return `${themeLabel}${describeNeededBottom(effectiveTemperature)} for ${weatherBand}`;
  }

  if (category === "shoes") {
    return `${themeLabel}${describeNeededShoes(effectiveTemperature)} for ${weatherBand}`;
  }

  return category;
}

function describeTemperatureBand(temperature) {
  if (temperature <= 50) return "cold weather";
  if (temperature <= 70) return "cool weather";
  return "warm weather";
}

function describeNeededTop(temperature) {
  if (temperature <= 50) return "long sleeve shirt / jacket-friendly top";
  if (temperature <= 70) return "sweater / long sleeve shirt";
  return "short sleeve shirt";
}

function describeNeededBottom(temperature) {
  if (temperature <= 60) return "pants";
  if (temperature <= 70) return "shorts / longer skirt";
  return "shorts / skirt";
}

function describeNeededShoes(temperature) {
  if (temperature <= 60) return "boots / closed-toe shoes";
  return "warm-weather shoes";
}

function showAppAlert(message) {
  if (!elements.appAlert || !elements.appAlertMessage) return;

  elements.appAlertMessage.innerHTML = typeof message === "string"
    ? message
    : `<span>${message.guidance}</span><span>${message.missing}</span>`;
  elements.appAlert.classList.remove("is-hidden");
  elements.appAlertClose?.focus();
}

function closeAppAlert() {
  elements.appAlert?.classList.add("is-hidden");
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
        resolveTopRenderMode(topItem, layerItem, overallsActive),
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

function resolveTopRenderMode(topItem, layerItem, overallsActive) {
  if (overallsActive) return "sleeves-only";
  if (shouldHideTopSleevesUnderLayer(topItem, layerItem)) return "body-only";
  return "full";
}

function shouldHideTopSleevesUnderLayer(topItem, layerItem) {
  if (!topItem || !layerItem) return false;
  if (!["Leather jacket", "Cardigan"].includes(layerItem.style)) return false;
  return resolveTopSilhouette(topItem).startsWith("long-sleeve");
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
  if (bias === "runs_cold") return temperature - 10;
  if (bias === "runs_hot") return temperature + 10;
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
  const displayName = getDisplayItemName(item);
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

function getDisplayItemName(item) {
  const normalizedName = normalizeDescriptionText(item.name);
  const typeNoun = displayTypeNoun(item);

  if (item.type === "Skirts") {
    const skirtName = getSkirtDisplayName(item, normalizedName);
    return normalizeDescriptionText(skirtName).includes("skirt") ? skirtName : `${skirtName} ${typeNoun}`;
  }

  if (!typeNoun || normalizedName.includes(normalizeDescriptionText(typeNoun))) {
    return item.name;
  }

  return `${item.name} ${typeNoun}`;
}

function displayTypeNoun(item) {
  const typeNouns = {
    Shirts: "Shirt",
    Shorts: "Shorts",
    Pants: "Pants",
    Skirts: "Skirt",
    Sweaters: "Sweater",
    Jackets: "Jacket",
  };

  return typeNouns[item.type] || "";
}

function getSkirtDisplayName(item, normalizedName = normalizeDescriptionText(item.name)) {
  if (!item.skirtLength) return item.name;

  const lengthLabel = `${item.skirtLength}-length`;
  const normalizedLength = normalizeDescriptionText(item.skirtLength);
  const normalizedLengthLabel = normalizeDescriptionText(lengthLabel);

  if (normalizedName.includes(normalizedLengthLabel)) {
    return item.name;
  }

  if (normalizedName.includes(normalizedLength)) {
    return item.name.replace(new RegExp(`\\b${escapeRegExp(item.skirtLength)}\\b`, "i"), lengthLabel);
  }

  return `${item.name} ${lengthLabel}`;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function describeStyle(item) {
  const styleNotes = [item.style];
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

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatLabel(value) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}
