// High-resolution painted textures for the world: flagstones, scalloped roof tiles, planks, brick,
// stone, half-timber plaster, grass and the rest. Smooth (mipmapped) so the scenery looks like an
// illustrated diorama while the characters keep their pixel look.
import * as THREE from '../lib/three.module.min.js';

const S = 256;
const hexRGB = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const mixC = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
let SEED = 1;
const hash = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 982451653) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
const rnd = () => { SEED = (SEED * 16807) % 2147483647; return SEED / 2147483647; };
// tileable value noise and fractal noise; x, y in [0, period)
function vnoise(x, y, period, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const p = (a) => ((a % period) + period) % period;
  const a = hash(p(xi), p(yi), s), b = hash(p(xi + 1), p(yi), s), c = hash(p(xi), p(yi + 1), s), d = hash(p(xi + 1), p(yi + 1), s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(px, py, period = 4, oct = 4, s = 0) { let t = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < oct; i++) { t += a * vnoise(px / S * period * f, py / S * period * f, period * f, s + i * 31); n += a; a *= 0.5; f *= 2; } return t / n; }
function paint(f) {
  const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
  const img = g.createImageData(S, S), d = img.data;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const [r, gg, b] = f(x, y); const i = (y * S + x) * 4; d[i] = clamp(r, 0, 255); d[i + 1] = clamp(gg, 0, 255); d[i + 2] = clamp(b, 0, 255); d[i + 3] = 255; }
  g.putImageData(img, 0, 0); return c;
}
// jittered voronoi on a wrapping grid: returns nearest distance, edge distance and cell id
function voronoi(px, py, n, s) {
  const x = px / S * n, y = py / S * n, xi = Math.floor(x), yi = Math.floor(y);
  let d1 = 9, d2 = 9, id = 0, sx = 0, sy = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const cx = xi + i, cy = yi + j, wx = ((cx % n) + n) % n, wy = ((cy % n) + n) % n;
    const ox = cx + 0.15 + hash(wx, wy, s) * 0.7, oy = cy + 0.15 + hash(wx, wy, s + 9) * 0.7;
    const dd = Math.hypot(x - ox, y - oy);
    if (dd < d1) { d2 = d1; d1 = dd; id = wx * 131 + wy; sx = x - ox; sy = y - oy; } else if (dd < d2) d2 = dd;
  }
  return { d1, edge: d2 - d1, id, sx, sy };
}

