// How every weapon art and every spell looks. Nothing is drawn by hand per skill: each one is read from what it is
// (its weapon, its element, its tier, single or all, a chain, a mark, a field, how many hits, the status it brings)
// and put together from a small set of pieces: magic circles, projectiles, slashes, pillars, spikes, bolts, spirals,
// rings, shards, rain and particles drawn in or out. So a level-1 fire spell is a fireball, a level-5 one a meteor,
// a sword art an arc of light, a hammer art a shockwave, a bow art real arrows.
import * as THREE from '../lib/three.module.min.js';
import { ELEM_COLOR } from './data.js?v=19';

const TAU = Math.PI * 2;
const STAT_COL = { atk: '#ff6a5a', def: '#5a9aff', mag: '#c86aff', spr: '#5ae8e8', spd: '#7aff8a' };
const STATUS_COL = { poison: '#8aff5a', sleep: '#8aa8ff', silence: '#c8c8d8', blind: '#4a4a5a', slow: '#8ad8ff', stun: '#ffe04a', stop: '#a8c8ff', doom: '#b06aff', confuse: '#ff8ae8', curse: '#9a4aff', frozen: '#bdf0ff' };
const ART_COL = { sword: '#dff0ff', greatsword: '#ffe8c8', dagger: '#e8f8ff', katana: '#ffffff', spear: '#e8eeff', axe: '#ffd0a0', hammer: '#ffe08a', knuckle: '#ffb07a', whip: '#ff9ad8', boomerang: '#c8ffb0', bow: '#f4e8c8', gun: '#ffe8a0', staff: '#fff4b0', rod: '#c8a0ff', tome: '#f8f4e8', harp: '#ffb0d8', shield: '#9ac8ff' };
const RANGED_ART = new Set(['bow', 'gun', 'boomerang', 'rod', 'tome', 'harp']);

let circleTexture = null;
function circleTex() { // a white magic circle: rings, a hexagram and runes; tinted by the material colour
  if (circleTexture) return circleTexture;
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.translate(128, 128); g.strokeStyle = '#fff'; g.fillStyle = '#fff';
  const ring = (r, w) => { g.lineWidth = w; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke(); };
  ring(122, 5); ring(108, 2); ring(70, 3); ring(30, 2);
  for (const off of [0, Math.PI / 3]) { g.lineWidth = 3; g.beginPath(); for (let i = 0; i <= 3; i++) { const a = off + i * TAU / 3 - Math.PI / 2; g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * 106, Math.sin(a) * 106); } g.stroke(); }
  for (let i = 0; i < 24; i++) { const a = i * TAU / 24; g.save(); g.rotate(a); g.fillRect(-2, -118, 4, i % 2 ? 6 : 10); g.restore(); }
  for (let i = 0; i < 8; i++) { const a = i * TAU / 8; g.beginPath(); g.arc(Math.cos(a) * 89, Math.sin(a) * 89, 6, 0, TAU); g.stroke(); }
  circleTexture = new THREE.CanvasTexture(c); return circleTexture;
}
const mat = (color, o = {}) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: o.opacity ?? 1, blending: o.solid ? THREE.NormalBlending : THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, map: o.map || null, wireframe: !!o.wire });
const solid = (color, o = {}) => new THREE.MeshStandardMaterial({ color, emissive: new THREE.Color(color).multiplyScalar(o.glow ?? 0.35), roughness: o.rough ?? 0.4, metalness: 0.1, transparent: true, opacity: o.opacity ?? 1, flatShading: true });
const lerp = (a, b, k) => a + (b - a) * k;
const ease = (k) => 1 - (1 - k) * (1 - k);

// what kind of picture a skill is
export function lookOf(S) {
  if (S._look) return S._look;
  const el = S.el ? [].concat(S.el) : [];
  const L = { el: el[0], el2: el[1], tier: S.tier || 1 + Math.min(4, S.lvl || 0), all: S.tgt === 'enemies' || S.tgt === 'allies', hits: S.hits || 1 };
  if (S.art) { L.kind = 'art'; L.wpn = S.art; L.tier = 1 + (S.lvl || 0); L.ranged = RANGED_ART.has(S.art) || !!S.ranged; }
  else if (S.school) {
    L.kind = S.type === 'heal' ? 'heal' : S.type === 'buff' ? 'buff' : S.type === 'debuff' ? 'debuff' : S.type === 'special' ? 'special' : 'spell';
    L.form = S.school === 'time' && S.pierce && S.tgt === 'enemies' ? 'clock' : S.mark ? 'mark' : S.chain ? 'chain' : S.field ? 'field' : S.delay ? 'delay' : S.burst ? 'burst' : el.length > 1 ? 'duo' : S.gravity ? 'gravity' : S.osmose || S.drain ? 'drain' : S.mpBurst ? 'flare' : S.anim === 'meteor' || S.pierce && S.school === 'time' ? 'meteor' : 'plain';
    if (el.length > 1) L.tier = Math.min(5, S.tier + (S.hits ? 1 : 0));
  } else L.kind = 'other';
  return (S._look = L);
}

