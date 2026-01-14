
let rows = 17;

// ---- FIXED TEXT (drawn on canvas) ----
const TOP_FIXED_TEXT = "XO";
const BOTTOM_FIXED_TEXT = "OST";

// Shutter colours
const SHUTTER_COLORS = ["#d7cfcb", "#dc3212", "#f4a7cc", "#fce6f2"];

// Fonts
let fontRegular, fontItalic;

// Buffers
let shutterBuffer;
let grainBuffer;

// Motion
let maxFrac = 0.5;
let minFrac = 0.02;
let centerLead = 0.22;
let easePow = 1.4;

let phasePerPixel = 0.012;
let phaseEase = 0.10;

let phaseTarget = 0;
let phaseSmooth = 0;

let lastScrollY = 0;
let isWrapping = false;
let wrapPaddingPx = 300;

// Title switching
let titleIndex = 0;
let triggerArmed = true;
let touchPx = 2;

// Morph
let morphPower = 1.4;

// Text sizing
let baseTextSize = 64;
let lineGap = 0.90;

// Fixed text sizing
let fixedUiSize = 18;
let fixedMargin = 18;

// -------------------------
// MOBILE SCROLL STABILISATION
// -------------------------
let isTouchDevice = false;
let lastYForDelta = 0;
let deltaClampPx = 80;

// Styled titles (index 0 = SVG section; no text drawn there)
const STYLED_TITLES = [
  { lines: [[{ t: "", i: false }]] },

  {
    lines: [
      [{ t: "A", i: false }, { t: "night", i: false }, { t: "of", i: false }],
      [{ t: "big", i: true }, { t: "songs", i: true }],
      [{ t: "and", i: false }, { t: "big", i: true }, { t: "love.", i: true }],
    ],
  },

  {
    lines: [
      [{ t: "16.02.2026", i: true }],
      [{ t: "7pm-late", i: true }],
    ],
  },

  {
    lines: [
      [{ t: "RSVP", i: false }],
      [{ t: "david@ostreet.co.uk", i: true }],
    ],
  },
];

// DOM hook for SVG layer
let heroWrapEl = null;

function preload() {
  fontRegular = loadFont("redaction35-regular.otf");
  fontItalic = loadFont("redaction35-italic.otf");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(displayDensity());

  heroWrapEl = document.getElementById("heroSvgWrap");

  // Detect touch device
  isTouchDevice =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0;

  // On touch devices: disable wrap + give more runway
  if (isTouchDevice) {
    const scrollSpace = document.getElementById("scrollSpace");
    if (scrollSpace) scrollSpace.style.height = "900vh";

    wrapPaddingPx = 999999; // disables wrap on mobile
    deltaClampPx = 50;
  }

  // Start shutters more open
  phaseTarget = -HALF_PI;
  phaseSmooth = phaseTarget;

  baseTextSize = min(width, height) * 0.10;
  touchPx = max(2, width * 0.01);

  // FIXED TEXT METRICS
  if (isTouchDevice) {
    // Bigger on mobile
    fixedUiSize = max(28, min(44, width * 0.07));
    fixedMargin = max(18, min(34, width * 0.06));
  } else {
    // DESKTOP: restore your previous behaviour (40-ish / not smaller)
    fixedUiSize = max(40, min(24, width * 0.02));
    fixedMargin = max(14, min(24, width * 0.02));
  }

  buildBuffers();
  buildGrain();

  setTimeout(() => {
    const maxScroll = getMaxScroll();
    const mid = Math.floor(maxScroll / 2);

    if (!isTouchDevice) {
      window.scrollTo(0, mid);
      lastScrollY = mid;
      lastYForDelta = mid;
    } else {
      lastScrollY = window.scrollY || 0;
      lastYForDelta = lastScrollY;
    }
  }, 0);

  window.addEventListener("scroll", onScroll, { passive: true });
  updateHeroVisibility();
}

function updateHeroVisibility() {
  if (!heroWrapEl) return;
  if (titleIndex === 0) heroWrapEl.classList.remove("hidden");
  else heroWrapEl.classList.add("hidden");
}

function onScroll() {
  if (isWrapping) return;

  const y = window.scrollY || 0;

  // safer delta (clamp spikes from inertia/address-bar/teleports)
  let delta = y - lastYForDelta;
  lastYForDelta = y;

  if (delta > deltaClampPx) delta = deltaClampPx;
  if (delta < -deltaClampPx) delta = -deltaClampPx;

  phaseTarget += delta * phasePerPixel;

  // Wrap (desktop only)
  const maxScroll = getMaxScroll();
  if (!isTouchDevice && (y < wrapPaddingPx || y > maxScroll - wrapPaddingPx)) {
    isWrapping = true;
    const mid = Math.floor(maxScroll / 2);
    window.scrollTo(0, mid);
    lastScrollY = mid;
    lastYForDelta = mid;
    setTimeout(() => (isWrapping = false), 0);
  }

  lastScrollY = y;
}

function getMaxScroll() {
  return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
}

