// Tavern Table · scenes.js
// The six scenes, drawn behind the whole page, and the scene menu.
// Each scene is one SVG drawn from the cast and props in figures.js. The action happens in a 1600 × 320 strip
// (ground around y = 300); above it is a little more sky or ceiling, and below it the ground carries on to y = 900,
// so the picture can cover a whole window. It's cropped to fit the screen, so the action sits in the middle (x ≈ 450–1150).

const VIEW_W = 1600, VIEW_H = 320;              // the action strip
const TOP = -40, BOTTOM = 900;                  // the whole picture runs from y = -40 to 900
// body: the action strip. defs: gradients it uses. top: the color above the strip. ground: what's below it.
function sceneSvg(body, defs, { top, ground }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${TOP} ${VIEW_W} ${BOTTOM - TOP}" preserveAspectRatio="xMidYMin slice">` +
    `<defs><filter id="blur" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="6"/></filter>` +
    grad("fadeDown", [[0, "#000", 0], [1, "#000", 0.6]]) + `${defs}</defs>` +
    rect(0, TOP, VIEW_W, -TOP, top) + ground + body +
    rect(0, VIEW_H + 10, VIEW_W, BOTTOM - VIEW_H - 10, "url(#fadeDown)") +   // the ground darkens further down, behind the panels
    `</svg>`;
}
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
const sky = id => rect(0, 0, VIEW_W, VIEW_H, `url(#${id})`);
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

/* ---------- The tavern ---------- */
function tavernArt() {
  const floor = 300;
  const planks = Array.from({ length: 28 }, (_, i) => rect(i * 60, 0, 2, floor, "#24170d")).join("");
  const shelfBottles = (x0, y0) => ["#6a2a2a", "#2a5a3a", "#8a6a2a", "#3a3a6a", "#6a2a4a", "#2a4a5a", "#7a5a1a"].map((c, i) => PROP.bottle(x0 + i * 16, y0, c)).join("");
  return sceneSvg(
    rect(0, 0, VIEW_W, VIEW_H, "#3a2616") + planks +
    rect(0, 36, VIEW_W, 16, "#24170d") + rect(0, 36, VIEW_W, 4, "#4a3220") +                     // ceiling beam
    rect(0, floor, VIEW_W, 20, "#2a1a0e") + rect(0, floor, VIEW_W, 3, "#1a1008") +
    // hanging lanterns
    [330, 760, 1180].map(x => `<line x1="${x}" y1="52" x2="${x}" y2="92" stroke="#1a1008" stroke-width="2"/>` + glowDot(x, 104, 40, "#ffb050", 0.35) + trap(x, 92, 14, 116, 18, "#2a2a30") + rect(x - 6, 96, 12, 16, "#ffd27a")).join("") +
    // left: barrels and a table of locals
    PROP.barrel(60, floor, 1.2) + PROP.barrel(98, floor, 1.2) + PROP.barrel(79, floor - 48, 1.2) +
    FOLK.villager(250, floor + 16, 1, { look: 2, pose: "sit", front: -70, item: ITEMS.mug() }) +
    FOLK.villager(330, floor + 16, 1, { look: 5, pose: "sit", flip: true, front: -50 }) +
    PROP.table(290, floor, 110) + PROP.candle(290, floor - 30) +
    // the party's table, middle
    PARTY.elf(560, floor + 16, 1, { pose: "sit", front: -60, item: ITEMS.mug(), hood: false }) +
    PARTY.wizard(640, floor + 16, 1, { pose: "sit", front: -40 }) +
    PARTY.dwarf(750, floor + 16, 1, { pose: "sit", flip: true, front: -150, item: ITEMS.mug(), shield: false }) +
    PARTY.barbarian(830, floor + 16, 1, { pose: "sit", flip: true, front: -140, item: ITEMS.mug(), helm: false }) +
    PROP.table(700, floor, 260) + PROP.candle(700, floor - 30) +
    place(620, floor - 30, 1, false, ITEMS.mug()) + place(780, floor - 30, 1, false, ITEMS.mug()) +
    // fireplace
    rect(950, 120, 170, floor - 120, "#4a4440") + rect(1035, 120, 85, floor - 120, "#3e3935") + rect(940, 112, 190, 14, "#5a544e") +
    `<path d="M975 ${floor} V200 Q1035 160 1095 200 V${floor} Z" fill="#120a06"/>` +
    glowDot(1035, 270, 60, "#ff8a2a", 0.5) + `<g class="sf">${flameShape(1015, 292, 1.6)}${flameShape(1050, 294, 2)}</g>` + rect(990, 290, 90, 8, "#3a2414") +
    // the bar
    rect(1180, 70, 400, 6, "#24170d") + rect(1180, 130, 400, 6, "#24170d") + shelfBottles(1200, 70) + shelfBottles(1330, 70) + shelfBottles(1460, 70) + shelfBottles(1250, 130) + shelfBottles(1400, 130) +
    FOLK.barkeep(1330, floor - 20, 1, { flip: true }) +
    rect(1180, floor - 70, 420, 70, "#5a3a20") + rect(1180, floor - 76, 420, 10, "#7a5030") + Array.from({ length: 7 }, (_, i) => rect(1200 + i * 60, floor - 62, 40, 52, "#4a2e18")).join("") +
    place(1260, floor - 76, 1, false, ITEMS.mug()) + place(1420, floor - 76, 1, false, ITEMS.mug()) +
    FOLK.villager(1490, floor + 16, 1, { look: 3, pose: "sit", front: -60 }) +
    rect(0, 0, VIEW_W, VIEW_H, "url(#tavernShade)"),
    radial("tavernShade", [[0.3, "#000", 0], [1, "#000", 0.45]]),
    { top: "#2e1e11", ground: planksBelow(VIEW_H, "#2a1a0e") });
}

