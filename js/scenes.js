// Tavern Table · scenes.js
// The six scenes, drawn behind the whole page, and the scene menu.
// Each scene is built with the scene kit (scenekit.js) from the cast and props in figures.js. The action happens in a
// 1600 × 320 strip (ground around y = 300); above it is a little more sky or ceiling, and below it the ground carries on
// to y = 900, so the picture can cover a whole window. It's cropped to fit the screen, so the action sits in the middle
// (x ≈ 450–1150). The frame's size (VIEW_W, VIEW_H, TOP, BOTTOM) is set in scenekit.js.

// --- Ground that carries on below the action strip (from y0 down to the bottom)
function planksBelow(y0, c) {
  const r = seeded(5); let s = rect(0, y0, VIEW_W, BOTTOM - y0, c);
  for (let y = y0 + 22; y < BOTTOM; y += 22 + Math.floor((y - y0) / 120) * 3) {      // boards get a bit wider toward you
    s += rect(0, y, VIEW_W, 2, tone(c, 0.6));
    for (let x = r() * 200; x < VIEW_W; x += 160 + r() * 200) s += rect(x, y - 20, 2, 20, tone(c, 0.7));
  }
  return s;
}
function rocksBelow(y0, c, seed) {
  const r = seeded(seed); let s = rect(0, y0, VIEW_W, BOTTOM - y0, c);
  for (let i = 0; i < 140; i++) s += gem(r() * VIEW_W, y0 + 20 + r() * (BOTTOM - y0), 4 + r() * 14, tone(c, 0.8 + r() * 0.6), 6, r());
  return s;
}
function cobblesBelow(y0) {
  const r = seeded(22); let s = rect(0, y0, VIEW_W, BOTTOM - y0, "#7a7268");
  for (let y = y0; y < BOTTOM; y += 12) for (let x = (Math.round(y / 12) % 2) * 14; x < VIEW_W; x += 28)
    s += `<rect x="${x}" y="${y}" width="${24 + r() * 4}" height="10" rx="3" fill="${["#8a8276", "#7a7268", "#948c80"][Math.floor(r() * 3)]}"/>`;
  return s;
}
function tilesBelow(y0, c) {
  let s = rect(0, y0, VIEW_W, BOTTOM - y0, c);
  for (let y = y0 + 40; y < BOTTOM; y += 40) s += rect(0, y, VIEW_W, 2, tone(c, 0.7));
  for (let x = 0; x < VIEW_W; x += 80) s += rect(x, y0, 2, BOTTOM - y0, tone(c, 0.75));
  return s;
}
const grad = (id, stops, vertical = true) => `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join("")}</linearGradient>`;
const radial = (id, stops) => `<radialGradient id="${id}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join("")}</radialGradient>`;
function stars(n, seed, maxY = 200) {
  const r = seeded(seed);
  return Array.from({ length: n }, () => `<circle cx="${(r() * VIEW_W).toFixed(0)}" cy="${(r() * maxY).toFixed(0)}" r="${(0.6 + r() * 1.4).toFixed(1)}" fill="#fff" opacity="${(0.4 + r() * 0.6).toFixed(2)}"/>`).join("");
}
// A ragged band of land or rock: a polygon along y with random bumps, filled down to the bottom
function ridge(seed, y, bump, color, step = 80, bottom = VIEW_H) {
  const r = seeded(seed), p = [[0, bottom]];
  for (let x = 0; x <= VIEW_W + step; x += step) p.push([x, y - r() * bump]);
  p.push([VIEW_W + step, bottom]);
  return P(pts(...p), color);
}

