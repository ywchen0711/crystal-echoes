// Voxel people and monsters: the same recipes as the pixel sprites, built as real 3D models
// out of small cubes so they have depth, turn smoothly and swing their arms and legs.
import * as THREE from '../lib/three.module.min.js';
import { shade, mix } from './pixel.js?v=18';
const CHAR_LAYER = 2;
const toLayer = (root) => root.traverse((o) => o.layers.set(CHAR_LAYER));

const VS = 1.75 / 46; // world units per voxel (a person is about 46 voxels tall)
const LEG = 17;       // leg length in voxels
const HEAD = 0.8;     // heads are drawn finer and smaller than the body (less chibi)
let DEPTH = 0.6;      // front-to-back thickness (1 = full voxel depth)
export function setDepth(v) { DEPTH = v; }
// pop-up book mode: every figure is a thin card that faces the reader, stands up off the page and flips when it turns
let PAPER = true, PAPER_CAM = null;
const PAPER_D = 0.1, POP_T = 0.42, FLIP_T = 0.2;
export function setPaper(on) { PAPER = !!on; }
export function isPaper() { return PAPER; }
export function setPaperCam(c) { PAPER_CAM = c; }
const _dir = new THREE.Vector3();
function camYaw(mesh) { if (!PAPER_CAM) return 0; PAPER_CAM.getWorldDirection(_dir); return Math.atan2(-_dir.x, -_dir.z) - mesh.rotation.y; }
export const easeBack = (t) => { const c = 1.9; t -= 1; return 1 + t * t * ((c + 1) * t + c); };
const SKINS = { light: '#f3c9a4', tan: '#d9a274', dark: '#9c6a48', pale: '#f6dccb', green: '#9cc79a', blue: '#9db3e0' };

// ---------------------------------------------------------------- voxel grid + mesher
class VGrid {
  constructor() { this.m = new Map(); }
  key(x, y, z) { return (x + 256) + ((y + 256) << 9) + ((z + 256) << 18); }
  set(x, y, z, c) { x = Math.round(x); y = Math.round(y); z = Math.round(z); if (c) this.m.set(this.key(x, y, z), [x, y, z, c]); }
  del(x, y, z) { this.m.delete(this.key(x, y, z)); }
  has(x, y, z) { return this.m.has(this.key(x, y, z)); }
  get(x, y, z) { const v = this.m.get(this.key(x, y, z)); return v ? v[3] : null; }
  // inclusive box; c may be a colour or a function (x, y, z) => colour | null
  box(x0, x1, y0, y1, z0, z1, c) {
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) this.set(x, y, z, typeof c === 'function' ? c(x, y, z) : c);
  }
  // fill every cell in the bounds where test() is true
  fill(x0, x1, y0, y1, z0, z1, test, c) {
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) if (test(x, y, z)) this.set(x, y, z, typeof c === 'function' ? c(x, y, z) : c);
  }
  // highest filled z at (x, y) between z0 and z1, or null
  front(x, y, z0 = -20, z1 = 20) { for (let z = z1; z >= z0; z--) if (this.has(x, y, z)) return z; return null; }
}

// each face: normal, then two axes u, v with u x v = normal (so the quad winds outward)
const FACES = [
  [[1, 0, 0], [0, 1, 0], [0, 0, 1], 0.96], [[-1, 0, 0], [0, 0, 1], [0, 1, 0], 0.96],
  [[0, 1, 0], [0, 0, 1], [1, 0, 0], 1.05], [[0, -1, 0], [1, 0, 0], [0, 0, 1], 0.82],
  [[0, 0, 1], [1, 0, 0], [0, 1, 0], 1.0], [[0, 0, -1], [0, 1, 0], [1, 0, 0], 0.92],
];
const colCache = new Map();
function lin(hex) { let c = colCache.get(hex); if (!c) { c = new THREE.Color(hex); colCache.set(hex, c); } return c; }
function meshGrid(g, noise = 0.035, ao = null) {
  const pos = [], nor = [], col = [], idx = [];
  for (const [x, y, z, hex] of g.m.values()) {
    const c = lin(hex);
    const h = ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;
    const n = (1 + ((h % 9) - 4) / 4 * noise) * (ao ? ao[2] + (1 - ao[2]) * Math.max(0, Math.min(1, (y - ao[0]) / (ao[1] - ao[0]))) : 1);
    for (const [N, U, V, k] of FACES) {
      if (g.has(x + N[0], y + N[1], z + N[2])) continue;
      const b = pos.length / 3, f = n * k;
      for (const [su, sv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        pos.push(x + (N[0] + U[0] * su + V[0] * sv) * 0.5, y + (N[1] + U[1] * su + V[1] * sv) * 0.5, z + (N[2] + U[2] * su + V[2] * sv) * 0.5);
        nor.push(N[0], N[1], N[2]);
        col.push(c.r * f, c.g * f, c.b * f);
      }
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeBoundingSphere();
  return geo;
}

// lit material whose glow takes each cube's own colour (so a flash brightens instead of turning grey)
export function voxelMaterial(glow = 0.2) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0, emissive: new THREE.Color(glow, glow, glow) });
  m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance *= vColor.rgb;\n\t{ float fr = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition))), 2.5); totalEmissiveRadiance += vec3(0.42, 0.52, 0.78) * fr * 0.22 * (0.5 + vColor.g); }'); };
  return m;
}

// ---------------------------------------------------------------- people
const sq4 = (v) => v * v * v * v;
// rounded box test centred on (cx, cy, cz)
const rbox = (x, y, z, cx, cy, cz, rx, ry, rz) => sq4((x - cx) / rx) + sq4((y - cy) / ry) + sq4((z - cz) / rz) <= 1;