/* ---------- The dungeon ---------- */
function dungeonArt() {
  const floor = 296;
  const r = seeded(4);
  const tites = Array.from({ length: 26 }, (_, i) => PROP.stalactite(30 + i * 62 + r() * 30, 0, 30 + r() * 50, "#1e1f24")).join("");
  return sceneSvg(
    sky("dunSky") + glowDot(800, 200, 300, "#2a3a5a", 0.25) +
    ridge(1, 200, 60, "#1a1b20", 70, VIEW_H) +                                             // far rock
    P(pts([0, 0], [VIEW_W, 0], [VIEW_W, 60], [1300, 90], [1000, 50], [700, 80], [400, 55], [0, 85]), "#141519") + tites +
    PROP.rock(0, floor, 260, 210, "#2a2b31") + PROP.rock(1360, floor, 260, 220, "#2a2b31") +
    wallTorch(300, 140, 1.4) + wallTorch(1300, 140, 1.4) + glowDot(300, 140, 90, "#ff9a3a", 0.3) + glowDot(1300, 140, 90, "#ff9a3a", 0.3) +
    rect(0, floor, VIEW_W, 30, "#16171b") + ridge(9, floor + 6, 8, "#1d1e23", 40) +
    // scattered bones
    `<g stroke="#cfc8b2" stroke-width="3" stroke-linecap="round"><line x1="700" y1="${floor + 8}" x2="722" y2="${floor + 4}"/><line x1="990" y1="${floor + 10}" x2="1004" y2="${floor + 14}"/></g>` + gem(735, floor + 4, 6, "#cfc8b2", 7) +
    // the party, left of center, facing right
    PARTY.elf(430, floor, 1.05, { aim: true }) +
    PARTY.wizard(500, floor, 1.05, { cast: true }) +
    `<path d="M556 ${floor - 128} Q700 ${floor - 160} 860 ${floor - 90}" stroke="#7fe3ff" stroke-width="5" fill="none" opacity=".85" filter="url(#blur)"/><path d="M556 ${floor - 128} Q700 ${floor - 160} 860 ${floor - 90}" stroke="#d8f8ff" stroke-width="2" fill="none"/>` +
    PARTY.dwarf(590, floor, 1.05, { attack: true }) +
    PARTY.barbarian(660, floor, 1.05, { attack: true }) +
    // the undead, right of center, facing left
    FOLK.skeleton(890, floor, 1.05, { pose: "lunge", front: -120, glow: true }) +
    FOLK.draugr(980, floor, 1.05) +
    FOLK.skeleton(1070, floor, 1, { shield: true, glow: true, front: -60 }) +
    FOLK.skeleton(1150, floor, 0.95, { glow: true, front: -150 }) +
    FOLK.draugr(1230, floor, 0.95, { front: -40 }),
    grad("dunSky", [[0, "#0c0d10"], [1, "#22252c"]]),
    { top: "#141519", ground: rocksBelow(VIEW_H, "#16171b", 31) });
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
  return sceneSvg(
    sky("caveSky") + glowDot(300, 230, 160, "#ffb070", 0.5) + stars(40, 7, 90) +
    P(pts([0, 240], [120, 150], [230, 210], [380, 110], [520, 220], [650, 160], [760, 240], [0, 260]), "#4a4a6a") +            // far peaks
    P(pts([380, 110], [405, 130], [390, 132], [370, 128], [355, 138]), "#e8ecf4") + P(pts([120, 150], [140, 168], [100, 170]), "#e8ecf4") +
    // the mountain, with the cave
    P(pts([700, VIEW_H], [820, 160], [960, 60], [1100, 20], [1260, 50], [1420, 0], [VIEW_W, 30], [VIEW_W, VIEW_H]), "#5a5550") +
    P(pts([1100, 20], [1260, 50], [1300, VIEW_H], [1000, VIEW_H]), "#4a4642") + P(pts([1420, 0], [VIEW_W, 30], [VIEW_W, VIEW_H], [1380, VIEW_H]), "#4e4a45") +
    P(pts([1100, 20], [1130, 40], [1110, 46], [1090, 40], [1070, 50], [1060, 40]), "#e8ecf4") +
    `<path d="M940 ${floor} Q950 140 1080 120 Q1210 130 1220 ${floor} Z" fill="#0c0808"/>` + glowDot(1080, 240, 70, "#ff6a20", 0.35) +
    dragon(1150, 292, 1.1) +
    PROP.rock(900, floor + 4, 110, 70, "#6a645c") + PROP.rock(1190, floor + 4, 140, 80, "#625c54") +
    rect(0, floor, VIEW_W, 20, "#3a3630") + ridge(12, floor + 4, 10, "#47423b", 50) +
    PROP.rock(140, floor + 4, 160, 60, "#555048") +
    // the party, standing their ground
    PARTY.elf(430, floor, 1.05, { aim: true, front: -100, back: -90 }) +
    PARTY.wizard(510, floor, 1.05, { cast: true }) +
    PARTY.dwarf(600, floor, 1.05, { back: -60, front: -40 }) +
    PARTY.barbarian(680, floor, 1.05, { attack: true }),
    grad("caveSky", [[0, "#1e1a3a"], [0.55, "#6a3a5a"], [1, "#e0844a"]]),
    { top: "#1e1a3a", ground: rocksBelow(VIEW_H, "#3a3630", 32) });
}

