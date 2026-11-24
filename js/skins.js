// Tavern Table · skins.js
// Dice skins: the catalog, the pattern painter, and the skin menu. Sends "skin:change" to the 3D dice.

/* ---------- Dice skins ---------- */
// colors: [body, accent, accent2, accent3]. How the accents are used depends on the pattern.
// finish: matte, satin, gloss or metal (how shiny the dice are)
const S = (id, name, group, pattern, colors, edge, ink, finish) => ({ id, name, group, pattern, colors, edge, ink, finish });
const SKINS = [
  S("midnight", "Midnight Brass", "Classic", "solid", ["#2a2440"], "#d4a64a", "#d4a64a", "satin"),
  S("obsidian", "Obsidian", "Classic", "solid", ["#121216"], "#9fa4b4", "#eef0f6", "gloss"),
  S("bone", "Old Bone", "Classic", "speckle", ["#e6dcc3", "#c9b994", "#a8956b"], "#6b5838", "#2b2116", "matte"),
  S("ivory", "Ivory", "Classic", "solid", ["#f1ead8"], "#b08a3e", "#7a1b1b", "satin"),
  S("blood", "Blood Oath", "Classic", "solid", ["#6e0d16"], "#e0b45a", "#f3d48a", "gloss"),
  S("royal", "Royal Blue", "Classic", "solid", ["#1d2a6b"], "#e6e8f0", "#ffffff", "satin"),
  S("ranger", "Ranger Green", "Classic", "solid", ["#1f3b2a"], "#c8a35a", "#f0e2b8", "satin"),

  S("ruby", "Ruby", "Gemstones", "solid", ["#9b111e"], "#ffd0d6", "#fff1f3", "gloss"),
  S("sapphire", "Sapphire", "Gemstones", "solid", ["#0f3f9e"], "#cfe0ff", "#ffffff", "gloss"),
  S("emerald", "Emerald", "Gemstones", "solid", ["#0b6b43"], "#d9ffe9", "#f2fff7", "gloss"),
  S("amethyst", "Amethyst", "Gemstones", "solid", ["#5e2a91"], "#ead7ff", "#ffffff", "gloss"),
  S("topaz", "Topaz", "Gemstones", "solid", ["#c8861a"], "#fff0c8", "#3a2408", "gloss"),
  S("jade", "Jade", "Gemstones", "marble", ["#3f8f68", "#c9eed8", "#1f5a3e"], "#e6f7ec", "#0f2e1f", "gloss"),

  S("gold", "Gold", "Metals", "solid", ["#c9a34a"], "#fff1c4", "#3b2a08", "metal"),
  S("silver", "Silver", "Metals", "solid", ["#c4c8d0"], "#ffffff", "#1d2028", "metal"),
  S("copper", "Copper", "Metals", "solid", ["#b46a3c"], "#ffd9bf", "#2a140a", "metal"),
  S("gunmetal", "Gunmetal", "Metals", "solid", ["#4a4f58"], "#aab0bb", "#e9edf3", "metal"),
  S("dwarven", "Dwarven Iron", "Metals", "speckle", ["#3a3a3e", "#56565c", "#2a2a2d"], "#d07a2c", "#ffb35c", "metal"),

  S("woodland", "Woodland", "Camo", "camo", ["#56603a", "#2f3a22", "#7a6a45", "#1c1d17"], "#1c1d17", "#e9e1cc", "matte"),
  S("jungle", "Jungle", "Camo", "camo", ["#3c5a2b", "#1e2e16", "#6f8a3a", "#2d1f12"], "#15200f", "#e8f0c8", "matte"),
  S("desert", "Desert", "Camo", "camo", ["#cdb68a", "#a8885c", "#8a6a46", "#e0cfa6"], "#5b4630", "#3a2a1a", "matte"),
  S("arctic", "Arctic", "Camo", "camo", ["#eef1f3", "#c3ccd3", "#8e9aa4", "#566069"], "#3d454c", "#1f262c", "matte"),
  S("urban", "Urban", "Camo", "camo", ["#8a8d91", "#5d6064", "#b9bcbf", "#2e3034"], "#1d1f22", "#f2f2f2", "matte"),
  S("digiwood", "Digital Woodland", "Camo", "digital", ["#5e6b45", "#3a4429", "#8a7b55", "#23271b"], "#23271b", "#efe6c8", "matte"),
  S("digisand", "Digital Desert", "Camo", "digital", ["#c9b48a", "#a48b62", "#e2d4ae", "#7d6647"], "#4d3c2a", "#2e2216", "matte"),
  S("diginavy", "Digital Navy", "Camo", "digital", ["#2b3d5e", "#1a263d", "#4b6489", "#0e1524"], "#9fb3d1", "#e8eefa", "matte"),
  S("pinkcamo", "Pink Camo", "Camo", "camo", ["#f2a7c3", "#d96b98", "#f7cfe0", "#a8436f"], "#5a1a35", "#ffffff", "matte"),
  S("blaze", "Hunter Blaze", "Camo", "camo", ["#ff6a13", "#c74a00", "#3a2a1a", "#ff9a4a"], "#2a1a0e", "#ffffff", "matte"),
  S("tiger", "Tiger Stripe", "Camo", "stripes", ["#d98a2b", "#1a120b"], "#1a120b", "#fff4e0", "satin"),

  S("marble", "White Marble", "Stone & Wood", "marble", ["#ecebe6", "#4a4a4e", "#c9c7c0"], "#8a8780", "#222222", "gloss"),
  S("blackmarble", "Black Marble", "Stone & Wood", "marble", ["#16161a", "#d4a64a", "#2e2e36"], "#d4a64a", "#f3d48a", "gloss"),
  S("frost", "Frost", "Stone & Wood", "marble", ["#cfe6f2", "#ffffff", "#8fbcd6"], "#ffffff", "#1f4a66", "gloss"),
  S("lava", "Lava Rock", "Stone & Wood", "marble", ["#1a0d0a", "#ff5a1f", "#5a1a0a"], "#ff8a3d", "#ffd27a", "satin"),
  S("granite", "Granite", "Stone & Wood", "speckle", ["#6b6b6b", "#2a2a2a", "#bdbdbd", "#9a8e80"], "#d9d9d9", "#ffffff", "satin"),
  S("oak", "Oak", "Stone & Wood", "wood", ["#b07b46", "#7a4f28"], "#3e2814", "#2a1a0c", "satin"),
  S("walnut", "Walnut", "Stone & Wood", "wood", ["#5a3a22", "#2f1d10"], "#d4a64a", "#f0d9a8", "satin"),

  S("galaxy", "Galaxy", "Cosmic", "galaxy", ["#0b0a1f", "#5b2a8c", "#1f6aa8"], "#c9b8ff", "#ffffff", "gloss"),
  S("nebula", "Nebula", "Cosmic", "galaxy", ["#140814", "#c2366b", "#f08a3c"], "#ffd0e0", "#ffffff", "gloss"),
  S("deepsea", "Deep Sea", "Cosmic", "galaxy", ["#03141c", "#0f5e6e", "#1fa38a"], "#9ff0e0", "#e8fffb", "gloss"),
  S("aurora", "Aurora", "Cosmic", "galaxy", ["#061018", "#1fbf7a", "#7a3fd0"], "#c8ffe6", "#ffffff", "gloss")
];