function partsFor(s) {
  const skin = SKINS[s.skin] || s.skin || SKINS.light;
  const T = s.top || '#3d5a9a', T2 = s.top2 || shade(T, -0.2), L = s.legs || '#3a3048', B = s.boots || '#5a3a2a';
  const H = s.hair || '#6a4a2a', eye = s.eyes || '#2a2238', belt = s.belt || '#6a4628', gold = '#e8c050';
  const P = {};

  // legs: pivot at the hip, the boot sole sits on the ground
  const leg = new VGrid();
  leg.fill(-2, 2, -LEG, -1, -2, 2, (x, y, z) => !(Math.abs(x) === 2 && Math.abs(z) === 2), (x, y, z) => y >= -LEG + 6 ? (y === -1 ? shade(L, -0.15) : y === -LEG + 9 && z === 2 ? shade(L, 0.12) : L) : null);
  leg.fill(-2, 2, -LEG, -LEG + 6, -2, 3, (x, y, z) => !(Math.abs(x) === 2 && (z === 3 || z === -2)) && !(y >= -LEG + 4 && z === 3), (x, y) => y === -LEG ? shade(B, -0.35) : y === -LEG + 6 ? shade(B, 0.18) : y === -LEG + 5 && s.top2 ? shade(B, -0.12) : B);
  if (s.knee) leg.box(-2, 2, -LEG + 8, -LEG + 10, 3, 3, (x, y) => y === -LEG + 10 ? shade(s.knee, 0.2) : s.knee);
  if (s.sabaton) leg.box(-2, 2, -LEG + 1, -LEG + 3, 4, 4, (x, y) => y === -LEG + 3 ? shade(s.sabaton, 0.2) : s.sabaton);
  P.leg = leg;

  // torso: hips to shoulders (local y 0..13)
  const tor = new VGrid();
  tor.fill(-6, 6, 0, 13, -3, 3, (x, y, z) => {
    if (Math.abs(x) === 6 && Math.abs(z) === 3) return false;
    if (y <= 5 && Math.abs(x) === 6) return false;
    if (y === 13 && Math.abs(x) >= 5 && Math.abs(z) === 3) return false;
    return true;
  }, (x, y, z) => {
    if (y === 2 || y === 3) return z === 3 && Math.abs(x) <= 1 ? gold : belt;
    if (s.collar && y >= 12 && (Math.abs(z) === 3 || Math.abs(x) >= 5)) return s.collar;
    if (z === 3 && Math.abs(x) <= 1 && y >= 4) return x === 0 && y % 3 === 0 ? shade(T2, 0.25) : T2;
    if (z === 3 && Math.abs(x) === 2 && y >= 4) return shade(T, -0.12);
    return y <= 1 ? shade(T, -0.1) : T;
  });
  if (!s.robe) {
    tor.fill(-7, 7, -4, 1, -4, 4, (x, y, z) => (Math.abs(z) === 4 && Math.abs(x) <= 5) || (Math.abs(x) === 6 && Math.abs(z) <= 3) ? !(z === 4 && x === 0 && y < 0) : false, (x, y, z) => y === -4 ? (s.top2 ? T2 : shade(T, -0.32)) : y >= 0 ? shade(T, -0.18) : shade(T, -0.06));
    tor.box(6, 7, 0, 2, 1, 2, '#6a4a2a'); tor.set(7, 2, 1, '#e8c050');
  }
  if (s.top2) tor.fill(-6, 6, 12, 13, -3, 3, (x, y, z) => (Math.abs(x) >= 5 || Math.abs(z) === 3) && tor.has(x, y, z), s.trim || shade(T2, 0.05));
  if (s.emblem) { tor.box(-1, 1, 8, 10, 3, 3, s.emblem); tor.set(0, 9, 4, shade(s.emblem, 0.35)); }
  if (s.buckle) tor.box(-1, 1, 2, 3, 3, 3, s.buckle);
  if (s.robe) {
    for (let y = -15; y <= 1; y++) {
      const t = (1 - y) / 16, hx = 6.6 + t * 2.4, hz = 3.8 + t * 2;
      tor.fill(-9, 9, y, y, -6, 6, (x, _, z) => sq4(x / hx) + sq4(z / hz) <= 1, (x, _, z) => {
        if (y <= -14) return shade(T, -0.3);
        if (y === -13 && s.top2) return T2;
        if (z > 0 && Math.abs(x) <= 1 && s.top2) return T2;
        return y % 4 === 0 && Math.abs(x) % 4 === 1 ? shade(T, -0.1) : T;
      });
    }
  }
  if (s.plate >= 2) { tor.box(-4, 4, 6, 11, 4, 4, (x, y) => s.plate >= 4 && (Math.abs(x) === 4 || y === 11) ? gold : y === 6 ? shade(T, -0.2) : shade(T, 0.15)); if (s.plate >= 6) tor.box(-1, 1, 8, 9, 5, 5, '#d84a4a'); }
  if (s.straps) for (let y = 4; y <= 12; y++) { const x = Math.round((y - 8) * 0.75); tor.set(x, y, 4, s.straps); tor.set(x + 1, y, 4, s.straps); }
  if (s.sash) tor.box(-1, 1, -9, 1, 4, 4, (x, y) => y <= -8 ? (s.trim || gold) : y % 3 === 0 ? shade(s.sash, -0.15) : s.sash);
  P.torso = tor;

  // arms: pivot at the shoulder; the hand is at local y -10
  const arm = new VGrid();
  arm.fill(-1, 1, -11, 0, -1, 1, (x, y, z) => !(y === 0 && Math.abs(x) === 1 && Math.abs(z) === 1) && !(y === -11 && Math.abs(x) === 1 && Math.abs(z) === 1), (x, y) => y <= -9 ? (s.gloves ? (y === -9 ? shade(s.gloves, 0.15) : s.gloves) : skin) : y === -8 ? (s.cuff || (s.gloves ? shade(s.gloves, -0.2) : shade(T, -0.25))) : y >= -1 ? shade(T, 0.08) : T);
  if (s.pauldron) arm.fill(-2, 2, -3, 1, -2, 2, (x, y, z) => !(y === 1 && (Math.abs(x) === 2 || Math.abs(z) === 2)), (x, y) => y === -3 ? shade(s.pauldron, -0.3) : y === 1 ? shade(s.pauldron, 0.25) : s.pauldron);
  if (s.pauldron && s.pauldronSpike) for (const [x, z] of [[0, 0], [-1, 1], [1, -1]]) { arm.set(x, 2, z, shade(s.pauldron, 0.3)); if (x === 0) arm.set(x, 3, z, '#f4f0e0'); }
  P.arm = arm;

  // head: local y 0..14, face toward +z
  const hd = new VGrid();
  const R = 7.6, cy = 7;
  hd.fill(-8, 8, 0, 14, -8, 8, (x, y, z) => rbox(x, y, z, 0, cy, 0, R, R, R), skin);
  const fz = (x, y) => hd.front(x, y);
  const paint = (x, y, c, dz = 0) => { const z = fz(x, y); if (z !== null) hd.set(x, y, z + dz, c); };
  for (const sx of [-1, 1]) {
    const x0 = sx < 0 ? -4 : 3;
    for (let i = 0; i < 2; i++) { const x = x0 + i; paint(x, 6, '#1e1830'); paint(x, 5, eye); paint(x, 4, shade(eye, -0.25)); }
    paint(sx < 0 ? -3 : 4, 5, '#ffffff');
    paint(sx < 0 ? -5 : 5, 5, '#f4f0ea'); paint(sx < 0 ? -5 : 5, 4, '#e8e0d8');
    paint(x0, 8, shade(H, -0.3)); paint(x0 + 1, 8, shade(H, -0.3)); paint(sx < 0 ? x0 - 1 : x0 + 2, 7, shade(H, -0.3));
    paint(sx * 5, 3, mix(skin, '#ff7a7a', 0.35));
    hd.box(sx * 8, sx * 8, 3, 6, -1, 0, shade(skin, -0.08));
  }
  paint(0, 2, mix(skin, '#9a3a3a', 0.5)); paint(-1, 2, mix(skin, '#9a3a3a', 0.25)); paint(1, 2, mix(skin, '#9a3a3a', 0.25));
  paint(0, 4, shade(skin, -0.06), 1);
  if (s.beard) {
    const Bd = s.beard;
    for (let x = -5; x <= 5; x++) for (let y = -1; y <= 3; y++) {
      if (y === 3 && Math.abs(x) > 3) continue;
      if (y === 2 && x === 0) continue;
      const z = fz(x, Math.max(0, y)); if (z === null) continue;
      hd.set(x, y, z + (y >= 2 ? 0 : 1), Bd); if (y < 2) hd.set(x, y, z, Bd);
    }
    paint(0, 2, mix(skin, '#9a3a3a', 0.5));
  }

  // hair shell
  const style = s.hairStyle || 'short';
  const HL = shade(H, 0.28), HD = shade(H, -0.22);
  if (style !== 'bald') {
    const sideMin = style === 'bob' || style === 'long' || style === 'braid' ? 1 : 4;
    const backMin = style === 'bob' ? 0 : style === 'long' || style === 'braid' ? -1 : 2;
    const bang = (x) => style === 'spiky' ? (Math.abs(x) % 3 === 1 ? 7 : 9) : ([0, 1, 1, 0, 1, 0, 0, 1][((x % 8) + 8) % 8] ? 9 : 10);
    hd.fill(-10, 10, -2, 17, -10, 10, (x, y, z) => {
      if (rbox(x, y, z, 0, cy, 0, R, R, R)) return false;
      if (!rbox(x, y, z, 0, cy + 0.3, -0.3, R + 1.25, R + 1.25, R + 1.25)) return false;
      if (z >= 4) return y >= bang(x);
      if (Math.abs(x) >= 6 && z <= 3 && y >= sideMin) return true;
      if (z <= -1 && y >= backMin) return true;
      return y >= 8;
    }, (x, y, z) => y === 12 && z >= 2 && Math.abs(x) <= 5 ? HL : y <= sideMin + 1 ? HD : H);
    if (style === 'spiky') {
      for (const [bx, bz, hgt, lean] of [[-4, 3, 3, -0.3], [1, 4, 4, 0.1], [5, 2, 3, 0.4], [-2, -2, 3, -0.2], [3, -3, 3, 0.2], [-6, -1, 2, -0.6], [7, -1, 2, 0.6]]) {
        for (let i = 0; i <= hgt; i++) {
          const r = 2.2 * (1 - i / (hgt + 1)), cx = bx + lean * i, cz = bz - i * 1.1, yy = 13 + i;
          hd.fill(Math.floor(cx - 2), Math.ceil(cx + 2), yy, yy, Math.floor(cz - 2), Math.ceil(cz + 2), (x, _, z) => (x - cx) ** 2 + (z - cz) ** 2 <= r * r + 0.3, i > hgt - 2 ? HL : H);
        }
      }
    }
    if (style === 'long') {
      hd.fill(-8, 8, -12, 3, -10, -6, (x, y, z) => Math.abs(x) <= 8 - (3 - y) * 0.12 && z <= -6 - (y < -6 ? 0 : 0) && !(Math.abs(x) >= 7 && z === -10), (x, y) => y <= -11 ? HD : (x + 20) % 4 === 0 ? HD : H);
      for (const sx of [-1, 1]) hd.box(sx * 8, sx * 9, -4, 5, 1, 4, (x, y) => y === -4 ? HD : H);
    }
    if (style === 'ponytail') {
      hd.box(-1, 1, 9, 11, -9, -9, '#c84a4a');
      for (let y = 9; y >= -8; y--) { const cz = -11 - (9 - y) * 0.12, r = y > 6 ? 2.6 : 2 - (6 - y) * 0.05; hd.fill(-3, 3, y, y, Math.floor(cz - 3), Math.ceil(cz + 3), (x, _, z) => x * x + (z - cz) ** 2 <= r * r + 0.4, y % 3 === 0 ? HD : H); }
    }
    if (style === 'braid') {
      for (let y = 6; y >= -13; y--) { const cz = -9 - (6 - y) * 0.08, r = (y % 3 === 0) ? 1.4 : 2.1; hd.fill(-3, 3, y, y, Math.floor(cz - 3), Math.ceil(cz + 3), (x, _, z) => x * x + (z - cz) ** 2 <= r * r + 0.4, (y % 3 === 0) ? HD : H); }
      hd.box(-1, 1, -14, -14, -11, -9, '#6ac8f0');
    }
  } else if (s.hair) {
    hd.fill(-10, 10, 3, 7, -10, 10, (x, y, z) => !rbox(x, y, z, 0, cy, 0, R, R, R) && rbox(x, y, z, 0, cy, -0.3, R + 1.2, R + 1.2, R + 1.2) && z <= 1, H);
  }

  // hats
  if (s.hat) {
    const C = s.hatColor || '#4a3a8a', CL = shade(C, 0.22), CD = shade(C, -0.28), band = s.hatBand;
    if (s.hat === 'wizard') {
      hd.fill(-13, 13, 13, 14, -13, 13, (x, y, z) => x * x + z * z <= (y === 13 ? 158 : 110) && (y === 14 || x * x + z * z > 30), (x, y) => y === 13 ? CD : C);
      for (let y = 15; y <= 28; y++) {
        const t = (y - 15) / 13, r = 8.6 * (1 - t) + 0.6, cz = -t * t * 6, cx = 0;
        hd.fill(-10, 10, y, y, -16, 10, (x, _, z) => (x - cx) ** 2 + (z - cz) ** 2 <= r * r, (x) => y <= 16 && band ? band : x < -2 ? CL : C);
      }
    } else {
      // hats replace the hair shell where they cover it
      const shell = (y0, y1, region, out, col) => hd.fill(-12, 12, y0, y1, -12, 12, (x, y, z) => !rbox(x, y, z, 0, cy, 0, R, R, R) && rbox(x, y, z, 0, cy + 0.3, -0.2, R + out, R + out, R + out) && region(x, y, z), col);
      if (s.hat === 'hood') {
        shell(-2, 18, (x, y, z) => !(z >= 2 && y <= 11 && Math.abs(x) <= 6), 2.4, (x, y, z) => z >= 3 && (y === 12 || Math.abs(x) === 7) ? CD : y >= 14 ? CL : C);
      } else if (s.hat === 'helm' || s.hat === 'horned' || s.hat === 'crown') {
        shell(3, 18, (x, y, z) => y >= 9 || (z <= -2 && y >= 3) || (Math.abs(x) >= 7 && y >= 5), 2.2, (x, y, z) => y === 9 && z > -2 ? CD : y >= 15 ? CL : C);
        if (band && s.hat === 'helm') { hd.box(0, 0, 17, 20, -6, 5, (x, y, z) => y === 17 || y - 17 >= Math.abs(z + 0.5) * 0.4 ? band : null); hd.box(-1, 1, 17, 18, -6, 6, band); }
        if (s.hat === 'horned') for (const sx of [-1, 1]) for (let i = 0; i < 9; i++) { const x = sx * (9 + Math.round(i * 0.45)), y = 12 + Math.round(i * 0.8 + (i > 5 ? (i - 5) * 0.6 : 0)), z = -Math.round(i * 0.2); hd.box(x, x + sx, y, y + 1, z - 1, z, i > 6 ? '#fff4dc' : '#e8dcc0'); }
        if (s.hat === 'crown') { const G = band || '#e8c050'; hd.fill(-10, 10, 17, 18, -10, 10, (x, y, z) => { const r = Math.hypot(x, z); return r >= 6.5 && r <= 8.2; }, G); for (let a = 0; a < 8; a++) { const x = Math.round(Math.cos(a / 8 * Math.PI * 2) * 7.3), z = Math.round(Math.sin(a / 8 * Math.PI * 2) * 7.3); hd.box(x, x, 19, 21, z, z, G); } hd.box(0, 0, 18, 18, 8, 8, '#d83a5a'); }
      } else if (s.hat === 'cap' || s.hat === 'feather') {
        shell(10, 18, () => true, 2.0, (x, y) => y >= 15 ? CL : C);
        hd.fill(-6, 6, 10, 10, 7, 11, (x, y, z) => x * x / 40 + (z - 7) ** 2 / 18 <= 1, CD);
        hd.box(0, 0, 17, 17, -1, 0, CD);
        if (s.hat === 'feather') for (let i = 0; i < 10; i++) hd.box(8 + Math.round(i * 0.3), 8 + Math.round(i * 0.3), 13 + i, 13 + i, -2 - Math.round(i * 0.6), -1 - Math.round(i * 0.6), i > 7 ? '#ffffff' : (band || '#d83a3a'));
      } else if (s.hat === 'circlet') {
        shell(10, 11, () => true, 1.6, (x, y, z) => z > 5 && Math.abs(x) <= 1 ? (band || '#6ac8f0') : C);
      } else if (s.hat === 'band') {
        shell(9, 10, () => true, 2.0, (x, y) => y === 10 ? CL : C);
        hd.box(-1, 1, 7, 10, -11, -10, C); hd.box(1, 2, 3, 6, -12, -11, CD);
      }
    }
  }
  P.head = hd;

  // cape: hangs from the shoulders behind the back
  if (s.cape) {
    const C = s.cape, cp = new VGrid();
    for (let y = -25; y <= 0; y++) { const hw = 6 + Math.round((-y) / 9); cp.box(-hw, hw, y, y, -1, 0, (x, _, z) => y <= -24 ? (s.capeTrim || shade(C, -0.3)) : z === 0 ? shade(C, -0.25) : Math.abs(x) === hw ? shade(C, -0.12) : C); }
    cp.box(-7, 7, 0, 1, -1, 2, (x, y) => y === 1 ? shade(C, 0.2) : C);
    cp.box(-1, 1, 0, 1, 3, 3, gold);
    P.cape = cp;
  }

  // weapon in the right hand (hand-local coordinates)
  const wp = s.weapon && tintWeapon(weaponGrid(s.weapon, s.weaponTier, s.weaponRefine), s.weaponMetal, s.weaponAccent);
  if (wp) P.weapon = wp;
  if (s.weaponL) { const wl = tintWeapon(weaponGrid(s.weaponL, s.weaponLTier, s.weaponLRefine), s.weaponLMetal, s.weaponLAccent); if (wl) P.weaponL = wl; }
  if (s.shield) {
    // shield-local: x is the thickness (2 = front face), y up and down, z across; held on the forearm
    const sh = new VGrid(), S = s.shieldColor || '#5a7ac8', rim = s.shieldRim || gold, kind = s.shieldKind || 'kite', st = s.shieldTier || 0;
    const shape = kind === 'buckler' ? (y, z) => ((y + 3) ** 2 + z * z) / 22
      : kind === 'tower' ? (y, z) => Math.max(Math.abs(y + 4) / 9.5, Math.abs(z) / 6.2) ** 6
      : kind === 'aegis' ? (y, z) => ((y + 3.5) ** 2 / 52 + z * z / 52) * (1 - 0.08 * Math.cos(Math.atan2(z, y + 3.5) * 6))
      : (y, z) => (y + 3.5) ** 2 / 64 + (z * z) / (40 * Math.max(0.15, Math.min(1, (y + 12) / 10)));
    sh.fill(2, 3, -14, 6, -8, 8, (x, y, z) => { const v = shape(y, z); return v <= 1 && (x === 2 || v <= 0.62); }, (x, y, z) => {
      const v = shape(y, z);
      if (v > (kind === 'tower' ? 0.72 : 0.7)) return rim;
      if (kind === 'tower' && st >= 2 && Math.abs(z) <= 1) return shade(S, -0.18);
      if (kind === 'kite' && st >= 3 && (y === -3 || z === 0)) return shade(S, -0.15);
      return x === 3 ? shade(S, 0.12) : S;
    });
    if (kind === 'buckler') { sh.box(4, 4, -4, -2, -1, 1, rim); sh.set(5, -3, 0, s.shieldEmblem || rim); } // a boss in the middle
    else if (kind === 'aegis') { sh.box(4, 4, -5, -2, -1, 1, '#8ae0ff'); sh.box(4, 4, -4, -3, -2, 2, '#8ae0ff'); sh.set(5, -4, 0, '#ffffff'); }
    else { sh.box(4, 4, -4, -3, -1, 0, s.shieldEmblem || gold); if (s.shieldEmblem) sh.box(3, 3, -6, -1, -1, 0, shade(s.shieldEmblem, -0.1)); }
    if (st >= 4 && kind !== 'buckler') for (const [y, z] of [[1, -4], [1, 4], [-8, -3], [-8, 3]]) if (sh.has(3, y, z) || sh.has(2, y, z)) sh.set(4, y, z, rim); // studs
    if (st >= 6) { sh.set(4, -3, kind === 'aegis' ? 3 : 0, '#d84a4a'); if (kind === 'tower' || kind === 'kite') for (let y = -10; y <= 2; y += 4) sh.set(4, y, 0, rim); }
    P.shield = sh;
  }
  return P;
}

