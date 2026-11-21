<div align="center">

# 🍺 Tavern Table 🎲

**Pull up a chair, grab your dice, and let's roll.**

A candlelit dice tray and party tracker for tabletop RPG nights, built for 5th-edition style games.

![Single HTML file](https://img.shields.io/badge/single%20file-index.html-d4a64a?style=flat-square)
![No build step](https://img.shields.io/badge/build%20step-none-5fb37f?style=flat-square)
![3D dice](https://img.shields.io/badge/3D%20dice-Three.js-1c2030?style=flat-square)

![Tavern Table: eight 3D d6s landed on the dice tray after a Fireball roll, next to the party and initiative tracker](docs/screenshot.png)

</div>

---

## 🚪 Getting started

1. Open `index.html` in any modern browser.
2. There is no step 2. 🎉

No install, no build step, no account. The page does need an internet connection, because it loads the 3D library ([Three.js](https://threejs.org)) and its fonts from the web.

> 🛠️ **Tinkering with the code?** The [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension for VS Code reloads the page every time you save.

---

## ✨ What's on the table

### 🎲 Real 3D dice
Click **Roll** and watch them go. The dice are tossed onto the table, bounce, tumble over each other, crash off the walls and settle flat, and **the number facing up is the number you rolled.**

| Die | How it reads |
|---|---|
| d6, d8, d10, d12, d20 | The number on the top face |
| d4 | The number at the corner pointing up, just like a real d4 |
| d100 | A round ball that rolls to a stop with the result facing you |

Roll up to **20 dice at once**. They shrink to fit and bump into each other on the way.

### 🧮 The dice tray
- Pick a die, how many, and a modifier from **−10 to +30**.
- **Advantage and disadvantage** roll two d20s; the one you drop is crossed out.
- **Natural 20s** glow gold. **Natural 1s** glow red. 😬
- Say who's rolling and what they're trying (*"Pick the lock on the crypt door"*), and it goes in the log.

### ⚔️ Party and initiative
- Track every hero and monster's **HP, AC, level or CR** and **initiative modifier**.
- Deal damage or heal. HP bars go green, then gold, then red, and anyone at 0 HP is marked **Down**.
- Add conditions like *Poisoned*, *Prone* or *Concentrating*, and click a condition to clear it.
- **Roll initiative** for everyone at once, then step through turns and rounds.
- **Roll as** loads a character's initiative modifier straight into the dice tray.
- **Long rest** brings the heroes back to full HP and clears their conditions. Monsters get no such luck. 🐉

### 📜 Roll log
The last 40 rolls: when, who, what they were attempting, and how it went.

---

## 💾 Saving

Your party, the current fight and the roll log are saved in your browser, so they survive a refresh.

- Your data stays on your device. It's never sent anywhere.
- Opening the file directly and opening it through Live Server count as different sites, so each keeps its own save.
- Clearing your browser's site data resets the table to the sample party.

---

## 🔮 How the dice work (for the curious)

When you click **Roll**, the result is decided first, using fair random numbers. Then:

1. **The whole roll is simulated instantly**: tosses, gravity, bounces, collisions and tumbling, all recorded step by step.
2. **The numbers are quietly rearranged** on each die, so the face that ends up on top shows what you actually rolled.
3. **The recording plays back** over two seconds.

So the dice look completely natural, and they always agree with the result. No loaded dice here.

---

## 🗺️ The road ahead

- 🎨 **Dice skins**: colors, camo and marble
- ⚡ **Saved roll presets**, like *Longsword 1d8+3* or *Fireball 8d6*
- 🧾 **Typed formulas**, like `2d6+1d4+3`
- 💀 **Death saving throws** for characters at 0 HP
- 📋 **Fuller character sheets** with ability scores and saving throws

---

## 📁 What's in the box

```
index.html             The whole app: markup, styles and scripts
docs/screenshot.png    The picture at the top of this page
README.md              You are here
```

<div align="center">

*May your rolls be high and your fumbles be funny.* 🎲

</div>
