// Turns a map definition (ASCII grid + marks) into a lit 3D diorama.
import { easeBack } from './voxel.js?v=13';
import * as THREE from '../lib/three.module.min.js';
import { tileTex, propPx, propCanvas, texFrom, Px, ramp, shade, rnd, reseed, personFrame } from './pixel.js?v=13';
import { Sprite, waterMaterial, blobShadow, spriteMaterial, depthMat } from './render.js?v=13';

const LV = 0.5; // world height of one level
// ground tile kinds by grid char
export const TILE = {
  '.': 'main', ',': 'second', ':': 'third', ';': 'fourth',
  'g': 'grass', 'd': 'dirt', 'n': 'sand', 'w': 'wood', 'r': 'carpet', 'c': 'cave', 'p': 'temple', 'm': 'metal', 'k': 'snow', 'o': 'cloud', 'q': 'crystal', 'b': 'cobble', 'e': 'brick',
};
const STAIRS = { '^': [0, -1], 'v': [0, 1], '<': [-1, 0], '>': [1, 0] };

export function parseMap(def) {
  const rows = def.grid, H = rows.length, W = Math.max(...rows.map(r => r.length));
  const hrows = def.heights || [];
  const cells = [];
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    let ch = rows[j][i] || 'x';
    const hc = hrows[j] ? hrows[j][i] : '0';
    let h = hc && hc >= '0' && hc <= '9' ? (+hc) * LV : 0;
    const c = { i, j, ch, h, kind: null, block: false, water: false, stairs: null, bridge: false, marks: [] };
    if (/[A-XZ]/.test(ch) && def.marks && def.marks[ch]) { const mk = def.marks[ch]; c.marks.push(mk); ch = mk.ground || def.markGround || '.'; c.ch = ch; }
    if (ch === 'x') { c.block = true; c.void = true; }
    else if (ch === '#') { c.block = true; c.wall = true; c.kind = 'wall'; }
    else if (ch === '~') { c.water = true; c.block = true; c.kind = 'water'; }
    else if (ch === '=' || ch === '|') { c.bridge = ch; c.kind = 'bridge'; }
    else if (ch === 'Y') { c.kind = 'main'; c.tree = true; c.block = true; }
    else if (ch === 'y') { c.kind = 'main'; c.bush = true; c.block = true; }
    else if (STAIRS[ch]) { c.stairs = STAIRS[ch]; c.kind = 'stairs'; }
    else if (ch === '%') { c.kind = 'second'; c.shallow = true; } // shallow water the mech bird can cross
    else if (ch === '@') { c.kind = 'main'; c.cliff = true; c.block = true; } // impassable rock on the world map
    else c.kind = TILE[ch] || 'main';
    cells.push(c);
  }
  const map = { def, W, H, cells, at: (i, j) => (i < 0 || j < 0 || i >= W || j >= H) ? null : cells[j * W + i] };
  for (const o of def.objs || []) { const c = map.at(o.x, o.z); if (c) c.marks.push(o); }
  return map;
}

// ground height at a world position (with stairs as ramps)
export function groundAt(map, x, z) {
  const c = map.at(Math.floor(x), Math.floor(z));
  if (!c) return 0;
  if (c.stairs) {
    const [dx, dz] = c.stairs, fx = x - c.i, fz = z - c.j;
    const t = dx ? (dx > 0 ? fx : 1 - fx) : (dz > 0 ? fz : 1 - fz);
    return c.h + t * LV * (c.def?.stairsUp || 2);
  }
  return c.h;
}

// ---------------------------------------------------------------- geometry batching
class Batch {
  constructor() { this.P = []; this.N = []; this.U = []; this.C = []; }
  quad(a, b, c, d, n, uv = [[0, 0], [1, 0], [1, 1], [0, 1]], col = [1, 1, 1]) {
    for (const k of [0, 1, 2, 0, 2, 3]) { const v = [a, b, c, d][k]; this.P.push(v[0], v[1], v[2]); this.N.push(n[0], n[1], n[2]); this.U.push(uv[k][0], uv[k][1]); this.C.push(col[0], col[1], col[2]); }
  }
  mesh(mat) {
    if (!this.P.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.U, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.C, 3));
    mat.vertexColors = true;
    const m = new THREE.Mesh(g, mat); m.receiveShadow = true; m.castShadow = true;
    return m;
  }
}
function std(map, opts = {}) { return new THREE.MeshStandardMaterial({ map, roughness: 0.95, metalness: 0, ...opts }); }

// box helper with per-face uv scale
function boxBatch(B, x0, y0, z0, x1, y1, z1, faces = 'tnsewb', uvScale = 1, col) {
  const s = uvScale;
  if (faces.includes('t')) B.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], [[0, 0], [(x1 - x0) * s, 0], [(x1 - x0) * s, (z1 - z0) * s], [0, (z1 - z0) * s]], col);
  if (faces.includes('s')) B.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], [[0, 0], [(x1 - x0) * s, 0], [(x1 - x0) * s, (y1 - y0) * s], [0, (y1 - y0) * s]], col);
  if (faces.includes('n')) B.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], [[0, 0], [(x1 - x0) * s, 0], [(x1 - x0) * s, (y1 - y0) * s], [0, (y1 - y0) * s]], col);
  if (faces.includes('e')) B.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], [[0, 0], [(z1 - z0) * s, 0], [(z1 - z0) * s, (y1 - y0) * s], [0, (y1 - y0) * s]], col);
  if (faces.includes('w')) B.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], [[0, 0], [(z1 - z0) * s, 0], [(z1 - z0) * s, (y1 - y0) * s], [0, (y1 - y0) * s]], col);
  if (faces.includes('b')) B.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], undefined, col);
}

