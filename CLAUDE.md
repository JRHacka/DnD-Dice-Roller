# Tavern Table (DnD Dice Roller)

A single-file dice tray and party/initiative tracker for 5e-style games. Everything lives in `index.html` (HTML, CSS and JS). There is no build step. Three.js and fonts load from a CDN. State is saved to `localStorage`. The README describes the user-facing features.

## Working across machines
The user works on this project from both a PC and a laptop. Claude's local memory does not sync between them, so **this file is the shared memory**.

- At the start of a session, read "Where we left off" below.
- When a chunk of work is done, or before the user wraps up, update "Where we left off": what changed, what's unfinished, and ideas for what's next. Keep it short and replace stale entries instead of piling them up.
- Remind the user to commit and push so the other machine gets the update.

## Where we left off
_Last updated: 2026-11-23_

**Done 2026-11-23 (laptop):**
- Mixed dice pool: tap a die to add it, tap a chip to remove one, Clear. Max 20. Advantage/disadvantage only for exactly 1d20. In the 3D code, each die type has a cached "kit" (`kitFor`), and each die on the table stores its own kit, reach and radius.
- Dice skins: 40 presets in `SKINS` plus "Make your own" (colors, pattern, finish), in a `<dialog>` opened by the "Dice skin" button on the dice table. Patterns are painted to a tileable canvas (`paintSkin`) and mapped per face (`faceUVs`). The choice is saved in `state.skin` / `state.customSkin`. A RoomEnvironment was added so gloss and metal finishes reflect.
- "Stone Hall" tavern theme (the user picked it from 3 mockups: stone hall, timber tavern, cellar hearth). Warm brown palette in the `:root` variables, dark wood plank panels (inline SVG grain), and a stone wall painted to a canvas at load by `paintStoneWall()` into the CSS `--wall` variable. Two SVG wall torches with layered flickering flames, embers and glow, shown in the side margins only at ≥1560px wide. Faint corner firelight at all widths.
- Testing note: headless Firefox (a snap, so it can't read /tmp; use ~/snap/firefox/common/) has no WebGL. Logic was verified with a fake-renderer shim (330/330 dice showed the rolled value). **The 3D look of the skins still needs a check in a real browser.**

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
