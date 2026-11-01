// Pixel art made in code: characters, monsters, tiles and props, all drawn on small canvases.
import * as THREE from '../lib/three.module.min.js';
import { hdCanvas, hdTexture, hdProp } from './hdtex.js?v=19';

let seed = 1234;
export const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
export function reseed(s) { seed = s; }

// ---------- colour helpers ----------
function hex(c) { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function toHex([r, g, b]) { return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v | 0)).toString(16).padStart(2, '0')).join(''); }
export function shade(c, k) { const [r, g, b] = hex(c); return k > 0 ? toHex([r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k]) : toHex([r * (1 + k), g * (1 + k), b * (1 + k) * 1.04 + 4]); }
export function mix(a, b, t) { const A = hex(a), B = hex(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); }
// a three-step ramp: light, mid, dark (shadows lean cool, highlights warm)
export function ramp(c) { return [mix(shade(c, 0.28), '#fff2c8', 0.12), c, mix(shade(c, -0.36), '#2a2060', 0.18)]; }

// ---------- a pixel grid ----------
export class Px {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Array(w * h).fill(null); }
  set(x, y, c) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < this.w && y < this.h && c) this.d[y * this.w + x] = c; }
  get(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.d[y * this.w + x] : null; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
  // a rectangle lit from the top left
  srect(x, y, w, h, r) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const c = (i === 0 && w > 2) || (j === 0 && h > 3) ? r[0] : (i >= w - 1 && w > 2) || j >= h - 1 ? r[2] : r[1];
      this.set(x + i, y + j, c);
    }
  }
  ell(cx, cy, rx, ry, c) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) this.set(x, y, c); } }
  // shaded ellipse: light top-left, dark bottom-right
  sell(cx, cy, rx, ry, r) {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
      if (d > 1) continue;
      const l = -dx * 0.6 - dy * 0.8;
      this.set(x, y, l > 0.45 ? r[0] : l < -0.35 || d > 0.82 && l < 0 ? r[2] : r[1]);
    }
  }
  line(x0, y0, x1, y1, c) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let i = 0; i <= n; i++) this.set(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), c); }
  // dark outline around everything that is drawn
  outline(c = '#1c1424') {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.get(x, y)) continue;
      if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1)) add.push([x, y]);
    }
    for (const [x, y] of add) this.d[y * this.w + x] = c;
    return this;
  }
  flip() { const o = new Px(this.w, this.h); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) o.d[y * this.w + x] = this.get(this.w - 1 - x, y); return o; }
  canvas(scale = 1) {
    const c = document.createElement('canvas'); c.width = this.w * scale; c.height = this.h * scale;
    const g = c.getContext('2d');
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const v = this.d[y * this.w + x]; if (v) { g.fillStyle = v; g.fillRect(x * scale, y * scale, scale, scale); } }
    return c;
  }
}

