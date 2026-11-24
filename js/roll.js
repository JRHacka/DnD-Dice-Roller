// Tavern Table · roll.js
// The dice rules: works out a roll and nothing else. No page, no buttons, no saving, so the same code could run
// on a server later (fair rolls in multiplayer) or in a test.
//
//   rollDice({ pool: { 6: 2, 8: 1 }, mod: 3, mode: "norm" })   → the result (see the end of rollDice)
//   rollDice(spec, rand)   → rand(sides) gives one die's number; leave it out for fair random dice
//
// pool: how many of each die, e.g. { 6: 2, 8: 1 } for 2d6 + 1d8. mod: added to the total.
// mode: "norm", or "adv" / "dis" (advantage / disadvantage: roll two d20s, keep the higher / lower).

const fairDie = sides => 1 + Math.floor(Math.random() * sides);

function rollDice({ pool, mod = 0, mode = "norm" }, rand = fairDie) {
  const sides = Object.keys(pool).map(Number).filter(s => pool[s] > 0).sort((a, b) => a - b);
  const count = sides.reduce((n, s) => n + pool[s], 0);
  const singleD20 = count === 1 && pool[20] === 1;
  if (!singleD20) mode = "norm";                    // advantage and disadvantage only work on a single d20

  let groups, dice, keep = null, kept;
  if (mode !== "norm") {
    const a = rand(20), b = rand(20);
    const keepFirst = mode === "adv" ? a >= b : a <= b;
    groups = [{ sides: 20, values: [a, b] }];
    dice = [a, b];
    keep = [keepFirst, !keepFirst];                 // which of the two d20s counts
    kept = keepFirst ? a : b;
  } else {
    groups = sides.map(s => ({ sides: s, values: Array.from({ length: pool[s] }, () => rand(s)) }));  // one list per die type
    dice = groups.flatMap(g => g.values);           // same order as the dice on the table
    kept = dice.reduce((sum, x) => sum + x, 0);
  }

  const natural = singleD20 ? kept : null;          // the d20's own number, for nat 20s and nat 1s
  const kind = natural === 20 ? "crit" : natural === 1 ? "fumble" : "";
  const modText = mod ? ` ${mod > 0 ? "+" : "−"}${Math.abs(mod)}` : "";
  const label = sides.map(s => `${pool[s]}d${s}`).join(" + ") + modText + (mode === "adv" ? " adv" : mode === "dis" ? " dis" : "");

  // label: "2d6 + 1d8 +3". dice: every number rolled. groups: the same numbers by die type.
  // keep: for advantage/disadvantage, which d20 counts (null otherwise).
  return { label, total: kept + mod, natural, kind, mod, mode, dice, groups, keep };
}
