import {
  detectClothingPatternType,
  renderAccessorySvg,
  renderBottomSvg,
  renderDressSvg,
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

// closet/profile/favoriteOutfits keys are no longer the source of truth (the API is) —
// they're only read from for the one-time legacy-data import offered after first login.
const STORAGE_KEYS = {
  closet: "quickfit-closet",
  profile: "quickfit-profile",
  lastLocation: "quickfit-last-location",
  favoriteOutfits: "quickfit-favorite-outfits",
  authToken: "quickfit-auth-token",
  importPrompted: "quickfit-import-prompted",
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
  Dresses: [
    "Sundress",
    "Maxi dress",
    "Slip dress",
    "Wrap dress",
    "Shift dress",
    "Shirt dress",
    "Sweater dress",
    "Cocktail dress",
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
  top: ["Shirts", "Sweaters", "Dresses"],
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

// Populated post-login by hydrateStateFromApi() — the server is the source of truth now,
// so there's nothing to read from localStorage here anymore.
const state = {
  closet: [],
  profile: { ...defaultProfile },
  weatherLocation: null,
  favoriteOutfits: [],
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
  plannerSubtabButtons: document.querySelectorAll("[data-planner-tab]"),
  plannerDayPanel: document.querySelector("#planner-day-panel"),
  plannerHourlyPanel: document.querySelector("#planner-hourly-panel"),
  hourlyPlannerForm: document.querySelector("#hourly-planner-form"),
  hourlyOutfitDate: document.querySelector("#hourly-outfit-date"),
  hourlyWeatherStatus: document.querySelector("#hourly-weather-status"),
  hourlySlotSelect: document.querySelector("#hourly-slot"),
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
  dressLengthField: document.querySelector("#dress-length-field"),
  dressLengthSelect: document.querySelector("#dressLength"),
  sleeveLengthField: document.querySelector("#sleeve-length-field"),
  sleeveLengthSelect: document.querySelector("#sleeveLength"),
  colorSelect: document.querySelector("#color"),
  customColorField: document.querySelector("#custom-color-field"),
  customColorInput: document.querySelector("#customColor"),
  patternTypeSelect: document.querySelector("#pattern-type"),
  patternCustomField: document.querySelector("#pattern-custom-field"),
  patternCustomInput: document.querySelector("#patternCustom"),
  patternHint: document.querySelector("#pattern-hint"),
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
  clearAllDataButton: document.querySelector("#clear-all-data"),
  deleteAccountButton: document.querySelector("#delete-account"),
  savedOutfitsList: document.querySelector("#saved-outfits-list"),
  appAlert: document.querySelector("#app-alert"),
  appAlertEyebrow: document.querySelector("#app-alert-eyebrow"),
  appAlertTitle: document.querySelector("#app-alert-title"),
  appAlertMessage: document.querySelector("#app-alert-message"),
  appAlertClose: document.querySelector("#app-alert-close"),
  appAlertCancel: document.querySelector("#app-alert-cancel"),
  feedbackForm: document.querySelector("#feedback-form"),
  feedbackCategory: document.querySelector("#feedback-category"),
  feedbackMessage: document.querySelector("#feedback-message"),
  feedbackEmail: document.querySelector("#feedback-email"),
  feedbackSubmit: document.querySelector("#feedback-submit"),
  feedbackStatus: document.querySelector("#feedback-status"),
  photoUploadInput: document.querySelector("#photo-upload-input"),
  photoUploadStatus: document.querySelector("#photo-upload-status"),
  photoUploadPreview: document.querySelector("#photo-upload-preview"),
  photoUploadThumb: document.querySelector("#photo-upload-thumb"),
  photoUploadRemove: document.querySelector("#photo-upload-remove"),
  photoUploadProgress: document.querySelector("#photo-upload-progress"),
  photoUploadProgressBar: document.querySelector("#photo-upload-progress-bar"),
  photoModeSingleButton: document.querySelector("#photo-mode-single"),
  photoModeClosetButton: document.querySelector("#photo-mode-closet"),
  photoUploadDescription: document.querySelector("#photo-upload-description"),
  photoUploadSpecs: document.querySelector("#photo-upload-specs"),
  photoQueue: document.querySelector("#photo-queue"),
  photoQueueLabel: document.querySelector("#photo-queue-label"),
  photoQueueSkipButton: document.querySelector("#photo-queue-skip"),
  photoQueueStopButton: document.querySelector("#photo-queue-stop"),
  closetSaveButton: document.querySelector("#closet-save-button"),
  authGate: document.querySelector("#auth-gate"),
  authGateTitle: document.querySelector("#auth-gate-title"),
  authForm: document.querySelector("#auth-form"),
  authEmailInput: document.querySelector("#auth-email"),
  authPasswordInput: document.querySelector("#auth-password"),
  authConfirmField: document.querySelector("#auth-confirm-field"),
  authConfirmInput: document.querySelector("#auth-confirm-password"),
  authStatus: document.querySelector("#auth-status"),
  authSubmit: document.querySelector("#auth-submit"),
  authModeToggle: document.querySelector("#auth-mode-toggle"),
  accountEmail: document.querySelector("#account-email"),
  logOutButton: document.querySelector("#log-out"),
};

let pendingModalConfirm = null;
let pendingClosetPhoto = null;
let photoUploadMode = "single";
let pendingPhotoQueue = [];
let pendingPhotoQueueTotal = 0;
const MAX_CLOSET_QUEUE_ITEMS = 20;

let authMode = "login";
let resolveAuthGate = null;
let currentAccountEmail = "";

const PHOTO_UPLOAD_COPY = {
  single: {
    description: "Upload a picture of the item and QuickFit will suggest the fields below for you to review before saving.",
    specs: [
      "One clothing item per photo",
      "Laid flat, on a hanger, or on a mannequin — not worn by a person",
      "Good lighting, plain background, item fills most of the frame",
    ],
  },
  closet: {
    description: "Upload a photo of a closet, rack, or shelf and QuickFit will suggest items one at a time for you to review and save.",
    specs: [
      "Photograph a section of hanging clothes or a shelf",
      "Non-clothing items (boxes, luggage, bags) are ignored automatically",
      "Heavily overlapping or hidden items may be missed — review each suggestion before saving",
    ],
  },
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
  bindAuthEvents();

  await ensureAuthenticated();
  await hydrateStateFromApi();

  renderCloset();
  renderProfile();
  generateRecommendation(getPlannerState());
  await initializeWeatherAccess();
  await maybeOfferLocalImport();
}

function getApiBase() {
  const endpoint = typeof window.QUICKFIT_PHOTO_ANALYSIS_ENDPOINT === "string"
    ? window.QUICKFIT_PHOTO_ANALYSIS_ENDPOINT.trim()
    : "";
  return endpoint.replace(/\/$/, "");
}

function getAuthToken() {
  return localStorage.getItem(STORAGE_KEYS.authToken) || "";
}

function setAuthToken(token) {
  localStorage.setItem(STORAGE_KEYS.authToken, token);
}

function clearAuthToken() {
  localStorage.removeItem(STORAGE_KEYS.authToken);
}

async function authFetch(path, options = {}) {
  const base = getApiBase();
  if (!base) {
    throw new Error("QuickFit's backend isn't configured for this deployment yet.");
  }

  const token = getAuthToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";

  const response = await fetch(`${base}${path}`, { ...options, headers });

  if (response.status === 401) {
    clearAuthToken();
    showAuthGate("login", "Your session expired. Please log in again.");
    throw new Error("Not authenticated.");
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch (_error) {
      // Keep the default message if the error body isn't JSON.
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

function showAuthGate(mode = "login", statusMessage = "") {
  authMode = mode;
  elements.authGate?.classList.remove("is-hidden");
  syncAuthModeUi();
  if (elements.authStatus) elements.authStatus.textContent = statusMessage;
}

function hideAuthGate() {
  elements.authGate?.classList.add("is-hidden");
}

function syncAuthModeUi() {
  const isSignup = authMode === "signup";
  if (elements.authGateTitle) elements.authGateTitle.textContent = isSignup ? "Create your account" : "Log in";
  if (elements.authSubmit) elements.authSubmit.textContent = isSignup ? "Create Account" : "Log In";
  elements.authConfirmField?.classList.toggle("is-hidden", !isSignup);
  if (elements.authConfirmInput) elements.authConfirmInput.required = isSignup;
  if (elements.authModeToggle) {
    elements.authModeToggle.textContent = isSignup
      ? "Already have an account? Log in"
      : "Don't have an account? Sign up";
  }
}

function bindAuthEvents() {
  elements.authModeToggle?.addEventListener("click", () => {
    authMode = authMode === "signup" ? "login" : "signup";
    if (elements.authStatus) elements.authStatus.textContent = "";
    syncAuthModeUi();
  });

  elements.authForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = elements.authEmailInput.value.trim();
    const password = elements.authPasswordInput.value;

    if (authMode === "signup" && password !== elements.authConfirmInput.value) {
      elements.authStatus.textContent = "Passwords don't match.";
      return;
    }

    elements.authSubmit.disabled = true;
    elements.authStatus.textContent = authMode === "signup" ? "Creating your account..." : "Logging in...";

    try {
      const path = authMode === "signup" ? "/auth/signup" : "/auth/login";
      const data = await authFetch(path, { method: "POST", body: JSON.stringify({ email, password }) });
      setAuthToken(data.token);
      currentAccountEmail = data.user?.email || "";
      elements.authForm.reset();
      hideAuthGate();
      resolveAuthGate?.();
      resolveAuthGate = null;
    } catch (error) {
      elements.authStatus.textContent = error.message || "Something went wrong. Please try again.";
    } finally {
      elements.authSubmit.disabled = false;
    }
  });

  elements.logOutButton?.addEventListener("click", async () => {
    try {
      await authFetch("/auth/logout", { method: "POST" });
    } catch (_error) {
      // Log out locally regardless of whether the network call succeeded.
    }
    clearAuthToken();
    window.location.reload();
  });
}

async function ensureAuthenticated() {
  const token = getAuthToken();
  let authenticated = false;

  if (token) {
    try {
      const { user } = await authFetch("/auth/session");
      currentAccountEmail = user?.email || "";
      authenticated = true;
    } catch (_error) {
      authenticated = false;
    }
  }

  if (authenticated) return;

  showAuthGate("login");
  await new Promise((resolve) => {
    resolveAuthGate = resolve;
  });
}

async function hydrateStateFromApi() {
  const [closetData, profileData, favoritesData] = await Promise.all([
    authFetch("/closet"),
    authFetch("/profile"),
    authFetch("/favorites"),
  ]);

  state.closet = closetData?.items || [];
  state.profile = normalizeProfile(profileData || defaultProfile);
  state.favoriteOutfits = favoritesData?.outfits || [];

  if (elements.accountEmail) {
    elements.accountEmail.textContent = currentAccountEmail ? `Signed in as ${currentAccountEmail}` : "";
  }
}

async function maybeOfferLocalImport() {
  if (state.closet.length) return;
  if (localStorage.getItem(STORAGE_KEYS.importPrompted)) return;

  const localCloset = loadCollection(STORAGE_KEYS.closet, []);
  localStorage.setItem(STORAGE_KEYS.importPrompted, "true");
  if (!Array.isArray(localCloset) || !localCloset.length) return;

  showAppModal({
    eyebrow: "Import closet",
    title: "Import your existing closet?",
    message: `We found ${localCloset.length} item${localCloset.length === 1 ? "" : "s"} saved on this device from before accounts existed. Import them into your account?`,
    confirmLabel: "Import",
    cancelLabel: "Skip",
    onConfirm: async () => {
      try {
        await authFetch("/closet/import", { method: "POST", body: JSON.stringify({ items: localCloset }) });

        const localFavorites = loadCollection(STORAGE_KEYS.favoriteOutfits, []);
        if (Array.isArray(localFavorites) && localFavorites.length) {
          await Promise.all(localFavorites.map((outfit) => (
            authFetch("/favorites", { method: "POST", body: JSON.stringify(outfit) }).catch(() => null)
          )));
        }

        await hydrateStateFromApi();
        populateClosetFilter();
        renderCloset();
        renderProfile();
        generateRecommendation(getPlannerState());
      } catch (_error) {
        showAppModal({
          eyebrow: "Import closet",
          title: "Import failed",
          message: "Something went wrong importing your closet. You can try again by signing out and back in.",
        });
      }
    },
  });
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

  if ("permissions" in navigator && typeof navigator.permissions.query === "function") {
    try {
      const geolocationPermission = await navigator.permissions.query({ name: "geolocation" });

      if (geolocationPermission.state === "denied") {
        elements.weatherStatus.textContent = "Location access is blocked in browser settings, so QuickFit is using manual defaults.";
        return;
      }
    } catch (_error) {
      // Ignore permissions API failures and fall through to requesting location directly.
    }
  }

  elements.weatherStatus.textContent = "Checking your local weather for the default planner values.";
  await loadCurrentWeatherDefaults(false);
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

  elements.appAlertClose?.addEventListener("click", () => {
    const confirmCallback = pendingModalConfirm;
    closeAppAlert();
    confirmCallback?.();
  });
  elements.appAlertCancel?.addEventListener("click", closeAppAlert);
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

  elements.plannerSubtabButtons.forEach((button) => {
    button.addEventListener("click", () => setActivePlannerTab(button.dataset.plannerTab));
  });

  elements.hourlyOutfitDate?.addEventListener("change", () => {
    loadHourlyForecastOptions();
  });

  elements.hourlyPlannerForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const plannerState = getHourlyPlannerState();
    if (!plannerState) return;
    generateRecommendation(plannerState);
  });

  elements.typeSelect.addEventListener("change", (event) => {
    updateStyleOptions(event.target.value);
    syncConditionalFields();
  });

  elements.styleSelect.addEventListener("change", syncConditionalFields);
  elements.colorSelect.addEventListener("change", syncConditionalFields);
  elements.patternTypeSelect?.addEventListener("change", syncConditionalFields);
  elements.patternCustomInput?.addEventListener("input", updatePatternHint);
  elements.toggleTuckButton.addEventListener("click", () => {
    state.mannequinControls.tuckedIn = !state.mannequinControls.tuckedIn;
    generateRecommendation(getPlannerState());
  });
  elements.toggleJacketButton.addEventListener("click", () => {
    state.mannequinControls.jacketClosed = !state.mannequinControls.jacketClosed;
    generateRecommendation(getPlannerState());
  });

  elements.closetForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const item = buildClosetItem(formData);
    if (!item) return;

    elements.closetSaveButton.disabled = true;
    let savedItem;
    try {
      const response = await authFetch("/closet", {
        method: "POST",
        body: JSON.stringify({ ...item, photo: pendingClosetPhoto }),
      });
      savedItem = response.item;
    } catch (error) {
      showAppModal({
        eyebrow: "Closet",
        title: "Couldn't save item",
        message: error.message || "Something went wrong saving this item. Please try again.",
      });
      return;
    } finally {
      elements.closetSaveButton.disabled = false;
    }

    state.closet.unshift(savedItem);

    if (pendingPhotoQueue.length) {
      pendingPhotoQueue.shift();
      resetClosetFormFields();
      loadNextQueueItem();
    } else {
      resetClosetFormFields();
      clearPendingPhotoUpload();
    }

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

  elements.profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const profilePayload = Object.fromEntries(new FormData(event.currentTarget).entries());

    try {
      const { profile } = await authFetch("/profile", { method: "PUT", body: JSON.stringify(profilePayload) });
      state.profile = profile;
    } catch (error) {
      showAppModal({
        eyebrow: "Profile",
        title: "Couldn't save profile",
        message: error.message || "Something went wrong saving your profile. Please try again.",
      });
      return;
    }

    renderProfile();
    generateRecommendation(getPlannerState());
  });

  elements.resetProfileButton.addEventListener("click", () => {
    showAppModal({
      eyebrow: "Profile",
      title: "Reset your profile?",
      message: "This clears your temperature preference, style direction, and presentation preference back to their defaults. Your closet and saved outfits are not affected.",
      confirmLabel: "Reset Profile",
      cancelLabel: "Cancel",
      onConfirm: async () => {
        await resetProfileOnly();
        showAppModal({
          eyebrow: "Profile",
          title: "Profile reset",
          message: "Your profile preferences are back to their defaults.",
          confirmLabel: "OK",
        });
      },
    });
  });

  elements.clearAllDataButton?.addEventListener("click", () => {
    showAppModal({
      eyebrow: "Danger zone",
      title: "Clear all data?",
      message: "This permanently deletes every closet item and saved outfit on this device. This can't be undone.",
      confirmLabel: "Clear All Data",
      cancelLabel: "Cancel",
      onConfirm: async () => {
        await clearAllDataOnly();
        showAppModal({
          eyebrow: "Danger zone",
          title: "All data cleared",
          message: "Your closet and saved outfits have been removed from this device.",
          confirmLabel: "OK",
        });
      },
    });
  });

  elements.deleteAccountButton?.addEventListener("click", () => {
    showAppModal({
      eyebrow: "Danger zone",
      title: "Delete your account?",
      message: "This permanently deletes your QuickFit account, login, closet, and saved outfits. This can't be undone.",
      confirmLabel: "Delete Account",
      cancelLabel: "Cancel",
      onConfirm: async () => {
        try {
          await authFetch("/auth/account", { method: "DELETE" });
        } catch (error) {
          showAppModal({
            eyebrow: "Danger zone",
            title: "Couldn't delete account",
            message: error.message || "Something went wrong. Please try again.",
          });
          return;
        }
        clearAuthToken();
        window.location.reload();
      },
    });
  });

  elements.favoriteOutfitButton.addEventListener("click", () => {
    toggleFavoriteCurrentOutfit();
  });

  elements.feedbackForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    submitFeedback(new FormData(event.currentTarget));
  });

  elements.photoUploadInput?.addEventListener("change", (event) => {
    const [file] = event.target.files || [];
    if (file) handlePhotoUpload(file);
  });

  elements.photoUploadRemove?.addEventListener("click", () => {
    clearPendingPhotoUpload();
    elements.photoUploadStatus.textContent = "Photo removed. Fill in the fields below manually, or choose another photo.";
  });

  elements.photoModeSingleButton?.addEventListener("click", () => setPhotoUploadMode("single"));
  elements.photoModeClosetButton?.addEventListener("click", () => setPhotoUploadMode("closet"));

  elements.photoQueueSkipButton?.addEventListener("click", () => {
    if (!pendingPhotoQueue.length) return;
    pendingPhotoQueue.shift();
    resetClosetFormFields();
    loadNextQueueItem();
  });

  elements.photoQueueStopButton?.addEventListener("click", () => {
    stopPhotoQueue();
    elements.photoUploadStatus.textContent = "Stopped reviewing. Remaining items were discarded.";
  });
}

