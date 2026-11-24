// Tavern Table · scenekit.js
// A small kit for building scenes with depth and atmosphere: depth layers with haze and parallax, light sources
// that flicker and really light what's behind them, grain textures, particles, a vignette, a color grade, and
// soft shadows under characters. See "How a scene uses the kit" at the bottom of this file.
//
// How it's built, and why (it's all about staying cheap to animate):
// - Everything sits in a "frame" with the art's exact proportions (1600 × 940), sized to cover the window.
//   Things in the frame are placed in art units, so SVG layers and HTML lights/particles line up exactly.
// - Each depth layer is its own <svg>. Parallax slides whole layers (a GPU transform, no redrawing).
// - Lights and particles are HTML elements. Their flicker and motion are opacity/transform animations,
//   which the GPU also handles without redrawing. Light layers use mix-blend-mode: screen, so they brighten
//   the layers underneath instead of painting a flat circle on top.

/* ---------- The frame every scene is drawn in ---------- */
const VIEW_W = 1600, VIEW_H = 320;              // the action strip: the ground is around y = 300
const TOP = -40, BOTTOM = 900;                  // the whole picture runs from y = -40 to 900
const FRAME_H = BOTTOM - TOP;
const PARALLAX_X = 20, PARALLAX_Y = 8;          // how far (in screen px) a depth-1 layer moves at the window's edge

// Depth layers, back to front. depth: how much it moves with the mouse. haze: how much it fades into the distance.
const KIT_LAYERS = [
  { name: "sky", depth: 0, haze: 0 },
  { name: "far", depth: 0.15, haze: 0.45 },
  { name: "mid", depth: 0.4, haze: 0.14 },
  { name: "near", depth: 0.7, haze: 0.04 },
  { name: "foreground", depth: 1.2, haze: 0 }
];
const kitLayer = name => KIT_LAYERS.find(l => l.name === name) || KIT_LAYERS[2];

// Art units → percentages of the frame, for placing HTML lights and particles
const pctX = x => (x / VIEW_W * 100).toFixed(3) + "%";
const pctY = y => ((y - TOP) / FRAME_H * 100).toFixed(3) + "%";
const pctW = w => (w / VIEW_W * 100).toFixed(3) + "%";
const pctH = h => (h / FRAME_H * 100).toFixed(3) + "%";
const rgba = (c, a) => `rgba(${hex(c).join(",")},${a.toFixed(3)})`;

/* ---------- Atmospheric perspective ---------- */
// Farther things are paler, grayer and closer to the color of the air. amount: 0 (right here) to 1 (lost in the haze).
function hazeColor(c, amount, air) {
  const [r, g, b] = hex(c), h = hex(air), l = 0.3 * r + 0.59 * g + 0.11 * b;
  return "#" + [r, g, b].map((v, i) => {
    const gray = v + (l - v) * amount * 0.5;               // lose some color...
    return Math.round(gray + (h[i] - gray) * amount).toString(16).padStart(2, "0");   // ...and fade toward the air
  }).join("");
}

/* ---------- Grain textures: painted once by the browser, then reused everywhere ---------- */
// Each is a tiny SVG noise image (feTurbulence) used as a repeating image, so the noise is only
// worked out once instead of on every frame.
const GRAIN = {
  fine:   { freq: "1.3", octaves: 2 },             // film grain over the whole scene
  stone:  { freq: ".85", octaves: 3, blotch: ".035" },
  wood:   { freq: ".012 .55", octaves: 4 },        // long streaks
  ground: { freq: ".55", octaves: 4, blotch: ".05" }
};
const grainCache = new Map();
function grainUrl(kind) {
  if (grainCache.has(kind)) return grainCache.get(kind);
  const g = GRAIN[kind] || GRAIN.fine;
  const gray = `<feColorMatrix values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0 1"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">` +
    `<filter id="n" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="${g.freq}" numOctaves="${g.octaves}" stitchTiles="stitch"/>${gray}</filter>` +
    (g.blotch ? `<filter id="b" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="${g.blotch}" numOctaves="3" seed="3" stitchTiles="stitch"/>${gray}</filter>` : "") +
    `<rect width="256" height="256" filter="url(#n)"/>` + (g.blotch ? `<rect width="256" height="256" filter="url(#b)" opacity=".6"/>` : "") + `</svg>`;
  const url = "data:image/svg+xml," + encodeURIComponent(svg);
  grainCache.set(kind, url);
  return url;
}
// Shared pieces every layer's <svg> can use: the blur that figures.js glows use, the character shadow, the textures
const KIT_DEFS = () => `<defs><filter id="blur" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="6"/></filter>` +
  `<radialGradient id="kit-shadow"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset=".6" stop-color="#000" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>` +
  ["stone", "wood", "ground"].map(k => `<pattern id="kit-tex-${k}" patternUnits="userSpaceOnUse" width="256" height="256"><image href="${grainUrl(k)}" width="256" height="256"/></pattern>`).join("") +
  `</defs>`;