/* ---------- The town square ---------- */
function townArt() {
  const floor = 300;
  const sign = (draw) => (x, y) => rect(x + 20, y - 4, 4, 20, "#3a2414") + rect(x + 24, y + 2, 34, 26, "#7a5030") + draw(x + 41, y + 15);
  const bread = sign((x, y) => `<ellipse cx="${x}" cy="${y}" rx="11" ry="6" fill="#d9a050"/>`);
  const anvil = sign((x, y) => P(pts([x - 11, y - 5], [x + 11, y - 5], [x + 6, y], [x + 4, y + 6], [x - 4, y + 6], [x - 6, y]), "#3a3a40"));
  const potion = sign((x, y) => gem(x, y + 2, 7, "#8a3ac0", 8) + rect(x - 2, y - 9, 4, 6, "#c0c0c0"));
  const mug = sign((x, y) => place(x, y + 8, 1, false, ITEMS.mug()));
  const cobbles = (() => { const r = seeded(21); let s = ""; for (let y = floor - 40; y < VIEW_H; y += 10) for (let x = (y / 10 % 2) * 12; x < VIEW_W; x += 24) s += `<rect x="${x}" y="${y}" width="${20 + r() * 4}" height="8" rx="3" fill="${["#8a8276", "#7a7268", "#948c80"][Math.floor(r() * 3)]}"/>`; return s; })();
  const folk = [[540, 1, false, true], [600, 6, true, true], [700, 3, false, false], [930, 4, true, true], [990, 0, false, true], [1060, 7, true, false], [1130, 2, false, true], [1210, 5, true, true], [1290, 8, false, false], [1380, 9, true, true], [1460, 10, false, true]];
  return sceneSvg(
    sky("townSky") + `<circle cx="1380" cy="70" r="34" fill="#fff2c0"/>` + glowDot(1380, 70, 60, "#fff2c0", 0.5) +
    [[200, 60], [620, 40], [1000, 75]].map(([x, y]) => `<g fill="#fff" opacity=".9"><ellipse cx="${x}" cy="${y}" rx="50" ry="14"/><ellipse cx="${x + 30}" cy="${y - 10}" rx="30" ry="14"/><ellipse cx="${x - 30}" cy="${y - 4}" rx="26" ry="10"/></g>`).join("") +
    // a castle on the hill far away
    ridge(3, 190, 30, "#7a9a6a", 120) + rect(760, 120, 80, 60, "#9a948a") + rect(745, 100, 22, 80, "#8a847a") + rect(833, 100, 22, 80, "#8a847a") + P(pts([745, 100], [756, 80], [767, 100]), "#6a3a3a") + P(pts([833, 100], [844, 80], [855, 100]), "#6a3a3a") +
    // the houses and shops
    PROP.house(40, floor - 40, 150, 120, "#e8dcc0", "#8a3a2a", { sign: bread }) +
    PROP.house(230, floor - 40, 130, 140, "#d8c8a8", "#5a4a3a", { sign: anvil }) +
    PROP.house(1180, floor - 40, 140, 130, "#e0d4b8", "#3a5a7a", { sign: potion }) +
    PROP.house(1360, floor - 40, 170, 120, "#e8dcc0", "#7a3a2a", { sign: mug }) +
    rect(0, floor - 40, VIEW_W, 60, "#8a8276") + cobbles +
    PROP.stall(380, floor - 14, "#c0392b", "#f4ecd0", [0, 1, 2, 3, 4].map(i => gem(398 + i * 18, floor - 52, 6, i % 2 ? "#c0392b" : "#e0a020", 6)).join("")) +
    PROP.fountain(800, floor + 6) +
    PROP.stall(1030, floor - 14, "#2a6a9a", "#f4ecd0", [0, 1, 2].map(i => `<ellipse cx="${1050 + i * 30}" cy="${floor - 52}" rx="12" ry="7" fill="#d9a050"/>`).join("")) +
    folk.map(([x, look, flip, walk]) => FOLK.villager(x, floor + 8, 0.95, { look, flip, walk })).join("") +
    FOLK.villager(650, floor + 8, 0.6, { look: 11, walk: true }) +                                    // a child
    // the party, strolling in from the left
    PARTY.elf(120, floor + 10, 1, {}) + PARTY.wizard(180, floor + 10, 1, {}) + PARTY.dwarf(240, floor + 10, 1, {}) + PARTY.barbarian(300, floor + 10, 1, {}),
    grad("townSky", [[0, "#5aa0e0"], [1, "#cfe8f8"]]),
    { top: "#5aa0e0", ground: cobblesBelow(VIEW_H) });
}

