// Walking around: maps, the leader sprite, NPCs, chests, doors, encounters, mounts and the camera.
import * as THREE from '../lib/three.module.min.js';
import { MAPS, THEMES, LOOKS, arenaMap } from './maps.js?v=19';
import { parseMap, buildMap, groundAt } from './mapbuild.js?v=19';
import { Sprite, blobShadow, skyDome, Particles, Motes } from './render.js?v=19';
import { isPaper } from './voxel.js?v=19';
import { personModel } from './paperdoll.js?v=19';
import { personSheet, Px, ramp, texFrom, propPx } from './pixel.js?v=19';
import { HEROES, ECHOES } from './data.js?v=19';

export const LIGHTS = {
  day: { sun: ['#fff0d8', 2.7, [0.5, 1, 0.7]], hemi: ['#c4dcff', '#8a7a5a', 1.0], exp: 1.0 },
  dusk: { sun: ['#ffb070', 2.3, [-0.8, 0.6, 0.5]], hemi: ['#f0b890', '#5a4a5a', 0.8], exp: 1.0 },
  night: { sun: ['#8aa0ff', 0.55, [0.4, 1, 0.3]], hemi: ['#3a4a7a', '#1a1a2a', 0.55], exp: 1.1 },
  forest: { sun: ['#f0f4c8', 1.9, [0.3, 1, 0.5]], hemi: ['#9ac09a', '#3a4a2a', 0.7], exp: 1.0 },
  cave: { sun: ['#6a6a8a', 0.2, [0.2, 1, 0.3]], hemi: ['#4a4a6a', '#1a1418', 0.45], exp: 1.15 },
  interior: { sun: ['#ffd8a0', 0.15, [0.2, 1, 0.5]], hemi: ['#a8885a', '#3a2a1a', 0.6], exp: 1.1 },
  sanctum: { sun: ['#c8c8ff', 0.3, [0.2, 1, 0.5]], hemi: ['#7a7ab8', '#2a2a4a', 0.65], exp: 1.1 },
  deep: { sun: ['#6ac8ff', 0.35, [0.2, 1, 0.4]], hemi: ['#2a6a8a', '#0a1a2a', 0.55], exp: 1.15 },
  sky: { sun: ['#fff8f0', 2.8, [0.4, 1, 0.6]], hemi: ['#d0dcff', '#d8c8e8', 1.1], exp: 1.0 },
  void: { sun: ['#c8a0ff', 0.9, [0.3, 1, 0.5]], hemi: ['#5a3a7a', '#1a0a2a', 0.6], exp: 1.1 },
};

const sheetCache = new Map();
let heroLook = null;
export function setHeroLook(f) { heroLook = f; }
export function lookOf(look) {
  if (!look) return null;
  if (typeof look === 'object') return look;
  if (heroLook && HEROES[look]) { const r = heroLook(look); if (r) return r; }
  return LOOKS[look] || HEROES[look]?.look || ECHOES[look]?.look || LOOKS.boy;
}
export function personSprite(look) {
  return personModel(lookOf(look));
}
// little round critters for hide and seek
function moguSheet() {
  const f = (o) => { const p = new Px(16, 16), R = ramp('#f4f0f8'); p.sell(8, 10 - o, 6, 5, R); p.set(5, 9 - o, '#1c1424'); p.set(10, 9 - o, '#1c1424'); p.rect(7, 11 - o, 2, 1, '#e86a8a'); p.line(8, 5 - o, 8, 2 - o, '#4a3a3a'); p.sell(8, 1.5 - o, 1.5, 1.5, ramp('#ff5a7a')); p.sell(3, 7 - o, 1.5, 2, R); p.sell(13, 7 - o, 1.5, 2, R); return p.outline(); };
  const c = document.createElement('canvas'); c.width = 32; c.height = 16; const g = c.getContext('2d'); g.drawImage(f(0).canvas(), 0, 0); g.drawImage(f(1).canvas(), 16, 0); return c;
}
function sparkleTex() { const p = new Px(8, 8); p.line(4, 0, 4, 7, '#fff8c0'); p.line(0, 4, 7, 4, '#fff8c0'); p.set(4, 4, '#fff'); p.set(3, 3, '#ffe880'); p.set(5, 5, '#ffe880'); p.set(5, 3, '#ffe880'); p.set(3, 5, '#ffe880'); return texFrom(p.canvas()); }
function bubbleTex(kind) {
  const p = new Px(14, 12); p.srect(0, 0, 14, 9, ['#fff', '#fff', '#d8d8e0']); p.set(5, 9, '#fff'); p.set(6, 9, '#fff'); p.set(5, 10, '#fff');
  if (kind === '!') { p.rect(6, 1, 2, 5, '#e84a3a'); p.rect(6, 7, 2, 1, '#e84a3a'); }
  else if (kind === '?') { p.rect(5, 1, 4, 1, '#3a7ae8'); p.rect(8, 2, 1, 2, '#3a7ae8'); p.rect(6, 4, 2, 1, '#3a7ae8'); p.rect(6, 7, 2, 1, '#3a7ae8'); }
  else { for (const x of [3, 6, 9]) p.rect(x, 4, 2, 2, '#5a5a6a'); }
  return texFrom(p.outline().canvas());
}