/* ---------- Light sources ---------- */
// color: the light's color; radius: how far it reaches (art units); strength: how bright the middle is;
// flicker: which animation (see scenekit.css); speed: [min, max] seconds per flicker cycle
const LIGHT_KINDS = {
  torch:  { color: "#ff9a40", radius: 140, strength: 0.42, flicker: "torch", speed: [0.9, 1.5] },
  fire:   { color: "#ff7a28", radius: 240, strength: 0.55, flicker: "fire", speed: [0.6, 1.1] },
  window: { color: "#ffd68a", radius: 130, strength: 0.22, flicker: "steady", speed: [6, 9] },
  lamp:   { color: "#ffc070", radius: 150, strength: 0.38, flicker: "torch", speed: [2.2, 3.4] },     // a hanging lantern: softer, slower
  magic:  { color: "#9a6aff", radius: 170, strength: 0.45, flicker: "pulse", speed: [2, 3] }
};
// What you see of the light itself, drawn into its layer's SVG
const LIGHT_SOURCES = {
  torch: (x, y, o) => rect(x - 3, y, 6, 26 * o.size, "#4a3020") + `<g class="sf">${flameShape(x, y, o.size)}</g>`,
  fire: (x, y, o) => rect(x - 34 * o.size, y - 4, 68 * o.size, 8, "#3a2414") +
    `<g class="sf">${flameShape(x - 18 * o.size, y, 1.3 * o.size)}${flameShape(x + 16 * o.size, y, 1.2 * o.size)}${flameShape(x, y - 2, 1.8 * o.size)}</g>`,
  lamp: (x, y, o) => `<line x1="${x}" y1="${y - 52 * o.size}" x2="${x}" y2="${y - 12 * o.size}" stroke="#1a1008" stroke-width="2"/>` +
    trap(x, y - 14 * o.size, 12 * o.size, y - 10 * o.size, 18 * o.size, "#2a2a30") + rect(x - 7 * o.size, y - 10 * o.size, 14 * o.size, 18 * o.size, "#ffd27a") +
    `<path d="M${x} ${y - 10 * o.size}v${18 * o.size}" stroke="#2a2a30" stroke-width="2"/>` + trap(x, y + 8 * o.size, 18 * o.size, y + 12 * o.size, 10 * o.size, "#2a2a30"),
  window: (x, y, o) => glowDot(x, y, Math.max(o.w, o.h) * 0.6, o.color, 0.45) + rect(x - o.w / 2, y - o.h / 2, o.w, o.h, tone(o.color, 1.25)) +
    `<path d="M${x} ${y - o.h / 2}v${o.h}M${x - o.w / 2} ${y}h${o.w}" stroke="#3a2a1a" stroke-width="${Math.max(2, o.w / 12)}"/>`,
  magic: (x, y, o) => glowDot(x, y, 18 * o.size, o.color, 0.7) + gem(x, y, 8 * o.size, tone(o.color, 1.3), 6) +
    [0, 1, 2].map(i => { const a = i * 2.1; return P(pts([x + Math.cos(a) * 18 * o.size, y + Math.sin(a) * 18 * o.size - 3], [x + Math.cos(a) * 18 * o.size + 2, y + Math.sin(a) * 18 * o.size], [x + Math.cos(a) * 18 * o.size, y + Math.sin(a) * 18 * o.size + 3], [x + Math.cos(a) * 18 * o.size - 2, y + Math.sin(a) * 18 * o.size]), "#fff"); }).join("")
};

