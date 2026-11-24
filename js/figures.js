// Tavern Table · figures.js
// The cast and the props for the scene banners, drawn as chunky low-poly SVG.
// Every figure stands with its feet at (x, y) and faces right; pass flip: true to face left.
// Light comes from the left, so each shape has a lit left half and a shaded right half.

/* ---------- Drawing helpers ---------- */
const pts = (...p) => p.map(q => q.join(",")).join(" ");
const P = (points, fill, extra = "") => `<polygon points="${points}" fill="${fill}"${extra}/>`;
function tone(hexColor, k) {                     // k < 1 darker, k > 1 lighter
  const c = hex(hexColor).map(v => Math.max(0, Math.min(255, Math.round(k > 1 ? v + (255 - v) * (k - 1) : v * k))));
  return "#" + c.map(v => v.toString(16).padStart(2, "0")).join("");
}
// A trapezoid centered on cx, from width w0 at y0 to width w1 at y1, lit on the left
function trap(cx, y0, w0, y1, w1, c) {
  const a = [cx - w0 / 2, y0], b = [cx + w0 / 2, y0], br = [cx + w1 / 2, y1], bl = [cx - w1 / 2, y1];
  return P(pts(a, [cx, y0], [cx, y1], bl), c) + P(pts([cx, y0], b, br, [cx, y1]), tone(c, 0.76));
}
// A faceted "round" shape: an n-sided polygon, lit on the left
function gem(cx, cy, r, c, n = 8, rot = 0) {
  const v = Array.from({ length: n }, (_, i) => { const a = rot + (i / n) * Math.PI * 2 - Math.PI / 2; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
  // corners go clockwise from the top, so the second half of the list (plus the top corner) is the left side
  const left = v.slice(Math.floor(n / 2)).concat([v[0]]);
  return P(pts(...v), tone(c, 0.78)) + P(pts(...left), c);
}
const rect = (x, y, w, h, c, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"${extra}/>`;
const glowDot = (cx, cy, r, c, o = 0.55) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}" opacity="${o}" filter="url(#blur)"/>`;
const place = (x, y, s, flip, inner) => `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">${inner}</g>`;

/* ---------- Things held in a hand ----------
   Each is drawn standing up from the grip at (0, 0), in world orientation (held() undoes the arm's turn). */
const ITEMS = {
  staff: (orb = "#7fe3ff") => rect(-2, -62, 4, 92, "#6b4423") + rect(0, -62, 2, 92, "#4e3018") + glowDot(0, -68, 12, orb, 0.7) + gem(0, -68, 6, orb, 6),
  axe: () => rect(-2, -54, 4, 66, "#5a3a1e") + P(pts([2, -54], [20, -64], [24, -46], [20, -30], [2, -38]), "#b8bcc4") + P(pts([2, -46], [22, -47], [20, -30], [2, -38]), "#8a8e96") + P(pts([-2, -54], [-14, -60], [-16, -44], [-2, -40]), "#9a9ea6"),
  hammer: () => rect(-2, -44, 4, 54, "#5a3a1e") + trap(0, -56, 28, -40, 28, "#8a8e96"),
  sword: () => trap(0, -50, 6, 0, 7, "#d6dae2") + rect(-9, -2, 18, 4, "#c9a34a") + rect(-2, 2, 4, 9, "#5a3a1e") + gem(0, 13, 3, "#c9a34a", 6),
  rusty: () => trap(0, -42, 6, 0, 7, "#9a8a6a") + rect(-8, -2, 16, 4, "#5a4a3a") + rect(-2, 2, 4, 8, "#3a2a1a"),
  spear: () => rect(-1.5, -80, 3, 110, "#6b4423") + P(pts([0, -98], [6, -80], [0, -76], [-6, -80]), "#c4c8d0"),
  bow: () => `<path d="M0 -36 Q 18 0 0 36" fill="none" stroke="#7a4f28" stroke-width="4"/><line x1="0" y1="-36" x2="-10" y2="0" stroke="#e8e0c8" stroke-width="1"/><line x1="-10" y1="0" x2="0" y2="36" stroke="#e8e0c8" stroke-width="1"/>` +
         `<line x1="-10" y1="0" x2="34" y2="0" stroke="#8a6a3a" stroke-width="2"/>` + P(pts([34, -3], [42, 0], [34, 3]), "#c4c8d0"),
  shield: (c = "#7a3a2a") => gem(0, 0, 15, c, 10) + gem(0, 0, 5, "#b8bcc4", 6),
  mug: () => trap(0, -10, 9, 2, 9, "#8a5a2a") + rect(-5, -13, 10, 4, "#f4ecd0") + `<path d="M4.5 -7 h4 v6 h-4" fill="none" stroke="#6a4420" stroke-width="2"/>`,
  basket: () => trap(0, -2, 18, 10, 14, "#a8783e") + `<path d="M-8 -2 Q0 -14 8 -2" fill="none" stroke="#7a5428" stroke-width="2"/>` + gem(-3, -4, 3, "#c0392b", 6) + gem(3, -4, 3, "#e0a020", 6),
  fireball: () => glowDot(0, -6, 16, "#ff8a20", 0.8) + gem(0, -6, 8, "#ffd060", 8) + gem(0, -6, 4, "#fff4c0", 6),
  torch: () => rect(-2, -26, 4, 36, "#5a3a1e") + `<g class="sf">${flameShape(0, -26, 1.1)}</g>`,
  none: () => ""
};
function held(angle, item, tilt = 0) {
  return item ? `<g transform="translate(0 31) rotate(${-angle + tilt})">${item}</g>` : "";
}
// An arm hanging from the shoulder at (sx, -76), turned by `angle` degrees (0 = straight down, -90 = straight forward)
function arm(sx, angle, sleeve, skin, item = "", tilt = 0, shoulderY = -76) {
  return `<g transform="translate(${sx} ${shoulderY}) rotate(${angle})">${trap(0, 0, 9, 28, 7, sleeve)}${gem(0, 31, 4, skin, 6)}${held(angle, item, tilt)}</g>`;
}

/* ---------- A person ----------
   o: skin, top, legs, boots, robe, belt, pose ("stand", "sit", "kneel"), back/front arm angles and items, head extras, wide */
function person(o) {
  const { skin = "#e2b48c", top = "#7a5a3a", legs = "#4a3a2a", boots = "#2a1d12", robe, belt, pose = "stand",
    back = 12, front = -12, backItem = "", frontItem = "", backTilt = 0, frontTilt = 0,
    headwear = "", face = "", wide = 1, eyes = "#1a1410", chest = "" } = o;
  const drop = pose === "kneel" ? 22 : 0;
  const w = 28 * wide, hip = 22 * wide;
  let lower = "";
  if (pose === "stand") {
    lower = robe ? trap(0, -50, hip + 2, 0, 40 * wide, robe) + trap(-8, -4, 10, 0, 12, boots) + trap(8, -4, 10, 0, 12, boots)
      : trap(-6 * wide, -46, 10 * wide, 0, 9 * wide, legs) + trap(6 * wide, -46, 10 * wide, 0, 9 * wide, legs) + trap(-6 * wide, -9, 10 * wide, 0, 13 * wide, boots) + trap(7 * wide, -9, 10 * wide, 0, 13 * wide, boots);
  } else if (pose === "kneel") {
    const c = robe || legs;
    lower = P(pts([2, -26], [12, -26], [26, -22], [26, -14], [4, -14]), c) + P(pts([18, -16], [27, -16], [27, 0], [18, 0]), tone(c, 0.8)) + trap(23, -5, 10, 0, 14, boots)
      + P(pts([-10, -26], [2, -26], [0, -2], [-10, -2]), tone(c, 0.9)) + P(pts([-10, -8], [-30, -6], [-30, 0], [-10, 0]), tone(c, 0.7)) + trap(-32, -6, 6, 0, 8, boots);
  }
  const upper =
    arm(-15 * wide, back, top, skin, backItem, backTilt) +
    (robe && pose !== "sit" ? trap(0, -80, w, -46, hip + 4, robe) : trap(0, -80, w, -46, hip, top)) + chest +
    (belt ? rect(-hip / 2, -50, hip, 5, belt) + rect(-3, -50, 6, 5, "#c9a34a") : "") +
    rect(-4, -86, 8, 7, tone(skin, 0.85)) +                                   // neck
    `<g transform="translate(0 -92)">${gem(0, 0, 11, skin, 8)}` +
      `<rect x="1" y="-2" width="3" height="3" fill="${eyes}"/><rect x="6" y="-2" width="3" height="3" fill="${eyes}"/>${face}${headwear}</g>` +
    arm(15 * wide, front, top, skin, frontItem, frontTilt);
  return lower + `<g transform="translate(0 ${drop})">${upper}</g>`;
}

/* ---------- Headwear and faces (drawn around the head's center) ---------- */
const HEAD = {
  wizardHat: (c = "#2f4fa0") => P(pts([-18, -6], [18, -6], [12, -2], [-12, -2]), tone(c, 0.8)) + P(pts([-12, -6], [12, -6], [10, -24], [2, -42], [-4, -22]), c) + P(pts([2, -42], [10, -24], [12, -6], [4, -6]), tone(c, 0.75)) + rect(-12, -9, 24, 4, "#c9a34a"),
  beard: (c = "#e8e8e8", len = 22) => P(pts([-10, 3], [11, 3], [6, 3 + len * 0.6], [1, 3 + len]), c) + P(pts([1, 3], [11, 3], [6, 3 + len * 0.6], [1, 3 + len]), tone(c, 0.82)),
  hornHelm: (c = "#8a8e96") => P(pts([-11, -2], [11, -2], [9, -10], [0, -14], [-9, -10]), c) + P(pts([-11, -6], [-20, -14], [-22, -26], [-15, -12], [-9, -8]), "#efe6cf") + P(pts([11, -6], [20, -14], [22, -26], [15, -12], [9, -8]), "#d8ccb0"),
  hair: (c = "#b5442a", long = true) => P(pts([-12, 2], [-11, -8], [-2, -13], [10, -9], [12, 0], [6, -6], [-6, -7], [-8, long ? 14 : 4], [-12, long ? 12 : 4]), c),
  hood: (c = "#3c6a32") => P(pts([-13, 8], [-14, -6], [-4, -16], [8, -14], [14, -4], [13, 4], [9, -6], [-4, -8], [-8, 6]), c) + P(pts([8, -14], [14, -4], [13, 4], [9, -6]), tone(c, 0.75)),
  elfEar: () => P(pts([-10, -2], [-19, -8], [-11, 3]), "#e8c49c"),
  roundHelm: (c = "#9aa0aa") => P(pts([-12, -1], [-10, -10], [0, -14], [10, -10], [12, -1]), c) + P(pts([0, -14], [10, -10], [12, -1], [0, -1]), tone(c, 0.75)) + rect(-1.5, -1, 3, 9, tone(c, 0.7)),
  bigBeard: (c = "#c8641e") => P(pts([-12, 0], [12, 0], [13, 14], [6, 30], [-6, 30], [-13, 14]), c) + P(pts([0, 0], [12, 0], [13, 14], [6, 30], [0, 30]), tone(c, 0.8)) + P(pts([-6, 3], [8, 3], [6, 7], [-4, 7]), "#7a3a14"),
  crown: () => P(pts([-11, -6], [-11, -16], [-6, -10], [0, -19], [6, -10], [11, -16], [11, -6]), "#e0b040") + rect(-11, -8, 22, 3, "#b88a20") + gem(0, -11, 2.2, "#c0392b", 6),
  cap: (c) => P(pts([-12, -3], [-10, -11], [2, -14], [12, -8], [16, -4], [12, -3]), c),
  bun: (c) => P(pts([-12, 1], [-11, -9], [0, -13], [11, -9], [12, 1], [8, -5], [-8, -5]), c) + gem(-8, -12, 5, c, 6),
  darkHood: () => P(pts([-15, 12], [-16, -6], [-4, -20], [6, -18], [15, -6], [14, 12], [8, 2], [8, -6], [-8, -6], [-8, 4]), "#2a1a3a") + P(pts([6, -18], [15, -6], [14, 12], [8, 2], [8, -6]), "#1c1028"),
  glowEyes: (c = "#7fe3ff") => glowDot(5, 0, 6, c, 0.6) + `<rect x="1" y="-2" width="3" height="3" fill="${c}"/><rect x="6" y="-2" width="3" height="3" fill="${c}"/>`,
  shadowFace: () => rect(-8, -6, 18, 12, "#0e0814")
};

/* ---------- The party ---------- */
const PARTY = {
  wizard: (x, y, s = 1, o = {}) => place(x, y, s, o.flip, person({
    robe: "#2f4fa0", top: "#2f4fa0", belt: "#c9a34a", pose: o.pose,
    back: o.back ?? 10, backItem: o.cast ? "" : ITEMS.staff(), backTilt: 0,
    front: o.front ?? (o.cast ? -115 : -20), frontItem: o.cast ? ITEMS.staff() : "", frontTilt: o.cast ? 20 : 0,
    headwear: HEAD.wizardHat() + HEAD.beard()
  })),
  barbarian: (x, y, s = 1, o = {}) => place(x, y, s, o.flip, person({
    skin: "#d9a07a", top: "#d9a07a", legs: "#6a4a2a", boots: "#4a3020", belt: "#3a2414", wide: 1.15, pose: o.pose,
    chest: P(pts([-16, -80], [-6, -80], [14, -48], [6, -48]), "#7a5232"),               // fur strap
    back: o.back ?? 18, front: o.front ?? (o.attack ? -155 : -35), frontItem: o.item ?? ITEMS.axe(), frontTilt: o.attack ? 30 : 10,
    headwear: HEAD.hair("#b5442a") + (o.helm === false ? "" : HEAD.hornHelm())
  })),
  dwarf: (x, y, s = 1, o = {}) => place(x, y, s * 0.8, o.flip, person({
    skin: "#e0aa82", top: "#8a8e96", legs: "#5a3a22", boots: "#3a2414", belt: "#4a2e18", wide: 1.3, pose: o.pose,
    back: o.back ?? 20, backItem: o.shield === false ? "" : ITEMS.shield(), front: o.front ?? (o.attack ? -140 : -40), frontItem: o.item ?? ITEMS.hammer(), frontTilt: o.attack ? 20 : 0,
    headwear: HEAD.bigBeard() + HEAD.roundHelm()
  })),
  elf: (x, y, s = 1, o = {}) => place(x, y, s, o.flip, person({
    skin: "#e8c49c", top: "#3c6a32", legs: "#4a3a24", boots: "#3a2a18", belt: "#6a4a24", pose: o.pose,
    back: o.back ?? (o.aim ? -80 : 15), front: o.front ?? (o.aim ? -88 : -15), frontItem: o.item ?? (o.aim ? ITEMS.bow() : ""), backItem: o.aim ? "" : (o.item === undefined ? ITEMS.bow() : ""), backTilt: o.aim ? 0 : 20,
    headwear: HEAD.elfEar() + HEAD.hair("#e8d070", true) + (o.hood === false ? "" : HEAD.hood())
  }))
};
// The four heroes, standing in a row facing right, starting at x
function partyLine(x, y, s = 1, o = {}) {
  const g = 52 * s;
  return PARTY.elf(x, y, s, o.elf || {}) + PARTY.wizard(x + g, y, s, o.wizard || {}) + PARTY.dwarf(x + g * 2, y, s, o.dwarf || {}) + PARTY.barbarian(x + g * 3.1, y, s, o.barbarian || {});
}

/* ---------- Everyone else ---------- */
const FOLK = {
  skeleton: (x, y, s = 1, o = {}) => place(x, y, s, o.flip ?? true, (() => {
    const bone = "#e6dfc8", st = `stroke="${bone}" stroke-width="4" stroke-linecap="round"`;
    const legsUp = o.pose === "lunge";
    return `<line x1="-5" y1="-46" x2="${legsUp ? -14 : -7}" y2="0" ${st}/><line x1="5" y1="-46" x2="${legsUp ? 16 : 7}" y2="0" ${st}/>` +
      trap(0, -50, 18, -44, 14, bone) +
      `<line x1="0" y1="-80" x2="0" y2="-48" ${st}/>` +
      [-74, -67, -60].map(yy => `<path d="M-11 ${yy} Q0 ${yy + 6} 11 ${yy}" fill="none" stroke="${bone}" stroke-width="3"/>`).join("") +
      `<g transform="translate(-13 -78) rotate(${o.back ?? 15})"><line x1="0" y1="0" x2="0" y2="28" ${st}/>${held(o.back ?? 15, o.shield ? ITEMS.shield("#5a4a3a") : "")}</g>` +
      `<g transform="translate(0 -92)">${gem(0, 0, 11, bone, 8)}${rect(1, -3, 4, 4, "#1a1410")}${rect(6, -3, 4, 4, "#1a1410")}${rect(0, 6, 9, 3, "#1a1410")}${o.glow ? HEAD.glowEyes("#ff5a3a") : ""}</g>` +
      `<g transform="translate(13 -78) rotate(${o.front ?? -100})"><line x1="0" y1="0" x2="0" y2="28" ${st}/>${held(o.front ?? -100, ITEMS.rusty(), 15)}</g>`;
  })()),
  draugr: (x, y, s = 1, o = {}) => place(x, y, s * 1.08, o.flip ?? true, person({
    skin: "#7d9396", top: "#3d3a36", legs: "#2c2a27", boots: "#1e1c1a", belt: "#5a3a22", wide: 1.1,
    chest: P(pts([-14, -80], [14, -80], [10, -60], [-10, -60]), "#55504a") + P(pts([-6, -70], [6, -70], [0, -56]), "#2c2a27"),
    back: o.back ?? 20, backItem: ITEMS.shield("#3a3632"), front: o.front ?? -150, frontItem: ITEMS.axe(), frontTilt: 25,
    eyes: "#7fe3ff", headwear: HEAD.glowEyes() + HEAD.hornHelm("#5a5650")
  })),
  king: (x, y, s = 1, o = {}) => place(x, y, s, o.flip, person({
    robe: "#8a1a24", top: "#8a1a24", skin: "#e6b896", belt: "#c9a34a",
    chest: rect(-3, -80, 6, 34, "#f4f0e6") + P(pts([-14, -80], [14, -80], [12, -74], [-12, -74]), "#f4f0e6"),
    back: o.back ?? 14, front: o.front ?? -62, frontItem: o.item ?? ITEMS.sword(), frontTilt: o.tilt ?? 70,
    headwear: HEAD.crown() + HEAD.beard("#cfcfcf", 16)
  })),
  guard: (x, y, s = 1, o = {}) => place(x, y, s, o.flip, person({
    top: "#9aa0aa", legs: "#4a4a52", boots: "#2a2a30", belt: "#5a3a22", skin: "#d9aa86",
    chest: P(pts([-10, -78], [10, -78], [8, -52], [-8, -52]), "#a8243a"),
    back: 8, front: -8, frontItem: ITEMS.spear(), frontTilt: 0, headwear: HEAD.roundHelm("#b8bcc4")
  })),
  darkWizard: (x, y, s = 1, o = {}) => place(x, y, s, o.flip ?? true, person({
    robe: "#2a1a3a", top: "#2a1a3a", belt: "#6a2a8a", skin: "#b8a8b8",
    back: o.back ?? -150, backItem: "", front: o.front ?? -125, frontItem: ITEMS.fireball(), frontTilt: 0,
    eyes: "#ff3a2a", headwear: HEAD.shadowFace() + HEAD.glowEyes("#ff4a2a") + HEAD.darkHood()
  })),
  barkeep: (x, y, s = 1, o = {}) => place(x, y, s, o.flip, person({
    top: "#e8dcc0", legs: "#4a3a2a", skin: "#e2b48c", wide: 1.15,
    chest: trap(0, -72, 20, -40, 24, "#f4f0e6"),
    back: 10, front: o.front ?? -60, frontItem: ITEMS.mug(), headwear: HEAD.hair("#5a3a22", false) + `<path d="M-2 6 q4 3 9 0" stroke="#5a3a22" stroke-width="2.5" fill="none"/>`
  })),
  // Townsfolk and tavern patrons: pick a look by number, so a crowd varies but always draws the same
  villager: (x, y, s = 1, o = {}) => {
    const n = o.look ?? 0;
    const tops = ["#8a3a2a", "#2a5a7a", "#6a7a2a", "#7a4a8a", "#a8783e", "#3a6a5a", "#9a5a2a", "#5a5a7a"];
    const skins = ["#e2b48c", "#c48a62", "#8a5a3a", "#f0c8a0", "#d9a07a"];
    const hairs = ["#3a2414", "#a86a2a", "#1a1410", "#d8c070", "#7a7a7a"];
    const top = tops[n % tops.length], skin = skins[(n * 3) % skins.length], hair = hairs[(n * 7) % hairs.length];
    const hats = [HEAD.cap(tone(top, 0.6)), HEAD.bun(hair), HEAD.hair(hair, false), HEAD.hood(tone(top, 0.8)), HEAD.hair(hair, true)];
    const dress = n % 3 === 1;
    return place(x, y, s * (0.9 + (n % 4) * 0.05), o.flip, person({
      skin, top, legs: tone(top, 0.5), robe: dress ? tone(top, 0.85) : undefined, pose: o.pose,
      back: o.back ?? (o.walk ? 25 : 8), front: o.front ?? (o.walk ? -25 : -8),
      frontItem: o.item ?? (n % 4 === 0 && !o.pose ? ITEMS.basket() : ""),
      headwear: hats[n % hats.length]
    }));
  }
};

/* ---------- Flames (animated by the .sf class in scenes.css) ---------- */
function flameShape(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">` +
    glowDot(0, -8, 14, "#ff9a2e", 0.45) +
    `<path d="M0 -26 C3 -18 9 -14 8 -6 C7 1 3 3 0 3 C-4 3 -8 0 -8 -6 C-8 -12 -3 -14 -2 -20 C-1 -16 0 -15 1 -14 C0 -18 0 -22 0 -26Z" fill="#ff7a1a"/>` +
    `<path d="M0 -14 C2 -9 5 -6 4 -2 C4 1 2 2 0 2 C-2 2 -4 1 -4 -2 C-4 -6 -1 -9 0 -14Z" fill="#ffd25a"/></g>`;
}
const wallTorch = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${rect(-3, -6, 6, 26, "#4a3020")}${trap(0, 16, 14, 22, 6, "#2a2a30")}<g class="sf">${flameShape(0, -6, 1)}</g></g>`;

/* ---------- Props ---------- */
const PROP = {
  table: (x, y, w = 90) => trap(x, y - 30, w, y - 24, w - 6, "#7a4e2a") + trap(x, y - 24, w - 6, y - 21, w - 10, "#4e3018") + trap(x, y - 21, 10, y, 14, "#4e3018"),
  candle: (x, y) => rect(x - 2, y - 10, 4, 10, "#f0e6c8") + `<g class="sf">${flameShape(x, y - 10, 0.35)}</g>`,
  barrel: (x, y, s = 1) => place(x, y, s, false, trap(0, -40, 26, -20, 30, "#7a4e2a") + trap(0, -20, 30, 0, 26, "#6a4222") + rect(-15, -32, 30, 3, "#3a3a40") + rect(-15, -9, 30, 3, "#3a3a40")),
  bottle: (x, y, c) => trap(x, y - 14, 6, y, 7, c) + rect(x - 1.5, y - 20, 3, 7, tone(c, 0.7)),
  house: (x, y, w, h, wall, roof, o = {}) => {
    const r = trap(x + w / 2, y - h - 46, 6, y - h, w + 24, roof);
    const beams = `<g stroke="#3a2414" stroke-width="5">${[0.25, 0.75].map(f => `<line x1="${x + w * f}" y1="${y - h}" x2="${x + w * f}" y2="${y}"/>`).join("")}<line x1="${x}" y1="${y - h * 0.55}" x2="${x + w}" y2="${y - h * 0.55}"/></g>`;
    const win = (wx, wy) => rect(wx, wy, 18, 18, o.lit ? "#ffd27a" : "#2a3a4a") + `<path d="M${wx + 9} ${wy}v18M${wx} ${wy + 9}h18" stroke="#3a2414" stroke-width="2"/>`;
    return rect(x, y - h, w, h, wall) + rect(x + w / 2, y - h, w / 2, h, tone(wall, 0.85)) + beams + r +
      win(x + w * 0.25 - 9, y - h + 14) + win(x + w * 0.75 - 9, y - h + 14) +
      rect(x + w / 2 - 12, y - 40, 24, 40, "#4a2e18") + (o.sign ? o.sign(x + w / 2, y - h * 0.55) : "");
  },
  awning: (x, y, w, c1, c2) => Array.from({ length: Math.round(w / 16) }, (_, i) => P(pts([x + i * 16, y], [x + i * 16 + 16, y], [x + i * 16 + 16, y + 14], [x + i * 16, y + 18]), i % 2 ? c1 : c2)).join(""),
  stall: (x, y, c1, c2, goods) => rect(x + 4, y - 70, 5, 70, "#5a3a1e") + rect(x + 101, y - 70, 5, 70, "#5a3a1e") + PROP.awning(x, y - 78, 112, c1, c2) +
    rect(x, y - 34, 110, 34, "#7a4e2a") + rect(x, y - 34, 110, 5, "#5a3a1e") + goods,
  fountain: (x, y) => trap(x, y - 22, 150, y, 160, "#8a8478") + trap(x, y - 26, 140, y - 20, 150, "#9a948a") + rect(x - 66, y - 24, 132, 4, "#4a8ab8") +
    trap(x, y - 60, 14, y - 24, 20, "#9a948a") + trap(x, y - 66, 50, y - 58, 40, "#8a8478") +
    `<path d="M${x - 4} ${y - 68} q-18 10 -24 40 M${x + 4} ${y - 68} q18 10 24 40" fill="none" stroke="#8ac8f0" stroke-width="3" opacity=".8"/>`,
  pillar: (x, y, h, c = "#7a7468") => trap(x, y - h, 40, y, 40, c) + trap(x, y - h - 10, 54, y - h, 46, tone(c, 1.15)) + trap(x, y - 10, 46, y, 54, tone(c, 1.15)),
  banner: (x, y, c, h = 90) => rect(x - 22, y, 44, 4, "#5a3a1e") + P(pts([x - 18, y + 4], [x + 18, y + 4], [x + 18, y + h], [x, y + h - 14], [x - 18, y + h]), c) + gem(x, y + 36, 9, "#e0b040", 6),
  rock: (x, y, w, h, c = "#5a554d") => P(pts([x, y], [x + w * 0.15, y - h * 0.7], [x + w * 0.45, y - h], [x + w * 0.8, y - h * 0.6], [x + w, y]), c) + P(pts([x + w * 0.45, y - h], [x + w * 0.8, y - h * 0.6], [x + w, y], [x + w * 0.5, y]), tone(c, 0.75)),
  stalactite: (x, y, h, c = "#2a2a30") => P(pts([x - h * 0.22, y], [x + h * 0.22, y], [x, y + h]), c) + P(pts([x, y], [x + h * 0.22, y], [x, y + h]), tone(c, 0.7))
};