async function resetProfileOnly() {
  try {
    const { profile } = await authFetch("/profile", { method: "PUT", body: JSON.stringify(defaultProfile) });
    state.profile = profile;
  } catch (_error) {
    state.profile = { ...defaultProfile };
  }

  elements.profileForm.reset();
  elements.stylePreferenceSelect.value = defaultProfile.profileStyle;
  renderProfile();
  generateRecommendation(getPlannerState());
}

async function clearAllDataOnly() {
  await Promise.all([
    ...state.closet.map((item) => authFetch(`/closet/${item.id}`, { method: "DELETE" }).catch(() => null)),
    ...state.favoriteOutfits.map((outfit) => authFetch(`/favorites/${outfit.id}`, { method: "DELETE" }).catch(() => null)),
  ]);

  state.closet = [];
  state.favoriteOutfits = [];
  state.currentRecommendation = null;
  state.mannequinControls = {
    tuckedIn: false,
    jacketClosed: false,
  };
  state.weatherLocation = null;

  localStorage.removeItem(STORAGE_KEYS.lastLocation);

  elements.closetForm.reset();
  elements.typeSelect.selectedIndex = 0;
  elements.colorSelect.selectedIndex = 0;
  clearPendingPhotoUpload();
  setClosetFavoriteFilter("all");
  populateOutfitDate();
  updateStyleOptions(elements.typeSelect.value);
  syncConditionalFields();
  populateClosetFilter();
  renderCloset();
  renderSavedOutfits();
  generateRecommendation(getPlannerState());
  await loadWeatherDefaultsForSelection(false);
}