/* ---------- Particles ---------- */
// r: dot size range; dur: seconds per trip; move: how far one trip goes (art units); count: default number
const PARTICLE_KINDS = {
  dust:      { color: "#f4e2b8", r: [0.8, 2], dur: [8, 16], count: 40, glow: false, move: r => [(r() - 0.5) * 80, (r() - 0.5) * 50] },
  embers:    { color: "#ffb050", r: [1.2, 2.6], dur: [2.5, 5], count: 24, glow: true, move: r => [(r() - 0.5) * 60, -(120 + r() * 140)] },
  snow:      { color: "#ffffff", r: [1, 3], dur: [10, 20], count: 70, glow: false, move: r => [(r() - 0.5) * 120, FRAME_H + 40] },
  fireflies: { color: "#d8ff70", r: [1.5, 2.5], dur: [4, 8], count: 18, glow: true, move: r => [(r() - 0.5) * 100, (r() - 0.5) * 60] },
  twinkle:   { color: "#ffffff", r: [0.6, 1.8], dur: [2, 5], count: 80, glow: true, move: () => [0, 0] }   // stars: stay put, brighten and dim
};

/* ---------- The kit ---------- */
// air: the haze color distant things fade toward. grade: { color, mode, opacity } tints the whole scene.
// vignette: 0–1, how dark the edges get. grain: 0–1, film grain strength. seed: keeps the random bits the same each time.
// cast: for daylight, which way shadows fall (-1 left … 1 right, 0 straight down under the feet).
function sceneKit({ air = "#8a94a8", grade = null, vignette = 0.45, grain = 0.1, seed = 1, cast = 0, figureFilter = "" } = {}) {
  const rand = seeded(seed);
  const between = ([a, b]) => a + rand() * (b - a);
  const content = {}, defs = [], lights = [], particles = [], drifts = {}, figures = [];

  const kit = {
    // The color c as it looks in a given layer (paler and hazier the farther away it is)
    tint: (c, layer = "mid") => hazeColor(c, kitLayer(layer).haze, air),

    // Gradients and patterns the scene's drawings refer to
    defs(svg) { defs.push(svg); return kit; },

    // Draw into a layer. draw(t) returns SVG; t(color) gives that color hazed for this layer.
    // name can add a sub-layer: "sky:clouds" sits just in front of "sky" and moves like it.
    // mist: 0–1 adds a band of air in front of this layer, thickest near the ground line.
    // drift: { dist, dur } slides the whole layer slowly back and forth (dist art units, dur seconds), e.g. clouds.
    layer(name, draw, { mist = 0, drift = null } = {}) {
      const info = kitLayer(name.split(":")[0]), t = c => hazeColor(c, info.haze, air);
      if (drift) drifts[name] = drift;
      let svg = draw(t);
      if (mist) {
        const id = `kit-mist-${name.replace(":", "-")}`;
        defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${air}" stop-opacity="0"/><stop offset=".75" stop-color="${air}" stop-opacity="${mist}"/><stop offset="1" stop-color="${air}" stop-opacity="${mist * 0.6}"/></linearGradient>`);
        svg += rect(0, TOP, VIEW_W, VIEW_H - TOP, `url(#${id})`);
      }
      content[name] = (content[name] || "") + svg;
      return kit;
    },

    // A texture over a shape you've already drawn. kind: "stone", "wood" or "ground". Use inside a layer's SVG.
    // Only put texture where the layer has something drawn: over empty space it shows as a gray film.
    // tex() gives [fill, extra] for any drawing helper, e.g. blob(points, ...k.tex("stone")) repeats a shape as texture.
    tex: (kind, opacity = 0.4, blend = "overlay") => [`url(#kit-tex-${kind})`, ` opacity="${opacity}" style="mix-blend-mode:${blend}"`],
    texPoly: (points, kind, opacity = 0.4, blend = "overlay") => P(points, `url(#kit-tex-${kind})`, ` opacity="${opacity}" style="mix-blend-mode:${blend}"`),
    texRect: (x, y, w, h, kind, opacity = 0.4, blend = "overlay") => rect(x, y, w, h, `url(#kit-tex-${kind})`, ` opacity="${opacity}" style="mix-blend-mode:${blend}"`),

    // A soft shadow on the ground at (x, y), w wide. on() puts one under a character whose feet are at (x, y).
    // With cast set, the shadow stretches out to one side, the way it does in sunlight.
    shadow: (x, y, w = 46, strength = 1) => `<ellipse cx="${x + w * cast * 0.45}" cy="${y}" rx="${w / 2 * (1 + Math.abs(cast) * 0.8)}" ry="${w * (cast ? 0.1 : 0.13)}" fill="url(#kit-shadow)" opacity="${strength}"/>`,
    on: (x, y, s, figure, w = 46) => kit.shadow(x, y + 1, w * s) + figure,

    // A light at (x, y) in a layer. kind: "torch", "fire", "lamp", "window" or "magic". Returns the SVG for the light itself (put it in that layer); the glow it casts
    // goes into a light layer automatically. ground: the y where its light pool lands on the floor.
    // Options: radius, color, strength, size (scale of the flame/orb), w and h (a window's size).
    // sweep: { dx, dy, dur, delay } makes the glow travel dx, dy art units every dur seconds, flaring up and fading out
    //   on the way (for something passing by, like a fireball). Use the same dur and delay as the thing it follows.
    light({ kind = "torch", x, y, layer = "mid", ground, radius, color, strength, size = 1, w = 40, h = 60, sweep = null }) {
      const k = LIGHT_KINDS[kind];
      const o = { kind, x, y, ground, depth: kitLayer(layer).depth, radius: radius ?? k.radius * size, color: color ?? k.color,
        strength: strength ?? k.strength, flicker: sweep ? "sweep" : k.flicker, dur: sweep ? sweep.dur : between(k.speed),
        delay: sweep ? sweep.delay || 0 : rand() * 3, sweep, w, h, size };
      lights.push(o);
      return LIGHT_SOURCES[kind](x, y, o);
    },

    // Floating particles over an area (art units). kind: "dust", "embers", "snow" or "fireflies".
    particles({ kind = "dust", x0 = 0, x1 = VIEW_W, y0 = TOP, y1 = VIEW_H, count, layer = "near", color }) {
      const k = PARTICLE_KINDS[kind];
      const n = count ?? k.count, depth = kitLayer(layer).depth;
      for (let i = 0; i < n; i++) {
        const [dx, dy] = k.move(rand);
        particles.push({ kind, depth, x: x0 + rand() * (x1 - x0), y: kind === "snow" ? TOP - 20 - rand() * 40 : y0 + rand() * (y1 - y0),
          r: between(k.r), dx, dy, dur: between(k.dur), delay: rand() * 20, color: color ?? k.color, glow: k.glow, o: 0.35 + rand() * 0.5 });
      }
      return kit;
    },

    // A painted character (an image file) standing with its feet at (x, y).
    // w, h: the file's size in pixels. box: [left, top, right, bottom], the character inside the file, in pixels.
    // size: how tall the whole file is drawn, in art units. face: 1 if the character faces right, -1 if left.
    // flip: mirror the image. anim: "breathe" (idle) or "lunge" (attacks now and then). filter: a CSS filter (the scene's tint by default).
    figure({ src, w, h, box, x, y, size, face = 1, flip = false, anim = "breathe", layer = "mid", filter }) {
      const s = size / h, [l, t, r, b] = box;
      figures.push({ src, depth: kitLayer(layer).depth, face, flip, anim, filter: filter ?? figureFilter,
        left: x - ((l + r) / 2) * s, top: y - b * s, w: w * s, h: h * s, delay: rand() * 4 });
      return kit;
    },

    // Put it all together. Returns { html } for the page and { preview } (one flat SVG) for the scene menu.
    build() {
      const allDefs = defs.join("");
      const svgOf = inner => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${TOP} ${VIEW_W} ${FRAME_H}" preserveAspectRatio="none">${KIT_DEFS()}<defs>${allDefs}</defs>${inner}</svg>`;
      const depths = list => [...new Set(list.map(l => l.depth))];
      const lightLayers = depths(lights).map(d => `<div class="kit-layer kit-lights" style="--d:${d}">${lights.filter(l => l.depth === d).map(lightHtml).join("")}</div>`).join("");
      const particleLayers = depths(particles).map(d => `<div class="kit-layer kit-particles" style="--d:${d}">${particles.filter(p => p.depth === d).map(particleHtml).join("")}</div>`).join("");
      let layersHtml = "";
      const layerDiv = (name, depth) => {
        const inner = svgOf(content[name]), d = drifts[name];
        return `<div class="kit-layer" style="--d:${depth}">` +
          (d ? `<div class="kit-drift" style="--dist:${d.dist};animation-duration:${d.dur}s">${inner}</div>` : inner) + `</div>`;
      };
      const figureLayer = d => figures.some(f => f.depth === d) ? `<div class="kit-layer kit-figures" style="--d:${d}">${figures.filter(f => f.depth === d).map(figureHtml).join("")}</div>` : "";
      for (const l of KIT_LAYERS) {
        if (l.name === "foreground") layersHtml += lightLayers;          // lights shine on everything behind the foreground
        for (const name of Object.keys(content).filter(n => n === l.name || n.startsWith(l.name + ":")))
          layersHtml += layerDiv(name, l.depth);                           // the layer, then its sub-layers in the order they were drawn
        layersHtml += figureLayer(l.depth);                                // painted figures stand in front of their layer's art
      }
      if (!content.foreground) layersHtml += lightLayers;
      const overlays =
        (grain ? `<div class="kit-grain" style="opacity:${grain};background-image:url('${grainUrl("fine")}')"></div>` : "") +
        (grade ? `<div class="kit-grade" style="background:${grade.color};mix-blend-mode:${grade.mode || "soft-light"};opacity:${grade.opacity ?? 0.35}"></div>` : "") +
        (vignette ? `<div class="kit-vignette" style="--v:${vignette}"></div>` : "");
      const html = `<div class="kit-frame">${layersHtml}${particleLayers}</div>${overlays}`;
      // The preview: every layer flattened into one SVG, with the lights as blended gradients
      const preview = svgOf(KIT_LAYERS.map(l => Object.keys(content).filter(n => n === l.name || n.startsWith(l.name + ":")).map(n => content[n]).join("")).join("") +
        `<g style="mix-blend-mode:screen">${lights.map(lightSvg).join("")}</g>` +
        (grade ? rect(0, TOP, VIEW_W, FRAME_H, grade.color, ` opacity="${grade.opacity ?? 0.35}" style="mix-blend-mode:${grade.mode || "soft-light"}"`) : "") +
        (vignette ? `<radialGradient id="kit-vig"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${vignette}"/></radialGradient>` + rect(0, TOP, VIEW_W, FRAME_H, "url(#kit-vig)") : ""));
      return { kit: true, html, preview: preview.replace('preserveAspectRatio="none"', 'preserveAspectRatio="xMidYMid slice"') };
    }
  };
  return kit;
}

