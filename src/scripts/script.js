const STORAGE_KEYS = {
  closet: "quickfit-closet",
  profile: "quickfit-profile",
};

const clothingStyles = {
  Dress: ["Floral", "Floor-length", "Wrap", "Slip"],
  Shirt: ["Blouse", "T-shirt", "Button-up", "Knit top"],
  Skirt: ["Flowy", "Dance", "A-line", "Midi"],
  Shorts: ["Mini", "Knee-length", "Tailored", "Relaxed"],
  Pants: ["Flare", "Straight", "Skinny", "Wide-leg"],
  "Outer Layer": ["Jacket", "Coat", "Vest", "Cardigan"],
  Accessories: ["Hat", "Sunglasses", "Ring", "Necklace", "Bracelet", "Earrings"],
};

const typeGroups = {
  top: ["Dress", "Shirt"],
  bottom: ["Skirt", "Shorts", "Pants"],
  layer: ["Outer Layer", "Accessories"],
};

const seasonOptions = ["Spring", "Summer", "Fall", "Winter"];

const defaultCloset = [
  {
    id: crypto.randomUUID(),
    name: "Forest knit tee",
    color: "Deep green",
    material: "Cotton",
    type: "Shirt",
    style: "T-shirt",
    theme: "Casual",
    warmth: "light",
  },
  {
    id: crypto.randomUUID(),
    name: "Tailored cream trousers",
    color: "Cream",
    material: "Linen blend",
    type: "Pants",
    style: "Straight",
    theme: "Professional",
    warmth: "medium",
  },
  {
    id: crypto.randomUUID(),
    name: "Olive cropped jacket",
    color: "Olive",
    material: "Denim",
    type: "Outer Layer",
    style: "Jacket",
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
  profileForm: document.querySelector("#profile-form"),
  profileSummary: document.querySelector("#profile-summary"),
};

init();

function init() {
  populateSeasonOptions();
  populateTypeOptions();
  updateStyleOptions(elements.typeSelect.value);
  populateClosetFilter();
  bindEvents();
  renderCloset();
  renderProfile();
  generateRecommendation({
    temperature: Number(elements.temperature.value),
    weather: document.querySelector("#weather").value,
    season: elements.season.value,
    theme: document.querySelector("#theme").value,
    stylePreference: document.querySelector("#stylePreference").value,
  });
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

  elements.plannerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    generateRecommendation({
      temperature: Number(formData.get("temperature")),
      weather: formData.get("weather"),
      season: formData.get("season"),
      theme: formData.get("theme"),
      stylePreference: formData.get("stylePreference"),
    });
  });

  elements.typeSelect.addEventListener("change", (event) => {
    updateStyleOptions(event.target.value);
  });

  elements.closetForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const item = Object.fromEntries(formData.entries());

    state.closet.unshift({
      id: crypto.randomUUID(),
      ...item,
    });

    persistCollection(STORAGE_KEYS.closet, state.closet);
    event.currentTarget.reset();
    updateStyleOptions(elements.typeSelect.value);
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
  seasonOptions.forEach((season) => {
    const option = document.createElement("option");
    option.value = season;
    option.textContent = season;
    option.selected = season === detectedSeason;
    elements.season.append(option);
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
    const card = document.createElement("article");
    card.className = "closet-card fade-in";
    card.innerHTML = `
      <div class="closet-card__header">
        <div>
          <div class="closet-card__title">${item.name}</div>
          <p>${item.color} ${item.material.toLowerCase()} ${item.style.toLowerCase()}</p>
        </div>
        <button class="closet-card__delete" data-delete-id="${item.id}" type="button">Remove</button>
      </div>
      <div class="closet-card__meta">
        <span class="tag">${item.type}</span>
        <span class="tag">${item.style}</span>
        <span class="tag">${item.theme}</span>
        <span class="tag">${capitalize(item.warmth)} warmth</span>
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
    : "Add a shirt or dress so QuickFit can suggest a top.";
  elements.bottomRecommendation.textContent = bottomItem
    ? describeItem(bottomItem)
    : "Add pants, shorts, or skirts so QuickFit can finish the outfit.";
  elements.layerRecommendation.textContent = layerItem
    ? describeItem(layerItem)
    : effectiveTemperature < 60 || weather === "rainy"
      ? "A jacket, coat, or weather-ready accessory would help here."
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
  const themeMatches = state.closet.filter((item) => allowedTypes.includes(item.type));

  const exactTheme = themeMatches.filter((item) => item.theme === context.theme);
  const themePool = exactTheme.length ? exactTheme : themeMatches;
  const warmthTarget = desiredWarmth(context.effectiveTemperature, group, context.weather);
  const warmthMatches = themePool.filter((item) => item.warmth === warmthTarget);
  const warmthPool = warmthMatches.length ? warmthMatches : themePool;

  const styleMatches = warmthPool.filter((item) => {
    const descriptor = `${item.name} ${item.style}`.toLowerCase();
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

  if (topItem?.type === "Dress") {
    elements.mannequinTop.style.height = "150px";
    elements.mannequinBottom.style.height = "96px";
    elements.mannequinBottom.style.top = "230px";
  } else {
    elements.mannequinTop.style.height = effectiveTemperature < 55 ? "126px" : "112px";
    elements.mannequinBottom.style.height = effectiveTemperature > 75 ? "98px" : "132px";
    elements.mannequinBottom.style.top = "198px";
  }

  if (layerItem && layerItem.type === "Outer Layer") {
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

function getPlannerState() {
  return {
    temperature: Number(elements.temperature.value),
    weather: document.querySelector("#weather").value,
    season: elements.season.value,
    theme: document.querySelector("#theme").value,
    stylePreference: document.querySelector("#stylePreference").value,
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
  return `${item.name} in ${item.color}, tagged ${item.theme.toLowerCase()} and ${item.material.toLowerCase()}.`;
}

function colorForItem(colorName, fallback) {
  const colorMap = {
    black: "#243428",
    white: "#f5f7f2",
    cream: "#ebe8d6",
    olive: "#6c8a52",
    green: "#3f8f4c",
    "deep green": "#1b5d2d",
    blue: "#6f90c3",
    denim: "#5f7999",
    gray: "#a8b2aa",
    grey: "#a8b2aa",
    brown: "#8a644b",
    tan: "#c6a57a",
    pink: "#dc9aad",
    red: "#b95f5f",
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