/* ---------- The tavern (built with the scene kit) ---------- */
function tavernArt() {
  const floor = 300;
  const k = sceneKit({
    air: "#2a1a10",                                         // warm, smoky air
    grade: { color: "#ffb060", mode: "soft-light", opacity: 0.28 },
    vignette: 0.55, grain: 0.08, seed: 2
  });
  k.defs(grad("tavSmoke", [[0, "#d8b080", 0.22], [1, "#d8b080", 0]]));
  const shelfBottles = (x0, y0) => ["#6a2a2a", "#2a5a3a", "#8a6a2a", "#3a3a6a", "#6a2a4a", "#2a4a5a", "#7a5a1a"].map((c, i) => PROP.bottle(x0 + i * 16, y0, c)).join("");

  // Far: the back wall of wooden boards, with grain, and the ceiling beam
  k.layer("far", t => {
    let svg = rect(0, TOP, VIEW_W, floor - TOP, t("#3a2616")) + k.texRect(0, TOP, VIEW_W, floor - TOP, "wood", 0.55);
    for (let i = 0; i < 28; i++) svg += rect(i * 60, TOP, 2, floor - TOP, t("#22150b"));
    return svg + rect(0, 36, VIEW_W, 16, t("#24170d")) + rect(0, 36, VIEW_W, 4, t("#4a3220"));
  });

  // Mid: the fireplace, the bar shelves, the barrels, and the lamps
  k.layer("mid", t => {
    const stone = (x, y, w, h, c) => rect(x, y, w, h, c) + k.texRect(x, y, w, h, "stone", 0.55);
    return stone(950, 120, 170, floor - 120, "#4a4440") + rect(1035, 120, 85, floor - 120, "#00000030") + stone(940, 112, 190, 14, "#5a544e") +
      `<path d="M975 ${floor} V200 Q1035 160 1095 200 V${floor} Z" fill="#120a06"/>` +
      k.light({ kind: "fire", x: 1035, y: 292, layer: "mid", ground: floor + 4, radius: 330, size: 1.1 }) +
      rect(1180, 70, 400, 6, "#24170d") + rect(1180, 130, 400, 6, "#24170d") + shelfBottles(1200, 70) + shelfBottles(1330, 70) + shelfBottles(1460, 70) + shelfBottles(1250, 130) + shelfBottles(1400, 130) +
      k.shadow(80, floor, 90) + PROP.barrel(60, floor, 1.2) + PROP.barrel(98, floor, 1.2) + PROP.barrel(79, floor - 48, 1.2) +
      [330, 760, 1180].map(x => k.light({ kind: "lamp", x, y: 104, layer: "mid", ground: floor })).join("");
  });
  // A light haze of smoke under the ceiling, drifting slowly
  k.layer("mid:smoke", () => rect(-120, TOP, VIEW_W + 240, 190, "url(#tavSmoke)"), { drift: { dist: 50, dur: 40 } });

  // Near: the floorboards, the tables and everyone at them, and the bar
  k.layer("near", () => {
    let svg = planksBelow(floor, "#2a1a0e") + k.texRect(0, floor, VIEW_W, BOTTOM - floor, "wood", 0.5) + rect(0, floor, VIEW_W, 3, "#1a1008");
    // the locals' table
    svg += FOLK.villager(250, floor + 16, 1, { look: 2, pose: "sit", front: -70, item: ITEMS.mug() }) +
      FOLK.villager(330, floor + 16, 1, { look: 5, pose: "sit", flip: true, front: -50 }) +
      k.shadow(290, floor + 2, 150) + PROP.table(290, floor, 110) + PROP.candle(290, floor - 30);
    k.light({ kind: "lamp", x: 290, y: floor - 42, layer: "near", radius: 70, strength: 0.3 });   // candle glow (the candle is drawn above)
    // the party's table
    svg += PARTY.elf(560, floor + 16, 1, { pose: "sit", front: -60, item: ITEMS.mug(), hood: false }) +
      PARTY.wizard(640, floor + 16, 1, { pose: "sit", front: -40 }) +
      PARTY.dwarf(750, floor + 16, 1, { pose: "sit", flip: true, front: -150, item: ITEMS.mug(), shield: false }) +
      PARTY.barbarian(830, floor + 16, 1, { pose: "sit", flip: true, front: -140, item: ITEMS.mug(), helm: false }) +
      k.shadow(700, floor + 2, 320) + PROP.table(700, floor, 260) + PROP.candle(700, floor - 30) +
      place(620, floor - 30, 1, false, ITEMS.mug()) + place(780, floor - 30, 1, false, ITEMS.mug());
    k.light({ kind: "lamp", x: 700, y: floor - 42, layer: "near", radius: 80, strength: 0.32 });
    // the bar
    svg += FOLK.barkeep(1330, floor - 20, 1, { flip: true }) +
      k.shadow(1390, floor + 2, 460) + rect(1180, floor - 70, 420, 70, "#5a3a20") + k.texRect(1180, floor - 70, 420, 70, "wood", 0.5) +
      rect(1180, floor - 76, 420, 10, "#7a5030") + Array.from({ length: 7 }, (_, i) => rect(1200 + i * 60, floor - 62, 40, 52, "#4a2e18")).join("") +
      place(1260, floor - 76, 1, false, ITEMS.mug()) + place(1420, floor - 76, 1, false, ITEMS.mug()) +
      FOLK.villager(1490, floor + 16, 1, { look: 3, pose: "sit", front: -60 });
    return svg;
  });

  // Foreground: a dark ceiling beam right overhead
  k.layer("foreground", () => rect(-60, TOP, VIEW_W + 120, 30, "#120a05") + rect(-60, TOP + 30, VIEW_W + 120, 4, "#0a0603"));

  // Dust in the firelight, and sparks from the fire
  k.particles({ kind: "dust", layer: "mid", x0: 820, x1: 1250, y0: 60, y1: 290, count: 26, color: "#ffd9a0" })
   .particles({ kind: "dust", layer: "mid", x0: 200, x1: 820, y0: 60, y1: 280, count: 14, color: "#f4d8b0" })
   .particles({ kind: "embers", layer: "mid", x0: 1005, x1: 1065, y0: 250, y1: 290, count: 12 });
  return k.build();
}