export function texFrom(canvas, repeat = false) {
  const t = new THREE.CanvasTexture(canvas);
  if (canvas.pxScale) { t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 4; }
  else { t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; }
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
// several frames side by side on one sheet
export function sheet(frames) {
  const w = frames[0].w, h = frames[0].h;
  const c = document.createElement('canvas'); c.width = w * frames.length; c.height = h;
  const g = c.getContext('2d');
  frames.forEach((f, i) => g.drawImage(f.canvas(), i * w, 0));
  return c;
}

// ======================================================================
// People. Every hero, villager and echo is a recipe:
//   { skin, hair, hairStyle, eyes, top, top2, legs, boots, cape, hat, weapon, robe, beard }
// Field frames are 20x28; down / up / left, three steps each. Battle poses face left.
// ======================================================================
export const W = 20, H = 28;
const SKINS = { light: '#f3c9a4', tan: '#d9a274', dark: '#9c6a48', pale: '#f6dccb', green: '#9cc79a', blue: '#9db3e0' };

function hairTop(p, s, R, dir) {
  const [l, m, d] = R;
  if (s.hairStyle === 'bald') return;
  if (dir === 'up') {
    p.srect(5, 1, 10, 9, R); p.rect(5, 9, 10, 1, d);
    if (s.hairStyle === 'long' || s.hairStyle === 'braid') p.srect(5, 9, 10, 6, R);
    if (s.hairStyle === 'ponytail') { p.srect(8, 9, 4, 6, R); p.set(9, 9, '#c84a4a'); p.set(10, 9, '#c84a4a'); }
    if (s.hairStyle === 'braid') { p.srect(9, 14, 3, 5, R); }
    if (s.hairStyle === 'spiky') { p.set(5, 0, m); p.set(8, 0, m); p.set(11, 0, m); p.set(14, 0, m); p.set(4, 3, m); p.set(15, 3, m); }
    return;
  }
  if (dir === 'down') {
    p.srect(5, 1, 10, 4, R);
    p.rect(5, 5, 2, 3, m); p.rect(13, 5, 2, 3, d);
    p.set(7, 5, m); p.set(10, 5, m); p.set(12, 5, d);
    if (s.hairStyle === 'long' || s.hairStyle === 'braid') { p.rect(4, 5, 2, 8, m); p.rect(14, 5, 2, 8, d); }
    if (s.hairStyle === 'spiky') { p.set(5, 0, l); p.set(8, 0, l); p.set(11, 0, m); p.set(14, 0, m); p.set(4, 2, m); p.set(15, 2, d); p.set(9, 5, m); p.set(9, 6, m); }
    if (s.hairStyle === 'ponytail') { p.rect(15, 4, 2, 6, d); }
    if (s.hairStyle === 'bob') { p.rect(4, 4, 2, 6, m); p.rect(14, 4, 2, 6, d); }
    p.set(6, 2, l); p.set(7, 2, l);
    return;
  }
  // left: face on the left, hair to the back (right)
  p.srect(5, 1, 10, 4, R);
  p.rect(10, 4, 5, 5, m); p.rect(14, 4, 1, 5, d);
  p.rect(5, 4, 2, 2, m);
  if (s.hairStyle === 'long' || s.hairStyle === 'braid') p.srect(11, 8, 4, 6, R);
  if (s.hairStyle === 'bob') p.srect(11, 8, 4, 3, R);
  if (s.hairStyle === 'ponytail') { p.srect(14, 5, 3, 7, R); }
  if (s.hairStyle === 'spiky') { p.set(6, 0, l); p.set(9, 0, m); p.set(12, 0, m); p.set(15, 2, m); p.set(16, 4, d); p.set(15, 6, d); p.set(4, 3, m); }
  p.set(6, 2, l); p.set(7, 2, l);
}

function hatTop(p, s, dir) {
  if (!s.hat) return;
  const R = ramp(s.hatColor || '#4a3a8a');
  if (s.hat === 'wizard') {
    p.srect(3, 4, 14, 2, R);
    p.srect(6, 1, 8, 3, R); p.srect(7, -1, 6, 2, R);
    if (dir === 'left') { p.rect(12, -2, 3, 2, R[1]); p.set(15, -1, R[2]); } else { p.rect(9, -2, 2, 1, R[1]); }
    p.rect(6, 3, 8, 1, s.hatBand || '#e2b84a');
  } else if (s.hat === 'hood') {
    if (dir === 'up') p.srect(4, 0, 12, 12, R);
    else { p.srect(4, 0, 12, 5, R); p.rect(4, 5, 2, 7, R[1]); p.rect(14, 5, 2, 7, R[2]); if (dir === 'left') p.srect(10, 4, 6, 8, R); }
  } else if (s.hat === 'helm') {
    p.srect(5, 0, 10, 5, R); p.rect(5, 5, 10, 1, R[2]);
    if (dir === 'down') { p.rect(9, 5, 2, 2, R[1]); }
    if (dir === 'left') { p.rect(11, 4, 4, 5, R[1]); }
    p.set(9, -1, s.hatBand || '#d84a4a'); p.set(10, -1, s.hatBand || '#d84a4a'); p.set(10, -2, s.hatBand || '#d84a4a');
  } else if (s.hat === 'cap') {
    p.srect(5, 0, 10, 4, R);
    if (dir === 'down') p.rect(5, 4, 10, 1, R[2]);
    if (dir === 'left') p.rect(3, 3, 4, 1, R[2]);
  } else if (s.hat === 'band') {
    p.rect(5, 3, 10, 1, R[1]);
    if (dir === 'left') { p.set(15, 4, R[1]); p.set(16, 5, R[1]); p.set(16, 6, R[2]); }
  }
}

function face(p, s, dir) {
  const sk = SKINS[s.skin] || s.skin || SKINS.light, R = ramp(sk);
  if (dir === 'up') { p.srect(6, 3, 8, 8, R); return; }
  if (dir === 'down') {
    p.srect(5, 3, 10, 8, [R[1], R[1], R[2]]);
    p.rect(5, 10, 10, 1, R[2]);
    const e = s.eyes || '#2a2238';
    p.rect(7, 7, 1, 2, e); p.rect(12, 7, 1, 2, e);
    p.set(7, 7, '#fff'); p.set(12, 7, '#fff');
    p.set(6, 9, mix(sk, '#ff7a7a', 0.35)); p.set(13, 9, mix(sk, '#ff7a7a', 0.35));
    if (s.beard) { p.rect(6, 9, 8, 3, s.beard); p.rect(8, 9, 4, 1, R[2]); }
    return;
  }
  // left
  p.srect(5, 3, 7, 8, [R[1], R[1], R[2]]); p.set(4, 7, R[1]); p.set(4, 8, R[1]);
  p.rect(5, 10, 6, 1, R[2]);
  const e = s.eyes || '#2a2238';
  p.rect(6, 7, 1, 2, e); p.set(6, 7, '#fff');
  p.set(7, 9, mix(sk, '#ff7a7a', 0.35));
  p.set(10, 7, R[2]); p.set(10, 8, R[2]); // ear
  if (s.beard) p.rect(4, 9, 6, 3, s.beard);
}

// body with a pose. pose: {legL, legR, armF, armB, lift} offsets
function body(p, s, dir, pose) {
  const T = ramp(s.top || '#3d5a9a'), T2 = ramp(s.top2 || shade(s.top || '#3d5a9a', -0.2));
  const L = ramp(s.legs || '#3a3048'), B = ramp(s.boots || '#5a3a2a');
  const sk = SKINS[s.skin] || s.skin || SKINS.light;
  const y0 = pose.lift || 0;
  if (dir !== 'left') {
    // legs
    const ll = pose.legL || 0, lr = pose.legR || 0;
    if (!s.robe) {
      p.srect(7, 20 + y0 + ll, 3, 5 - ll, L); p.srect(10, 20 + y0 + lr, 3, 5 - lr, L);
      p.srect(7, 25 + y0, 3, 2, B); p.srect(10, 25 + y0, 3, 2, B);
      if (ll) p.rect(7, 26 + y0, 3, 1, null);
    } else {
      p.srect(6, 19 + y0, 8, 7, T); p.rect(6, 25 + y0, 8, 1, T[2]);
      p.srect(7 + (ll ? -1 : 0), 26 + y0, 3, 1, B); p.srect(10 + (lr ? 1 : 0), 26 + y0, 3, 1, B);
    }
    // cape behind when facing down shows only edges
    if (s.cape && dir === 'up') { const C = ramp(s.cape); p.srect(5, 11 + y0, 10, 12, C); p.rect(5, 22 + y0, 10, 1, C[2]); }
    if (s.cape && dir === 'down') { const C = ramp(s.cape); p.rect(4, 12 + y0, 1, 9, C[2]); p.rect(15, 12 + y0, 1, 9, C[2]); }
    // torso
    if (!(s.cape && dir === 'up')) {
      p.srect(6, 11 + y0, 8, 9, T);
      if (dir === 'down') {
        p.rect(9, 11 + y0, 2, 8, T2[1]); p.set(9, 11 + y0, T2[0]);
        p.rect(6, 18 + y0, 8, 1, s.belt || '#6a4628'); p.set(9, 18 + y0, '#e2c058');
        if (s.collar) { p.rect(7, 11 + y0, 6, 1, s.collar); }
      }
    }
    // arms swing
    const af = pose.armF || 0, ab = pose.armB || 0;
    p.srect(4, 12 + y0 + af, 2, 6, T); p.set(4, 18 + y0 + af, sk); p.set(5, 18 + y0 + af, sk);
    p.srect(14, 12 + y0 + ab, 2, 6, T); p.set(14, 18 + y0 + ab, sk); p.set(15, 18 + y0 + ab, sk);
    if (s.pauldron) { const P = ramp(s.pauldron); p.srect(3, 11 + y0, 4, 2, P); p.srect(13, 11 + y0, 4, 2, P); }
    return;
  }
  // facing left
  const step = pose.step || 0; // -1, 0, 1
  if (s.cape) { const C = ramp(s.cape); p.srect(11, 11 + y0, 4, 11, C); p.set(15, 20 + y0, C[2]); p.set(15, 21 + y0, C[2]); }
  if (!s.robe) {
    if (step === 0) { p.srect(8, 20 + y0, 4, 5, L); p.srect(7, 25 + y0, 5, 2, B); }
    else {
      p.srect(6 + step * -1, 20 + y0, 3, 5, L); p.srect(5 + step * -1, 25 + y0, 4, 2, B);
      p.srect(10 + step, 20 + y0, 3, 5, [L[1], L[2], L[2]]); p.srect(10 + step, 25 + y0, 4, 2, [B[1], B[2], B[2]]);
    }
  } else {
    p.srect(6, 19 + y0, 8, 7, T); p.rect(6, 25 + y0, 8, 1, T[2]);
    p.srect(5 + (step < 0 ? -1 : 0), 26 + y0, 4, 1, B); if (step) p.srect(10 + step, 26 + y0, 3, 1, B);
  }
  p.srect(7, 11 + y0, 6, 9, T);
  p.rect(7, 18 + y0, 6, 1, s.belt || '#6a4628');
  if (s.pauldron) { const P = ramp(s.pauldron); p.srect(7, 11 + y0, 5, 2, P); }
}

// front arm drawn last for the side view, with an optional weapon
function frontArm(p, s, pose, ox = 0) {
  const T = ramp(s.top || '#3d5a9a'), sk = SKINS[s.skin] || s.skin || SKINS.light;
  const y0 = pose.lift || 0;
  const a = pose.arm || 'down';
  let hx, hy;
  if (a === 'down') { p.srect(9 + ox, 12 + y0, 2, 6, T); hx = 9 + ox; hy = 18 + y0; p.rect(hx, hy, 2, 1, sk); }
  else if (a === 'swingF') { p.srect(9 + ox, 12 + y0, 2, 3, T); p.srect(6 + ox, 14 + y0, 3, 2, T); hx = 5 + ox; hy = 14 + y0; p.rect(hx, hy, 1, 2, sk); }
  else if (a === 'up') { p.srect(9, 7 + y0, 2, 5, T); hx = 9; hy = 6 + y0; p.rect(hx, hy, 2, 1, sk); }
  else if (a === 'back') { p.srect(11, 12 + y0, 2, 3, T); p.srect(12, 10 + y0, 2, 3, T); hx = 13; hy = 9 + y0; p.rect(hx, hy, 1, 1, sk); }
  else if (a === 'fwd') { p.srect(5, 13 + y0, 5, 2, T); hx = 4; hy = 13 + y0; p.rect(hx, hy, 1, 2, sk); }
  else if (a === 'guard') { p.srect(7, 12 + y0, 2, 3, T); p.srect(5, 13 + y0, 2, 3, T); hx = 5; hy = 16 + y0; }
  return [hx, hy];
}

function weapon(p, kind, hx, hy, a) {
  if (!kind) return;
  const steel = ['#f4f6fa', '#b8c4d4', '#6a7890'], wood = ['#c89a5a', '#8a5a2a', '#5a3a1a'], gold = '#e8c050';
  if (kind === 'sword') {
    if (a === 'swingF') { p.line(hx - 1, hy + 1, hx - 6, hy + 1, steel[1]); p.line(hx - 1, hy, hx - 6, hy, steel[0]); p.set(hx, hy - 1, gold); p.set(hx, hy + 2, gold); }
    else if (a === 'back') { p.line(hx, hy - 1, hx + 3, hy - 7, steel[0]); p.line(hx + 1, hy - 1, hx + 4, hy - 7, steel[1]); p.rect(hx - 1, hy, 3, 1, gold); }
    else if (a === 'up') { p.line(hx, hy - 1, hx, hy - 8, steel[0]); p.line(hx + 1, hy - 1, hx + 1, hy - 8, steel[1]); p.rect(hx - 1, hy, 4, 1, gold); }
    else if (a === 'guard') { p.line(hx - 1, hy, hx - 1, hy - 9, steel[0]); p.line(hx, hy, hx, hy - 9, steel[1]); p.rect(hx - 2, hy, 3, 1, gold); }
    else { p.line(hx, hy + 1, hx - 1, hy + 7, steel[1]); p.line(hx + 1, hy + 1, hx, hy + 7, steel[2]); p.rect(hx - 1, hy + 1, 3, 1, gold); }
  } else if (kind === 'staff' || kind === 'rod') {
    const tip = kind === 'staff' ? '#ff9a4a' : '#8ae0ff';
    if (a === 'up') { p.line(hx, hy + 4, hx, hy - 7, wood[1]); p.rect(hx - 1, hy - 9, 3, 3, tip); p.set(hx, hy - 8, '#fff'); }
    else if (a === 'swingF' || a === 'fwd') { p.line(hx + 2, hy + 2, hx - 6, hy - 2, wood[1]); p.rect(hx - 8, hy - 4, 3, 3, tip); p.set(hx - 7, hy - 3, '#fff'); }
    else { p.line(hx - 1, hy - 7, hx - 1, hy + 8, wood[1]); p.rect(hx - 2, hy - 10, 3, 3, tip); p.set(hx - 1, hy - 9, '#fff'); }
  } else if (kind === 'spear') {
    if (a === 'swingF' || a === 'fwd') { p.line(hx + 4, hy + 1, hx - 8, hy + 1, wood[1]); p.rect(hx - 11, hy, 3, 2, steel[0]); }
    else if (a === 'up') { p.line(hx, hy + 5, hx, hy - 9, wood[1]); p.rect(hx, hy - 12, 1, 3, steel[0]); }
    else { p.line(hx - 1, hy + 8, hx - 1, hy - 10, wood[1]); p.rect(hx - 2, hy - 13, 3, 3, steel[0]); p.set(hx - 1, hy - 14, steel[0]); }
  } else if (kind === 'dagger') {
    if (a === 'swingF' || a === 'fwd') { p.line(hx - 1, hy, hx - 4, hy, steel[0]); }
    else { p.line(hx, hy + 1, hx, hy + 4, steel[0]); }
  } else if (kind === 'bow') {
    p.line(hx - 1, hy - 5, hx - 3, hy, wood[0]); p.line(hx - 3, hy, hx - 1, hy + 5, wood[0]); p.line(hx - 1, hy - 5, hx - 1, hy + 5, '#eee');
  } else if (kind === 'wrench') {
    p.line(hx, hy, hx - 4, hy - 4, steel[1]); p.rect(hx - 6, hy - 6, 3, 2, steel[0]); p.set(hx - 5, hy - 5, null);
  } else if (kind === 'harp') {
    p.srect(hx - 3, hy - 4, 4, 6, ramp(gold)); p.line(hx - 2, hy - 3, hx - 2, hy + 1, '#fff');
  } else if (kind === 'katana') {
    if (a === 'swingF') p.line(hx - 1, hy, hx - 8, hy - 1, steel[0]);
    else if (a === 'up' || a === 'back') p.line(hx, hy - 1, hx + 3, hy - 9, steel[0]);
    else p.line(hx - 1, hy + 1, hx - 3, hy + 8, steel[0]);
  } else if (kind === 'shield') {
    p.srect(hx - 3, hy - 3, 4, 6, ramp('#5a7ac8')); p.set(hx - 2, hy - 1, gold);
  }
}

export function personFrame(s, dir, pose = {}) {
  const p = new Px(W, H + 4);
  const o = new Px(W, H + 4); // draw into an offset buffer so hats can go above the head
  const g = { set: (x, y, c) => p.set(x, y + 4, c) };
  // draw with a shifted proxy
  const q = new Proxy(p, { get(t, k) { if (k === 'set') return (x, y, c) => t.set(x, y + 4, c); if (k === 'get') return (x, y) => t.get(x, y + 4); return t[k]; } });
  const D = dir === 'right' ? 'left' : dir;
  // back weapon for up view
  if (D === 'up' && s.weapon && s.weapon !== 'harp') weapon(q, s.weapon, 12, 12, 'back');
  body(q, s, D, pose);
  if (D === 'left') {
    face(q, s, D); hairTop(q, s, ramp(s.hair || '#6a4a2a'), D); hatTop(q, s, D);
    const [hx, hy] = frontArm(q, s, pose);
    weapon(q, pose.weapon === false ? null : s.weapon, hx, hy, pose.arm || 'down');
    if (s.shield && (pose.arm || 'down') === 'down') weapon(q, 'shield', 13, 18 + (pose.lift || 0), 'down');
  } else {
    face(q, s, D);
    hairTop(q, s, ramp(s.hair || '#6a4a2a'), D); hatTop(q, s, D);
    if (D === 'down' && s.weapon === 'staff') weapon(q, 'staff', 16, 18 + (pose.lift || 0), 'down');
    if (D === 'down' && s.shield) weapon(q, 'shield', 7, 16 + (pose.lift || 0), 'down');
  }
  p.outline();
  return dir === 'right' ? p.flip() : p;
}

// field sheet: 12 frames = [down x3, up x3, left x3, right x3]
export function personSheet(s) {
  const frames = [];
  for (const d of ['down', 'up', 'left', 'right']) {
    if (d === 'left' || d === 'right') {
      frames.push(personFrame(s, d, {}), personFrame(s, d, { step: 1, arm: 'down', lift: -1 }), personFrame(s, d, { step: -1, arm: 'down', lift: -1 }));
    } else {
      frames.push(personFrame(s, d, {}), personFrame(s, d, { legL: 1, armF: 1, armB: -1, lift: -1 }), personFrame(s, d, { legR: 1, armF: -1, armB: 1, lift: -1 }));
    }
  }
  return sheet(frames);
}
// battle sheet facing left: idle, idle2, ready, strike, cast, hurt, ko, guard, victory
export const BPOSE = { idle: 0, idle2: 1, ready: 2, strike: 3, cast: 4, hurt: 5, ko: 6, guard: 7, win: 8, item: 9, weak: 10 };
export function battleSheet(s) {
  const f = [
    personFrame(s, 'left', {}),
    personFrame(s, 'left', { lift: 1 }),
    personFrame(s, 'left', { arm: 'back', step: 1 }),
    personFrame(s, 'left', { arm: 'swingF', step: -1 }),
    personFrame(s, 'left', { arm: 'up' }),
    personFrame(s, 'left', { lift: 1, step: 1 }),
    koFrame(s),
    personFrame(s, 'left', { arm: 'guard' }),
    personFrame(s, 'left', { arm: 'up', lift: -1 }),
    personFrame(s, 'left', { arm: 'fwd', weapon: false }),
  ];
  return sheet(f);
}
function koFrame(s) {
  // the side frame turned on its back
  const src = personFrame(s, 'left', {}), p = new Px(W, H + 4);
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    const c = src.get(x, y); if (!c) continue;
    const nx = Math.round(y * 0.62) - 1, ny = H + 3 - Math.round(x * 0.45) - 1;
    p.set(nx, ny, c); p.set(nx + 1, ny, c);
  }
  return p;
}