function setActiveSection(sectionId) {
  elements.sections.forEach((section) => {
    section.classList.toggle("is-active", section.id === sectionId);
  });

  elements.navButtons.forEach((button) => {
    const isActive = button.dataset.section === sectionId;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-current", isActive ? "page" : "false");
  });

  document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setActivePlannerTab(tab) {
  elements.plannerSubtabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.plannerTab === tab);
  });
  elements.plannerDayPanel?.classList.toggle("is-active", tab === "day");
  elements.plannerDayPanel?.classList.toggle("is-hidden", tab !== "day");
  elements.plannerHourlyPanel?.classList.toggle("is-active", tab === "hourly");
  elements.plannerHourlyPanel?.classList.toggle("is-hidden", tab !== "hourly");

  if (tab === "hourly") {
    if (!elements.hourlyOutfitDate.value) elements.hourlyOutfitDate.value = elements.outfitDate.value;
    loadHourlyForecastOptions();
  }
}

async function loadHourlyForecastOptions() {
  if (!elements.hourlySlotSelect) return;

  if (!state.weatherLocation) {
    elements.hourlyWeatherStatus.textContent = 'Location needed — click "Use My Current Weather" on the Day Overview tab first.';
    elements.hourlySlotSelect.innerHTML = "";
    elements.hourlySlotSelect.disabled = true;
    return;
  }

  const selectedDate = elements.hourlyOutfitDate.value
    ? new Date(`${elements.hourlyOutfitDate.value}T12:00:00`)
    : new Date();

  elements.hourlyWeatherStatus.textContent = "Loading hourly forecast...";
  elements.hourlySlotSelect.disabled = true;

  try {
    const forecastData = await fetchForecastWeather(state.weatherLocation.latitude, state.weatherLocation.longitude);
    const dayEntries = forecastData.list.filter((entry) => isSameForecastDay(entry.dt, selectedDate));

    if (!dayEntries.length) {
      elements.hourlyWeatherStatus.textContent = "No forecast slots are available for that date yet (forecasts only cover the next few days).";
      elements.hourlySlotSelect.innerHTML = "";
      return;
    }

    elements.hourlySlotSelect.innerHTML = "";
    dayEntries.forEach((entry) => {
      const entryDate = new Date(entry.dt * 1000);
      const temperature = Math.round(entry.main.temp);
      const weatherCategory = mapWeatherCondition(
        entry.weather?.[0]?.main,
        entry.weather?.[0]?.description,
        entry.wind?.speed
      );
      const timeLabel = entryDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

      const option = document.createElement("option");
      option.textContent = `${timeLabel} · ${temperature}°F · ${capitalize(weatherCategory)}`;
      option.dataset.temperature = String(temperature);
      option.dataset.weather = weatherCategory;
      option.dataset.label = timeLabel;
      elements.hourlySlotSelect.append(option);
    });

    elements.hourlySlotSelect.disabled = false;
    elements.hourlyWeatherStatus.textContent = `Showing 3-hour forecast slots for ${formatDisplayDate(selectedDate)}.`;
  } catch (error) {
    elements.hourlyWeatherStatus.textContent = buildWeatherErrorMessage(error);
    elements.hourlySlotSelect.innerHTML = "";
  }
}