/* ---------- The dungeon (built with the scene kit) ---------- */
// A smooth, lumpy outline through a list of points: rough stone with curved edges
function blob(points, fill, extra = "") {
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = `M${mid(points[points.length - 1], points[0]).join(" ")}`;
  points.forEach((p, i) => { d += ` Q${p.join(" ")} ${mid(p, points[(i + 1) % points.length]).join(" ")}`; });
  return `<path d="${d} Z" fill="${fill}"${extra}/>`;
}
function dungeonArt() {
  const floor = 296;
  const k = sceneKit({
    air: "#0b1416",                                         // distant stone fades into cold dark air
    grade: { color: "#0c2426", mode: "lighten", opacity: 0.75 },   // lifts only the darkest shadows to blue-green
    vignette: 0.7, grain: 0.1, seed: 4
  });
  k.defs(grad("dunBack", [[0, "#06080a"], [1, "#0d1114"]]) + grad("dunRecess", [[0, "#020304"], [1, "#0a0d10", 0.9]]));
  const r = seeded(4);

  // Back: plain darkness
  k.layer("sky", () => rect(0, TOP, VIEW_W, VIEW_H - TOP + 20, "url(#dunBack)"));

  // Far: a wall of arches and pillars, fading into the dark
  k.layer("far", t => {
    let svg = rect(0, 30, VIEW_W, floor - 30, t("#262b30")) + k.texRect(0, 30, VIEW_W, floor - 30, "stone", 0.45);
    for (let x = 120; x < VIEW_W + 120; x += 240) {          // dark arched openings
      svg += `<path d="M${x - 70} ${floor} V170 Q${x} 92 ${x + 70} 170 V${floor} Z" fill="url(#dunRecess)"/>` +
        `<path d="M${x - 70} 170 Q${x} 92 ${x + 70} 170" fill="none" stroke="${t("#3a4046")}" stroke-width="6"/>`;
    }
    for (let x = 0; x <= VIEW_W; x += 240) {                 // pillars between them
      svg += rect(x - 26, 60, 52, floor - 60, t("#30363c")) + rect(x, 60, 26, floor - 60, t("#272c31")) +
        rect(x - 34, 52, 68, 14, t("#3a4046")) + rect(x - 34, floor - 14, 68, 14, t("#3a4046"));
    }
    svg += k.texRect(0, 30, VIEW_W, floor - 30, "stone", 0.3);
    // a torch high on the middle pillar, above the two sides of the fight
    svg += k.light({ kind: "torch", x: 720, y: 104, layer: "far", ground: floor, radius: 190 });
    return svg;
  }, { mist: 0.55 });

  // Mid: the rough rock of the tunnel itself, with curved edges, stalactites, and two torches
  k.layer("mid", t => {
    const stone = t("#2a2e34"), dark = t("#1c1f24");
    const rock = (points, fill) => blob(points, fill) + blob(points, ...k.tex("stone", 0.5));   // each shape, then grain on it
    let svg =
      rock([[-60, TOP], [VIEW_W + 60, TOP], [VIEW_W + 60, 40], [1420, 70], [1180, 46], [960, 78], [760, 52], [520, 80], [300, 50], [120, 74], [-60, 50]], stone) +   // ceiling
      rock([[-80, 20], [140, 60], [250, 120], [290, 210], [262, 300], [-80, 320]], stone) +                // left wall
      rock([[VIEW_W + 80, 20], [1460, 60], [1350, 130], [1318, 220], [1345, 300], [VIEW_W + 80, 320]], stone) +   // right wall
      rock([[-80, 60], [90, 100], [170, 170], [190, 250], [160, 310], [-80, 320]], dark) +                // shadowed rock faces
      rock([[VIEW_W + 80, 60], [1500, 110], [1430, 180], [1420, 260], [1450, 310], [VIEW_W + 80, 320]], dark);
    for (let i = 0; i < 24; i++) svg += PROP.stalactite(40 + i * 66 + r() * 30, 40 + r() * 30, 26 + r() * 46, dark);
    svg += k.light({ kind: "torch", x: 205, y: 150, layer: "mid", ground: floor, radius: 210, size: 1.3 }) +
           k.light({ kind: "torch", x: 1395, y: 150, layer: "mid", ground: floor, radius: 210, size: 1.3 });
    return svg;
  });

  // Near: the floor, the bones, and everyone fighting (with shadows under their feet)
  k.layer("near", () => {
    let svg = rocksBelow(floor, "#15181c", 31) + rect(0, floor, VIEW_W, 6, "#1d2126") + k.texRect(0, floor, VIEW_W, BOTTOM - floor, "ground", 0.55) +
      `<g stroke="#cfc8b2" stroke-width="3" stroke-linecap="round"><line x1="700" y1="${floor + 8}" x2="722" y2="${floor + 4}"/><line x1="990" y1="${floor + 10}" x2="1004" y2="${floor + 14}"/></g>` + gem(735, floor + 4, 6, "#cfc8b2", 7);
    // the party, left of center, facing right
    svg += k.on(430, floor, 1.05, PARTY.elf(430, floor, 1.05, { aim: true })) +
      k.on(500, floor, 1.05, PARTY.wizard(500, floor, 1.05, { cast: true })) +
      `<path d="M556 ${floor - 128} Q700 ${floor - 160} 860 ${floor - 90}" stroke="#7fe3ff" stroke-width="5" fill="none" opacity=".85" filter="url(#blur)"/><path d="M556 ${floor - 128} Q700 ${floor - 160} 860 ${floor - 90}" stroke="#d8f8ff" stroke-width="2" fill="none"/>` +
      k.on(590, floor, 1.05, PARTY.dwarf(590, floor, 1.05, { attack: true }), 54) +
      k.on(660, floor, 1.05, PARTY.barbarian(660, floor, 1.05, { attack: true }), 52);
    // the wizard's spell lights the scene a little too (its orb is already on the staff)
    k.light({ kind: "magic", x: 556, y: floor - 128, layer: "near", color: "#7fe3ff", radius: 130, strength: 0.35 });
    // the undead, right of center, facing left
    svg += k.on(890, floor, 1.05, FOLK.skeleton(890, floor, 1.05, { pose: "lunge", front: -120, glow: true }), 40) +
      k.on(980, floor, 1.05, FOLK.draugr(980, floor, 1.05), 50) +
      k.on(1070, floor, 1, FOLK.skeleton(1070, floor, 1, { shield: true, glow: true, front: -60 }), 40) +
      k.on(1150, floor, 0.95, FOLK.skeleton(1150, floor, 0.95, { glow: true, front: -150 }), 40) +
      k.on(1230, floor, 0.95, FOLK.draugr(1230, floor, 0.95, { front: -40 }), 50);
    return svg;
  });

  // Foreground: dark boulders at the bottom corners, close to you
  k.layer("foreground", () => PROP.rock(-40, 336, 230, 70, "#07090b") + PROP.rock(1420, 336, 240, 60, "#07090b"));

  // Dust drifting in the torchlight
  k.particles({ kind: "dust", layer: "mid", x0: 110, x1: 330, y0: 90, y1: 280, count: 16, color: "#ffd9a0" })
   .particles({ kind: "dust", layer: "mid", x0: 1270, x1: 1490, y0: 90, y1: 280, count: 16, color: "#ffd9a0" })
   .particles({ kind: "dust", layer: "far", x0: 620, x1: 820, y0: 100, y1: 280, count: 10, color: "#ffd9a0" });
  return k.build();
}

/* ---------- Painted figures and scenes (test) ---------- */
// Each file's size and the box around the character inside it, in pixels (measured from the images)
const PAINTED = {
  wizard:          { src: "assets/characters/wizard-standard.webp",         w: 1024, h: 1536, box: [47, 0, 993, 1530], orb: [901, 166] },
  elf:             { src: "assets/characters/elf-standard.webp",            w: 1024, h: 1536, box: [20, 8, 996, 1513] },
  dwarf:           { src: "assets/characters/dwarf-standard.webp",          w: 1024, h: 1536, box: [12, 140, 1007, 1511] },
  barbarian:       { src: "assets/characters/barbarian-standard.webp",      w: 1024, h: 1536, box: [34, 6, 988, 1529] },
  skeletonSword:   { src: "assets/characters/skeleton-sword-standard.webp", w: 1024, h: 1536, box: [70, 10, 981, 1519] },
  skeletonSpear:   { src: "assets/characters/skeleton-spear-standard.webp", w: 1024, h: 1536, box: [7, 337, 1023, 1377] },
  skeletonBrute:   { src: "assets/characters/skeleton-brute-standard.webp", w: 1024, h: 1536, box: [10, 0, 1004, 1523] },
  skeletonBow:     { src: "assets/characters/skeleton-bow-standard.webp",   w: 1024, h: 1536, box: [26, 15, 987, 1523] },
  skeletonAxe:     { src: "assets/characters/skeleton-axe-standard.webp",   w: 1024, h: 1536, box: [20, 85, 1000, 1495] }
};
// A painted character standing at (x, floor), with the kit's soft shadow under its feet. Returns the shadow's SVG.
const painted = (k, who, x, floor, size, o = {}) => (k.figure({ ...PAINTED[who], x, y: floor, size, ...o }), k.shadow(x, floor + 1, size * 0.42));
// Where a spot in a character's image (pixels) lands in the scene, for a character placed by painted() at (x, floor) and size
const paintedPoint = (who, x, floor, size, [px, py]) => {
  const { h, box: [l, , r, b] } = PAINTED[who], s = size / h;
  return { x: x + (px - (l + r) / 2) * s, y: floor - (b - py) * s };
};