/* ---------- Lights and particles as HTML ---------- */
function lightHtml(l) {
  const glow = (a) => `radial-gradient(closest-side, ${rgba(l.color, a)}, ${rgba(l.color, a * 0.45)} 35%, ${rgba(l.color, a * 0.12)} 65%, transparent)`;
  const anim = `animation-duration:${l.dur.toFixed(2)}s;animation-delay:-${l.delay.toFixed(2)}s` +
    (l.sweep ? `;--sx:${l.sweep.dx};--sy:${l.sweep.dy || 0}` : "");
  let s = `<div class="kit-light kit-flicker-${l.flicker}" style="left:${pctX(l.x - l.radius)};top:${pctY(l.y - l.radius)};width:${pctW(l.radius * 2)};height:${pctH(l.radius * 2)};background:${glow(l.strength)};${anim}"></div>`;
  if (l.ground !== undefined) {                 // the pool of light on the floor below it
    const rx = l.radius * 1.3, ry = l.radius * 0.3;
    s += `<div class="kit-light kit-flicker-${l.flicker}" style="left:${pctX(l.x - rx)};top:${pctY(l.ground - ry)};width:${pctW(rx * 2)};height:${pctH(ry * 2)};background:${glow(l.strength * 0.85)};${anim}"></div>`;
    if (l.kind === "window") {                  // a shaft of light from the window down to the floor
      const top = l.y + l.h / 2, spread = (l.ground - top) * 0.35, w = l.w + spread * 2, inset = (spread / w * 100).toFixed(2);
      s += `<div class="kit-light kit-flicker-${l.flicker}" style="left:${pctX(l.x - w / 2)};top:${pctY(top)};width:${pctW(w)};height:${pctH(l.ground - top)};` +
        `clip-path:polygon(${inset}% 0, ${100 - inset}% 0, 100% 100%, 0 100%);background:linear-gradient(${rgba(l.color, l.strength * 0.9)}, ${rgba(l.color, 0.03)});${anim}"></div>`;
    }
  }
  return s;
}
function lightSvg(l, i) {                       // the same glow, as SVG, for the menu preview
  const id = `kit-pl${i}`;
  return `<radialGradient id="${id}"><stop offset="0" stop-color="${l.color}" stop-opacity="${l.strength}"/><stop offset=".35" stop-color="${l.color}" stop-opacity="${l.strength * 0.45}"/><stop offset=".65" stop-color="${l.color}" stop-opacity="${l.strength * 0.12}"/><stop offset="1" stop-color="${l.color}" stop-opacity="0"/></radialGradient>` +
    `<circle cx="${l.x}" cy="${l.y}" r="${l.radius}" fill="url(#${id})"/>` +
    (l.ground !== undefined ? `<ellipse cx="${l.x}" cy="${l.ground}" rx="${l.radius * 1.3}" ry="${l.radius * 0.3}" fill="url(#${id})" opacity=".85"/>` : "");
}
function particleHtml(p) {
  return `<i class="kit-p kit-p-${p.kind}" style="left:${pctX(p.x)};top:${pctY(p.y)};--r:${(p.r * 2).toFixed(2)};--dx:${p.dx.toFixed(1)};--dy:${p.dy.toFixed(1)};--o:${p.o.toFixed(2)};` +
    `background:${p.color};${p.glow ? `box-shadow:0 0 calc(var(--r) * 3 * var(--u)) ${p.color};` : ""}animation-duration:${p.dur.toFixed(2)}s;animation-delay:-${p.delay.toFixed(2)}s"></i>`;
}