function tintWeapon(g, metal, accent) {
  if (!g || (!metal && !accent)) return g;
  const map = {};
  if (metal) { map['#cdd5e0'] = metal; map['#7d8aa0'] = shade(metal, -0.35); map['#dfe6f0'] = shade(metal, 0.1); }
  if (accent) for (const c of ['#e6ebf2', '#ffffff', '#f4f6fa', '#ff9a4a', '#8ae0ff', '#d84a4a']) map[c] = c === '#ffffff' || c === '#f4f6fa' ? shade(accent, 0.45) : accent;
  for (const v of g.m.values()) if (map[v[3]]) v[3] = map[v[3]];
  return g;
}
export function weaponMesh(kind, metal, accent, tier = 0, refine = 0) { const g = tintWeapon(weaponGrid(kind, tier, refine), metal, accent); if (!g) return null; const m = new THREE.Mesh(meshGrid(g, 0.01), voxelMaterial(0.12)); return m; }
// Every weapon type has its own shape at each of the eight tiers (bronze to star-forged), so a new
// weapon always looks new in the hand. Hand-local coordinates: x is the thin axis, y the width,
// +z runs from the grip toward the business end. Steel tones are re-tinted to the tier's metal,
// and the white edge, red gem and blue crystal take the item's accent colour.
function weaponGrid(kind, tier = 0, refine = 0) {
  const g = new VGrid(), t = Math.max(0, Math.min(7, tier | 0));
  const steel = '#cdd5e0', steelD = '#7d8aa0', steelL = '#dfe6f0', edge = '#e6ebf2', gem = '#d84a4a', cry = '#8ae0ff', white = '#ffffff';
  const wood = '#8a5a2a', woodL = '#b88848', woodD = '#5a3a1e', gold = '#e8c050', goldD = '#b8902a', lea = '#5a3a2a', leaD = '#3a2418';
  const S = (x, y, z, c) => g.set(x, y, z, c);
  const grip = (len, a = lea, b = leaD) => { for (let z = -len; z <= 0; z++) S(0, 0, z, z % 2 ? a : b); };
  const pommel = (z, gemmed) => { S(0, 0, z, gold); if (gemmed) { S(0, 0, z - 1, gem); S(1, 0, z, gem); S(-1, 0, z, gem); } };
  const guard = (style, w, z = 1, gemmed = false) => {
    g.box(0, 0, -w, w, z, z, gold);
    if (style === 'cup') { S(0, -w, z + 1, gold); S(0, w, z + 1, gold); }
    if (style === 'droop') { S(0, -w, z - 1, gold); S(0, w, z - 1, gold); }
    if (style === 'cross') g.box(-1, 1, -1, 1, z, z, gold);
    if (style === 'wing') for (let i = 1; i <= 2; i++) { S(0, -w - i, z + i, gold); S(0, w + i, z + i, gold); S(0, -w - i + 1, z + i, goldD); S(0, w + i - 1, z + i, goldD); }
    if (style === 'star') { g.box(0, 0, -1, 1, z - 1, z + 1, gold); for (const s of [-1, 1]) { S(0, s * (w + 1), z + 1, white); S(0, s * (w + 1), z - 1, white); } }
    if (gemmed) { S(1, 0, z, gem); S(-1, 0, z, gem); }
  };
  // a blade from z0, len long; half(r) gives [low, high] y at the fraction r along it
  const blade = (z0, len, half, o = {}) => {
    for (let i = 0; i < len; i++) {
      const r = len > 1 ? i / (len - 1) : 0, z = z0 + i, [lo, hi] = half(r), off = o.wave ? Math.round(Math.sin(r * Math.PI * o.wave) * 0.9) : 0;
      for (let y = lo; y <= hi; y++) {
        let c = o.cry ? (y === hi ? white : (y + z) % 3 ? cry : white) : y === hi ? edge : y === lo && hi - lo >= 2 ? steelD : steel;
        if (o.fuller && y === Math.round((lo + hi) / 2) && r > 0.05 && r < 0.75 && hi - lo >= 2) c = o.cry ? white : steelD;
        if (o.runes && y === Math.round((lo + hi) / 2) && i % 3 === 1 && r < 0.8) c = gold;
        S(0, y + off, z, c);
      }
      if (o.thick && hi - lo >= 2) for (let y = lo + 1; y < hi; y++) { S(1, y + off, z, o.cry ? cry : steelD); S(-1, y + off, z, o.cry ? cry : steelD); }
    }
  };
  const taper = (w, at = 0.82) => (r) => r < at ? [-w, w] : r < 0.94 ? [-Math.max(0, w - 1), Math.max(0, w - 1)] : [0, 0];
  const orb = (cy, rad, col, hi = white) => g.fill(-3, 3, Math.floor(cy - rad - 1), Math.ceil(cy + rad + 1), -4, 4, (x, y, z) => x * x + (y - cy) ** 2 + z * z <= rad * rad + 0.5, (x, y, z) => (z < -rad * 0.3 && y > cy) ? hi : col);

  if (kind === 'sword') {
    const len = [11, 13, 14, 15, 16, 17, 18, 20][t], gs = ['bar', 'bar', 'cup', 'cross', 'wing', 'droop', 'wing', 'star'][t], gw = [2, 2, 2, 3, 3, 3, 4, 3][t];
    grip([3, 4, 4, 4, 4, 5, 5, 5][t]); pommel(-[3, 4, 4, 4, 4, 5, 5, 5][t] - 1, t >= 3); guard(gs, gw, 1, t >= 6);
    const half = t === 0 ? (r) => r < 0.9 ? [0, 1] : [0, 0]
      : t === 4 ? (r) => { const w = r < 0.6 ? 1 + Math.round(r * 1.7) : r < 0.9 ? 2 - Math.round((r - 0.6) * 5) : 0; return [-w, w]; }
      : t === 7 ? (r) => { const w = Math.round(2.4 * Math.sin(Math.PI * Math.min(1, r * 1.05))); return [-w, w]; }
      : t === 6 ? taper(2) : taper(1);
    blade(2, len, half, { fuller: t === 2 || t === 3 || t === 5, wave: t === 5 ? 6 : 0, runes: t === 6, cry: t === 7, thick: t >= 6 });
  } else if (kind === 'greatsword') {
    const len = [18, 20, 21, 22, 23, 24, 26, 28][t], gw = [3, 3, 4, 4, 4, 5, 5, 5][t];
    grip([6, 6, 6, 7, 7, 7, 7, 7][t], t >= 5 ? '#6a2a2a' : lea); pommel(-[6, 6, 6, 7, 7, 7, 7, 7][t] - 1, t >= 4);
    guard(t >= 6 ? 'wing' : t >= 3 ? 'cup' : 'bar', gw, 1, t >= 6); if (t >= 2) g.box(-1, 1, -1, 1, 1, 1, gold);
    const ric = t >= 2 ? 3 : 0;
    if (ric) g.box(0, 0, -1, 1, 2, 1 + ric, steelD);
    blade(2 + ric, len - ric, t === 7 ? (r) => { const w = r < 0.85 ? 3 : r < 0.95 ? 2 : 0; return [-w, w]; } : taper(t >= 4 ? 3 : 2, 0.86), { fuller: t >= 1 && t < 7, runes: t === 6, cry: t === 7, thick: true });
    if (t >= 4 && t < 7) for (let z = 4 + ric; z < len - 4; z += 3) S(0, -(t >= 4 ? 4 : 3), z, steelD); // serrated back
    if (t === 5) for (let z = 6; z < len - 2; z += 4) S(0, 4, z, gem);
  } else if (kind === 'dagger') {
    const len = [6, 7, 8, 8, 9, 9, 10, 11][t];
    grip(3, t >= 4 ? '#2a2a3a' : '#3a2a20', t >= 4 ? gold : leaD); pommel(-4, t >= 5);
    guard(t >= 5 ? 'droop' : t >= 2 ? 'cup' : 'bar', t >= 3 ? 2 : 1, 1, t >= 6);
    if (t === 4) { blade(2, len, (r) => r < 0.9 ? [-2, -1] : [-1, -1]); blade(2, len - 1, (r) => r < 0.9 ? [1, 2] : [1, 1]); } // twin-pronged
    else blade(2, len, t === 7 ? (r) => { const w = Math.round(1.6 * Math.sin(Math.PI * Math.min(1, r * 1.1))); return [-w, w]; } : t >= 5 ? taper(1, 0.7) : (r) => r < 0.85 ? [-1, 0] : [0, 0], { wave: t === 2 || t === 6 ? 4 : 0, cry: t === 7 });
  } else if (kind === 'katana') {
    const len = [16, 17, 18, 19, 20, 21, 22, 24][t];
    const wrap = [['#e8e4d8', '#2a2a3a'], ['#2a2a3a', '#5a3a2a'], ['#c83a3a', '#2a2a3a'], ['#e8e4d8', '#3a4a8a'], ['#2a2a3a', gold], ['#6a2a8a', '#e8e4d8'], ['#e8e4d8', gold], ['#2a2a3a', cry]][t];
    for (let z = -7; z <= 0; z++) S(0, 0, z, z % 2 ? wrap[0] : wrap[1]); S(0, 0, -8, gold);
    const ts = t >= 6 ? 2 : t >= 2 ? 1 : 1; g.fill(-ts, ts, -ts - (t >= 4 ? 1 : 0), ts + (t >= 4 ? 1 : 0), 1, 1, (x, y) => t >= 4 ? x * x + y * y <= ts * ts + 2 : true, t >= 3 ? gold : '#3a3a44');
    S(0, 0, 2, gold);
    for (let z = 3; z < 3 + len; z++) { const r = (z - 3) / len, off = Math.round(r * r * (t >= 5 ? 3 : 2)); S(0, off, z, t === 7 ? white : '#f4f6fa'); S(0, off - 1, z, t === 7 ? cry : t >= 4 && z % 2 ? steelL : steelD); if (t >= 3 && r < 0.9) S(0, off - 2, z, t === 7 ? cry : steelD); }
    if (t >= 6) { S(0, -1, -8, gem); S(0, -2, -9, gem); S(0, -2, -10, gem); } // a tassel on the pommel
  } else if (kind === 'spear') {
    const top = [22, 24, 24, 25, 26, 26, 27, 28][t];
    g.box(0, 0, -12, top, 0, 0, (x, y, z) => t >= 5 && z % 6 === 0 ? gold : z % 6 === 0 ? woodL : t >= 3 ? woodD : wood);
    g.box(-1, 1, top, top + 1, -1, 1, gold);
    const h0 = top + 2, P = (w, h, c) => S(0, h, w, c);
    const head = [[5, 1], [7, 2], [7, 2], [10, 1], [8, 2], [7, 1], [9, 2], [10, 2]][t];
    for (let i = 0; i < head[0]; i++) { const r = i / (head[0] - 1), w = r < 0.5 ? Math.min(head[1], Math.round(r * 2 * head[1] + 0.4)) : Math.max(0, Math.round((1 - r) * 2 * head[1])); for (let k = -w; k <= w; k++) P(k, h0 + i, t === 7 ? ((i + k) % 3 ? cry : white) : Math.abs(k) === w ? edge : k === 0 && w > 1 ? steelD : steel); }
    if (t === 2 || t === 6) for (const s2 of [-1, 1]) { P(s2 * 2, h0, steel); P(s2 * 3, h0 - 1, steel); } // winged lugs
    if (t === 4) for (let h = h0 - 1; h <= h0 + 4; h++) { const ext = Math.round(4 - Math.abs(h - h0 - 1.5) * 0.6); for (let w = 2; w <= ext; w++) P(w, h, w === ext ? edge : steel); } // halberd blade
    if (t === 5) for (const s2 of [-2, 2]) for (let h = h0; h <= h0 + 5; h++) P(s2, h, h === h0 + 5 ? edge : steel); // trident prongs
    if (t >= 3) for (let h = top - 3; h <= top - 1; h++) P(1, h, gem); // a red tassel
  } else if (kind === 'axe') {
    const top = [12, 13, 14, 15, 15, 16, 17, 17][t];
    g.box(0, 0, 0, 0, -3, top, (x, y, z) => z % 4 === 0 ? (t >= 5 ? gold : woodL) : t >= 4 ? woodD : wood);
    const bit = (dir, h, reach, beard) => g.fill(0, 0, dir < 0 ? -reach - 1 : 1, dir < 0 ? -1 : reach + 1, top - h - beard, top + 1, (x, y, z) => { const d = Math.abs(y); const lo = top - h + (d - 1) * -beard / reach; return d <= reach && z >= Math.min(top - h, lo) && z <= top + 1 - (d > reach - 1 ? 0 : 0) && z >= top - h - (d / reach) * beard; },
      (x, y, z) => Math.abs(y) === reach ? (t === 7 ? white : edge) : t === 7 ? cry : Math.abs(y) === 1 ? steelD : steel);
    const [h, reach, beard] = [[3, 3, 0], [4, 4, 0], [3, 4, 3], [4, 4, 0], [5, 5, 2], [5, 5, 2], [5, 5, 1], [5, 5, 2]][t];
    bit(-1, h, reach, beard); if (t === 3 || t >= 5) bit(1, h, t === 3 ? reach : reach - 1, beard);
    if (t >= 6) g.box(0, 0, 0, 0, top + 2, top + 4, t === 7 ? cry : steelL);
    if (t >= 4) S(1, 0, top - 1, gem);
  } else if (kind === 'hammer') {
    const top = [11, 12, 12, 13, 14, 14, 15, 15][t];
    g.box(0, 0, 0, 0, -3, top, (x, y, z) => z % 4 === 0 ? (t >= 5 ? gold : woodL) : wood);
    const [hx, hy, hz] = [[1, 2, 3], [2, 3, 4], [2, 3, 4], [2, 3, 5], [2, 4, 5], [2, 4, 5], [3, 4, 6], [3, 4, 6]][t];
    const c0 = top + 1;
    if (t === 4 || t === 7) g.fill(-hx - 1, hx + 1, -hy - 1, hy + 1, c0, c0 + hz, (x, y, z) => x * x / ((hx + 1) ** 2) + y * y / ((hy + 1) ** 2) + ((z - c0 - hz / 2) ** 2) / ((hz / 2 + 0.6) ** 2) <= 1, (x, y, z) => t === 7 ? ((x + y + z) % 3 ? cry : white) : z === c0 + hz ? steelL : steel);
    else g.box(-hx, hx, -hy, hy, c0, c0 + hz, (x, y, z) => t === 0 ? ((y + z) % 3 ? woodL : wood) : Math.abs(y) === hy ? steelD : z === c0 + hz ? steelL : steel);
    if (t === 2 || t >= 5) for (let i = 1; i <= 3; i++) S(0, -hy - i, c0 + Math.round(hz / 2), i === 3 ? edge : steelD); // a spike on the back
    if (t >= 3) g.box(-hx, hx, -hy, hy, c0 + Math.round(hz / 2), c0 + Math.round(hz / 2), (x, y) => Math.abs(y) === hy || Math.abs(x) === hx ? gold : null);
    if (t >= 6) { S(hx + 1, 0, c0 + Math.round(hz / 2), gem); S(-hx - 1, 0, c0 + Math.round(hz / 2), gem); }
  } else if (kind === 'bow') {
    const L = [10, 11, 12, 12, 14, 13, 13, 14][t], bend = [4, 4, 3, 4, 3, 4, 4, 4][t];
    for (let y = -L; y <= L; y++) {
      const r = y / L; let z = Math.round(bend * (1 - r * r));
      if (t === 2 || t >= 5) z -= Math.round(Math.max(0, Math.abs(r) - 0.8) * 10); // recurve tips
      const c = Math.abs(y) < 3 ? (t >= 3 ? gold : lea) : t === 7 ? ((y & 1) ? cry : white) : t >= 6 ? (Math.abs(y) > L - 3 ? gold : woodD) : t >= 4 ? woodD : wood;
      S(0, y, z, c); if (Math.abs(y) < L - 1) S(0, y, z + 1, t === 7 ? cry : t >= 4 ? wood : woodL);
    }
    g.box(0, 0, -L + 1, L - 1, 0, 0, () => t >= 6 ? '#fff4c0' : '#eeeeee');
    if (t === 5 || t === 6) for (const s of [-1, 1]) for (let i = 0; i < 4; i++) S(0, s * (4 + i), bend + 1 + Math.round(i * 0.4), i === 3 ? white : steelL); // wing ornaments
    if (t >= 3) S(1, 0, bend + 1, gem);
  } else if (kind === 'gun') {
    const blen = [12, 14, 14, 12, 15, 18, 16, 17][t];
    g.box(0, 0, -3, 0, -3, 0, t >= 6 ? woodD : lea); g.box(0, 0, -3, -2, -5, -4, t >= 6 ? woodD : lea);
    g.box(0, 0, 0, 1, 0, blen, (x, y, z) => t === 7 ? (y ? cry : white) : y === 1 ? steelD : '#3a3a44');
    if (t === 4) g.box(1, 1, 0, 1, 0, blen, (x, y) => y ? steelD : '#3a3a44'); // a second barrel
    if (t === 3) g.box(-1, 1, -1, 2, blen - 1, blen, '#3a3a44'); // a flared muzzle
    if (t === 5) g.box(0, 0, 2, 3, 5, 9, (x, y, z) => z === 5 || z === 9 ? gem : steelD); // a sight
    g.box(0, 0, -1, -1, 2, 4, '#3a3a44'); S(0, 2, blen - 1, gold);
    if (t >= 2) for (let z = 3; z < blen; z += 5) g.box(0, 0, -1, 1, z, z, gold);
    if (t >= 6) S(1, 0, 1, gem);
  } else if (kind === 'staff' || kind === 'rod') {
    const isS = kind === 'staff', top = isS ? [18, 19, 20, 20, 21, 21, 22, 22][t] : [10, 11, 12, 12, 13, 13, 14, 14][t], bot = isS ? -12 : -5;
    const tip = isS ? '#ff9a4a' : cry;
    g.box(0, 0, bot, top, 0, 0, (x, y, z) => z % 5 === 0 ? (t >= 4 ? gold : woodL) : t === 7 ? '#5a4a8a' : t >= 5 ? woodD : wood);
    g.box(-1, 1, top - 1, top, -1, 1, gold);
    const f = t, P = (w, h, c) => S(0, h, w, c);
    if (f === 0) orb(top + 2, 1.6, isS ? woodL : tip);
    else if (f === 1) { if (isS) for (let i = 0; i <= 6; i++) P(Math.round(Math.sin(i / 6 * Math.PI) * 3), top + 1 + Math.round(Math.sin(i / 6 * Math.PI * 0.9) * 2 + i * 0.4), woodL); else orb(top + 2, 1.8, tip); }
    else if (f === 2) orb(top + 4, 2.7, tip);
    else if (f === 3) { for (let a = 0; a < 20; a++) { const ang = a / 20 * Math.PI * 2; P(Math.round(Math.cos(ang) * 4), Math.round(top + 5 + Math.sin(ang) * 4), gold); } orb(top + 5, 1.8, tip); }
    else if (f === 4) { orb(top + 4, 2.4, tip); for (const s of [-1, 1]) for (let i = 0; i < 5; i++) for (let k = 0; k <= Math.min(i, 2); k++) P(s * (3 + i), top + 2 + i - k, i === 4 ? white : '#f4f0e0'); }
    else if (f === 5) { for (let a = 0; a <= 14; a++) { const ang = Math.PI * (0.15 + a / 14 * 1.7); P(Math.round(Math.cos(ang) * 4), Math.round(top + 5 + Math.sin(ang) * 4), a % 4 ? gold : white); } orb(top + 5, 1.5, tip); }
    else if (f === 6) { for (const [y, h] of [[0, 7], [-2, 4], [2, 5], [-1, 3], [1, 3]]) for (let z = 0; z < h; z++) P(y, top + 1 + z, z === h - 1 ? white : cry); S(1, top + 3, 0, cry); S(-1, top + 3, 0, cry); }
    else { orb(top + 5, 2.2, white, cry); for (let a = 0; a < 5; a++) { const ang = a / 5 * Math.PI * 2 - Math.PI / 2; for (let k = 3; k <= 5; k++) P(Math.round(Math.cos(ang) * k), Math.round(top + 5 + Math.sin(ang) * k), k === 5 ? white : gold); } }
    if (isS && f >= 2 && f !== 6) for (const [x, y] of [[-2, 0], [2, 0], [0, -2], [0, 2]].slice(0, f >= 5 ? 4 : 2)) g.box(x, x, top + 1, top + 2, y, y, gold); // prongs that hold the orb (y here is the width axis)
  } else if (kind === 'knuckle') {
    // worn over the fist: the hand is at the origin
    const base = [['#f0ead8', '#d8d0bc'], [lea, leaD], [steel, steelD], [steel, steelD], [steel, steelD], [gold, goldD], ['#5a3a6a', '#3a2a4a'], [cry, white]][t];
    g.fill(-2, 2, -2, 2, -2, 2, (x, y, z) => !(Math.abs(x) === 2 && Math.abs(y) === 2) && !(Math.abs(y) === 2 && Math.abs(z) === 2), (x, y, z) => (z + y) % 2 ? base[0] : base[1]);
    if (t >= 2) for (let y = -1; y <= 1; y += 2) S(0, y, 3, t >= 5 ? gold : steelL); // studs over the knuckles
    if (t === 3 || t >= 6) for (const y of [-2, 0, 2]) { S(0, y, 3, edge); S(0, y, 4, edge); }
    if (t === 4) for (const y of [-2, 0, 2]) for (let z = 3; z <= 8; z++) S(0, y, z, z === 8 ? white : edge); // claws
    if (t >= 5) S(3, 0, 0, gem);
  } else if (kind === 'whip') {
    const n = [16, 18, 22, 22, 24, 24, 26, 26][t];
    g.box(0, 0, -1, 2, 0, 0, t >= 6 ? gold : '#5a3a2a'); if (t >= 6) S(0, 3, 0, gem);
    for (let i = 0; i < n; i++) {
      const a = i * 0.45, x = Math.round(Math.sin(a) * 2), y = -2 - Math.round(i * 0.55), z = Math.round(Math.cos(a) * 2 + 2);
      const c = t === 7 ? (i % 2 ? cry : white) : t === 4 ? (i % 2 ? steel : steelD) : t >= 2 ? (i % 3 ? '#8a5a3a' : '#5a3a2a') : i % 2 ? '#c8b890' : '#a89870';
      S(x, y, z, c);
      if (t === 5 && i % 3 === 1) S(x, y, z + 1, edge); // thorns
    }
    if (t === 3 || t >= 5) { const a = (n - 1) * 0.45; S(Math.round(Math.sin(a) * 2), -3 - Math.round((n - 1) * 0.55), Math.round(Math.cos(a) * 2 + 2), edge); }
  } else if (kind === 'boomerang') {
    const arm = [5, 7, 7, 6, 6, 7, 7, 7][t], c1 = t === 7 ? cry : t >= 6 ? gold : t >= 2 ? steel : wood, c2 = t === 7 ? white : t >= 2 ? edge : woodL, mark = t >= 6 ? gem : '#d84a4a';
    const wing = (ang) => { for (let i = 0; i <= arm; i++) { const y = Math.round(Math.cos(ang) * i), z = Math.round(Math.sin(ang) * i) + 6; S(0, y, z, i % 3 === 2 ? mark : c1); S(0, y + Math.round(Math.sin(ang)), z - Math.round(Math.cos(ang)), c2); } };
    const angs = t >= 4 && t !== 5 ? [0, Math.PI / 2, Math.PI, Math.PI * 1.5] : t === 3 ? [Math.PI / 2, Math.PI * 7 / 6, Math.PI * 11 / 6] : [Math.PI * 0.2, Math.PI * 0.8];
    for (const a of angs) wing(a);
    if (t === 5) for (let a = 0; a <= 12; a++) { const ang = Math.PI * (0.1 + a / 12 * 0.8); S(0, Math.round(Math.cos(ang) * 7), Math.round(Math.sin(ang) * 7) + 3, edge); }
    S(0, 0, 6, t >= 4 ? gem : c1);
  } else if (kind === 'harp') {
    const hgt = [8, 10, 11, 11, 12, 12, 13, 13][t], wid = [5, 7, 7, 8, 8, 9, 9, 9][t], fr = t === 7 ? cry : t >= 3 ? gold : woodL;
    for (let y = -2; y <= hgt; y++) S(0, y, 0, fr);
    for (let z = 0; z <= wid; z++) { S(0, hgt - Math.round(z * 0.3), z, fr); S(0, -2, z, t >= 3 ? goldD : wood); }
    g.box(0, 0, -2, hgt - 2, wid, wid, fr);
    for (let z = 2; z <= wid - 1; z += (t >= 5 ? 1 : 2)) g.box(0, 0, -1, hgt - 1 - Math.round(z * 0.3), z, z, t >= 6 ? '#fff4c0' : white);
    if (t >= 4) for (let i = 0; i < 4; i++) for (let k = 0; k <= i; k++) S(0, hgt + 1 + i - k, -1 - i, i === 3 ? white : '#f4f0e0'); // a wing on top
    if (t >= 2) S(1, hgt, 0, gem);
  } else if (kind === 'tome') {
    const cover = ['#8a6a4a', '#6a2a3a', '#2a4a6a', '#2a5a3a', '#4a2a6a', '#6a1a1a', '#1a1a2a', '#3a6a8a'][t], hh = t >= 4 ? 2 : 1;
    g.box(-3, 3, -2, 5, -hh, hh, (x, y, z) => Math.abs(z) === hh ? cover : (y & 1) ? '#f4ecd8' : '#e4dcc8');
    if (t >= 2) g.box(-1, 1, 1, 3, hh + 1, hh + 1, gold);
    if (t >= 3) S(0, 2, hh + 2, gem);
    if (t >= 4) for (const [x, y] of [[-3, -2], [3, -2], [-3, 5], [3, 5]]) g.box(x, x, y, y, -hh, hh, gold); // metal corners
    if (t >= 5) g.box(-2, 2, 6, 6, -hh, hh, '#5a3a2a'); // a clasp strap
    if (t === 7) for (const [x, y, z] of [[-4, 7, 3], [3, 8, 4], [0, 9, 2]]) S(x, y, z, white); // pages floating free
  } else if (kind === 'wrench') {
    g.box(0, 0, -1, 0, -2, 11, (x, y, z) => z < 2 ? '#c84a3a' : steelD);
    g.box(-1, 1, -2, 1, 12, 15, steel);
    for (let y = -1; y <= 0; y++) for (let z = 14; z <= 15; z++) for (let x = -1; x <= 1; x++) g.del(x, y, z);
  } else return null;
  // refined weapons gain a ring of gold, then a glowing gem, by the grip
  if (refine >= 3 && kind !== 'knuckle' && kind !== 'tome') S(1, 0, 0, gold);
  if (refine >= 6 && kind !== 'knuckle' && kind !== 'tome') { S(-1, 0, 0, gem); S(1, 0, -1, gem); }
  return g;
}