// --- Painting a skin's pattern onto a square canvas. The patterns tile seamlessly, so they wrap around the dice.
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => [0, 1, 2].map(i => a[i] + (b[i] - a[i]) * t);
const shade = (c, k) => c.map(x => Math.min(255, x * k));
const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
function paintSkin(skin, size = 256) {
  const c = document.createElement("canvas"); c.width = c.height = size;
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(size, size);
  const col = skin.colors.map(hex);
  const [body, a1 = body, a2 = a1, a3 = a2] = col;
  const rand = seeded([...skin.id].reduce((h, ch) => h * 31 + ch.charCodeAt(0), 7) >>> 0);
  const f = cloudy(rand), f2 = cloudy(rand, 2, 3);
  const layers = skin.pattern === "camo" || skin.pattern === "digital"
    ? col.slice(1).map(() => cloudy(rand, 3, 4)) : [];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let u = x / size, v = y / size, px;
    switch (skin.pattern) {
      case "digital": u = Math.floor(u * 48) / 48; v = Math.floor(v * 48) / 48;   // chunky pixels, then same as camo
      // falls through
      case "camo": {
        px = body;
        layers.forEach((n, i) => { if (n(u, v) > 0.53) px = col[i + 1]; });   // overlapping blobs of each color
        break;
      }
      case "marble": {
        const vein = Math.pow(1 - Math.abs(Math.sin(Math.PI * 2 * (2 * u + v + 2.5 * f(u, v)))), 9);
        px = mix(mix(body, a2, smooth(0.4, 0.8, f2(u, v)) * 0.6), a1, vein);
        break;
      }
      case "wood": {
        const ring = (8 * v + 3 * f(u, v)) % 1;
        px = mix(body, a1, Math.pow(ring, 3) * 0.85);
        px = shade(px, 0.92 + 0.16 * f2(u * 1, v));
        break;
      }
      case "stripes": {
        const s = Math.sin(Math.PI * 2 * (3 * u + 1.6 * f(u, v)));
        px = mix(body, a1, smooth(0.45, 0.6, s));
        break;
      }
      case "galaxy": {
        px = mix(body, a1, smooth(0.45, 0.78, f(u, v)) * 0.9);
        px = mix(px, a2, smooth(0.5, 0.8, f2(u, v)) * 0.7);
        break;
      }
      default: px = shade(body, 0.95 + 0.1 * f(u, v));   // solid and speckle: gentle cloudiness
    }
    const i = (y * size + x) * 4;
    img.data[i] = px[0]; img.data[i + 1] = px[1]; img.data[i + 2] = px[2]; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const dots = (count, colors, rMin, rMax) => {    // little dots, drawn wrapped around the edges so they tile
    for (let k = 0; k < count; k++) {
      const x = rand() * size, y = rand() * size, r = (rMin + rand() * (rMax - rMin)) * size / 256;
      ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
      for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) {
        ctx.beginPath(); ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2); ctx.fill();
      }
    }
  };
  if (skin.pattern === "speckle") dots(900, skin.colors.slice(1), 0.6, 2.2);
  if (skin.pattern === "galaxy") { dots(260, ["#ffffff", "#e8e4ff", "#fff3d6"], 0.3, 1.1); dots(14, ["#ffffff"], 1.4, 2.2); }
  return c;
}