function figureHtml(f) {
  return `<div class="kit-fig kit-fig-${f.anim}${f.flip ? " kit-flip" : ""}" style="left:${pctX(f.left)};top:${pctY(f.top)};width:${pctW(f.w)};height:${pctH(f.h)};--face:${f.face};animation-delay:-${f.delay.toFixed(2)}s">` +
    `<img src="${f.src}" alt="" draggable="false" style="${f.filter ? `filter:${f.filter};` : ""}animation-delay:-${f.delay.toFixed(2)}s"></div>`;
}

/* ---------- Parallax ---------- */
// Moving the mouse slides each layer a little, farther layers less. Off when the user prefers less motion,
// and on touch screens (there's no mouse to follow).
let parallaxReady = false;
function kitMount(el) {
  if (parallaxReady || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  parallaxReady = true;
  let frame = 0, mx = 0, my = 0;
  const apply = () => { frame = 0; el.style.setProperty("--mx", mx.toFixed(3)); el.style.setProperty("--my", my.toFixed(3)); };
  addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse") return;
    mx = e.clientX / innerWidth * 2 - 1; my = e.clientY / innerHeight * 2 - 1;
    if (!frame) frame = requestAnimationFrame(apply);
  });
  document.addEventListener("mouseleave", () => { mx = my = 0; if (!frame) frame = requestAnimationFrame(apply); });   // drift back when the mouse leaves
}