/* ---------- The wizard's tower ---------- */
function towerArt() {
  const floor = 300;
  const fireball = (x, y, s, angle) => `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${s})" class="fb">` +
    P(pts([0, -10], [90, -3], [90, 3], [0, 10]), "url(#trail)") + glowDot(0, 0, 22, "#ff7a1a", 0.8) + gem(0, 0, 12, "#ffb040", 8) + gem(-2, 0, 6, "#fff4c0", 6) + `</g>`;
  return sceneSvg(
    sky("towerSky") + stars(120, 3, 260) + `<circle cx="250" cy="70" r="30" fill="#eef0ff"/><circle cx="262" cy="62" r="28" fill="#1c1838"/>` +
    ridge(5, 250, 40, "#1c1a30", 100) + ridge(6, 280, 20, "#141226", 60) +
    // the tower
    trap(1200, 10, 150, floor, 170, "#4a4458") + Array.from({ length: 14 }, (_, i) => rect(1118, 20 + i * 20, 164, 2, "#2c2836")).join("") +
    P(pts([1100, 20], [1300, 20], [1200, -80]), "#3a2a5a") +
    [90, 250].map(y => glowDot(1200, y + 12, 22, "#b070ff", 0.6) + `<path d="M1190 ${y + 24} v-16 a10 10 0 0 1 20 0 v16 z" fill="#d8a0ff"/>`).join("") +
    rect(1060, 222, 120, 10, "#3a3448") + Array.from({ length: 6 }, (_, i) => rect(1064 + i * 20, 200, 6, 22, "#3a3448")).join("") +   // balcony
    glowDot(1112, 175, 55, "#a050ff", 0.45) + FOLK.darkWizard(1110, 222, 1) + glowDot(1080, 172, 40, "#ff5a1a", 0.35) +
    // fireballs raining down on the party
    fireball(950, 200, 1, -12) + fireball(780, 246, 1.1, -14) + fireball(1020, 160, 0.7, -8) +
    // a blast on the ground
    glowDot(840, floor - 10, 50, "#ff7a1a", 0.6) + `<g class="sf">${flameShape(830, floor, 1.6)}${flameShape(855, floor + 2, 1.2)}${flameShape(812, floor + 2, 1)}</g>` +
    rect(0, floor, VIEW_W, 20, "#121020") + ridge(8, floor + 4, 8, "#1a1828", 40) +
    // the party, shielded by the wizard
    `<ellipse cx="560" cy="${floor - 60}" rx="190" ry="110" fill="#7fe3ff" opacity=".12"/><ellipse cx="560" cy="${floor - 60}" rx="190" ry="110" fill="none" stroke="#9ff0ff" stroke-width="2.5" opacity=".7"/>` +
    PARTY.elf(430, floor, 1.05, { aim: true, back: -125, front: -130 }) +
    PARTY.dwarf(510, floor, 1.05, { back: -150, front: -40 }) +
    PARTY.wizard(590, floor, 1.05, { cast: true, front: -150 }) +
    PARTY.barbarian(670, floor, 1.05, { front: -120 }),
    grad("towerSky", [[0, "#0a0818"], [1, "#2a2050"]]) + grad("trail", [[0, "#ffb040"], [1, "#ff5a1a", 0]], false),
    { top: "#0a0818", ground: rocksBelow(VIEW_H, "#121020", 33) });
}