const H = {};
H.cobble = (base = '#c8b89a') => { const B = hexRGB(base); return paint((x, y) => {
  const v = voronoi(x, y, 4, SEED), n = fbm(x, y, 8, 4, SEED);
  const mortar = mixC(mul(B, 0.42), [70, 62, 52], 0.3);
  const tone = 0.86 + hash(v.id, 3, SEED) * 0.22;
  let c = mul(B, tone * (0.9 + n * 0.22));
  const bevel = smooth(0.03, 0.16, v.edge);
  const light = (-v.sx - v.sy) * 0.18 * (1 - bevel * 0.6);
  c = mul(c, 0.72 + bevel * 0.28 + light);
  if (hash(v.id, 7, SEED) < 0.18) c = mixC(c, mul(B, 0.7), 0.25 * fbm(x, y, 16, 2, SEED + 5));
  return v.edge < 0.035 ? mul(mortar, 0.85 + n * 0.3) : c;
}); };
H.grass = (base = '#5c9a44') => {
  const B = hexRGB(base);
  const c = paint((x, y) => { const n = fbm(x, y, 4, 4, SEED), m = fbm(x, y, 16, 3, SEED + 3); return mul(mixC(B, mixC(B, [190, 200, 90], 0.35), n * 0.8), 0.78 + m * 0.4); });
  const g = c.getContext('2d');
  for (let i = 0; i < 2600; i++) {
    const x = rnd() * S, y = rnd() * S, l = 3 + rnd() * 6, a = -Math.PI / 2 + (rnd() - 0.5) * 0.9, k = 0.75 + rnd() * 0.6;
    g.strokeStyle = `rgb(${B[0] * k | 0},${B[1] * k * 1.05 | 0},${B[2] * k * 0.9 | 0})`; g.lineWidth = 1 + rnd() * 0.6;
    for (const dx of [0, -S, S]) for (const dy of [0, -S, S]) { g.beginPath(); g.moveTo(x + dx, y + dy); g.lineTo(x + dx + Math.cos(a) * l, y + dy + Math.sin(a) * l); g.stroke(); }
  }
  for (let i = 0; i < 9; i++) { const x = rnd() * S, y = rnd() * S, col = ['#f4e8a0', '#ffffff', '#f4b0c8', '#c8b0f0'][i % 4]; for (let k = 0; k < 5; k++) { g.fillStyle = col; g.beginPath(); g.arc(x + (rnd() - 0.5) * 10, y + (rnd() - 0.5) * 10, 1.4, 0, 7); g.fill(); } }
  return c;
};
H.dirt = (base = '#a8835a') => { const B = hexRGB(base); const c = paint((x, y) => { const n = fbm(x, y, 5, 5, SEED); return mul(B, 0.72 + n * 0.5); }); const g = c.getContext('2d'); for (let i = 0; i < 90; i++) { const x = rnd() * S, y = rnd() * S, r = 1 + rnd() * 3; g.fillStyle = `rgba(60,44,30,0.35)`; g.beginPath(); g.ellipse(x + 1, y + 1, r, r * 0.7, 0, 0, 7); g.fill(); g.fillStyle = `rgba(${B[0] + 30},${B[1] + 25},${B[2] + 20},0.9)`; g.beginPath(); g.ellipse(x, y, r, r * 0.7, 0, 0, 7); g.fill(); } return c; };
H.sand = (base = '#e2cc94') => { const B = hexRGB(base); return paint((x, y) => { const n = fbm(x, y, 6, 4, SEED); const rip = Math.sin((y + n * 40) * 0.12) * 0.04; return mul(B, 0.88 + n * 0.2 + rip); }); };
H.wood = (base = '#9a6a3c') => { const B = hexRGB(base); return paint((x, y) => {
  const pl = Math.floor(y / (S / 4)), ly = y % (S / 4), tone = 0.85 + hash(pl, 1, SEED) * 0.25, off = hash(pl, 2, SEED) * 400;
  const n = fbm(x + off, y * 0.2, 4, 3, SEED + pl);
  const grain = 0.5 + 0.5 * Math.sin((x + off) * 0.02 + n * 14 + ly * 0.05);
  let c = mul(B, tone * (0.78 + grain * 0.22 + (fbm(x, y, 32, 2, SEED) - 0.5) * 0.12));
  if (ly < 3) c = mul(c, 0.55 + ly * 0.12); if (ly > S / 4 - 3) c = mul(c, 1.08);
  const seam = ((x + hash(pl, 5, SEED) * S) % S); if (seam < 2.5) c = mul(c, 0.55);
  return c;
}); };
H.brick = (base = '#b8aa94') => { const B = hexRGB(base); return paint((x, y) => {
  const rows = 6, rh = S / rows, r = Math.floor(y / rh), bw = S / 3, ox = (r % 2) * bw / 2, bx = Math.floor(((x + ox) % S) / bw);
  const lx = ((x + ox) % S) % bw, ly = y % rh, edge = Math.min(lx, bw - lx, ly, rh - ly);
  const n = fbm(x, y, 8, 4, SEED);
  if (edge < 3) return mul(mixC(B, [90, 84, 76], 0.6), 0.75 + n * 0.3);
  const tone = 0.82 + hash(bx, r, SEED) * 0.28;
  return mul(B, tone * (0.82 + n * 0.3) * (0.82 + smooth(3, 10, edge) * 0.18) * (ly < rh * 0.3 ? 1.05 : 1));
}); };
H.stonewall = (base = '#9a948a') => {
  const B = hexRGB(base);
  // three courses of irregular blocks
  const cuts = [0, 0, 0].map((_, r) => { const a = []; let x = -hash(r, 1, SEED) * 60; while (x < S) { a.push(x); x += 50 + hash(r, a.length, SEED) * 60; } return a; });
  return paint((x, y) => {
    const rh = S / 3, r = Math.floor(y / rh), ly = y % rh; const row = cuts[r]; let bx = 0, lx = 0, w = S;
    for (let i = row.length - 1; i >= 0; i--) if (x >= row[i]) { bx = i; lx = x - row[i]; w = (row[i + 1] ?? row[0] + S) - row[i]; break; }
    if (x < row[0]) { bx = row.length - 1; lx = x - (row[bx] - S); w = row[0] + S - row[bx]; }
    const edge = Math.min(lx, w - lx, ly, rh - ly), n = fbm(x, y, 8, 5, SEED);
    if (edge < 3.5) return mul(mixC(B, [60, 56, 52], 0.55), 0.7 + n * 0.3);
    let c = mul(B, (0.8 + hash(bx, r, SEED) * 0.3) * (0.78 + n * 0.36) * (0.8 + smooth(3, 12, edge) * 0.2));
    const moss = fbm(x, y, 6, 3, SEED + 11); if (moss > 0.62 && y > S * 0.45) c = mixC(c, [88, 120, 62], (moss - 0.62) * 2.2);
    return c;
  });
};
H.plaster = (base = '#e8dcc0', beam = '#5a3a24') => { const B = hexRGB(base), M = hexRGB(beam); return paint((x, y) => {
  const n = fbm(x, y, 6, 5, SEED), stain = fbm(x, y, 3, 3, SEED + 7);
  const bw = 16;
  if (x < bw || x > S - bw || y > S - bw) { const g = 0.5 + 0.5 * Math.sin((x < bw || x > S - bw ? y : x) * 0.05 + fbm(x, y, 8, 3, SEED) * 9); let c = mul(M, 0.75 + g * 0.3); if (x === bw - 1 || x === S - bw || y === S - bw) c = mul(c, 0.6); return c; }
  let c = mul(B, 0.9 + n * 0.14); c = mixC(c, mul(B, 0.82), smooth(0.55, 0.8, stain) * 0.5);
  if (y > S - bw - 10) c = mul(c, 0.86 + (S - bw - y) * 0.014);
  return c;
}); };
H.roof = (base = '#3a74b8') => {
  // scalloped shingles: upper rows overlap the lower ones, each tile shaded light at the top and dark at its rim
  const B = hexRGB(base), c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
  g.fillStyle = `rgb(${B.map(v => v * 0.35 | 0)})`; g.fillRect(0, 0, S, S);
  const rows = 5, cols = 5, rh = S / rows, cw = S / cols;
  for (let r = rows; r >= -1; r--) for (let k = -1; k <= cols; k++) {
    const x = k * cw + (r % 2) * cw / 2, y = r * rh - rh * 0.25, tone = 0.82 + hash(((k % cols) + cols) % cols, ((r % rows) + rows) % rows, SEED) * 0.3;
    for (const dx of [0, -S, S]) for (const dy of [0, S]) {
      const X = x + dx, Y = y + dy - (dy ? S : 0);
      const grad = g.createLinearGradient(0, Y, 0, Y + rh * 1.3);
      grad.addColorStop(0, `rgb(${B.map(v => Math.min(255, v * tone * 1.25) | 0)})`); grad.addColorStop(0.65, `rgb(${B.map(v => v * tone | 0)})`); grad.addColorStop(1, `rgb(${B.map(v => v * tone * 0.62 | 0)})`);
      g.fillStyle = grad; g.beginPath(); g.moveTo(X + 1, Y); g.lineTo(X + cw - 1, Y); g.lineTo(X + cw - 1, Y + rh * 0.75); g.arc(X + cw / 2, Y + rh * 0.75, cw / 2 - 1, 0, Math.PI); g.closePath(); g.fill();
      g.strokeStyle = `rgba(10,14,30,0.55)`; g.lineWidth = 1.5; g.beginPath(); g.arc(X + cw / 2, Y + rh * 0.75, cw / 2 - 1, 0.1, Math.PI - 0.1); g.stroke();
      g.strokeStyle = `rgba(255,255,255,0.18)`; g.lineWidth = 1; g.beginPath(); g.moveTo(X + 4, Y + 3); g.lineTo(X + cw * 0.45, Y + 3); g.stroke();
    }
  }
  // weathering
  const img = g.getImageData(0, 0, S, S), d = img.data;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const n = 0.85 + fbm(x, y, 8, 4, SEED) * 0.3, i = (y * S + x) * 4; d[i] *= n; d[i + 1] *= n; d[i + 2] *= n; }
  g.putImageData(img, 0, 0); return c;
};
H.cave = (base = '#5a5268') => { const B = hexRGB(base); return paint((x, y) => { const n = fbm(x, y, 5, 5, SEED), rid = 1 - Math.abs(fbm(x, y, 3, 4, SEED + 4) * 2 - 1); return mul(B, 0.65 + n * 0.5 - smooth(0.92, 1, rid) * 0.35); }); };
H.temple = (base = '#b8c4d0') => { const B = hexRGB(base); return paint((x, y) => {
  const t = S / 2, lx = x % t, ly = y % t, edge = Math.min(lx, t - lx, ly, t - ly), n = fbm(x, y, 6, 4, SEED);
  const vein = Math.pow(1 - Math.abs(Math.sin((x * 0.7 + y * 0.3) * 0.03 + fbm(x, y, 4, 5, SEED + 2) * 10)), 14);
  if (edge < 2.5) return mul(B, 0.55);
  return mul(mixC(B, [255, 255, 255], 0.08), (0.88 + n * 0.16 - vein * 0.18) * (0.9 + smooth(2, 10, edge) * 0.1) * (0.94 + hash(Math.floor(x / t), Math.floor(y / t), SEED) * 0.1));
}); };
H.metal = (base = '#6a7480') => { const B = hexRGB(base); return paint((x, y) => {
  const n = fbm(x * 4, y * 0.3, 4, 3, SEED), seam = Math.min(x % 128, y % 128);
  let c = mul(B, 0.82 + n * 0.3); if (seam < 2) c = mul(c, 0.5);
  for (const [rx, ry] of [[12, 12], [116, 12], [12, 116], [116, 116]]) { const d = Math.hypot((x % 128) - rx, (y % 128) - ry); if (d < 4) c = mul(B, 1.2 - d * 0.08); }
  return c;
}); };
H.water = (base = '#3a7ab8') => { const B = hexRGB(base); return paint((x, y) => { const n = fbm(x, y, 4, 5, SEED); return mul(B, 0.8 + n * 0.35 + smooth(0.7, 0.8, fbm(x, y, 8, 3, SEED + 1)) * 0.3); }); };
H.snow = (base = '#eef2f8') => { const B = hexRGB(base); return paint((x, y) => { const n = fbm(x, y, 4, 5, SEED); const c = mixC(B, [200, 215, 240], (1 - n) * 0.5); return hash(x, y, SEED) > 0.996 ? [255, 255, 255] : mul(c, 0.92 + n * 0.1); }); };
H.cloud = (base = '#f0e8f8') => { const B = hexRGB(base); return paint((x, y) => mul(B, 0.86 + fbm(x, y, 3, 5, SEED) * 0.18)); };
H.carpet = (base = '#8a2a3a') => { const B = hexRGB(base); return paint((x, y) => {
  const n = fbm(x, y, 32, 2, SEED), weave = (x + y) % 4 < 2 ? 1.03 : 0.97;
  if ((y > 10 && y < 16) || (y > S - 16 && y < S - 10)) return mul([232, 192, 80], 0.85 + n * 0.25);
  const motif = Math.abs(Math.sin(x * 0.0491) * Math.sin(y * 0.0491)) > 0.85 ? 1.18 : 1;
  return mul(B, (0.85 + n * 0.2) * weave * motif);
}); };
H.crystal = (base = '#6ac8f0') => { const B = hexRGB(base); return paint((x, y) => { const v = voronoi(x, y, 5, SEED); const f = 0.35 + hash(v.id, 1, SEED) * 0.55 + (-v.sx + v.sy) * 0.25; return mul(B, clamp(f, 0.2, 1.4) * (v.edge < 0.03 ? 1.5 : 1)); }); };

