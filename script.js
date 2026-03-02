let poem = "";
let poemSegments = []; // [{ text: string, italic: boolean }]
let ui = {};

let latestStampDataUrl = null;
let stampZ = 10;
const MAX_RECEIPTS = 40;

// Visual + interaction toggles
const USE_TORN_EDGE = false; // removes the "wobbly" torn clip-path

let topSvg, bottomSvg;
let topImages = [];
let currentTopImage = null;
let customFont = null;
let italicFont = null;

// torn edge (static clip-path)


// canvas size (kept from the original thermal-printer layout)
const CANVAS_W = 576;
const CANVAS_H = 920;

// layout
const MARGIN_X = 42;
const TOP_MARGIN = 30;
const BOTTOM_MARGIN = 60;
const GAP_AFTER_TOP = 48;
const GAP_BEFORE_BOTTOM = 48;

const TOP_MAX_H = 170;
const BOTTOM_MAX_H = 150;

// thermal-ish ink strength (0..255)
const INK_ALPHA = 210;

// type
const FONT_SIZE = 38;
const LEADING = 46;

// FILES (change if needed)
const TOP_SVG_FILE = "xo4.svg";
const BOTTOM_SVG_FILE = "newxo.png";
const TOP_IMAGE_FILES = [
  "1.png",
  "2.png",
  "3.png",
  "4.png",
  "5.png",
  "6.png",
  "7.png"
];
const FONT_FILE = "redaction35-regular.otf";
const ITALIC_FONT_FILE = "redaction35-italic.otf";

const ITALIC_START = "\uE000";
const ITALIC_END = "\uE001";

// --- POEM DATA --- (your data unchanged)
const bank = {
  adj: [
    "soft","quiet","electric","tiny","wonky","glowing","sleepy","lopsided","sparkly",
    "sweet","strong","heavy","wordy","colourful","clever","minimal","postmodern",
    "brutalist","experimental","conceptual","typographic","grid-based","geometric",
    "organic","symmetrical","balanced","textural","layered","editorial","playful"
  ],

  noun: [
    "light","shadow","margin","paper","ink","edge","line","grid","texture","type",
    "whisper","glitch","spark","MacBook","whisky","bank note","poster","sign",
    "beer can","bunch of tulips","sketchbook","form","shape","layout"
  ],

  // canonical key name (we'll also support {designthing}/{designThing})
  designThing: [
    "kerning","baseline","overprint","grid","leading","monospace","body copy",
    "hierarchy","margins","layout","composition","contrast","branding",
    "wordmark","monogram","palette","publication"
  ],

  material: ["newsprint","cotton paper","tape","glue","thread","receipt paper"],

  verb_ing: [
    "finding","collecting","tracing","following","hiding","keeping","floating",
    "editing","illustrating","sketching","animating","printing","dissociating",
    "brainstorming","visualising","experimenting","thinking","dreaming"
  ],

  verb_ed: [
    "found","collected","traced","edited","illustrated","sketched","animated",
    "printed","strategised","visualised","experimented","thought","dreamt"
  ],

  verb: [
    "find","collect","trace","edit","illustrate","sketch","animate","print",
    "jump","strategise","brainstorm","visualise","think","dream"
  ],

  place: [
    "the studio","the desk","the window","the street","the park","KelvinBridge",
    "the workshop","the morning meet","Cottonrake","Bananamoon","The Doublet",
    "The Co-op","Great Western Road","Otago Street","the brainstorm","O Street",
    "the inner circle","the outer circle","the subway","Stravaigin","Loch Fyne"
  ],

  friendWord: [
    "mate","pal","co-conspirator","best egg","pardner","side-kick",
    "kindred spirit","amigo","cowboy"
  ],

  snack: [
    "biscuits","pastries","flat whites","bananas","teacakes","cookies",
    "Cottonrake sandwiches","morning rolls","Lemsip"
  ],

  banter: [
    "Classic us","Trust the weird","Don’t explain it","Rock on","Catch you later",
    "Don’t overthink it","We love to see it","Obviously"
  ],

  gesture: [
    "your laugh","your hand","your little nod","your font choice","your feedback",
    "your colourful scarf","your knitted hat","your raised eyebrow","your messy sketch"
  ],

  tinyThing: ["a sticker","a doodle","a paper star"],

  creature: [
    "studio dog","seagull","street cat","waving cat","back garden squirrel","studio owner","far away cow","frog","tortoise"
  ],

  sound: ["click","whirr","hum","tap-tap-tap","bark","chime","tick","laugh","sigh","wave","buzz","clink"],

  secret: [
    "a secret route","a hidden door","a pocket map","a perfect concept","the smoothest pen",
    "a freshly bound book","a free Shutterstock subscription","a freshly poured coffee",
    "the perfect playlist","the sharpest pencil"
  ],

  poeticplace: [
    "stars","river Kelvin","Kelvingrove bandstand","O Street sign","west-end sunset",
    "coffee pot","beer garden","cabin","fishing boat"
  ],

  ah: ["Alas","Oh","Yet","But","Perchance","Hark","Lo,","Thus","Yond"],

  designfail: [
    "you’re on mute","you must make the logo bigger","you can grab it from the server",
    "you forgot to save","you need to package it up","you need the fonts downloaded",
    "you ran out of ink","the wifi’s out"
  ],

  name: ["David","Keli","Neil","Anna","Becky","Kevin","Andrew","Boshi","Pippa","Bea"],

  designcringe: [
    "circle back","touch base","synergise","follow best practice",
    "respond EOD","add me on LinkedIn","make it pop"
  ],

  adv: ["always","never","sometimes","maybe","perhaps","supposedly","perchance"],

  affection: [
    "sweet prince","everlasting love","heart-fellow","fellow dreamer",
    "fellow wanderer","trusted companion","paper pal"
  ]
};