// --- The skin menu
const DEFAULT_SKIN = "midnight";
const skinById = id => id === "custom" && state.customSkin ? { ...state.customSkin, id: "custom", name: "Custom" }
  : SKINS.find(s => s.id === id) || SKINS[0];
function applySkin(skin) {
  const detail = { skin, canvas: paintSkin(skin) };
  window.tavernSkin = detail;                     // the 3D dice pick this up when they load
  document.dispatchEvent(new CustomEvent("skin:change", { detail }));
}
function chooseSkin(id) {
  state.skin = id; save();
  applySkin(skinById(id));
  document.querySelectorAll(".skin").forEach(b => b.setAttribute("aria-pressed", b.dataset.id === id));
  fillCustom(skinById(id));
}

// A soft outline behind the numbers, dark for light numbers and light for dark ones, so they read on busy patterns
function outlineFor(ink) {
  const [r, g, b] = hex(ink);
  return (r * 0.3 + g * 0.59 + b * 0.11) > 128 ? "rgba(0,0,0,.55)" : "rgba(255,255,255,.4)";
}
window.tavernOutline = outlineFor;              // the 3D numbers use the same outline

function previewTile(skin) {                      // a little d20-ish hexagon in the skin's colors
  const c = document.createElement("canvas"), px = 108;
  c.width = c.height = px;
  const ctx = c.getContext("2d");
  const hexPath = () => {
    ctx.beginPath();
    for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; ctx.lineTo(54 + Math.cos(a) * 48, 54 + Math.sin(a) * 48); }
    ctx.closePath();
  };
  hexPath(); ctx.save(); ctx.clip();
  ctx.drawImage(paintSkin(skin, 216), 54, 54, 108, 108, 0, 0, px, px);   // zoomed in, about how much of the pattern one die face shows
  if (skin.finish === "gloss" || skin.finish === "metal") {   // a soft highlight so shiny skins read as shiny
    const g = ctx.createLinearGradient(0, 0, px, px);
    g.addColorStop(0, "rgba(255,255,255,.35)"); g.addColorStop(.45, "rgba(255,255,255,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, px, px);
  }
  ctx.restore();
  hexPath(); ctx.strokeStyle = skin.edge; ctx.lineWidth = 4; ctx.stroke();
  ctx.font = "bold 40px Georgia, serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.lineWidth = 6; ctx.lineJoin = "round"; ctx.strokeStyle = outlineFor(skin.ink);
  ctx.strokeText("20", 54, 57);
  ctx.fillStyle = skin.ink; ctx.fillText("20", 54, 57);
  return c;
}
function buildSkinMenu() {
  const groups = [...new Set(SKINS.map(s => s.group))];
  $("skinList").innerHTML = groups.map(g => `<h3>${esc(g)}</h3><div class="skingrid">${
    SKINS.filter(s => s.group === g).map(s => `<button type="button" class="skin" data-id="${s.id}" aria-pressed="${s.id === (state.skin || DEFAULT_SKIN)}"><span>${esc(s.name)}</span></button>`).join("")
  }</div>`).join("");
  document.querySelectorAll(".skin").forEach(b => b.prepend(previewTile(skinById(b.dataset.id))));
}
$("skinList").addEventListener("click", e => {
  const b = e.target.closest(".skin"); if (b) chooseSkin(b.dataset.id);
});
$("skinBtn").onclick = () => {
  if (!$("skinList").children.length) buildSkinMenu();   // draw the previews the first time the menu opens
  $("skinMenu").showModal();
};
$("skinDone").onclick = () => $("skinMenu").close();
$("skinMenu").addEventListener("click", e => { if (e.target === $("skinMenu")) $("skinMenu").close(); });  // click outside to close