/* ---------- The castle ---------- */
function castleArt() {
  const floor = 296;
  const window_ = x => `<path d="M${x - 34} 230 V110 a34 34 0 0 1 68 0 V230 z" fill="#9ac0e0"/><path d="M${x} 76 V230 M${x - 34} 150 H${x + 34}" stroke="#4a4438" stroke-width="5"/>` +
    P(pts([x - 34, 230], [x + 34, 230], [x + 90, floor], [x - 10, floor]), "#fff6d8", ' opacity=".12"');
  return sceneSvg(
    rect(0, 0, VIEW_W, VIEW_H, "#6a6458") + Array.from({ length: 16 }, (_, i) => rect(0, i * 22, VIEW_W, 2, "#5a554a")).join("") +
    window_(330) + window_(700) + window_(1500) +
    PROP.banner(520, 40, "#8a1a24") + PROP.banner(880, 40, "#24407a") + PROP.banner(1340, 40, "#8a1a24") +
    PROP.pillar(140, floor, 250) + PROP.pillar(1060, floor, 250) +
    wallTorch(140, 120, 1.2) + wallTorch(1060, 120, 1.2) +
    // the floor and the red carpet
    rect(0, floor, VIEW_W, 30, "#4a463e") + rect(560, floor, 900, 10, "#8a1a24") + rect(560, floor, 900, 3, "#c9a34a") +
    // the throne on its dais
    trap(1260, floor - 30, 300, floor, 330, "#5a554a") + trap(1260, floor - 46, 240, floor - 30, 270, "#6a6458") +
    rect(1220, floor - 190, 80, 150, "#8a1a24") + P(pts([1210, floor - 190], [1260, floor - 230], [1310, floor - 190]), "#c9a34a") + rect(1205, floor - 80, 110, 34, "#c9a34a") + rect(1214, floor - 76, 92, 26, "#a8243a") +
    // courtiers watching
    FOLK.villager(1420, floor, 0.95, { look: 3, flip: true }) + FOLK.villager(1490, floor, 0.95, { look: 7, flip: true }) +
    FOLK.guard(1150, floor, 1.05, { flip: true }) + FOLK.guard(420, floor, 1.05) +
    // the king knights the party
    FOLK.king(985, floor, 1.15, { flip: true }) +
    PARTY.barbarian(880, floor, 1.05, { pose: "kneel", front: -10, back: 10, helm: false }) +
    PARTY.dwarf(790, floor, 1.05, { pose: "kneel", front: -10, back: 10 }) +
    PARTY.elf(710, floor, 1.05, { pose: "kneel", hood: false }) +
    PARTY.wizard(630, floor, 1.05, { pose: "kneel" }),
    "", { top: "#6a6458", ground: tilesBelow(VIEW_H, "#4a463e") });
}

