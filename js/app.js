// Tavern Table · app.js
// Shared basics (constants, helpers, the saved state), the party & initiative tracker, and the roll log.

const SIDES = [4, 6, 8, 10, 12, 20, 100];
const ICONS = {
  4: '<polygon points="15,3 28,26 2,26" fill="none" stroke="#9a9cae" stroke-width="1.8"/>',
  6: '<rect x="4" y="4" width="22" height="22" rx="3" fill="none" stroke="#9a9cae" stroke-width="1.8"/>',
  8: '<polygon points="15,2 28,15 15,28 2,15" fill="none" stroke="#9a9cae" stroke-width="1.8"/>',
  10: '<polygon points="15,2 27,12 15,28 3,12" fill="none" stroke="#9a9cae" stroke-width="1.8"/>',
  12: '<polygon points="15,2 27,10 23,26 7,26 3,10" fill="none" stroke="#9a9cae" stroke-width="1.8"/>',
  20: '<polygon points="15,2 27,9 27,21 15,28 3,21 3,9" fill="none" stroke="#9a9cae" stroke-width="1.8"/><path d="M15 2 L9 18 L21 18 Z M3 9 L9 18 M27 9 L21 18 M15 28 L9 18 M15 28 L21 18" fill="none" stroke="#9a9cae" stroke-width="1"/>',
  100: '<circle cx="15" cy="15" r="12" fill="none" stroke="#9a9cae" stroke-width="1.8"/>'
};
const CONDITIONS = ["Blinded","Charmed","Concentrating","Frightened","Grappled","Incapacitated","Invisible","Paralyzed","Poisoned","Prone","Restrained","Stunned"];

// A unique id for characters and rolls. randomUUID gives ids that won't clash even across players and devices
// (it needs a secure page: https, localhost or a file; the fallback covers anything else).
const uid = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
const d = n => 1 + Math.floor(Math.random() * n);
const fmtMod = m => (m >= 0 ? "+" : "−") + Math.abs(m);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Example party so the table opens ready to play
const EXAMPLE = [
  { id: uid(), name: "Brannoc", cls: "Fighter", lvl: 5, hp: 44, maxhp: 44, ac: 18, init: 1, conds: [], monster: false },
  { id: uid(), name: "Ysolde", cls: "Cleric", lvl: 5, hp: 31, maxhp: 38, ac: 17, init: 0, conds: ["Concentrating"], monster: false },
  { id: uid(), name: "Pip Thistlewick", cls: "Rogue", lvl: 5, hp: 33, maxhp: 33, ac: 15, init: 4, conds: [], monster: false },
  { id: uid(), name: "Maelis", cls: "Wizard", lvl: 5, hp: 12, maxhp: 27, ac: 12, init: 2, conds: [], monster: false },
  { id: uid(), name: "Goblin Boss", cls: "Goblinoid", lvl: 1, hp: 21, maxhp: 21, ac: 17, init: 2, conds: [], monster: true }
];

// The saved state, in two parts: `state` is the game data, `settings` is this device's settings.
// Loading, saving and upgrading old saves all live in js/storage.js.
let { game: state, settings } = store.load();
if (!state) state = { version: store.VERSION, party: EXAMPLE, combat: null, log: [] };   // first visit
const save = () => store.save(state, settings);

const $ = id => document.getElementById(id);

/* ---------- Party & initiative ---------- */
function orderedParty() {
  if (!state.combat) return state.party;
  const rolls = state.combat.rolls;
  return [...state.party].sort((a, b) => (rolls[b.id] ?? -99) - (rolls[a.id] ?? -99) || b.init - a.init);
}
function currentId() {
  if (!state.combat) return null;
  const o = orderedParty();
  return o.length ? o[state.combat.turn % o.length].id : null;
}