// ======================================================================
// Monsters. Each kind draws itself; palettes recolour them for stronger cousins.
// ======================================================================
const MON = {};
MON.slime = (c) => {
  const p = new Px(20, 18), R = ramp(c.body);
  p.sell(10, 11, 9, 7, R); p.rect(3, 15, 14, 2, R[2]);
  p.set(6, 7, R[0]); p.set(7, 6, R[0]); p.set(7, 7, '#fff');
  p.rect(6, 10, 2, 3, c.eye || '#1c1424'); p.rect(12, 10, 2, 3, c.eye || '#1c1424');
  p.set(6, 10, '#fff'); p.set(12, 10, '#fff');
  p.rect(8, 14, 4, 1, R[2]);
  if (c.crown) { p.rect(7, 2, 6, 3, '#e8c050'); p.set(7, 1, '#e8c050'); p.set(10, 1, '#e8c050'); p.set(12, 1, '#e8c050'); p.set(10, 3, '#d84a4a'); }
  return p.outline();
};
MON.wolf = (c) => {
  const p = new Px(32, 22), R = ramp(c.body), R2 = ramp(c.belly || shade(c.body, 0.3));
  p.sell(17, 11, 9, 5, R);                  // body
  p.srect(9, 13, 3, 7, R); p.srect(13, 14, 3, 6, R); p.srect(21, 14, 3, 6, R); p.srect(25, 13, 3, 7, R); // legs
  p.sell(7, 8, 5, 4, R); p.srect(1, 8, 5, 3, R); p.rect(1, 10, 4, 1, R2[1]); // head + snout
  p.set(1, 8, '#1c1424'); p.set(4, 11, '#fff'); p.set(2, 11, '#fff');
  p.set(7, 2, R[1]); p.set(8, 3, R[1]); p.set(10, 2, R[2]); p.set(10, 3, R[1]); // ears
  p.set(6, 7, c.eye || '#ffd23a');
  p.line(26, 9, 31, 5, R[1]); p.line(26, 10, 31, 6, R[2]);       // tail
  p.rect(13, 14, 10, 2, R2[2]);
  if (c.mane) { p.sell(12, 8, 4, 5, ramp(c.mane)); }
  return p.outline();
};
MON.bat = (c) => {
  const p = new Px(26, 16), R = ramp(c.body), Wg = ramp(c.wing || shade(c.body, -0.2));
  for (let i = 0; i < 10; i++) { p.line(12, 6, 2 + i, 2 + Math.abs(i - 4) * 0.6, Wg[i % 2 + 1]); p.line(13, 6, 23 - i, 2 + Math.abs(i - 4) * 0.6, Wg[i % 2 + 1]); }
  p.line(2, 2, 6, 11, Wg[2]); p.line(23, 2, 19, 11, Wg[2]);
  p.sell(12.5, 8, 4, 4, R);
  p.set(10, 4, R[1]); p.set(15, 4, R[1]);
  p.set(11, 7, c.eye || '#ff4a4a'); p.set(14, 7, c.eye || '#ff4a4a');
  p.set(12, 10, '#fff'); p.set(13, 10, '#fff');
  return p.outline();
};
MON.goblin = (c) => {
  const p = new Px(22, 26), sk = ramp(c.body), cl = ramp(c.cloth || '#7a5a3a');
  p.srect(8, 19, 3, 5, sk); p.srect(12, 19, 3, 5, sk);
  p.srect(7, 12, 9, 8, cl); p.rect(7, 18, 9, 1, '#4a3020');
  p.sell(11, 8, 6, 5, sk);
  p.line(4, 5, 6, 8, sk[1]); p.line(18, 5, 16, 8, sk[2]); // ears
  p.rect(8, 7, 2, 2, c.eye || '#ffe03a'); p.rect(13, 7, 2, 2, c.eye || '#ffe03a'); p.set(8, 7, '#1c1424'); p.set(13, 7, '#1c1424');
  p.rect(9, 11, 5, 1, '#3a1a1a'); p.set(10, 11, '#fff'); p.set(12, 11, '#fff');
  p.srect(4, 13, 3, 5, sk); p.srect(16, 13, 3, 5, sk);
  // club
  p.line(3, 18, 1, 9, '#8a5a2a'); p.sell(1.5, 8, 2, 3, ramp('#8a5a2a'));
  if (c.hat) { p.srect(6, 1, 10, 3, ramp(c.hat)); p.rect(5, 3, 12, 1, shade(c.hat, -0.3)); }
  return p.outline();
};
MON.plant = (c) => {
  const p = new Px(26, 28), L = ramp(c.leaf || '#4a9a3a'), F = ramp(c.body);
  for (let i = 0; i < 5; i++) { const a = -0.4 + i * 0.35; p.line(13, 24, 13 + Math.cos(a + 3.6) * -10, 24 - Math.sin(a + 3.6) * -6, L[i % 3]); }
  p.srect(11, 14, 4, 11, L);
  p.sell(13, 10, 8, 7, F);
  p.ell(13, 11, 4, 3, '#3a0a1a'); for (let i = 0; i < 5; i++) p.set(10 + i * 1.5, 9, '#fff');
  p.set(8, 6, F[0]); p.set(9, 5, F[0]);
  for (let i = 0; i < 6; i++) { const a = i * 1.05; p.set(13 + Math.cos(a) * 9, 10 + Math.sin(a) * 8, c.spot || '#ffe0a0'); }
  return p.outline();
};
MON.golem = (c) => {
  const p = new Px(34, 38), R = ramp(c.body);
  p.srect(9, 28, 6, 9, R); p.srect(19, 28, 6, 9, R);
  p.srect(6, 12, 22, 17, R);
  p.srect(0, 13, 7, 14, R); p.srect(27, 13, 7, 14, R);
  p.srect(0, 26, 7, 5, ramp(shade(c.body, -0.15))); p.srect(27, 26, 7, 5, ramp(shade(c.body, -0.15)));
  p.srect(11, 3, 12, 10, R);
  p.rect(13, 7, 3, 2, c.eye || '#5affe0'); p.rect(18, 7, 3, 2, c.eye || '#5affe0');
  for (let i = 0; i < 9; i++) p.set(8 + rnd() * 18, 14 + rnd() * 13, R[2]);
  p.line(10, 16, 14, 20, R[2]); p.line(22, 15, 19, 22, R[2]);
  if (c.moss) { p.rect(11, 3, 12, 2, c.moss); p.rect(6, 12, 8, 2, c.moss); p.rect(27, 13, 4, 2, c.moss); }
  if (c.core) { p.sell(17, 19, 3, 3, ramp(c.core)); }
  return p.outline();
};
MON.bird = (c) => {
  const p = new Px(30, 26), R = ramp(c.body), Wg = ramp(c.wing || shade(c.body, -0.15));
  p.sell(16, 14, 7, 6, R);
  for (let i = 0; i < 7; i++) p.line(16, 11, 26 + (i % 2), 2 + i * 1.6, Wg[i % 3]);
  p.sell(8, 9, 4, 4, R);
  p.rect(2, 9, 3, 2, '#e8b040'); p.set(1, 10, '#c88a20');
  p.set(7, 8, c.eye || '#1c1424');
  p.line(22, 16, 29, 20, Wg[1]); p.line(22, 17, 29, 22, Wg[2]);
  p.line(14, 20, 13, 24, '#e8b040'); p.line(18, 20, 18, 24, '#e8b040');
  if (c.crest) { p.line(9, 5, 7, 1, c.crest); p.line(10, 5, 10, 1, c.crest); }
  return p.outline();
};
MON.skeleton = (c) => {
  const p = new Px(22, 30), B = ramp(c.body || '#e8e4d8');
  p.sell(11, 6, 5, 5, B); p.rect(8, 5, 2, 2, '#1c1424'); p.rect(12, 5, 2, 2, '#1c1424'); p.set(8, 5, c.eye || '#ff4a4a'); p.set(12, 5, c.eye || '#ff4a4a');
  p.rect(9, 10, 5, 1, B[2]); p.set(10, 10, '#1c1424'); p.set(12, 10, '#1c1424');
  p.rect(10, 11, 2, 9, B[1]);
  for (let i = 0; i < 4; i++) p.rect(7, 12 + i * 2, 8, 1, B[i % 2]);
  p.line(7, 12, 4, 19, B[1]); p.line(15, 12, 18, 19, B[2]);
  p.rect(8, 20, 6, 2, B[1]);
  p.line(9, 22, 8, 29, B[1]); p.line(13, 22, 14, 29, B[2]);
  p.line(4, 19, 1, 9, '#b8c4d4'); p.line(3, 19, 0, 10, '#f4f6fa');
  if (c.armor) { p.srect(6, 11, 10, 6, ramp(c.armor)); p.srect(6, 0, 10, 3, ramp(c.armor)); }
  if (c.robe) { p.srect(6, 12, 10, 16, ramp(c.robe)); p.srect(5, 0, 12, 4, ramp(c.robe)); }
  return p.outline();
};
MON.fish = (c) => {
  const p = new Px(30, 20), R = ramp(c.body), F = ramp(c.fin || shade(c.body, 0.2));
  p.sell(13, 10, 11, 7, R);
  p.line(23, 10, 29, 3, F[1]); p.line(23, 10, 29, 17, F[2]); p.line(29, 3, 29, 17, F[2]); for (let i = 4; i < 17; i++) p.line(24, 10, 29, i, F[1]);
  p.line(10, 3, 17, 2, F[1]); p.line(10, 4, 17, 3, F[0]);
  p.rect(5, 8, 2, 2, '#1c1424'); p.set(5, 8, '#fff');
  p.line(3, 13, 8, 13, '#3a0a1a'); for (let i = 0; i < 4; i++) p.set(4 + i * 1.3, 12, '#fff');
  for (let i = 0; i < 8; i++) p.set(9 + i * 1.6, 9 + (i % 2) * 3, R[2]);
  return p.outline();
};
MON.mage = (c) => {
  // a hooded caster
  const p = new Px(22, 30), R = ramp(c.body);
  p.srect(5, 10, 12, 18, R); p.rect(4, 27, 14, 1, R[2]);
  p.srect(5, 1, 12, 10, R); p.rect(7, 4, 8, 6, '#120a1a'); p.set(9, 7, c.eye || '#ffe03a'); p.set(13, 7, c.eye || '#ffe03a');
  p.line(18, 28, 19, 6, '#8a5a2a'); p.sell(19, 4, 2, 2, ramp(c.orb || '#c04aff'));
  p.srect(15, 14, 4, 3, R);
  if (c.trim) { p.rect(5, 10, 12, 1, c.trim); p.rect(10, 11, 2, 16, c.trim); }
  return p.outline();
};
MON.crab = (c) => {
  const p = new Px(30, 20), R = ramp(c.body);
  p.sell(15, 12, 9, 5, R);
  for (let i = 0; i < 3; i++) { p.line(8 - i, 14, 3 - i * 2, 19, R[2]); p.line(22 + i, 14, 27 + i * 2, 19, R[2]); }
  p.sell(4, 6, 4, 3, R); p.sell(26, 6, 4, 3, R); p.rect(2, 3, 3, 2, R[0]); p.rect(25, 3, 3, 2, R[0]);
  p.line(8, 8, 6, 8, R[1]); p.line(22, 8, 24, 8, R[1]);
  p.line(12, 7, 12, 4, R[2]); p.line(18, 7, 18, 4, R[2]); p.set(12, 3, '#1c1424'); p.set(18, 3, '#1c1424');
  return p.outline();
};
MON.wisp = (c) => {
  const p = new Px(18, 22), R = ramp(c.body);
  p.sell(9, 9, 6, 6, R); p.ell(9, 9, 3, 3, shade(c.body, 0.6));
  for (let i = 0; i < 6; i++) p.set(9 + Math.sin(i) * 3, 15 + i, R[i % 3]);
  p.set(4, 3, R[0]); p.set(14, 4, R[0]); p.set(7, 1, R[1]);
  p.set(7, 8, '#1c1424'); p.set(11, 8, '#1c1424');
  return p;
};
MON.knight = (c) => {
  // armoured humanoid boss
  const s = { skin: '#6a6a7a', hair: '#222', top: c.body, top2: c.trim || '#e8c050', legs: shade(c.body, -0.3), boots: '#2a2a3a', hat: 'helm', hatColor: c.body, hatBand: c.plume || '#d84a4a', cape: c.cape || '#6a1a2a', weapon: c.weapon || 'sword', pauldron: c.trim || '#e8c050', shield: c.shield };
  const f = personFrame(s, 'right', { arm: 'down' });
  return scaleUp(f, 1);
};
MON.dragon = (c) => {
  const p = new Px(64, 52), R = ramp(c.body), B = ramp(c.belly || '#e8d8a0'), Wg = ramp(c.wing || shade(c.body, -0.25));
  // wing
  for (let i = 0; i < 9; i++) p.line(36, 18, 58 - i * 2, 2 + i * 2.6, Wg[i % 3]);
  p.line(36, 18, 63, 1, Wg[2]); p.line(63, 1, 50, 24, Wg[2]);
  p.sell(36, 32, 14, 10, R); p.sell(36, 36, 9, 6, B);
  p.srect(26, 38, 6, 12, R); p.srect(42, 38, 6, 12, R);
  p.rect(24, 49, 9, 2, R[2]); p.rect(41, 49, 9, 2, R[2]);
  // neck and head
  for (let i = 0; i < 8; i++) p.sell(24 - i * 1.6, 26 - i * 2, 4, 4, R);
  p.sell(8, 10, 7, 5, R); p.srect(0, 10, 6, 4, R); p.rect(0, 13, 6, 1, '#3a0a1a');
  for (let i = 0; i < 3; i++) p.set(1 + i * 2, 14, '#fff');
  p.set(7, 8, c.eye || '#ffe03a'); p.set(8, 8, c.eye || '#ffe03a');
  p.line(10, 6, 16, 1, '#e8e0c8'); p.line(12, 6, 19, 3, '#d8d0b8');
  // tail
  for (let i = 0; i < 10; i++) p.sell(50 + i * 1.3, 38 + Math.sin(i * 0.6) * 3, 3 - i * 0.2, 3 - i * 0.2, R);
  for (let i = 0; i < 6; i++) p.set(28 + i * 3, 22 + Math.abs(i - 3), R[0]);
  return p.outline();
};
MON.tree = (c) => {
  const p = new Px(44, 50), L = ramp(c.leaf || '#3a7a3a'), B = ramp(c.body || '#6a4a2a');
  p.sell(22, 14, 18, 13, L);
  for (let i = 0; i < 16; i++) p.sell(6 + rnd() * 32, 6 + rnd() * 16, 3, 3, L);
  p.srect(16, 24, 12, 22, B);
  p.line(16, 30, 5, 22, B[1]); p.line(16, 31, 5, 23, B[2]); p.line(28, 28, 40, 21, B[2]);
  p.line(16, 45, 9, 49, B[2]); p.line(28, 45, 35, 49, B[2]);
  p.rect(18, 30, 3, 3, '#120a0a'); p.rect(24, 30, 3, 3, '#120a0a'); p.set(19, 31, c.eye || '#ffcf3a'); p.set(25, 31, c.eye || '#ffcf3a');
  p.rect(19, 37, 7, 2, '#120a0a');
  if (c.fruit) for (let i = 0; i < 7; i++) p.sell(8 + rnd() * 28, 8 + rnd() * 14, 1.5, 1.5, ramp(c.fruit));
  return p.outline();
};
MON.serpent = (c) => {
  const p = new Px(56, 50), R = ramp(c.body), B = ramp(c.belly || '#f0e0b0');
  for (let i = 0; i < 18; i++) { const t = i / 17; p.sell(40 - t * 22 + Math.sin(t * 6) * 6, 46 - t * 34, 7 - t * 2, 6 - t * 2, R); }
  for (let i = 0; i < 12; i++) { const t = i / 17; p.set(37 - t * 22 + Math.sin(t * 6) * 6, 46 - t * 34, B[1]); }
  p.sell(16, 9, 9, 6, R); p.srect(2, 9, 8, 4, R); p.rect(2, 12, 8, 1, '#3a0a1a');
  p.set(14, 6, c.eye || '#ffe03a'); p.set(15, 6, c.eye || '#ffe03a');
  for (let i = 0; i < 5; i++) p.line(20 + i * 2, 4, 24 + i * 3, 0, ramp(c.fin || '#5ac8e0')[i % 3]);
  return p.outline();
};
MON.lord = (c) => {
  // the final foe: a robed figure with a halo of broken crystal
  const p = new Px(48, 56), R = ramp(c.body), T = ramp(c.trim || '#c8a0ff');
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; p.srect(24 + Math.cos(a) * 18, 14 + Math.sin(a) * 12, 3, 5, ramp(c.halo || '#8ae0ff')); }
  p.srect(14, 20, 20, 34, R); p.rect(12, 52, 24, 2, R[2]);
  p.srect(8, 22, 8, 16, R); p.srect(32, 22, 8, 16, R);
  p.srect(17, 6, 14, 15, R); p.rect(19, 10, 10, 9, '#0a0612'); p.rect(21, 13, 2, 2, c.eye || '#ff3a6a'); p.rect(26, 13, 2, 2, c.eye || '#ff3a6a');
  p.rect(23, 22, 2, 30, T[1]); p.rect(14, 20, 20, 2, T[0]);
  p.sell(24, 36, 4, 4, ramp('#ff3a6a'));
  return p.outline();
};
MON.mech = (c) => {
  const p = new Px(36, 34), R = ramp(c.body);
  p.srect(8, 8, 20, 16, R); p.rect(12, 12, 12, 5, '#1c2a3a'); p.rect(14, 13, 3, 3, c.eye || '#ff4a3a'); p.rect(19, 13, 3, 3, c.eye || '#ff4a3a');
  p.srect(3, 12, 5, 10, R); p.srect(28, 12, 5, 10, R);
  p.srect(0, 21, 7, 3, ramp('#b8c4d4')); p.srect(29, 21, 7, 3, ramp('#b8c4d4'));
  p.srect(10, 24, 5, 8, R); p.srect(21, 24, 5, 8, R); p.rect(9, 31, 7, 2, '#3a3a4a'); p.rect(20, 31, 7, 2, '#3a3a4a');
  p.line(18, 8, 18, 2, '#888'); p.set(18, 1, '#ff4a3a');
  for (let i = 0; i < 4; i++) p.set(10 + i * 5, 21, '#e8c050');
  return p.outline();
};
function scaleUp(p, k) { if (k === 1) return p; const o = new Px(p.w * k, p.h * k); for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) o.d[y * o.w + x] = p.get(x / k | 0, y / k | 0); return o; }
export function registerMonster(kind, f) { MON[kind] = f; }
export function monsterPx(kind, colors) { reseed(kind.length * 977 + (colors.body || '').length * 31 + 7); return MON[kind](colors); }