// per-weapon resting angle in the hand (positive tips the business end down)
const WPN_TILT = { sword: 1.0, katana: 1.0, dagger: 1.1, wrench: 1.0, staff: 0, rod: 0, spear: 0, bow: 0, harp: 0.2, greatsword: 0.6, axe: -0.9, hammer: -0.9, gun: 0.3, whip: 0, boomerang: 0.4, tome: 0.6, knuckle: 0 };

const geoCache = new Map();
function geometriesFor(look) {
  const key = JSON.stringify(look);
  let G = geoCache.get(key);
  if (!G) { const P = partsFor(look); G = {}; const AO = { leg: [-LEG, -1, 0.72], torso: [-15, 13, 0.78], head: [-2, 14, 0.82], arm: [-11, 0, 0.8], cape: [-25, 1, 0.7] }; for (const k in P) G[k] = meshGrid(P[k], 0.012, AO[k]); geoCache.set(key, G); }
  return G;
}

// battle poses (same order as pixel.js BPOSE)
const POSES = [
  { armR: -0.25, armL: 0.1, armRz: -0.12, armLz: 0.12 }, // idle
  { armR: -0.25, armL: 0.1, armRz: -0.12, armLz: 0.12 }, // idle2
  { armR: -2.5, armL: 0.35, armRz: -0.1, armLz: 0.2, torso: -0.14, legL: -0.35, legR: 0.3 }, // ready
  { armR: -1.35, armL: 0.55, armLz: 0.25, torso: 0.32, legL: -0.7, legR: 0.45, y: -1 }, // strike
  { armR: -1.9, armL: -1.9, armRz: -0.22, armLz: 0.22, torso: -0.06, head: -0.18 }, // cast
  { armR: 0.5, armL: 0.5, armRz: -0.6, armLz: 0.6, torso: -0.38, head: -0.3, legL: 0.25 }, // hurt
  { lie: 1 }, // ko
  { armR: -1.15, armL: -1.3, armRz: 0.35, armLz: -0.35, torso: 0.15, legL: -0.3, legR: 0.25 }, // guard
  { armR: -2.95, armL: 0.25, armRz: -0.15, armLz: 0.45, head: -0.12 }, // win
  { armR: 0.1, armL: -1.5, armLz: -0.1 }, // item
  { armR: -0.45, armL: 0.25, armRz: -0.18, armLz: 0.3, torso: 0.22, head: 0.16, legL: -0.85, legR: 0.45 }, // weak: down on one knee, still holding on
];
const JOINTS = ['armR', 'armL', 'armRz', 'armLz', 'legL', 'legR', 'torso', 'head', 'y', 'lie'];
const DIR_ANGLE = { down: 0, up: Math.PI, left: -Math.PI / 2, right: Math.PI / 2 };