function getHourlyPlannerState() {
  const slotOption = elements.hourlySlotSelect.selectedOptions[0];
  if (!slotOption) {
    showAppModal({
      eyebrow: "Hourly planner",
      title: "Pick a time first",
      message: "Choose a date and time slot before generating an hourly recommendation.",
    });
    return null;
  }

  return {
    temperature: Number(slotOption.dataset.temperature),
    weather: slotOption.dataset.weather,
    season: elements.season.value,
    theme: document.querySelector("#theme").value,
    stylePreference: elements.stylePreferenceSelect.value,
    outfitDate: elements.hourlyOutfitDate.value,
    hour: slotOption.dataset.label,
  };
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
  maxDate.setDate(today.getDate() + 3);
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

const PATTERN_TYPE_LABELS = {
  stripes: "Stripes",
  dots: "Polka dot",
  plaid: "Plaid",
  floral: "Floral",
  chevron: "Chevron",
};

// Maps detectClothingPatternType()'s result to this form's <option value>, so an
// AI-suggested pattern (e.g. "Striped") lands on the matching dropdown option instead
// of silently failing to select anything on a <select>.
const PATTERN_TYPE_OPTION_VALUES = {
  stripes: "Stripes",
  dots: "Polka Dot",
  plaid: "Plaid",
  floral: "Floral",
  chevron: "Chevron",
};

function applySuggestedPattern(rawPattern) {
  if (!elements.patternTypeSelect) return;

  const detected = detectClothingPatternType(rawPattern);
  const optionValue = detected ? PATTERN_TYPE_OPTION_VALUES[detected] : null;

  if (optionValue) {
    elements.patternTypeSelect.value = optionValue;
  } else {
    elements.patternTypeSelect.value = "Other";
    if (elements.patternCustomInput) elements.patternCustomInput.value = rawPattern;
  }

  syncConditionalFields();
}

function updatePatternHint() {
  if (!elements.patternHint) return;

  if (elements.patternTypeSelect.value !== "Other") {
    elements.patternHint.textContent = "";
    return;
  }

  const rawPattern = elements.patternCustomInput.value.trim();
  if (!rawPattern) {
    elements.patternHint.textContent = "";
    return;
  }

  const patternType = detectClothingPatternType(rawPattern);
  if (!patternType) {
    elements.patternHint.textContent = "Will render as solid (no visible pattern).";
  } else if (patternType === "textured") {
    elements.patternHint.textContent = `Will render as a generic textured pattern (not a literal illustration of "${rawPattern}").`;
  } else {
    elements.patternHint.textContent = `Will render as: ${PATTERN_TYPE_LABELS[patternType] || patternType}.`;
  }
}

function syncConditionalFields() {
  const showCustomColor = elements.colorSelect.value === "Multicolor";
  const showCustomPattern = elements.patternTypeSelect?.value === "Other";
  const showClosetTheme = elements.typeSelect.value !== "Accessories";
  const showJewelrySubtype =
    elements.typeSelect.value === "Accessories" && elements.styleSelect.value === "Jewelry";
  const showSkirtLength = elements.typeSelect.value === "Skirts";
  const showDressLength = elements.typeSelect.value === "Dresses";
  const sleevelessShirtStyles = new Set(["Tank top", "Sleeveless shirt", "Sports bra", "Tube top"]);
  const showSleeveLength =
    (elements.typeSelect.value === "Shirts" && !sleevelessShirtStyles.has(elements.styleSelect.value)) ||
    elements.typeSelect.value === "Dresses";
  const sleeveLengthRequired = elements.typeSelect.value === "Shirts" && showSleeveLength;

  elements.customColorField.classList.toggle("is-hidden", !showCustomColor);
  elements.customColorInput.required = showCustomColor;
  if (!showCustomColor) elements.customColorInput.value = "";

  elements.patternCustomField?.classList.toggle("is-hidden", !showCustomPattern);
  if (!showCustomPattern && elements.patternCustomInput) elements.patternCustomInput.value = "";
  updatePatternHint();

  elements.closetThemeField.classList.toggle("is-hidden", !showClosetTheme);
  elements.closetThemeSelect.required = showClosetTheme;
  elements.closetThemeSelect.disabled = !showClosetTheme;

  elements.jewelryField.classList.toggle("is-hidden", !showJewelrySubtype);
  elements.jewelryTypeSelect.required = showJewelrySubtype;
  if (!showJewelrySubtype) elements.jewelryTypeSelect.value = "";

  elements.skirtLengthField.classList.toggle("is-hidden", !showSkirtLength);
  elements.skirtLengthSelect.required = showSkirtLength;
  if (!showSkirtLength) elements.skirtLengthSelect.value = "";

  elements.dressLengthField.classList.toggle("is-hidden", !showDressLength);
  elements.dressLengthSelect.required = showDressLength;
  if (!showDressLength) elements.dressLengthSelect.value = "";

  elements.sleeveLengthField.classList.toggle("is-hidden", !showSleeveLength);
  elements.sleeveLengthSelect.required = sleeveLengthRequired;
  if (!showSleeveLength) elements.sleeveLengthSelect.value = "";
}

function buildClosetItem(formData) {
  const rawItem = Object.fromEntries(formData.entries());
  const color = rawItem.color === "Multicolor" ? rawItem.customColor.trim() || "Multicolor" : rawItem.color;

  if (!color) return null;

  const pattern = rawItem.patternType === "Other"
    ? rawItem.patternCustom.trim()
    : rawItem.patternType === "Solid" ? "" : rawItem.patternType;

  return {
    name: buildAutoItemName({
      color,
      style: rawItem.style,
      jewelryType: rawItem.jewelryType || "",
    }),
    color,
    baseColor: rawItem.color,
    pattern,
    material: rawItem.material.trim(),
    type: rawItem.type,
    style: rawItem.style,
    skirtLength: rawItem.skirtLength || "",
    dressLength: rawItem.dressLength || "",
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

function setPhotoUploadMode(mode) {
  photoUploadMode = mode;
  elements.photoModeSingleButton?.classList.toggle("is-active", mode === "single");
  elements.photoModeClosetButton?.classList.toggle("is-active", mode === "closet");

  const copy = PHOTO_UPLOAD_COPY[mode];
  if (elements.photoUploadDescription) elements.photoUploadDescription.textContent = copy.description;
  if (elements.photoUploadSpecs) {
    elements.photoUploadSpecs.innerHTML = copy.specs.map((spec) => `<li>${spec}</li>`).join("");
  }
}

async function handlePhotoUpload(file) {
  let dataUrl;
  try {
    dataUrl = await readFileAsDataUrl(file);
    dataUrl = await resizeImageDataUrl(dataUrl);
  } catch (_error) {
    elements.photoUploadStatus.textContent = "Couldn't read that photo. Please try a different file.";
    return;
  }

  stopPhotoQueue({ clearPhoto: false });

  pendingClosetPhoto = dataUrl;
  elements.photoUploadThumb.src = dataUrl;
  elements.photoUploadPreview?.classList.remove("is-hidden");

  const endpoint = typeof window.QUICKFIT_PHOTO_ANALYSIS_ENDPOINT === "string"
    ? window.QUICKFIT_PHOTO_ANALYSIS_ENDPOINT.trim()
    : "";

  if (!endpoint) {
    elements.photoUploadStatus.textContent = "Photo attached. Auto-fill isn't configured yet, so fill in the fields below manually.";
    return;
  }

  elements.photoUploadStatus.textContent = "Uploading photo...";
  setUploadProgress(0);

  try {
    const suggestion = await requestPhotoAnalysis(endpoint, dataUrl, photoUploadMode, {
      onProgress: setUploadProgress,
      onUploadComplete: () => {
        setUploadIndeterminate();
        elements.photoUploadStatus.textContent = photoUploadMode === "closet"
          ? "Scanning closet photo for items..."
          : "Analyzing photo...";
      },
    });

    hideUploadProgress();

    if (photoUploadMode === "closet") {
      startPhotoQueue(Array.isArray(suggestion?.items) ? suggestion.items : []);
    } else {
      applyPhotoSuggestion(suggestion);
      elements.photoUploadStatus.textContent = suggestion?.photoIssue
        ? `${suggestion.photoIssue} Suggestions below may be off, consider a clearer photo (single item, laid flat/hung, no person).`
        : "Suggested fields filled in below, review them and Save to Closet.";
    }
  } catch (_error) {
    hideUploadProgress();
    elements.photoUploadStatus.textContent = "Couldn't auto-analyze this photo. Fill in the fields below manually.";
  }
}

function requestPhotoAnalysis(endpoint, dataUrl, mode, { onProgress, onUploadComplete } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress?.((event.loaded / event.total) * 100);
    });
    xhr.upload.addEventListener("load", () => onUploadComplete?.());

    xhr.addEventListener("load", () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(`Photo analysis endpoint responded with ${xhr.status}`));
        return;
      }
      try {
        resolve(JSON.parse(xhr.responseText));
      } catch (_error) {
        reject(new Error("Photo analysis endpoint returned malformed JSON."));
      }
    });
    xhr.addEventListener("error", () => reject(new Error("Network error while analyzing photo.")));

    xhr.send(JSON.stringify({ image: dataUrl, mode }));
  });
}