export function hdCanvas(kind, base, extra) {
  const f = H[kind]; if (!f) return null;
  SEED = (kind.length * 131 + (base || '').length * 17 + (base || '#').charCodeAt(1) * 7) % 2147483646 + 1;
  return f(base, extra);
}
export function hdTexture(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 8;
  return t;
}

// ---------------------------------------------------------------- painted props (trees, bushes, rocks...)
// drawn in the old sprite's pixel coordinates at 4x, so they keep the same size in the world
const K = 4;
const rgb = (c, k = 1) => { const [r, g, b] = hexRGB(c); return `rgb(${Math.min(255, r * k) | 0},${Math.min(255, g * k) | 0},${Math.min(255, b * k) | 0})`; };
function blob(g, x, y, r, col, k = 1) {
  const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.45, r * 0.1, x, y, r);
  gr.addColorStop(0, rgb(col, 1.35 * k)); gr.addColorStop(0.55, rgb(col, 1.0 * k)); gr.addColorStop(1, rgb(col, 0.62 * k));
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
}
function leafy(g, cx, cy, rx, ry, col, n) {
  // a dark mass, then many small lit clumps (lighter toward the top-left), then fine leaf flecks
  g.fillStyle = rgb(col, 0.42); g.beginPath(); g.ellipse(cx, cy + ry * 0.08, rx, ry, 0, 0, 7); g.fill();
  const pick = () => { const a = rnd() * 7, d = Math.sqrt(rnd()); return [cx + Math.cos(a) * rx * d * 0.92, cy + Math.sin(a) * ry * d * 0.92]; };
  for (let i = 0; i < n * 3; i++) {
    const [x, y] = pick(), r = 1.6 + rnd() * 2.4;
    const lit = clamp(0.55 + (cy - y) / ry * 0.35 + (cx - x) / rx * 0.15 + (rnd() - 0.5) * 0.2, 0.3, 1.25);
    blob(g, x, y, Math.min(r, rx - Math.abs(x - cx) + 1.5, ry - Math.abs(y - cy) + 1.5), col, lit);
  }
  for (let i = 0; i < n * 6; i++) {
    const [x, y] = pick(), up = (cy - y) / ry;
    g.fillStyle = up > 0.1 ? `rgba(240,255,200,${0.12 + up * 0.25})` : `rgba(10,30,10,${0.15 - up * 0.15})`;
    g.beginPath(); g.ellipse(x, y, 0.55, 0.3, rnd() * 3, 0, 7); g.fill();
  }
}
const HP = {};
HP.tree = (g, c) => {
  const L = c.leaf || '#4e8a3c', B = c.bark || '#6a4a2e';
  const gr = g.createLinearGradient(16, 0, 24, 0); gr.addColorStop(0, rgb(B, 1.2)); gr.addColorStop(1, rgb(B, 0.6));
  g.fillStyle = gr; g.beginPath(); g.moveTo(16.5, 52); g.lineTo(18, 28); g.lineTo(22, 28); g.lineTo(23.5, 52); g.fill();
  g.strokeStyle = rgb(B, 0.8); g.lineWidth = 1.6; g.beginPath(); g.moveTo(19, 36); g.quadraticCurveTo(14, 32, 11, 27); g.moveTo(21, 34); g.quadraticCurveTo(26, 30, 29, 26); g.stroke();
  leafy(g, 20, 20, 15.5, 14, L, 34);
};
HP.pine = (g, c) => {
  const L = c.leaf || '#2e6a4a';
  g.fillStyle = rgb(c.bark || '#5a3a24', 0.9); g.fillRect(13.5, 40, 3, 12);
  for (let i = 0; i < 5; i++) {
    const y = 6 + i * 8, w = 5 + i * 2.6;
    const gr = g.createLinearGradient(15 - w, 0, 15 + w, 0); gr.addColorStop(0, rgb(L, 1.3)); gr.addColorStop(0.5, rgb(L, 1)); gr.addColorStop(1, rgb(L, 0.55));
    g.fillStyle = gr; g.beginPath(); g.moveTo(15, y - 6); g.quadraticCurveTo(15 - w * 0.4, y + 2, 15 - w, y + 9); g.quadraticCurveTo(15, y + 7, 15 + w, y + 9); g.quadraticCurveTo(15 + w * 0.4, y + 2, 15, y - 6); g.fill();
  }
  g.strokeStyle = 'rgba(255,255,230,0.25)'; g.lineWidth = 0.4;
  for (let i = 0; i < 40; i++) { const y = 2 + rnd() * 46, x = 15 + (rnd() - 0.6) * (3 + y * 0.25); g.beginPath(); g.moveTo(x, y); g.lineTo(x - 1.2, y + 1.5); g.stroke(); }
};
HP.palm = (g, c) => {
  const L = c.leaf || '#4a9a3a';
  g.strokeStyle = rgb('#9a7a4a'); g.lineWidth = 3; g.beginPath(); g.moveTo(17, 52); g.quadraticCurveTo(20, 32, 18, 12); g.stroke();
  g.strokeStyle = rgb('#6a5030'); g.lineWidth = 0.6; for (let y = 16; y < 50; y += 3) { g.beginPath(); g.moveTo(16.5, y); g.lineTo(19.5, y + 0.6); g.stroke(); }
  for (let i = 0; i < 7; i++) { const a = -Math.PI + i * Math.PI / 6 + 0.1; g.strokeStyle = rgb(L, 0.8 + (i % 3) * 0.2); g.lineWidth = 2.4; g.beginPath(); g.moveTo(18, 12); g.quadraticCurveTo(18 + Math.cos(a) * 9, 6 + Math.sin(a) * 8, 18 + Math.cos(a) * 16, 20 + Math.sin(a) * 6); g.stroke(); }
  blob(g, 18, 13, 2.2, '#7a5a2a');
};
HP.bush = (g, c) => { leafy(g, 11, 7.6, 9.5, 5.2, c.leaf || '#4a8a3a', 14); if (c.flower) for (let i = 0; i < 9; i++) blob(g, 3 + rnd() * 16, 3 + rnd() * 8, 1.1, c.flower); };
HP.flowers = (g, c) => {
  const col = c.color || '#f4a0c0'; g.strokeStyle = rgb('#4a8a3a'); g.lineWidth = 0.6;
  for (let i = 0; i < 9; i++) { const x = 2 + rnd() * 12, y = 3 + rnd() * 5; g.beginPath(); g.moveTo(x, 10); g.lineTo(x + (rnd() - 0.5), y); g.stroke(); for (let p = 0; p < 5; p++) { const a = p * 1.26; blob(g, x + Math.cos(a) * 0.9, y + Math.sin(a) * 0.9, 0.8, i % 3 ? col : '#fff4e0'); } blob(g, x, y, 0.5, '#f4d040'); }
};
HP.rock = (g, c) => {
  const col = c.color || '#9a948a';
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(9, 11, 8.5, 1.6, 0, 0, 7); g.fill();
  const gr = g.createLinearGradient(2, 1, 14, 12); gr.addColorStop(0, rgb(col, 1.3)); gr.addColorStop(0.6, rgb(col, 0.95)); gr.addColorStop(1, rgb(col, 0.6));
  g.fillStyle = gr; g.beginPath(); g.moveTo(1, 11); g.lineTo(2.5, 5); g.lineTo(6, 2); g.lineTo(11, 1.5); g.lineTo(15.5, 4.5); g.lineTo(17, 11); g.closePath(); g.fill();
  g.strokeStyle = rgb(col, 0.55); g.lineWidth = 0.5; g.beginPath(); g.moveTo(6, 2); g.lineTo(8, 7); g.lineTo(15.5, 4.5); g.moveTo(8, 7); g.lineTo(7, 11); g.stroke();
  g.fillStyle = 'rgba(110,140,80,0.5)'; g.beginPath(); g.ellipse(10, 2.5, 3.5, 1, 0, 0, 7); g.fill();
};
HP.reeds = (g) => {
  for (let i = 0; i < 12; i++) { const x = 1 + rnd() * 12; g.strokeStyle = rgb('#6a9a4a', 0.7 + rnd() * 0.6); g.lineWidth = 0.7; g.beginPath(); g.moveTo(x, 16); g.quadraticCurveTo(x + (rnd() - 0.5) * 3, 8, x + (rnd() - 0.5) * 4, 2 + rnd() * 4); g.stroke(); }
  for (let i = 0; i < 3; i++) { g.fillStyle = rgb('#7a5a3a'); g.beginPath(); g.ellipse(3 + i * 4, 3 + i, 0.8, 2, 0, 0, 7); g.fill(); }
};
HP.cactus = (g, c) => {
  const col = c.color || '#5aa84a';
  const part = (x, y, w, h) => { const gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, rgb(col, 1.3)); gr.addColorStop(0.5, rgb(col)); gr.addColorStop(1, rgb(col, 0.6)); g.fillStyle = gr; g.beginPath(); g.roundRect(x, y, w, h, w / 2); g.fill(); };
  part(5.5, 3, 5, 23); part(1, 8, 3.5, 9); part(11.5, 10, 3.5, 8); g.fillRect(3, 14, 3, 2.4); g.fillRect(10.5, 15, 2, 2.4);
  g.fillStyle = '#f4f0c8'; for (let i = 0; i < 14; i++) g.fillRect(6 + rnd() * 4, 4 + rnd() * 20, 0.4, 0.4);
};
HP.crystal = (g, c) => {
  const col = c.color || '#6ac8f0';
  const f = (pts, k) => { g.fillStyle = rgb(col, k); g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.fill(); };
  f([8, 0, 3, 10, 5, 29, 8, 30], 1.35); f([8, 0, 13, 10, 11, 29, 8, 30], 0.75); f([3, 10, 8, 12, 13, 10, 8, 0], 1.6);
  g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 0.4; g.beginPath(); g.moveTo(5, 12); g.lineTo(6, 26); g.stroke();
};
const propCache = new Map();
export function hdProp(kind, colors = {}, w, h) {
  if (!HP[kind]) return null;
  const key = kind + JSON.stringify(colors); if (propCache.has(key)) return propCache.get(key);
  SEED = (kind.length * 977 + key.length * 31) % 2147483646 + 1;
  const c = document.createElement('canvas'); c.width = w * K; c.height = h * K; c.pxScale = K;
  const g = c.getContext('2d'); g.scale(K, K); HP[kind](g, colors);
  propCache.set(key, c); return c;
}