export class VoxelPerson {
  constructor(look, opts = {}) {
    this.voxel = true;
    this.scale = opts.scale || 1;
    this.battle = !!opts.battle;
    this.glow = opts.glow ?? 0.14;
    this.mat = voxelMaterial(this.glow);
    const G = geometriesFor(look);
    const part = (geo, parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); if (geo) { const m = new THREE.Mesh(geo, this.mat); m.castShadow = true; g.add(m); } parent.add(g); return g; };
    this.mesh = new THREE.Group();
    this.card = new THREE.Group(); this.mesh.add(this.card);
    this.body = new THREE.Group(); this.body.scale.setScalar(VS * this.scale); this.card.add(this.body);
    this.paper = !opts.noPaper; this.pop = this.paper && PAPER ? 0 : 1; this.popDelay = 0; this.flipT = 0; this.side = 0;
    this.legL = part(G.leg, this.body, 3, LEG + 0.5, 0);
    this.legR = part(G.leg, this.body, -3, LEG + 0.5, 0);
    this.torso = part(G.torso, this.body, 0, LEG + 0.5, 0);
    this.head = part(G.head, this.torso, 0, 13.5, 0); this.head.scale.setScalar(HEAD);
    this.armL = part(G.arm, this.torso, 8, 12, 0);
    this.armR = part(G.arm, this.torso, -8, 12, 0);
    if (G.cape) this.cape = part(G.cape, this.torso, 0, 12.5, -4.5);
    if (G.weapon) { this.weapon = part(G.weapon, this.armR, 0, -10, 0.5); this.weapon.rotation.x = WPN_TILT[look.weapon] ?? 0.8; }
    if (G.weaponL) { this.weaponL = part(G.weaponL, this.armL, 0, -10, 0.5); this.weaponL.rotation.x = WPN_TILT[look.weaponL] ?? 0.8; }
    if (G.shield) part(G.shield, this.armL, 0, 0, 0);
    this.w = 0.7 * this.scale; this.h = 46 * VS * this.scale;
    this.frame = 0; this.t = Math.random() * 10;
    this.cur = {}; for (const j of JOINTS) this.cur[j] = 0;
    this.target = { ...POSES[0] };
    this.ang = opts.angle ?? 0; this.angT = this.ang;
    this.moving = false; this.phase = 0;
    this.mesh.rotation.y = 0; this.body.rotation.y = this.ang;
    toLayer(this.mesh);
  }
  // battle pose by BPOSE index
  setFrame(i) { this.frame = i; if (this.battle) this.target = { ...(POSES[i] || POSES[0]) }; }
  // field: turn toward a direction and walk
  walk(dir, moving, phase) {
    if (typeof dir === 'number') this.angT = dir; else if (dir in DIR_ANGLE) this.angT = DIR_ANGLE[dir];
    this.moving = moving; this.phase = phase;
  }
  snapFacing() { this.ang = this.angT; this.body.rotation.y = this.ang; }
  tick(dt) {
    this.t += dt;
    const k = Math.min(1, dt * (this.battle ? 16 : 12));
    let d = this.angT - this.ang; d = Math.atan2(Math.sin(d), Math.cos(d)); this.ang += d * Math.min(1, dt * 14);
    const tg = { ...this.target };
    if (!this.battle) {
      const ph = this.phase * Math.PI * 2 * 1.5, sw = Math.sin(ph);
      if (this.moving) { tg.legL = sw * 0.75; tg.legR = -sw * 0.75; tg.armL = -sw * 0.6; tg.armR = sw * 0.6 - 0.15; tg.armLz = 0.1; tg.armRz = -0.1; tg.torso = 0.08; tg.y = Math.abs(Math.cos(ph)) * 1.0; }
      else { tg.legL = 0; tg.legR = 0; tg.armL = 0.05; tg.armR = -0.15; tg.armLz = 0.1; tg.armRz = -0.1; tg.torso = 0; tg.y = 0; tg.head = 0; }
    }
    for (const j of JOINTS) { const d = (tg[j] || 0) - this.cur[j]; this.cur[j] = Math.abs(d) < 0.002 ? (tg[j] || 0) : this.cur[j] + d * k; }
    if (Math.abs(this.angT - this.ang) < 0.002) this.ang = this.angT;
    const c = this.cur, breathe = 0;
    this.legL.rotation.x = c.legL; this.legR.rotation.x = c.legR;
    this.armL.rotation.x = c.armL + breathe * 0.5; this.armR.rotation.x = c.armR - breathe * 0.5;
    this.armL.rotation.z = c.armLz + breathe * 0.3; this.armR.rotation.z = c.armRz - breathe * 0.3;
    this.torso.rotation.x = c.torso; this.torso.position.y = LEG + 0.5 + c.y + breathe * 4;
    this.head.rotation.x = c.head;
    if (this.cape) this.cape.rotation.x = 0.12 + (this.moving ? 0.35 + Math.sin(this.t * 9) * 0.06 : 0) + Math.max(0, -c.torso) * 0.5;
    if (this.battle && this.frame === BWIN) { this.body.position.y = Math.abs(Math.sin(this.t * 6)) * 0.12; }
    else if (this.battle && this.frame === 10) { this.body.position.y = -0.19 * this.scale; // sink so the knee is down and the front foot is planted
      this.torso.rotation.x = c.torso + Math.sin(this.t * 5) * 0.05; }
    else this.body.position.y = 0;
    if (PAPER && this.paper) {
      // a card cut from the page: flattened toward the reader, the figure printed on it at its own angle
      const yaw = camYaw(this.mesh), rel = this.ang - yaw, sn = Math.sin(rel);
      if (this.pop < 1) { if (this.popDelay > 0) this.popDelay -= dt; else this.pop = Math.min(1, this.pop + dt / POP_T); }
      const side = sn > 0.25 ? 1 : sn < -0.25 ? -1 : this.side;
      if (side !== this.side) { if (this.side && this.pop >= 1) this.flipT = FLIP_T; this.side = side; }
      this.flipT = Math.max(0, this.flipT - dt);
      const fl = this.flipT > 0 ? Math.max(0.04, Math.abs(Math.cos((1 - this.flipT / FLIP_T) * Math.PI))) : 1;
      const up = this.pop >= 1 ? 1 : easeBack(this.pop);
      // knocked out: the card falls flat on its back
      this.card.rotation.set(-0.15 - (Math.PI / 2 - 0.15) * (1 - up) - 1.3 * c.lie, yaw, 0, 'YXZ');
      this.card.scale.set(fl, 1, PAPER_D);
      this.body.rotation.set(0, rel, 0);
      this.body.scale.setScalar(VS * this.scale);
      return;
    }
    this.card.rotation.set(0, 0, 0); this.card.scale.set(1, 1, 1);
    // knocked out: lie on the back
    this.body.rotation.set(-1.5 * c.lie, this.ang, 0, 'YXZ');
    this.body.scale.set(VS * this.scale, VS * this.scale, VS * this.scale * DEPTH);
    if (c.lie > 0.01) this.body.position.y = 0.16 * this.scale * c.lie;
  }
  dispose() { this.mat.dispose(); }
}
const BWIN = 8;