export class Field {
  constructor(game) {
    this.G = game; this.yaw = 0; this.yawCur = 0;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(32, 16 / 9, 0.1, 600);
    this.sun = new THREE.DirectionalLight('#fff', 2.5);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 80 });
    this.sun.shadow.bias = -0.0008; this.sun.shadow.normalBias = 0.02;
    this.scene.add(this.sun, this.sun.target);
    this.hemi = new THREE.HemisphereLight('#fff', '#888', 0.8); this.scene.add(this.hemi);
    this.pool = []; for (let i = 0; i < 8; i++) { const l = new THREE.PointLight('#ffc070', 0, 8, 1.6); this.scene.add(l); this.pool.push(l); }
    this.fx = new Particles(this.scene, 500);
    this.t = 0; this.cam = { x: 0, z: 0, y: 0 };
    this.npcs = []; this.player = null; this.map = null;
    this.danger = 0; this.stepAcc = 0;
    this.sparkTex = sparkleTex(); this.bubbles = { '!': bubbleTex('!'), '?': bubbleTex('?'), '...': bubbleTex('...') };
    this.moguCanvas = moguSheet();
    this.mount = null; // null | 'bird' | 'airship'
    this.locked = false;
  }

  // ---------------------------------------------------------------- loading
  load(id, x, z, dir = 'down', opts = {}) {
    const def = id === '_arena' ? arenaMap(opts.theme) : MAPS[id];
    if (!def) throw new Error('no map ' + id);
    this.unload();
    this.mapId = id; this.def = def;
    const theme = { ...THEMES[def.theme] }; if (def.tiles) theme.tiles = { ...theme.tiles, ...def.tiles };
    if (this.G.nightFor && this.G.nightFor(id)) Object.assign(theme, THEMES.portNight, { tiles: { ...theme.tiles, ...THEMES.portNight.tiles } });
    this.theme = theme;
    this.map = parseMap(def);
    this.built = buildMap(this.scene, this.map, theme);
    // sky
    this.sky = skyDome(theme.sky[0], theme.sky[1]); this.scene.add(this.sky);
    this.scene.fog = theme.fog ? new THREE.Fog(theme.fog[0], theme.fog[1], theme.fog[2]) : null;
    if (theme.clouds) {
      const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
      g.fillStyle = '#e8e0f8'; g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 60; i++) { const gr = g.createRadialGradient(0, 0, 0, 0, 0, 40); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.save(); g.translate(Math.random() * 256, Math.random() * 256); g.fillStyle = gr; g.fillRect(-40, -40, 80, 80); g.restore(); }
      const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 6);
      this.clouds = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial({ map: t, color: theme.night ? '#5a3a7a' : '#ffffff', fog: false }));
      this.clouds.rotation.x = -Math.PI / 2; this.clouds.position.set(this.map.W / 2, -10, this.map.H / 2); this.scene.add(this.clouds);
    }
    // light preset
    const L = LIGHTS[theme.light] || LIGHTS.day;
    this.sun.color.set(L.sun[0]); this.sun.intensity = L.sun[1]; this.sunDir = new THREE.Vector3(...L.sun[2]).normalize();
    this.hemi.color.set(L.hemi[0]); this.hemi.groundColor.set(L.hemi[1]); this.hemi.intensity = L.hemi[2];
    this.G.renderer.toneMappingExposure = L.exp; this.exposure = L.exp;
    this.motes = theme.motes ? new Motes(this.scene, theme.fireflies ? 70 : 90, theme.motes, 22) : null;
    if (this.motes && theme.fireflies) { this.motes.mat.size = 0.12; }
    // NPCs and spots
    this.npcs = [];
    for (const c of this.map.cells) for (const o of c.marks) {
      if (o.k === 'npc' && !o.hidden && this.G.cond(o.cond)) this.addNpc(o);
      if (o.k === 'tablet' && !this.G.S.tablets.includes(o.id)) this.addSparkle(o);
      if (o.k === 'mogu' && this.G.moguActive && this.G.moguActive(o.id)) this.addMogu(o);
    }
    // open chests already looted
    for (const it of this.built.interact) if (it.kind === 'chest' && this.G.S.chests.includes(it.id)) { it.open = true; it.lidP.rotation.x = -1.9; }
    // hide things gated by flags
    for (const p of this.built.props) if (p.id === 'airship' && this.def.objs?.some(o => o.k === 'airship' && o.cond && !this.G.cond(o.cond))) p.mesh.visible = false;
    // player
    this.player = this.makeWalker(this.G.leaderLook());
    this.facedYaw = 0;
    this.placePlayer(x, z, dir);
    this.mount = opts.mount || null;
    if (this.mount) this.applyMount();
    this.cam.x = this.player.x; this.cam.z = this.player.z; this.cam.y = this.player.y;
    this.danger = 0;
    this.world = !!def.world;
    this.G.ui.areaName(def.name);
    this.G.automap?.onLoad(this);
    // pop-up book: the scenery folds up from the page, spreading out from the hero
    this.popT = null;
    if (isPaper()) {
      this.popT = -0.3; this.built.popUp(this.popT, this.player.x, this.player.z);
      this.player.spr.popDelay = 0.2;
      for (const n of this.npcs) n.spr.popDelay = 0.3 + Math.hypot(n.x - this.player.x, n.z - this.player.z) / 13;
    }
  }
  unload() {
    if (this.built) { this.scene.remove(this.built.root); this.built.root.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
    for (const n of this.npcs) this.scene.remove(n.root);
    if (this.player) this.scene.remove(this.player.root);
    if (this.sky) this.scene.remove(this.sky);
    if (this.clouds) { this.scene.remove(this.clouds); this.clouds = null; }
    if (this.motes) { this.scene.remove(this.motes.points); this.motes = null; }
    if (this.mountMesh) { this.scene.remove(this.mountMesh); this.mountMesh = null; }
    this.fx.clear();
    this.npcs = []; this.built = null;
  }

  makeWalker(look) {
    const root = new THREE.Group();
    const spr = personSprite(look); root.add(spr.mesh);
    const sh = blobShadow(0.38); sh.position.y = 0.02; root.add(sh);
    this.scene.add(root);
    return { root, spr, look, x: 0, z: 0, y: 0, dir: 'down', anim: 0, moving: false };
  }
  // new models for everyone on the map (after the character style setting changes)
  remodel() {
    for (const w of [this.player, ...this.npcs]) {
      if (!w?.spr?.mesh || !w.look) continue;
      w.root.remove(w.spr.mesh); w.spr.dispose?.();
      w.spr = personSprite(w.look); w.spr.pop = 1; w.root.add(w.spr.mesh); this.syncWalker(w); w.spr.snapFacing?.();
    }
    if (this.mount) this.applyMount();
  }
  setLeader(look) { if (!this.player) return; const { x, z, dir } = this.player; this.scene.remove(this.player.root); this.player = this.makeWalker(look); this.player.spr.pop = 1; this.placePlayer(x, z, dir); }
  placePlayer(x, z, dir) { const p = this.player; p.x = x + 0.5; p.z = z + 0.5; p.dir = dir; p.ang = null; p.y = groundAt(this.map, p.x, p.z); this.syncWalker(p); p.spr.snapFacing?.(); }
  syncWalker(w) {
    w.root.position.set(w.x, w.y + (w.hop || 0), w.z);
    if (w.spr.walk) { w.spr.walk(w.ang ?? w.dir, w.moving, w.anim * 1.5); return; }
    const base = { down: 0, up: 3, left: 6, right: 9 }[w.dir] || 0;
    const step = w.moving ? [1, 0, 2, 0][Math.floor(w.anim * 6) % 4] : 0;
    w.spr.setFrame(base + step);
  }
  addNpc(o) {
    const w = this.makeWalker(o.look || 'boy');
    w.x = o.x + 0.5; w.z = o.z + 0.5; w.y = groundAt(this.map, w.x, w.z); w.dir = o.dir || 'down';
    w.def = o; w.home = [w.x, w.z]; w.wt = Math.random() * 3;
    if (o.bubble || this.G.npcBubble?.(o)) { const b = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.bubbles[this.G.npcBubble?.(o) || '...'], depthTest: true })); b.scale.set(0.6, 0.5, 1); b.position.y = 2.25; w.root.add(b); w.bubble = b; }
    this.syncWalker(w); w.spr.snapFacing?.(); this.npcs.push(w);
    return w;
  }
  removeNpc(id) { const i = this.npcs.findIndex(n => n.def.id === id); if (i >= 0) { this.scene.remove(this.npcs[i].root); this.npcs.splice(i, 1); } }
  npc(id) { return this.npcs.find(n => n.def.id === id); }
  refreshBubbles() { for (const n of this.npcs) { const k = this.G.npcBubble?.(n.def) || (n.def.bubble ? '...' : null); if (n.bubble) n.bubble.visible = !!k; if (k && n.bubble) n.bubble.material.map = this.bubbles[k]; if (k && !n.bubble) { const b = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.bubbles[k] })); b.scale.set(0.6, 0.5, 1); b.position.y = 2.25; n.root.add(b); n.bubble = b; } } }
  addSparkle(o) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.sparkTex, color: '#fff8c0', depthTest: true })); s.scale.set(0.4, 0.4, 1);
    s.position.set(o.x + 0.5, groundAt(this.map, o.x + 0.5, o.z + 0.5) + 0.4, o.z + 0.5); this.built.root.add(s);
    o.sprite = s; this.built.interact.push({ kind: 'tablet', c: this.map.at(o.x, o.z), id: o.id, sprite: s, x: o.x + 0.5, z: o.z + 0.5 });
  }
  addMogu(o) {
    const spr = new Sprite(this.moguCanvas, 2, { scale: 1 }); spr.mesh.position.set(o.x + 0.5, groundAt(this.map, o.x + 0.5, o.z + 0.5), o.z + 0.5); this.built.root.add(spr.mesh); this.built.sprites.push(spr); this.facedYaw = 0;
    this.built.interact.push({ kind: 'mogu', id: o.id, spr, x: o.x + 0.5, z: o.z + 0.5, c: this.map.at(o.x, o.z) });
    this.built.anims.push((t) => spr.setFrame(Math.floor(t * 3) % 2));
  }

  // ---------------------------------------------------------------- movement
  blocked(x, z, fromY, mover) {
    const c = this.map.at(Math.floor(x), Math.floor(z));
    if (!c) return true;
    if (this.mount === 'airship') return false;
    if (this.mount === 'bird' && c.shallow) return false;
    if (c.shallow) return true;
    if (c.block && !(c.spot)) return true;
    const h = groundAt(this.map, x, z);
    // a step up or down of more than a third of a unit is a ledge; on stairs the ground rises about one unit per
    // tile, so the allowance grows with how far ahead this probe is (otherwise running up a staircase stalls)
    const here = mover && this.map.at(Math.floor(mover.x), Math.floor(mover.z));
    const slope = c.stairs || here?.stairs ? Math.hypot(x - mover.x, z - mover.z) * 1.15 : 0;
    if (Math.abs(h - fromY) > 0.35 + slope) return true;
    for (const n of this.npcs) if (n !== mover && Math.hypot(n.x - x, n.z - z) < 0.55) return true;
    if (mover !== this.player && this.player && Math.hypot(this.player.x - x, this.player.z - z) < 0.6) return true;
    return false;
  }
  tryMove(w, dx, dz, r = 0.28) {
    const nx = w.x + dx, nz = w.z + dz;
    const ok = (x, z, ex = dx, ez = dz) => !this.blocked(x + Math.sign(ex) * r, z, w.y, w) && !this.blocked(x, z + Math.sign(ez) * r, w.y, w) && !this.blocked(x + Math.sign(ex) * r, z + Math.sign(ez) * r, w.y, w);
    let moved = false;
    if (ok(nx, nz)) { w.x = nx; w.z = nz; moved = true; }
    else if (dx && ok(nx, w.z)) { w.x = nx; moved = true; }
    else if (dz && ok(w.x, nz)) { w.z = nz; moved = true; }
    if (!moved && w === this.player && (dx || dz)) {
      for (const [ang, k] of [[0.55, 0.8], [-0.55, 0.8], [1.1, 0.55], [-1.1, 0.55]]) {
        const c = Math.cos(ang), sn = Math.sin(ang), rx = (dx * c - dz * sn) * k, rz = (dx * sn + dz * c) * k;
        if (ok(w.x + rx, w.z + rz, rx, rz)) { w.x += rx; w.z += rz; moved = true; break; }
      }
    }
    if (moved && this.mount !== 'airship') w.y = groundAt(this.map, w.x, w.z);
    return moved;
  }

  update(dt, input) {
    this.t += dt;
    if (input.turn) this.yaw += input.turn * dt * 2.2;
    const p = this.player;
    let moved = false;
    if (!this.locked && p) {
      let { x: ix, y: iy } = input.axis;
      const len = Math.hypot(ix, iy);
      if (len > 0.15) {
        ix /= Math.max(1, len); iy /= Math.max(1, len);
        // stick directions are relative to the camera's heading
        { const cy = Math.cos(this.yawCur), sy = Math.sin(this.yawCur); [ix, iy] = [ix * cy + iy * sy, -ix * sy + iy * cy]; }
        const sp = (this.mount === 'airship' ? 9 : this.mount === 'bird' ? 7 : input.run ? 5.6 : 4.0) * dt;
        p.dir = Math.abs(ix) > Math.abs(iy) ? (ix > 0 ? 'right' : 'left') : (iy > 0 ? 'down' : 'up');
        p.ang = Math.atan2(ix, iy);
        const ox = p.x, oz = p.z, oc = this.cellKey(p);
        moved = this.tryMove(p, ix * sp, iy * sp);
        if (moved) {
          p.moving = true; p.anim += dt * (input.run ? 1.4 : 1);
          const d = Math.hypot(p.x - ox, p.z - oz);
          this.stepAcc += d;
          if (this.cellKey(p) !== oc) this.onEnterCell();
          if (!this.mount) this.encounterTick(d);
        } else p.moving = false;
      } else p.moving = false;
      if (this.mount === 'airship') p.y += ((groundAt(this.map, p.x, p.z) + 3.2) - p.y) * Math.min(1, dt * 3);
      this.syncWalker(p);
    }
    this.G.automap?.tick(dt);
    // NPC wandering
    for (const n of this.npcs) {
      if (n.def.wander && !this.locked && !n.talking) {
        n.wt -= dt;
        if (n.wt < 0) { n.wt = 1.5 + Math.random() * 3; n.go = Math.random() < 0.6 ? [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]][Math.random() * 4 | 0] : null; n.gt = 0.4 + Math.random() * 0.8; }
        if (n.go && n.gt > 0) {
          n.gt -= dt; n.dir = n.go[0]; n.ang = null;
          const nx = n.x + n.go[1] * dt * 1.6, nz = n.z + n.go[2] * dt * 1.6;
          if (Math.hypot(nx - n.home[0], nz - n.home[1]) < 2.5 && this.tryMove(n, n.go[1] * dt * 1.6, n.go[2] * dt * 1.6)) { n.moving = true; n.anim += dt; } else { n.moving = false; n.go = null; }
        } else n.moving = false;
      }
      if (n.scripted) { /* moved by an event */ }
      this.syncWalker(n);
    }
    if (p) p.spr.tick?.(dt);
    for (const n of this.npcs) n.spr.tick?.(dt);
    if (this.popT != null) { this.popT += dt; if (!this.built.popUp(this.popT, this.player.x, this.player.z)) this.popT = null; }
    // camera
    this.updateCamera(dt);
    // lights near the camera
    this.updateLights();
    for (const a of this.built.anims) {
      if (typeof a === 'function') a(this.t);
      else if (a.smoke && Math.random() < dt * 6) this.fx.emit({ x: a.smoke[0], y: a.smoke[1], z: a.smoke[2], n: 1, color: '#6a6a72', speed: 0.2, up: 0.9, life: 3, size: 0.9, gravity: -0.05, spread: 0.3, drag: 0.3 });
      else if (a.flame && Math.random() < dt * 20) this.fx.emit({ x: a.flame[0], y: a.flame[1], z: a.flame[2], n: 1, color: '#ff8a30', speed: 0.3, up: 1.2, life: 0.5, size: 0.25, gravity: -0.5, spread: 0.1 });
      else if (a.sparkle && Math.random() < dt * 8) this.fx.emit({ x: a.sparkle[0], y: a.sparkle[1], z: a.sparkle[2], n: 1, color: a.sparkle[3], speed: 0.6, up: 0.4, life: 1.4, size: 0.18, gravity: -0.2, spread: 1.4 });
      else if (a.fountain && Math.random() < dt * 30) this.fx.emit({ x: a.fountain[0], y: a.fountain[1], z: a.fountain[2], n: 1, color: '#a8d8ff', speed: 1.2, up: 2.2, life: 0.9, size: 0.12, gravity: 6, spread: 0.1 });
    }
    for (const it of this.built.interact) if (it.kind === 'tablet' && it.sprite) { it.sprite.material.rotation = this.t * 2; it.sprite.scale.setScalar(0.35 + Math.sin(this.t * 5) * 0.08); }
    if (this.motes) this.motes.update(dt, this.cam.x, this.cam.z);
    if (this.clouds) this.clouds.material.map.offset.x += dt * 0.004;
    if (this.mountMesh) { this.mountMesh.position.set(p.x, p.y - (this.mount === 'airship' ? 0.9 : 0), p.z); this.mountMesh.rotation.y = { left: Math.PI, right: 0, up: Math.PI / 2, down: -Math.PI / 2 }[p.dir] ?? 0; if (this.mount === 'bird') this.mountMesh.position.y = p.y + Math.abs(Math.sin(this.t * 10)) * 0.08 * (p.moving ? 1 : 0); }
    this.fx.update(dt);
    // danger indicator
    this.G.ui.danger(this.dangerLevel());
  }
  cellKey(w) { return Math.floor(w.x) + ',' + Math.floor(w.z); }
  updateCamera(dt) {
    const p = this.player, k = 1 - Math.exp(-dt * 6);
    if (this.def.interior) this.yaw = Math.max(-0.6, Math.min(0.6, this.yaw));
    this.yawCur += (this.yaw - this.yawCur) * Math.min(1, dt * 10);
    if (Math.abs(this.yawCur - (this.facedYaw ?? 0)) > 0.002) { this.facedYaw = this.yawCur; this.built.faceYaw?.(this.yawCur); for (const s of this.extraBillboards || []) s.mesh.rotation.set(s.mesh.rotation.x, this.yawCur, 0, 'YXZ'); }
    for (const a of ['x', 'y', 'z']) { const d = p[a] - this.cam[a]; this.cam[a] = Math.abs(d) < 0.003 ? p[a] : this.cam[a] + d * k; }
    { const d = this.yaw - this.yawCur; if (Math.abs(d) < 0.001) this.yawCur = this.yaw; }
    const far = this.world ? (this.mount === 'airship' ? 1.5 : 1.15) : this.def.interior ? 0.85 : 1;
    const dist = (this.world ? 14.5 : 15.5) * far * (this.zoom || 1) * (this.fit || 1), pitch = this.world ? 0.9 : 0.86;
    const hd = Math.cos(pitch) * dist, sy = Math.sin(this.yawCur), cy = Math.cos(this.yawCur);
    this.camera.position.set(this.cam.x + sy * hd, this.cam.y + Math.sin(pitch) * dist + 0.8, this.cam.z + cy * hd);
    this.camera.lookAt(this.cam.x - sy * 0.4, this.cam.y + 0.9, this.cam.z - cy * 0.4);
    // sun and its shadow box follow the player
    this.sun.position.set(this.cam.x + this.sunDir.x * 30, this.cam.y + this.sunDir.y * 30, this.cam.z + this.sunDir.z * 30);
    this.sun.target.position.set(this.cam.x, this.cam.y, this.cam.z);
    if (this.sky) this.sky.position.set(this.cam.x, 0, this.cam.z);
  }
  updateLights() {
    const L = this.built.lights, cx = this.cam.x, cz = this.cam.z;
    const sorted = L.map(l => [l, (l.x - cx) ** 2 + (l.z - cz) ** 2]).sort((a, b) => a[1] - b[1]);
    for (let i = 0; i < this.pool.length; i++) {
      const pl = this.pool[i], e = sorted[i];
      if (e && e[1] < 600) { const l = e[0]; pl.position.set(l.x, l.y, l.z); pl.color.set(l.color); pl.distance = l.dist; pl.intensity = l.intensity * 0.92; }
      else pl.intensity = 0;
    }
  }

  // ---------------------------------------------------------------- triggers
  onEnterCell() {
    const p = this.player, cx = Math.floor(p.x), cz = Math.floor(p.z);
    const c = this.map.at(cx, cz);
    // world map spots
    if (c && c.spot && !this.mount) { this.G.onSpot(c.spot); return; }
    if (c && c.spot && this.mount === 'bird') { this.G.onSpot(c.spot); return; }
    for (const o of this.def.objs || []) {
      if (o.k !== 'warp' && o.k !== 'event') continue;
      if (cx >= o.x && cx < o.x + (o.w || 1) && cz >= o.z && cz < o.z + (o.d || 1)) {
        if (o.k === 'warp') { if (o.cond && !this.G.cond(o.cond)) { this.G.onLockedWarp(o); return; } this.G.warp(o.to, o.tx, o.tz, o.dir, o); return; }
        if (o.k === 'event' && this.G.cond(o.cond)) { this.G.runEvent(o.id, o); return; }
      }
    }
  }
  encounterTick(d) {
    const enc = this.encTable(); if (!enc) return;
    if (this.G.noEncounters) return;
    const S = this.G.S;
    if (S.repel > 0) { S.repel -= d; if (S.repel <= 0) this.G.ui.toast('驅魔香的效果消失了'); return; }
    let mul = 1; for (const id of S.party) { const f = this.G.partyFx?.(id); if (f?.enc) mul += f.enc; }
    if (S.lure > 0) { S.lure -= d; mul *= 2; }
    if (this.G.grind) mul *= 2;
    this.danger += d * (100 / (this.def.encRate || 30)) * (this.G.encMul || 1) * Math.max(0.2, mul);
    if (this.danger > 100 * (0.8 + Math.random() * 0.4) && this.danger > 70) { this.danger = 0; this.G.randomBattle(enc); }
  }
  encTable() {
    if (this.def.zones) { const p = this.player; const z = this.def.zones.find(z => p.x >= z.x0 && p.x < z.x1 && p.z >= z.z0 && p.z < z.z1); return z?.enc; }
    return this.def.enc;
  }
  dangerLevel() { if (!this.encTable() || this.mount || this.G.noEncounters) return -1; return this.danger < 45 ? 0 : this.danger < 75 ? 1 : 2; }

  // what is in front of the leader
  facing() {
    const p = this.player, v = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[p.dir];
    const fx = p.x + v[0] * 0.8, fz = p.z + v[1] * 0.8;
    let best = null, bd = 1.3;
    for (const n of this.npcs) { const d = Math.hypot(n.x - fx, n.z - fz); if (d < bd) { bd = d; best = { kind: 'npc', npc: n }; } }
    if (best) return best;
    const cx = Math.floor(fx), cz = Math.floor(fz);
    for (const it of this.built.interact) {
      if (it.kind === 'board') { if (cz === it.c.j && cx >= it.x0 && cx < it.x1) return it; continue; }
      if (it.kind === 'door') continue;
      if (it.x !== undefined) { if (Math.hypot(it.x - fx, it.z - fz) < 0.8) return it; continue; }
      if (it.c && it.c.i === cx && it.c.j === cz) return it;
    }
    // counters: talk across a stall or table
    const fx2 = p.x + v[0] * 1.8, fz2 = p.z + v[1] * 1.8;
    for (const n of this.npcs) if (Math.hypot(n.x - fx2, n.z - fz2) < 0.7) return { kind: 'npc', npc: n };
    return null;
  }
  face(w, target) { const dx = target.x - w.x, dz = target.z - w.z; w.ang = Math.atan2(dx, dz); w.dir = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 'right' : 'left') : (dz > 0 ? 'down' : 'up'); this.syncWalker(w); }

  // move a walker (NPC or player) along a path for cutscenes
  async walk(w, pts, speed = 3) {
    w.scripted = true;
    for (const [tx, tz] of pts) {
      const gx = tx + 0.5, gz = tz + 0.5;
      while (Math.hypot(gx - w.x, gz - w.z) > 0.05) {
        const dt = await this.G.frame();
        const dx = gx - w.x, dz = gz - w.z, d = Math.hypot(dx, dz), s = Math.min(d, speed * dt);
        w.x += dx / d * s; w.z += dz / d * s; w.y = groundAt(this.map, w.x, w.z);
        w.dir = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 'right' : 'left') : (dz > 0 ? 'down' : 'up'); w.ang = Math.atan2(dx, dz);
        w.moving = true; w.anim += dt; this.syncWalker(w);
      }
    }
    w.moving = false; w.scripted = false; this.syncWalker(w);
  }
  async hop(w, h = 0.4, t = 0.3) { let e = 0; while (e < t) { e += await this.G.frame(); w.hop = Math.sin(Math.PI * Math.min(1, e / t)) * h; this.syncWalker(w); } w.hop = 0; this.syncWalker(w); }

  // ---------------------------------------------------------------- mounts
  applyMount() {
    if (this.mountMesh) { this.scene.remove(this.mountMesh); this.mountMesh = null; }
    if (!this.mount) { this.player.spr.mesh.visible = true; return; }
    const g = new THREE.Group();
    if (this.mount === 'bird') {
      // Chubi, grown big: a brass bird you can ride
      const brass = new THREE.MeshStandardMaterial({ color: '#c8a050', metalness: 0.7, roughness: 0.35 }), dark = new THREE.MeshStandardMaterial({ color: '#4a3a2a', metalness: 0.4, roughness: 0.5 });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), brass); body.scale.set(1.3, 0.8, 0.9); body.position.y = 0.9; body.castShadow = true; g.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), brass); head.position.set(0.6, 1.35, 0); head.castShadow = true; g.add(head);
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 6), new THREE.MeshStandardMaterial({ color: '#e8a040' })); beak.rotation.z = -Math.PI / 2; beak.position.set(0.9, 1.33, 0); g.add(beak);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), new THREE.MeshStandardMaterial({ color: '#4affff', emissive: '#4affff', emissiveIntensity: 2 })); eye.position.set(0.75, 1.42, 0.17); g.add(eye); const e2 = eye.clone(); e2.position.z = -0.17; g.add(e2);
      for (const s of [-1, 1]) { const wing = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.45), brass); wing.position.set(-0.1, 1.05, s * 0.5); wing.rotation.x = s * 0.4; g.add(wing); const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5), dark); leg.position.set(0, 0.3, s * 0.2); g.add(leg); }
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.3), brass); tail.position.set(-0.75, 1.0, 0); tail.rotation.z = 0.4; g.add(tail);
      this.player.spr.mesh.position.y = 0.75;
    } else {
      const wood = new THREE.MeshStandardMaterial({ color: '#8a5a30', roughness: 0.8 });
      const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.4, 3.6, 10), wood); hull.rotation.z = Math.PI / 2; hull.position.y = 0.6; hull.castShadow = true; g.add(hull);
      const bal = new THREE.Mesh(new THREE.SphereGeometry(1.2, 14, 10), new THREE.MeshStandardMaterial({ color: '#e8d8b0', roughness: 0.8 })); bal.scale.set(2.0, 0.8, 0.9); bal.position.y = 2.4; bal.castShadow = true; g.add(bal);
      for (const s of [-1, 1]) { const prop = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.12), wood); prop.position.set(-1.9, 1, s * 0.6); g.add(prop); g.userData['p' + s] = prop; }
      this.player.spr.mesh.position.y = 0.9;
    }
    this.mountMesh = g; this.scene.add(g);
  }
  setMount(m) { this.mount = m; if (!m) { this.player.spr.mesh.position.y = 0; this.player.y = groundAt(this.map, this.player.x, this.player.z); } this.applyMount(); }
  canLand() { const c = this.map.at(Math.floor(this.player.x), Math.floor(this.player.z)); return c && (!c.block || c.spot) && !c.water && !c.shallow; }
}
