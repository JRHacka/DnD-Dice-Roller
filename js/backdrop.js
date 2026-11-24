// Tavern Table · backdrop.js
// The scenery behind the page. Right now: the stone wall. (Roadmap: scenes that change with the adventure.)

/* ---------- Stone wall ---------- */
// Paint a tile of rough stone blocks once, and hand it to the page background (the CSS --wall variable).
// It tiles seamlessly: the blocks wrap around left to right, and the rows fit the height exactly.
function paintStoneWall() {
  const W = 640, H = 420, ROW = 60;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  const rand = seeded(11);
  const stones = ["#3b3733", "#35312d", "#423c35", "#2f2c29", "#3d3832", "#46403a"];
  ctx.fillStyle = "#1a1714"; ctx.fillRect(0, 0, W, H);      // mortar
  for (let y = 0; y < H; y += ROW) {
    let x = -Math.floor(rand() * 60);                       // stagger each row
    while (x < W) {
      const w = 70 + Math.floor(rand() * 80), r = 4 + rand() * 8;
      const color = stones[Math.floor(rand() * stones.length)];
      for (const ox of [0, W, -W]) {                        // draw wrapped copies so the tile repeats cleanly
        ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x + ox + 3, y + 3, w - 6, ROW - 6, r); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.05)"; ctx.fillRect(x + ox + 6, y + 4, w - 12, 3);          // light top edge
        ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fillRect(x + ox + 6, y + ROW - 8, w - 12, 4);          // shadowed bottom edge
      }
      x += w;
    }
  }
  // Weathering: big soft blotches plus fine grit
  const img = ctx.getImageData(0, 0, W, H), blotch = cloudy(rand, 6, 4);
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    const i = (py * W + px) * 4;
    const k = 0.78 + 0.42 * blotch(px / W, py / H) + (rand() - 0.5) * 0.16;
    img.data[i] *= k; img.data[i + 1] *= k; img.data[i + 2] *= k;
  }
  ctx.putImageData(img, 0, 0);
  document.documentElement.style.setProperty("--wall", `url(${c.toDataURL()})`);
}
paintStoneWall();