// ======================================================================
// Tiles: 32x32 textures for the dioramas.
// ======================================================================
function noiseFill(g, w, h, base, amt, n = 600, sz = 2) {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < n; i++) { g.fillStyle = shade(base, (rnd() - 0.5) * amt); g.fillRect(rnd() * w | 0, rnd() * h | 0, sz, sz); }
}
function cv(w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; f(g, w, h); return c; }
const T = {};
T.cobble = (base = '#c8b89a') => cv(32, 32, (g) => {
  g.fillStyle = shade(base, -0.42); g.fillRect(0, 0, 32, 32);
  // irregular flagstones
  const pts = [[0, 0, 13, 10], [14, 0, 18, 7], [0, 11, 8, 11], [9, 11, 12, 9], [22, 8, 10, 12], [0, 23, 15, 9], [16, 21, 10, 11], [27, 21, 5, 11], [9, 20, 6, 3]];
  for (const [x, y, w, h] of pts) {
    const c = shade(base, (rnd() - 0.5) * 0.16);
    g.fillStyle = c; g.fillRect(x + 1, y + 1, w - 2, h - 2);
    g.fillStyle = shade(c, 0.18); g.fillRect(x + 1, y + 1, w - 2, 1); g.fillRect(x + 1, y + 1, 1, h - 2);
    g.fillStyle = shade(c, -0.15); g.fillRect(x + 1, y + h - 2, w - 2, 1); g.fillRect(x + w - 2, y + 1, 1, h - 2);
    for (let i = 0; i < 6; i++) { g.fillStyle = shade(c, (rnd() - 0.5) * 0.2); g.fillRect(x + 2 + rnd() * (w - 4), y + 2 + rnd() * (h - 4), 1, 1); }
  }
});
T.grass = (base = '#5c9a44') => cv(32, 32, (g) => {
  noiseFill(g, 32, 32, base, 0.3, 300, 1);
  for (let i = 0; i < 70; i++) { const x = rnd() * 32 | 0, y = rnd() * 32 | 0; g.fillStyle = shade(base, 0.25 + rnd() * 0.15); g.fillRect(x, y, 1, 2); g.fillStyle = shade(base, -0.25); g.fillRect(x + 1, y + 1, 1, 1); }
  if (rnd() < 2) for (let i = 0; i < 3; i++) { g.fillStyle = ['#f4e46a', '#ffffff', '#f49ab8'][i]; g.fillRect(rnd() * 30 | 0, rnd() * 30 | 0, 1, 1); }
});
T.dirt = (base = '#a8835a') => cv(32, 32, (g) => { noiseFill(g, 32, 32, base, 0.28, 420, 1); for (let i = 0; i < 12; i++) { g.fillStyle = shade(base, -0.3); g.fillRect(rnd() * 31 | 0, rnd() * 31 | 0, 2, 1); g.fillStyle = shade(base, 0.25); g.fillRect(rnd() * 31 | 0, rnd() * 31 | 0, 1, 1); } });
T.sand = (base = '#e2cc94') => cv(32, 32, (g) => noiseFill(g, 32, 32, base, 0.15, 500, 1));
T.wood = (base = '#9a6a3c') => cv(32, 32, (g) => {
  for (let i = 0; i < 4; i++) {
    const c = shade(base, (rnd() - 0.5) * 0.15);
    g.fillStyle = c; g.fillRect(0, i * 8, 32, 8);
    g.fillStyle = shade(c, -0.35); g.fillRect(0, i * 8 + 7, 32, 1);
    g.fillStyle = shade(c, 0.15); g.fillRect(0, i * 8, 32, 1);
    for (let k = 0; k < 6; k++) { g.fillStyle = shade(c, -0.12); g.fillRect(rnd() * 30 | 0, i * 8 + 2 + rnd() * 4 | 0, 4 + rnd() * 6 | 0, 1); }
    const s = (rnd() * 24 | 0) + 4; g.fillStyle = shade(c, -0.35); g.fillRect(s, i * 8, 1, 7);
  }
});
T.brick = (base = '#b8aa94') => cv(32, 32, (g) => {
  g.fillStyle = shade(base, -0.45); g.fillRect(0, 0, 32, 32);
  for (let r = 0; r < 4; r++) for (let k = -1; k < 3; k++) {
    const x = k * 16 + (r % 2) * 8, c = shade(base, (rnd() - 0.5) * 0.18);
    g.fillStyle = c; g.fillRect(x + 1, r * 8 + 1, 14, 6);
    g.fillStyle = shade(c, 0.2); g.fillRect(x + 1, r * 8 + 1, 14, 1);
    g.fillStyle = shade(c, -0.2); g.fillRect(x + 1, r * 8 + 6, 14, 1);
  }
});
T.stonewall = (base = '#9a948a') => cv(32, 32, (g) => {
  g.fillStyle = shade(base, -0.5); g.fillRect(0, 0, 32, 32);
  for (let r = 0; r < 3; r++) { let x = -(rnd() * 8 | 0); while (x < 32) { const w = 7 + rnd() * 9 | 0, c = shade(base, (rnd() - 0.5) * 0.22); g.fillStyle = c; g.fillRect(x + 1, r * 11 + 1, w - 1, 9); g.fillStyle = shade(c, 0.2); g.fillRect(x + 1, r * 11 + 1, w - 1, 1); g.fillStyle = shade(c, -0.25); g.fillRect(x + 1, r * 11 + 9, w - 1, 1); x += w; } }
});
T.plaster = (base = '#e8dcc0', beam = '#5a3a24') => cv(32, 32, (g) => {
  noiseFill(g, 32, 32, base, 0.08, 200, 1);
  g.fillStyle = beam; g.fillRect(0, 0, 2, 32); g.fillRect(30, 0, 2, 32); g.fillRect(0, 30, 32, 2);
  g.fillStyle = shade(beam, 0.2); g.fillRect(0, 0, 1, 32);
});
T.roof = (base = '#3a74b8') => cv(32, 32, (g) => {
  // scalloped shingles like the blue roofs in the port town
  g.fillStyle = shade(base, -0.5); g.fillRect(0, 0, 32, 32);
  for (let r = 0; r < 5; r++) for (let k = -1; k < 5; k++) {
    const x = k * 8 + (r % 2) * 4, y = r * 7 - 2, c = shade(base, (rnd() - 0.5) * 0.18);
    g.fillStyle = c; g.fillRect(x + 1, y, 6, 7); g.fillRect(x + 2, y + 7, 4, 1);
    g.fillStyle = shade(c, 0.35); g.fillRect(x + 2, y + 1, 3, 1); g.fillRect(x + 1, y + 2, 1, 2);
    g.fillStyle = shade(c, -0.28); g.fillRect(x + 6, y + 2, 1, 5); g.fillRect(x + 2, y + 7, 4, 1);
  }
});
T.cave = (base = '#5a5268') => cv(32, 32, (g) => { noiseFill(g, 32, 32, base, 0.3, 500, 2); for (let i = 0; i < 6; i++) { g.fillStyle = shade(base, -0.35); g.fillRect(rnd() * 28 | 0, rnd() * 28 | 0, 4, 1); } });
T.temple = (base = '#b8c4d0') => cv(32, 32, (g) => {
  g.fillStyle = shade(base, -0.35); g.fillRect(0, 0, 32, 32);
  for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const c = shade(base, (rnd() - 0.5) * 0.1); g.fillStyle = c; g.fillRect(i * 16 + 1, j * 16 + 1, 14, 14); g.fillStyle = shade(c, 0.2); g.fillRect(i * 16 + 1, j * 16 + 1, 14, 1); g.fillStyle = shade(c, -0.15); g.fillRect(i * 16 + 1, j * 16 + 14, 14, 1); }
  g.fillStyle = shade(base, 0.25); g.fillRect(15, 15, 2, 2);
});
T.metal = (base = '#6a7480') => cv(32, 32, (g) => {
  noiseFill(g, 32, 32, base, 0.12, 200, 1);
  g.fillStyle = shade(base, -0.4); g.fillRect(0, 15, 32, 1); g.fillRect(15, 0, 1, 32);
  g.fillStyle = shade(base, 0.3); for (const [x, y] of [[3, 3], [27, 3], [3, 27], [27, 27], [19, 19], [11, 11]]) g.fillRect(x, y, 2, 2);
});
T.water = (base = '#3a7ab8') => cv(32, 32, (g) => { noiseFill(g, 32, 32, base, 0.12, 200, 2); for (let i = 0; i < 8; i++) { g.fillStyle = shade(base, 0.4); g.fillRect(rnd() * 28 | 0, rnd() * 30 | 0, 3 + rnd() * 3 | 0, 1); } });
T.snow = (base = '#eef2f8') => cv(32, 32, (g) => noiseFill(g, 32, 32, base, 0.08, 300, 1));
T.cloud = (base = '#f0e8f8') => cv(32, 32, (g) => { noiseFill(g, 32, 32, base, 0.1, 200, 2); });
T.carpet = (base = '#8a2a3a') => cv(32, 32, (g) => { noiseFill(g, 32, 32, base, 0.1, 200, 1); g.fillStyle = '#e8c050'; g.fillRect(0, 2, 32, 1); g.fillRect(0, 29, 32, 1); });
T.crystal = (base = '#6ac8f0') => cv(32, 32, (g) => { noiseFill(g, 32, 32, shade(base, -0.4), 0.2, 300, 2); for (let i = 0; i < 6; i++) { g.fillStyle = shade(base, rnd() * 0.5); g.beginPath(); const x = rnd() * 32, y = rnd() * 32; g.moveTo(x, y); g.lineTo(x + 3, y - 6); g.lineTo(x + 6, y); g.fill(); } });