const templates = [
  "{name}, meet me at {place}. Bring {snack}.",
  "{name}, I kept the version that feels like {secret}. {banter}.",
  "{name}, {gesture} is how I know we’ll be okay.",
  "{name}, we don’t have to know what {designthing} means, only how it feels.",
  "A {adj} {noun} can oft hold a whole project together.",
  "We keep {verb_ing} until the {noun} stops {verb_ing}.",
  "{name}, you and I are basically {friendWord}s with {snack} and {secret}.",
  "We {sound} to the sound of the {designthing} until the client agrees.",
  "More {adj} than the {noun}, we find the {designthing} in the {poeticplace}.",
  "{ah} {adj} {name}, it’s signed off.",
  "I {adv} see you at {place}. {ah} you must be {verb_ing}.",
  "{ah} {adj} {creature}, {designfail}.",
  "We keep {verb_ing} until the {designthing} feels {adj}.",
  "Two {creature}s at {place}, {verb_ing} quietly. Love must be real.",
  "We found {secret} under the {poeticplace}.",
  "Goodnight my {affection}, remember to {designcringe}.",
  "With you, even the {noun} feels {adj}.",
  "I didn’t believe in {designthing} until {name} {verb-ed} the {noun}.",
  "Like two {creature}s, our {noun} will {adv} {verb} the best {noun}.",
  "{ah}, even time will {verb} more gently, when {name} brings {snack}.",
  "But soft, what {noun} through yonder {noun} breaks?",
  "Roses are {adj}, {noun}s are blue, {place} is forever. O Street loves you.",
  "I wish I knew how to quit you {name}.",
  "{name}, I return to you between meetings, and {place} goes quieter.",
 "We are but two {creature}s {verb_ing} through {place}.",
 "A {adj} {designThing} is nothing compared to {gesture}.",
 "{ah} we {designcringe} like {friendWord}s. Wait, {designfail}.",
 "{ah} {designfail}, but don't worry I still love you.",

];