function paintedDungeonArt() {
  const floor = 296;
  const k = sceneKit({ air: "#0b1416", vignette: 0.55, grain: 0.06, seed: 4,
    figureFilter: "brightness(.8) contrast(1.05) saturate(.88) sepia(.12)" });   // dim and warm them to the torchlight
  // The painting covers the frame (1536 × 1024 drawn 1600 wide), moved up so its floor meets the ground line
  const paint = (file) => `<image href="assets/scenes/${file}" x="0" y="-100" width="1600" height="1067" preserveAspectRatio="none"/>`;

  const wizard = { x: 480, size: 143 };         // used for the wizard and for the glow on his orb

  // Mid: the painting, the shadows, and everyone on the floor (all at one depth, so feet stay put)
  k.layer("mid", () =>
    paint("dungeon.webp") +
    // the party, left of center, facing right
    painted(k, "elf", 380, floor, 141) +
    painted(k, "wizard", wizard.x, floor, wizard.size) +
    painted(k, "dwarf", 580, floor, 123, { anim: "lunge" }) +
    painted(k, "barbarian", 690, floor, 158, { anim: "lunge" }) +              // bigger: he's a barbarian
    // the undead, right of center, facing left: two staggered rows, with the giant anchoring the right flank
    // back row: in the gaps of the front row, a bit smaller and dimmer
    painted(k, "skeletonSword", 950, floor - 14, 134, { face: -1, filter: "brightness(.74) contrast(1.05) saturate(.85) sepia(.12)" }) +
    painted(k, "skeletonBow", 1050, floor - 14, 136, { face: -1, filter: "brightness(.74) contrast(1.05) saturate(.85) sepia(.12)" }) +
    // the giant: in front of the back row, out on the right
    painted(k, "skeletonBrute", 1180, floor - 4, 192, { face: -1, anim: "lunge" }) +
    // front row: on the ground line, leading the charge
    painted(k, "skeletonAxe", 1000, floor + 2, 141, { face: -1, anim: "lunge" }) +
    painted(k, "skeletonSpear", 900, floor + 2, 141, { face: -1, anim: "lunge" }));

  // Torch glows on the painted torches, so they flicker (the painting already has the torches themselves)
  for (const [x, y] of [[193, 67], [758, 75], [1415, 77]])
    k.light({ kind: "torch", x, y, layer: "mid", ground: 270, radius: 170, strength: 0.25 });
  // The orb on the wizard's staff
  const orb = paintedPoint("wizard", wizard.x, floor, wizard.size, PAINTED.wizard.orb);
  k.light({ kind: "magic", x: orb.x, y: orb.y, layer: "mid", color: "#9fe8ff", radius: 75, strength: 0.45 });

  // Foreground: the rubble overlay, framing the edges
  k.layer("foreground", () => paint("dungeon-front.webp"));

  // Dust drifting in the torchlight
  k.particles({ kind: "dust", layer: "near", x0: 110, x1: 300, y0: 40, y1: 260, count: 14, color: "#ffd9a0" })
   .particles({ kind: "dust", layer: "near", x0: 660, x1: 860, y0: 40, y1: 260, count: 12, color: "#ffd9a0" })
   .particles({ kind: "dust", layer: "near", x0: 1320, x1: 1510, y0: 40, y1: 260, count: 14, color: "#ffd9a0" });
  return k.build();
}