// ---------------------------------------------------------------- monsters: the pixel art, puffed out into a rounded slab
const slabCache = new Map();
// ---------------------------------------------------------------- portraits rendered from the models (menus, dialogue, cut-ins)
let PR = null;
export function renderPortrait(look, mode = 'face') {
  if (!look) return '';
  const W = mode === 'face' ? 40 : 48, H = mode === 'face' ? 36 : 76;
  if (!PR) {
    const canvas = document.createElement('canvas');
    const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, preserveDrawingBuffer: true });
    r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.1;
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#e4ecff', '#3a3050', 1.5));
    const key = new THREE.DirectionalLight('#fff2dc', 2.8); key.position.set(2.5, 3, 4); scene.add(key);
    const rim = new THREE.DirectionalLight('#9ab8ff', 2.4); rim.position.set(-3, 2.5, -3); scene.add(rim);
    PR = { r, scene, cam: new THREE.PerspectiveCamera(22, 1, 0.1, 50) };
    PR.cam.layers.enableAll(); scene.traverse((o) => o.layers.enableAll());
  }
  const { r, scene, cam } = PR;
  r.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix();
  const v = new VoxelPerson(look, { battle: mode === 'battle', angle: mode === 'battle' ? -0.55 : 0.3, glow: 0.08, noPaper: true });
  if (mode === 'battle') v.setFrame(8);
  for (let i = 0; i < 40; i++) v.tick(0.05);
  v.t = 0; v.tick(0.0001);
  scene.add(v.mesh);
  const headY = (LEG + 0.5 + 13.5 + 6.5 * HEAD) * VS;
  if (mode === 'face') { cam.position.set(0.25, headY + 0.08, 1.9); cam.lookAt(0, headY, 0); }
  else { cam.position.set(0.5, 1.0, 6.0); cam.lookAt(0, 0.92, 0); }
  r.render(scene, cam);
  // scale up 4x with hard edges and a dark outline, like a hand-made sprite
  const k = 4, src = r.domElement, out = document.createElement('canvas'); out.width = W * k; out.height = H * k;
  const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; const tg = tmp.getContext('2d'); tg.drawImage(src, 0, 0);
  const id = tg.getImageData(0, 0, W, H), d = id.data, a = (x, y) => x < 0 || y < 0 || x >= W || y >= H ? 0 : d[(y * W + x) * 4 + 3];
  const o = tg.createImageData(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    if (d[i + 3] > 128) { for (let c = 0; c < 3; c++) o.data[i + c] = Math.round(d[i + c] / 18) * 18; o.data[i + 3] = 255; }
    else if (a(x + 1, y) > 128 || a(x - 1, y) > 128 || a(x, y + 1) > 128 || a(x, y - 1) > 128) { o.data[i] = 14; o.data[i + 1] = 10; o.data[i + 2] = 26; o.data[i + 3] = 255; }
  }
  tg.putImageData(o, 0, 0);
  const og = out.getContext('2d'); og.imageSmoothingEnabled = false; og.drawImage(tmp, 0, 0, W * k, H * k);
  const url = out.toDataURL();
  scene.remove(v.mesh); v.dispose();
  return url;
}