/* ---------- The catalog ---------- */
const SCENES = [
  { id: "tavern", name: "Tavern", blurb: "Mugs up by the fire", art: tavernArt },
  { id: "dungeon", name: "Dungeon", blurb: "The dead don't stay down", art: dungeonArt },
  { id: "cave", name: "Dragon's Cave", blurb: "Something stirs in the mountain", art: caveArt },
  { id: "town", name: "Town Square", blurb: "Market day", art: townArt },
  { id: "tower", name: "Wizard's Tower", blurb: "Incoming!", art: towerArt },
  { id: "castle", name: "Castle", blurb: "Arise, heroes of the realm", art: castleArt }
];
const DEFAULT_SCENE = "tavern";
const sceneById = id => SCENES.find(s => s.id === id) || SCENES[0];
const artCache = new Map();
const sceneArt = s => { if (!artCache.has(s.id)) artCache.set(s.id, s.art()); return artCache.get(s.id); };

function applyScene(id) {
  const s = sceneById(id);
  $("sceneArt").innerHTML = sceneArt(s);
  document.documentElement.dataset.scene = s.id;
  state.scene = s.id; save();
  document.querySelectorAll(".scene-card").forEach(b => b.setAttribute("aria-pressed", b.dataset.id === s.id));
}

// --- The scene menu: a card per scene, with a picture of its banner
function buildSceneMenu() {
  $("sceneList").innerHTML = SCENES.map(s =>
    `<button type="button" class="scene-card" data-id="${s.id}" aria-pressed="${s.id === (state.scene || DEFAULT_SCENE)}">` +
    `<img alt="" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(sceneArt(s).replace(/viewBox="[^"]*"/, 'viewBox="0 10 1600 300"'))}">` +
    `<span><b>${esc(s.name)}</b> ${esc(s.blurb)}</span></button>`).join("");
}
$("sceneList").addEventListener("click", e => { const b = e.target.closest(".scene-card"); if (b) applyScene(b.dataset.id); });
$("sceneBtn").onclick = () => { if (!$("sceneList").children.length) buildSceneMenu(); $("sceneMenu").showModal(); };
$("sceneDone").onclick = () => $("sceneMenu").close();
$("sceneMenu").addEventListener("click", e => { if (e.target === $("sceneMenu")) $("sceneMenu").close(); });

applyScene(state.scene || DEFAULT_SCENE);