/* ---------- The dragon's cave ---------- */
function dragon(x, y, s) {                                       // faces left; (x, y) is where its neck leaves the cave
  const red = "#9a2420", dark = "#6a1814", belly = "#d89a5a";
  return place(x, y, s, true,
    // wings, spread behind
    P(pts([-10, -10], [-120, -170], [-60, -140], [-30, -160], [0, -110], [30, -150], [40, -60]), dark) +
    `<g stroke="#4a100c" stroke-width="4"><line x1="-10" y1="-10" x2="-120" y2="-170"/><line x1="0" y1="-30" x2="-30" y2="-160"/><line x1="20" y1="-40" x2="30" y2="-150"/></g>` +
    // neck
    P(pts([-20, 30], [-10, -20], [30, -70], [70, -100], [95, -86], [60, -50], [30, 0], [20, 40]), red) +
    P(pts([30, -70], [70, -100], [95, -86], [60, -50]), tone(red, 0.8)) +
    P(pts([20, 40], [30, 0], [60, -50], [70, -42], [44, 6], [36, 44]), belly) +
    // head
    P(pts([62, -112], [110, -126], [160, -114], [178, -100], [120, -92], [70, -84]), red) +
    P(pts([110, -126], [160, -114], [178, -100], [120, -96]), tone(red, 0.78)) +
    P(pts([78, -82], [120, -86], [172, -70], [168, -62], [118, -66], [76, -66]), dark) +             // lower jaw, open
    P(pts([92, -88], [172, -96], [170, -72], [100, -76]), "#ff8a2a") + glowDot(140, -84, 24, "#ffb040", 0.8) +   // fire in its mouth
    [0, 1, 2, 3].map(i => P(pts([118 + i * 14, -95], [122 + i * 14, -95], [120 + i * 14, -89]), "#f4ecd0") + P(pts([116 + i * 14, -70], [120 + i * 14, -70], [118 + i * 14, -76]), "#f4ecd0")).join("") +
    P(pts([74, -118], [40, -150], [84, -124]), "#e6dcc0") + P(pts([92, -122], [70, -160], [100, -126]), "#d0c4a4") +   // horns
    glowDot(116, -112, 12, "#ffe040", 0.9) + P(pts([108, -114], [124, -116], [118, -108]), "#fff070") +              // eye
    `<circle cx="176" cy="-108" r="6" fill="#888" opacity=".35" filter="url(#blur)"/>` +
    // claw on the rock
    P(pts([40, 30], [80, 10], [100, 30], [70, 40]), red) + [0, 1, 2].map(i => P(pts([88 + i * 8, 26], [100 + i * 8, 30], [90 + i * 8, 34]), "#f4ecd0")).join(""));
}
function caveArt() {
  const floor = 300;
  const air = "#8a6a86";                                    // dusky violet air
  const k = sceneKit({ air, grade: { color: "#ff9a6a", mode: "soft-light", opacity: 0.22 }, vignette: 0.5, grain: 0.08, seed: 3 });
  k.defs(grad("caveSky", [[0, "#1a1734"], [0.5, "#5a3456"], [0.8, "#b8604a"], [1, "#e8904a"]]));
  const snow = (x, y, w) => P(pts([x, y], [x + w * 0.35, y + w * 0.4], [x + w * 0.1, y + w * 0.32], [x - w * 0.1, y + w * 0.45], [x - w * 0.35, y + w * 0.38]), "#e8ecf4");

  // Sky: the dusk gradient and the low sun's glow
  k.layer("sky", () => rect(0, TOP, VIEW_W, VIEW_H - TOP, "url(#caveSky)") + glowDot(300, 235, 170, "#ffb070", 0.55));

  // Far: three ridges of mountains, each farther one paler and hazier
  k.layer("far", t => {
    const hz = (c, a) => hazeColor(c, a, air);
    return ridge(41, 170, 70, hz("#4a4a6a", 0.75), 120) +
      P(pts([0, 250], [140, 140], [260, 205], [400, 105], [540, 215], [690, 150], [820, 240], [0, 270]), hz("#4a4a6a", 0.5)) +
      snow(400, 105, 50) + snow(140, 140, 40) + snow(690, 150, 36) +
      ridge(43, 240, 40, t("#3e3a52"), 90);
  }, { mist: 0.35 });

  // Mid: the mountain with the cave, the dragon crawling out, and the fire in its jaws lighting the cave mouth
  k.layer("mid", t => {
    const face = (points, c) => P(points, c) + k.texPoly(points, "stone", 0.5);
    let svg = face(pts([700, VIEW_H], [820, 160], [960, 60], [1100, 20], [1260, 50], [1420, -40], [VIEW_W, -10], [VIEW_W, VIEW_H]), "#5a5550") +
      face(pts([1100, 20], [1260, 50], [1300, VIEW_H], [1000, VIEW_H]), "#4a4642") +
      face(pts([1420, -40], [VIEW_W, -10], [VIEW_W, VIEW_H], [1380, VIEW_H]), "#4e4a45") +
      snow(1100, 20, 60) +
      `<path d="M940 ${floor} Q950 140 1080 120 Q1210 130 1220 ${floor} Z" fill="#0c0808"/>`;
    k.light({ kind: "fire", x: 1080, y: 240, layer: "mid", radius: 170, color: "#ff5a1a", strength: 0.5 });           // glow deep inside the cave
    svg += dragon(1150, 292, 1.1);
    k.light({ kind: "fire", x: 996, y: 205, layer: "mid", ground: floor, radius: 300, color: "#ff7a30", strength: 0.6 }); // the fire in its jaws
    svg += k.shadow(955, floor + 2, 120) + PROP.rock(900, floor + 4, 110, 70, "#6a645c") +
      k.shadow(1260, floor + 2, 150) + PROP.rock(1190, floor + 4, 140, 80, "#625c54");
    return svg;
  });

  // Near: the rocky ground and the party, standing their ground
  k.layer("near", () =>
    rocksBelow(floor, "#3a3630", 32) + rect(0, floor, VIEW_W, 6, "#47423b") + k.texRect(0, floor, VIEW_W, BOTTOM - floor, "ground", 0.55) +
    k.shadow(220, floor + 2, 170) + PROP.rock(140, floor + 4, 160, 60, "#555048") +
    k.on(430, floor, 1.05, PARTY.elf(430, floor, 1.05, { aim: true, front: -100, back: -90 })) +
    k.on(510, floor, 1.05, PARTY.wizard(510, floor, 1.05, { cast: true })) +
    k.on(600, floor, 1.05, PARTY.dwarf(600, floor, 1.05, { back: -60, front: -40 }), 54) +
    k.on(680, floor, 1.05, PARTY.barbarian(680, floor, 1.05, { attack: true }), 52));

  // Foreground: dark rocks close to you
  k.layer("foreground", () => PROP.rock(-50, 336, 240, 80, "#120e0e") + PROP.rock(1400, 336, 260, 70, "#120e0e"));

  // Stars coming out, and embers drifting from the cave
  k.particles({ kind: "twinkle", layer: "sky", y0: TOP, y1: 110, count: 50 })
   .particles({ kind: "embers", layer: "mid", x0: 940, x1: 1180, y0: 170, y1: 295, count: 30 });
  return k.build();
}