function setUploadProgress(percent) {
  if (!elements.photoUploadProgress || !elements.photoUploadProgressBar) return;
  elements.photoUploadProgress.classList.remove("is-hidden", "is-indeterminate");
  elements.photoUploadProgressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
}

function setUploadIndeterminate() {
  if (!elements.photoUploadProgress || !elements.photoUploadProgressBar) return;
  elements.photoUploadProgress.classList.remove("is-hidden");
  elements.photoUploadProgress.classList.add("is-indeterminate");
  elements.photoUploadProgressBar.style.width = "";
}

function hideUploadProgress() {
  elements.photoUploadProgress?.classList.add("is-hidden");
  elements.photoUploadProgress?.classList.remove("is-indeterminate");
  if (elements.photoUploadProgressBar) elements.photoUploadProgressBar.style.width = "0%";
}

function startPhotoQueue(items) {
  pendingPhotoQueue = items.slice(0, MAX_CLOSET_QUEUE_ITEMS);
  pendingPhotoQueueTotal = pendingPhotoQueue.length;

  if (!pendingPhotoQueue.length) {
    elements.photoUploadStatus.textContent = "Couldn't find any clear clothing items in that photo. Try a closer, better-lit shot.";
    return;
  }

  elements.photoUploadStatus.textContent =
    `Found ${pendingPhotoQueue.length} item${pendingPhotoQueue.length === 1 ? "" : "s"}. Review each below, then Save & Next.`;
  loadNextQueueItem();
}