export function renderWeaponIcon(kind, metal, accent, tier = 0, refine = 0) {
  if (!PR) renderPortrait({ skin: 'light' }, 'face');
  const { r, scene, cam } = PR; const W = 40, H = 40;
  const m = weaponMesh(kind, metal, accent, tier, refine); if (!m) return '';
  m.scale.setScalar(VS * 1.25); m.rotation.set(-0.75, 0.9, 0.2); m.layers.enableAll();
  const box = new THREE.Box3().setFromObject(m), c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3()).length();
  m.position.sub(c); scene.add(m);
  r.setSize(W, H, false); cam.aspect = 1; cam.updateProjectionMatrix(); cam.position.set(0, 0, sz / 0.36); cam.lookAt(0, 0, 0);
  r.render(scene, cam); scene.remove(m); m.geometry.dispose(); m.material.dispose();
  return pixelUp(r.domElement, W, H);
}
// scale a small render up 4x with hard edges and a dark outline, like a hand-made sprite
function pixelUp(src, W, H) {
  const k = 4, out = document.createElement('canvas'); out.width = W * k; out.height = H * k;
  const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; const tg = tmp.getContext('2d'); tg.drawImage(src, 0, 0);
  const d = tg.getImageData(0, 0, W, H).data, a = (x, y) => x < 0 || y < 0 || x >= W || y >= H ? 0 : d[(y * W + x) * 4 + 3];
  const o = tg.createImageData(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    if (d[i + 3] > 128) { for (let c = 0; c < 3; c++) o.data[i + c] = Math.round(d[i + c] / 12) * 12; o.data[i + 3] = 255; }
    else if (a(x + 1, y) > 128 || a(x - 1, y) > 128 || a(x, y + 1) > 128 || a(x, y - 1) > 128) { o.data[i] = 14; o.data[i + 1] = 10; o.data[i + 2] = 26; o.data[i + 3] = 220; }
  }
  tg.putImageData(o, 0, 0);
  const og = out.getContext('2d'); og.imageSmoothingEnabled = false; og.drawImage(tmp, 0, 0, W * k, H * k);
  return out.toDataURL();
}