// ---------------------------------------------------------------- small textures
function windowTex(lit) {
  const p = new Px(12, 16);
  p.rect(0, 0, 12, 16, '#4a3020'); p.rect(1, 1, 10, 14, lit ? '#ffd88a' : '#2a3a5a');
  if (!lit) { p.rect(2, 2, 3, 2, '#5a7aa8'); p.rect(7, 2, 3, 2, '#4a6a98'); }
  else { p.rect(2, 2, 3, 5, '#fff0c0'); }
  p.rect(5, 1, 2, 14, '#4a3020'); p.rect(1, 7, 10, 2, '#4a3020');
  p.rect(0, 15, 12, 1, '#c8b8a0');
  // arch top
  p.set(0, 0, null); p.set(11, 0, null); p.set(1, 0, null); p.set(10, 0, null); p.set(0, 1, null); p.set(11, 1, null);
  return texFrom(p.canvas());
}
function doorTex(color = '#6a4428') {
  const p = new Px(16, 24), R = ramp(color);
  p.rect(0, 0, 16, 24, '#3a2414');
  p.srect(1, 2, 14, 22, R);
  for (let x = 4; x < 14; x += 4) p.rect(x, 3, 1, 21, R[2]);
  p.rect(11, 13, 2, 2, '#e8c050');
  p.set(0, 0, null); p.set(15, 0, null); p.set(0, 1, null); p.set(15, 1, null); p.set(1, 0, null); p.set(14, 0, null);
  return texFrom(p.canvas());
}
const ICONS = {
  inn: (p) => { p.srect(2, 6, 12, 5, ramp('#e8e4d8')); p.srect(2, 4, 4, 3, ramp('#f4c0a0')); p.rect(1, 3, 1, 9, '#6a4428'); p.rect(14, 6, 1, 6, '#6a4428'); p.srect(6, 5, 8, 3, ramp('#c84a4a')); },
  item: (p) => { p.srect(6, 2, 4, 3, ramp('#c8c8d8')); p.sell(8, 9, 5, 5, ramp('#4ac86a')); p.set(6, 7, '#fff'); },
  weapon: (p) => { p.line(3, 13, 12, 4, '#e8eef8'); p.line(4, 13, 13, 4, '#9aa4b8'); p.line(3, 10, 6, 13, '#e8c050'); },
  armor: (p) => { p.srect(3, 2, 10, 8, ramp('#5a7ac8')); for (let i = 0; i < 5; i++) p.rect(4 + i, 10 + i, 8 - i * 2, 1, '#5a7ac8'); p.rect(7, 4, 2, 6, '#e8c050'); },
  guild: (p) => { p.srect(2, 3, 12, 9, ramp('#9a6a3c')); p.rect(4, 5, 3, 3, '#fff'); p.rect(9, 5, 3, 4, '#fff'); p.rect(5, 9, 3, 2, '#fff'); },
  forge: (p) => { p.srect(3, 9, 10, 4, ramp('#5a5a6a')); p.srect(5, 3, 3, 6, ramp('#8a5a2a')); p.srect(4, 2, 6, 3, ramp('#9aa4b8')); },
  arena: (p) => { p.line(3, 13, 12, 3, '#e8eef8'); p.line(12, 13, 3, 3, '#e8eef8'); p.sell(8, 8, 3, 3, ramp('#e8c050')); },
  shop: (p) => { p.sell(8, 8, 6, 6, ramp('#e8c050')); p.rect(7, 4, 2, 8, '#8a6a20'); },
  workshop: (p) => { p.sell(8, 8, 6, 6, ramp('#8a9ab0')); p.sell(8, 8, 2, 2, ramp('#3a3a4a')); for (let a = 0; a < 6; a++) p.rect(8 + Math.cos(a) * 6, 8 + Math.sin(a) * 6, 2, 2, '#8a9ab0'); },
};
function signTex(kind) {
  const p = new Px(16, 16);
  p.srect(0, 0, 16, 16, ramp('#7a5030')); p.rect(1, 1, 14, 14, '#e8dcc0');
  (ICONS[kind] || ICONS.shop)(p);
  return texFrom(p.outline().canvas());
}
function boardTex() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 32; const g = c.getContext('2d');
  g.fillStyle = '#2a3428'; g.fillRect(0, 0, 64, 32);
  reseed(99);
  for (let i = 0; i < 9; i++) { g.fillStyle = ['#f4f0e4', '#e8e0c8', '#f8f8f0'][i % 3]; const x = 3 + (i % 5) * 12 + rnd() * 3, y = 3 + Math.floor(i / 5) * 14 + rnd() * 3; g.fillRect(x | 0, y | 0, 9, 10); g.fillStyle = '#8a8070'; g.fillRect((x | 0) + 2, (y | 0) + 3, 5, 1); g.fillRect((x | 0) + 2, (y | 0) + 5, 4, 1); g.fillStyle = '#c84a4a'; g.fillRect((x | 0) + 4, y | 0, 1, 1); }
  return texFrom(c);
}