function loadNextQueueItem() {
  if (!pendingPhotoQueue.length) {
    stopPhotoQueue();
    elements.photoUploadStatus.textContent = "All done reviewing this closet photo.";
    return;
  }

  const next = pendingPhotoQueue[0];
  applyPhotoSuggestion(next);

  const position = pendingPhotoQueueTotal - pendingPhotoQueue.length + 1;
  if (elements.photoQueueLabel) {
    elements.photoQueueLabel.textContent = `Item ${position} of ${pendingPhotoQueueTotal}${next.label ? `: ${next.label}` : ""}`;
  }
  elements.photoQueue?.classList.remove("is-hidden");
  if (elements.closetSaveButton) elements.closetSaveButton.textContent = "Save & Next";
}

function stopPhotoQueue({ clearPhoto = true } = {}) {
  pendingPhotoQueue = [];
  pendingPhotoQueueTotal = 0;
  elements.photoQueue?.classList.add("is-hidden");
  if (elements.closetSaveButton) elements.closetSaveButton.textContent = "Save to Closet";
  resetClosetFormFields();
  if (clearPhoto) clearPendingPhotoUpload();
}

function resetClosetFormFields() {
  elements.closetForm.reset();
  elements.typeSelect.selectedIndex = 0;
  elements.colorSelect.selectedIndex = 0;
  updateStyleOptions(elements.typeSelect.value);
  syncConditionalFields();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Real phone photos can be several MB, which D1 rejects outright (its per-value size
// limit sits well under that). Downscale before it's ever uploaded or stored, since a
// full-resolution photo is also pure waste for a small closet thumbnail.
function resizeImageDataUrl(dataUrl, maxDimension = 900, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      let { width, height } = image;
      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
          height = Math.round((height / width) * maxDimension);
          width = maxDimension;
        } else {
          width = Math.round((width / height) * maxDimension);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    image.onerror = () => reject(new Error("Couldn't decode that image."));
    image.src = dataUrl;
  });
}

