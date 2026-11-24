// Tavern Table · tray.js
// The dice tray: the dice pool, modifier, advantage, working out a roll, and the Roll button.
// The 3D dice (dice3d.js) listen for its "tray:change" and "die:roll" events.

/* ---------- Dice tray ---------- */
// The pool: how many of each die are in this roll, e.g. { 6: 2, 8: 1 } for 2d6 + 1d8
const MAX_DICE = 20;
const tray = { pool: { 20: 1 }, mod: 0, mode: "norm" };
const poolTotal = () => SIDES.reduce((n, s) => n + (tray.pool[s] || 0), 0);
const poolTypes = () => SIDES.filter(s => tray.pool[s]);
const poolText = () => poolTypes().map(s => `${tray.pool[s]}d${s}`).join(" + ");

$("dice").innerHTML = SIDES.map(s => `<button type="button" class="die" data-s="${s}" aria-label="Add a d${s}"><svg viewBox="0 0 30 30" aria-hidden="true">${ICONS[s]}</svg><span>d${s}</span><b class="badge" aria-hidden="true"></b></button>`).join("");
$("dice").addEventListener("click", e => {          // tap a die: add one to the pool
  const b = e.target.closest(".die"); if (!b || poolTotal() >= MAX_DICE) return;
  const s = +b.dataset.s;
  tray.pool[s] = (tray.pool[s] || 0) + 1; syncTray();
});
$("pool").addEventListener("click", e => {          // tap a chip: take one of that die away
  const b = e.target.closest(".poolchip"); if (!b) return;
  const s = +b.dataset.s;
  tray.pool[s]--; if (!tray.pool[s]) delete tray.pool[s];
  syncTray();
  const same = $("pool").querySelector(`[data-s="${s}"]`) || $("pool").querySelector(".poolchip");
  (same || $("dice").querySelector(".die")).focus();   // keep keyboard focus somewhere sensible
});
$("clearPool").onclick = () => { tray.pool = {}; syncTray(); };
$("modUp").onclick = () => { tray.mod = Math.min(30, tray.mod + 1); syncTray(); };
$("modDown").onclick = () => { tray.mod = Math.max(-10, tray.mod - 1); syncTray(); };
$("mode").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b || b.disabled) return;
  tray.mode = b.dataset.mode; syncTray();
});

function advAllowed() { return poolTotal() === 1 && tray.pool[20] === 1; }   // only a single d20
let rolling = false;
function syncRollBtn() { $("rollBtn").disabled = rolling || poolTotal() === 0; }
function syncTray() {
  const total = poolTotal();
  document.querySelectorAll(".die").forEach(b => {
    const n = tray.pool[+b.dataset.s] || 0;
    b.querySelector(".badge").textContent = n || "";
    b.disabled = total >= MAX_DICE;
    b.setAttribute("aria-label", `Add a d${b.dataset.s}${n ? ` (${n} in the roll)` : ""}`);
  });
  $("pool").innerHTML = total
    ? poolTypes().map(s => `<button type="button" class="poolchip" data-s="${s}" aria-label="Remove one d${s}">${tray.pool[s]}d${s}<span aria-hidden="true">✕</span></button>`).join("")
    : `<span class="empty">Tap dice above to add them</span>`;
  $("clearPool").hidden = !total;
  $("mod").textContent = fmtMod(tray.mod);
  const ok = advAllowed();
  if (!ok) tray.mode = "norm";
  document.querySelectorAll("#mode button").forEach(b => {
    b.disabled = !ok && b.dataset.mode !== "norm";
    b.setAttribute("aria-pressed", b.dataset.mode === tray.mode);
  });
  $("pickedLabel").textContent = total
    ? `${poolText()}${tray.mod ? " " + fmtMod(tray.mod) : ""}${tray.mode === "adv" ? " · advantage" : tray.mode === "dis" ? " · disadvantage" : ""}`
    : "no dice";
  syncRollBtn();
  // Every die to show on the table, in order. Advantage/disadvantage rolls two d20s.
  const shown = tray.mode !== "norm" ? [20, 20] : poolTypes().flatMap(s => Array(tray.pool[s]).fill(s));
  window.tavernDice = shown;                    // the 3D dice pick this up when they load
  document.dispatchEvent(new CustomEvent("tray:change", { detail: { dice: shown } }));
}

function doRoll() {
  const { mod, mode } = tray;
  let values, kept, natural = null, parts, keep;   // keep: which dice count (only set for advantage/disadvantage)
  if (advAllowed() && mode !== "norm") {
    const a = d(20), b = d(20);
    kept = mode === "adv" ? Math.max(a, b) : Math.min(a, b);
    natural = kept;
    const keepFirst = (mode === "adv" ? a >= b : a <= b);
    parts = `[<span class="${keepFirst ? "kept" : "dropped"}">${a}</span>, <span class="${keepFirst ? "dropped" : "kept"}">${b}</span>]`;
    values = [a, b];
    keep = [keepFirst, !keepFirst];
  } else {
    const groups = poolTypes().map(s => Array.from({ length: tray.pool[s] }, () => d(s)));  // one list of rolls per die type
    values = groups.flat();                       // same order as the dice on the table
    kept = values.reduce((sum, x) => sum + x, 0);
    if (advAllowed()) natural = kept;
    parts = groups.map(g => `[${g.join(", ")}]`).join(" + ");
  }
  const total = kept + mod;
  const kind = natural === 20 ? "crit" : natural === 1 ? "fumble" : "";
  const label = `${poolText()}${mod ? " " + fmtMod(mod) : ""}${mode === "adv" ? " adv" : mode === "dis" ? " dis" : ""}`;
  return { total, natural, kind, label, parts, mod, mode, dice: values, keep };
}

function rollerName() {
  const id = $("roller").value;
  const p = state.party.find(x => x.id === id);
  return p ? p : null;
}

const ROLL_MS = 2000;                           // how long the die tumbles, in milliseconds
$("rollBtn").onclick = () => {
  const r = doRoll();                           // the result is decided right away...
  r.who = rollerName(); r.action = $("action").value.trim();  // remember who rolled, at the moment of rolling
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = reduce ? 0 : ROLL_MS;            // no tumble for people who turn animations off
  $("result").className = "result rolling";
  $("tag").hidden = true;
  rolling = true; syncRollBtn();
  document.dispatchEvent(new CustomEvent("die:roll", { detail: { duration: wait, values: r.dice, keep: r.keep } }));
  setTimeout(() => { showRoll(r); rolling = false; syncRollBtn(); }, wait); // ...and shown when the die lands
};

function showRoll(r) {
  const res = $("result");
  res.className = "result " + r.kind;
  $("total").textContent = r.total;
  $("formula").innerHTML = `${esc(r.label)} → ${r.parts}${r.mod ? " " + fmtMod(r.mod) : ""}`;
  const tag = $("tag");
  if (r.kind) { tag.hidden = false; tag.textContent = r.kind === "crit" ? "NATURAL 20" : "NATURAL 1"; } else tag.hidden = true;

  const who = r.who;
  const action = r.action;
  const name = who ? who.name : "Someone";
  state.log.unshift({ id: uid(), t: Date.now(), who: name, action, label: r.label, total: r.total, kind: r.kind });
  state.log = state.log.slice(0, 40);
  save(); renderLog();
}