let lastTurn = null;                           // whose turn it was the last time the party was drawn
function renderParty() {
  const cur = currentId();
  const list = orderedParty();
  const nH = state.party.filter(p => !p.monster).length, nM = state.party.length - nH;
  $("partyCount").textContent = `${nH} ${nH === 1 ? "hero" : "heroes"} · ${nM} ${nM === 1 ? "monster" : "monsters"}`;
  $("cards").innerHTML = list.length ? list.map(p => {
    const pct = Math.max(0, Math.min(100, Math.round(p.hp / p.maxhp * 100)));
    const cls = pct <= 25 ? "low" : pct <= 50 ? "mid" : "";
    const initVal = state.combat ? (state.combat.rolls[p.id] ?? "–") : fmtMod(p.init);
    const down = p.hp <= 0;
    return `<article class="card ${p.monster ? "monster" : ""} ${p.id === cur ? "current" : ""} ${down ? "down" : ""}" data-id="${p.id}">
      <div class="init" title="${state.combat ? "Initiative roll" : "Initiative modifier"}">${initVal}</div>
      <div class="name">${esc(p.name)} <small>${esc(p.cls || "")}${p.lvl !== "" && p.lvl != null ? (p.monster ? " · CR " : " · Lv ") + esc(p.lvl) : ""}</small></div>
      <div class="ac">AC<b>${p.ac}</b></div>
      <div class="hpline"><div class="hpbar"><i class="${cls}" style="width:${pct}%"></i></div><span class="hptext">${p.hp} / ${p.maxhp}</span></div>
      <div class="cardctl">
        <label class="sr" for="amt-${p.id}" style="position:absolute;left:-9999px">Amount for ${esc(p.name)}</label>
        <input id="amt-${p.id}" type="number" min="1" value="5" data-amt>
        <button class="mini hit" type="button" data-act="hit">Damage</button>
        <button class="mini heal" type="button" data-act="heal">Heal</button>
        <button class="mini" type="button" data-act="use" title="Load this character's initiative mod into the dice tray">Roll as</button>
        <select data-act="cond" aria-label="Add a condition to ${esc(p.name)}"><option value="">+ condition</option>${CONDITIONS.filter(c => !p.conds.includes(c)).map(c => `<option>${c}</option>`).join("")}</select>
        ${down ? `<span class="chip downchip">Down</span>` : ""}
        ${p.conds.map(c => `<button class="chip" type="button" data-cond="${esc(c)}" title="Remove ${esc(c)}">${esc(c)}</button>`).join("")}
        <button class="del" type="button" data-act="del" aria-label="Remove ${esc(p.name)}">Remove</button>
      </div>
    </article>`;
  }).join("") : `<p class="empty">The table is empty. Add a hero below.</p>`;

  const inCombat = !!state.combat;
  $("nextTurn").hidden = !inCombat;
  $("endCombat").hidden = !inCombat;
  $("rollInit").textContent = inCombat ? "Reroll initiative" : "Roll initiative";
  $("round").textContent = inCombat ? `Round ${state.combat.round}` : "";

  const sel = $("roller"), keep = sel.value;
  const turnChanged = cur !== lastTurn;          // a new character's turn has started
  lastTurn = cur;
  sel.innerHTML = `<option value="">Nobody in particular</option>` + state.party.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join("");
  if (turnChanged && cur) sel.value = cur;       // new turn: switch to whoever's up
  else sel.value = state.party.some(p => p.id === keep) ? keep : (cur || "");  // otherwise keep the current choice
}

$("cards").addEventListener("click", e => {
  const card = e.target.closest(".card"); if (!card) return;
  const p = state.party.find(x => x.id === card.dataset.id); if (!p) return;
  const chip = e.target.closest("[data-cond]");
  if (chip) { p.conds = p.conds.filter(c => c !== chip.dataset.cond); save(); renderParty(); return; }
  const act = e.target.dataset.act;
  const amt = Math.max(0, parseInt(card.querySelector("[data-amt]").value, 10) || 0);
  if (act === "hit") p.hp = Math.max(0, p.hp - amt);
  else if (act === "heal") p.hp = Math.min(p.maxhp, p.hp + amt);
  else if (act === "use") {
    $("roller").value = p.id; tray.pool = { 20: 1 }; tray.mod = p.init; syncTray();
    $("action").focus(); return;
  }
  else if (act === "del") {
    state.party = state.party.filter(x => x.id !== p.id);
    if (state.combat) delete state.combat.rolls[p.id];
  } else return;
  save(); renderParty();
});
$("cards").addEventListener("change", e => {
  if (e.target.dataset.act !== "cond" || !e.target.value) return;
  const p = state.party.find(x => x.id === e.target.closest(".card").dataset.id);
  if (p && !p.conds.includes(e.target.value)) p.conds.push(e.target.value);
  save(); renderParty();
});

$("rollInit").onclick = () => {
  const rolls = {};
  state.party.forEach(p => { rolls[p.id] = d(20) + (+p.init || 0); });
  state.combat = { rolls, turn: 0, round: 1 };
  save(); renderParty();
};
$("nextTurn").onclick = () => {
  if (!state.combat) return;
  const n = state.party.length; if (!n) return;
  state.combat.turn += 1;
  if (state.combat.turn % n === 0) state.combat.round += 1;
  save(); renderParty();
};
$("endCombat").onclick = () => { state.combat = null; save(); renderParty(); };
$("longRest").onclick = () => {
  state.party.forEach(p => { if (!p.monster) { p.hp = p.maxhp; p.conds = []; } });
  save(); renderParty();
};

$("addForm").addEventListener("submit", e => {
  e.preventDefault();
  const maxhp = Math.max(1, parseInt($("fHp").value, 10) || 1);
  const p = { id: uid(), name: $("fName").value.trim() || "Unnamed", cls: $("fCls").value.trim(), lvl: $("fLvl").value, hp: maxhp, maxhp,
    ac: parseInt($("fAc").value, 10) || 10, init: parseInt($("fInit").value, 10) || 0, conds: [], monster: $("fMon").checked };
  state.party.push(p);
  if (state.combat) state.combat.rolls[p.id] = d(20) + p.init;
  $("fName").value = ""; save(); renderParty();
});

/* ---------- Log ---------- */
function renderLog() {
  $("log").innerHTML = state.log.length ? state.log.map(e => {
    const t = new Date(e.t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return `<li class="${e.kind}"><time>${t}</time><span>${esc(e.who)}${e.action ? " · " + esc(e.action) : ""} <span style="color:var(--dim)">(${esc(e.label)})</span></span><b>${e.total}</b></li>`;
  }).join("") : `<li><span></span><span class="empty">No rolls yet tonight.</span><span></span></li>`;
}
$("clearLog").onclick = () => { state.log = []; save(); renderLog(); };