/* ---------- The town square ---------- */
function townArt() {
  const floor = 300;
  const air = "#d4e4f0";                                    // bright, hazy daylight air
  const k = sceneKit({ air, grade: { color: "#ffe6b0", mode: "soft-light", opacity: 0.15 }, vignette: 0.28, grain: 0.06, seed: 5,
    cast: -0.9 });                                          // the sun is up and to the right, so shadows fall to the left
  k.defs(grad("townSky", [[0, "#2a64b8"], [0.6, "#7ab2e2"], [1, "#e6f2f8"]]));
  const sign = (draw) => (x, y) => rect(x + 20, y - 4, 4, 20, "#3a2414") + rect(x + 24, y + 2, 34, 26, "#7a5030") + draw(x + 41, y + 15);
  const bread = sign((x, y) => `<ellipse cx="${x}" cy="${y}" rx="11" ry="6" fill="#d9a050"/>`);
  const anvil = sign((x, y) => P(pts([x - 11, y - 5], [x + 11, y - 5], [x + 6, y], [x + 4, y + 6], [x - 4, y + 6], [x - 6, y]), "#3a3a40"));
  const potion = sign((x, y) => gem(x, y + 2, 7, "#8a3ac0", 8) + rect(x - 2, y - 9, 4, 6, "#c0c0c0"));
  const mug = sign((x, y) => place(x, y + 8, 1, false, ITEMS.mug()));
  const cobbles = (() => { const r = seeded(21); let s = ""; for (let y = floor - 40; y < VIEW_H; y += 10) for (let x = (y / 10 % 2) * 12; x < VIEW_W; x += 24) s += `<rect x="${x}" y="${y}" width="${20 + r() * 4}" height="8" rx="3" fill="${["#8a8276", "#7a7268", "#948c80"][Math.floor(r() * 3)]}"/>`; return s; })();
  const folk = [[540, 1, false, true], [600, 6, true, true], [700, 3, false, false], [930, 4, true, true], [990, 0, false, true], [1060, 7, true, false], [1130, 2, false, true], [1210, 5, true, true], [1290, 8, false, false], [1380, 9, true, true], [1460, 10, false, true]];
  // A puffy cloud: overlapping lumps, sunlit on top and soft blue-gray underneath
  const cloud = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">` +
    [[-60, 8, 30], [-20, -6, 38], [28, 0, 34], [62, 10, 24], [0, 12, 34]].map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#dfe8f2"/>`).join("") +
    [[-60, 2, 30], [-20, -14, 38], [28, -8, 34], [62, 4, 24]].map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff"/>`).join("") +
    `<ellipse cx="0" cy="22" rx="92" ry="14" fill="#dfe8f2"/></g>`;
  const hills = (pointsList, fill) => blob([[-120, VIEW_H + 80], ...pointsList, [VIEW_W + 120, VIEW_H + 80]], fill);

  // Sky: deep blue fading to a pale horizon, and the sun
  k.layer("sky", () => rect(0, TOP, VIEW_W, VIEW_H - TOP, "url(#townSky)") + glowDot(1380, 70, 70, "#fff6d0", 0.6) + `<circle cx="1380" cy="70" r="32" fill="#fff6d8"/>`);
  // Clouds, drifting slowly across
  k.layer("sky:clouds", () => cloud(200, 60, 0.9) + cloud(640, 34, 0.7) + cloud(1020, 78, 1) + cloud(1560, 40, 0.75) + cloud(-80, 30, 0.6), { drift: { dist: -90, dur: 80 } });

  // Far: two rows of hills fading into the haze, with the castle a faint shape on the farther one
  k.layer("far", t => {
    const hz = (c, a) => hazeColor(c, a, air);
    return hills([[0, 200], [260, 168], [560, 190], [800, 160], [1100, 186], [1400, 162], [1600, 190]], hz("#6a8a6a", 0.6)) +
      rect(762, 120, 76, 46, hz("#8a847a", 0.8)) + rect(748, 102, 20, 64, hz("#8a847a", 0.8)) + rect(832, 102, 20, 64, hz("#8a847a", 0.8)) +
      P(pts([748, 102], [758, 82], [768, 102]), hz("#6a4a4a", 0.8)) + P(pts([832, 102], [842, 82], [852, 102]), hz("#6a4a4a", 0.8)) +
      hills([[0, 222], [300, 200], [620, 228], [980, 204], [1300, 226], [1600, 206]], t("#6a945a"));
  }, { mist: 0.25 });

  // Mid: the houses and shops around the square
  k.layer("mid", () =>
    PROP.house(40, floor - 40, 150, 120, "#e8dcc0", "#8a3a2a", { sign: bread }) +
    PROP.house(230, floor - 40, 130, 140, "#d8c8a8", "#5a4a3a", { sign: anvil }) +
    PROP.house(1180, floor - 40, 140, 130, "#e0d4b8", "#3a5a7a", { sign: potion }) +
    PROP.house(1360, floor - 40, 170, 120, "#e8dcc0", "#7a3a2a", { sign: mug }));

  // Near: the cobbled square, the market, and everyone in it
  k.layer("near", () => {
    let svg = cobblesBelow(VIEW_H) + rect(0, floor - 40, VIEW_W, 60, "#8a8276") + cobbles + k.texRect(0, floor - 40, VIEW_W, BOTTOM - floor + 40, "ground", 0.45) +
      rect(0, floor - 40, VIEW_W, 5, "#00000022") +                                                      // the houses' shade along the edge of the square
      k.shadow(435, floor - 12, 140, 0.8) + PROP.stall(380, floor - 14, "#c0392b", "#f4ecd0", [0, 1, 2, 3, 4].map(i => gem(398 + i * 18, floor - 52, 6, i % 2 ? "#c0392b" : "#e0a020", 6)).join("")) +
      k.shadow(800, floor + 6, 190, 0.8) + PROP.fountain(800, floor + 6) +
      k.shadow(1085, floor - 12, 140, 0.8) + PROP.stall(1030, floor - 14, "#2a6a9a", "#f4ecd0", [0, 1, 2].map(i => `<ellipse cx="${1050 + i * 30}" cy="${floor - 52}" rx="12" ry="7" fill="#d9a050"/>`).join(""));
    svg += folk.map(([x, look, flip, walk]) => k.on(x, floor + 8, 0.95, FOLK.villager(x, floor + 8, 0.95, { look, flip, walk }), 40)).join("") +
      k.on(650, floor + 8, 0.6, FOLK.villager(650, floor + 8, 0.6, { look: 11, walk: true }), 40) +                                     // a child
      // the party, strolling in from the left
      k.on(120, floor + 10, 1, PARTY.elf(120, floor + 10, 1, {})) + k.on(180, floor + 10, 1, PARTY.wizard(180, floor + 10, 1, {})) +
      k.on(240, floor + 10, 1, PARTY.dwarf(240, floor + 10, 1, {}), 54) + k.on(300, floor + 10, 1, PARTY.barbarian(300, floor + 10, 1, {}), 52);
    return svg;
  });
  return k.build();
}