export class SkillFx {
  constructor(b) { this.b = b; this.scene = b.scene; this.list = []; this.last = null; }
  get P() { return this.b.fx; }
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const a = this.list[i]; a.t += dt; const k = Math.min(1, a.t / a.dur);
      if (a.t >= a.delay) a.step?.(Math.min(1, (a.t - a.delay) / (a.dur - a.delay || 1)), dt);
      if (k >= 1) { this.list.splice(i, 1); a.end?.(); for (const m of a.meshes || []) { this.scene.remove(m); m.geometry?.dispose(); m.material?.dispose(); } a.done?.(); }
    }
  }
  clear() { for (const a of this.list) for (const m of a.meshes || []) { this.scene.remove(m); m.geometry?.dispose(); m.material?.dispose(); } this.list = []; }
  // run step(k) for dur seconds (after an optional delay); meshes are removed at the end
  tween(dur, step, o = {}) { return new Promise((done) => { const d = o.delay || 0; this.list.push({ t: 0, dur: dur + d, delay: d, step, end: o.end, meshes: o.meshes || [], done }); }); }
  add(geo, material, x, y, z) { const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); m.renderOrder = 6; this.scene.add(m); return m; }
  raw(x, y, z, vx, vy, vz, o = {}) {
    const P = this.P; if (P.p.length >= P.max) P.p.shift(); const c = new THREE.Color(o.color || '#fff');
    P.p.push({ x, y, z, vx, vy, vz, life: o.life || 0.5, t: 0, size: o.size || 0.2, g: o.g ?? 0, r: c.r, gg: c.g, b: c.b, drag: o.drag ?? 0 });
  }
  emit(o) { this.P.emit(o); }

  // ---------------------------------------------------------------- pieces
  circle(x, z, o = {}) { // a magic circle on the ground (or standing up, facing the camera)
    const r = o.r || 1.2, dur = o.dur || 0.6, m = this.add(new THREE.PlaneGeometry(2, 2), mat(o.color || '#fff', { map: circleTex() }), x, o.y ?? 0.04, z);
    if (!o.stand) m.rotation.x = -Math.PI / 2;
    return this.tween(dur, (k) => { const s = r * (k < 0.2 ? ease(k / 0.2) : 1); m.scale.set(s, s, s); m.rotation[o.stand ? 'z' : 'z'] += 0.03 * (o.spin ?? 1); m.material.opacity = k > 0.7 ? (1 - k) / 0.3 : 1; }, { meshes: [m], delay: o.delay });
  }
  ring(x, y, z, o = {}) { // an expanding ring, flat on the ground unless o.stand
    const m = this.add(new THREE.RingGeometry(0.86, 1, 56), mat(o.color || '#fff'), x, y, z); if (!o.stand) m.rotation.x = -Math.PI / 2;
    const r0 = o.r0 ?? 0.2, r1 = o.r1 ?? 2.4;
    return this.tween(o.dur || 0.45, (k) => { const s = lerp(r0, r1, ease(k)); m.scale.set(s, s, s); m.material.opacity = 1 - k; }, { meshes: [m], delay: o.delay });
  }
  pillar(x, z, o = {}) { // a column of light rising from the ground
    const h = o.h || 5, r = o.r || 0.6, g = new THREE.CylinderGeometry(r, r, h, 28, 1, true); g.translate(0, h / 2, 0);
    const g2 = new THREE.CylinderGeometry(r * 0.45, r * 0.45, h, 20, 1, true); g2.translate(0, h / 2, 0);
    const a = this.add(g, mat(o.color || '#fff', { opacity: 0.7 }), x, 0, z), b = this.add(g2, mat('#ffffff', { opacity: 0.9 }), x, 0, z);
    return this.tween(o.dur || 0.7, (k) => { const w = k < 0.2 ? ease(k / 0.2) : 1 - ease((k - 0.2) / 0.8) * 0.9; a.scale.set(w, k < 0.2 ? k / 0.2 : 1, w); b.scale.copy(a.scale); a.material.opacity = 0.7 * (1 - k); b.material.opacity = 0.9 * (1 - k); a.rotation.y += 0.05; }, { meshes: [a, b], delay: o.delay });
  }
  spikes(x, z, o = {}) { // crystals or stone spikes bursting out of the ground
    const n = o.n || 5, ms = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU + Math.random() * 0.5, d = i === 0 ? 0 : (o.spread ?? 0.8) * (0.5 + Math.random() * 0.5), h = (o.h || 1.6) * (i === 0 ? 1.2 : 0.6 + Math.random() * 0.5);
      const g = o.shape === 'shard' ? new THREE.OctahedronGeometry(0.3, 0) : new THREE.ConeGeometry(o.w || 0.22, 1, 5); if (o.shape === 'shard') g.scale(0.7, 2.4, 0.7); else g.translate(0, 0.5, 0);
      const m = this.add(g, o.glow ? mat(o.color, { opacity: 0.85 }) : solid(o.color || '#c8a060', { glow: o.ice ? 0.6 : 0.2 }), x + Math.cos(a) * d, 0, z + Math.sin(a) * d * 0.6);
      m.rotation.set((Math.random() - 0.5) * 0.5, Math.random() * TAU, (Math.random() - 0.5) * 0.5 + (d ? Math.cos(a) * 0.3 : 0)); m.userData.h = h; ms.push(m);
    }
    return this.tween(o.dur || 0.7, (k) => { for (const m of ms) { const s = k < 0.18 ? ease(k / 0.18) : k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1; m.scale.set(Math.max(0.01, s), Math.max(0.01, s * m.userData.h), Math.max(0.01, s)); if (m.material.opacity !== undefined && k > 0.75) m.material.opacity = (1 - k) / 0.25; } }, { meshes: ms, delay: o.delay });
  }
  slash(x, y, z, o = {}) { // an arc of light; angle turns it, arc is how much of a circle it covers
    const r = o.r || 1.3, w = o.w || 0.16, arc = o.arc || 2.2, g = new THREE.RingGeometry(r - w, r, 40, 1, -arc / 2, arc), g2 = new THREE.RingGeometry(r - w * 0.35, r - w * 0.05, 40, 1, -arc / 2, arc);
    const a = this.add(g, mat(o.color || '#fff'), x, y, z + 0.4), b = this.add(g2, mat('#ffffff'), x, y, z + 0.42);
    a.rotation.z = b.rotation.z = o.angle || 0; if (o.flip) { a.rotation.y = b.rotation.y = Math.PI; }
    return this.tween(o.dur || 0.24, (k) => { const s = lerp(0.65, 1.15, ease(k)); a.scale.set(s, s, 1); b.scale.set(s, s, 1); a.material.opacity = b.material.opacity = 1 - k * k; a.rotation.z += (o.sweep ?? 0.12); b.rotation.z = a.rotation.z; }, { meshes: [a, b], delay: o.delay });
  }
  beam(a, b, o = {}) { // a straight streak between two points
    const len = a.distanceTo(b), g = new THREE.CylinderGeometry(o.w || 0.06, o.w || 0.06, len, 8, 1, true); g.rotateZ(Math.PI / 2);
    const m = this.add(g, mat(o.color || '#fff'), 0, 0, 0); m.position.copy(a).add(b).multiplyScalar(0.5); const dir = b.clone().sub(a).normalize(); m.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir);
    return this.tween(o.dur || 0.2, (k) => { m.material.opacity = 1 - k; m.scale.set(1, 1 + k * (o.grow || 0), 1 + k * (o.grow || 0)); }, { meshes: [m], delay: o.delay });
  }
  bolt(x, z, o = {}) { // lightning from the sky, a jagged tube
    const pts = []; let px = x + (Math.random() - 0.5) * 1.5, py = o.top || 9; while (py > (o.y ?? 0)) { pts.push(new THREE.Vector3(px, py, z + 0.3)); py -= 0.5 + Math.random() * 0.7; px = lerp(px, x, 0.25) + (Math.random() - 0.5) * 0.8; } pts.push(new THREE.Vector3(x, o.y ?? 0, z + 0.3));
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.1);
    const a = this.add(new THREE.TubeGeometry(curve, pts.length * 3, (o.w || 0.07) * 2.2, 5), mat(o.color || '#ffe04a', { opacity: 0.6 }), 0, 0, 0);
    const b = this.add(new THREE.TubeGeometry(curve, pts.length * 3, o.w || 0.07, 5), mat('#ffffff'), 0, 0, 0);
    this.b.flashAt(x, 1, z, o.color || '#fff8a0', 2);
    return this.tween(o.dur || 0.22, (k) => { a.material.opacity = 0.6 * (1 - k); b.material.opacity = k < 0.5 ? 1 : (1 - k) * 2; }, { meshes: [a, b], delay: o.delay });
  }
  spiral(x, z, o = {}) { // particles climbing a helix (tornados, regen, heals)
    const n = o.n || 60, h = o.h || 3.2, r = o.r || 0.8, turns = o.turns || 3, col = o.color || '#fff', y0 = o.y ?? 0; let sent = 0;
    return this.tween(o.dur || 0.6, (k) => { const want = Math.floor(n * k); for (; sent < want; sent++) { const f = sent / n, a = f * turns * TAU * (o.dir || 1), rr = r * (o.cone ? 0.3 + f : 1); this.raw(x + Math.cos(a) * rr, y0 + f * h, z + Math.sin(a) * rr * 0.6, -Math.sin(a) * 2 * (o.dir || 1), 0.6, Math.cos(a) * 1.2, { color: col, life: o.life || 0.5, size: o.size || 0.22 }); } }, { delay: o.delay });
  }
  implode(x, y, z, o = {}) { // particles pulled into a point
    const n = o.n || 40, R = o.r || 2, life = o.life || 0.45;
    for (let i = 0; i < n; i++) { const a = Math.random() * TAU, b = (Math.random() - 0.5) * Math.PI, dx = Math.cos(a) * Math.cos(b), dy = Math.sin(b), dz = Math.sin(a) * Math.cos(b) * 0.5; const l = life * (0.7 + Math.random() * 0.3); this.raw(x + dx * R, y + dy * R, z + dz * R, -dx * R / l, -dy * R / l, -dz * R / l, { color: o.color, life: l, size: o.size || 0.2 }); }
  }
  flow(a, b, o = {}) { // a stream of particles from one point to another (drain, MP transfer)
    const n = o.n || 30; let sent = 0;
    return this.tween(o.dur || 0.5, (k) => { const want = Math.floor(n * k); for (; sent < want; sent++) { const l = 0.35, j = () => (Math.random() - 0.5) * 0.6; const sx = a.x + j(), sy = a.y + j(), sz = a.z + j(); this.raw(sx, sy, sz, (b.x - sx) / l, (b.y - sy) / l + 1.2, (b.z - sz) / l, { color: o.color, life: l, size: o.size || 0.2, g: 6.8 }); } }, { delay: o.delay });
  }
  rain(x, z, o = {}) { // things falling from above over a while (hail, arrows, coins, light)
    const n = o.n || 30, sp = o.spread || 1.4; let sent = 0;
    return this.tween(o.dur || 0.5, (k) => { const want = Math.floor(n * k); for (; sent < want; sent++) this.raw(x + (Math.random() - 0.5) * sp * 2, o.h || 6, z + (Math.random() - 0.5) * sp, (o.slant || 0), -(o.speed || 14), 0, { color: o.color, life: (o.h || 6) / (o.speed || 14), size: o.size || 0.2 }); }, { delay: o.delay });
  }
  shards(x, y, z, o = {}) { // little pieces flying out and falling (ice, glass, stone, a broken guard)
    const n = o.n || 8, ms = [], v = [];
    for (let i = 0; i < n; i++) { const g = new THREE.TetrahedronGeometry(o.size || 0.16); const m = this.add(g, o.solid ? solid(o.color, { glow: 0.5 }) : mat(o.color || '#fff'), x, y, z); ms.push(m); const a = Math.random() * TAU; v.push([Math.cos(a) * (2 + Math.random() * 3), 2 + Math.random() * 4, Math.sin(a) * 1.5]); }
    return this.tween(o.dur || 0.6, (k, dt) => { ms.forEach((m, i) => { v[i][1] -= 14 * dt; m.position.x += v[i][0] * dt; m.position.y = Math.max(0.05, m.position.y + v[i][1] * dt); m.position.z += v[i][2] * dt; m.rotation.x += 0.3; m.rotation.y += 0.2; if (m.material.opacity !== undefined) m.material.opacity = 1 - k * k; }); }, { meshes: ms, delay: o.delay });
  }
  sphere(x, y, z, o = {}) { // a growing (or shrinking) ball: explosions, bubbles, black holes, barriers
    const m = this.add(new THREE.IcosahedronGeometry(1, o.wire ? 1 : 3), o.dark ? new THREE.MeshBasicMaterial({ color: o.color, transparent: true, depthWrite: false }) : mat(o.color || '#fff', { opacity: o.opacity ?? 0.6, wire: o.wire }), x, y, z);
    const r0 = o.r0 ?? 0.1, r1 = o.r1 ?? 1.5, op = o.opacity ?? 0.6;
    return this.tween(o.dur || 0.4, (k) => { const s = lerp(r0, r1, o.linear ? k : ease(k)); m.scale.set(s, s, s); m.material.opacity = op * (o.hold ? (k > 0.7 ? (1 - k) / 0.3 : 1) : 1 - k); m.rotation.y += 0.04; }, { meshes: [m], delay: o.delay });
  }
  block(x, y, z, o = {}) { // an ice prison: a crystal that closes round the target, then breaks
    const m = this.add(new THREE.OctahedronGeometry(1, 0), solid(o.color || '#bdf0ff', { opacity: 0.55, glow: 0.7 }), x, y, z); m.scale.set(0.01, 0.01, 0.01);
    return this.tween(o.dur || 0.55, (k) => { const s = k < 0.3 ? ease(k / 0.3) : 1; m.scale.set(s * (o.w || 1), s * (o.h || 1.6), s * (o.w || 1)); m.rotation.y += 0.02; if (k > 0.8) m.material.opacity = 0.55 * (1 - k) / 0.2; }, { meshes: [m], delay: o.delay, end: () => this.shards(x, y, z, { color: o.color || '#bdf0ff', n: 10, solid: true }) });
  }
  arrows(x, z, o = {}) { // buff/debuff: little arrows rising or sinking around someone
    const n = o.n || 4, ms = [], up = o.up !== false;
    for (let i = 0; i < n; i++) { const g = new THREE.ConeGeometry(0.14, 0.38, 4); if (!up) g.rotateZ(Math.PI); const a = i / n * TAU; const m = this.add(g, mat(o.color || '#8affb0'), x + Math.cos(a) * 0.55, up ? 0.2 : 2.2, z + Math.sin(a) * 0.35); m.userData.d = i * 0.12; ms.push(m); }
    return this.tween(o.dur || 0.8, (k) => { for (const m of ms) { const kk = Math.max(0, Math.min(1, (k - m.userData.d) / 0.6)); m.position.y = up ? 0.2 + kk * 2 : 2.2 - kk * 2; m.material.opacity = Math.sin(kk * Math.PI); } }, { meshes: ms, delay: o.delay });
  }
  proj(a, b, o = {}) { // something flying from a to b; the promise resolves when it arrives
    let g; switch (o.shape) {
      case 'shard': g = new THREE.OctahedronGeometry(0.2, 0); g.scale(2, 0.6, 0.6); break;
      case 'rock': g = new THREE.DodecahedronGeometry(o.size || 0.3, 0); break;
      case 'arrow': g = new THREE.CylinderGeometry(0.025, 0.025, 0.9, 5); g.rotateZ(Math.PI / 2); break;
      case 'crescent': g = new THREE.RingGeometry(0.35, 0.5, 20, 1, -1.2, 2.4); break;
      case 'disc': g = new THREE.TorusGeometry(0.3, 0.07, 6, 16); break;
      case 'note': g = new THREE.SphereGeometry(0.12, 8, 6); break;
      default: g = new THREE.SphereGeometry(o.size || 0.22, 14, 10);
    }
    const m = this.add(g, o.shape === 'rock' ? solid(o.color || '#a07a50', { glow: 0.15 }) : mat(o.color || '#fff'), a.x, a.y, a.z);
    const glow = o.shape === 'rock' || o.shape === 'arrow' ? null : this.add(new THREE.SphereGeometry((o.size || 0.22) * 2, 12, 8), mat(o.color || '#fff', { opacity: 0.3 }), a.x, a.y, a.z);
    const meshes = glow ? [m, glow] : [m];
    return this.tween(o.dur || 0.2, (k) => {
      const x = lerp(a.x, b.x, k), y = lerp(a.y, b.y, k) + Math.sin(k * Math.PI) * (o.arc || 0), z = lerp(a.z, b.z, k) + Math.sin(k * Math.PI) * (o.side || 0);
      m.position.set(x, y, z); glow?.position.set(x, y, z);
      if (o.shape === 'arrow' || o.shape === 'shard') m.rotation.z = Math.atan2(b.y - a.y + Math.cos(k * Math.PI) * (o.arc || 0) * Math.PI, b.x - a.x);
      else { m.rotation.z += o.spin ?? 0.3; m.rotation.x += 0.1; }
      if (o.trail !== false) this.raw(x, y, z, (Math.random() - 0.5), (Math.random() - 0.5) + (o.rise || 0), 0, { color: o.trail || o.color, life: 0.25, size: (o.size || 0.22) * 0.9 });
    }, { meshes });
  }

  // ---------------------------------------------------------------- where people are
  at(t) { return new THREE.Vector3(t.x + (t.ox || 0), t.side === 'enemy' ? t.spr.h * 0.45 + (t.oy || 0) : 1.1, t.z); }
  hand(u) { return new THREE.Vector3(u.x + (u.ox || 0) - (u.side === 'enemy' ? -0.6 : 0.5), u.side === 'enemy' ? u.spr.h * 0.5 : 1.2, u.z + 0.2); }
  foeCenter(u) { const f = (u.side === 'enemy' ? this.b.allies : this.b.foes); if (!f.length) return { x: u.side === 'enemy' ? 4 : -4, z: 0 }; return { x: f.reduce((s, e) => s + e.x, 0) / f.length, z: f.reduce((s, e) => s + e.z, 0) / f.length }; }

  // ---------------------------------------------------------------- before the hits: the wind-up
  async cast(u, S, targets) {
    const L = lookOf(S); if (L.kind === 'other') return; this.last = null; this.hitN = 0;
    const t0 = targets?.find(Boolean);
    if (L.kind === 'art') return this.artWindup(u, S, L, t0);
    const col = this.colorOf(S, L), big = L.tier >= 4;
    const r = 0.8 + L.tier * 0.22, me = { x: u.x + (u.ox || 0), z: u.z };
    this.circle(me.x, me.z, { r, color: col, dur: 0.5 + L.tier * 0.12, spin: L.kind === 'debuff' ? -1 : 1 });
    if (L.tier >= 3) this.circle(me.x, me.z, { r: r * 0.6, color: '#ffffff', dur: 0.5 + L.tier * 0.12, spin: -1.6 });
    this.spiral(me.x, me.z, { color: col, n: 14 + L.tier * 8, h: 2.2, r: 0.6, turns: 2, dur: 0.35, size: 0.16 });
    if (L.form === 'field' || S.field) { const c = S.tgt === 'self' && S.field !== 'haste' ? this.foeCenter(u) : { x: 0, z: 0 }; this.circle(0, 0, { r: 5.5, color: col, dur: 1.4, spin: 0.4 }); this.ring(0, 0.05, 0, { r0: 0.5, r1: 7, color: col, dur: 0.7 }); this.rain(c.x * 0.3, 0, { color: col, n: 50, spread: 6, dur: 0.8, speed: 4, h: 4 }); }
    if (big && L.kind === 'spell' && t0) { // the strongest spells darken the screen and mark the ground under the targets first
      const c = L.all ? this.foeCenter(u) : this.at(t0);
      this.b.flash('#1a0a2a', 0.35); this.circle(c.x, c.z, { r: L.all ? 3.2 : 1.8, color: col, dur: 0.8, spin: -0.8 });
      if (L.tier >= 5) { this.b.camShake = 0.2; this.implode(me.x, 1.4, me.z, { color: col, n: 50, r: 2.4 }); }
    }
    if (L.kind === 'heal' && L.all) this.circle(this.b.allies.reduce((s, a) => s + a.x, 0) / Math.max(1, this.b.allies.length), 0, { r: 3, color: col, dur: 0.9 });
    await new Promise((r2) => setTimeout(r2, 160 + L.tier * 60 + (big ? 220 : 0)));
  }
  colorOf(S, L) {
    if (L.el) return ELEM_COLOR[L.el] || '#fff';
    if (L.kind === 'heal') return S.revive || S.tgt === 'dead' ? '#fff0a0' : S.mpHeal || S.mpHealFlat ? '#8ac8ff' : '#8affb0';
    if (L.kind === 'buff') { const k = S.buff && Object.keys(S.buff)[0]; return S.school === 'time' ? '#ffe08a' : k ? STAT_COL[k] : S.regen ? '#8affb0' : '#fff4b0'; }
    if (L.kind === 'debuff') { if (S.status) return STATUS_COL[S.status] || '#b06aff'; const k = S.debuff && Object.keys(S.debuff)[0]; return k ? STAT_COL[k] : S.school === 'time' ? '#a8c8ff' : '#b06aff'; }
    if (S.school === 'time') return '#c8b0ff';
    return '#c8a0ff';
  }
  async artWindup(u, S, L, t) {
    const col = this.artColor(S, L);
    if (S.type === 'buff' || S.type === 'heal' || S.stance || S.charge) { // stances and songs gather around the user
      this.ring(u.x + (u.ox || 0), 0.05, u.z, { r0: 0.3, r1: 1.6, color: col, dur: 0.5 }); this.spiral(u.x + (u.ox || 0), u.z, { color: col, n: 30, h: 2.4, r: 0.6, dur: 0.4 });
      if (S.charge) this.implode(u.x + (u.ox || 0), 1.1, u.z, { color: '#ff6a4a', n: 40, r: 1.8 });
      return;
    }
    if (L.ranged || !t || S.jump) { this.emit({ x: u.x + (u.ox || 0) - 0.5, y: 1.1, z: u.z, n: 8 + L.tier * 3, color: col, speed: 1.5, life: 0.3, size: 0.15 }); return; }
    // melee arts dash right up to the target (or to the front of the group for sweeps), and the strongest leave afterimages
    const goal = L.all ? this.foeCenter(u).x + 2.2 : t.x + (t.spr?.w || 1) * 0.5 + 1.0, from = u.ox || 0, to = goal - u.x;
    let k = 0; while (k < 1) { k = Math.min(1, k + (await this.b.G.frame()) / 0.14); u.ox = lerp(from, to, ease(k)); if (L.tier >= 3) this.raw(u.x + u.ox + 0.3, 1 + Math.random() * 0.6, u.z, 2, 0, 0, { color: col, life: 0.2, size: 0.25 }); }
    if (L.all && (S.art === 'greatsword' || S.art === 'axe' || S.art === 'spear' || S.art === 'sword')) { this.slash(goal - 1.5, 0.9, u.z, { r: 3.4, arc: 2.6, w: 0.3, angle: Math.PI, color: col, dur: 0.3, sweep: 0.2 }); this.b.camShake = 0.15; }
  }
  artColor(S, L) { return L.el ? ELEM_COLOR[L.el] : ART_COL[S.art] || '#fff'; }

  // ---------------------------------------------------------------- the hit, once per target (per hit)
  hit(S, t, el, u) {
    const L = lookOf(S), p = this.at(t);
    if (L.kind === 'art') return this.artHit(S, L, t, p, el, u);
    if (L.kind === 'heal' || L.kind === 'buff') return this.supportHit(S, L, t, p, u);
    if (L.kind === 'debuff' || L.kind === 'special') return this.hexHit(S, L, t, p, u);
    return this.spellHit(S, L, t, p, ELEM[el] ? el : L.el || el, u);
  }

  spellHit(S, L, t, p, el, u) {
    const col = ELEM_COLOR[el] || this.colorOf(S, L), n = L.tier, x = p.x, y = p.y, z = p.z, from = this.hand(u);
    if (L.form === 'drain') { this.sphere(x, y, z, { r0: 0.2, r1: 1, color: '#c84a8a', dur: 0.3 }); this.flow(p, from, { color: S.osmose ? '#8ac8ff' : '#ff6a8a', n: 30, dur: 0.5 }); return; }
    if (L.form === 'gravity') { this.sphere(x, y, z, { r0: 1.8, r1: 0.3, color: '#6a2aaa', dur: 0.45, opacity: 0.5 }); this.implode(x, y, z, { color: '#b06aff', n: 50, r: 2.2 }); this.ring(x, 0.05, z, { r0: 2.5, r1: 0.3, color: '#b06aff', dur: 0.4 }); this.b.camShake = 0.2; return; }
    if (L.form === 'flare') { this.implode(x, y, z, { color: '#fff4c0', n: 60, r: 2.6, life: 0.3 }); this.sphere(x, y, z, { r0: 0.2, r1: 2.6, color: '#ffe8a0', dur: 0.5, delay: 0.25 }); this.ring(x, 0.05, z, { r1: 4, color: '#ffb04a', dur: 0.5, delay: 0.25 }); setTimeout(() => { this.b.flash('#ffffff', 0.5); this.b.camShake = 0.4; }, 250); return; }
    if (L.form === 'meteor') { this.proj(new THREE.Vector3(x + 4, 9, z - 1), p, { shape: 'rock', size: 0.55, color: '#8a5a3a', trail: '#ff8a3a', dur: 0.3, spin: 0.2 }).then(() => { this.sphere(x, y * 0.6, z, { r1: 2.2, color: '#ffb04a', dur: 0.4 }); this.ring(x, 0.05, z, { r1: 3.5, color: '#ff8a3a' }); this.emit({ x, y: 0.4, z, n: 40, color: '#ffb04a', speed: 5, up: 2, life: 0.6, size: 0.35, gravity: 6 }); this.b.camShake = 0.35; }); return; }
    if (L.form === 'clock') { this.circle(x, y, { stand: true, r: 1.2, color: '#c8b0ff', dur: 0.5, spin: -6, y }); this.shards(x, y, z, { color: '#e8d8ff', n: 14, delay: 0.35 }); setTimeout(() => this.b.flash('#ffffff', 0.4), 350); return; }
    if (L.form === 'mark') { this.circle(x, y + 1.2, { stand: true, r: 0.6, color: col, dur: 0.9, y: y + 1.2 }); this.emit({ x, y, z, n: 12, color: col, speed: 2, life: 0.3, size: 0.18 }); return; }
    if (L.form === 'delay') { for (let i = 0; i < 3; i++) this.orbit(x, y, z, col, i * TAU / 3); this.circle(x, z, { r: 0.9, color: col, dur: 0.9 }); return; }
    if (L.form === 'burst') { this.implode(x, y, z, { color: col, n: 45, r: 2 }); this.sphere(x, y, z, { r0: 0.2, r1: 2, color: col, dur: 0.4, delay: 0.3 }); this.shards(x, y, z, { color: col, n: 10, delay: 0.3 }); return; }
    if (L.form === 'chain') { const a = this.last && this.last.t !== t && performance.now() - this.last.time < 1500 ? this.last.p : from; this.zig(a, p, col); this.emit({ x, y, z, n: 18, color: col, speed: 3, life: 0.35, size: 0.2 }); this.last = { t, p, time: performance.now() }; return; }
    if (L.form === 'duo' && L.el2) { const c2 = ELEM_COLOR[L.el2 === el ? L.el : L.el2]; this.spiral(x, z, { color: c2, n: 30, h: 2.6, r: 0.9, turns: 2, dur: 0.35, y: 0.1 }); }
    // single-target spells of the lower tiers fly from the caster's hand; everything else appears at the target
    const fly = !L.all && n <= 2 && L.form !== 'duo' ? this.missile(el, from, p, col) : Promise.resolve();
    fly.then(() => (ELEMFX[el] || ELEMFX.light).call(this, n, x, y, z, col, L.all));
  }
  missile(el, a, b, col) {
    const shape = { ice: 'shard', earth: 'rock', wind: 'crescent' }[el] || 'orb';
    return this.proj(a, b, { shape, color: el === 'earth' ? '#a07a50' : col, trail: col, dur: 0.18, arc: el === 'earth' ? 1 : el === 'water' ? 0.4 : 0, size: el === 'fire' ? 0.26 : 0.2, rise: el === 'fire' ? 1.5 : 0, spin: el === 'wind' ? 0.6 : 0.3 });
  }
  zig(a, b, col) { // a jagged arc from one target to the next
    const pts = [a.clone()]; for (let i = 1; i < 6; i++) { const k = i / 6; pts.push(new THREE.Vector3(lerp(a.x, b.x, k) + (Math.random() - 0.5) * 0.4, lerp(a.y, b.y, k) + (Math.random() - 0.5) * 0.8, lerp(a.z, b.z, k) + 0.3)); } pts.push(b.clone());
    const m = this.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.05, 5), mat(col), 0, 0, 0);
    this.tween(0.25, (k) => { m.material.opacity = 1 - k; }, { meshes: [m] });
  }
  orbit(x, y, z, col, a0) { // a small orb circling the target: a time bomb ticking
    const m = this.add(new THREE.SphereGeometry(0.12, 10, 8), mat(col), x, y, z);
    this.tween(1.0, (k) => { const a = a0 + k * TAU * 1.5; m.position.set(x + Math.cos(a) * 0.9, y + Math.sin(k * 6) * 0.2, z + Math.sin(a) * 0.5); m.material.opacity = k > 0.8 ? (1 - k) * 5 : 1; this.raw(m.position.x, m.position.y, m.position.z, 0, 0.3, 0, { color: col, life: 0.25, size: 0.14 }); }, { meshes: [m] });
  }

  supportHit(S, L, t, p, u) {
    const col = this.colorOf(S, L), x = p.x, z = p.z, n = L.tier;
    if (S.revive || S.tgt === 'dead') { // a feather falls, then a column of light
      this.feather(x, z); this.pillar(x, z, { r: 0.7, h: 6, color: '#fff0a0', dur: 0.9, delay: 0.25 }); this.rain(x, z, { color: '#fff4c0', n: 30, spread: 0.6, speed: 4, h: 4, dur: 0.6 }); if (S.full) this.b.flash('#fff8e0', 0.4); return;
    }
    if (S.mpHeal || S.mpHealFlat) { this.flow(this.hand(u), p, { color: '#8ac8ff', n: 25, dur: 0.45 }); this.spiral(x, z, { color: '#8ac8ff', n: 30, h: 2.4, r: 0.6, dur: 0.5 }); return; }
    if (S.cure || S.cureOnly) { this.ring(x, 1.2, z, { stand: true, r0: 0.3, r1: 1.6, color: '#c8f0ff', dur: 0.5 }); this.emit({ x, y: 1.2, z, n: 24, color: '#e8ffff', speed: 3, life: 0.5, size: 0.18, gravity: 2 }); this.shards(x, 1.2, z, { color: STATUS_COL[S.cureOnly?.[0]] || '#b06aff', n: 6 }); return; }
    if (S.type === 'heal') { // heals grow with the tier: sparkles, a ring, a soft column, petals, and a golden column for the full heal
      for (let i = 0; i < 10 + n * 8; i++) this.raw(x + (Math.random() - 0.5) * 0.9, 0.2 + Math.random() * 0.6, z + (Math.random() - 0.5) * 0.4, 0, 1.4 + Math.random(), 0, { color: col, life: 0.9, size: 0.2 });
      if (n >= 2) this.ring(x, 0.05, z, { r0: 0.3, r1: 1.4 + n * 0.2, color: col, dur: 0.6 });
      if (n >= 3) this.pillar(x, z, { r: 0.5, h: 3.5, color: col, dur: 0.7 });
      if (n >= 4) this.spiral(x, z, { color: '#ffd0e8', n: 40, h: 3, r: 0.9, turns: 2.5, dur: 0.7, size: 0.2 });
      if (S.full) { this.pillar(x, z, { r: 0.9, h: 7, color: '#ffe08a', dur: 1 }); this.circle(x, 2.6, { stand: true, r: 0.5, color: '#ffe08a', dur: 1, y: 2.6 }); }
      if (S.sacrifice) this.flow(this.at(u), p, { color: '#ff8a8a', n: 20 });
      return;
    }
    // buffs
    if (S.barrier) { this.sphere(x, 1, z, { r0: 0.4, r1: 1.4, color: ELEM_COLOR[S.barrier], dur: 0.9, wire: true, opacity: 0.8, hold: true }); return; }
    if (S.status === 'reflect') { this.sphere(x, 1, z, { r0: 1.5, r1: 1.3, color: '#c8e8ff', dur: 0.8, opacity: 0.35, hold: true }); this.shimmer(x, z); return; }
    if (S.status === 'reraise') { this.circle(x, 2.4, { r: 0.45, color: '#ffe08a', dur: 1.2, y: 2.4 }); this.feather(x, z); return; }
    if (S.status === 'haste' || S.buff?.spd || S.school === 'time') { this.circle(x, 1.2, { stand: true, r: 0.8, color: col, dur: 0.7, spin: 4, y: 1.2 }); for (let i = 0; i < 12; i++) this.raw(x + 1.5, 0.3 + Math.random() * 1.6, z, -8, 0, 0, { color: col, life: 0.3, size: 0.15 }); if (S.buff) this.arrows(x, z, { color: STAT_COL.spd, n: 2 + n }); return; }
    if (S.regen) { this.spiral(x, z, { color: '#8affb0', n: 40, h: 2.8, r: 0.7, turns: 3, dur: 0.8, size: 0.18 }); return; }
    if (S.evadeT) { for (const d of [-0.5, 0.5]) this.ghost(t, d); return; }
    if (S.taunt) { this.ring(x, 0.05, z, { r1: 2, color: '#ffb04a' }); return; }
    if (S.buff) { for (const k of Object.keys(S.buff)) this.arrows(x, z, { color: STAT_COL[k] || col, n: 2 + Math.min(4, n + (S.buff[k] > 1 ? 1 : 0)) }); this.ring(x, 0.05, z, { r0: 0.3, r1: 1.3, color: col, dur: 0.5 }); return; }
    this.spiral(x, z, { color: col, n: 30, h: 2.4, r: 0.7, dur: 0.6 });
  }
  hexHit(S, L, t, p, u) {
    const col = this.colorOf(S, L), x = p.x, y = p.y, z = p.z;
    if (S.analyze) { this.scanRing(x, z, t); return; }
    if (S.chip) { this.beam(this.hand(u), p, { color: '#e8f8ff', w: 0.05 }); this.shards(x, y, z, { color: '#e8f8ff', n: 12 }); this.ring(x, y, z, { stand: true, r1: 1.6, color: '#ffffff' }); return; }
    if (S.gilToss) { this.rain(x, z, { color: '#ffe04a', n: 40, spread: 1, speed: 9, dur: 0.5, size: 0.18 }); return; }
    if (S.dispel) { this.ring(x, y, z, { stand: true, r0: 1.6, r1: 0.2, color: '#ffffff', dur: 0.35 }); this.shards(x, y, z, { color: '#c8e8ff', n: 10, delay: 0.3 }); return; }
    if (S.addWeak) { const c = ELEM_COLOR[S.addWeak]; this.circle(x, y, { stand: true, r: 0.7, color: c, dur: 0.6, y }); this.shards(x, y, z, { color: c, n: 6, delay: 0.3 }); return; }
    if (S.unresist) { this.sphere(x, y, z, { r0: 1.2, r1: 1.3, color: '#ffb04a', wire: true, dur: 0.3 }); this.shards(x, y, z, { color: '#ffb04a', n: 12, delay: 0.25 }); return; }
    if (S.status === 'stop') { this.block(x, y, z, { color: '#a8c8ff', h: 1.3, dur: 0.6 }); this.circle(x, y + 1.4, { stand: true, r: 0.5, color: '#a8c8ff', dur: 0.8, spin: 0, y: y + 1.4 }); return; }
    if (S.status === 'slow' || S.delayT) { this.circle(x, y, { stand: true, r: 0.8, color: col, dur: 0.8, spin: -0.5, y }); this.spiral(x, z, { color: col, n: 24, h: 2, r: 0.8, dir: -1, dur: 0.6 }); return; }
    if (S.status) { // curses: a sigil under the target and a cloud that moves like the status it brings
      this.circle(x, z, { r: 1, color: col, dur: 0.7, spin: -1 });
      const motion = { poison: [0, 1.4, 0], sleep: [0.4, 0.6, 0], silence: [0, 0, 0], blind: [0, 0.2, 0], confuse: [0, 0.8, 0], stun: [0, 2.2, 0], doom: [0, 0.3, 0], curse: [0, -0.3, 0] }[S.status] || [0, 0.5, 0];
      for (let i = 0; i < 24; i++) this.raw(x + (Math.random() - 0.5) * 1, y + (Math.random() - 0.5) * 1, z, motion[0] * (Math.random() - 0.5) * 2, motion[1] * (0.5 + Math.random()), 0, { color: col, life: 0.8, size: S.status === 'blind' ? 0.4 : 0.2 });
      if (S.status === 'stun' || S.status === 'confuse') this.halo(x, y + 0.9, z, col);
      if (S.status === 'silence') this.ring(x, y, z, { stand: true, r0: 1.5, r1: 0.3, color: col, dur: 0.4 });
      return;
    }
    if (S.debuff) { for (const k of Object.keys(S.debuff)) this.arrows(x, z, { up: false, color: STAT_COL[k] || col, n: 2 + (S.debuff[k] || 1) }); this.circle(x, z, { r: 0.9, color: '#b06aff', dur: 0.6, spin: -1 }); return; }
    this.emit({ x, y, z, n: 24, color: col, speed: 2, life: 0.6, size: 0.25 });
  }

  // weapon arts: each weapon has its own shape, and higher arts are bigger
  artHit(S, L, t, p, el, u) {
    const col = this.artColor(S, L), x = p.x, y = p.y, z = p.z, lv = L.tier, from = this.hand(u);
    if (S.type === 'buff' || S.type === 'debuff' || S.type === 'heal' || S.type === 'special') {
      if (S.art === 'harp') { for (let i = 0; i < 5; i++) this.proj(from, new THREE.Vector3(x, y + 0.5, z), { shape: 'note', color: col, dur: 0.3 + i * 0.05, arc: 0.6 + i * 0.2, side: (i - 2) * 0.2 }); }
      if (S.art === 'tome') this.pages(x, y, z);
      return S.type === 'heal' || S.type === 'buff' ? this.supportHit(S, { ...L, kind: S.type, tier: lv }, t, p, u) : this.hexHit(S, { ...L, kind: S.type }, t, p, u);
    }
    if (S.type === 'mag') { this.proj(from, p, { color: col, dur: 0.18, size: 0.18 + lv * 0.03 }).then(() => { this.sphere(x, y, z, { r1: 0.8 + lv * 0.2, color: col, dur: 0.3 }); this.emit({ x, y, z, n: 16 + lv * 4, color: col, speed: 3, life: 0.4, size: 0.2 }); }); return; }
    this.hitN = (this.hitN || 0) + 1; const k = this.hitN, a = (k % 2 ? 1 : -1) * (0.5 + Math.random() * 0.4), big = 1 + lv * 0.12;
    const spark = (n = 14) => this.emit({ x, y, z, n: n + lv * 4, color: col, speed: 3.5, life: 0.35, size: 0.18 });
    switch (S.art) {
      case 'bow': {
        if (L.all) { this.rain(x, z, { color: col, n: 10 + lv * 2, spread: 0.8, speed: 18, dur: 0.25, slant: -2, size: 0.16 }); spark(8); break; }
        this.proj(from, p, { shape: 'arrow', color: col, dur: 0.14, arc: S.vsFly ? 0.8 : 0.2, trail: col }).then(() => { spark(10); if (S.status) this.halo(x, y + 0.6, z, STATUS_COL[S.status]); if (S.reveal) this.ring(x, y, z, { stand: true, r1: 1.2, color: '#4affff' }); });
        break;
      }
      case 'gun': {
        this.emit({ x: from.x - 0.3, y: from.y, z: from.z, n: 10, color: '#ffe08a', speed: 3, life: 0.15, size: 0.25 }); this.b.flashAt(from.x, from.y, from.z, '#ffe08a', 1);
        this.beam(from, p, { color: col, w: 0.035, dur: 0.12 }); spark(8); if (S.pierce) this.beam(p, new THREE.Vector3(x - 3, y, z), { color: col, w: 0.03, dur: 0.15 });
        break;
      }
      case 'boomerang': this.proj(from, p, { shape: 'disc', color: col, dur: 0.18, side: 0.8, spin: 0.8 }).then(() => { spark(10); this.proj(p, from, { shape: 'disc', color: col, dur: 0.2, side: -0.8, spin: 0.8 }); }); break;
      case 'katana': // one straight line, then the cut opens a beat later
        this.beam(new THREE.Vector3(x + 1.6, y + 0.3, z + 0.4), new THREE.Vector3(x - 1.6, y - 0.3, z + 0.4), { color: '#ffffff', w: 0.03 + lv * 0.005, dur: 0.3 });
        this.slash(x, y, z, { r: 1.4 * big, arc: 0.6, w: 0.1, angle: Math.PI * 0.9 + a * 0.2, color: '#ffffff', dur: 0.2, delay: 0.12, sweep: 0 }); this.emit({ x, y, z, n: 20 + lv * 4, color: '#ffe8f0', speed: 4, life: 0.4, size: 0.15 });
        break;
      case 'spear': // a thrust straight through
        this.beam(new THREE.Vector3(x + 2.2, y, z + 0.3), new THREE.Vector3(x - 1.4 - lv * 0.2, y, z + 0.3), { color: col, w: 0.06 + lv * 0.01, dur: 0.18, grow: 1 });
        this.ring(x - 0.6, y, z, { stand: true, r0: 0.2, r1: 0.9 + lv * 0.1, color: col, dur: 0.25 }); spark(10);
        if (S.ignoreDef) this.shards(x, y, z, { color: '#c8c8d8', n: 6 });
        break;
      case 'dagger': // two quick crossing cuts
        this.slash(x, y, z, { r: 0.9, arc: 1.4, w: 0.07, angle: 0.8, color: col, dur: 0.16 }); this.slash(x, y, z, { r: 0.9, arc: 1.4, w: 0.07, angle: -0.8 + Math.PI, color: col, dur: 0.16, delay: 0.05 });
        spark(8); if (S.status === 'poison') this.emit({ x, y, z, n: 14, color: '#8aff5a', speed: 1, up: 1, life: 0.6, size: 0.2 });
        break;
      case 'axe': // a heavy vertical chop that throws up earth
        this.slash(x + 0.3, y, z, { r: 1.5 * big, arc: 1.9, w: 0.28, angle: -Math.PI / 2 + 0.3, color: col, dur: 0.26, sweep: 0.2 });
        this.emit({ x, y: 0.2, z, n: 20 + lv * 4, color: '#a8845a', speed: 3, up: 3, life: 0.6, size: 0.22, gravity: 9 }); this.b.camShake = 0.15 + lv * 0.03;
        if (S.debuff) this.shards(x, y, z, { color: '#c8c8d8', n: 8, solid: true });
        break;
      case 'hammer': // the ground shakes: a shockwave and stars
        this.ring(x, 0.05, z, { r0: 0.3, r1: 2 + lv * 0.4, color: col, dur: 0.4 }); this.ring(x, y, z, { stand: true, r0: 0.2, r1: 1.4, color: '#ffffff', dur: 0.25 });
        this.emit({ x, y: 0.2, z, n: 24, color: '#c8a060', speed: 3, up: 2, life: 0.5, size: 0.25, gravity: 8 }); this.halo(x, y + 0.8, z, '#ffe04a'); this.b.camShake = 0.25 + lv * 0.04;
        break;
      case 'knuckle': // a punch: a burst ring at the point of impact, somewhere different every hit
        this.ring(x + (Math.random() - 0.5) * 0.6, y + (Math.random() - 0.5) * 0.6, z + 0.3, { stand: true, r0: 0.1, r1: 0.9 + lv * 0.1, color: col, dur: 0.18 }); spark(6);
        if (S.ranged) this.proj(from, p, { color: '#ffd0a0', size: 0.3, dur: 0.16 });
        break;
      case 'whip': this.whip(from, p, col); spark(6); if (S.status) this.halo(x, y + 0.7, z, STATUS_COL[S.status]); break;
      case 'greatsword': // a wide heavy arc and the ground cracks
        this.slash(x + 0.2, y, z, { r: 1.8 * big, arc: 2.6, w: 0.34, angle: a > 0 ? 0.4 : Math.PI + 0.4, color: col, dur: 0.3, sweep: 0.16 });
        this.ring(x, 0.05, z, { r1: 2 + lv * 0.3, color: col, dur: 0.35 }); this.b.camShake = 0.2 + lv * 0.03; spark(14);
        break;
      case 'shield': this.ring(x + 0.4, y, z + 0.3, { stand: true, r0: 0.3, r1: 1.3, color: col, dur: 0.25 }); this.sphere(x + 0.4, y, z, { r0: 0.5, r1: 0.9, color: col, wire: true, dur: 0.25 }); spark(8); if (S.delayT) this.halo(x, y + 0.8, z, '#ffe04a'); break;
      case 'staff': this.ring(x, y + 0.4, z, { stand: true, r0: 0.2, r1: 0.9, color: col, dur: 0.22 }); this.emit({ x, y, z, n: 12, color: '#fff4b0', speed: 2, up: 1, life: 0.5, size: 0.18 }); break;
      default: { // sword and the rest: arcs of light, crossing on multi-hit arts
        const hits = L.hits;
        this.slash(x, y, z, { r: 1.25 * big, arc: L.all ? 2.6 : 2.0, w: 0.14 + lv * 0.02, angle: hits > 1 ? (k % 2 ? 0.7 : Math.PI - 0.7) : a + (L.all ? Math.PI : 0), color: col, dur: 0.22 });
        if (lv >= 3) this.slash(x, y, z, { r: 0.9 * big, arc: 1.6, w: 0.08, angle: a + 0.3, color: '#ffffff', dur: 0.2, delay: 0.04 });
        spark(12); if (S.ranged) this.proj(from, p, { shape: 'crescent', color: col, dur: 0.16, spin: 0 });
      }
    }
    if (L.el && S.art !== 'gun') (ELEMFX[L.el] || ELEMFX.light).call(this, 1, x, y, z, ELEM_COLOR[L.el], false);
    if (S.chip) { this.shards(x, y, z, { color: '#e8f8ff', n: 6 + lv }); }
    if (S.steal) this.emit({ x, y, z, n: 16, color: '#ffe04a', speed: 2, up: 2, life: 0.6, size: 0.18 });
    if (lv >= 5) this.b.flash('#ffffff', 0.25);
  }

  // ---------------------------------------------------------------- small extras
  feather(x, z) { const m = this.add(new THREE.PlaneGeometry(0.25, 0.6), mat('#ffffff', { opacity: 0.95 }), x, 3.2, z + 0.3); this.tween(0.8, (k) => { m.position.set(x + Math.sin(k * 9) * 0.3, 3.2 - k * 2.4, z + 0.3); m.rotation.z = Math.sin(k * 9) * 0.6; m.material.opacity = k > 0.8 ? (1 - k) * 5 : 0.95; }, { meshes: [m] }); }
  halo(x, y, z, col) { for (let i = 0; i < 4; i++) { const m = this.add(new THREE.OctahedronGeometry(0.1, 0), mat(col), x, y, z); const a0 = i * TAU / 4; this.tween(0.8, (k) => { const a = a0 + k * TAU * 1.5; m.position.set(x + Math.cos(a) * 0.5, y + 0.2, z + Math.sin(a) * 0.3); m.material.opacity = 1 - k; }, { meshes: [m] }); } }
  shimmer(x, z) { this.rain(x, z, { color: '#e8f8ff', n: 20, spread: 0.6, speed: 3, h: 2.6, dur: 0.6, size: 0.14 }); }
  ghost(t, d) { if (!t.spr.mesh.isMesh || !t.spr.mat) { this.emit({ x: t.x + d, y: 1, z: t.z, n: 16, color: '#c8f0ff', speed: 1, life: 0.5, size: 0.3 }); return; } const m = t.spr.mesh.clone(); m.material = t.spr.mat.clone(); m.material.transparent = true; m.material.opacity = 0.5; m.position.x += d; this.scene.add(m); this.tween(0.7, (k) => { m.material.opacity = 0.5 * (1 - k); m.position.x += d * 0.01; }, { end: () => { this.scene.remove(m); m.material.dispose(); } }); }
  pages(x, y, z) { for (let i = 0; i < 8; i++) { const m = this.add(new THREE.PlaneGeometry(0.22, 0.3), mat('#fff8e8', { opacity: 0.9 }), x, y, z); const v = [(Math.random() - 0.5) * 3, 1 + Math.random() * 2, (Math.random() - 0.5)]; this.tween(0.7, (k, dt) => { m.position.x += v[0] * dt; m.position.y += v[1] * dt; m.position.z += v[2] * dt; m.rotation.x += 0.2; m.rotation.y += 0.15; m.material.opacity = 0.9 * (1 - k); }, { meshes: [m] }); } }
  whip(a, b, col) { const pts = []; for (let i = 0; i <= 10; i++) { const k = i / 10; pts.push(new THREE.Vector3(lerp(a.x, b.x, k), lerp(a.y, b.y, k) + Math.sin(k * Math.PI * 3) * 0.35 * (1 - k), lerp(a.z, b.z, k) + 0.2)); } const m = this.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, 0.04, 5), mat(col), 0, 0, 0); this.tween(0.22, (k) => { m.material.opacity = 1 - k; }, { meshes: [m] }); }
  scanRing(x, z, t) { const h = t.side === 'enemy' ? t.spr.h : 2; const m = this.add(new THREE.RingGeometry(0.9, 1, 40), mat('#4affff'), x, h + 0.2, z); m.rotation.x = -Math.PI / 2; this.tween(0.6, (k) => { m.position.y = (h + 0.2) * (1 - k); m.material.opacity = Math.sin(k * Math.PI); }, { meshes: [m] }); this.emit({ x, y: h * 0.5, z, n: 20, color: '#4affff', speed: 1.5, life: 0.5, size: 0.12, spread: 1 }); }
}

