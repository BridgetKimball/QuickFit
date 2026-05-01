export {
  renderAccessorySvg,
  renderBottomSvg,
  renderLayerSvg,
  renderShoesSvg,
  renderTopSvg,
  resolveTopSilhouette,
};

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
  const showSleeves = mode !== "body-only";
  const bodyMarkup = showBody ? body : "";
  const collarMarkup = showBody ? collar : "";
  const trimMarkup = showBody ? trim : "";
  const sleeveMarkup = showSleeves ? sleeves : "";

  return `<svg viewBox="0 0 176 420" aria-hidden="true">${sleeveMarkup}${bodyMarkup}${collarMarkup}${trimMarkup}</svg>`;
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
    return `<svg viewBox="0 0 176 420" aria-hidden="true">${buildSkirtSvg(item, fill, stroke, waistY, presentation)}</svg>`;
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
        ? `M48 66 L28 86 L18 226 L33 226 L62 112 Z`
        : isPeacoat
          ? `M48 74 L24 88 L18 218 L39 218 L61 124 Z`
        : isPufferStyle
          ? `M42 72 L16 86 L8 222 L34 222 L59 124 Z`
        : `M57 86 L47 114 L52 ${Math.min(hemY + 24, 288)} L60 ${Math.min(hemY + 20, 284)} L67 138 Z`
      }" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <path d="${isLeatherJacket
        ? `M128 66 L148 86 L158 226 L143 226 L114 112 Z`
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
      ? `M44 70 C58 58, 73 60, 88 74 C103 60, 118 58, 132 70 L127 ${hemY} C108 ${hemY + 7}, 68 ${hemY + 7}, 49 ${hemY} Z`
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
        ? `M44 70 C56 60, 70 60, 78 84 L76 ${hemY} C66 ${hemY + 5}, 56 ${hemY + 4}, 48 ${hemY} Z`
        : isVest
          ? `M48 82 C58 72, 72 72, 82 86 L76 ${hemY} L62 ${hemY + 18} L46 ${hemY} Z`
        : isPeacoat
          ? `M46 76 C58 66, 74 66, 82 90 L78 ${hemY} C66 ${hemY + 6}, 52 ${hemY + 5}, 40 ${hemY} Z`
        : isPufferStyle
          ? `M38 74 C54 62, 74 62, 82 90 L78 ${hemY} C64 ${hemY + 8}, 48 ${hemY + 6}, 32 ${hemY} Z`
        : `M58 86 C63 78, 74 78, 82 98 L82 ${hemY} C72 ${hemY + 4}, 62 ${hemY + 3}, 56 ${hemY} Z`
      }" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <path d="${isLeatherJacket
        ? `M132 70 C120 60, 106 60, 98 84 L100 ${hemY} C110 ${hemY + 5}, 120 ${hemY + 4}, 128 ${hemY} Z`
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
  const zipperTopY = isVest ? 122 : isLeatherJacket ? 82 : isPufferStyle ? 84 : isPeacoat ? 88 : 94;
  const zipper = closed ? buildClosedJacketZipper(stroke, hemY, zipperTopY) : "";

  return `<svg viewBox="0 0 176 420" aria-hidden="true">${sleevePath}${body}${vestDetails}${pufferLines}${puffLines}${belt}${zipper}</svg>`;
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

function buildClosedJacketZipper(stroke, hemY, topY) {
  const zipperBottomY = hemY - 8;
  const teeth = Array.from(
    { length: Math.max(0, Math.floor((zipperBottomY - topY) / 8)) },
    (_, index) => {
      const y = topY + 6 + index * 8;
      return `
        <path d="M86 ${y} L90 ${y + 2}" stroke="${stroke}" stroke-width="1" stroke-linecap="round"/>
        <path d="M90 ${y + 4} L86 ${y + 6}" stroke="${stroke}" stroke-width="1" stroke-linecap="round"/>
      `;
    },
  ).join("");

  return `
    <path d="M88 ${topY} L88 ${zipperBottomY}" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round"/>
    ${teeth}
    <rect x="84.5" y="${zipperBottomY - 1}" width="7" height="5" rx="1.5" fill="${stroke}"/>
    <path d="M88 ${zipperBottomY + 4} L84 ${zipperBottomY + 12} L92 ${zipperBottomY + 12} Z" fill="${stroke}"/>
  `;
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

function buildSkirtSvg(item, fill, stroke, waistY, presentation = "Unspecified") {
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

  const aLineWaistLeftX = presentation === "Feminine" ? 62 : 56;
  const aLineWaistRightX = presentation === "Feminine" ? 114 : 120;
  const stylePaths = {
    "A-Line": `M${aLineWaistLeftX} ${waistY} L${aLineWaistRightX} ${waistY} L144 ${bottomY} L32 ${bottomY} Z`,
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