/* ---------- The wizard's tower ---------- */
function towerArt() {
  const floor = 300;
  const air = "#2a2448";
  const k = sceneKit({ air, grade: { color: "#6a4aa8", mode: "soft-light", opacity: 0.22 }, vignette: 0.6, grain: 0.08, seed: 6 });
  k.defs(grad("towerSky", [[0, "#07061a"], [0.7, "#1e1840"], [1, "#2e2456"]]) + grad("trail", [[0, "#ffb040"], [1, "#ff5a1a", 0]], false) +
    radial("nebulaA", [[0, "#7a3aa8", 0.35], [1, "#7a3aa8", 0]]) + radial("nebulaB", [[0, "#2a7a9a", 0.25], [1, "#2a7a9a", 0]]));
  // Fireballs fly from the dark wizard's hand down toward the party, over and over, a little apart in time
  const hand = [1080, 172], FLY = 2.6;
  const shots = [{ to: [840, 290], delay: 0, s: 1.1 }, { to: [760, 270], delay: 0.9, s: 0.9 }, { to: [920, 292], delay: 1.75, s: 0.75 }];
  const fireball = (s, angle) => `<g transform="translate(${hand[0]} ${hand[1]}) rotate(${angle}) scale(${s})">` +
    P(pts([0, -10], [90, -3], [90, 3], [0, 10]), "url(#trail)") + glowDot(0, 0, 22, "#ff7a1a", 0.8) + gem(0, 0, 12, "#ffb040", 8) + gem(-2, 0, 6, "#fff4c0", 6) + `</g>`;

  // Sky: night, with soft nebula clouds and the moon
  k.layer("sky", () => rect(0, TOP, VIEW_W, VIEW_H - TOP, "url(#towerSky)") +
    `<ellipse cx="520" cy="60" rx="420" ry="120" fill="url(#nebulaA)"/><ellipse cx="980" cy="20" rx="380" ry="100" fill="url(#nebulaB)"/><ellipse cx="200" cy="140" rx="260" ry="80" fill="url(#nebulaB)"/>` +
    stars(60, 3, 240) + glowDot(250, 70, 50, "#dde0ff", 0.35) + `<circle cx="250" cy="70" r="30" fill="#eef0ff"/><circle cx="262" cy="62" r="28" fill="#120f2c"/>`);

  // Far: hills fading into the night haze
  k.layer("far", t => ridge(5, 250, 40, t("#1c1a30"), 100) + ridge(6, 280, 20, t("#141226"), 60), { mist: 0.3 });

  // Mid: the tower, its glowing windows, the dark wizard on his balcony, and the fireballs
  k.layer("mid", () => {
    const tower = pts([1125, 10], [1275, 10], [1285, floor], [1115, floor]);
    let svg = trap(1200, 10, 150, floor, 170, "#4a4458") + k.texPoly(tower, "stone", 0.55) +
      Array.from({ length: 14 }, (_, i) => rect(1118, 20 + i * 20, 164, 2, "#2c2836")).join("") +
      P(pts([1100, 20], [1300, 20], [1200, -80]), "#3a2a5a") + k.texPoly(pts([1100, 20], [1300, 20], [1200, -80]), "stone", 0.4) +
      k.light({ kind: "window", x: 1200, y: 104, layer: "mid", w: 20, h: 26, color: "#b070ff", strength: 0.4, radius: 120 }) +
      k.light({ kind: "window", x: 1200, y: 264, layer: "mid", ground: floor, w: 20, h: 26, color: "#b070ff", strength: 0.4, radius: 120 }) +
      rect(1060, 222, 120, 10, "#3a3448") + Array.from({ length: 6 }, (_, i) => rect(1064 + i * 20, 200, 6, 22, "#3a3448")).join("") +   // balcony
      glowDot(1112, 175, 55, "#a050ff", 0.45) + FOLK.darkWizard(1110, 222, 1);
    k.light({ kind: "magic", x: 1112, y: 170, layer: "mid", radius: 170, strength: 0.5 });                   // his purple aura
    for (const sh of shots) {
      const dx = sh.to[0] - hand[0], dy = sh.to[1] - hand[1], angle = Math.atan2(-dy, -dx) * 180 / Math.PI;
      svg += `<g class="kit-fly" style="--fx:${dx}px;--fy:${dy}px;animation-duration:${FLY}s;animation-delay:-${sh.delay}s">${fireball(sh.s, angle)}</g>`;
      // its light, travelling with it, and its glow sweeping across the ground below
      k.light({ kind: "fire", x: hand[0], y: hand[1], layer: "mid", radius: 110 * sh.s, strength: 0.55, sweep: { dx, dy, dur: FLY, delay: sh.delay } });
      k.light({ kind: "fire", x: hand[0], y: floor - 6, layer: "mid", radius: 150 * sh.s, strength: 0.45, sweep: { dx, dy: 0, dur: FLY, delay: sh.delay } });
    }
    return svg;
  });

  // Near: the ground, the blast, and the party under the wizard's shield
  k.layer("near", () => {
    let svg = rocksBelow(floor, "#121020", 33) + rect(0, floor, VIEW_W, 6, "#1a1828") + k.texRect(0, floor, VIEW_W, BOTTOM - floor, "ground", 0.5) +
      k.light({ kind: "fire", x: 840, y: floor, layer: "near", ground: floor + 2, radius: 210, strength: 0.6 }) +    // the blast where they land
      `<ellipse cx="560" cy="${floor - 60}" rx="190" ry="110" fill="#7fe3ff" opacity=".12"/><ellipse cx="560" cy="${floor - 60}" rx="190" ry="110" fill="none" stroke="#9ff0ff" stroke-width="2.5" opacity=".7"/>`;
    k.light({ kind: "magic", x: 560, y: floor - 70, layer: "near", color: "#7fe3ff", radius: 230, strength: 0.22 });   // the shield glows
    svg += k.on(430, floor, 1.05, PARTY.elf(430, floor, 1.05, { aim: true, back: -125, front: -130 })) +
      k.on(510, floor, 1.05, PARTY.dwarf(510, floor, 1.05, { back: -150, front: -40 }), 54) +
      k.on(590, floor, 1.05, PARTY.wizard(590, floor, 1.05, { cast: true, front: -150 })) +
      k.on(670, floor, 1.05, PARTY.barbarian(670, floor, 1.05, { front: -120 }), 52);
    return svg;
  });

  // Foreground: dark rocks close to you
  k.layer("foreground", () => PROP.rock(-50, 336, 240, 80, "#06050c") + PROP.rock(1400, 336, 260, 70, "#06050c"));

  k.particles({ kind: "twinkle", layer: "sky", y0: TOP, y1: 230, count: 90 })
   .particles({ kind: "embers", layer: "near", x0: 800, x1: 880, y0: 260, y1: 296, count: 16 });
  return k.build();
}

