# Tavern Table (DnD Dice Roller)

A single-file dice tray and party/initiative tracker for 5e-style games. Everything lives in `index.html` (HTML, CSS and JS). There is no build step. Three.js and fonts load from a CDN. State is saved to `localStorage`. The README describes the user-facing features.

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
- "Stone Hall" tavern theme (the user picked it from 3 mockups: stone hall, timber tavern, cellar hearth). Warm brown palette in the `:root` variables, dark wood plank panels (inline SVG grain), and a stone wall painted to a canvas at load by `paintStoneWall()` into the CSS `--wall` variable. Two SVG wall torches with layered flickering flames, embers and glow, shown in the side margins only at ≥1560px wide. Faint corner firelight at all widths.
- (The user committed everything above.)
- Rolled-number highlight: when dice land, `highlight()` swaps each shown number's sticker to a glowing yellow `glowMaterial` and pops it to 1.3× with an overshoot. A d4 lights its 3 stickers at the top corner. With advantage/disadvantage only the kept die lights up (`keep` is passed from `doRoll` through the `die:roll` event). `clearHighlight()` runs on each new roll and dice change. Lit numbers survive a skin change (`userData.lit`). Verified with the shim: 140/140. **The 3D look still needs a check in a real browser.**
- Testing note: headless Firefox (a snap, so it can't read /tmp; use ~/snap/firefox/common/) has no WebGL. Logic is verified with a fake-renderer shim that swaps `three` for a module exporting a stub `WebGLRenderer` and `PMREMGenerator`, plus the pref `security.fileuri.strict_origin_policy=false`. CSS and 2D visuals can be screenshotted normally.

**Done 2026-11-20 (PC):**
- 3D dice physics: tossed, bounce, collide, settle. The result is decided first, the throw is simulated, and the faces are relabeled so the top face matches the result.
- Numbers on the 3D dice faces.
- README rewrite with a new screenshot (`docs/screenshot.png`).
- Roll log fix: the roller name and action are captured when Roll is clicked, not after the animation. The "Roll as" dropdown only auto-switches when a new turn starts.

**Unfinished / to check:**
- The roll log fix hasn't been tested in the browser yet.

**Roadmap / ideas for next:**
- **Scene-based backgrounds:** change the background to match what's happening in the adventure (tavern, dungeon, forest, combat, etc.). The theme is already driven by `:root` variables, `--wall` and the torch elements, so a scene could swap those.
- Per-character skins (the user chose one global skin for now).
- Torches on smaller screens, e.g. a pair beside the title (offered, not yet requested).
- The README screenshot (`docs/screenshot.png`) still shows the old blue theme.