function draw() {
  phaseSmooth = lerp(phaseSmooth, phaseTarget, phaseEase);

  const leadBase = 0.5 + 0.5 * sin(phaseSmooth);
  const leadE = pow(leadBase, easePow);

  let openAmt = 1 - leadE;
  openAmt = pow(openAmt, morphPower);

  const wMin = width * minFrac;
  const wMax = width * maxFrac;

  const leadW = lerp(wMin, wMax, leadE);
  const gap = width - 2 * leadW;

  if (triggerArmed && gap <= touchPx) {
    titleIndex = (titleIndex + 1) % STYLED_TITLES.length;
    triggerArmed = false;
    updateHeroVisibility();
  }
  if (!triggerArmed && gap > touchPx * 6) triggerArmed = true;

  clear();

  if (titleIndex > 0) drawFixedUiText();

  if (titleIndex > 0) {
    drawStyledTitleCentered(
      STYLED_TITLES[titleIndex],
      width / 2,
      height / 2,
      baseTextSize,
      lineGap
    );
  }

  // SHUTTERS (unchanged; preserves right-hand slider)
  for (let row = 0; row < rows; row++) {
    const { y0, h } = rowSlice(row);

    const cRow = (rows - 1) / 2;
    const d = abs(row - cRow);
    const nd = d / cRow;

    const diamond = nd;
    const round = 1 - Math.sqrt(1 - nd * nd);
    const ndBlend = lerp(diamond, round, openAmt);
    const delay = ndBlend * centerLead * TWO_PI;

    const o = 0.5 + 0.5 * sin(phaseSmooth - delay);
    const e = pow(o, easePow);
    const shutterW = lerp(wMin, wMax, e);

    image(shutterBuffer, 0, y0 - 1, shutterW + 2, h + 2);

    const rightX = width - shutterW - 2;
    push();
    translate(rightX + shutterW + 2, 0);
    scale(-1, 1);
    image(shutterBuffer, 0, y0 - 1, shutterW + 2, h + 2);
    pop();
  }

  blendMode(OVERLAY);
  tint(255, 100);
  image(grainBuffer, 0, 0, width, height);
  image(grainBuffer, 0, 0, width, height);
  noTint();
  blendMode(BLEND);
}

function drawFixedUiText() {
  push();
  fill(0);
  noStroke();

  textFont(fontRegular);
  textSize(fixedUiSize);

  textAlign(CENTER, TOP);
  text(TOP_FIXED_TEXT, width / 2, fixedMargin);

  textAlign(CENTER, BOTTOM);
  text(BOTTOM_FIXED_TEXT, width / 2, height - fixedMargin);

  pop();
}

// ---------- mixed-style centre text ----------
function tokenWidth(token, size) {
  textSize(size);
  textFont(token.i ? fontItalic : fontRegular);
  return textWidth(token.t);
}

function lineWidth(tokens, size) {
  let w = 0;
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    w += tokenWidth(tok, size);
    if (i !== tokens.length - 1) {
      textFont(fontRegular);
      textSize(size);
      w += textWidth(" ");
    }
  }
  return w;
}

function drawStyledTitleCentered(styledTitle, cx, cy, size, gapMult) {
  push();
  noStroke();
  fill(0);
  textAlign(LEFT, BASELINE);

  const lines = styledTitle.lines;
  const totalH = (lines.length - 1) * (size * gapMult);
  const startY = cy - totalH / 2;

  for (let li = 0; li < lines.length; li++) {
    const tokens = lines[li];
    const lw = lineWidth(tokens, size);
    let x = cx - lw / 2;
    const y = startY + li * (size * gapMult);

    for (let ti = 0; ti < tokens.length; ti++) {
      const tok = tokens[ti];
      textFont(tok.i ? fontItalic : fontRegular);
      textSize(size);
      text(tok.t, x, y);

      x += tokenWidth(tok, size);

      if (ti !== tokens.length - 1) {
        textFont(fontRegular);
        x += textWidth(" ");
      }
    }
  }

  pop();
}

// ---------- buffers ----------
function buildBuffers() {
  shutterBuffer = createGradientBuffer4([
    color(SHUTTER_COLORS[0]),
    color(SHUTTER_COLORS[1]),
    color(SHUTTER_COLORS[2]),
    color(SHUTTER_COLORS[3]),
  ]);
}

function buildGrain() {
  grainBuffer = createGraphics(width, height);
  grainBuffer.pixelDensity(displayDensity());
  generateGrain(grainBuffer);
}

function rowSlice(row) {
  const y0 = Math.round((row * height) / rows);
  const y1 = Math.round(((row + 1) * height) / rows);
  return { y0, h: y1 - y0 };
}

function createGradientBuffer4(colors) {
  const buffer = createGraphics(width, 10);
  buffer.pixelDensity(displayDensity());
  const rowPixelH = Math.max(2, Math.round(height / rows));
  buffer.resizeCanvas(width, rowPixelH);
  buffer.noStroke();

  for (let x = 0; x < buffer.width; x++) {
    const t = map(x, 0, buffer.width - 1, 0, 1);
    let c;
    if (t < 1 / 3) c = lerpColor(colors[0], colors[1], t * 3);
    else if (t < 2 / 3) c = lerpColor(colors[1], colors[2], (t - 1 / 3) * 3);
    else c = lerpColor(colors[2], colors[3], (t - 2 / 3) * 3);

    buffer.fill(c);
    buffer.rect(x, 0, 1, buffer.height);
  }
  return buffer;
}

function generateGrain(buffer) {
  buffer.loadPixels();
  for (let i = 0; i < buffer.pixels.length; i += 4) {
    const g = random(0, 255);
    buffer.pixels[i] = g;
    buffer.pixels[i + 1] = g;
    buffer.pixels[i + 2] = g;
    buffer.pixels[i + 3] = 32;
  }
  buffer.updatePixels();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  pixelDensity(displayDensity());

  baseTextSize = min(width, height) * 0.10;
  touchPx = max(2, width * 0.01);

  // FIXED TEXT METRICS (keep desktop same as before)
  if (isTouchDevice) {
    fixedUiSize = max(28, min(44, width * 0.07));
    fixedMargin = max(18, min(34, width * 0.06));
  } else {
    fixedUiSize = max(40, min(24, width * 0.02));
    fixedMargin = max(14, min(24, width * 0.02));
  }

  buildBuffers();
  buildGrain();

  lastScrollY = window.scrollY || 0;
  lastYForDelta = lastScrollY;
}