/* ---------- The castle ---------- */
function castleArt() {
  const floor = 296;
  const k = sceneKit({ air: "#8a8478", grade: { color: "#ffe2a8", mode: "soft-light", opacity: 0.16 }, vignette: 0.45, grain: 0.07, seed: 8 });
  const windowArch = x => `<path d="M${x - 34} 230 V110 a34 34 0 0 1 68 0 V230 z" fill="#a8cce8"/><path d="M${x} 76 V230 M${x - 34} 150 H${x + 34}" stroke="#4a4438" stroke-width="5"/>`;
  const sway = (svg, i) => `<g class="kit-sway" style="animation-duration:${3.6 + i * 0.7}s;animation-delay:-${i * 1.3}s">${svg}</g>`;

  // Far: the stone wall, its tall windows letting in shafts of daylight, and the banners
  k.layer("far", t => {
    let svg = rect(0, TOP, VIEW_W, floor - TOP, t("#6a6458")) + k.texRect(0, TOP, VIEW_W, floor - TOP, "stone", 0.55);
    for (let y = 0; y < floor; y += 22) {                   // courses of stone blocks
      svg += rect(0, y, VIEW_W, 2, t("#57524a"));
      for (let x = (y / 22 % 2) * 40; x < VIEW_W; x += 80) svg += rect(x, y, 2, 22, t("#5c574e"));
    }
    for (const x of [330, 700, 1500]) {
      svg += glowDot(x, 150, 60, "#fff6dc", 0.35) + windowArch(x);
      k.light({ kind: "window", x, y: 153, layer: "far", ground: floor, w: 68, h: 154, color: "#fff2d0", strength: 0.3, radius: 150 });
    }
    return svg + sway(PROP.banner(520, 40, "#8a1a24"), 0) + sway(PROP.banner(880, 40, "#24407a"), 1) + sway(PROP.banner(1340, 40, "#8a1a24"), 2);
  });

  // Mid: the pillars with their torches, and the throne on its dais
  k.layer("mid", () => {
    const stone = (points, c) => P(points, c) + k.texPoly(points, "stone", 0.5);
    let svg = "";
    for (const x of [140, 1060]) {
      svg += k.shadow(x, floor + 2, 70) + PROP.pillar(x, floor, 250) + k.texRect(x - 20, floor - 250, 40, 250, "stone", 0.5) +
        k.light({ kind: "torch", x, y: 112, layer: "mid", radius: 130, strength: 0.32, size: 1.1 });
    }
    svg += k.shadow(1260, floor + 2, 360) + stone(pts([1110, floor - 30], [1410, floor - 30], [1425, floor], [1095, floor]), "#5a554a") +
      stone(pts([1140, floor - 46], [1380, floor - 46], [1395, floor - 30], [1125, floor - 30]), "#6a6458") +
      rect(1220, floor - 190, 80, 150, "#8a1a24") + P(pts([1210, floor - 190], [1260, floor - 230], [1310, floor - 190]), "#c9a34a") + rect(1205, floor - 80, 110, 34, "#c9a34a") + rect(1214, floor - 76, 92, 26, "#a8243a");
    return svg;
  });

  // Near: the stone floor and red carpet, and the knighting
  k.layer("near", () =>
    tilesBelow(floor, "#4a463e") + k.texRect(0, floor, VIEW_W, BOTTOM - floor, "stone", 0.5) +
    rect(560, floor, 900, 10, "#8a1a24") + rect(560, floor, 900, 3, "#c9a34a") +
    // courtiers and guards watching
    k.on(1420, floor, 0.95, FOLK.villager(1420, floor, 0.95, { look: 3, flip: true }), 40) + k.on(1490, floor, 0.95, FOLK.villager(1490, floor, 0.95, { look: 7, flip: true }), 40) +
    k.on(1150, floor, 1.05, FOLK.guard(1150, floor, 1.05, { flip: true })) + k.on(420, floor, 1.05, FOLK.guard(420, floor, 1.05)) +
    // the king knights the party
    k.on(985, floor, 1.15, FOLK.king(985, floor, 1.15, { flip: true }), 52) +
    k.on(878, floor, 1.05, PARTY.barbarian(880, floor, 1.05, { pose: "kneel", front: -10, back: 10, helm: false }), 66) +
    k.on(788, floor, 1.05, PARTY.dwarf(790, floor, 1.05, { pose: "kneel", front: -10, back: 10 }), 60) +
    k.on(708, floor, 1.05, PARTY.elf(710, floor, 1.05, { pose: "kneel", hood: false }), 60) +
    k.on(628, floor, 1.05, PARTY.wizard(630, floor, 1.05, { pose: "kneel" }), 62));

  // Dust floating in the window light
  for (const x of [330, 700, 1500]) k.particles({ kind: "dust", layer: "mid", x0: x - 70, x1: x + 70, y0: 150, y1: 290, count: 12, color: "#fff4d8" });
  return k.build();
}

/* ---------- The catalog ---------- */
const SCENES = [
  { id: "tavern", name: "Tavern", blurb: "Mugs up by the fire", art: tavernArt },
  { id: "dungeon", name: "Dungeon", blurb: "The dead don't stay down", art: dungeonArt },
  { id: "dungeon-painted", name: "Dungeon (Painted)", blurb: "Test: painted art", art: paintedDungeonArt, thumb: "assets/scenes/dungeon.webp" },
  { id: "cave", name: "Dragon's Cave", blurb: "Something stirs in the mountain", art: caveArt },
  { id: "town", name: "Town Square", blurb: "Market day", art: townArt },
  { id: "tower", name: "Wizard's Tower", blurb: "Incoming!", art: towerArt },
  { id: "castle", name: "Castle", blurb: "Arise, heroes of the realm", art: castleArt }
];
const DEFAULT_SCENE = "tavern";
const sceneById = id => SCENES.find(s => s.id === id) || SCENES[0];
// A scene's art is either one SVG string (drawn directly) or a kit-built scene, { html, preview } (see scenekit.js)
const artCache = new Map();
const sceneArt = s => { if (!artCache.has(s.id)) artCache.set(s.id, s.art()); return artCache.get(s.id); };
const artHtml = art => art.kit ? art.html : art;
const artPreview = art => art.kit ? art.preview : art;

function applyScene(id) {
  const s = sceneById(id);
  $("sceneArt").innerHTML = artHtml(sceneArt(s));
  kitMount($("sceneArt"));                             // mouse parallax, for kit-built scenes
  document.documentElement.dataset.scene = s.id;
  settings.scene = s.id; save();
  document.querySelectorAll(".scene-card").forEach(b => b.setAttribute("aria-pressed", b.dataset.id === s.id));
}

// --- The scene menu: a card per scene, with a picture of its banner
function buildSceneMenu() {
  $("sceneList").innerHTML = SCENES.map(s =>
    `<button type="button" class="scene-card" data-id="${s.id}" aria-pressed="${s.id === (settings.scene || DEFAULT_SCENE)}">` +
    `<img alt="" src="${s.thumb || `data:image/svg+xml;charset=utf-8,${encodeURIComponent(artPreview(sceneArt(s)).replace(/viewBox="[^"]*"/, 'viewBox="0 10 1600 300"'))}`}">` +
    `<span><b>${esc(s.name)}</b> ${esc(s.blurb)}</span></button>`).join("");
}
$("sceneList").addEventListener("click", e => { const b = e.target.closest(".scene-card"); if (b) applyScene(b.dataset.id); });
$("sceneBtn").onclick = () => { if (!$("sceneList").children.length) buildSceneMenu(); $("sceneMenu").showModal(); };
$("sceneDone").onclick = () => $("sceneMenu").close();
$("sceneMenu").addEventListener("click", e => { if (e.target === $("sceneMenu")) $("sceneMenu").close(); });

applyScene(settings.scene || DEFAULT_SCENE);