// --- LOAD ASSETS ---
function preload() {
  topSvg = loadImage(TOP_SVG_FILE);
  bottomSvg = loadImage(BOTTOM_SVG_FILE);

  topImages = TOP_IMAGE_FILES.map((f) => loadImage(f));

  customFont = loadFont(
    FONT_FILE,
    () => console.log("font loaded"),
    () => {
      console.warn("font failed — using Georgia");
      customFont = null;
    }
  );

  italicFont = loadFont(
    ITALIC_FONT_FILE,
    () => console.log("italic font loaded"),
    () => {
      console.warn("italic font failed — falling back to p5 ITALIC");
      italicFont = null;
    }
  );
}

function setup() {
  const c = createCanvas(CANVAS_W, CANVAS_H);
  const holder = document.getElementById("canvas-holder");
  if (holder) c.parent(holder);
  pixelDensity(1);

  setTextFace(false);

  noLoop();

  // UI
  const controls = document.getElementById("controls");
  const genSlot = document.getElementById("controls-gen");

  ui.gen = createButton("Generate");
  if (genSlot) ui.gen.parent(genSlot);
  else if (controls) ui.gen.parent(controls);
  // Render as an image button (SVG) while keeping accessibility.
  try {
    ui.gen.elt.setAttribute("aria-label", "Generate");
    ui.gen.elt.classList.add("gen-image-button");
    ui.gen.elt.innerHTML =
      '<img src="gen.svg" alt="" draggable="false" />';
  } catch {}
  ui.gen.mousePressed(() => {
    stampReceipt();
  });

  // Clicking/tapping the empty background also generates.
  // Receipts + controls stop propagation so dragging/clicking them won't generate.
  const stageEl = document.getElementById("stage");
  if (stageEl) {
    stageEl.addEventListener("click", (e) => {
      if (e.defaultPrevented) return;
      const t = e.target;
      if (
        t &&
        typeof t.closest === "function" &&
        (t.closest(".receipt") ||
          t.closest("#controls-gen") ||
          t.closest("button"))
      ) {
        return;
      }
      stampReceipt();
    });
  }

  stampReceipt(true);

  window.addEventListener("resize", () => {
    // keep existing receipts within view (no-op for now)
  });
}

function draw() {
  pixelDensity(1);
  setTextFace(false);

  // Transparent canvas so the CSS paper texture (rtex.jpg) can show through.
  clear();
  // Fade the printed content slightly so it reads like thermal ink.
  // (Background stays opaque.)
  const inkA = INK_ALPHA;

  const contentWidth = width - MARGIN_X * 2;

  // Fade top/bottom marks (preserves their colors, just reduces opacity)
  tint(255, inkA);
  const topPlaced = placeImageCentered(
    currentTopImage || topSvg,
    width / 2,
    TOP_MARGIN,
    contentWidth,
    TOP_MAX_H
  );

  const bottomPlaced = placeImageCenteredFromBottom(
    bottomSvg,
    width / 2,
    height - BOTTOM_MARGIN,
    contentWidth,
    BOTTOM_MAX_H
  );

  noTint();

  const textTop = topPlaced.bottomY + GAP_AFTER_TOP;
  const textBottom = bottomPlaced.topY - GAP_BEFORE_BOTTOM;
  const textAreaHeight = textBottom - textTop;

  textAlign(CENTER, TOP);
  textSize(FONT_SIZE);
  textLeading(LEADING);

  fill(0, inkA);

  const lines = wrapStyledTextToWidth(
    poemSegments && poemSegments.length ? poemSegments : [{ text: poem, italic: false }],
    contentWidth
  );
  const textBlockHeight = lines.length * LEADING;

  let y = textTop + textAreaHeight / 2 - textBlockHeight / 2;
  y = constrain(y, textTop, textBottom - textBlockHeight);

  drawStyledLines(lines, width / 2, y);
}