function applyPhotoSuggestion(suggestion) {
  if (!suggestion || typeof suggestion !== "object") return;

  if (suggestion.type && clothingStyles[suggestion.type]) {
    elements.typeSelect.value = suggestion.type;
    updateStyleOptions(suggestion.type);
  }

  if (suggestion.style && clothingStyles[elements.typeSelect.value]?.includes(suggestion.style)) {
    elements.styleSelect.value = suggestion.style;
  }

  if (suggestion.color && colorOptions.includes(suggestion.color)) {
    elements.colorSelect.value = suggestion.color;
  } else if (suggestion.color) {
    elements.colorSelect.value = "Multicolor";
  }

  syncConditionalFields();

  if (suggestion.color && !colorOptions.includes(suggestion.color)) {
    elements.customColorInput.value = suggestion.color;
  }

  if (suggestion.pattern) applySuggestedPattern(suggestion.pattern);
  if (suggestion.material) elements.closetForm.material.value = suggestion.material;
  if (suggestion.theme && elements.typeSelect.value !== "Accessories") {
    elements.closetThemeSelect.value = suggestion.theme;
  }
  if (suggestion.skirtLength) elements.skirtLengthSelect.value = suggestion.skirtLength;
  if (suggestion.dressLength) elements.dressLengthSelect.value = suggestion.dressLength;
  if (suggestion.sleeveLength) elements.sleeveLengthSelect.value = suggestion.sleeveLength;
  if (suggestion.jewelryType) elements.jewelryTypeSelect.value = suggestion.jewelryType;
}

function clearPendingPhotoUpload() {
  pendingClosetPhoto = null;
  if (elements.photoUploadInput) elements.photoUploadInput.value = "";
  if (elements.photoUploadStatus) elements.photoUploadStatus.textContent = "";
  elements.photoUploadPreview?.classList.add("is-hidden");
  if (elements.photoUploadThumb) elements.photoUploadThumb.src = "";
}

async function describeFormspreeError(response) {
  try {
    const body = await response.json();
    if (Array.isArray(body?.errors) && body.errors.length) {
      return body.errors.map((error) => error.message).filter(Boolean).join(" ");
    }
  } catch (_error) {
    // Response wasn't JSON, fall through to the generic message below.
  }

  return "Something went wrong sending your feedback. Please try again in a moment.";
}

