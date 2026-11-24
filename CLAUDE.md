# Tavern Table (DnD Dice Roller)

A dice tray and party/initiative tracker for 5e-style games. There is no build step. Three.js and fonts load from a CDN. State is saved to `localStorage`. The README describes the user-facing features.

## Code layout
- `index.html`: markup, the import map for Three.js, and the list of scripts.
- `css/style.css`: layout and components. `css/tavern.css`: the palette and the see-through wood panels (wood on a `::before` layer at 84% opacity, plus `backdrop-filter: blur`); it loads second, so it wins. `css/scenes.css`: the full-page fixed scene (`.scene-bg`), `main`'s top margin so the panels start at the characters' feet, and the scene menu.
- `js/` scripts, loaded in this order: `noise.js` (seeded random, tiling noise) → `app.js` (constants, helpers like `$` and `esc`, `state`/`save`, party & initiative, roll log) → `tray.js` (dice pool, `doRoll`, Roll button) → `skins.js` (catalog, `paintSkin`, menu) → `figures.js` (low-poly SVG cast and props: `PARTY`, `FOLK`, `PROP`, `ITEMS`, `HEAD`, `person()`) → `scenes.js` (`SCENES` catalog, one art function per scene, `sceneSvg` with sky above and `planksBelow`/`rocksBelow`/`cobblesBelow`/`tilesBelow` ground below, `applyScene`, menu) → `dice3d.js` (3D table). A small inline startup script at the end of `index.html` calls `syncTray(); renderParty(); renderLog();`.
- **Must keep working when `index.html` is opened straight from the folder (file://).** So the JS files are plain `<script src>` files, not ES modules (browsers block local module files on file://). They share top-level names, so load order matters. `dice3d.js` is an async IIFE that loads Three.js with `await import("three")`; the import map in `index.html` resolves it to the CDN.
- The tray and skins talk to the 3D code through events: `tray:change`, `die:roll`, `skin:change` (plus `window.tavernDice` and `window.tavernSkin` for the state before `dice3d.js` finishes loading).

## Working across machines
The user works on this project from both a PC and a laptop. Claude's local memory does not sync between them, so **this file is the shared memory**.

- At the start of a session, read "Where we left off" below.
- When a chunk of work is done, or before the user wraps up, update "Where we left off": what changed, what's unfinished, and ideas for what's next. Keep it short and replace stale entries instead of piling them up.
- Remind the user to commit and push so the other machine gets the update.

## Commit after every change
The user wants a fresh commit for each change. **Every time a change is finished and checked, end your message with a short reminder to commit it**, with a suggested commit message (e.g. "Ready to commit: `Add glowing highlight on rolled numbers`"). Do this even for small changes. Don't commit or push yourself unless the user asks.

## Where we left off
_Last updated: 2026-11-23_

**Done 2026-11-23 (laptop):**
- Mixed dice pool: tap a die to add it, tap a chip to remove one, Clear. Max 20. Advantage/disadvantage only for exactly 1d20. In the 3D code, each die type has a cached "kit" (`kitFor`), and each die on the table stores its own kit, reach and radius.
- Dice skins: 40 presets in `SKINS` plus "Make your own" (colors, pattern, finish), in a `<dialog>` opened by the "Dice skin" button on the dice table. Patterns are painted to a tileable canvas (`paintSkin`) and mapped per face (`faceUVs`). The choice is saved in `state.skin` / `state.customSkin`. A RoomEnvironment was added so gloss and metal finishes reflect.
- "Stone Hall" tavern theme (the user picked it from 3 mockups: stone hall, timber tavern, cellar hearth). Warm brown palette in the `:root` variables, dark wood plank panels (inline SVG grain), and a stone wall painted to a canvas at load by `paintStoneWall()` into the CSS `--wall` variable. Two SVG wall torches with layered flickering flames, embers and glow, shown in the side margins only at ≥1560px wide. Faint corner firelight at all widths. *(The wall, torches and firelight were later replaced by full-page scenes; see below.)*
- Rolled-number highlight: when dice land, `highlight()` swaps each shown number's sticker to a glowing yellow `glowMaterial` and pops it to 1.3× with an overshoot. A d4 lights its 3 stickers at the top corner. With advantage/disadvantage only the kept die lights up (`keep` is passed from `doRoll` through the `die:roll` event). `clearHighlight()` runs on each new roll and dice change. Lit numbers survive a skin change (`userData.lit`). Verified with the shim (140/140) and in a real WebGL render.
- Split `index.html` into `css/` and `js/` files (see Code layout). Code was moved verbatim. Verified from file:// with default browser settings: everything loads, there are no errors, and a real 3D roll of 7 dice types showed and lit the right numbers.
- All of the above is committed except the split (pending).

- **Scenes (6):** the user asked for "5 options" but listed 6 (tavern, dungeon, dragon's cave, town square, wizard's tower, castle), so all 6 were built. A full-width illustrated banner (SVG 1600×320, `xMidYMax slice`, so the top gets cropped on wide screens and the sides on phones) sits behind the title. A matching wall goes behind the page, and torches show only in the indoor/night scenes. The party is a generic wizard, barbarian, dwarf and elf in a chunky low-poly style (the user referenced a "generic RuneScape look"; it's an original style, not copied art). Chosen from a "🗺️ Scene" menu, saved in `state.scene`. Verified in a real render.
- **Scenes are now the full-page background** (the user's request after seeing the banners). The SVG viewBox is `0 -40 1600 940`, `xMidYMin slice`, fixed behind the page; the action strip is at the top, the scene's ground continues below and fades darker. This removed the stone wall (`backdrop.js` deleted) and the wall torches in the margins, since the scenes have their own torches and fires.

**Testing notes (laptop):**
- Firefox is a snap, so it can't read /tmp: put test copies under `~/snap/firefox/common/`.
- `firefox --headless --screenshot` has **no WebGL** and fires at the load event, before `dice3d.js` finishes its async import. Fine for CSS and 2D checks.
- For real tests, drive headless Firefox through **Marionette** (`firefox --headless --marionette --profile DIR`, with `user_pref("marionette.port", 2829)` in the profile's user.js). Talk to it with a small Python socket client using `len:json` framing: `WebDriver:NewSession`, `Navigate`, `ExecuteAsyncScript`, `TakeScreenshot`, then `Marionette:Quit`. **WebGL renders in this mode**, so real dice screenshots work. Don't `pkill -f` the profile path: it matches the client script too. Marionette screenshots capture the whole page, and below the first window-height a `background-attachment: fixed` wall renders without its dark overlay. That's a capture artifact, not a bug.

**Done 2026-11-20 (PC):**
- 3D dice physics: tossed, bounce, collide, settle. The result is decided first, the throw is simulated, and the faces are relabeled so the top face matches the result.
- Numbers on the 3D dice faces.
- README rewrite with a new screenshot (`docs/screenshot.png`).
- Roll log fix: the roller name and action are captured when Roll is clicked, not after the animation. The "Roll as" dropdown only auto-switches when a new turn starts.

**Unfinished / to check:**
- The roll log fix hasn't been tested in the browser yet.
- The README screenshot (`docs/screenshot.png`) still shows the old blue theme. It can now be retaken with the Marionette setup.

**Roadmap / ideas for next:**
- **Auto-rotate scenes** based on what's happening in the adventure (e.g. combat → dungeon, rest → tavern). `applyScene(id)` already does the switch; this needs a trigger.
- Per-character skins (the user chose one global skin for now).
- Torches on smaller screens, e.g. a pair beside the title (offered, not yet requested).