// ---------------------------------------------------------------- the builder
export function buildMap(scene, map, theme) {
  const root = new THREE.Group(); scene.add(root);
  const { W, H } = map;
  const T = theme.tiles; // kind -> [texKind, color]
  const batches = {}, mats = {};
  const getB = (key, makeMat) => { if (!batches[key]) { batches[key] = new Batch(); mats[key] = makeMat(); } return batches[key]; };
  const tileMat = (kind) => {
    const t = T[kind] || T.main;
    return getB('t_' + kind, () => std(tileTex(t[0], t[1], t[2])));
  };
  const wallB = getB('wall', () => std(tileTex(theme.wall[0], theme.wall[1])));
  const capB = getB('cap', () => std(tileTex(theme.cap ? theme.cap[0] : theme.wall[0], theme.cap ? theme.cap[1] : shade(theme.wall[1], 0.15))));
  const lights = [], colliders = [], props = [], anims = [], interact = [];
  const lowerOf = (c) => c.water ? c.h - 0.9 : c.void ? -6 : c.h;

  for (const c of map.cells) {
    if (c.void && !theme.voidFloor) continue;
    const x0 = c.i, x1 = c.i + 1, z0 = c.j, z1 = c.j + 1;
    const ao = 0.92 + rnd() * 0.08, col = [ao, ao, ao];
    if (c.water) {
      // canal bed
      const B = tileMat('third'); const y = c.h - 0.9;
      B.quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], [0, 1, 0], undefined, [0.5, 0.55, 0.6]);
    } else if (c.wall || c.cliff) {
      const top = c.h + (theme.wallH || 3);
      if (c.cliff && theme.cliffTile) tileMat(theme.cliffTile).quad([x0, top, z1], [x1, top, z1], [x1, top, z0], [x0, top, z0], [0, 1, 0], undefined, col);
      else capB.quad([x0, top, z1], [x1, top, z1], [x1, top, z0], [x0, top, z0], [0, 1, 0], undefined, col);
      c.top = top;
    } else if (c.stairs) {
      const [dx, dz] = c.stairs, rise = LV * 2, n = 4;
      const B = getB('stairs', () => std(tileTex(theme.stairs ? theme.stairs[0] : 'stonewall', theme.stairs ? theme.stairs[1] : '#c8c0b0')));
      for (let s = 0; s < n; s++) {
        const y1 = c.h + rise * (s + 1) / n;
        let a0, a1, b0, b1;
        if (dz) { const zs = dz < 0 ? z1 - (s + 1) / n : z0 + s / n, ze = zs + 1 / n; a0 = x0; a1 = x1; b0 = dz < 0 ? zs : zs; b1 = ze; boxBatch(B, a0, c.h - 0.01, b0, a1, y1, b1, 'tsnew', 1, col); }
        else { const xs = dx < 0 ? x1 - (s + 1) / n : x0 + s / n, xe = xs + 1 / n; boxBatch(B, xs, c.h - 0.01, z0, xe, y1, z1, 'tsnew', 1, col); }
      }
      c.def = { stairsUp: 2 };
    } else {
      const k = c.bridge ? 'third' : c.kind;
      const B = tileMat(k);
      const y = c.h;
      if (!c.bridge) B.quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], [0, 1, 0], undefined, col);
    }
    // side walls toward lower neighbours
    const top = c.wall || c.cliff ? c.top : c.stairs ? c.h : c.water ? c.h - 0.9 : c.bridge ? null : c.h;
    if (top === null || c.void) continue;
    for (const [dx, dz, n] of [[0, 1, [0, 0, 1]], [0, -1, [0, 0, -1]], [1, 0, [1, 0, 0]], [-1, 0, [-1, 0, 0]]]) {
      const nb = map.at(c.i + dx, c.j + dz);
      let low = nb ? (nb.wall || nb.cliff ? nb.h + (theme.wallH || 3) : nb.stairs ? nb.h : lowerOf(nb)) : (theme.edgeDrop ?? -2);
      if (nb && nb.stairs && c.wall !== true) { low = Math.min(low, nb.h); if (!(nb.stairs[0] === -dx && nb.stairs[1] === -dz)) low = nb.h; else low = nb.h + LV * 2; }
      if (nb && nb.bridge) low = nb.h - 0.9;
      if (low >= top - 0.01) continue;
      let a, b;
      if (dz === 1) { a = [x0, z1]; b = [x1, z1]; } else if (dz === -1) { a = [x1, z0]; b = [x0, z0]; } else if (dx === 1) { a = [x1, z1]; b = [x1, z0]; } else { a = [x0, z0]; b = [x0, z1]; }
      const hgt = top - low, B = wallB;
      const dark = [0.78, 0.78, 0.82];
      B.quad([a[0], low, a[1]], [b[0], low, b[1]], [b[0], top, b[1]], [a[0], top, a[1]], n, [[0, low], [1, low], [1, top], [0, top]], c.wall ? [1, 1, 1] : dark);
    }
  }
  // water surfaces
  const overWater = (c) => [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([a, b]) => { const n = map.at(c.i + a, c.j + b); return n && (n.water || (n.bridge && n !== c && false)); });
  for (const c of map.cells) if (c.bridge && overWater(c)) { c.overWater = true; const B = tileMat('third'); const y = c.h - 0.9; B.quad([c.i, y, c.j + 1], [c.i + 1, y, c.j + 1], [c.i + 1, y, c.j], [c.i, y, c.j], [0, 1, 0], undefined, [0.5, 0.55, 0.6]); }
  const waterCells = map.cells.filter(c => c.water || c.overWater);
  if (waterCells.length) {
    const wm = waterMaterial(theme.water || '#3a7ab8', theme.waterDeep || '#143a6a');
    const B = new Batch();
    for (const c of waterCells) { const y = c.h - 0.28; B.quad([c.i, y, c.j + 1], [c.i + 1, y, c.j + 1], [c.i + 1, y, c.j], [c.i, y, c.j], [0, 1, 0]); }
    const m = B.mesh(wm); m.castShadow = false; root.add(m); anims.push((t) => { wm.userData.time.value = t; });
  }
  // bridges: planks + rails
  const bridgeCells = map.cells.filter(c => c.bridge);
  if (bridgeCells.length) {
    const B = getB('bridge', () => std(tileTex('wood', theme.bridge || '#9a6a3c')));
    const R = getB('rail', () => std(tileTex('stonewall', theme.rail || '#b8b0a0')));
    for (const c of bridgeCells) {
      const y = c.h;
      boxBatch(B, c.i, y - 0.15, c.j, c.i + 1, y, c.j + 1, 'tsnewb');
      const horiz = c.bridge === '=';
      const nbA = horiz ? map.at(c.i, c.j - 1) : map.at(c.i - 1, c.j), nbB = horiz ? map.at(c.i, c.j + 1) : map.at(c.i + 1, c.j);
      if (horiz) {
        if (!nbA || nbA.water) boxBatch(R, c.i, y, c.j, c.i + 1, y + 0.55, c.j + 0.14, 'tsnew', 2);
        if (!nbB || nbB.water) boxBatch(R, c.i, y, c.j + 0.86, c.i + 1, y + 0.55, c.j + 1, 'tsnew', 2);
      } else {
        if (!nbA || nbA.water) boxBatch(R, c.i, y, c.j, c.i + 0.14, y + 0.55, c.j + 1, 'tsnew', 2);
        if (!nbB || nbB.water) boxBatch(R, c.i + 0.86, y, c.j, c.i + 1, y + 0.55, c.j + 1, 'tsnew', 2);
      }
    }
  }

  // ---------------------------------------------------------------- marks: houses and props
  const houseWall = {}, roofB = {};
  const winTex = windowTex(false), winLit = windowTex(true);
  const winMat = new THREE.MeshStandardMaterial({ map: winTex, roughness: 0.4, transparent: true, alphaTest: 0.5, emissive: '#ffb050', emissiveMap: winLit, emissiveIntensity: theme.night ? 1.4 : 0 });
  const winGeo = new THREE.PlaneGeometry(0.55, 0.75);
  const windows = [];
  const doorMat = new THREE.MeshStandardMaterial({ map: doorTex(), roughness: 0.9, transparent: true, alphaTest: 0.5 });

  const addLight = (x, y, z, color = '#ffc070', intensity = 6, dist = 7) => lights.push({ x, y, z, color, intensity, dist });

  const sprites = [];
  // trees and bushes share one texture per look and are drawn as instances
  const inst = new Map();
  const addInst = (kind, colors, x, z, y, scale) => {
    const key = kind + JSON.stringify(colors);
    if (!inst.has(key)) inst.set(key, { kind, colors, list: [] });
    inst.get(key).list.push([x, y, z, scale]);
  };
  const addSprite = (px, x, z, y = 0, scale = 1, opts = {}) => {
    const s = new Sprite(propCanvas(px), 1, { scale, ...opts });
    s.mesh.position.set(x, y, z); root.add(s.mesh); sprites.push(s); return s;
  };

  for (const c of map.cells) {
    const cx = c.i + 0.5, cz = c.j + 0.5, y = c.h;
    if (c.tree) {
      const kind = theme.tree || 'tree', base = (theme.treeColors || {}).leaf || '#4e8a3c';
      const v = rnd(), leaf = v < 0.33 ? base : v < 0.66 ? shade(base, -0.18) : shade(base, 0.14);
      addInst(kind, { ...(theme.treeColors || {}), leaf }, cx + (rnd() - 0.5) * 0.3, cz + (rnd() - 0.5) * 0.2, y, 1.05 + rnd() * 0.3);
      continue;
    }
    if (c.bush) { addInst('bush', { leaf: theme.bushColor || '#4a8a3a', flower: rnd() < 0.4 ? '#f47a7a' : null }, cx, cz, y, 1); continue; }
    for (const m of c.marks) {
    m.cell = c;
    switch (m.k) {
      case 'house': buildHouse(m, c); break;
      case 'lamp': {
        const s = addSprite(propPx('lamp'), cx + (m.dx || 0), cz + (m.dz || 0), y, 1);
        s.mat.emissive = new THREE.Color('#ffb050'); s.mat.emissiveMap = s.tex; s.mat.emissiveIntensity = theme.night ? 0.9 : 0.15;
        addLight(cx + (m.dx || 0), y + 2.2, cz + (m.dz || 0) + 0.2, '#ffc070', theme.night ? 10 : 2.5, 8);
        c.block = true; break;
      }
      case 'barrel': { const g = new THREE.CylinderGeometry(0.32, 0.28, 0.8, 10); const mm = new THREE.Mesh(g, std(tileTex('wood', '#8a5a30'))); mm.position.set(cx + (m.dx || 0), y + 0.4, cz + (m.dz || 0)); mm.castShadow = mm.receiveShadow = true; root.add(mm); for (const yy of [0.15, 0.65]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.03, 4, 12), new THREE.MeshStandardMaterial({ color: '#3a3a3a', metalness: 0.6, roughness: 0.5 })); r.rotation.x = Math.PI / 2; r.position.set(mm.position.x, y + yy, mm.position.z); root.add(r); } c.block = true; break; }
      case 'crate': { const s = m.s || 0.8; const mm = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), std(tileTex('wood', '#a87a48'))); mm.position.set(cx + (m.dx || 0), y + s / 2, cz + (m.dz || 0)); mm.rotation.y = (rnd() - 0.5) * 0.3; mm.castShadow = mm.receiveShadow = true; root.add(mm); c.block = true; break; }
      case 'tree': { addSprite(propPx(m.kind || theme.tree || 'tree', m.colors || theme.treeColors || {}), cx, cz, y, m.scale || 1.2); c.block = true; break; }
      case 'bush': { addSprite(propPx('bush', { leaf: m.leaf || theme.bushColor, flower: m.flower }), cx, cz, y, 1); c.block = !m.walk; break; }
      case 'flowers': { const s = addSprite(propPx('flowers', { color: m.color }), cx, cz, y + 0.01, 1, { shadow: false }); break; }
      case 'planter': {
        const mm = new THREE.Mesh(new THREE.BoxGeometry(m.w || 1.6, 0.5, 0.8), std(tileTex('brick', '#a89a88'))); mm.position.set(cx + ((m.w || 1.6) - 1) / 2, y + 0.25, cz); mm.castShadow = mm.receiveShadow = true; root.add(mm);
        for (let i = 0; i < (m.w || 1.6) * 2; i++) addSprite(propPx('bush', { leaf: '#3a7a3a', flower: m.flower || '#f46a4a' }), c.i + 0.2 + i * 0.5, cz, y + 0.45, 0.7);
        for (let i = 0; i < Math.ceil(m.w || 1.6); i++) { const cc = map.at(c.i + i, c.j); if (cc) cc.block = true; }
        break;
      }
      case 'sign': { addSprite(propPx('sign'), cx, cz, y, 1); c.block = true; interact.push({ c, text: m.text, kind: 'sign' }); break; }
      case 'board': {
        const g = new THREE.Group();
        const post = std(tileTex('wood', '#6a4428'));
        for (const sx of [-1.1, 1.1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.9, 0.14), post); p.position.set(sx, 0.95, 0); p.castShadow = true; g.add(p); }
        const frame = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.2, 0.1), post); frame.position.set(0, 1.25, 0); frame.castShadow = true; g.add(frame);
        const face = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.0), new THREE.MeshStandardMaterial({ map: boardTex(), roughness: 1 })); face.position.set(0, 1.25, 0.06); g.add(face);
        const roof = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 0.4), post); roof.position.set(0, 1.92, 0.05); roof.castShadow = true; g.add(roof);
        g.position.set(c.i + 1, y, cz); root.add(g);
        for (let i = -1; i <= 1; i++) { const cc = map.at(c.i + i + 1, c.j); if (cc) cc.block = true; }
        interact.push({ c, kind: 'board', id: m.id, text: m.text, w: 3, x0: c.i, x1: c.i + 3 });
        break;
      }
      case 'well': case 'fountain': {
        const ring = new THREE.Mesh(new THREE.CylinderGeometry(m.k === 'fountain' ? 1.4 : 0.7, m.k === 'fountain' ? 1.5 : 0.75, 0.6, 16, 1, true), std(tileTex('stonewall', '#b8b0a0'), { side: THREE.DoubleSide }));
        ring.position.set(cx + (m.k === 'fountain' ? 0.5 : 0), y + 0.3, cz + (m.k === 'fountain' ? 0.5 : 0)); ring.castShadow = ring.receiveShadow = true; root.add(ring);
        const wtr = new THREE.Mesh(new THREE.CircleGeometry(m.k === 'fountain' ? 1.35 : 0.65, 16), waterMaterial('#4a9ad8', '#1a4a8a')); wtr.rotation.x = -Math.PI / 2; wtr.position.set(ring.position.x, y + 0.45, ring.position.z); root.add(wtr);
        anims.push((t) => { wtr.material.userData.time.value = t; });
        if (m.k === 'fountain') {
          const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 1.6, 8), std(tileTex('temple', '#d8d4c8'))); pil.position.set(ring.position.x, y + 0.8, ring.position.z); pil.castShadow = true; root.add(pil);
          const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.3, 0.25, 12), std(tileTex('temple', '#d8d4c8'))); bowl.position.set(ring.position.x, y + 1.6, ring.position.z); bowl.castShadow = true; root.add(bowl);
          anims.push({ fountain: [ring.position.x, y + 1.75, ring.position.z] });
          for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const cc = map.at(c.i + a, c.j + b); if (cc) cc.block = true; }
        } else c.block = true;
        break;
      }
      case 'statue': {
        const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 1.2), std(tileTex('temple', '#c8c4b8'))); base.position.set(cx, y + 0.35, cz); base.castShadow = base.receiveShadow = true; root.add(base);
        const fig = { skin: '#c8c4b8', hair: '#a8a49a', hairStyle: m.hair || 'long', top: '#b8b4aa', legs: '#a8a49a', boots: '#989488', cape: '#b0aca0', weapon: m.weapon || 'sword', shield: m.shield };
        addSprite(personFrame(fig, 'down'), cx, cz, y + 0.7, 1.6);
        c.block = true; interact.push({ c, kind: 'sign', text: m.text }); break;
      }
      case 'crystal': {
        // save crystal: a glowing octahedron with a ring of motes
        const mat = new THREE.MeshStandardMaterial({ color: m.color || '#8ae8ff', emissive: m.color || '#4ac8ff', emissiveIntensity: 1.4, transparent: true, opacity: 0.85, roughness: 0.1, metalness: 0.2, flatShading: true });
        const cr = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), mat); cr.scale.set(1, 1.6, 1); cr.position.set(cx, y + 1.1, cz); root.add(cr);
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.18, 8), std(tileTex('temple', '#c8d0d8'))); base.position.set(cx, y + 0.09, cz); base.receiveShadow = true; root.add(base);
        anims.push((t) => { cr.rotation.y = t * 0.8; cr.position.y = y + 1.1 + Math.sin(t * 1.6) * 0.08; });
        addLight(cx, y + 1.4, cz, m.color || '#6ad8ff', 5, 6);
        c.block = true; interact.push({ c, kind: 'save' }); anims.push({ sparkle: [cx, y + 1.1, cz, m.color || '#8ae8ff'] });
        break;
      }
      case 'bigcrystal': {
        const mat = new THREE.MeshStandardMaterial({ color: m.color || '#8ae8ff', emissive: m.color || '#4ac8ff', emissiveIntensity: m.dim ? 0.2 : 1.2, transparent: true, opacity: 0.88, roughness: 0.1, flatShading: true });
        const cr = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), mat); cr.scale.set(0.9, 2.2, 0.9); cr.position.set(cx + 0.5, y + 2.6, cz + 0.5); root.add(cr);
        anims.push((t) => { cr.rotation.y = t * 0.3; cr.position.y = y + 2.6 + Math.sin(t) * 0.12; });
        addLight(cx + 0.5, y + 2.5, cz + 0.8, m.color || '#6ad8ff', m.dim ? 2 : 9, 10);
        for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const cc = map.at(c.i + a, c.j + b); if (cc) cc.block = true; }
        props.push({ id: m.id || 'bigcrystal', mesh: cr, mat });
        anims.push({ sparkle: [cx + 0.5, y + 2.6, cz + 0.5, m.color || '#8ae8ff'] });
        break;
      }
      case 'chest': {
        const g = new THREE.Group(); const wood = std(tileTex('wood', m.color || '#9a5a2a')); const gold = new THREE.MeshStandardMaterial({ color: '#e8c050', metalness: 0.8, roughness: 0.3 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.45, 0.55), wood); body.position.y = 0.225; body.castShadow = true; g.add(body);
        const lidP = new THREE.Group(); lidP.position.set(0, 0.45, -0.275); g.add(lidP);
        const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.275, 0.275, 0.8, 8, 1, false, 0, Math.PI), wood); lid.rotation.z = Math.PI / 2; lid.rotation.y = Math.PI / 2; lid.position.set(0, 0, 0.275); lid.castShadow = true; lidP.add(lid);
        const band = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.05), gold); band.position.set(0, 0.42, 0.29); g.add(band);
        for (const sx of [-0.36, 0.36]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.46, 0.57), gold); b.position.set(sx, 0.23, 0); g.add(b); }
        g.position.set(cx, y, cz); root.add(g); c.block = true;
        const ch = { c, kind: 'chest', id: m.id, item: m.item, gil: m.gil, lidP, open: false };
        interact.push(ch); props.push({ id: m.id, chest: ch });
        break;
      }
      case 'fence': {
        const wood = std(tileTex('wood', '#8a6038'));
        const len = m.len || 1, horiz = m.dir !== 'v';
        for (let i = 0; i <= len; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 0.1), wood); p.position.set(horiz ? c.i + i : cx, y + 0.35, horiz ? cz : c.j + i); p.castShadow = true; root.add(p); }
        for (const hy of [0.25, 0.55]) { const r = new THREE.Mesh(new THREE.BoxGeometry(horiz ? len : 0.06, 0.08, horiz ? 0.06 : len), wood); r.position.set(horiz ? c.i + len / 2 : cx, y + hy, horiz ? cz : c.j + len / 2); r.castShadow = true; root.add(r); }
        for (let i = 0; i < len; i++) { const cc = horiz ? map.at(c.i + i, c.j) : map.at(c.i, c.j + i); if (cc) cc.block = true; }
        break;
      }
      case 'wallrail': {
        // low stone parapet like the canal walls
        const st = std(tileTex('stonewall', theme.rail || '#c8c0b0'));
        const len = m.len || 1, horiz = m.dir !== 'v';
        const mm = new THREE.Mesh(new THREE.BoxGeometry(horiz ? len : 0.35, 0.6, horiz ? 0.35 : len), st);
        mm.position.set(horiz ? c.i + len / 2 : cx, y + 0.3, horiz ? cz : c.j + len / 2); mm.castShadow = mm.receiveShadow = true; root.add(mm);
        for (let i = 0; i < len; i++) { const cc = horiz ? map.at(c.i + i, c.j) : map.at(c.i, c.j + i); if (cc) cc.block = true; }
        break;
      }
      case 'stall': {
        // a market stall with a striped awning; the keeper stands behind it
        const wood = std(tileTex('wood', '#9a6a3c'));
        const counter = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 0.7), wood); counter.position.set(c.i + 1, y + 0.4, cz); counter.castShadow = counter.receiveShadow = true; root.add(counter);
        for (const sx of [0.05, 1.95]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.1, 0.08), wood); p.position.set(c.i + sx, y + 1.05, cz + 0.3); p.castShadow = true; root.add(p); }
        const ac = document.createElement('canvas'); ac.width = 16; ac.height = 4; const ag = ac.getContext('2d'); for (let i = 0; i < 8; i++) { ag.fillStyle = i % 2 ? '#f4f0e4' : (m.color || '#c84a4a'); ag.fillRect(i * 2, 0, 2, 4); }
        const awn = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.1), new THREE.MeshStandardMaterial({ map: texFrom(ac), side: THREE.DoubleSide, roughness: 1 }));
        awn.position.set(c.i + 1, y + 2.0, cz - 0.1); awn.rotation.x = -1.0; awn.castShadow = true; root.add(awn);
        // goods on the counter
        const goodsCol = m.goods || ['#e85a3a', '#f4c04a', '#6ac84a'];
        for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 4), new THREE.MeshStandardMaterial({ color: goodsCol[i % goodsCol.length], roughness: 0.6 })); b.position.set(c.i + 0.4 + i * 0.3, y + 0.88, cz + 0.1); root.add(b); }
        for (let i = 0; i < 2; i++) { const cc = map.at(c.i + i, c.j); if (cc) cc.block = true; }
        if (m.sign) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), new THREE.MeshStandardMaterial({ map: signTex(m.sign), transparent: true, alphaTest: 0.5 })); s.position.set(c.i + 1, y + 2.35, cz + 0.35); root.add(s); }
        break;
      }
      case 'ship': {
        // a moored sailing ship
        const wood = std(tileTex('wood', '#7a4a28'));
        const hull = new THREE.Mesh(new THREE.BoxGeometry(m.len || 7, 1.4, 2.2), wood); hull.position.set(c.i + (m.len || 7) / 2, y - 0.2, cz); hull.castShadow = hull.receiveShadow = true; root.add(hull);
        const deck = new THREE.Mesh(new THREE.BoxGeometry((m.len || 7) - 0.4, 0.1, 2.0), std(tileTex('wood', '#b88a58'))); deck.position.set(hull.position.x, y + 0.52, cz); deck.receiveShadow = true; root.add(deck);
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 6, 8), wood); mast.position.set(hull.position.x, y + 3.5, cz); mast.castShadow = true; root.add(mast);
        const sail = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 3.0), new THREE.MeshStandardMaterial({ color: '#f4eee0', side: THREE.DoubleSide, roughness: 1 })); sail.position.set(hull.position.x, y + 3.8, cz); sail.rotation.y = Math.PI / 2; sail.userData.base = Math.PI / 2; sail.castShadow = true; root.add(sail);
        anims.push((t) => { sail.rotation.y = Math.PI / 2 + Math.sin(t * 0.6) * 0.06; hull.position.y = y - 0.2 + Math.sin(t * 0.9) * 0.04; deck.position.y = y + 0.52 + Math.sin(t * 0.9) * 0.04; });
        break;
      }
      case 'airship': {
        const g = new THREE.Group();
        const wood = std(tileTex('wood', '#8a5a30')), metal = std(tileTex('metal', '#8a7a5a'), { metalness: 0.5, roughness: 0.4 });
        const hull = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.6, 5, 10), wood); hull.rotation.z = Math.PI / 2; hull.castShadow = true; g.add(hull);
        const bal = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 10), new THREE.MeshStandardMaterial({ color: '#e8d8b0', roughness: 0.8 })); bal.scale.set(2.2, 0.9, 1); bal.position.y = 2.3; bal.castShadow = true; g.add(bal);
        for (const sx of [-1.5, 1.5]) { const p = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.06, 4, 10), metal); p.position.set(sx, 0.4, 1.2); g.add(p); }
        for (const sx of [-1.8, 0, 1.8]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 4), metal); r.position.set(sx, 1.3, 0); g.add(r); }
        g.position.set(cx, y + (m.fly ? 1.8 : 1.2), cz); root.add(g);
        anims.push((t) => { g.position.y = y + (m.fly ? 1.8 : 1.2) + Math.sin(t * 1.2) * 0.1; });
        props.push({ id: 'airship', mesh: g });
        if (!m.walk) for (let a = -2; a <= 2; a++) { const cc = map.at(c.i + a, c.j); if (cc) cc.block = true; }
        break;
      }
      case 'pillar': {
        const pm = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, m.h || 3, 10), std(tileTex(theme.pillar ? theme.pillar[0] : 'temple', theme.pillar ? theme.pillar[1] : '#d8d4c8')));
        pm.position.set(cx, y + (m.h || 3) / 2, cz); pm.castShadow = pm.receiveShadow = true; root.add(pm);
        if (m.broken) pm.scale.y = 0.5, pm.position.y = y + (m.h || 3) / 4;
        c.block = true; break;
      }
      case 'torch': {
        const s = addSprite(propPx('lamp'), cx, cz, y, 0.8);
        s.mat.emissive = new THREE.Color('#ff8a30'); s.mat.emissiveMap = s.tex; s.mat.emissiveIntensity = 1;
        addLight(cx, y + 1.8, cz + 0.3, '#ff9a40', 8, 7); anims.push({ flame: [cx, y + 1.95, cz] });
        c.block = true; break;
      }
      case 'rock': addSprite(propPx('rock', { color: m.color }), cx, cz, y, m.scale || 1); c.block = !m.walk; break;
      case 'reeds': addSprite(propPx('reeds'), cx, cz, y, 1, { shadow: false }); break;
      case 'deco': { if (m.sprite) addSprite(propPx(m.sprite, m.colors || {}), cx, cz, y, m.scale || 1); c.block = !!m.block; break; }
      case 'bed': {
        const g = new THREE.Group(); const wood = std(tileTex('wood', '#8a5a30'));
        const fr = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 1.8), wood); fr.position.y = 0.2; fr.castShadow = true; g.add(fr);
        const sh = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.12, 1.3), new THREE.MeshStandardMaterial({ color: m.color || '#c84a4a', roughness: 1 })); sh.position.set(0, 0.46, 0.2); g.add(sh);
        const pl = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.14, 0.35), new THREE.MeshStandardMaterial({ color: '#f4f0e4', roughness: 1 })); pl.position.set(0, 0.47, -0.6); g.add(pl);
        g.position.set(cx, y, cz + 0.5); root.add(g); c.block = true; const c2 = map.at(c.i, c.j + 1); if (c2) c2.block = true; break;
      }
      case 'table': {
        const wood = std(tileTex('wood', '#9a6a3c'));
        const t = new THREE.Mesh(new THREE.BoxGeometry(m.w || 1.6, 0.1, 0.9), wood); t.position.set(cx + ((m.w || 1.6) - 1) / 2, y + 0.75, cz); t.castShadow = true; root.add(t);
        for (const [sx, sz] of [[-0.7, -0.35], [0.7, -0.35], [-0.7, 0.35], [0.7, 0.35]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.75, 0.08), wood); l.position.set(t.position.x + sx * (m.w || 1.6) / 1.6, y + 0.375, cz + sz); root.add(l); }
        for (let i = 0; i < Math.ceil(m.w || 1.6); i++) { const cc = map.at(c.i + i, c.j); if (cc) cc.block = true; }
        break;
      }
      case 'shelf': {
        const wood = std(tileTex('wood', '#7a4a28'));
        const sb = new THREE.Mesh(new THREE.BoxGeometry(m.w || 2, 2.2, 0.5), wood); sb.position.set(c.i + (m.w || 2) / 2, y + 1.1, cz - 0.2); sb.castShadow = sb.receiveShadow = true; root.add(sb);
        for (let r = 0; r < 3; r++) for (let i = 0; i < (m.w || 2) * 3; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.3), new THREE.MeshStandardMaterial({ color: ['#c84a4a', '#4a7ac8', '#4ac86a', '#e8c050', '#8a4ac8'][(i + r) % 5], roughness: 0.8 })); b.position.set(c.i + 0.2 + i * 0.3, y + 0.5 + r * 0.65, cz + 0.06); root.add(b); }
        for (let i = 0; i < (m.w || 2); i++) { const cc = map.at(c.i + i, c.j); if (cc) cc.block = true; }
        break;
      }
      case 'gear': {
        const gm = new THREE.Mesh(new THREE.TorusGeometry(m.r || 1, 0.25, 6, 12), std(tileTex('metal', '#8a7a5a'), { metalness: 0.6, roughness: 0.4 }));
        gm.position.set(cx, y + (m.r || 1) + 0.3, cz); gm.castShadow = true; root.add(gm); anims.push((t) => { gm.rotation.z = t * (m.spin || 0.5); });
        if (m.block !== false) c.block = true; break;
      }
      case 'smoke': anims.push({ smoke: [cx, y + (m.y || 3), cz] }); break;
      case 'light': addLight(cx, y + (m.y || 2), cz, m.color || '#ffc070', m.i || 6, m.d || 8); break;
      case 'town': case 'dungeon': case 'spot': buildIcon(m, c); break;
      default: break;
    }
    }
  }

  function buildHouse(m, c) {
    const w = m.w || 4, d = m.d || 3, h = m.h || 2.4, x0 = c.i, z0 = c.j, y = c.h;
    const wk = m.wall || theme.houseWall || ['plaster', '#e8dcc0'];
    const key = wk.join();
    const B = houseWall[key] || (houseWall[key] = getB('hw_' + key, () => std(tileTex(wk[0], wk[1], wk[2]))));
    const base = getB('hbase', () => std(tileTex('stonewall', '#a8a094')));
    boxBatch(base, x0, y, z0, x0 + w, y + 0.5, z0 + d, 'snew', 1);
    boxBatch(B, x0, y + 0.5, z0, x0 + w, y + h, z0 + d, 'snew', 1);
    // gable roof along x
    const rc = m.roof || theme.roof || '#3a74b8';
    const R = roofB[rc] || (roofB[rc] = getB('roof_' + rc, () => std(tileTex('roof', rc), { side: THREE.DoubleSide })));
    const oh = 0.35, rh = m.rh || d * 0.55, ry = y + h, zm = z0 + d / 2;
    const rx0 = x0 - oh, rx1 = x0 + w + oh;
    const slope = Math.hypot(d / 2 + oh, rh);
    R.quad([rx0, ry - oh * rh / (d / 2), z0 + d + oh], [rx1, ry - oh * rh / (d / 2), z0 + d + oh], [rx1, ry + rh, zm], [rx0, ry + rh, zm], [0, d / 2, rh].map(v => v / Math.hypot(d / 2, rh)), [[0, 0], [w + oh * 2, 0], [w + oh * 2, slope], [0, slope]]);
    R.quad([rx1, ry - oh * rh / (d / 2), z0 - oh], [rx0, ry - oh * rh / (d / 2), z0 - oh], [rx0, ry + rh, zm], [rx1, ry + rh, zm], [0, d / 2, -rh].map(v => v / Math.hypot(d / 2, rh)), [[0, 0], [w + oh * 2, 0], [w + oh * 2, slope], [0, slope]]);
    // gable ends
    for (const [xx, n] of [[x0, -1], [x0 + w, 1]]) {
      const P = n > 0 ? [[xx, ry, z0 + d], [xx, ry, z0], [xx, ry + rh, zm]] : [[xx, ry, z0], [xx, ry, z0 + d], [xx, ry + rh, zm]];
      for (const v of P) B.P.push(...v), B.N.push(n, 0, 0), B.C.push(1, 1, 1);
      B.U.push(0, 0, d, 0, d / 2, rh);
    }
    // windows and door on the south face (toward camera); a few on the sides
    const doorX = m.door ?? Math.floor(w / 2);
    const fz = z0 + d + 0.02;
    if (m.door !== -1) {
      const dm = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.35), doorMat); dm.position.set(x0 + doorX + 0.5, y + 0.5 + 0.67, fz); root.add(dm);
      // step
      const st = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.15, 0.3), std(tileTex('stonewall', '#b8b0a0'))); st.position.set(x0 + doorX + 0.5, y + 0.075, fz + 0.12); st.receiveShadow = true; root.add(st);
      if (m.lamp !== false) { addLight(x0 + doorX + 0.5, y + 2.1, fz + 0.5, '#ffb860', theme.night ? 4 : 0.8, 4); }
    }
    for (let i = 0; i < w; i++) {
      if (i === doorX && m.door !== -1) continue;
      if ((i + (m.winOff || 0)) % 2 === 0 || w <= 3) {
        const wm = new THREE.Mesh(winGeo, winMat); wm.position.set(x0 + i + 0.5, y + 1.45, fz); root.add(wm); windows.push(wm);
        if (m.flowers !== false && rnd() < 0.5) { const fb = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.14, 0.18), std(tileTex('wood', '#7a4a28'))); fb.position.set(x0 + i + 0.5, y + 1.02, fz + 0.09); root.add(fb); addSprite(propPx('flowers', {}), x0 + i + 0.5, fz + 0.1, y + 1.06, 0.6, { shadow: false }); }
      }
    }
    for (const [xx, n] of [[x0 - 0.02, -1], [x0 + w + 0.02, 1]]) {
      for (let k = 1; k < d - 0.5; k += 2) { const wm = new THREE.Mesh(winGeo, winMat); wm.rotation.y = n * Math.PI / 2; wm.position.set(xx, y + 1.45, z0 + k + 0.5); root.add(wm); }
    }
    // dormers
    if (m.dormers) for (const dx of m.dormers) {
      const dw = 0.9, dh = 0.9, dzp = z0 + d / 2 + 0.5;
      boxBatch(B, x0 + dx, ry + rh * 0.35, dzp - 0.3, x0 + dx + dw, ry + rh * 0.35 + dh, dzp + 0.6, 'snew');
      const wm = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.6), winMat); wm.position.set(x0 + dx + dw / 2, ry + rh * 0.35 + dh / 2, dzp + 0.62); root.add(wm);
      R.quad([x0 + dx - 0.12, ry + rh * 0.35 + dh, dzp + 0.75], [x0 + dx + dw + 0.12, ry + rh * 0.35 + dh, dzp + 0.75], [x0 + dx + dw + 0.12, ry + rh * 0.35 + dh + 0.45, dzp - 0.1], [x0 + dx - 0.12, ry + rh * 0.35 + dh + 0.45, dzp - 0.1], [0, 0.8, 0.6], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    }
    if (m.chimney) { const ch = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.5), std(tileTex('brick', '#a86a4a'))); ch.position.set(x0 + m.chimney, ry + rh * 0.8, zm - 0.3); ch.castShadow = true; root.add(ch); anims.push({ smoke: [ch.position.x, ry + rh * 0.8 + 0.8, ch.position.z] }); }
    if (m.sign) {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshStandardMaterial({ map: signTex(m.sign), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }));
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.6), std(tileTex('wood', '#3a2a1a')));
      const sx = x0 + doorX + (doorX + 1 < w ? 1.4 : -0.4);
      bar.position.set(sx, y + 2.15, fz + 0.3); root.add(bar);
      s.position.set(sx, y + 1.8, fz + 0.5); s.rotation.y = Math.PI / 2; root.add(s);
    }
    // block cells; the door cell becomes an interaction point
    for (let j = 0; j < d; j++) for (let i = 0; i < w; i++) { const cc = map.at(x0 + i, z0 + j); if (cc) cc.block = true; }
    if (m.door !== -1) interact.push({ kind: 'door', c: map.at(x0 + doorX, z0 + d - 1), x: x0 + doorX + 0.5, z: z0 + d + 0.5, m });
  }

  function buildIcon(m, c) {
    // tiny buildings on the world map
    const g = new THREE.Group(); const cx = c.i + 0.5, cz = c.j + 0.5;
    if (m.k === 'town') {
      const wall = std(tileTex('plaster', m.wallColor || '#e8dcc0')), roof = std(tileTex('roof', m.roof || '#3a74b8'));
      const spots = [[-0.6, -0.3, 0.8], [0.5, -0.5, 0.9], [0, 0.4, 0.7], [0.7, 0.4, 0.6], [-0.7, 0.5, 0.6]];
      for (const [dx, dz, s] of spots) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.7 * s, 0.6 * s, 0.6 * s), wall); b.position.set(dx, 0.3 * s, dz); b.castShadow = true; g.add(b);
        const r = new THREE.Mesh(new THREE.ConeGeometry(0.55 * s, 0.5 * s, 4), roof); r.rotation.y = Math.PI / 4; r.position.set(dx, 0.6 * s + 0.25 * s, dz); r.castShadow = true; g.add(r);
      }
      if (m.tower) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 1.6, 8), wall); t.position.set(0.1, 0.8, -0.1); t.castShadow = true; g.add(t); const tr = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 8), roof); tr.position.set(0.1, 1.9, -0.1); g.add(tr); }
    } else if (m.k === 'dungeon') {
      const st = std(tileTex(m.tile || 'stonewall', m.color || '#8a8478'));
      if (m.style === 'cave') { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9, 0), st); r.scale.set(1.2, 0.8, 1); r.position.y = 0.5; r.castShadow = true; g.add(r); const hole = new THREE.Mesh(new THREE.CircleGeometry(0.35, 10), new THREE.MeshBasicMaterial({ color: '#0a0610' })); hole.position.set(0, 0.35, 0.82); g.add(hole); }
      else if (m.style === 'forest') { for (let i = 0; i < 5; i++) { const s = new Sprite(propCanvas(propPx('pine', { leaf: '#2a5a3a' })), 1, { scale: 0.7 }); s.mesh.position.set((i - 2) * 0.35, 0, (i % 2) * 0.3 - 0.15); g.add(s.mesh); sprites.push(s); } }
      else { for (const dx of [-0.6, 0.6]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.4, 8), st); p.position.set(dx, 0.7, 0); p.castShadow = true; g.add(p); } const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 0.4), st); top.position.y = 1.45; top.castShadow = true; g.add(top); if (m.style === 'sanctum') { const cr = new THREE.Mesh(new THREE.OctahedronGeometry(0.25, 0), new THREE.MeshStandardMaterial({ color: '#ffe8a0', emissive: '#ffc84a', emissiveIntensity: 1.2 })); cr.scale.y = 1.6; cr.position.y = 0.8; g.add(cr); anims.push((t) => { cr.rotation.y = t; }); } }
    }
    g.position.set(cx, c.h, cz); root.add(g);
    c.block = false; c.spot = m;
  }

  // instanced sprite props
  const billboards = [];
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.18, 0, 0)), M = new THREE.Matrix4();
  for (const { kind, colors, list } of inst.values()) {
    const px = propPx(kind, colors), tex = texFrom(propCanvas(px));
    const w = px.w / 16, h = px.h / 16;
    const g = new THREE.PlaneGeometry(w, h); g.translate(0, h / 2, 0);
    const mat = spriteMaterial(tex);
    const im = new THREE.InstancedMesh(g, mat, list.length);
    list.forEach(([x, y, z, sc], i) => { M.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sc, sc, sc)); im.setMatrixAt(i, M); });
    im.castShadow = true; im.customDepthMaterial = depthMat(tex);
    root.add(im); billboards.push({ im, list });
  }
  // turn every flat sprite toward the camera's heading
  let curYaw = 0;
  for (const b of billboards) b.tilt = new Float32Array(b.list.length).fill(-0.18);
  for (const s of sprites) s.baseX = s.mesh.rotation.x;
  const E = new THREE.Euler(0, 0, 'YXZ'), qq = new THREE.Quaternion(), V = new THREE.Vector3(), SC = new THREE.Vector3();
  const faceYaw = (yaw) => {
    curYaw = yaw;
    for (const { im, list, tilt } of billboards) { list.forEach(([x, y, z, sc], i) => { qq.setFromEuler(E.set(tilt[i], yaw, 0, 'YXZ')); M.compose(V.set(x, y, z), qq, SC.set(sc, sc, sc)); im.setMatrixAt(i, M); }); im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere?.(); }
    for (const s of sprites) if (s.mesh.rotation.x !== 0 || s.lean !== false) s.mesh.rotation.set(s.mesh.rotation.x, yaw, 0, 'YXZ');
  };
  // pop-up book: everything starts folded flat and stands up in a wave spreading from (cx, cz). returns false once all are up
  const popUp = (t, cx, cz) => {
    const amt = (x, z) => { const d = Math.hypot(x - cx, z - cz); if (d > 26) return t > 0 ? 1 : 0; const p = Math.max(0, Math.min(1, (t * 13 - d) / 4)); return p >= 1 ? 1 : easeBack(p); };
    let busy = false;
    for (const b of billboards) b.list.forEach(([x, , z], i) => { const a = amt(x, z); if (a < 1) busy = true; b.tilt[i] = -0.18 - (Math.PI / 2 - 0.18) * (1 - a); });
    for (const s of sprites) { const a = amt(s.mesh.position.x, s.mesh.position.z); if (a < 1) busy = true; s.mesh.rotation.x = s.baseX - (Math.PI / 2 + s.baseX) * (1 - a); }
    faceYaw(curYaw);
    return busy;
  };
  // build batched meshes
  for (const k in batches) { const mesh = batches[k].mesh(mats[k]); if (mesh) root.add(mesh); }
  // invisible floor far below for the void
  return { root, lights, interact, props, anims, sprites, windows, winMat, faceYaw, popUp };
}