export class VoxelSprite {
  constructor(px, opts = {}) {
    this.voxel = true;
    this.scale = opts.scale || 1;
    const key = px.d.join(',') + '|' + px.w;
    let geo = slabCache.get(key);
    if (!geo) { geo = meshGrid(slab(px), 0.03); slabCache.set(key, geo); }
    this.glow = opts.glow ?? 0.16; this.mat = voxelMaterial(this.glow);
    this.inner = new THREE.Mesh(geo, this.mat); this.inner.castShadow = true;
    const k = this.scale / 16; this.k = k; this.inner.scale.set(k, k, k * (0.4 + DEPTH * 0.6)); this.inner.position.y = 0.5 * k;
    this.card = new THREE.Group(); this.card.add(this.inner);
    this.mesh = new THREE.Group(); this.mesh.add(this.card); toLayer(this.mesh);
    this.pop = PAPER ? 0 : 1; this.popDelay = 0;
    this.w = px.w * k; this.h = px.h * k;
    this.frame = 0;
  }
  setFrame(i) { this.frame = i; }
  tick(dt = 0.016) {
    const k = this.k;
    if (!PAPER) { this.card.rotation.set(0, 0, 0); this.inner.scale.set(k, k, k * (0.4 + DEPTH * 0.6)); return; }
    if (this.pop < 1) { if (this.popDelay > 0) this.popDelay -= dt; else this.pop = Math.min(1, this.pop + dt / POP_T); }
    const up = this.pop >= 1 ? 1 : easeBack(this.pop);
    this.card.rotation.set(-0.15 - (Math.PI / 2 - 0.15) * (1 - up), camYaw(this.mesh), 0, 'YXZ');
    this.inner.scale.set(k, k, k * PAPER_D * 1.5);
  }
  dispose() { this.mat.dispose(); }
}
const OUTLINE = '#1c1424';
// depth grows with the distance from the silhouette's edge, so bodies come out round
function slab(px) {
  const { w, h } = px, dist = new Array(w * h).fill(-1), q = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!px.get(x, y)) continue;
    if (!px.get(x - 1, y) || !px.get(x + 1, y) || !px.get(x, y - 1) || !px.get(x, y + 1)) { dist[y * w + x] = 0; q.push(x, y); }
  }
  for (let i = 0; i < q.length; i += 2) {
    const x = q[i], y = q[i + 1], d = dist[y * w + x];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (px.get(nx, ny) && dist[ny * w + nx] < 0) { dist[ny * w + nx] = d + 1; q.push(nx, ny); } }
  }
  const g = new VGrid(), maxD = Math.max(2, Math.round(Math.min(w, h) * 0.2));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = px.get(x, y); if (!c || (c === OUTLINE && dist[y * w + x] === 0)) continue;
    const d = dist[y * w + x], hd = Math.min(maxD, Math.round(Math.sqrt(d + 0.5) * 1.6));
    for (let z = -hd; z <= hd; z++) g.set(x - (w >> 1), h - 1 - y, z, z < 0 && Math.abs(z) === hd && d > 0 ? shade(c, -0.15) : c);
  }
  return g;
}
// for the paper dolls (paperdoll.js), which share the weapons, poses and facing with the voxel people
export { tintWeapon, weaponGrid, WPN_TILT, SKINS, POSES, JOINTS, DIR_ANGLE, camYaw, VS, POP_T, FLIP_T, BWIN, toLayer, renderPortrait as renderVoxelPortrait };