/* ---------- How a scene uses the kit ----------
   function forestArt() {
     const k = sceneKit({ air: "#9fb4c8", grade: { color: "#ffcf8a", opacity: 0.2 }, vignette: 0.5 });
     k.defs(grad("forestSky", [[0, "#6a8ab0"], [1, "#e0d0b0"]]));
     k.layer("sky", t => rect(0, TOP, VIEW_W, VIEW_H - TOP, "url(#forestSky)"))
      .layer("far", t => ridge(1, 200, 50, t("#3a5a3a")), { mist: 0.35 })        // t() hazes colors for this layer
      .layer("mid", t => trees(t) + k.light({ kind: "window", x: 900, y: 210, layer: "mid", ground: 300, w: 22, h: 28 }))
      .layer("near", t => rect(0, 300, VIEW_W, BOTTOM - 300, "#2a3a22") + k.texRect(0, 300, VIEW_W, BOTTOM - 300, "ground")
         + k.on(500, 300, 1, PARTY.wizard(500, 300, 1)) + k.light({ kind: "fire", x: 620, y: 300, layer: "near", ground: 304 }))
      .layer("foreground", t => ferns())
      .particles({ kind: "fireflies", y0: 150, y1: 300 })
      .particles({ kind: "embers", x0: 600, x1: 640, y0: 270, y1: 295 });
     return k.build();
   }
   The scene's art function returns k.build() instead of an SVG string; applyScene() handles both. */