async function submitFeedback(formData) {
  const message = String(formData.get("message") || "").trim();
  if (!message) return;

  const endpoint = typeof window.QUICKFIT_FORMSPREE_ENDPOINT === "string"
    ? window.QUICKFIT_FORMSPREE_ENDPOINT.trim()
    : "";

  if (!endpoint) {
    elements.feedbackStatus.textContent = "Feedback delivery isn't configured yet. Please try again later.";
    return;
  }

  elements.feedbackSubmit.disabled = true;
  elements.feedbackStatus.textContent = "Sending your feedback...";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: formData,
    });

    if (!response.ok) throw new Error(await describeFormspreeError(response));

    elements.feedbackForm.reset();
    elements.feedbackStatus.textContent = "Thanks for the feedback, it's on its way to us.";
  } catch (error) {
    elements.feedbackStatus.textContent = error.message || "Something went wrong sending your feedback. Please try again in a moment.";
  } finally {
    elements.feedbackSubmit.disabled = false;
  }
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
        <div class="closet-card__identity">
          ${item.photo ? `<img class="closet-card__photo" src="${item.photo}" alt="${displayName}">` : ""}
          <div class="closet-card__title">${displayName}</div>
        </div>
        <div class="closet-card__actions">
          <button
            class="favorite-toggle ${item.isFavorite ? "is-active" : ""}"
            data-favorite-id="${item.id}"
            type="button"
            aria-pressed="${item.isFavorite ? "true" : "false"}"
            aria-label="${item.isFavorite ? "Remove from favorites" : "Add to favorites"}"
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

    card.querySelector("[data-delete-id]")?.addEventListener("click", async () => {
      try {
        await authFetch(`/closet/${item.id}`, { method: "DELETE" });
      } catch (error) {
        showAppModal({
          eyebrow: "Closet",
          title: "Couldn't remove item",
          message: error.message || "Something went wrong. Please try again.",
        });
        return;
      }
      state.closet = state.closet.filter((entry) => entry.id !== item.id);
      renderCloset();
      renderSavedOutfits();
      generateRecommendation(getPlannerState());
    });

    card.querySelector("[data-favorite-id]")?.addEventListener("click", async () => {
      const nextIsFavorite = !item.isFavorite;
      try {
        await authFetch(`/closet/${item.id}/favorite`, {
          method: "PATCH",
          body: JSON.stringify({ isFavorite: nextIsFavorite }),
        });
      } catch (error) {
        showAppModal({
          eyebrow: "Closet",
          title: "Couldn't update favorite",
          message: error.message || "Something went wrong. Please try again.",
        });
        return;
      }
      state.closet = state.closet.map((entry) => (
        entry.id === item.id ? { ...entry, isFavorite: nextIsFavorite } : entry
      ));
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
    item.type === "Dresses" && item.dressLength ? `${item.dressLength} length` : "",
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
  return Boolean(item.sleeveLength) && (item.type === "Shirts" || item.type === "Dresses");
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

function generateRecommendation({ temperature, weather, season, theme, stylePreference, outfitDate, hour }) {
  const effectiveOutfitDate = outfitDate ?? elements.outfitDate.value;
  const effectiveTemperature = applyTemperatureBias(temperature, state.profile.temperatureBias);
  let layerItem = chooseItem("jacket", { effectiveTemperature, theme, stylePreference, weather });
  let topItem = chooseItem("top", { effectiveTemperature, theme, stylePreference, layerItem });
  let bottomItem = topItem?.type === "Dresses"
    ? null
    : chooseItem("bottom", { effectiveTemperature, theme, stylePreference });
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

  elements.weatherSummary.textContent = hour
    ? `${temperature}°F · ${capitalize(weather)} · ${season} · ${hour}`
    : `${temperature}°F · ${capitalize(weather)} · ${season}`;
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
    planner: { temperature, weather, season, theme, stylePreference, outfitDate: effectiveOutfitDate, hour: hour || null },
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

async function toggleFavoriteCurrentOutfit() {
  const recommendation = state.currentRecommendation;
  if (!recommendation || (!recommendation.topItemId && !recommendation.bottomItemId && !recommendation.layerItemId && !recommendation.accessoryItemIds?.length && !recommendation.shoesItemId)) {
    return;
  }

  const existingIndex = state.favoriteOutfits.findIndex((outfit) => isSameSavedOutfit(outfit, recommendation));

  try {
    if (existingIndex >= 0) {
      const [existing] = state.favoriteOutfits.splice(existingIndex, 1);
      await authFetch(`/favorites/${existing.id}`, { method: "DELETE" });
    } else {
      const payload = {
        planner: recommendation.planner,
        topItemId: recommendation.topItemId,
        bottomItemId: recommendation.bottomItemId,
        layerItemId: recommendation.layerItemId,
        accessoryItemIds: recommendation.accessoryItemIds || [],
        shoesItemId: recommendation.shoesItemId,
        tuckedIn: recommendation.tuckedIn,
        jacketClosed: recommendation.jacketClosed,
      };
      const { outfit } = await authFetch("/favorites", { method: "POST", body: JSON.stringify(payload) });
      state.favoriteOutfits.unshift(outfit);
    }
  } catch (error) {
    showAppModal({
      eyebrow: "Saved outfits",
      title: "Couldn't update favorites",
      message: error.message || "Something went wrong. Please try again.",
    });
  }

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

    card.querySelector("[data-remove-outfit]")?.addEventListener("click", async () => {
      try {
        await authFetch(`/favorites/${outfit.id}`, { method: "DELETE" });
      } catch (error) {
        showAppModal({
          eyebrow: "Saved outfits",
          title: "Couldn't remove outfit",
          message: error.message || "Something went wrong. Please try again.",
        });
        return;
      }
      state.favoriteOutfits = state.favoriteOutfits.filter((entry) => entry.id !== outfit.id);
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

  if (item.type === "Dresses") {
    const dressLength = item.dressLength || "Knee";
    if (["Mini", "Knee"].includes(dressLength)) {
      return temperature >= 65;
    }

    return temperature >= 55;
  }

  if (item.type !== "Shirts") return true;

  const sleevelessShirtStyles = new Set(["Tank top", "Sleeveless shirt", "Sports bra", "Tube top"]);
  if (sleevelessShirtStyles.has(item.style)) {
    return temperature >= 65;
  }

  const sleeveLength = item.sleeveLength || defaultSleeveLengthForShirt(item);
  const isShortSleeve = sleeveLength === "Short sleeve";
  const isLongSleeve = sleeveLength === "Long sleeve";
  const pairedWithJacket = Boolean(layerItem) && layerItem.type === "Jackets";

  if (isShortSleeve) {
    return temperature >= 65 || (pairedWithJacket && temperature >= 40 && temperature <= 50);
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
    if (skirtLength === "Mini") {
      return temperature >= 71;
    }

    if (skirtLength === "Knee") {
      return temperature >= 65;
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
  const dressSelected = topItem?.type === "Dresses";

  return [
    hasClosetItemsForGroup("top") && !topItem ? "top" : "",
    !dressSelected && hasClosetItemsForGroup("bottom") && !bottomItem ? "bottom" : "",
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
  showAppModal({
    eyebrow: "Fit check",
    title: "No applicable pieces",
    message,
  });
}

function showAppModal({ eyebrow = "Fit check", title, message, confirmLabel = "OK", cancelLabel = null, onConfirm = null }) {
  if (!elements.appAlert || !elements.appAlertMessage) return;

  if (elements.appAlertEyebrow) elements.appAlertEyebrow.textContent = eyebrow;
  if (title && elements.appAlertTitle) elements.appAlertTitle.textContent = title;
  elements.appAlertMessage.innerHTML = typeof message === "string"
    ? message
    : `<span>${message.guidance}</span><span>${message.missing}</span>`;

  if (elements.appAlertClose) elements.appAlertClose.textContent = confirmLabel;
  pendingModalConfirm = onConfirm;

  if (cancelLabel && elements.appAlertCancel) {
    elements.appAlertCancel.textContent = cancelLabel;
    elements.appAlertCancel.classList.remove("is-hidden");
  } else {
    elements.appAlertCancel?.classList.add("is-hidden");
  }

  elements.appAlert.classList.remove("is-hidden");
  const shouldFocusCancel = Boolean(cancelLabel) && elements.appAlertCancel;
  (shouldFocusCancel ? elements.appAlertCancel : elements.appAlertClose)?.focus();
}

function closeAppAlert() {
  elements.appAlert?.classList.add("is-hidden");
  elements.appAlertCancel?.classList.add("is-hidden");
  pendingModalConfirm = null;
}

function applyMannequinStyles(topItem, bottomItem, layerItem, shoesItem, effectiveTemperature, accessoryItems = []) {
  const jumpsuitActive = Boolean(bottomItem) && bottomItem.style === "Jumpsuit";
  const overallsActive = Boolean(bottomItem) && bottomItem.style === "Overalls";
  const dressActive = Boolean(topItem) && topItem.type === "Dresses";
  const sortedAccessoryItems = sortAccessoryItemsForRendering(accessoryItems);
  setMannequinGarment(
    elements.mannequinTop,
    jumpsuitActive
      ? ""
      : dressActive
        ? renderDressSvg(topItem, state.mannequinControls, state.profile.presentation)
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
  const dressActive = Boolean(topItem) && topItem.type === "Dresses";
  const tuckable = Boolean(topItem) && !onePieceBottom && !dressActive && !["Sports bra"].includes(topItem.style);
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
    outfitDate: elements.outfitDate.value,
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
    Dresses: "Dress",
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
