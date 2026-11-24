// Tavern Table · noise.js
// Seeded random numbers and smooth, seamlessly tiling "cloudy" noise. Used by skins.js and backdrop.js.

function seeded(seed) { return () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296; }
// Smooth random "cloudy" values from 0 to 1 that repeat every 1 unit in u and v
function cloudy(rand, base = 4, octaves = 4) {
  const layers = Array.from({ length: octaves }, (_, k) => {
    const n = base << k;
    return { n, g: Float32Array.from({ length: n * n }, rand) };
  });
  const ease = t => t * t * (3 - 2 * t);
  return (u, v) => {
    let sum = 0, amp = 0.5, total = 0;
    for (const { n, g } of layers) {
      const x = u * n, y = v * n, x0 = Math.floor(x), y0 = Math.floor(y), fx = ease(x - x0), fy = ease(y - y0);
      const at = (i, j) => g[((j % n + n) % n) * n + ((i % n + n) % n)];
      const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * fx;
      const bot = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * fx;
      sum += (top + (bot - top) * fy) * amp; total += amp; amp *= 0.5;
    }
    return sum / total;
  };
}