// --- IMAGE HELPERS ---
function placeImageCentered(img, cx, topY, maxW, maxH) {
  if (!img || !img.width || !img.height) return { topY, bottomY: topY };
  const s = min(maxW / img.width, maxH / img.height);
  const w = img.width * s;
  const h = img.height * s;
  imageMode(CENTER);
  image(img, cx, topY + h / 2, w, h);
  return { topY, bottomY: topY + h };
}

function placeImageCenteredFromBottom(img, cx, bottomY, maxW, maxH) {
  if (!img || !img.width || !img.height) return { topY: bottomY, bottomY };
  const s = min(maxW / img.width, maxH / img.height);
  const w = img.width * s;
  const h = img.height * s;
  imageMode(CENTER);
  image(img, cx, bottomY - h / 2, w, h);
  return { topY: bottomY - h, bottomY };
}

// --- WRAP TEXT ---
function wrapTextToWidth(str, maxWidth) {
  const words = String(str).split(/\s+/).filter(Boolean);
  let lines = [];
  let line = "";

  for (let w of words) {
    const test = line ? line + " " + w : w;
    if (textWidth(test) <= maxWidth) line = test;
    else {
      if (line) lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  if (lines.length === 0) lines.push("");
  return lines;
}

function setTextFace(italic) {
  if (italic) {
    if (italicFont) {
      textFont(italicFont);
      textStyle(NORMAL);
      return;
    }
    if (customFont) textFont(customFont);
    else textFont("Georgia");
    textStyle(ITALIC);
    return;
  }

  if (customFont) textFont(customFont);
  else textFont("Georgia");
  textStyle(NORMAL);
}

function segmentsToTokens(segments) {
  const tokens = [];
  for (const seg of segments || []) {
    const parts = String(seg.text || "").split(/(\s+)/);
    for (const p of parts) {
      if (!p) continue;
      tokens.push({ text: p, italic: !!seg.italic });
    }
  }
  return tokens;
}

function tokenWidth(tok) {
  setTextFace(!!tok.italic);
  return textWidth(tok.text);
}

function wrapStyledTextToWidth(segments, maxWidth) {
  const tokens = segmentsToTokens(segments);
  const lines = [];
  let line = [];
  let w = 0;

  for (const tok of tokens) {
    const isSpace = /^\s+$/.test(tok.text);
    const tw = tokenWidth(tok);

    if (isSpace) {
      // no leading whitespace
      if (line.length === 0) continue;
      // if whitespace would overflow, drop it and wrap on next word
      if (w + tw <= maxWidth) {
        line.push(tok);
        w += tw;
      }
      continue;
    }

    if (line.length > 0 && w + tw > maxWidth) {
      // trim trailing whitespace before pushing
      while (line.length && /^\s+$/.test(line[line.length - 1].text)) line.pop();
      lines.push(line);
      line = [];
      w = 0;
    }

    line.push(tok);
    w += tw;
  }

  while (line.length && /^\s+$/.test(line[line.length - 1].text)) line.pop();
  if (line.length) lines.push(line);
  if (lines.length === 0) lines.push([{ text: "", italic: false }]);
  return lines;
}

function lineWidth(tokens) {
  let w = 0;
  for (const t of tokens) w += tokenWidth(t);
  return w;
}

function drawStyledLines(lines, centerX, topY) {
  textAlign(LEFT, TOP);

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    const lw = lineWidth(ln);
    let x = centerX - lw / 2;
    const y = topY + i * LEADING;

    for (const tok of ln) {
      setTextFace(!!tok.italic);
      text(tok.text, x, y);
      x += tokenWidth(tok);
    }
  }
}

// --- POEM ---
function generatePoem() {
  if (topImages && topImages.length) {
    currentTopImage = random(topImages);
  } else {
    currentTopImage = null;
  }

  const t = random(templates);
  const marked = fillTemplateMarked(t);
  const tidied = tidyPunctuation(marked);
  poemSegments = markedToSegments(tidied);
  poem = segmentsToPlain(poemSegments);
  redraw();
}

function stampReceipt(forceCenter = false) {
  generatePoem();
  updateLastGenerated();
  // capture after the draw has happened
  requestAnimationFrame(() => {
    const canvasEl = document.querySelector("#composer canvas") || document.querySelector("canvas");
    if (!canvasEl) return;
    latestStampDataUrl = canvasEl.toDataURL("image/png");
    addReceiptToPile(latestStampDataUrl, { forceCenter });
  });
}

function updateLastGenerated() {
  const statusEl = document.getElementById("status");
  if (!statusEl) return;
  statusEl.textContent = `Last generated: ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function addReceiptToPile(dataUrl, { forceCenter } = {}) {
  const pile = document.getElementById("pile");
  if (!pile) return;

  // Trim oldest receipts
  while (pile.children.length >= MAX_RECEIPTS) {
    pile.removeChild(pile.firstElementChild);
  }

  const receipt = document.createElement("div");
  receipt.className = "receipt";
  receipt.style.zIndex = String(++stampZ);
  // Prevent the initial placement from animating (can look glitchy).
  receipt.style.transition = "none";
  receipt.style.opacity = "0";
  receipt.style.setProperty("--enter", "0px");

  const inner = document.createElement("div");
  inner.className = "receipt-inner";

  const surface = document.createElement("div");
  surface.className = "receipt-surface";

  const img = document.createElement("img");
  img.alt = "Generated poem receipt";
  img.decoding = "async";
  img.loading = "eager";
  // Lock aspect ratio early to prevent layout shift during entrance.
  img.width = CANVAS_W;
  img.height = CANVAS_H;
  img.src = dataUrl;

  surface.appendChild(img);
  inner.appendChild(surface);
  receipt.appendChild(inner);
  pile.appendChild(receipt);

  enableReceiptDragging(receipt);

  // Place + tear after layout
  requestAnimationFrame(() => {
    const placement = randomizeElementPlacement(receipt, { forceCenter: !!forceCenter });
    animateReceiptEntrance(receipt, placement);
    if (USE_TORN_EDGE) applyTornEdgeToElement(surface);
  });
}

function enableReceiptDragging(receiptEl) {
  if (!receiptEl) return;

  let dragging = false;
  let startClientX = 0;
  let startClientY = 0;
  let startTx = 0;
  let startTy = 0;

  function parsePx(v) {
    const n = Number.parseFloat(String(v || "0").replace("px", ""));
    return Number.isFinite(n) ? n : 0;
  }

  function getCurrentTxTy(el) {
    // Prefer inline CSS vars, fall back to computed vars.
    const inlineTx = el.style.getPropertyValue("--tx");
    const inlineTy = el.style.getPropertyValue("--ty");
    if (inlineTx || inlineTy) {
      return { tx: parsePx(inlineTx), ty: parsePx(inlineTy) };
    }

    const cs = window.getComputedStyle(el);
    return {
      tx: parsePx(cs.getPropertyValue("--tx")),
      ty: parsePx(cs.getPropertyValue("--ty"))
    };
  }

  function onPointerDown(e) {
    // Only primary mouse button (or touch/pen).
    if (e.pointerType === "mouse" && e.button !== 0) return;

    dragging = true;
    receiptEl.classList.add("dragging");
    receiptEl.style.zIndex = String(++stampZ);
    receiptEl.style.setProperty("--enter", `0px`);

    const { tx, ty } = getCurrentTxTy(receiptEl);
    startTx = tx;
    startTy = ty;
    startClientX = e.clientX;
    startClientY = e.clientY;

    try {
      receiptEl.setPointerCapture(e.pointerId);
    } catch {}

    // Don't let the stage "click to generate" handler see this interaction.
    if (typeof e.stopPropagation === "function") e.stopPropagation();
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!dragging) return;
    const dx = e.clientX - startClientX;
    const dy = e.clientY - startClientY;
    receiptEl.style.setProperty("--tx", `${Math.round(startTx + dx)}px`);
    receiptEl.style.setProperty("--ty", `${Math.round(startTy + dy)}px`);
    e.preventDefault();
  }

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    receiptEl.classList.remove("dragging");
  }

  receiptEl.addEventListener("pointerdown", onPointerDown);
  receiptEl.addEventListener("pointermove", onPointerMove);
  receiptEl.addEventListener("pointerup", endDrag);
  receiptEl.addEventListener("pointercancel", endDrag);
  receiptEl.addEventListener("lostpointercapture", endDrag);

  // Touch fallback for older iOS Safari edge cases.
  // (No-op if Pointer Events are working.)
  let touchId = null;

  function onTouchStart(e) {
    if (dragging) return;
    const t = e.changedTouches && e.changedTouches[0];
    if (!t) return;
    touchId = t.identifier;
    onPointerDown({
      pointerType: "touch",
      button: 0,
      clientX: t.clientX,
      clientY: t.clientY,
      pointerId: 1,
      preventDefault: () => e.preventDefault()
    });
  }

  function onTouchMove(e) {
    if (!dragging) return;
    const touches = e.changedTouches;
    if (!touches) return;
    for (const t of touches) {
      if (t.identifier !== touchId) continue;
      onPointerMove({
        clientX: t.clientX,
        clientY: t.clientY,
        preventDefault: () => e.preventDefault()
      });
      break;
    }
  }

  function onTouchEnd(e) {
    if (!dragging) return;
    const touches = e.changedTouches;
    if (!touches) return;
    for (const t of touches) {
      if (t.identifier !== touchId) continue;
      touchId = null;
      endDrag();
      break;
    }
  }

  receiptEl.addEventListener("touchstart", onTouchStart, { passive: false });
  receiptEl.addEventListener("touchmove", onTouchMove, { passive: false });
  receiptEl.addEventListener("touchend", onTouchEnd);
  receiptEl.addEventListener("touchcancel", onTouchEnd);

  // Also block bubbling click events from receipts.
  receiptEl.addEventListener("click", (e) => {
    e.stopPropagation();
  });
}

function randomizeElementPlacement(el, { forceCenter } = {}) {
  if (!el) return;

  const rect = el.getBoundingClientRect();
  const vw = window.innerWidth || document.documentElement.clientWidth;
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const margin = 18;

  const maxX = Math.max(0, (vw - rect.width) / 2 - margin);
  const maxY = Math.max(0, (vh - rect.height) / 2 - margin);

  const tx = forceCenter ? 0 : Math.round(random(-maxX, maxX));
  const ty = forceCenter ? 0 : Math.round(random(-maxY, maxY));
  const rot = forceCenter ? 0 : random(-14, 14);

  // Store as CSS vars so we can animate entrance separately.
  el.style.setProperty("--tx", `${tx}px`);
  el.style.setProperty("--ty", `${ty}px`);
  el.style.setProperty("--rot", `${rot}deg`);
  el.style.setProperty("--enter", `0px`);

  return { tx, ty, rot, rect, vw, vh };
}

function animateReceiptEntrance(el, placement) {
  if (!el) return;
  const rect = placement?.rect || el.getBoundingClientRect();
  const vh = placement?.vh || (window.innerHeight || document.documentElement.clientHeight);

  // Move it far enough down to be off-screen.
  const enter = Math.round(vh / 2 + rect.height / 2 + 40);

  // Start state (no transition so it doesn't tween from defaults)
  el.style.transition = "none";
  el.style.opacity = "0";
  el.style.setProperty("--enter", `${enter}px`);

  // Force style flush
  el.getBoundingClientRect();

  // End state (uses CSS transition)
  requestAnimationFrame(() => {
    el.style.transition = "";
    el.style.opacity = "1";
    el.style.setProperty("--enter", `0px`);
  });
}

function applyTornEdgeToElement(surfaceEl) {
  if (!surfaceEl) return;
  const w = surfaceEl.clientWidth || 0;
  const h = surfaceEl.clientHeight || 0;
  if (!w || !h) return;

  const seeds = makeTornSeeds();
  const t = 0;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const topMax = 9;
  const sideMax = 7;
  const bottomMax = 10;

  const topPts = seeds.top.map((s) => {
    const n = noise(s.phaseA, t + s.u * 0.8);
    const n2 = noise(s.phaseB, t + s.u * 1.6);
    const cut = clamp(s.base + (n - 0.5) * 1.2 * s.amp + (n2 - 0.5) * 2, 0, topMax);
    return [s.u * w, cut];
  });

  const rightPts = seeds.right.map((s) => {
    const n = noise(s.phaseA, t + s.u * 0.9);
    const n2 = noise(s.phaseB, t + s.u * 1.7);
    const cut = clamp(s.base + (n - 0.5) * 1.2 * s.amp + (n2 - 0.5) * 2, 0, sideMax);
    return [w - cut, s.u * h];
  });

  const bottomPts = seeds.bottom.map((s) => {
    const n = noise(s.phaseA, t + s.u * 0.8);
    const n2 = noise(s.phaseB, t + s.u * 1.6);
    const cut = clamp(s.base + (n - 0.5) * 1.2 * s.amp + (n2 - 0.5) * 2, 0, bottomMax);
    return [s.u * w, h - cut];
  });

  const leftPts = seeds.left.map((s) => {
    const n = noise(s.phaseA, t + s.u * 0.9);
    const n2 = noise(s.phaseB, t + s.u * 1.7);
    const cut = clamp(s.base + (n - 0.5) * 1.2 * s.amp + (n2 - 0.5) * 2, 0, sideMax);
    return [cut, s.u * h];
  });

  const pts = [];
  for (const p of topPts) pts.push(p);
  for (let i = 1; i < rightPts.length; i++) pts.push(rightPts[i]);
  for (let i = bottomPts.length - 1; i >= 0; i--) pts.push(bottomPts[i]);
  for (let i = leftPts.length - 2; i >= 1; i--) pts.push(leftPts[i]);

  const poly =
    "polygon(" +
    pts
      .map(([x, y]) => `${Math.round(x)}px ${Math.round(y)}px`)
      .join(",") +
    ")";

  surfaceEl.style.clipPath = poly;
  surfaceEl.style.webkitClipPath = poly;
}

function makeTornSeeds() {
  const edgeCount = {
    top: 22,
    right: 16,
    bottom: 22,
    left: 16
  };

  function mk(count, baseMin, baseMax, ampMin, ampMax) {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const u = count === 1 ? 0 : i / (count - 1);
      // Keep corners less aggressive
      const cornerDamp = 1 - Math.pow(Math.abs(u - 0.5) * 2, 3) * 0.45;
      arr.push({
        u,
        base: random(baseMin, baseMax) * cornerDamp,
        amp: random(ampMin, ampMax) * cornerDamp,
        phaseA: random(1000),
        phaseB: random(1000)
      });
    }
    return arr;
  }

  return {
    // Calmer torn edge: smaller base/amp values
    top: mk(edgeCount.top, 1, 6, 1, 6),
    right: mk(edgeCount.right, 1, 5, 1, 5),
    bottom: mk(edgeCount.bottom, 1, 7, 1, 6),
    left: mk(edgeCount.left, 1, 5, 1, 5)
  };
}

function randomizeReceiptPlacement(forceCenter) {
  const receipt = document.getElementById("receipt");
  if (!receipt) return;

  // Ensure layout has occurred so getBoundingClientRect() is accurate.
  requestAnimationFrame(() => {
    const rect = receipt.getBoundingClientRect();
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const margin = 16;

    const maxX = Math.max(0, (vw - rect.width) / 2 - margin);
    const maxY = Math.max(0, (vh - rect.height) / 2 - margin);

    const tx = forceCenter ? 0 : Math.round(random(-maxX, maxX));
    const ty = forceCenter ? 0 : Math.round(random(-maxY, maxY));
    const rot = forceCenter ? 0 : random(-6, 6);

    receipt.style.transform = `translate(-50%, -50%) translate(${tx}px, ${ty}px) rotate(${rot}deg)`;
  });
}

function renderPoemHtml() {
  if (ui.output) {
    const html = (poemSegments || [])
      .map((seg) => {
        const safe = escapeHtml(seg.text || "");
        return seg.italic ? `<em>${safe}</em>` : safe;
      })
      .join("");
    ui.output.html(html);
  }
  if (ui.status) ui.status.html(`Last generated: ${new Date().toLocaleString()}`);
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function copyPoemToClipboard() {
  const text = String(poem || "").trim();
  if (!text) {
    if (ui.status) ui.status.html("Nothing to copy yet.");
    return;
  }

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      if (ui.status) ui.status.html("Copied poem text to clipboard.");
      return;
    }
  } catch {}

  // Fallback
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
    if (ui.status) ui.status.html("Copied poem text to clipboard.");
  } catch (e) {
    if (ui.status) ui.status.html("Copy failed. (See console)");
    console.error(e);
  } finally {
    document.body.removeChild(ta);
  }
}

function downloadCanvasPng() {
  const dataUrl = latestStampDataUrl;
  if (!dataUrl) return;

  const a = document.createElement("a");
  const stamp = new Date()
    .toISOString()
    .replaceAll(":", "")
    .replaceAll("-", "")
    .slice(0, 15);
  a.download = `xo-poem-${stamp}.png`;
  a.href = dataUrl;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (ui.status) ui.status.html("Downloaded image.");
}

function fillTemplateMarked(tpl) {
  const alias = {
    designthing: "designThing",
    designThing: "designThing",
    "verb-ed": "verb_ed",
    "verb_ing": "verb_ing",
    poeticplace: "poeticplace",
    "verb-ing": "verb_ing"
  };

  let out = tpl.replace(/\{adj\}est/g, () => {
    const v = makeEst(random(bank.adj));
    return ITALIC_START + v + ITALIC_END;
  });

  out = out.replace(/\{([^}]+)\}/g, (match, rawKey) => {
    const key = rawKey.trim();
    const bankKey = alias[key] || key;

    if (bankKey === "name") return ITALIC_START + random(bank.name) + ITALIC_END;

    const arr = bank[bankKey];
    if (Array.isArray(arr)) return ITALIC_START + random(arr) + ITALIC_END;

    return match;
  });

  return out;
}

function markedToSegments(str) {
  const s = String(str || "");
  const segs = [];
  let buf = "";
  let italic = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === ITALIC_START) {
      if (buf) segs.push({ text: buf, italic });
      buf = "";
      italic = true;
      continue;
    }
    if (ch === ITALIC_END) {
      if (buf) segs.push({ text: buf, italic });
      buf = "";
      italic = false;
      continue;
    }
    buf += ch;
  }
  if (buf) segs.push({ text: buf, italic });
  return segs;
}

function segmentsToPlain(segs) {
  return (segs || []).map((s) => s.text).join("");
}

function makeEst(adj) {
  const a = String(adj).trim();
  if (a.includes(" ") || a.includes("-")) return `most ${a}`;
  if (a.endsWith("e")) return a + "st";
  if (a.endsWith("y") && a.length > 1 && !isVowel(a[a.length - 2])) return a.slice(0, -1) + "iest";
  return a + "est";
}

function isVowel(ch) {
  return "aeiou".includes(ch.toLowerCase());
}

function tidyPunctuation(str) {
  return str
    .replace(/\s+([.,!?;:])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}


