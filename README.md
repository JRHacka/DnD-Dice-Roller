# Tavern Table

A dice roller and party tracker for tabletop RPG nights, built for 5th-edition style games. It's one HTML file: no install, no build step, and no account.

## Getting started

Open `index.html` in any modern browser. That's it.

If you're editing the code, the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension for VS Code reloads the page every time you save.

## Features

### Dice tray
- Roll d4, d6, d8, d10, d12, d20 or d100.
- Roll up to 20 dice at once, with a modifier from −10 to +30.
- Roll with advantage or disadvantage on a single d20. The die that's dropped is shown crossed out.
- Natural 20s and natural 1s are highlighted.
- Pick who's rolling and what they're trying to do, and it goes into the log.

### Party and initiative
- Each hero or monster has HP, AC, level or CR, and an initiative modifier.
- Apply damage or healing. HP bars change color as health drops, and characters at 0 HP are marked **Down**.
- Add or remove conditions such as Poisoned, Prone or Concentrating.
- Roll initiative for everyone at once, then step through turns with the current turn and round shown.
- **Roll as** loads a character's initiative modifier into the dice tray.
- **Long rest** restores heroes to full HP and clears their conditions. Monsters aren't affected.

### Roll log
- Keeps the last 40 rolls with a timestamp, who rolled, what they were doing, and the result.

## Saving

Your party, the current combat and the roll log are saved in your browser's local storage, so they survive a page refresh. A few things to know:

- Data stays on the device and browser you used. Nothing is sent anywhere.
- Opening the file directly and opening it through a local server (like Live Server) count as different sites, so each has its own saved data.
- Clearing your browser's site data resets the table to the sample party.

## Project structure

```
index.html   The whole app: markup, styles and script
README.md    This file
```

## Ideas for what's next

- Saved roll presets (e.g. "Longsword 1d8+3")
- Typed dice formulas like `2d6+1d4+3`
- Death saving throws for characters at 0 HP
- Fuller character sheets with ability scores and saving throws