const ELEM = { fire: 1, ice: 1, thunder: 1, water: 1, wind: 1, earth: 1, light: 1, dark: 1 };
// each element at each tier (1..5); `all` is true for the spells that hit every enemy
const ELEMFX = {
  fire(n, x, y, z, col, all) {
    this.emit({ x, y, z, n: 20 + n * 10, color: '#ff7a2a', speed: 2 + n * 0.5, up: 2, life: 0.6, size: 0.3 + n * 0.04, gravity: -2 }); this.emit({ x, y, z, n: 12, color: '#ffe04a', speed: 4, life: 0.35, size: 0.22 }); this.b.flashAt(x, y, z, '#ff8a3a', 1 + n * 0.3);
    if (n >= 2) this.sphere(x, y, z, { r1: 0.8 + n * 0.25, color: '#ff8a3a', dur: 0.35 });
    if (n >= 2) this.ring(x, 0.05, z, { r1: 1.6 + n * 0.3, color: '#ff6a2a' });
    if (n >= 3) this.pillar(x, z, { r: 0.5 + n * 0.08, h: 3 + n, color: '#ff6a2a', dur: 0.6 });
    if (n >= 4) this.spiral(x, z, { color: '#ffb04a', n: 50, h: 4, r: 1, turns: 3, dur: 0.5, size: 0.3, cone: true });
    if (n >= 5) { this.proj(new THREE.Vector3(x + 5, 10, z - 1), new THREE.Vector3(x, y, z), { shape: 'rock', size: 0.7, color: '#6a3a2a', trail: '#ff6a2a', dur: 0.25 }).then(() => { this.sphere(x, y, z, { r1: 3, color: '#ffb04a', dur: 0.5 }); this.ring(x, 0.05, z, { r1: 5, color: '#ff8a3a', dur: 0.6 }); this.b.camShake = 0.45; this.b.flash('#ffb070', 0.4); }); }
  },
  ice(n, x, y, z, col) {
    this.emit({ x, y, z, n: 20 + n * 6, color: '#bdf0ff', speed: 3, life: 0.5, size: 0.2 }); this.b.flashAt(x, y, z, '#8ae0ff');
    if (n === 1) this.shards(x, y, z, { color: '#bdf0ff', n: 6, solid: true });
    if (n >= 2) this.spikes(x, z, { n: 3 + n, h: 1 + n * 0.3, color: '#bdf0ff', shape: 'shard', ice: true, spread: 0.9 });
    if (n >= 3) this.block(x, y, z, { color: '#bdf0ff', w: 0.9, h: 1.4 });
    if (n >= 4) this.rain(x, z, { color: '#e8f8ff', n: 40, spread: 1.4, speed: 12, dur: 0.5, size: 0.25 });
    if (n >= 5) { const m = this.add(new THREE.ConeGeometry(0.9, 4, 6), solid('#bdf0ff', { opacity: 0.85, glow: 0.7 }), x, 10, z); m.rotation.z = Math.PI; this.tween(0.3, (k) => { m.position.y = lerp(10, y + 1.6, k * k); }, { meshes: [m], end: () => { this.shards(x, y, z, { color: '#bdf0ff', n: 20, solid: true, size: 0.25 }); this.ring(x, 0.05, z, { r1: 4.5, color: '#8ae0ff', dur: 0.6 }); this.b.camShake = 0.4; this.b.flash('#c8f0ff', 0.35); } }); }
  },
  thunder(n, x, y, z) {
    const k = [1, 2, 2, 3, 6][n - 1];
    for (let i = 0; i < k; i++) this.bolt(x + (i ? (Math.random() - 0.5) * 1.2 : 0), z, { w: 0.05 + n * 0.015, delay: i * 0.07 });
    this.emit({ x, y, z, n: 20 + n * 8, color: '#ffe04a', speed: 5, life: 0.35, size: 0.18 });
    if (n >= 3) this.ring(x, 0.05, z, { r1: 2 + n * 0.3, color: '#ffe04a', dur: 0.35 });
    if (n >= 4) this.sphere(x, y, z, { r1: 1.6, color: '#fff8a0', dur: 0.25, wire: true });
    if (n >= 5) { this.pillar(x, z, { r: 0.8, h: 9, color: '#ffe04a', dur: 0.5 }); this.b.flash('#fff8c0', 0.25); this.b.camShake = 0.35; }
  },
  water(n, x, y, z) {
    this.emit({ x, y: y - 0.3, z, n: 25 + n * 8, color: '#4aa8ff', speed: 3, up: 3, life: 0.8, size: 0.25, gravity: 8, spread: 0.6 });
    if (n >= 2) this.pillar(x, z, { r: 0.45 + n * 0.05, h: 2 + n * 0.6, color: '#4aa8ff', dur: 0.55 });
    if (n >= 3) this.sphere(x, y, z, { r0: 0.3, r1: 1.3, color: '#8ac8ff', dur: 0.5, opacity: 0.35, hold: true });
    if (n >= 4) { this.spiral(x, z, { color: '#4aa8ff', n: 60, h: 1.2, r: 1.4, turns: 4, dur: 0.6, cone: true }); this.ring(x, 0.05, z, { r0: 2.4, r1: 0.4, color: '#4aa8ff', dur: 0.5 }); }
    if (n >= 5) { const m = this.add(new THREE.PlaneGeometry(4, 4, 1, 1), mat('#4aa8ff', { opacity: 0.6 }), x + 4, 0, z + 0.6); this.tween(0.45, (k) => { m.position.set(lerp(x + 4, x - 1, k), 2 * Math.sin(k * Math.PI) + 0.5, z + 0.6); m.scale.set(1, 0.4 + Math.sin(k * Math.PI), 1); m.material.opacity = 0.6 * (1 - k * k); }, { meshes: [m], end: () => { this.emit({ x, y: 0.5, z, n: 50, color: '#8ac8ff', speed: 5, up: 3, life: 0.7, size: 0.28, gravity: 8 }); this.b.camShake = 0.3; } }); }
  },
  wind(n, x, y, z) {
    const cuts = [2, 2, 3, 5, 6][n - 1];
    for (let i = 0; i < cuts; i++) this.slash(x, y + (Math.random() - 0.5) * 0.6, z, { r: 0.9 + n * 0.1, arc: 1.4, w: 0.07, angle: Math.random() * TAU, color: '#a8ffc8', dur: 0.2, delay: i * 0.06 });
    if (n >= 2) this.spiral(x, z, { color: '#a8ffc8', n: 30 + n * 10, h: 1.5 + n * 0.6, r: 0.6 + n * 0.12, turns: 3, dur: 0.5 });
    if (n >= 3) { const g = new THREE.CylinderGeometry(1.1, 0.25, 4, 20, 4, true); g.translate(0, 2, 0); const m = this.add(g, mat('#a8ffc8', { opacity: 0.25, wire: true }), x, 0, z); this.tween(0.6, (k) => { m.rotation.y += 0.4; m.scale.set(0.4 + n * 0.15, Math.min(1, k * 3), 0.4 + n * 0.15); m.material.opacity = 0.35 * (1 - k); }, { meshes: [m] }); }
    if (n >= 5) { this.emit({ x, y: 0.3, z, n: 30, color: '#c8a070', speed: 3, up: 6, life: 0.8, size: 0.2, gravity: 4 }); this.b.camShake = 0.25; }
  },
  earth(n, x, y, z) {
    this.emit({ x, y: 0.2, z, n: 20 + n * 8, color: '#c8a060', speed: 3, up: 3, life: 0.7, size: 0.28, gravity: 8, spread: 1 });
    if (n >= 2) this.spikes(x, z, { n: 3 + n, h: 1.2 + n * 0.3, color: '#a07a50', spread: 1 });
    if (n >= 3) this.proj(new THREE.Vector3(x, 7, z), new THREE.Vector3(x, y + 0.4, z), { shape: 'rock', size: 0.6, color: '#8a6a4a', dur: 0.22, trail: '#c8a060' }).then(() => { this.shards(x, y, z, { color: '#8a6a4a', n: 10, solid: true, size: 0.22 }); this.b.camShake = 0.3; });
    if (n >= 4) this.ring(x, 0.05, z, { r1: 3.2, color: '#c8a060', dur: 0.5 });
    if (n >= 5) { for (let i = 0; i < 3; i++) { const ox = (Math.random() - 0.5) * 2.4; this.proj(new THREE.Vector3(x + ox + 2, 9, z), new THREE.Vector3(x + ox, 0.5, z), { shape: 'rock', size: 0.5, color: '#6a4a3a', trail: '#ff8a3a', dur: 0.3 + i * 0.1 }); } this.b.camShake = 0.5; }
  },
  light(n, x, y, z) {
    for (let i = 0; i < 16 + n * 8; i++) this.raw(x + (Math.random() - 0.5) * 0.8, Math.random() * 2.5, z, 0, 1.5, 0, { color: '#fff4c0', life: 0.8, size: 0.26 }); this.b.flashAt(x, y, z, '#fff4c0', 1 + n * 0.4);
    if (n >= 2) { this.beam(new THREE.Vector3(x, y + 1, z + 0.4), new THREE.Vector3(x, y - 1, z + 0.4), { color: '#fff4c0', w: 0.08, dur: 0.5 }); this.beam(new THREE.Vector3(x - 0.7, y + 0.3, z + 0.4), new THREE.Vector3(x + 0.7, y + 0.3, z + 0.4), { color: '#fff4c0', w: 0.08, dur: 0.5 }); }
    if (n >= 3) this.pillar(x, z, { r: 0.6, h: 8, color: '#fff4c0', dur: 0.7 });
    if (n >= 4) for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; this.pillar(x + Math.cos(a) * 1.4, z + Math.sin(a) * 0.8, { r: 0.12, h: 6, color: '#ffe8a0', dur: 0.6, delay: i * 0.04 }); }
    if (n >= 5) { this.pillar(x, z, { r: 1.4, h: 12, color: '#ffffff', dur: 0.9 }); this.b.flash('#ffffff', 0.3); this.ring(x, 0.05, z, { r1: 4.5, color: '#fff4c0', dur: 0.7 }); }
  },
  dark(n, x, y, z) {
    this.emit({ x, y, z, n: 24 + n * 8, color: '#a04aff', speed: 2, life: 0.8, size: 0.35, gravity: -0.5, spread: 0.8 });
    if (n >= 2) this.spikes(x, z, { n: 3 + n, h: 1.6 + n * 0.2, w: 0.1, color: '#8a3ae0', glow: true, spread: 1 });
    if (n >= 3) { this.sphere(x, y, z, { r0: 1.2, r1: 0.2, color: '#1a0a2a', dur: 0.4, dark: true, opacity: 0.85 }); this.implode(x, y, z, { color: '#c86aff', n: 40, r: 2 }); }
    if (n >= 4) this.ring(x, 0.05, z, { r0: 3, r1: 0.3, color: '#b06aff', dur: 0.5 });
    if (n >= 5) { this.sphere(x, y + 0.3, z, { r0: 0.2, r1: 1.8, color: '#000000', dur: 0.7, dark: true, opacity: 0.95, hold: true }); this.implode(x, y + 0.3, z, { color: '#b06aff', n: 80, r: 3.5, life: 0.6 }); this.ring(x, y + 0.3, z, { stand: true, r0: 2.2, r1: 2.6, color: '#c86aff', dur: 0.7 }); this.b.camShake = 0.3; this.b.flash('#2a0a3a', 0.45); }
  },
};
