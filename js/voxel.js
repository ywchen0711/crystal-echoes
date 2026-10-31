// Voxel people and monsters: the same recipes as the pixel sprites, built as real 3D models
// out of small cubes so they have depth, turn smoothly and swing their arms and legs.
import * as THREE from '../lib/three.module.min.js';
import { shade, mix } from './pixel.js?v=8';
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
  P.torso = tor;

  // arms: pivot at the shoulder; the hand is at local y -10
  const arm = new VGrid();
  arm.fill(-1, 1, -11, 0, -1, 1, (x, y, z) => !(y === 0 && Math.abs(x) === 1 && Math.abs(z) === 1) && !(y === -11 && Math.abs(x) === 1 && Math.abs(z) === 1), (x, y) => y <= -9 ? (s.gloves ? (y === -9 ? shade(s.gloves, 0.15) : s.gloves) : skin) : y === -8 ? (s.cuff || (s.gloves ? shade(s.gloves, -0.2) : shade(T, -0.25))) : y >= -1 ? shade(T, 0.08) : T);
  if (s.pauldron) arm.fill(-2, 2, -3, 1, -2, 2, (x, y, z) => !(y === 1 && (Math.abs(x) === 2 || Math.abs(z) === 2)), (x, y) => y === -3 ? shade(s.pauldron, -0.3) : y === 1 ? shade(s.pauldron, 0.25) : s.pauldron);
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
  const wp = s.weapon && tintWeapon(weaponGrid(s.weapon), s.weaponMetal, s.weaponAccent);
  if (wp) P.weapon = wp;
  if (s.weaponL) { const wl = tintWeapon(weaponGrid(s.weaponL), s.weaponLMetal, s.weaponLAccent); if (wl) P.weaponL = wl; }
  if (s.shield) {
    const sh = new VGrid(), S = s.shieldColor || '#5a7ac8';
    sh.fill(2, 3, -11, 4, -6, 6, (x, y, z) => (y + 3.5) ** 2 / 64 + z * z / 40 <= 1 && (x === 2 || (y + 3.5) ** 2 / 64 + z * z / 40 <= 0.62), (x, y, z) => (y + 3.5) ** 2 / 64 + z * z / 40 > 0.7 ? gold : x === 3 ? shade(S, 0.12) : S);
    sh.box(4, 4, -4, -3, -1, 0, s.shieldEmblem || gold);
    if (s.shieldEmblem) sh.box(3, 3, -6, -1, -1, 0, shade(s.shieldEmblem, -0.1));
    if (s.shieldRim) for (const [k, v] of sh.m) if (v[3] === gold) v[3] = s.shieldRim;
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
export function weaponMesh(kind, metal, accent) { const g = tintWeapon(weaponGrid(kind), metal, accent); if (!g) return null; const m = new THREE.Mesh(meshGrid(g, 0.01), voxelMaterial(0.12)); return m; }
function weaponGrid(kind) {
  const g = new VGrid();
  const steel = '#cdd5e0', steelD = '#7d8aa0', wood = '#8a5a2a', woodL = '#b88848', gold = '#e8c050';
  if (kind === 'sword') {
    g.box(0, 0, 0, 0, -4, 0, '#5a3a2a'); g.box(0, 0, 0, 0, -5, -5, gold);
    g.box(0, 0, -2, 2, 1, 1, gold); g.box(0, 0, 0, 0, 1, 1, '#d84a4a');
    g.box(0, 0, -1, 1, 2, 16, (x, y) => y === 1 ? '#e6ebf2' : y === 0 ? steel : steelD); g.set(0, 0, 17, steel);
  } else if (kind === 'katana') {
    g.box(0, 0, 0, 0, -6, 0, (x, y, z) => z % 2 ? '#2a2a3a' : '#e8e4d8');
    g.box(-1, 1, -1, 1, 1, 1, gold);
    for (let z = 2; z <= 22; z++) { const off = Math.round(((z - 2) / 20) ** 2 * 2); g.set(0, off, z, '#f4f6fa'); g.set(0, off - 1, z, steelD); }
  } else if (kind === 'dagger') {
    g.box(0, 0, 0, 0, -3, 0, '#3a2a20'); g.box(0, 0, -1, 1, 1, 1, gold); g.box(0, 0, -1, 0, 2, 8, (x, y) => y === 0 ? '#ffffff' : steelD);
  } else if (kind === 'staff' || kind === 'rod') {
    const tip = kind === 'staff' ? '#ff9a4a' : '#8ae0ff', top = kind === 'staff' ? 20 : 12, bot = kind === 'staff' ? -12 : -5;
    g.box(0, 0, bot, top, 0, 0, (x, y) => y % 5 === 0 ? woodL : wood);
    g.box(-1, 1, top - 1, top, -1, 1, gold);
    g.fill(-3, 3, top + 1, top + 7, -3, 3, (x, y, z) => x * x + (y - top - 4) ** 2 + z * z <= 7.5, (x, y, z) => y >= top + 6 || (x < 0 && y > top + 4) ? '#ffffff' : tip);
    if (kind === 'staff') for (const [x, z] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) g.box(x, x, top + 1, top + 3, z, z, gold);
  } else if (kind === 'spear') {
    g.box(0, 0, -14, 24, 0, 0, (x, y) => y % 6 === 0 ? woodL : wood);
    g.box(-1, 1, 24, 25, -1, 1, gold);
    for (let y = 26; y <= 32; y++) { const r = y < 29 ? y - 25 : 33 - y; g.box(0, 0, y, y, -Math.min(2, r - 1), Math.min(2, r - 1), y > 30 ? '#ffffff' : steel); }
    g.box(0, 0, 21, 23, 1, 1, '#d84a4a');
  } else if (kind === 'bow') {
    for (let y = -12; y <= 12; y++) { const z = Math.round(4 * (1 - (y / 12) ** 2)); g.set(0, y, z, Math.abs(y) < 3 ? '#5a3a2a' : wood); if (Math.abs(y) < 11) g.set(0, y, z + 1, woodL); }
    g.box(0, 0, -11, 11, 0, 0, (x, y) => '#eeeeee');
  } else if (kind === 'wrench') {
    g.box(0, 0, -1, 0, -2, 11, (x, y, z) => z < 2 ? '#c84a3a' : steelD);
    g.box(-1, 1, -2, 1, 12, 15, steel); g.box(-1, 1, -1, 0, 14, 15, null);
    for (let y = -1; y <= 0; y++) for (let z = 14; z <= 15; z++) for (let x = -1; x <= 1; x++) g.del(x, y, z);
  } else if (kind === 'harp') {
    for (let y = -2; y <= 10; y++) { g.set(0, y, 0, gold); }
    for (let z = 0; z <= 7; z++) { g.set(0, 10 - Math.round(z * 0.3), z, gold); g.set(0, -2, z, shade(gold, -0.2)); }
    g.box(0, 0, -2, 8, 7, 7, gold);
    for (let z = 2; z <= 6; z += 2) g.box(0, 0, -1, 8, z, z, '#ffffff');
  } else if (kind === 'greatsword') {
    g.box(0, 0, 0, 0, -6, 0, '#4a2a1a'); g.box(-3, 3, -1, 1, 1, 1, gold);
    g.box(0, 0, -2, 2, 2, 24, (x, y) => Math.abs(y) === 2 ? steelD : y === 0 ? '#e6ebf2' : steel); g.box(0, 0, -1, 1, 25, 26, steel);
  } else if (kind === 'axe') {
    g.box(0, 0, 0, 0, -3, 13, (x, y, z) => z % 4 === 0 ? woodL : wood);
    g.fill(0, 0, -6, 4, 9, 15, (x, y, z) => y >= -5 + Math.abs(z - 12) * 0.6 && y <= 1 + Math.abs(z - 12) * 0.3 && y < 4, (x, y) => y <= -5 ? '#ffffff' : steel);
  } else if (kind === 'hammer') {
    g.box(0, 0, 0, 0, -3, 12, (x, y, z) => z % 4 === 0 ? woodL : wood);
    g.box(-2, 2, -3, 3, 12, 16, (x, y, z) => z === 12 || z === 16 ? steelD : steel); g.box(-1, 1, -2, 2, 11, 11, gold);
  } else if (kind === 'gun') {
    g.box(0, 0, -2, 0, -3, 0, '#5a3a2a'); g.box(0, 0, 0, 1, 0, 14, (x, y, z) => y === 1 ? steelD : '#3a3a44'); g.box(0, 0, -1, -1, 2, 4, '#3a3a44'); g.set(0, 2, 13, gold);
  } else if (kind === 'whip') {
    g.box(0, 0, -1, 1, 0, 0, '#5a3a2a');
    for (let i = 0; i < 22; i++) { const a = i * 0.45; g.set(Math.round(Math.sin(a) * 2), -2 - Math.round(i * 0.55), Math.round(Math.cos(a) * 2 + 2), i % 3 ? '#8a5a3a' : '#5a3a2a'); }
  } else if (kind === 'boomerang') {
    for (let i = 0; i <= 7; i++) { g.set(0, i, i + 1, i % 3 ? wood : '#d84a4a'); g.set(0, i, i + 2, woodL); g.set(0, -i + 7, i + 9, i % 3 ? wood : '#d84a4a'); g.set(0, -i + 7, i + 10, woodL); }
  } else if (kind === 'tome') {
    g.box(-3, 3, -2, 5, -1, 1, (x, y, z) => Math.abs(z) === 1 ? '#6a2a3a' : '#f4ecd8'); g.box(-1, 1, 1, 3, 2, 2, gold);
  } else return null;
  return g;
}

// per-weapon resting angle in the hand (positive tips the business end down)
const WPN_TILT = { sword: 1.0, katana: 1.0, dagger: 1.1, wrench: 1.0, staff: 0, rod: 0, spear: 0, bow: 0, harp: 0.2, greatsword: 0.6, axe: -0.9, hammer: -0.9, gun: 0.3, whip: 0, boomerang: 0.4, tome: 0.6 };

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

export function renderWeaponIcon(kind, metal, accent) {
  if (!PR) renderPortrait({ skin: 'light' }, 'face');
  const { r, scene, cam } = PR; const W = 40, H = 40;
  const m = weaponMesh(kind, metal, accent); if (!m) return '';
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