const tileCache = {};
export function tileTex(kind, base, extra) {
  const k = kind + (base || '') + (extra || '');
  if (!tileCache[k]) { const hd = hdCanvas(kind, base, extra); if (hd) tileCache[k] = hdTexture(hd); else { reseed(k.length * 131 + k.charCodeAt(0) * 7); tileCache[k] = texFrom(T[kind](base, extra), true); } }
  return tileCache[k];
}

// ======================================================================
// Props drawn as sprites (trees, flowers, lamps, signs)
// ======================================================================
const PROP = {};
PROP.tree = (c = {}) => {
  const p = new Px(40, 52), L = ramp(c.leaf || '#4e8a3c'), B = ramp(c.bark || '#6a4a2e');
  p.srect(17, 30, 6, 22, B); p.line(17, 36, 11, 30, B[1]); p.line(23, 34, 29, 28, B[2]);
  const blobs = [[20, 22, 13, 10], [11, 26, 8, 7], [29, 25, 8, 7], [20, 12, 10, 9], [13, 16, 7, 6], [27, 15, 7, 6]];
  for (const [x, y, rx, ry] of blobs) p.sell(x, y, rx, ry, L);
  for (let i = 0; i < 90; i++) { const x = 6 + rnd() * 28, y = 4 + rnd() * 28; if (p.get(x | 0, y | 0)) p.set(x, y, L[rnd() < 0.5 ? 0 : 2]); }
  if (c.fruit) for (let i = 0; i < 8; i++) { const x = 8 + rnd() * 24, y = 8 + rnd() * 22; if (p.get(x | 0, y | 0)) p.set(x, y, c.fruit); }
  return p.outline('#18201a');
};
PROP.pine = (c = {}) => {
  const p = new Px(30, 52), L = ramp(c.leaf || '#2e6a4a');
  p.srect(13, 40, 4, 12, ramp('#5a3a24'));
  for (let i = 0; i < 5; i++) { const y = 6 + i * 7, w = 4 + i * 2.4; for (let j = 0; j < 9; j++) p.line(15 - w * (j / 8), y + j, 15 + w * (j / 8), y + j, j < 2 ? L[0] : j > 6 ? L[2] : L[1]); }
  if (c.snow) for (let i = 0; i < 5; i++) p.line(15 - (3 + i * 2.4), 7 + i * 7, 15 + (3 + i * 2.4) * 0.3, 7 + i * 7, '#f4f8ff');
  return p.outline('#121a16');
};
PROP.palm = () => {
  const p = new Px(36, 52), L = ramp('#5a9a3a'), B = ramp('#a88a5a');
  for (let i = 0; i < 36; i++) p.srect(17 + Math.sin(i / 10) * 2, 16 + i, 3, 1, B);
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; for (let t = 0; t < 14; t++) p.srect(18 + Math.cos(a) * t, 14 + Math.sin(a) * t * 0.5 + t * t * 0.04, 2, 2, L); }
  return p.outline();
};
PROP.bush = (c = {}) => {
  const p = new Px(22, 14), L = ramp(c.leaf || '#4a8a3a');
  p.sell(11, 8, 10, 6, L); p.sell(6, 8, 5, 5, L); p.sell(16, 7, 5, 5, L);
  if (c.flower) for (let i = 0; i < 9; i++) { const x = 3 + rnd() * 16, y = 3 + rnd() * 8; p.set(x, y, c.flower); p.set(x + 1, y, shade(c.flower, -0.2)); }
  return p.outline('#16201a');
};
PROP.flowers = (c = {}) => {
  const p = new Px(16, 10);
  for (let i = 0; i < 12; i++) { const x = 1 + rnd() * 13, y = 2 + rnd() * 6, col = c.color || ['#f46a6a', '#f4e46a', '#ffffff', '#c88af4'][i % 4]; p.set(x, y + 1, '#3a7a2a'); p.set(x, y, col); p.set(x + 1, y, shade(col, -0.2)); }
  return p;
};
PROP.lamp = () => {
  const p = new Px(10, 40), I = ramp('#3a3a48');
  p.srect(4, 10, 2, 28, I); p.rect(2, 37, 6, 3, I[2]);
  p.srect(2, 2, 6, 8, ramp('#2a2a34')); p.rect(3, 4, 4, 5, '#ffe7a0'); p.set(4, 5, '#fff'); p.rect(1, 1, 8, 1, '#1c1c26'); p.set(5, 0, '#1c1c26');
  return p.outline();
};
PROP.sign = () => { const p = new Px(16, 22), W = ramp('#9a6a3c'); p.srect(7, 8, 2, 14, W); p.srect(1, 2, 14, 6, W); p.line(3, 4, 12, 4, '#4a2a1a'); p.line(3, 6, 10, 6, '#4a2a1a'); return p.outline(); };
PROP.crystal = (c = {}) => {
  const p = new Px(16, 30), R = ramp(c.color || '#6ad8ff');
  for (let y = 0; y < 26; y++) { const w = y < 8 ? y * 0.9 : (26 - y) * 0.42; for (let x = -w; x <= w; x++) p.set(8 + x, y + 2, x < -w * 0.3 ? R[0] : x > w * 0.4 ? R[2] : R[1]); }
  p.line(8, 3, 8, 26, shade(c.color || '#6ad8ff', 0.6));
  return p;
};
PROP.rock = (c = {}) => { const p = new Px(18, 12), R = ramp(c.color || '#8a8478'); p.sell(9, 7, 8, 5, R); p.sell(5, 8, 4, 3, R); return p.outline(); };
PROP.reeds = () => { const p = new Px(14, 16); for (let i = 0; i < 9; i++) { const x = 1 + i * 1.4; p.line(x, 15, x + (rnd() - 0.5) * 3, 3 + rnd() * 6, ['#6a9a3a', '#4a7a2a', '#8aba4a'][i % 3]); } return p; };
PROP.cactus = () => { const p = new Px(16, 26), R = ramp('#4a8a4a'); p.srect(6, 4, 4, 22, R); p.srect(1, 10, 3, 6, R); p.srect(2, 15, 4, 2, R); p.srect(12, 8, 3, 6, R); p.srect(10, 13, 3, 2, R); return p.outline(); };
PROP.chest = (c = {}) => {
  const p = new Px(16, 14), W = ramp(c.wood || '#9a5a2a'), G = c.gold || '#e8c050';
  if (c.open) { p.srect(1, 1, 14, 4, ramp('#3a2010')); p.srect(1, 6, 14, 7, W); }
  else { p.srect(1, 2, 14, 5, W); p.srect(1, 7, 14, 6, W); }
  p.rect(1, 6, 14, 1, G); p.rect(7, 5, 2, 3, G); p.rect(1, 2, 1, 11, G); p.rect(14, 2, 1, 11, G);
  return p.outline();
};
PROP.npcMark = (c = {}) => { const p = new Px(8, 10); p.srect(2, 0, 4, 6, ramp(c.color || '#ffe04a')); p.srect(2, 7, 4, 3, ramp(c.color || '#ffe04a')); return p.outline(); };
export function propPx(kind, c = {}) { reseed(kind.length * 311 + JSON.stringify(c).length * 17); const p = PROP[kind](c); p.kind = kind; p.colors = c; return p; }
// the painted high-resolution version of a prop when there is one, else the pixel sprite
export function propCanvas(px) { return (px.kind && hdProp(px.kind, px.colors, px.w, px.h)) || px.canvas(); }
export const PROP_KINDS = Object.keys(PROP);