// --- Make your own: color pickers and a pattern. Starts from whichever skin is chosen.
const customFields = { cBody: "body", cAccent: "accent", cEdge: "edge", cInk: "ink", cPattern: "pattern", cFinish: "finish" };
function fillCustom(skin) {
  $("cBody").value = skin.colors[0]; $("cAccent").value = skin.colors[1] || skin.colors[0];
  $("cEdge").value = skin.edge; $("cInk").value = skin.ink;
  $("cPattern").value = skin.pattern; $("cFinish").value = skin.finish;
}
let customFrame = 0;
Object.keys(customFields).forEach(id => $(id).addEventListener("input", () => {
  cancelAnimationFrame(customFrame);              // dragging a color wheel fires lots of events; repaint once per frame
  customFrame = requestAnimationFrame(() => {
    const body = $("cBody").value, accent = $("cAccent").value;
    const darker = "#" + hex(accent).map(x => Math.round(x * 0.6).toString(16).padStart(2, "0")).join("");
    const lighter = "#" + mix(hex(body), [255, 255, 255], 0.35).map(x => Math.round(x).toString(16).padStart(2, "0")).join("");
    state.customSkin = S("custom", "Custom", "Custom", $("cPattern").value, [body, accent, darker, lighter], $("cEdge").value, $("cInk").value, $("cFinish").value);
    chooseSkin("custom");
  });
}));

applySkin(skinById(state.skin || DEFAULT_SKIN));   // put the saved skin on the dice
fillCustom(skinById(state.skin || DEFAULT_SKIN));
