// Turn-based battles: a timeline, break shields, Full Break -> Extra Phase -> Resonance, summons and limits.
import { balanceFor } from './balance.js?v=19';
import * as THREE from '../lib/three.module.min.js';
import { Sprite, Particles, skyDome, blobShadow } from './render.js?v=19';
import { battleSheet, monsterPx, propPx, propCanvas, tileTex, texFrom, BPOSE } from './pixel.js?v=19';
import { VoxelSprite } from './voxel.js?v=19';
import { personModel, renderPortrait } from './paperdoll.js?v=19';
import { HEROES, ECHOES, SKILLS, ENEMIES, ITEMS, SUMMONS, ELEM, WPN, ICON, ELEM_COLOR, PASSIVES } from './data.js?v=19';
import { heroStats, skillsOf, weaponType, addItem, itemName, hands, gearFx, artsOf, spellsOf, shieldOf, gainAP, addEcho } from './party.js?v=19';
import { WTYPES, TRAIT_N, STATUS_N, STATUS_S, ELS, SCHOOL_N, ITEM_CATS, MASTERY_AT, ARTS_BY_TYPE, randomGear } from './content.js?v=19';
import { lookOf } from './field.js?v=19';
import { SkillFx } from './skillfx.js?v=19';
import { STATE_OF, pairsOf, NEW_ECHOES, huntMatch } from './depth.js?v=19';

const ENEMY_DMG = 1.55;
// what the story's bosses say when they drop below half
const BOSS_HALF = {
  rottree: '……好痛……好黑……', tia: '風啊，再吹大一點！把他們的回憶全部吹散！', serene: '十年……我守了十年，誰都沒有看我一眼！', leviath: '（水神之影發出了悲傷的低吼）',
  vahl: '那張圖是我畫的！我畫的！', saren: '燈……那天晚上的燈，為什麼沒有人記得！', silent: '一千年……你們知道一千年有多長嗎！', silence: '…………………………',
  bigfang: '（狼王的眼睛變紅了）', irongolem: '（核心發出了刺耳的警報聲）', kingcrab: '（霸王蟹把鉗子舉得更高了）',
};
const EL_OPP = { fire: 'ice', ice: 'fire', thunder: 'water', water: 'thunder', wind: 'earth', earth: 'wind', light: 'dark', dark: 'light' };
const EL_RING = ['fire', 'ice', 'thunder', 'water', 'wind', 'earth', 'light', 'dark'];
const BG = {
  field: { tile: ['grass', '#62a046'], side: ['grass', '#4e8a3c'], sky: ['#5a96e8', '#f0e8d0'], props: [['tree', {}], ['tree', { leaf: '#5a9a3a' }], ['bush', {}], ['rock', {}]], light: 'day', fog: '#d8e4f0' },
  forest: { tile: ['grass', '#4a8038'], side: ['dirt', '#6a5a40'], sky: ['#3a6a5a', '#a8c8a0'], props: [['tree', { leaf: '#3a7a3a' }], ['pine', { leaf: '#2e6a4a' }], ['bush', { leaf: '#3a7a34' }], ['tree', { leaf: '#2e6a2e' }]], light: 'forest', fog: '#5a7a5a' },
  mountain: { tile: ['dirt', '#a8865a'], side: ['stonewall', '#9a8a74'], sky: ['#6a9ae0', '#f0e0c8'], props: [['pine', {}], ['rock', { color: '#9a8a74' }], ['rock', {}]], light: 'day', fog: '#e0d8c8' },
  cave: { tile: ['cave', '#6a5e70'], side: ['cave', '#4a4250'], sky: ['#0a080c', '#1a1418'], props: [['crystal', { color: '#8affb0' }], ['rock', { color: '#5a5262' }], ['crystal', { color: '#6ac8ff' }]], light: 'cave', fog: '#0c0a10', torches: true },
  coast: { tile: ['sand', '#e8d4a0'], side: ['sand', '#d8c490'], sky: ['#5aa8f0', '#f4ecd8'], props: [['palm', {}], ['rock', {}], ['bush', {}]], light: 'day', fog: '#e0f0f8', sea: true },
  temple: { tile: ['temple', '#7a9aa8'], side: ['temple', '#5a7080'], sky: ['#04101a', '#0a2030'], props: [['crystal', { color: '#4ac8f0' }], ['rock', { color: '#5a7080' }]], light: 'deep', fog: '#061826', pillars: true, torches: true },
  sky: { tile: ['temple', '#e8e4f4'], side: ['cloud', '#f4f0ff'], sky: ['#3a5ad8', '#f8d8f0'], props: [['crystal', { color: '#c8a0ff' }]], light: 'sky', fog: '#e8d8f8', pillars: true, clouds: true },
  void: { tile: ['temple', '#5a4a7a'], side: ['crystal', '#5a3a8a'], sky: ['#0a0418', '#4a1a4a'], props: [['crystal', { color: '#c8a0ff' }], ['crystal', { color: '#ff6a9a' }]], light: 'void', fog: '#1a0a2a', pillars: true, clouds: true },
  snow: { tile: ['snow', '#eef2f8'], side: ['snow', '#d8e0ec'], sky: ['#8aa8d8', '#f0f4f8'], props: [['pine', { snow: true, leaf: '#3a6a5a' }], ['rock', { color: '#c8d0dc' }]], light: 'day', fog: '#e8eef4' },
  town: { tile: ['cobble', '#cdbb9a'], side: ['brick', '#b8aa94'], sky: ['#6aa0e8', '#f4e4c8'], props: [['bush', { flower: '#f47a7a' }], ['tree', {}]], light: 'day', fog: '#c8d8e8' },
  arena: { tile: ['sand', '#d8c08a'], side: ['brick', '#a87a5a'], sky: ['#5a96e8', '#f0e8d0'], props: [['bush', {}]], light: 'day', fog: '#e8d8b8', pillars: true },
};
const LIGHT = {
  day: [['#fff0d8', 2.6], ['#c4dcff', '#8a7a5a', 1.0]], forest: [['#f0f4c8', 2.0], ['#9ac09a', '#3a4a2a', 0.8]], cave: [['#8a8aaa', 0.6], ['#5a5a7a', '#1a1418', 0.7]],
  deep: [['#6ac8ff', 0.8], ['#3a7a9a', '#0a1a2a', 0.7]], sky: [['#fff8f0', 2.8], ['#d0dcff', '#d8c8e8', 1.1]], void: [['#c8a0ff', 1.2], ['#6a4a8a', '#1a0a2a', 0.7]],
};

const wait = (ms) => new Promise(r => setTimeout(r, ms));

export class Battle {
  constructor(game) {
    this.G = game; this.S = game.S;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, 16 / 9, 0.1, 500);
    this.sun = new THREE.DirectionalLight('#fff', 2.5); this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 60 });
    this.sun.shadow.bias = -0.0008; this.sun.position.set(6, 16, 10); this.scene.add(this.sun);
    this.hemi = new THREE.HemisphereLight('#fff', '#888', 1); this.scene.add(this.hemi);
    this.pt = []; for (let i = 0; i < 3; i++) { const l = new THREE.PointLight('#ff9a40', 0, 10, 1.5); this.scene.add(l); this.pt.push(l); }
    this.flashLight = new THREE.PointLight('#fff', 0, 14, 1.2); this.flashLight.position.set(0, 3, 2); this.scene.add(this.flashLight);
    this.fx = new Particles(this.scene, 2000);
    this.vfx = new SkillFx(this);
    this.dom = document.getElementById('battle');
    this.camShake = 0; this.camZoom = 0; this.t = 0; this.units = [];
  }

  // ---------------------------------------------------------------- setup
  buildStage(bgKey) {
    if (this.stage) { this.scene.remove(this.stage); }
    const B = BG[bgKey] || BG.field; this.bg = B;
    const st = new THREE.Group(); this.stage = st; this.scene.add(st);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 24), new THREE.MeshStandardMaterial({ map: tileTex(B.tile[0], B.tile[1]).clone(), roughness: 1 }));
    ground.material.map.repeat.set(20, 12); ground.material.map.needsUpdate = true;
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; st.add(ground);
    // a raised back ridge so the horizon is a diorama edge
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(40, 1.4, 2), new THREE.MeshStandardMaterial({ map: tileTex(B.side[0], B.side[1]), roughness: 1 }));
    ridge.position.set(0, 0.7, -9); ridge.receiveShadow = true; st.add(ridge);
    const sky = skyDome(B.sky[0], B.sky[1]); st.add(sky);
    this.scene.fog = new THREE.Fog(B.fog, 18, 60);
    // props scattered behind and to the sides
    let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 22; i++) {
      const [k, c] = B.props[i % B.props.length];
      const x = -16 + r() * 32, z = -9.5 + r() * 4 + (Math.abs(x) > 9 ? r() * 8 : 0);
      if (Math.abs(x) < 7.5 && z > -5) continue;
      const px = propPx(k, c); const sp = new Sprite(propCanvas(px), 1, { scale: 1.3 + r() * 0.5 });
      sp.mesh.position.set(x, z < -8 ? 1.4 : 0, z); st.add(sp.mesh);
    }
    if (B.pillars) for (const x of [-9, -5, 5, 9]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 5, 10), new THREE.MeshStandardMaterial({ map: tileTex(B.side[0], B.side[1]), roughness: 0.9 })); p.position.set(x, 2.5, -6.5); p.castShadow = true; st.add(p); }
    if (B.sea) { const sea = new THREE.Mesh(new THREE.PlaneGeometry(60, 20), new THREE.MeshStandardMaterial({ color: '#2a8ac8', roughness: 0.2, metalness: 0.2 })); sea.rotation.x = -Math.PI / 2; sea.position.set(0, -0.2, -18); st.add(sea); }
    if (B.clouds) { const cl = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial({ color: bgKey === 'void' ? '#4a2a5a' : '#f4f0ff', fog: false })); cl.rotation.x = -Math.PI / 2; cl.position.y = -8; st.add(cl); ground.scale.set(0.6, 0.6, 1); }
    const L = LIGHT[B.light] || LIGHT.day;
    this.sun.color.set(L[0][0]); this.sun.intensity = L[0][1]; this.hemi.color.set(L[1][0]); this.hemi.groundColor.set(L[1][1]); this.hemi.intensity = L[1][2];
    for (const [i, l] of this.pt.entries()) { l.intensity = B.torches ? 8 : 0; l.position.set(-8 + i * 8, 3, -5); }
    this.G.renderer.toneMappingExposure = B.light === 'cave' || B.light === 'deep' ? 1.15 : 1.0;
  }

  makeUnits(troop, opts) {
    this.units = []; this._awed = false; this._aweBy = null; this.splits = 0;
    const P = this.S.party;
    const slots = [[2.9, -1.9], [3.9, -0.65], [4.9, 0.6], [5.9, 1.85]];
    P.forEach((id, i) => {
      const h = this.S.heroes[id], st = heroStats(this.S, id);
      const look = lookOf(id);
      const spr = personModel(look, { scale: 1.25, battle: true, angle: -Math.PI / 2 + 0.45, glow: 0.12 });
      const fx = gearFx(this.S, id), hs = hands(this.S, id), shields = shieldOf(this.S, id);
      const u = { side: 'party', id, name: HEROES[id].name, hero: id, lv: h.lv, st, hp: Math.max(0, Math.min(h.hp, st.hp)), mp: Math.min(h.mp, st.mp), wpn: hs[0].type, hands: hs, fx, on: h.on || [], echo: h.echo, limit: h.limit || 0, buffs: {}, status: {}, spr, home: slots[i], survived: false, color: HEROES[id].color, immuneSet: new Set(fx.immune || []), block: Math.min(0.6, shields.reduce((a, g) => a + (g.fx?.block || 0), 0)), mblock: shields.reduce((a, g) => a + (g.fx?.mblock || 0), 0), barrier: {} };
      u.key = h.echo ? ECHOES[h.echo]?.key : null;
      if (u.key === 'aegisheart' && shields.length) u.block += 0.15;
      u.block += fx.blockUp || 0;
      if (fx.first >= 1 || (fx.first && Math.random() < fx.first)) u.firstStrike = true;
      u.alive = u.hp > 0;
      this.addSprite(u, slots[i][0], slots[i][1]); spr.popDelay = 0.25 + i * 0.09;
      if (u.on.includes('p_autoprotect')) this.buff(u, { def: 2 }, true);
      for (const a of fx.auto || []) { if (a === 'protect') this.buff(u, { def: 1 }, true); else if (a === 'shell') this.buff(u, { spr: 1 }, true); else if (a === 'regen') u.autoRegen = true; else u.status[a] = 99; }
      for (const k in u.buffs) if (fx.auto?.includes(k === 'def' ? 'protect' : 'shell')) u.buffs[k].t = 99;
      const meal = this.S.meal?.n > 0 ? this.S.meal.fx : null;
      if (meal?.start) this.buff(u, meal.start, true); if (meal?.limit) u.limit = Math.min(100, u.limit + meal.limit); if (meal?.auto) u.autoRegen = true;
      this.units.push(u);
    });
    const n = troop.length;
    const eslots = n === 1 ? [[-3.8, 0]] : n === 2 ? [[-2.9, -1.4], [-5.0, 1.0]] : n === 3 ? [[-2.4, -1.9], [-5.4, -0.6], [-3.2, 1.6]] : [[-2.2, -2.0], [-5.0, -1.3], [-2.6, 0.9], [-5.4, 1.9]];
    const letters = 'ABCD'; const count = {};
    troop.forEach((eid, i) => {
      count[eid] = (count[eid] || 0) + 1;
      const u = this.makeEnemy(eid, eslots[i], troop.filter(t => t === eid).length > 1 ? letters[count[eid] - 1] : '', opts);
      u.spr.popDelay = 0.05 + i * 0.09;
    });
    // echo pairs and battle-wide keystone effects
    this.rewindUsed = false; this.delayed = []; this.zone = null;
    this.pairList = pairsOf(this.party.map(u => u.echo)); this.pairs = new Set(this.pairList.map(p => p[2]));
    for (const u of this.party) {
      if (this.pairs.has('twinwall')) u.block += 0.1;
      if (this.pairs.has('twins')) u.firstStrike = true;
      if (this.pairs.has('timesong')) u.status.haste = 4;
    }
  }
  makeEnemy(eid, pos, suffix = '', opts = {}) {
    const E = ENEMIES[eid];
    let px = monsterPx(E.kind, E.colors); if (E.kind !== 'knight') px = px.flip();
    const scale = (E.boss ? 1.25 : 1.05) * (E.scale || 1);
    const spr = new VoxelSprite(px, { scale });
    const st = { hp: E.hp, mp: 999, atk: E.atk, def: E.def, mag: E.mag, spr: E.spr, spd: E.spd };
    const bal = balanceFor(eid, E, this.G.S.settings.diff); st.hp = Math.round(st.hp * bal[0]); st.atk = Math.round(st.atk * bal[1]); st.mag = Math.round(st.mag * bal[1]);
    if (opts.hard) for (const k of ['hp', 'atk', 'def', 'mag', 'spr']) st[k] = Math.round(st[k] * opts.hard);
    const u = { side: 'enemy', fam: E.fam, traits: new Set(E.traits || []), barrier: {}, id: eid, E, name: E.name + suffix, lv: E.lv, st, hp: st.hp, mp: 999, shield: E.shield, maxShield: E.shield, weak: E.weak, resist: E.resist || [], revealed: new Set(this.S.flags['seen_' + eid] || []), buffs: {}, status: {}, spr, alive: true, broken: false, brokenUntil: -1, boss: !!E.boss, home: pos };
    if (u.traits.has('reflect')) u.status.reflect = 99;
    if (u.traits.has('stealth')) u.status.hidden = 99;
    if (u.traits.has('phase')) u.phase = Math.random() < 0.5 ? 'phys' : 'mag';
    if (u.traits.has('countdown')) u.count = 4;
    if (u.traits.has('shift')) u.curEl = E.el || 'fire';
    u.aura = E.aura; u.absorb = E.absorb || [];
    this.addSprite(u, pos[0], pos[1]);
    this.units.push(u);
    if (u.traits.has('intimidate') && !this._awed) { this._awed = true; if (this.active) this.awe(u); else this._aweBy = u; } // at the start, once the battle UI is up
    return u;
  }
  awe(u) { for (const a of this.party) if (a.alive) this.buff(a, { atk: -1 }, true); this.pop(u, '威壓！全隊攻擊↓', '#ff8a8a', true); }
  // a summoner calls a weaker member of its family onto a free spot
  async spawnMinion(s) {
    const spots = [[-2.2, -2.0], [-5.0, -1.3], [-2.6, 0.9], [-5.4, 1.9], [-3.8, 0]];
    const free = spots.find(p => !this.foes.some(f => Math.hypot(f.home[0] - p[0], f.home[1] - p[1]) < 1.2));
    if (!free) return;
    const pool = Object.keys(ENEMIES).filter(id => { const E = ENEMIES[id]; return E.wild && !E.metal && !E.boss && E.fam === s.fam && E.lv <= s.lv - 2 && E.lv >= s.lv - 14 && !E.traits?.includes('summoner'); });
    if (!pool.length) return;
    const id = pool[Math.random() * pool.length | 0];
    this.pop(s, '呼叫同伴！', '#ffb04a', true); this.G.audio.sfx('summon');
    const m = this.makeEnemy(id, free, '');
    this.fx.emit({ x: m.x, y: 1, z: m.z, n: 30, color: '#c8a0ff', speed: 2, life: 0.8, size: 0.25 });
    this.ui.addEnemy(m); this.ui.refresh();
    await wait(500);
  }
  // a splitter tears in two: the copy takes half of what is left
  async splitOff(t) {
    const spots = [[-2.2, -2.0], [-5.0, -1.3], [-2.6, 0.9], [-5.4, 1.9], [-3.8, 0]];
    const free = spots.find(p => !this.foes.some(f => Math.hypot(f.home[0] - p[0], f.home[1] - p[1]) < 1.2));
    if (!free || this.foes.length >= 4) return;
    this.splits = (this.splits || 0) + 1;
    const half = Math.ceil(t.hp / 2); t.hp -= half;
    const m = this.makeEnemy(t.id, free, '′'); m.hp = half; m.split = true;
    this.pop(t, '分裂！', '#8affb0', true);
    this.fx.emit({ x: m.x, y: 0.8, z: m.z, n: 24, color: '#8affb0', speed: 2.5, life: 0.6, size: 0.22 });
    this.ui.addEnemy(m); this.ui.refresh();
    await wait(350);
  }
  async doomsday(u) {
    await this.ui.banner('末日', u.name, '#ff4a3a');
    this.camShake = 0.5; this.flash('#ff4a3a', 0.4); this.G.audio.sfx('break');
    for (const a of this.allies) if (!a.jumping) this.damage(a, Math.max(1, Math.round(a.st.hp * 0.45 * (a.defending ? 0.5 : 1))), {});
    await wait(500); this.checkDeaths();
  }
  async enemyFlee(u, why) { this.pop(u, why, '#fff'); u.alive = false; u.fled = true; this.fadeOut(u); this.queue = (this.queue || []).filter(q => q !== u); this.ui.refresh(); this.ui.timeline(); await wait(450); }
  hasKey(k) { return this.allies.some(a => a.key === k); }
  debuffCount(t) { return Object.keys(t.status).filter(k => !['regen', 'haste', 'reflect', 'reraise', 'hidden', 'enraged'].includes(k)).length + Object.values(t.buffs).filter(b => b.v < 0).length; }
  addSprite(u, x, z) {
    u.spr.mesh.position.set(x, 0, z); if (!u.spr.voxel) u.spr.mesh.rotation.x = -0.12; else if (u.side === 'enemy') u.spr.mesh.rotation.y = 0.4;
    u.shadow = blobShadow(u.side === 'enemy' ? 0.3 * u.spr.w : 0.5); u.shadow.position.set(x, 0.02, z);
    this.scene.add(u.spr.mesh, u.shadow);
    u.x = x; u.z = z; u.y = 0; u.ox = 0; u.oy = 0; u.flash = 0;
    if (u.side === 'party' && !u.alive) u.spr.setFrame(BPOSE.ko);
  }
  clearUnits() { this.vfx?.clear(); for (const u of this.units || []) { this.scene.remove(u.spr.mesh, u.shadow); u.spr.dispose(); } this.units = []; if (this.summonU) { this.scene.remove(this.summonU.spr.mesh); this.summonU = null; } }

  get party() { return this.units.filter(u => u.side === 'party'); }
  get foes() { return this.units.filter(u => u.side === 'enemy' && u.alive); }
  get allies() { return this.units.filter(u => u.side === 'party' && u.alive); }

  // ---------------------------------------------------------------- main loop
  async run(opts) {
    this.opts = opts; this.S = this.G.S; this.lastSpoils = null;
    this.buildStage(opts.bg || 'field');
    this.makeUnits(opts.troop, opts);
    this.round = 0; this.result = null; this.extraUsed = false; this.summonU = null; this.log = [];
    this.auto = !!this.S.settings.auto;
    this.ui = new BattleUI(this);
    this.ui.show();
    if (this._aweBy) { this.awe(this._aweBy); this._aweBy = null; }
    const area = this.G.field?.def?.bgm || this.G.field?.theme?.bgm; // caves, ruins and the end of the world get the darker battle theme
    this.G.audio.music(opts.music || (this.units.some(u => u.boss) ? 'boss' : ['dungeon', 'dungeon2', 'mine', 'last', 'night'].includes(area) ? 'battle2' : 'battle'));
    this.active = true;
    await this.intro();
    if (opts.preemptive) this.msg('先制攻擊！');
    if (this.pairList.length) { this.msg('連攜：' + this.pairList.map(p => p[3]).join('・')); await wait(700); }
    while (!this.result) {
      this.round++;
      await this.doRound();
    }
    this.active = false;
    const res = this.result;
    if (res === 'win') await this.victory();
    this.ui.hide();
    // write HP/MP and limits back
    for (const u of this.party) { const h = this.S.heroes[u.hero]; h.hp = Math.max(res === 'win' ? (u.alive ? u.hp : 1) : u.hp, res === 'lose' ? 0 : 1); if (!u.alive && res === 'win') h.hp = 1; h.mp = u.mp; h.limit = u.limit; }
    this.clearUnits();
    return res;
  }
  async intro() {
    this.camIntro = 1;
    for (const u of this.foes) { u.oy = 3; }
    let t = 0; while (t < 0.7) { const dt = await this.G.frame(); t += dt; for (const u of this.foes) u.oy = Math.max(0, 3 * (1 - t / 0.5)); }
    for (const u of this.foes) u.oy = 0;
    this.camIntro = 0;
    const names = [...new Set(this.foes.map(u => u.E.name))].join('、');
    this.msg(names + ' 出現了！');
    await wait(500);
  }

  speedOf(u) { return u.st.spd * this.bmul(u, 'spd') * (u.status.slow ? 0.5 : 1) * (u.status.chill ? 0.7 : 1) * (u.status.haste ? 1.5 : 1) * (this.zone?.haste && u.side === 'party' ? 1.3 : 1); }
  computeOrder(jitter = true) {
    const list = this.units.filter(u => u.alive && !(u.side === 'enemy' && u.brokenUntil >= this.round));
    if (this.summonU) list.push(this.summonU);
    const sc = (u) => this.speedOf(u) * (jitter ? 0.85 + Math.random() * 0.3 : 1) + ((u.on?.includes('p_first') || u.firstStrike) && this.round === 1 ? 1000 : 0) + (u.jumping ? 2000 : 0) + (this.opts.preemptive && this.round === 1 && u.side === 'party' ? 500 : 0);
    return list.map(u => [u, sc(u)]).sort((a, b) => b[1] - a[1]).map(a => a[0]);
  }
  nextPreview() {
    const nr = this.round + 1;
    const list = this.units.filter(u => u.alive && !(u.side === 'enemy' && u.brokenUntil >= nr));
    if (this.summonU) list.push(this.summonU);
    return list.sort((a, b) => this.speedOf(b) - this.speedOf(a));
  }
  async doRound() {
    this.queue = this.computeOrder();
    this.firstInRound = this.queue[0];
    for (const a of this.party) a.roundHp = a.hp;
    this.extraPending = false; this.extraUsed = false;
    this.ui.timeline();
    while (this.queue.length && !this.result) {
      const u = this.queue.shift();
      if (!u.alive && u.side !== 'summon') continue;
      if (u.side === 'enemy' && u.brokenUntil >= this.round) continue;
      this.current = u; this.ui.timeline();
      await this.turn(u);
      this.checkEnd();
      if (!this.result && !this.extraUsed && this.foes.length && this.foes.every(e => e.broken)) this.extraPending = true;
    }
    this.current = null;
    if (this.result) return;
    // Extra Phase after a Full Break
    if (this.extraPending && !this.result) {
      this.extraUsed = true;
      await this.ui.banner('FULL BREAK', '追加階段', '#ffe04a');
      this.inExtra = true;
      for (const u of this.allies) {
        if (this.result) break;
        if (u.jumping) continue;
        this.current = u; this.ui.timeline(true);
        await this.partyTurn(u, true);
        this.checkEnd();
      }
      this.inExtra = false;
      if (!this.result) await this.resonance();
      this.checkEnd();
      this.current = null;
    }
    if (this.result) return;
    await this.endRound();
    this.checkEnd();
  }
  async endRound() {
    // delayed spells go off
    for (const d of this.delayed || []) if (d.t.alive && d.u.alive !== false) { this.msg(SKILLS[d.sid].name + ' 爆發！'); await this.strike(d.u, d.t, { ...SKILLS[d.sid], delay: false }, [].concat(SKILLS[d.sid].el || []), { noCover: true }); await wait(200); }
    this.delayed = [];
    for (const u of this.units.filter(u => u.alive)) {
      if (u.status.poison) { const d = Math.max(1, Math.round(u.st.hp * 0.07)); this.damage(u, d, { color: '#c86aff' }); u.status.poison--; if (!u.status.poison) delete u.status.poison; }
      if (u.status.regen) { this.heal(u, Math.round(u.st.hp * 0.08)); u.status.regen--; if (!u.status.regen) delete u.status.regen; }
      if ((u.on?.includes('p_regen') || u.autoRegen) && u.alive) this.heal(u, Math.round(u.st.hp * 0.05), true);
      if (u.fx?.mpregen && u.alive) u.mp = Math.min(u.st.mp, u.mp + Math.max(1, Math.round(u.st.mp * u.fx.mpregen)));
      for (const k of ['slow', 'silence', 'blind', 'haste', 'stop', 'confuse', 'curse', 'reflect']) if (u.status[k] && u.status[k] < 90) { u.status[k]--; if (!u.status[k]) delete u.status[k]; }
      if (u.status.doom) { u.status.doom--; if (u.status.doom <= 0) { delete u.status.doom; this.pop(u, '死亡宣告', '#b06aff', true); u.hp = 0; } else this.pop(u, '倒數 ' + u.status.doom, '#b06aff'); }
      for (const k in u.buffs) { u.buffs[k].t--; if (u.buffs[k].t <= 0) delete u.buffs[k]; }
      for (const k in u.barrier || {}) if (--u.barrier[k] <= 0) delete u.barrier[k];
      for (const k in u.extraWeak || {}) if (--u.extraWeak[k] <= 0) { delete u.extraWeak[k]; this.ui.refresh(); }
      for (const k of ['noArmor', 'grounded', 'noResist']) if (u[k]) u[k]--;
      if (u.mark && --u.mark.t <= 0) u.mark = null;
      if (u.enchant && --u.enchant.t <= 0) u.enchant = null;
      if (u.taunt) u.taunt--;
      u.defending = false; u.stance = null; u.parry = false;
      if (u.side === 'enemy' && u.broken && this.round >= u.brokenUntil) { u.broken = false; u.shield = u.maxShield; this.pop(u, '恢復', '#8ae0ff'); }
    }
    for (const u of this.units.filter(u => u.alive && u.side === 'enemy')) {
      if (u.status.burn) { const amp = (u.burnBy?.key === 'inferno' ? 2 : 1) * (u.burnBy?.fx?.burnAmp ? 2 : 1); this.damage(u, Math.max(1, Math.round(u.st.hp * (u.boss ? 0.015 : 0.04) * amp)), { color: '#ff8a3a' }); }
      if (u.traits.has('regen') && !u.status.burn && !u.status.poison && !u.noRegen && u.hp > 0 && u.hp < u.st.hp) this.heal(u, Math.round(u.st.hp * (u.boss ? 0.03 : 0.08)));
      if (u.noRegen) u.noRegen--;
      if (u.traits.has('phase')) { u.phase = u.phase === 'phys' ? 'mag' : 'phys'; this.pop(u, u.phase === 'phys' ? '物理無效形態' : '魔法無效形態', '#c8a0ff'); }
      if (u.traits.has('shift')) { u.curEl = EL_RING[(EL_RING.indexOf(u.curEl) + 3) % 8]; u.weak = [...new Set([EL_OPP[u.curEl], ...u.E.weak.filter(w => !ELEM[w])])]; u.resist = [u.curEl]; if (u.absorb?.length) u.absorb = [u.curEl]; this.pop(u, `變成${ELEM[u.curEl]}屬性`, '#ffe04a'); }
      for (const k of ['wet', 'burn', 'chill', 'mud', 'erosion']) if (u.status[k]) { u.status[k]--; if (!u.status[k]) delete u.status[k]; }
    }
    for (const a of this.allies) a.shadowUsed = false;
    if (this.zone?.ley) { const k = STATE_OF[this.zone.el] || (this.zone.el === 'earth' ? 'mud' : null); if (k) for (const f of this.foes) this.setState(f, k, 2, this.zone.by); }
    if (this.round % 2 === 0) for (const s of this.foes.filter(f => f.traits.has('summoner') && !f.broken)) { if (this.foes.length >= 4) break; await this.spawnMinion(s); }
    if (this.zone && --this.zone.t <= 0) { this.msg('領域消失了'); this.zone = null; }
    this.checkDeaths();
    await wait(200);
  }
  checkEnd() {
    if (!this.foes.length) this.result = 'win';
    else if (!this.allies.length) this.result = 'lose';
  }

  async turn(u) {
    if (u.side === 'summon') return this.summonTurn(u);
    if (u.status.stop) { this.pop(u, '停止中', '#a0a0ff'); await wait(380); return; }
    if (u.status.frozen) { if (!--u.status.frozen) delete u.status.frozen; this.pop(u, '凍結中', '#bfe8ff'); await wait(380); return; }
    if (u.status.stun) { delete u.status.stun; this.pop(u, '暈眩中', '#ffd04a'); await wait(380); return; }
    if (u.status.sleep) {
      u.status.sleep--; this.pop(u, 'Zzz', '#c8c8ff'); await wait(450);
      if (u.status.sleep > 0 && Math.random() > 0.35) return; delete u.status.sleep; this.pop(u, '醒來了', '#fff');
      return;
    }
    if (u.status.confuse && Math.random() < 0.6) {
      this.pop(u, '混亂中', '#ff8ad8'); await wait(300);
      const pool = this.units.filter(x => x.alive && x !== u && !x.jumping); const t = pool[Math.random() * pool.length | 0]; if (!t) return;
      await this.actorAnim(u, SKILLS.attack); await this.strike(u, t, { type: 'phys', pow: 1, anim: 'slash', tgt: 'enemy' }, [], { noCover: true, atk: u.st.atk }); this.checkDeaths(); await this.actorReturn(u); return;
    }
    if (u.side === 'party') return this.partyTurn(u, false);
    return this.enemyTurn(u);
  }

  // ---------------------------------------------------------------- party
  async partyTurn(u, extra) {
    if (u.jumping) { const j = u.jumping; u.jumping = null; let tgt = j.target.alive ? j.target : this.foes[0]; if (!tgt) return; await this.useSkill(u, j.skill, [tgt], { landing: true }); return; }
    if (this.auto) { await wait(150); const a = this.autoAction(u); return this.execute(u, a); }
    for (;;) {
      const a = await this.ui.command(u, extra);
      if (!a) continue;
      if (a.kind === 'auto') { this.auto = true; this.S.settings.auto = true; this.ui.autoBtn(); const b = this.autoAction(u); return this.execute(u, b); }
      return this.execute(u, a);
    }
  }
  autoAction(u) {
    const foes = this.foes; const low = this.allies.find(a => a.hp < a.st.hp * 0.35);
    const sk = skillsOf(this.S, u.hero), hid = new Set(this.S.heroes[u.hero]?.hide || []), all = [...sk.own, ...sk.echo, ...artsOf(this.S, u.hero), ...spellsOf(this.S, u.hero)].filter(s => !hid.has(s));
    const can = (s) => { const D = SKILLS[s]; return D && u.mp >= this.mpCost(u, D) && !(u.status.silence && (D.spell || ['mag', 'heal', 'debuff'].includes(D.type)) && !D.art); };
    const dead = this.party.find(p => !p.alive);
    if (dead) { const rv = all.find(s => SKILLS[s].tgt === 'dead' && can(s)); if (rv) return { kind: 'skill', skill: rv, targets: [dead] }; }
    if (low) { const hs = all.filter(s => SKILLS[s].type === 'heal' && SKILLS[s].tgt !== 'dead' && (SKILLS[s].pow > 0 || SKILLS[s].full) && can(s)).sort((a, b) => (SKILLS[b].pow || 9) - (SKILLS[a].pow || 9))[0]; if (hs) return { kind: 'skill', skill: hs, targets: SKILLS[hs].tgt === 'allies' ? this.allies : [low] }; }
    if (u.limit >= 100) return { kind: 'limit' };
    // pick the best known weakness hit
    let best = null, bs = 0;
    for (const e of foes) for (const s of ['attack', ...all]) {
      const S = SKILLS[s]; if (!S || (S.type !== 'phys' && S.type !== 'mag')) continue; if (s !== 'attack' && !can(s)) continue; if (S.jump || S.gravity || S.mpBurst || S.delay || S.recoil) continue;
      const tags = s === 'attack' ? u.hands.flatMap(h => [...(WTYPES[h.type]?.tags || []), ...[].concat(h.fx.el || [])]) : this.tagsOf(u, S); const w = tags.some(t => (e.weak.includes(t) || e.extraWeak?.[t]) && e.revealed.has(t));
      const pw = s === 'attack' ? u.hands.length * (u.hands[0].type === 'dagger' ? 1.2 : 1) * (['whip', 'boomerang'].includes(u.wpn) ? Math.min(foes.length, 3) * 0.6 : 1) : (S.pow || 1) * (S.hits || 1);
      const score = pw * (w ? 2.2 : 1) * (S.tgt === 'enemies' ? Math.min(foes.length, 3) * 0.8 : 1) * (S.type === 'mag' ? u.st.mag / Math.max(1, u.st.atk) : 1) - (S.mp || 0) * 0.02;
      if (score > bs) { bs = score; best = { kind: 'skill', skill: s, targets: S.tgt === 'enemies' || S.tgt === 'random' ? foes : [e] }; }
    }
    return best || { kind: 'skill', skill: 'attack', targets: [foes[0]] };
  }
  mpCost(u, S) { return Math.round((S.mp || 0) * (1 - Math.min(0.6, u.fx?.mpcost || 0))); }
  async execute(u, a) {
    if (a.kind === 'skill') return this.useSkill(u, a.skill, a.targets);
    if (a.kind === 'limit') { u.limit = 0; const sk = HEROES[u.hero].limit; await this.ui.banner(SKILLS[sk].name, '極限技', u.color); return this.useSkill(u, sk, this.targetsFor(u, SKILLS[sk]), { limit: true }); }
    if (a.kind === 'defend') { u.defending = true; this.pop(u, '防禦', '#8ac8ff'); u.limit = Math.min(100, u.limit + 8); u.spr.setFrame(BPOSE.guard); await wait(350); return; }
    if (a.kind === 'item') return this.useItem(u, a.item, a.targets);
    if (a.kind === 'flee') {
      if (this.opts.noFlee || this.units.some(e => e.boss)) { this.msg('無法逃走！'); await wait(600); return; }
      const ch = 0.55 + (this.allies.reduce((s, x) => s + x.st.spd, 0) / this.allies.length - this.foes.reduce((s, x) => s + x.st.spd, 0) / this.foes.length) * 0.02;
      if (Math.random() < ch) { this.msg('成功逃走了！'); this.G.audio.sfx('flee'); await wait(600); this.result = 'flee'; return; }
      this.msg('逃不掉！'); await wait(600); return;
    }
    if (a.kind === 'summon') return this.summon(u, a.sid);
    if (a.kind === 'item' && a.scroll) return this.useItem(u, a.item, a.targets);
    if (a.kind === 'relay') {
      const t = a.targets[0]; this.msg(`${u.name} 把行動讓給了 ${t.name}！`); this.fx.emit({ x: t.x, y: 1.4, z: t.z, n: 30, color: '#ffe04a', speed: 2, up: 1, life: 0.8, size: 0.25 }); this.G.audio.sfx('buff'); await wait(500);
      this.queue.unshift(t); return;
    }
  }
  targetsFor(u, S) {
    const isP = u.side === 'party' || u.side === 'summon';
    const foes = isP ? this.foes : this.allies.filter(a => !a.jumping), friends = isP ? this.allies : this.foes;
    if (S.tgt === 'enemies' || S.tgt === 'random') return foes;
    if (S.tgt === 'allies') return friends;
    if (S.tgt === 'self') return [u];
    if (S.tgt === 'enemy') return [foes[0]];
    return [friends[0]];
  }

  tagsOf(u, S) {
    const t = [];
    const wt = S.art || S.wpn;
    if (wt && WTYPES[wt]) t.push(...WTYPES[wt].tags); else if (S.wpn) t.push(S.wpn); else if (S === SKILLS.attack && u.side === 'party') t.push(...(WTYPES[u.wpn]?.tags || []));
    if (S.el) for (const e of [].concat(S.el)) t.push(e);
    // the weapon's own element rides along with physical arts, and so does an enchantment
    if (u.side === 'party' && S.type === 'phys') { const h = u.hands?.find(h => h.type === wt) || u.hands?.[0]; if (h?.fx?.el && (S.art || S.wpn)) t.push(...[].concat(h.fx.el)); if (u.enchant) t.push(u.enchant.el); }
    return [...new Set(t)];
  }
  atkFor(u, type) { const h = u.hands?.find(h => h.type === type); return h ? h.atk : u.st.atk; }
  addMastery(u, type, n) {
    if (u.side !== 'party' || !type || type === 'knuckle' && u.hands?.[0]?.unarmed) return;
    const h = this.S.heroes[u.hero]; h.mastery = h.mastery || {};
    const before = MASTERY_AT.filter(m => (h.mastery[type] || 0) >= m).length;
    h.mastery[type] = (h.mastery[type] || 0) + n;
    const after = MASTERY_AT.filter(m => h.mastery[type] >= m).length;
    if (after > before && ARTS_BY_TYPE[type]?.[after - 1]) this.pop(u, `${WPN[type]}熟練度提升！學會「${SKILLS[ARTS_BY_TYPE[type][after - 1]].name}」`, '#ffe04a', true);
  }
  elOf(t) { const known = t.weak.filter(w => ELS.includes(w) && t.revealed.has(w)); return known.length ? known[Math.random() * known.length | 0] : ELS[Math.random() * 8 | 0]; }

  // ---------------------------------------------------------------- normal attack: every weapon plays differently
  async weaponAttack(u, tgt, o = {}) {
    if (!o.counter && !o.quiet) this.msg(u.hands.map(h => ICON[h.type] || '👊').join(' ') + ' 攻擊');
    await this.actorAnim(u, SKILLS.attack);
    let rounds = u.fx?.dbl && Math.random() < u.fx.dbl ? 2 : 1;
    let total = 0;
    for (let r = 0; r < rounds; r++) {
      if (r === 1) this.pop(u, '連擊！', '#ffb04a');
      for (const h of u.hands) {
        if (!this.foes.length) break;
        const t = tgt && tgt.alive ? tgt : this.foes[0];
        const W = WTYPES[h.type];
        this.addMastery(u, h.type, 1);
        const mult = h.off ? (u.on.includes('p_twosword') ? 1 : 0.75) : 1;
        if (h.type === 'harp') {
          const a = this.allies[Math.random() * this.allies.length | 0], k = ['atk', 'def', 'mag', 'spr', 'spd'][Math.random() * 5 | 0];
          this.effect('song', a, 'light', u); this.G.audio.sfx('buff'); this.buff(a, { [k]: 1 }); await wait(250); continue;
        }
        let tags = h.unarmed ? [] : [...W.tags, ...[].concat(h.fx.el || [])];
        if (u.enchant) tags.push(u.enchant.el);
        const S = { type: 'phys', pow: mult, anim: ['bow', 'gun'].includes(h.type) ? 'arrow' : h.type === 'spear' ? 'thrust' : 'slash', tgt: 'enemy' };
        if (h.type === 'tome') { S.type = 'mag'; S.pow = 1.0 * mult; const el = this.elOf(t); tags = ['tome', el, ...[].concat(h.fx.el || [])]; S.anim = { fire: 'fire', ice: 'ice', thunder: 'thunder', water: 'water', wind: 'wind', earth: 'quake', light: 'holy', dark: 'dark' }[el]; }
        const list = h.type === 'whip' || h.type === 'boomerang' ? this.foes : [t];
        const pw = h.type === 'whip' ? 0.5 : h.type === 'boomerang' ? 0.65 : 1;
        const hits = h.type === 'dagger' ? 2 : 1;
        for (let k = 0; k < hits; k++) for (const x of list) total += await this.strike(u, x, { ...S, pow: S.pow * pw }, tags, { atk: h.atk, hand: h, fast: hits > 1 || list.length > 1 });
        // weapon follow-ups
        const other = this.foes.filter(f => f !== t);
        if (h.type === 'greatsword' && other.length) total += await this.strike(u, other[Math.random() * other.length | 0], { ...S, pow: 0.6 * mult }, tags, { atk: h.atk, hand: h, fast: true });
        if (h.type === 'spear' && other.length) total += await this.strike(u, other[Math.random() * other.length | 0], { ...S, pow: 0.5 * mult }, tags, { atk: h.atk, hand: h, fast: true });
        if (h.type === 'staff') u.mp = Math.min(u.st.mp, u.mp + 3);
        if (h.type === 'sword') u.parry = true;
        if (h.type === 'katana') u.drawn = true;
      }
    }
    if (total > 0 && !o.counter) u.limit = Math.min(100, u.limit + Math.round(6 * (1 + (u.fx?.limitup || 0))));
    await wait(200); this.checkDeaths(); await this.actorReturn(u);
    await this.afterAction(u);
  }
  async afterAction(u) {
    if (this.counterQ) { const [c, tgt] = this.counterQ; this.counterQ = null; if (c.alive && tgt.alive) { this.pop(c, '反擊！', '#ffb04a'); if (c.side === 'party') { c._counterNow = true; await this.weaponAttack(c, tgt, { counter: true, quiet: true }); c._counterNow = false; } else await this.useSkill(c, 'attack', [tgt], { counter: true, quiet: true }); } }
  }

  // ---------------------------------------------------------------- the heart: using a skill
  async useSkill(u, sid, targets, o = {}) {
    const S = SKILLS[sid];
    if (sid === 'attack' && u.side === 'party') return this.weaponAttack(u, targets[0], o);
    const spellish = !S.art && (S.spell || ['mag', 'heal', 'debuff'].includes(S.type));
    if (u.side === 'party' && !o.scroll) {
      const cost = this.mpCost(u, S);
      if (u.mp < cost) { this.msg('MP不足！'); await wait(500); return; }
      if (spellish && u.status.silence && !o.limit && !o.res) { this.msg(`${u.name} 被沉默了！`); await wait(600); return; }
      u.mp -= cost;
      if (S.hpCost) u.hp = Math.max(1, Math.round(u.hp - u.st.hp * S.hpCost));
    }
    if (sid !== 'attack' && !o.quiet) this.msg(S.name);
    this.curActor = u;
    if (u.side === 'party' && S.art) this.addMastery(u, S.art, 1);
    // jumps leave the field until the next round
    if (S.jump && !o.landing) {
      u.jumping = { skill: sid, target: targets[0] }; this.G.audio.sfx('jump');
      let t = 0; while (t < 0.4) { t += await this.G.frame(); u.oy = t * 40; } u.oy = 40;
      return;
    }
    if (o.landing) { let t = 0; const tx = targets[0].x + 0.8; u.ox = tx - u.x; while (t < 0.3) { t += await this.G.frame(); u.oy = 40 * (1 - t / 0.3); } u.oy = 0; if (S.tgt === 'enemies') targets = this.foes; }
    await this.actorAnim(u, S);
    if (u.side === 'party' && (S.art || S.school)) await this.vfx.cast(u, S, targets); // every art and spell has its own wind-up
    // things that happen once, to the user
    if (S.stance) { u.stance = S.stance; this.pop(u, { parry: '招架架式', counter: '明鏡止水', cover: '掩護', wall: '鐵壁' }[S.stance], '#8ac8ff'); }
    if (S.amp) { u.amp = S.amp; this.pop(u, '魔力增幅', '#c8a0ff'); }
    if (S.dualNext) { u.dualNext = true; this.pop(u, '雙重詠唱準備', '#c8a0ff'); }
    if (S.field) { this.zone = S.field === 'haste' ? { haste: true, t: 3 } : { el: S.field, t: u.key === 'leyline' ? 5 : 3, ley: u.key === 'leyline', by: u }; this.banner2(S.field === 'haste' ? '加速陣' : ELEM[S.field] + '之領域'); }
    if (S.flee100) { if (this.units.some(x => x.boss) || this.opts.noFlee) { this.msg('無法逃走！'); } else { this.msg('瞬間移動！'); await wait(400); this.result = 'flee'; return; } }
    if (S.dropUp) { this.dropBonus = (this.dropBonus || 0) + 0.5; this.pop(u, '掉寶率提升', '#ffe04a'); }
    if (S.hp2mp) { const c = Math.round(u.st.hp * 0.25); if (u.hp > c) { u.hp -= c; u.mp = Math.min(u.st.mp, u.mp + c); this.number(u, c, '#8ac8ff', {}); } }
    if (S.recoil) { }
    const hits = S.hits || 1;
    let total = 0;
    const amp = !S.art && S.type === 'mag' && u.amp ? u.amp : 1; if (amp > 1) u.amp = 0;
    const doHit = async (tgt, k) => {
      if (!tgt || (!tgt.alive && S.tgt !== 'dead' && !S.revive)) return;
      if (S.type === 'phys' || S.type === 'mag') {
        const els = S.el ? [].concat(S.el) : [];
        let el = hits > 1 && els.length > 1 ? [els[k % els.length]] : els;
        if (S.weakEl) el = [this.elOf(tgt)];
        if (S.randEl) el = [ELS[Math.random() * 8 | 0]];
        const tags = [...this.tagsOf(u, { ...S, el: undefined }), ...el];
        if (S.selfDestruct) { this.effect('explode', tgt, 'fire', u); this.camShake = 0.5; await wait(200); const d = Math.max(1, u.hp); u.hp = 0; this.damage(tgt, d, {}); total += d; this.pop(u, '自爆！', '#ff8a3a', true); return; }
        if (S.fixedLv) { this.effect(S.anim, tgt, 'earth', u); await wait(180); const d = S.fixedLv * (u.lv || 10); this.damage(tgt, d, {}); total += d; return; }
        if (S.gravity && tgt.E?.metal) { this.pop(tgt, '無效', '#c8c8c8'); return; }
        if (S.gravity) { this.effect('dark', tgt, 'dark', u); await wait(180); const d = Math.max(1, Math.round(tgt.hp * S.gravity * (tgt.boss ? 0.3 : 1))); this.damage(tgt, d, {}); total += d; return; }
        if (S.osmose) { this.effect('dark', tgt, 'dark', u); await wait(150); const r = this.calc(u, tgt, S, tags, {}); const m = Math.min(tgt.mp ?? 0, Math.max(5, Math.round(r.dmg * 0.25))); if (tgt.side === 'enemy') { u.mp = Math.min(u.st.mp, u.mp + m); this.number(u, m, '#8ac8ff', {}); } else { tgt.mp = Math.max(0, tgt.mp - m); } return; }
        if (S.delay) { (this.delayed = this.delayed || []).push({ u, t: tgt, sid }); this.effect('scan', tgt, el[0], u, S); this.pop(tgt, '設下時限', '#ffb04a'); return; }
        let pow = (S.pow || 1) * amp;
        if (S.mpBurst) { pow = 0.8 + u.mp / 30; u.mp = 0; }
        if (S.burst) { const n = Object.keys(tgt.status).filter(k => !['regen', 'haste', 'reflect', 'reraise'].includes(k)).length + Object.values(tgt.buffs).filter(b => b.v < 0).length; pow *= 1 + 0.6 * n; if (n) { this.pop(tgt, `引爆 ×${n}`, '#ff8a3a'); tgt.status = {}; for (const b in tgt.buffs) if (tgt.buffs[b].v < 0) delete tgt.buffs[b]; } }
        const dmg = await this.strike(u, tgt, { ...S, pow }, tags, { atk: S.byDef ? undefined : (S.art ? this.atkFor(u, S.art) : undefined), fast: hits > 2 });
        total += dmg;
        if (o.landing && u.key === 'dragoon' && tgt.alive && tgt.side === 'enemy') { if (tgt.traits?.has('fly')) { tgt.grounded = 2; this.pop(tgt, '墜落！', '#ffb04a'); } await this.breakHit(tgt, 1); }
        if (S.markWeak && tgt.alive) { const el = this.elOf(tgt); tgt.mark = { el, t: 3 }; this.pop(tgt, ELEM[el] + '之印', ELEM_COLOR[el]); }
        // chains bounce to other enemies
        if (S.chain && dmg > 0) { let p2 = pow; for (let c = 0; c < S.chain; c++) { const pool = this.targetsFor(u, S).filter(x => x.alive); if (!pool.length) break; p2 *= 0.8; await this.strike(u, pool[Math.random() * pool.length | 0], { ...S, pow: p2 }, tags, { fast: true }); } }
        if (S.pierce2) { const o2 = this.targetsFor(u, S).filter(x => x.alive && x !== tgt); if (o2.length) await this.strike(u, o2[Math.random() * o2.length | 0], { ...S, pow: pow * 0.5 }, tags, { atk: S.art ? this.atkFor(u, S.art) : undefined, fast: true }); }
        if (tgt.alive && S.status) this.inflict(tgt, S.status, S.chance || 0.4);
        if (tgt.alive && S.debuff) this.buff(tgt, Object.fromEntries(Object.entries(S.debuff).map(([k, v]) => [k, -v])));
        if (S.mark) { tgt.mark = { el: S.mark, t: 3 }; this.pop(tgt, ELEM[S.mark] + '之印', ELEM_COLOR[S.mark]); }
        if (S.steal && tgt.side === 'enemy') this.steal(u, tgt);
        if (S.dispel) this.dispel(tgt);
        if (S.delayT) this.delayTurn(tgt);
        if (S.chip && tgt.side === 'enemy' && tgt.alive) await this.breakHit(tgt, S.chip);
        if (S.unarmor && tgt.traits?.has('armor')) { tgt.noArmor = 3; this.pop(tgt, '重甲粉碎！', '#ffb04a'); }
        if (S.ground && tgt.traits?.has('fly')) { tgt.grounded = 2; this.pop(tgt, '墜落！', '#ffb04a'); }
        if (S.reveal) this.revealOne(tgt);
        if (S.mpGain) u.mp = Math.min(u.st.mp, u.mp + S.mpGain);
        if (S.gilToss) { }
      } else if (S.type === 'heal') {
        this.effect(S.anim || 'heal', tgt, 'light', u, S); await wait(150);
        if (S.revive || S.tgt === 'dead') { if (!tgt.alive) { tgt.alive = true; tgt.hp = Math.max(1, Math.round(tgt.st.hp * Math.max(S.revive || 0.3, u.key === 'grace' ? 0.5 : 0))); tgt.spr.setFrame(BPOSE.idle); this.pop(tgt, '復活', '#fff4b0'); } }
        if (!tgt.alive) return;
        const hb = (u.on?.includes('p_healup') ? 1.25 : 1) * (1 + (u.fx?.healup || 0)) * (u.hands?.some(h => h.type === 'staff') ? 1.3 : 1);
        if (S.full) this.heal(tgt, tgt.st.hp);
        else if (S.pow || S.base) this.heal(tgt, Math.round((u.st.mag * this.bmul(u, 'mag') * (S.pow || 0) + (S.base || 0)) * (0.95 + Math.random() * 0.1) * hb));
        if (S.healP) this.heal(tgt, Math.round(tgt.st.hp * S.healP));
        if (S.cure) { for (const k of ['poison', 'sleep', 'silence', 'blind', 'slow', 'stun', 'stop', 'doom', 'confuse', 'curse']) delete tgt.status[k]; }
        if (u.key === 'grace') { const bad = ['doom', 'stop', 'stun', 'confuse', 'sleep', 'silence', 'curse', 'blind', 'slow', 'poison'].find(k => tgt.status[k]); if (bad) { delete tgt.status[bad]; this.pop(tgt, STATUS_N[bad] + '解除', '#fff4b0'); } }
        if (S.cureOnly) { for (const k of S.cureOnly) delete tgt.status[k]; this.pop(tgt, '恢復了', '#fff'); }
        if (S.regenAdd) tgt.status.regen = S.regenAdd;
        if (S.rewind) { if (tgt.roundHp > tgt.hp) this.heal(tgt, tgt.roundHp - tgt.hp); for (const k of ['poison', 'sleep', 'silence', 'blind', 'slow', 'stun', 'confuse', 'curse']) delete tgt.status[k]; }
        if (S.mpHeal) { const m = Math.min(u.mp, Math.round(u.st.mp * S.mpHeal)); u.mp -= m; tgt.mp = Math.min(tgt.st.mp, tgt.mp + m); this.number(tgt, m, '#8ac8ff', {}); }
        if (S.mpHealFlat) { const b = tgt.mp; tgt.mp = Math.min(tgt.st.mp, tgt.mp + S.mpHealFlat); this.number(tgt, tgt.mp - b, '#8ac8ff', {}); }
        if (S.sacrifice && tgt !== u) { this.heal(tgt, Math.round(this._sac / Math.max(1, this.allies.length - 1))); }
        if (S.buff) this.buff(tgt, S.buff);
      } else if (S.type === 'buff') {
        this.effect(S.anim || 'buff', tgt, 'light', u, S); await wait(120);
        if (S.buff) this.buff(tgt, S.buff);
        if (S.regen) tgt.status.regen = S.regen;
        if (S.taunt) { tgt.taunt = S.taunt; this.pop(tgt, '挑釁', '#ffb04a'); }
        if (S.heal) this.heal(tgt, Math.round(tgt.st.hp * S.heal));
        if (S.status && S.self) this.apply(tgt, S.status);
        if (S.barrier) { tgt.barrier[S.barrier] = 4; this.pop(tgt, ELEM[S.barrier] + '護壁', ELEM_COLOR[S.barrier]); }
        if (S.evadeT) { tgt.evadeT = S.evadeT; this.pop(tgt, '閃避提升', '#8affb0'); }
        if (S.enchantEl) { tgt.enchant = { el: S.enchantEl, t: 3 }; this.pop(tgt, ELEM[S.enchantEl] + '附魔', ELEM_COLOR[S.enchantEl]); }
        if (S.enchant) { const rod = u.hands?.find(h => h.type === 'rod'); const el = [].concat(rod?.fx?.el || [])[0] || 'fire'; tgt.enchant = { el, t: 3 }; this.pop(tgt, ELEM[el] + '附魔', ELEM_COLOR[el]); }
      } else if (S.type === 'debuff') {
        this.effect(S.anim || 'dark', tgt, [].concat(S.el || 'dark')[0], u, S); await wait(150);
        if (S.pow) { const els = S.el ? [].concat(S.el) : []; const rx = tgt.side === 'enemy' && u.side !== 'enemy' ? this.reaction(u, tgt, S, els) : null; const r = this.calc(u, tgt, { ...S, type: 'mag' }, els, { ...o, rx: rx?.mul }); if (!r.miss && !r.block && !r.absorb) { tgt.lastTags = els; tgt.lastBy = u; this.damage(tgt, r.dmg, { weak: r.weak }); if (rx) await this.afterReaction(u, tgt, S, els, rx); if ((r.weak || rx?.brk) && tgt.side === 'enemy') await this.breakHit(tgt, (r.weak ? 1 : 0) + (rx?.brk || 0)); } else if (r.absorb) { this.heal(tgt, r.dmg); this.pop(tgt, '吸收', '#8affb0'); } }
        if (S.status && tgt.alive) this.inflict(tgt, S.status, S.chance || 0.5);
        if (S.multiStatus && tgt.alive) for (const st of S.multiStatus) this.inflict(tgt, st, S.chance || 0.3, true);
        if (S.debuff && tgt.alive) this.buff(tgt, Object.fromEntries(Object.entries(S.debuff).map(([k, v]) => [k, -v])));
        if (S.dispel) this.dispel(tgt);
        if (S.delayT) this.delayTurn(tgt);
        if (S.addWeak && tgt.side === 'enemy') { tgt.extraWeak = tgt.extraWeak || {}; tgt.extraWeak[S.addWeak] = 3; tgt.revealed.add(S.addWeak); this.pop(tgt, `弱${ELEM[S.addWeak]}！`, ELEM_COLOR[S.addWeak]); }
        if (S.unresist) { tgt.noResist = 3; tgt.noArmor = 3; this.pop(tgt, '抗性消失', '#ffb04a'); }
      } else if (S.type === 'special') {
        if (S.analyze) { delete tgt.status.hidden; for (const w of tgt.weak) tgt.revealed.add(w); this.remember(tgt); this.pop(tgt, '弱點看穿！', '#ffe04a'); this.G.audio.sfx('scan'); this.effect('scan', tgt, 'light', u, S); }
        if (S.steal) { this.effect('slash', tgt, 'dagger', u); this.steal(u, tgt); }
        if (S.charge) { u.charged = true; this.pop(u, '蓄力中…', '#ff6a6a'); this.effect('buff', u, 'fire', u); }
        if (S.stealGil) { const g = Math.min(this.S.gil, 20 + Math.floor(Math.random() * 40)); this.S.gil -= g; this.pop(tgt, `被偷了 ${g}G`, '#ffe04a'); }
        if (S.flee) { this.pop(u, '逃走了', '#fff'); u.alive = false; u.fled = true; this.fadeOut(u); }
        if (S.chip && tgt.side === 'enemy') { this.effect('laser', tgt, 'light', u, S); await this.breakHit(tgt, S.chip); }
        if (S.mpSuck) { const m = Math.round((tgt.mp || 0) * S.mpSuck); tgt.mp = Math.max(0, (tgt.mp || 0) - m); this.pop(tgt, `MP -${m}`, '#8ac8ff'); }
        if (S.quick) { this.pop(tgt, '迅捷！', '#ffe04a'); this.queue.unshift(tgt); }
        if (S.gilToss) { const cost = Math.min(this.S.gil, (u.lv || 10) * 50); this.S.gil -= cost; this.effect('light', tgt, 'light', u, S); this.damage(tgt, Math.round(cost * 0.8 / Math.max(1, targets.length)) + 1, {}); }
        await wait(300);
      }
      this.ui.refresh();
    };
    if (S.sacrifice) { this._sac = u.hp - 1; u.hp = 1; this.number(u, this._sac, '#ff8a8a', {}); }
    if (S.tgt === 'random') {
      for (let k = 0; k < hits; k++) { const pool = this.targetsFor(u, S).filter(t => t.alive); if (!pool.length) break; const pick = u.key === 'fortune' && Math.random() < 0.6 ? pool.slice().sort((a, b) => (a.broken ? 99 : a.shield || 0) - (b.broken ? 99 : b.shield || 0))[0] : pool[Math.random() * pool.length | 0]; await doHit(pick, k); }
    } else {
      for (let k = 0; k < hits; k++) {
        const list = targets.filter(t => t && (t.alive || S.tgt === 'dead' || S.revive));
        if (!list.length && S.tgt === 'enemy') { const alt = this.targetsFor(u, S)[0]; if (alt) list.push(alt); }
        if (S.tgt === 'enemies' || S.tgt === 'allies') { await Promise.all(list.map(t => doHit(t, k))); await wait(120); }
        else for (const t of list) await doHit(t, k);
      }
    }
    if (S.type === 'phys' && S.buff) this.buff(u, S.buff);
    if (S.recoil && u.alive) { const d = Math.round(u.st.hp * S.recoil); this.damage(u, Math.min(d, u.hp - 1), { color: '#ff8a8a' }); }
    if (u.charged && (S.type === 'phys' || S.type === 'mag') && !S.charge) u.charged = false;
    if (S.art === 'katana' || (S.wpn === 'katana' && S.type === 'phys')) u.drawn = true;
    if (u.side === 'party' && total > 0 && !o.limit) u.limit = Math.min(100, u.limit + Math.round(6 * (1 + (u.fx?.limitup || 0))));
    await wait(220);
    this.checkDeaths();
    await this.actorReturn(u);
    // dual cast (passive) and double cast (rod art)
    const isSpell = !S.art && S.type === 'mag';
    if (u.side === 'party' && isSpell && !o.dual && !o.limit && !o.res && this.foes.length && (u.dualNext || (u.on.includes('p_dualcast') && Math.random() < 0.4) || (u.fx?.dualcast && Math.random() < u.fx.dualcast))) {
      u.dualNext = false; this.pop(u, '連續詠唱！', '#c8a0ff'); await wait(300);
      await this.useSkill(u, sid, S.tgt === 'enemy' ? [targets[0]?.alive ? targets[0] : this.foes[0]] : this.targetsFor(u, S), { ...o, dual: true, scroll: true });
    }
    await this.afterAction(u);
    // second action for bosses
    const tw = u.side === 'enemy' ? Math.max(u.E.twice || 0, u.enraged ? 0.35 : 0) : 0;
    if (u.side === 'enemy' && tw && !o.second && Math.random() < tw && u.alive && !u.broken && !u.status.stop && this.allies.length) { await wait(250); await this.enemyTurn(u, true); }
  }
  banner2(t) { this.msg(t); this.flash('#ffffff', 0.2); }
  dispel(t) { let n = 0; for (const k in t.buffs) if (t.buffs[k].v > 0) { delete t.buffs[k]; n++; } for (const k of ['haste', 'regen', 'reflect', 'reraise']) if (t.status[k]) { delete t.status[k]; n++; } if (n) this.pop(t, '強化消失', '#c8c8c8'); }
  delayTurn(t) { const i = (this.queue || []).indexOf(t); if (i >= 0) { this.queue.splice(i, 1); this.queue.push(t); this.pop(t, '行動延後', '#a0a0ff'); this.ui.timeline(); } }
  revealOne(t) { if (t.side !== 'enemy') return; const w = t.weak.find(x => !t.revealed.has(x)); if (w) { t.revealed.add(w); this.remember(t); this.pop(t, `發現弱點 ${ICON[w] || ''}`, '#ffe04a'); this.ui.refresh(); } }

  // one hit landing on one target: cover, reflect, evasion, block, damage and every on-hit effect
  async strike(u, tgt, S, tags, ctx = {}) {
    if (!tgt || !tgt.alive) return 0;
    if (tgt.side === 'party' && u.side === 'enemy' && S.tgt !== 'enemies' && S.tgt !== 'random' && !ctx.noCover) {
      const g = this.allies.find(a => a !== tgt && !a.jumping && (a.stance === 'cover' || (a.fx?.cover && tgt.hp < tgt.st.hp * 0.3 && a.hp > a.st.hp * 0.5)));
      if (g) { this.pop(g, '掩護！', '#8ac8ff'); tgt = g; }
    }
    if (tgt.side === 'enemy' && u.side !== 'enemy' && S.tgt === 'enemy' && !ctx.counter && !ctx.chained && !tgt.traits?.has('guardian')) {
      const g = this.foes.find(f => f !== tgt && f.traits.has('guardian') && !f.broken && !f.status.stun && !f.status.sleep && !f.status.stop && !f.status.frozen);
      if (g && Math.random() < 0.75) { this.pop(g, '守衛！', '#8ac8ff'); tgt = g; }
    }
    if (S.type === 'mag' && tgt.status.reflect && (S.tgt === 'enemy' || S.tgt === 'ally') && !ctx.reflected) {
      this.pop(tgt, '反射', '#c8e8ff'); const pool = (u.side === 'enemy' ? this.foes : this.allies).filter(x => x.alive && !x.jumping);
      if (pool.length) { tgt = pool[Math.random() * pool.length | 0]; ctx = { ...ctx, reflected: true }; }
    }
    const elTag = tags.find(t => ELEM[t]);
    this.effect(S.anim || 'slash', tgt, elTag || tags[0] || 'sword', u, S);
    await wait(ctx.fast ? 100 : 170);
    if (!tgt.alive) return 0;
    const rx = tgt.side === 'enemy' && u.side !== 'enemy' ? this.reaction(u, tgt, S, tags) : null;
    const helpless0 = tgt.broken || tgt.status.sleep || tgt.status.stun || tgt.status.stop || tgt.status.frozen;
    const r = this.calc(u, tgt, S, tags, { ...ctx, rx: rx?.mul });
    if (r.miss) { this.pop(tgt, r.evade ? '閃避' : r.immune ? '無效' : 'MISS', '#c8c8c8'); this.G.audio.sfx('miss'); if (r.evade && tgt.side === 'party' && u.side === 'enemy' && !ctx.counter && (tgt.fx?.dodgeCounter || (tgt.on?.includes('p_dodgecounter') && Math.random() < 0.5))) this.counterQ = [tgt, u]; return 0; }
    if (r.block) {
      this.pop(tgt, '格擋', '#8ac8ff'); this.G.audio.sfx('guard');
      if ((tgt.stance === 'wall' || tgt.parry) && S.type === 'phys' && u.alive && !ctx.counter) this.counterQ = [tgt, u];
      return 0;
    }
    if (r.absorb) { this.heal(tgt, r.dmg); this.pop(tgt, '吸收', '#8affb0'); return 0; }
    if (tgt.parry && S.type === 'phys' && u.side === 'enemy' && Math.random() < 0.3) { this.pop(tgt, '招架！', '#8ac8ff'); this.G.audio.sfx('guard'); this.counterQ = [tgt, u]; return 0; }
    if (tgt.stance === 'parry' && S.type === 'phys' && u.side === 'enemy') { this.pop(tgt, '招架！', '#8ac8ff'); this.G.audio.sfx('guard'); this.counterQ = [tgt, u]; return 0; }
    tgt.lastTags = tags; tgt.lastBy = u; const el0 = tags.find(x => ELEM[x]); const prevEl = tgt.lastEl; if (el0) tgt.lastEl = el0;
    this.damage(tgt, r.dmg, { weak: r.weak, crit: r.crit, resist: r.resist });
    const hand = ctx.hand;
    if (rx) await this.afterReaction(u, tgt, S, tags, rx);
    if (tgt.status.hidden && (S.tgt !== 'enemy' || tags.includes('light'))) { delete tgt.status.hidden; this.pop(tgt, '現形！', '#ffe04a'); }
    if (tgt.side === 'enemy' && u.side === 'party') {
      if (u.key === 'purge' || u.fx?.antiUndying) tgt.noUndying = true;
      if (u.key === 'purge') tgt.noRegen = 2;
      if ((u.key === 'hawkeye' && ['bow', 'gun'].includes(hand?.type || S.wpn || S.art)) || u.fx?.revealHit) this.revealOne(tgt);
      if (u.key === 'opportunist' && helpless0 && !tgt.stolen && tgt.alive) this.steal(u, tgt);
      if (this.pairs?.has('twins') && r.crit && !tgt.stolen && tgt.alive) this.steal(u, tgt);
    }
    // breaking shields: weakness hits, or weapons / effects that crack them anyway
    if (tgt.side === 'enemy') {
      let n = 0;
      if (r.weak || rx?.brk) n = (r.weak ? 1 + (S.brk || 0) + (u.on?.includes('p_breaker') ? 1 : 0) : 0) + (rx?.brk || 0) + (r.markHit ? 1 : 0) + (S.type === 'mag' && !S.art && u.hands?.some(h => h.type === 'rod') && tags.some(t => ELEM[t]) ? 1 : 0);
      else if ((hand?.type === 'hammer' && Math.random() < 0.35) || (u.fx?.brk && Math.random() < u.fx.brk)) { n = 1; this.pop(tgt, '震擊', '#ffd04a'); }
      if (r.markHit && u.key !== 'hawkeye') tgt.mark = null;
      if (u.side === 'party' && u.key === 'firstcut' && !u.firstCutUsed) { u.firstCutUsed = true; n++; }
      if (u.key === 'flurry' && (hand?.type === 'knuckle' || S.art === 'knuckle') && (u.combo || 0) >= 3) n++;
      if (n) await this.breakHit(tgt, n);
    }
    // weapon traits on hit
    if (hand?.type === 'axe' && tgt.alive && S.type === 'phys') { this.buff(tgt, { def: -1 }, true); if (tgt.traits?.has('armor') && !tgt.noArmor) { tgt.noArmor = 2; this.pop(tgt, '破甲', '#ffb04a'); } }
    if (hand?.type === 'knuckle' || S.art === 'knuckle') { u.combo = u.comboT === tgt || u.key === 'flurry' ? Math.min(u.on?.includes('p_combo') ? 8 : 5, (u.combo || 0) + 1) : 0; u.comboT = tgt; if (u.combo) this.pop(u, `${u.combo + 1} COMBO`, '#ffb04a'); }
    const onHit = { ...(hand?.fx?.onHit || {}), ...(S.type === 'phys' && !hand && S.art ? (u.hands?.find(h => h.type === S.art)?.fx?.onHit || {}) : {}) };
    for (const [st, ch] of Object.entries(onHit)) if (tgt.alive) this.inflict(tgt, st, ch * (hand?.type === 'whip' || S.art === 'whip' ? 2 : 1), true);
    if (u.side === 'party' && S.type === 'phys') {
      if (u.fx?.drain) this.heal(u, Math.round(r.dmg * u.fx.drain), true);
      if (u.fx?.mpdrain) u.mp = Math.min(u.st.mp, u.mp + Math.round(r.dmg * u.fx.mpdrain));
    }
    if (S.drain) this.heal(u, Math.round(r.dmg * 0.5));
    if (u.side === 'party' && S.type === 'phys' && u.key === 'rage' && u.hp < u.st.hp * 0.5) this.heal(u, Math.round(r.dmg * 0.1), true);
    // thorny monsters bite back at whoever hits them up close
    if (tgt.side === 'enemy' && tgt.traits?.has('thorns') && u.side === 'party' && S.type === 'phys' && !S.ranged && !ctx.counter && u.hp > 1 && (WTYPES[hand?.type || S.art || S.wpn]?.melee ?? true) && !(u.key === 'flurry' && (hand?.type === 'knuckle' || S.art === 'knuckle'))) this.damage(u, Math.min(u.hp - 1, Math.max(1, Math.round(r.dmg * 0.2))), { color: '#8aff6a' });
    if (u.side === 'enemy' && u.traits?.has('curse') && S.type === 'phys' && tgt.alive) this.inflict(tgt, 'curse', 0.35, true);
    if (tgt.side === 'enemy' && u.side !== 'enemy' && tgt.alive && tgt.hp > 0) {
      const tr = tgt.traits;
      if (tr.has('harden') && (tgt.hard || 0) < 6) { tgt.hard = (tgt.hard || 0) + 1; this.pop(tgt, '硬化', '#c8c8d8'); }
      if (tr.has('adapt') && el0 && tgt.adaptEl !== el0) { tgt.adaptEl = el0; this.pop(tgt, `適應了${ELEM[el0]}`, '#8affb0'); }
      if (tr.has('counter') && u.side === 'party' && S.type === 'phys' && !ctx.counter && !S.ranged && (WTYPES[hand?.type || S.art || S.wpn]?.melee ?? true) && !tgt.broken && !tgt.status.stun && !tgt.status.sleep && !tgt.status.stop && !tgt.status.frozen && u.alive && Math.random() < 0.4) this.counterQ = [tgt, u];
      if (tr.has('split') && S.type === 'phys' && !tags.some(x => x === 'fire' || x === 'ice') && tgt.hp > tgt.st.hp * 0.3 && (this.splits || 0) < 3 && Math.random() < 0.35) await this.splitOff(tgt);
    }
    if (u.side === 'enemy' && u.alive && tgt.side === 'party' && S.type === 'phys') {
      if (u.traits.has('leech') && !u.status.poison && !u.status.burn) this.heal(u, Math.round(r.dmg * 0.5));
      if (u.traits.has('mpburn') && tgt.mp > 0) { const m = Math.max(1, Math.round(tgt.st.mp * 0.12)); tgt.mp = Math.max(0, tgt.mp - m); this.pop(tgt, `MP -${m}`, '#8ac8ff'); }
    }
    // chain lightning
    if (u.side === 'party' && tags.includes('thunder') && !ctx.chained && (u.key === 'chain' || u.fx?.chainT)) {
      const pool = this.foes.filter(f => f !== tgt); let n = 1 + (rx?.wasWet ? 1 : 0) + (this.pairs?.has('storm') ? 1 : 0);
      while (n-- > 0 && pool.length) { const x = pool.splice(Math.random() * pool.length | 0, 1)[0]; this.pop(x, '連鎖', '#ffe04a'); await this.strike(u, x, { ...S, pow: (S.pow || 1) * 0.6 }, tags, { ...ctx, chained: true, fast: true }); }
    }
    if (tgt.side === 'party' && tgt.alive && S.type === 'phys' && u.alive && !ctx.counter && !['bow', 'gun'].includes(hand?.type)) {
      if (tgt.fx?.thorns) { const d = Math.max(1, Math.round(r.dmg * tgt.fx.thorns * (tgt.key === 'bulwark' ? 2 : 1))); this.damage(u, d, { color: '#ffb04a' }); }
      const cc = (tgt.on.includes('p_counter') ? 0.35 : 0) + (tgt.fx?.counter || 0) + (tgt.stance === 'counter' ? 1 : 0) + (tgt.key === 'bulwark' ? 0.15 : 0);
      if (Math.random() < cc) this.counterQ = [tgt, u];
    }
    return r.dmg;
  }

  // what the element of this hit does to the element already on the target
  reaction(u, t, S, tags) {
    const st = t.status, els = tags.filter(x => ELEM[x]);
    const blunt = S.type === 'phys' && (tags.includes('hammer') || tags.includes('knuckle'));
    let name = null, mul = 1, brk = 0, eff = null;
    for (const el of els) {
      if (el === 'thunder' && st.wet) { name = '感電'; mul = 1.8; brk = 1; eff = 'shock'; break; }
      if (el === 'ice' && st.wet) { name = '凍結'; mul = 1.2; eff = 'freeze'; break; }
      if (el === 'fire' && (st.chill || st.frozen)) { name = '融解'; mul = 2; eff = 'melt'; break; }
      if (el === 'water' && st.burn) { name = '蒸氣'; mul = 1.4; eff = 'steam'; break; }
      if (el === 'wind' && st.burn) { name = '延燒'; mul = 1.3; eff = 'spread'; break; }
      if (el === 'wind' && st.wet) { name = '寒風'; eff = 'chillwind'; break; }
      if (el === 'earth' && st.wet) { name = '泥沼'; mul = 1.2; eff = 'mud'; break; }
      if (el === 'light' && st.erosion) { name = '聖爆'; mul = 2; eff = 'holy'; break; }
    }
    if (!name && st.frozen && (blunt || els.includes('earth'))) { name = '粉碎'; mul = 2.5; brk = 1; eff = 'shatter'; }
    if (name) {
      if (u.key === 'resonate') mul = 1 + (mul - 1) * 1.5;
      if (eff === 'steam' && this.pairs?.has('steam')) mul *= 2;
      if (eff === 'shatter' && this.pairs?.has('shatter')) mul *= 1.5;
    }
    return { name, mul, brk, eff, els, wasWet: !!st.wet, hadChill: !!st.chill };
  }
  async afterReaction(u, t, S, tags, rx) {
    if (t.hp <= 0) return;
    const st = t.status;
    if (rx.name) {
      this.pop(t, rx.name + '！', '#ffe04a', true); this.flash('#ffffff', 0.12);
      if (rx.eff === 'shock') { delete st.wet; if (!t.boss && (this.pairs?.has('storm') || this.allies.some(a => a.fx?.shockStun) || Math.random() < 0.5)) this.inflict(t, 'stun', 1, true); }
      if (rx.eff === 'freeze') { delete st.wet; await this.freeze(u, t); }
      if (rx.eff === 'melt') { delete st.chill; delete st.frozen; }
      if (rx.eff === 'steam') { delete st.burn; for (const f of this.foes) this.inflict(f, 'blind', this.pairs?.has('steam') ? 1 : 0.5, true); }
      if (rx.eff === 'spread') for (const f of this.foes) if (f !== t) this.setState(f, 'burn', 2, u);
      if (rx.eff === 'chillwind') { delete st.wet; this.setState(t, 'chill', 2, u); }
      if (rx.eff === 'mud') { delete st.wet; this.setState(t, 'mud', 2, u); if (t.traits?.has('fly')) t.grounded = 2; }
      if (rx.eff === 'holy') { delete st.erosion; this.dispel(t); }
      if (rx.eff === 'shatter') delete st.frozen;
    } else for (const el of rx.els) { const k = STATE_OF[el]; if (k) this.setState(t, k, 2, u); }
    if (rx.els.includes('water') && (u.key === 'tide' || u.fx?.wetAll)) for (const f of this.foes) if (f !== t) this.setState(f, 'wet', 2, u);
    if (!rx.name && rx.els.includes('ice') && rx.hadChill && u.on?.includes('p_freezelong') && Math.random() < 0.3) await this.freeze(u, t);
    if (S.freeze && t.alive && !st.frozen && (rx.wasWet || Math.random() < S.freeze)) await this.freeze(u, t);
    this.ui.refresh();
  }
  setState(t, k, n, u) {
    if (!t.alive || t.E?.metal) return;
    let d = n;
    if (k === 'burn' && (u?.on?.includes('p_burnlong') || this.pairs?.has('pyre'))) d += 2;
    if (k === 'wet' && u?.on?.includes('p_wetlong')) d += 2;
    t.status[k] = Math.max(t.status[k] || 0, d);
    if (k === 'burn') t.burnBy = u;
  }
  async freeze(u, t) {
    if (!t.alive) return;
    if (t.boss) { this.pop(t, '凍住了一瞬', '#bfe8ff'); await this.breakHit(t, 1); return; }
    delete t.status.wet; delete t.status.chill;
    t.status.frozen = u?.key === 'permafrost' ? 2 : 1; this.pop(t, '凍結', '#bfe8ff');
    if (u?.key === 'permafrost' && t.side === 'enemy') await this.breakHit(t, 1);
  }
  calc(u, t, S, tags, o = {}) {
    const phys = S.type === 'phys';
    const hand = o.hand, wt = hand?.type || S.art || S.wpn;
    const W = WTYPES[wt];
    if (t.status.hidden && S.tgt === 'enemy' && !tags.includes('light') && u.side !== 'enemy' && Math.random() < 0.6) return { miss: true, evade: true };
    if (t.side === 'party' && t.key === 'shadow' && !t.shadowUsed && u.side === 'enemy' && (S.type === 'phys' || S.type === 'mag')) { t.shadowUsed = true; this.counterQ = [t, u]; return { miss: true, evade: true }; }
    let A;
    if (S.byDef) A = u.st.def * this.bmul(u, 'def') * 1.5;
    else A = phys ? (o.atk ?? u.st.atk) * this.bmul(u, 'atk') : u.st.mag * this.bmul(u, 'mag');
    const flying = t.traits?.has('fly') && !t.grounded && !t.status.mud;
    if (flying && tags.includes('earth') && !phys) return { miss: true, immune: true };
    if (t.E?.metal && !phys) return { miss: true, immune: true };
    if (phys) {
      if (u.status.blind && Math.random() < 0.5) return { miss: true };
      const sure = ['bow', 'gun'].includes(wt) || S.ranged;
      const ev = t.status.mud ? 0 : (t.evadeT || 0) + (t.fx?.evade || 0) + (t.traits?.has('evade') ? 0.25 : 0) - (wt === 'dagger' ? 0.1 : 0);
      if (t.evadeT) t.evadeT = 0;
      if (!sure && wt === 'axe' && Math.random() < 0.1) return { miss: true };
      if (!sure && Math.random() < ev) return { miss: true, evade: true };
      if (t.side === 'party' && u.side !== 'party' && Math.random() < (t.stance === 'wall' ? 1 : t.block || 0)) return { block: true };
    } else if (S.type === 'mag' && t.side === 'party' && u.side !== 'party' && t.mblock && Math.random() < t.mblock) return { block: true };
    const armored = t.traits?.has('armor') && !t.noArmor;
    let D = phys ? t.st.def * this.bmul(t, 'def') : t.st.spr * this.bmul(t, 'spr');
    if (phys && armored && !['hammer', 'gun'].includes(wt)) D *= 1.6;
    if (S.pierce || (phys && wt === 'gun')) D = 0;
    if (S.ignoreDef) D *= 1 - S.ignoreDef;
    let dmg = A * (S.pow || 1) * 60 / (60 + D * 1.5);
    if (u.side === 'enemy') dmg *= ENEMY_DMG;
    if (u.side === 'summon') dmg *= 1.15 * (u.up || 1);
    const weakList = t.side === 'enemy' ? [...t.weak, ...Object.keys(t.extraWeak || {})] : [];
    const weak = tags.some(x => weakList.includes(x));
    const resist = !weak && t.side === 'enemy' && !t.noResist && tags.length && tags.every(x => t.resist.includes(x));
    if (weak) { dmg *= 1.5; for (const x of tags) if (weakList.includes(x)) t.revealed.add(x); this.remember(t); }
    if (resist) dmg *= 0.5;
    if (t.side === 'enemy' && t.absorb?.length && !t.noResist && tags.some(x => t.absorb.includes(x))) return { dmg: Math.max(1, Math.round(dmg * 0.5)), absorb: true };
    // party resistances, absorption and barriers
    if (t.side === 'party') {
      for (const e of tags) {
        if (!ELEM[e]) continue;
        const rv = t.fx?.resist?.[e];
        if (rv != null) { if (rv < 0) return { dmg: Math.max(1, Math.round(dmg * -rv)), absorb: true }; dmg *= rv; }
        if (t.barrier?.[e]) dmg *= 0.5;
      }
    }
    // flying enemies dodge blades; bows and boomerangs pluck them out of the air
    if (flying && phys) { if (W?.melee && !S.ranged) dmg *= 0.6; if (wt === 'bow') dmg *= 1.3; if (wt === 'boomerang') dmg *= 1.2; if (S.vsFly) dmg *= S.vsFly; }
    if (armored && S.vsArmor) dmg *= S.vsArmor;
    const helpless = t.broken || t.status.sleep || t.status.stun || t.status.stop || t.status.frozen;
    if (S.vsHelpless && helpless) dmg *= S.vsHelpless;
    else if (wt === 'dagger' && phys && helpless) dmg *= 1.5;
    if (u.fx && t.fam) dmg *= Math.max(u.fx.slay?.[t.fam] || 1, hand?.fx?.slay?.[t.fam] || 1, flying ? (u.fx.slay?.flying || hand?.fx?.slay?.flying || 1) : 1);
    if (this.zone?.el && tags.includes(this.zone.el)) dmg *= 1.4;
    if (t.side === 'enemy') {
      if (phys && t.traits?.has('ghost') && !tags.some(x => ELEM[x]) && !t.noResist) dmg *= 0.3;
      if (!phys && S.type === 'mag' && !S.art && t.traits?.has('mimmune') && !t.noResist) dmg *= 0.35;
      if (t.phase === 'phys' && phys) dmg *= 0.15;
      if (t.phase === 'mag' && !phys && S.type === 'mag' && !S.art) dmg *= 0.15;
      if (t.hard) dmg *= 1 - 0.08 * t.hard;
      if (t.adaptEl && tags.includes(t.adaptEl) && !t.noResist) dmg *= 0.35;
      if (this.foes.some(f => f !== t && f.aura === 'guard')) dmg *= 0.7;
      if (t.status.wet) dmg *= 1 + (this.hasKey('tide') ? 0.15 : 0) + Math.max(0, ...this.allies.map(a => a.fx?.wetAmp || 0));
    }
    if (u.side === 'enemy') { if (this.foes.some(f => f !== u && f.aura === 'might')) dmg *= 1.3; if (u.enraged) dmg *= 1.4; if (t.hunted && this.foes.some(f => f.traits?.has('hunter'))) dmg *= 1.3; }
    if (u.side === 'party') {
      if (u.fx?.elUp) for (const x of tags) if (u.fx.elUp[x]) dmg *= 1 + u.fx.elUp[x];
      if (['undead', 'demon'].includes(t.fam)) dmg *= (u.key === 'purge' ? 1.5 : 1) * (u.on?.includes('p_antiundead') ? 1.3 : 1);
      if (phys && u.key === 'rage' && u.hp < u.st.hp * 0.5) dmg *= 1.5;
      if (phys && u.on?.includes('p_bloodrage') && u.hp < u.st.hp * 0.3) dmg *= 1.3;
      if (u.key === 'harvest' && tags.includes('dark')) dmg *= 1 + 0.25 * Math.min(3, this.debuffCount(t));
      if (S.vsState) for (const [k, m] of Object.entries(S.vsState)) if (t.status[k]) { dmg *= m; break; }
      if (flying && (u.key === 'dragoon' || this.pairs?.has('skyhunt'))) dmg *= 1.5;
      if (this.pairs?.has('twilight') && ((t.lastEl === 'light' && tags.includes('dark')) || (t.lastEl === 'dark' && tags.includes('light')))) dmg *= 1.4;
      if (u.key === 'artisan' && t.fam === 'machine') dmg *= 1.3;
      if (S.luck) dmg *= 0.5 + Math.random() * 2;
    }
    if (o.rx) dmg *= o.rx;
    if (u._counterNow && u.key === 'bulwark') dmg *= 1.5;
    let markHit = false; if (t.mark && tags.includes(t.mark.el)) { dmg *= (u.key === 'hawkeye' ? 1.8 : 1.5) * (1 + (u.fx?.markAmp || 0)); markHit = true; }
    if (t.side === 'enemy' && t.broken) dmg *= 1.6;
    if (this.inExtra) dmg *= 1.3;
    if (u.charged) dmg *= 2.5;
    if (t.defending) dmg *= 0.5;
    if (u.on) { for (const [p, e] of [['p_fireup', 'fire'], ['p_thunderup', 'thunder'], ['p_windup', 'wind']]) if (u.on.includes(p) && tags.includes(e)) dmg *= 1.25; }
    if (!phys && !S.art && u.hands?.some(h => h.type === 'rod') && tags.some(x => ELEM[x])) dmg *= 1.2;
    if (u.fx?.lowhp) dmg *= 1 + u.fx.lowhp * (1 - u.hp / u.st.hp);
    if (wt === 'knuckle' && phys && (u.comboT === t || u.key === 'flurry')) dmg *= 1 + 0.2 * Math.min(u.on?.includes('p_combo') ? 8 : 5, (u.combo || 0) + 1);
    const helplessC = t.broken || t.status.sleep || t.status.stun || t.status.stop || t.status.frozen;
    let critC = phys && wt !== 'gun' ? (u.on?.includes('p_crit') ? 0.15 : 0.05) + (u.fx?.crit || 0) + (S.critUp || 0) + (u.key === 'fortune' ? 0.15 : 0) + (u.on?.includes('p_marksman') && wt === 'bow' ? 0.15 : 0) : 0;
    if (phys && u.side === 'party' && ((u.key === 'opportunist' && helplessC) || (u.key === 'firstcut' && !u.firstCutUsed) || (this.pairs?.has('iaido') && wt === 'katana' && t.broken))) critC = 1;
    if (phys && wt === 'katana' && !u.drawn && u.side === 'party') critC = 1;
    if (S.iai && this.firstInRound === u) critC = 1;
    const crit = Math.random() < critC; if (crit) dmg *= wt === 'katana' ? 2 : 1.5;
    dmg *= 0.92 + Math.random() * 0.16;
    // metal monsters shrug off everything but a critical hit
    if (t.E?.metal) return { dmg: crit ? t.hp : 1, weak: false, crit, resist: false };
    return { dmg: Math.max(1, Math.min(99999, Math.round(dmg))), weak, crit, resist, markHit };
  }
  remember(t) { if (t.side === 'enemy') this.S.flags['seen_' + t.id] = [...t.revealed]; }
  bmul(u, k) { const b = u.buffs[k]; const c = u.status?.curse ? 0.8 : 1; if (!b) return c; return c * (b.v > 0 ? 1 + b.v * 0.25 : 1 / (1 - b.v * 0.25)); }
  buff(u, o, quiet) {
    for (const k in o) {
      const cur = u.buffs[k]?.v || 0; const v = Math.max(-3, Math.min(3, cur + o[k]));
      u.buffs[k] = { v, t: 3 + (o[k] > 0 && this.curActor?.key === 'encore' ? 2 : 0) };
      if (!quiet) this.pop(u, ({ atk: '攻擊', def: '防禦', mag: '魔力', spr: '精神', spd: '速度' })[k] + (o[k] > 0 ? '↑' : '↓'), o[k] > 0 ? '#8affb0' : '#ff8a8a');
    }
    this.ui?.refresh(); // monsters with intimidate buff before the battle UI exists
  }
  inflict(t, st, chance, quiet) {
    if (!t.alive) return;
    if (t.immune || t.immuneSet?.has(st) || t.E?.metal) { if (!quiet) this.pop(t, '無效', '#c8c8c8'); return; }
    if (t.boss) { if (st === 'doom') { if (!quiet) this.pop(t, '無效', '#c8c8c8'); return; } if (['sleep', 'stop', 'confuse', 'stun'].includes(st)) chance *= 0.25; }
    if (Math.random() > chance) return;
    if (t.charging && ['stun', 'stop', 'sleep'].includes(st)) { t.charging = false; this.pop(t, '蓄力被打斷！', '#8ae0ff'); }
    t.status[st] = ({ stop: 2, stun: 1, doom: 3, confuse: 2 }[st] || 3) * (['slow', 'stop'].includes(st) && this.curActor?.key === 'gears' ? 2 : 1);
    this.pop(t, STATUS_N[st], '#c86aff');
    if (st === 'stop' || st === 'stun') this.ui.timeline();
  }
  apply(t, st) { t.status[st] = st === 'reraise' ? 99 : st === 'haste' ? 4 * (this.curActor?.key === 'gears' ? 2 : 1) + (this.curActor?.on?.includes('p_timelong') ? 2 : 0) : 3; this.pop(t, STATUS_N[st], '#8affb0'); }
  steal(u, t) {
    if (t.stolen) { this.pop(t, '已經沒東西了', '#c8c8c8'); return; }
    const d = t.E.drops || [], bonus = u.fx?.steal || 0;
    if (!d.length || Math.random() > 0.6 + bonus * 0.5) { this.pop(t, '偷竊失敗', '#c8c8c8'); return; }
    // the rarer slots are harder to lift
    const r = Math.random(), slot = r < 0.5 - bonus * 0.2 ? 0 : r < 0.8 - bonus * 0.2 ? 1 : r < 0.96 - bonus * 0.1 ? 2 : 3;
    const id = (d[slot] || d[0])[0];
    if (!id || String(id).startsWith('k_')) { this.pop(t, '偷竊失敗', '#c8c8c8'); return; }
    t.stolen = true; addItem(this.S, id, 1); this.pop(t, `偷到了 ${itemName(id)}！`, '#ffe04a'); this.G.audio.sfx('item');
    (this.S.dropSeen = this.S.dropSeen || {})[t.id + ':' + slot] = 1;
  }
  async breakHit(t, n) {
    if (t.broken) return;
    t.shield = Math.max(0, t.shield - n);
    this.ui.refresh();
    if (t.shield === 0) {
      if (this.curActor?.key === 'fortune') this.curActor.limit = Math.min(100, (this.curActor.limit || 0) + 25);
      t.broken = true; t.brokenUntil = this.round + 1; if (t.charging) { t.charging = false; this.pop(t, '蓄力被打斷！', '#8ae0ff'); }
      this.G.audio.sfx('break');
      this.pop(t, 'BREAK!', '#ffe04a', true);
      this.fx.emit({ x: t.x, y: 1.2, z: t.z, n: 60, color: '#ffe04a', speed: 5, life: 0.8, size: 0.3, gravity: 3 });
      this.flash('#ffffff', 0.35); this.camShake = 0.35;
      t.spr.mesh.rotation.z = 0.25;
      // remove its remaining turn this round
      this.queue = this.queue.filter(q => q !== t);
      this.ui.timeline();
      await wait(250);
    }
  }
  damage(t, d, o = {}) {
    t.hp = Math.max(0, t.hp - d);
    if (t.status.sleep && Math.random() < 0.5) delete t.status.sleep;
    if (t.status.confuse && Math.random() < 0.3) delete t.status.confuse;
    if (t.side === 'enemy' && t.boss && !t.halfSaid && t.hp > 0 && t.hp <= t.st.hp * 0.5 && BOSS_HALF[t.id]) { t.halfSaid = true; this.msg(`${t.E.name}：「${BOSS_HALF[t.id]}」`); }
    if (t.side === 'enemy' && t.traits?.has('enrage') && !t.enraged && t.hp > 0 && t.hp <= t.st.hp * 0.5) { t.enraged = true; t.status.enraged = 99; this.pop(t, '狂暴化！', '#ff4a3a', true); }
    if (t.hp <= 0 && t.side === 'party' && !this.rewindUsed && this.hasKey('gears') && (t.roundHp || 0) > 0) { this.rewindUsed = true; t.hp = Math.max(1, t.roundHp); this.pop(t, '時間倒流！', '#e8d08a', true); }
    if (t.hp <= 0 && t.side === 'party' && t.fx?.survive && !t.survived2) { t.hp = 1; t.survived2 = true; this.pop(t, '不屈！', '#ffb04a'); }
    if (t.hp <= 0 && t.side === 'party' && t.on.includes('p_survive') && !t.survived) { t.hp = 1; t.survived = true; this.pop(t, '不屈！', '#ffb04a'); }
    this.number(t, d, o.weak ? '#ffe04a' : o.color || (t.side === 'party' ? '#ff8a8a' : '#ffffff'), o);
    t.flash = 1; t.shakeT = 0.3;
    if (t.side === 'party') { t.limit = Math.min(100, t.limit + Math.round(d / t.st.hp * 70 * (1 + (t.fx?.limitup || 0)) * ((t.key === 'rage' && t.hp < t.st.hp * 0.5) || (t.on?.includes('p_bloodrage') && t.hp < t.st.hp * 0.3) ? 2 : 1))); if (t.hp > 0) { t.spr.setFrame(BPOSE.hurt); t.hurtT = 0.45; } }
    this.G.audio.sfx(o.weak ? 'weak' : 'hit');
    if (t.hp <= 0) t.dying = true;
    this.ui.refresh();
  }
  heal(t, h, quiet) { if (!t.alive) return; const before = t.hp; t.hp = Math.min(t.st.hp, t.hp + h); if (!quiet || t.hp > before) this.number(t, t.hp - before, '#8affb0', {}); this.ui.refresh(); }
  checkDeaths() {
    for (const u of this.units) if (u.alive && u.hp <= 0) {
      if (u.side === 'party' && u.status.reraise) { delete u.status.reraise; u.hp = Math.max(1, Math.round(u.st.hp * 0.2)); this.pop(u, '自動復活！', '#fff4b0'); this.effect('raise', u, 'light', u); continue; }
      if (u.side === 'enemy' && u.traits?.has('undying') && !u.revived && !u.noUndying && !u.broken && !(u.lastTags || []).some(x => x === 'light' || x === 'fire')) { u.revived = true; u.hp = Math.round(u.st.hp * 0.4); this.pop(u, '不死復活！', '#c84aff', true); this.effect('raise', u, 'dark', u); continue; }
      u.alive = false; u.dying = false;
      if (u.side === 'enemy') { this.fadeOut(u); this.G.audio.sfx('kill'); this.onEnemyDeath(u); }
      else { u.spr.setFrame(BPOSE.ko); u.buffs = {}; u.status = {}; u.jumping = null; u.oy = 0; }
      this.queue = (this.queue || []).filter(q => q !== u);
    }
    if (this.recheck) { this.recheck = false; return this.checkDeaths(); }
    this.ui.refresh(); this.ui.timeline();
  }
  onEnemyDeath(u) {
    const k = u.lastBy;
    if (u.traits.has('burst') && !u.broken && !(u.lastTags || []).some(x => x === 'ice' || x === 'water')) {
      this.pop(u, '自爆！', '#ff6a2a', true); this.camShake = 0.4; this.effect('explode', u, 'fire', u);
      for (const a of this.allies) this.damage(a, Math.max(1, Math.round(a.st.hp * 0.12 * (a.fx?.resist?.fire ?? 1))), {});
      this.recheck = true;
    }
    if (u.traits.has('swarm')) for (const f of this.foes) if (f.E?.kind === u.E?.kind) this.buff(f, { atk: 1 }, true);
    if (u.traits.has('martyr') && !u.broken) { const rest = this.foes.filter(f => f !== u); if (rest.length) { this.pop(u, '殉道！', '#fff4b0', true); for (const f of rest) { this.heal(f, Math.round(f.st.hp * 0.35)); this.buff(f, { def: 1, spr: 1 }, true); } } }
    if (u.stoleItem) { addItem(this.S, u.stoleItem, 1); this.pop(u, `拿回了 ${itemName(u.stoleItem)}`, '#ffe04a'); u.stoleItem = null; }
    if (u.stoleGil) { this.S.gil += u.stoleGil; this.pop(u, `拿回了 ${u.stoleGil}G`, '#ffe04a'); u.stoleGil = 0; }
    if (u.traits.has('hunter')) for (const a of this.party) a.hunted = false;
    if (this.hasKey('harvest')) for (const a of this.allies) a.mp = Math.min(a.st.mp, a.mp + Math.round(a.st.mp * 0.08));
    if (k?.side === 'party') {
      if (k.on?.includes('p_soulharvest')) k.mp = Math.min(k.st.mp, k.mp + Math.round(k.st.mp * 0.15));
      if (k.fx?.killHeal) this.heal(k, Math.round(k.st.hp * k.fx.killHeal), true);
    }
    if (u.status.burn && (u.burnBy?.key === 'inferno' || u.burnBy?.fx?.spreadBurn)) for (const f of this.foes) this.setState(f, 'burn', 2, u.burnBy);
  }
  async fadeOut(u) {
    const m = u.spr.mat; m.transparent = true; m.alphaTest = 0;
    this.fx.emit({ x: u.x, y: u.spr.h * 0.5, z: u.z, n: 40, color: '#c8a0ff', speed: 2, up: 1.5, life: 1, size: 0.3, gravity: -1, spread: u.spr.w * 0.6 });
    let t = 0; while (t < 0.6) { t += await this.G.frame(); m.opacity = 1 - t / 0.6; m.color.setRGB(1 + t * 2, 0.6 + t, 1 + t * 2); }
    u.spr.mesh.visible = false; u.shadow.visible = false;
  }

  // ---------------------------------------------------------------- enemies
  async enemyTurn(u, second) {
    if (!second) {
      const tr = u.traits; u.turnN = (u.turnN || 0) + 1;
      if (tr.has('countdown')) { u.count--; if (u.count <= 0) { u.count = 4; await this.doomsday(u); return; } this.pop(u, `倒數 ${u.count}`, '#ffb04a'); }
      if (tr.has('charge')) {
        if (u.charging) { u.charging = false; this.msg('蓄力爆擊！'); await this.useSkill(u, 'e_chargeblast', this.allies.filter(a => !a.jumping), {}); return; }
        if (u.turnN % 3 === 0) { u.charging = true; this.pop(u, '蓄力中……', '#ffe04a', true); this.msg(`${u.name} 正在蓄力！破防或暈眩可以打斷`); await wait(600); this.ui.refresh(); return; }
      }
      if (tr.has('flee') && u.turnN >= 3) return this.enemyFlee(u, '逃走了');
      if (tr.has('thief')) {
        if (u.stoleItem || u.stoleGil) return this.enemyFlee(u, '帶著東西逃走了');
        const pool = this.allies.filter(a => !a.jumping);
        if (pool.length && Math.random() < 0.65) {
          const tgt = pool[Math.random() * pool.length | 0];
          await this.useSkill(u, 'e_snatch', [tgt], {});
          if (u.alive) {
            const own = Object.keys(this.S.items).filter(i => this.S.items[i] > 0 && ITEMS[i]?.use && !String(i).startsWith('k_'));
            if (own.length) { const it = own[Math.random() * own.length | 0]; this.S.items[it]--; if (!this.S.items[it]) delete this.S.items[it]; u.stoleItem = it; this.pop(tgt, `被偷走 ${itemName(it)}！`, '#ffb04a', true); }
            else { const g = Math.min(this.S.gil, 30 + u.lv * 8); this.S.gil -= g; u.stoleGil = g; this.pop(tgt, `被偷走 ${g}G！`, '#ffb04a', true); }
            this.msg(`${u.name} 下回合就會逃走！`);
          }
          return;
        }
      }
      if (tr.has('hunter') && (!u.prey || !u.prey.alive)) { const pool = this.allies.filter(a => !a.jumping); if (pool.length) { for (const a of this.party) a.hunted = false; u.prey = pool[Math.random() * pool.length | 0]; u.prey.hunted = true; this.pop(u.prey, '被鎖定了！', '#ff4a3a', true); await wait(300); } }
    }
    const acts = u.E.acts; let total = acts.reduce((s, a) => s + a[1], 0), r = Math.random() * total, pick = acts[0][0];
    for (const [s, w] of acts) { r -= w; if (r <= 0) { pick = s; break; } }
    let S = SKILLS[pick];
    if (S.type === 'heal' && !this.foes.some(f => f.hp < f.st.hp * 0.6)) { pick = acts.find(a => SKILLS[a[0]].type === 'phys')?.[0] || 'e_tackle'; S = SKILLS[pick]; }
    if (S.charge && u.charged) { pick = acts.find(a => ['phys', 'mag'].includes(SKILLS[a[0]].type))[0]; S = SKILLS[pick]; }
    let targets;
    const pool = this.allies.filter(a => !a.jumping);
    if (!pool.length) return;
    const prey = this.foes.find(f => f.traits?.has('hunter') && f.prey?.alive && !f.prey.jumping)?.prey;
    if (S.tgt === 'enemy' && prey && !pool.some(a => a.taunt)) targets = [prey];
    else if (S.tgt === 'enemy') { const taunt = pool.filter(a => a.taunt); targets = [taunt.length && (taunt[0].key === 'aegisheart' || Math.random() < 0.8) ? taunt[0] : pool[Math.random() * pool.length | 0]]; }
    else if (S.tgt === 'enemies' || S.tgt === 'random') targets = pool;
    else if (S.tgt === 'allyE') { const low = this.foes.sort((a, b) => a.hp / a.st.hp - b.hp / b.st.hp)[0]; targets = [low]; S = { ...S, tgt: 'ally' }; }
    else targets = [u];
    await this.useSkill(u, pick, targets, { second });
  }

  // ---------------------------------------------------------------- summons
  async summon(u, sid) {
    const D = SUMMONS[sid];
    const cost = Math.round(D.mp * (u.key === 'pact' ? 0.6 : 1));
    if (u.mp < cost) { this.msg('MP不足！'); await wait(500); return; }
    u.mp -= cost;
    await this.ui.banner(D.name, '召喚', '#ffb04a');
    let px = monsterPx(D.look, D.colors); if (D.look !== 'knight') px = px.flip().flip();
    // summons face the enemies (left), their art already faces left
    const spr = new VoxelSprite(px, { scale: 2.3, glow: 0.4 }); spr.pop = 1;
    const su = { side: 'summon', sid, D, name: D.name, spr, st: { atk: u.st.mag * 1.1, mag: u.st.mag * 1.2, spd: u.st.spd, hp: 1, def: 0, spr: 0 }, buffs: {}, status: {}, alive: true, turns: 0, on: [], x: 7, z: -0.5, y: 0, ox: 0, oy: 0, flash: 0, maxT: u.key === 'pact' ? 4 : 3, pact: u.key === 'pact', up: u.on.includes('p_summonup') ? 1.3 : 1 };
    spr.mesh.position.set(7, 0, -0.5); spr.mesh.rotation.y = -0.4; this.scene.add(spr.mesh);
    this.summonU = su;
    this.fx.emit({ x: 7, y: 1.5, z: -0.5, n: 80, color: '#ffe0a0', speed: 4, life: 1.2, size: 0.35, gravity: -1 });
    this.G.audio.sfx('summon');
    if (this.pairs?.has('covenant')) for (const a of this.allies) this.heal(a, Math.round(a.st.hp * 0.3));
    await wait(600);
    this.ui.timeline();
  }
  async summonTurn(su) {
    su.turns++;
    const D = su.D;
    const last = su.turns >= (su.maxT || 3);
    const sid = last ? D.ult : D.acts[(su.turns - 1) % D.acts.length];
    if (last) { await this.ui.banner(SKILLS[sid].name, D.name, '#ffb04a'); }
    await this.useSkill(su, sid, this.targetsFor(su, SKILLS[sid]), { res: true });
    if (last && su.pact) for (const f of this.foes) await this.breakHit(f, 2);
    if (last) {
      this.msg(`${D.name} 離開了`);
      const m = su.spr.mat; m.transparent = true; m.alphaTest = 0; let t = 0; while (t < 0.6) { t += await this.G.frame(); m.opacity = 1 - t / 0.6; su.oy = t * 4; }
      this.scene.remove(su.spr.mesh); this.summonU = null; this.ui.timeline();
    }
  }

  // ---------------------------------------------------------------- resonance
  async resonance() {
    const opts = this.allies.filter(u => u.echo).map(u => ({ u, e: u.echo }));
    if (!opts.length) return;
    let pick = 0;
    if (!this.auto) pick = await this.ui.resonanceMenu(opts); else pick = opts.findIndex(o => SKILLS[ECHOES[o.e].resonance].type !== 'heal' && SKILLS[ECHOES[o.e].resonance].type !== 'buff') >= 0 ? opts.findIndex(o => SKILLS[ECHOES[o.e].resonance].type !== 'heal' && SKILLS[ECHOES[o.e].resonance].type !== 'buff') : 0;
    if (pick < 0) pick = 0;
    const { u, e } = opts[pick]; const E = ECHOES[e]; const sid = E.resonance;
    await this.ui.cutin(e, SKILLS[sid].name);
    this.camZoom = 1;
    const S = SKILLS[sid];
    await this.useSkill({ ...u, side: 'party', st: { ...u.st, atk: u.st.atk * 1.2, mag: u.st.mag * 1.2 }, on: [], spr: u.spr, mp: 999, x: u.x, z: u.z }, sid, this.targetsFor(u, S), { res: true });
    this.camZoom = 0;
    this.ui.refresh();
  }

  // ---------------------------------------------------------------- items
  async useItem(u, id, targets) {
    const I = ITEMS[id];
    const save = (u.key === 'alchemy' && Math.random() < 0.3) || (u.on?.includes('p_itemsave') && Math.random() < 0.25) || (this.pairs?.has('workshop') && Math.random() < 0.4);
    if (save) this.pop(u, '沒有消耗！', '#a8e86a'); else { this.S.items[id]--; if (!this.S.items[id]) delete this.S.items[id]; }
    const ik = (u.key === 'alchemy' ? 1.6 : 1);
    const e = I.use;
    if (e.cast) { this.msg(I.name); return this.useSkill(u, e.cast, targets, { scroll: true }); }
    this.msg(I.name); u.spr.setFrame(BPOSE.item); await wait(300);
    if (e.escape) { if (this.units.some(x => x.boss) || this.opts.noFlee) { this.msg('無法逃走！'); await wait(500); return; } this.msg('成功逃走了！'); await wait(500); this.result = 'flee'; return; }
    for (const t of targets) {
      if (e.revive) { if (!t.alive) { t.alive = true; t.hp = Math.max(1, Math.round(t.st.hp * e.revive)); t.spr.setFrame(BPOSE.idle); this.pop(t, '復活', '#fff4b0'); this.effect('raise', t, 'light', u); } continue; }
      if (!t.alive) continue;
      if (e.heal) { this.heal(t, Math.round(e.heal * ik * (u.on?.includes('p_itemup') ? 1.3 : 1) * (1 + (u.fx?.healup || 0) * 0.5))); this.effect('heal', t, 'light', u); }
      if (e.mp) { const b = t.mp; t.mp = Math.min(t.st.mp, t.mp + e.mp); this.number(t, t.mp - b, '#8ac8ff', {}); }
      if (e.cure) { for (const k of ['poison', 'sleep', 'silence', 'blind', 'slow', 'stun', 'stop', 'doom', 'confuse', 'curse']) delete t.status[k]; this.pop(t, '恢復了', '#fff'); }
      if (e.cureOnly) { for (const k of e.cureOnly) delete t.status[k]; this.pop(t, '恢復了', '#fff'); }
      if (e.buff) this.buff(t, e.buff);
      if (e.status && e.self) this.apply(t, e.status);
      else if (e.status) { this.effect('dark', t, 'dark', u); this.inflict(t, e.status, e.chance || 0.6); }
      if (e.regen) t.status.regen = e.regen;
      if (e.evadeT) { t.evadeT = e.evadeT; this.pop(t, '幻影', '#8affb0'); }
      if (e.analyze) { for (const w of t.weak || []) t.revealed.add(w); this.remember(t); this.pop(t, '弱點看穿！', '#ffe04a'); this.G.audio.sfx('scan'); }
      if (e.dmg && t.E?.metal) { this.damage(t, 1, {}); continue; }
      if (e.dmg) {
        const tag = e.el || e.wpn; this.effect(e.el === 'fire' ? 'explode' : e.el ? ({ earth: 'quake', light: 'holy' }[e.el] || e.el) : 'slash', t, tag, u);
        const weak = t.weak?.includes(tag) || !!t.extraWeak?.[tag];
        let d = e.dmg * ik * (u.key === 'artisan' ? 1.5 : 1) * (weak ? 1.5 : 1) * (t.broken ? 1.6 : 1) * (0.9 + Math.random() * 0.2);
        if (e.el && this.zone?.el === e.el) d *= 1.4;
        if (e.el === 'earth' && t.traits?.has('fly') && !t.grounded) { this.pop(t, '無效', '#c8c8c8'); continue; }
        this.damage(t, Math.round(d), { weak });
        t.lastTags = [tag]; t.lastBy = u;
        if (weak) { t.revealed.add(tag); this.remember(t); }
        if (weak || u.key === 'artisan') await this.breakHit(t, (weak ? 1 : 0) + (u.key === 'artisan' ? 1 : 0));
        if (u.key === 'alchemy' && e.el && t.alive) await this.afterReaction(u, t, { type: 'mag' }, [e.el], this.reaction(u, t, { type: 'mag' }, [e.el]));
      }
    }
    await wait(400); this.checkDeaths(); u.spr.setFrame(BPOSE.idle); this.ui.refresh();
  }

  // ---------------------------------------------------------------- animation helpers
  async actorAnim(u, S) {
    if (u.side === 'party') {
      const magic = S.type === 'mag' || S.type === 'heal' || S.type === 'buff' || S.type === 'debuff' || S.anim === 'scan';
      u.spr.setFrame(magic ? BPOSE.cast : BPOSE.ready);
      let t = 0; const dist = magic ? 0.5 : 1.4;
      while (t < 0.18) { t += await this.G.frame(); u.ox = -dist * Math.min(1, t / 0.18); }
      if (magic) { this.fx.emit({ x: u.x - 0.4, y: 0.4, z: u.z, n: 24, color: S.el ? ELEM_COLOR[[].concat(S.el)[0]] : '#fff4b0', speed: 1.2, up: 2.2, life: 0.7, size: 0.18, gravity: 0, spread: 0.8 }); this.G.audio.sfx('cast'); await wait(220); }
      else { u.spr.setFrame(BPOSE.strike); this.G.audio.sfx('swing'); }
    } else if (u.side === 'enemy') {
      u.flash = 0.6;
      let t = 0; while (t < 0.16) { t += await this.G.frame(); u.ox = 0.8 * Math.min(1, t / 0.16); }
    }
  }
  async actorReturn(u) {
    if (u.side === 'summon') return;
    let t = 0; const ox = u.ox;
    while (t < 0.15) { t += await this.G.frame(); u.ox = ox * (1 - t / 0.15); }
    u.ox = 0;
    if (u.side === 'party' && u.alive) u.spr.setFrame(BPOSE.idle);
  }
  effect(anim, t, el, u, S) {
    if (S && (S.art || S.school) && u?.side === 'party') return this.vfx.hit(S, t, el, u); // arts and spells: see skillfx.js
    const x = t.x + (t.ox || 0), z = t.z, y = t.side === 'enemy' ? t.spr.h * 0.45 : 1.2;
    const col = ELEM_COLOR[el] || '#ffffff';
    const P = this.fx;
    switch (anim) {
      case 'slash': case 'slash2': case 'claw': case 'bite': case 'thrust': case 'arrow':
        this.streak(x, y, z, anim === 'thrust' || anim === 'arrow' ? 0 : -0.8, col); P.emit({ x, y, z, n: 14, color: col, speed: 3, life: 0.35, size: 0.18, gravity: 0 }); break;
      case 'fireslash': case 'holyslash': this.streak(x, y, z, -0.8, col); P.emit({ x, y, z, n: 30, color: col, speed: 3, up: 1.5, life: 0.6, size: 0.3, gravity: -1 }); break;
      case 'fire': case 'explode': P.emit({ x, y: y - 0.3, z, n: 50, color: '#ff7a2a', speed: 2.4, up: 2.5, life: 0.8, size: 0.4, gravity: -2, spread: 0.6 }); P.emit({ x, y, z, n: 20, color: '#ffe04a', speed: 4, life: 0.4, size: 0.25 }); this.flashAt(x, y, z, '#ff8a3a'); break;
      case 'ice': P.emit({ x, y: y + 1.2, z, n: 40, color: '#bdf0ff', speed: 1.5, up: -3, life: 0.6, size: 0.25, gravity: 6, spread: 1 }); P.emit({ x, y, z, n: 25, color: '#8ae0ff', speed: 3.5, life: 0.5, size: 0.2 }); this.flashAt(x, y, z, '#8ae0ff'); break;
      case 'thunder': this.bolt(x, z); P.emit({ x, y, z, n: 35, color: '#ffe04a', speed: 5, life: 0.4, size: 0.2 }); this.flashAt(x, y, z, '#fff8a0', 2); break;
      case 'water': P.emit({ x, y: y - 0.4, z, n: 50, color: '#4aa8ff', speed: 3, up: 3, life: 0.8, size: 0.25, gravity: 8, spread: 0.6 }); break;
      case 'wind': for (let i = 0; i < 30; i++) { const a = i / 30 * Math.PI * 4; P.emit({ x: x + Math.cos(a) * 0.8, y: y - 0.8 + i * 0.06, z: z + Math.sin(a) * 0.5, n: 1, color: '#a8ffc8', speed: 1, up: 1, life: 0.6, size: 0.22, gravity: 0 }); } break;
      case 'quake': this.camShake = 0.4; P.emit({ x, y: 0.1, z, n: 40, color: '#c8a060', speed: 3, up: 3, life: 0.7, size: 0.3, gravity: 8, spread: 1.2 }); break;
      case 'holy': case 'light': for (let i = 0; i < 40; i++) P.emit({ x: x + (Math.random() - 0.5) * 0.6, y: Math.random() * 3, z, n: 1, color: '#fff4c0', speed: 0.3, up: 2, life: 0.9, size: 0.3, gravity: -1 }); this.flashAt(x, y, z, '#fff4c0', 2); break;
      case 'dark': P.emit({ x, y, z, n: 45, color: '#a04aff', speed: 2, life: 0.8, size: 0.35, gravity: -0.5, spread: 0.8 }); break;
      case 'heal': case 'raise': for (let i = 0; i < 28; i++) P.emit({ x: x + (Math.random() - 0.5) * 0.8, y: 0.2 + Math.random(), z, n: 1, color: '#8affb0', speed: 0.2, up: 1.6, life: 1, size: 0.2, gravity: -0.6 }); break;
      case 'buff': case 'song': for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; P.emit({ x: x + Math.cos(a) * 0.7, y: 0.3, z: z + Math.sin(a) * 0.4, n: 1, color: anim === 'song' ? '#f4a0c8' : '#ffe08a', speed: 0.1, up: 2, life: 0.8, size: 0.18, gravity: 0 }); } break;
      case 'scan': P.emit({ x, y, z, n: 30, color: '#4affff', speed: 1.5, life: 0.6, size: 0.15, spread: 1 }); break;
      case 'laser': this.beam(u, t, '#ffe04a'); break;
      case 'meteor': P.emit({ x: x + 2, y: 6, z, n: 20, color: '#ff8a3a', speed: 0.5, up: -9, life: 0.6, size: 0.5, gravity: 4 }); setTimeout(() => { P.emit({ x, y: 0.3, z, n: 50, color: '#ffb04a', speed: 4, up: 2, life: 0.6, size: 0.35 }); this.camShake = 0.3; }, 350); break;
      case 'jump': this.streak(x, y, z, 1.5, '#e8eef8'); P.emit({ x, y: 0.2, z, n: 40, color: '#c8d8ff', speed: 4, up: 1, life: 0.5, size: 0.25, gravity: 4 }); this.camShake = 0.3; break;
      case 'wave': this.streak(x, y, z, -0.3, col); P.emit({ x, y, z, n: 30, color: col, speed: 4, life: 0.5, size: 0.25 }); break;
      case 'limit': case 'resonance': case 'summon':
        P.emit({ x, y, z, n: 70, color: col, speed: 5, up: 1, life: 1, size: 0.4, gravity: 1 }); P.emit({ x, y, z, n: 40, color: '#ffffff', speed: 7, life: 0.5, size: 0.25 });
        this.flashAt(x, y, z, col, 3); this.camShake = 0.25; break;
      default: P.emit({ x, y, z, n: 16, color: col, speed: 3, life: 0.4, size: 0.2 });
    }
  }
  streak(x, y, z, tilt, col) {
    const g = new THREE.PlaneGeometry(2.6, 0.12);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.position.set(x, y, z + 0.3); m.rotation.z = tilt; this.scene.add(m);
    const t0 = this.t; const f = () => { const e = this.t - t0; m.material.opacity = 1 - e / 0.25; m.scale.set(1 + e * 3, 1 - e * 3, 1); if (e < 0.25) requestAnimationFrame(f); else { this.scene.remove(m); g.dispose(); } }; f();
  }
  bolt(x, z) {
    const pts = []; let px = x, py = 8; while (py > 0) { pts.push(new THREE.Vector3(px, py, z + 0.2)); py -= 0.6 + Math.random() * 0.6; px += (Math.random() - 0.5) * 0.7; } pts.push(new THREE.Vector3(x, 0, z));
    const g = new THREE.BufferGeometry().setFromPoints(pts); const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: '#fffbd0' })); this.scene.add(l);
    setTimeout(() => { this.scene.remove(l); g.dispose(); }, 180);
  }
  beam(u, t, col) {
    const a = new THREE.Vector3(u.x + (u.ox || 0), 1.3, u.z), b = new THREE.Vector3(t.x, t.side === 'enemy' ? t.spr.h * 0.45 : 1.2, t.z);
    const len = a.distanceTo(b); const g = new THREE.CylinderGeometry(0.08, 0.08, len, 6); g.rotateZ(Math.PI / 2);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: col, transparent: true, blending: THREE.AdditiveBlending }));
    m.position.copy(a).add(b).multiplyScalar(0.5); m.lookAt(b); m.rotateY(Math.PI / 2); this.scene.add(m);
    setTimeout(() => { this.scene.remove(m); g.dispose(); }, 250);
  }
  flashAt(x, y, z, col, k = 1) { this.flashLight.position.set(x, y + 0.5, z + 1.5); this.flashLight.color.set(col); this.flashLight.intensity = 25 * k; }
  flash(col, a) { this.G.post.grade.uniforms.flash.value = a; this.G.post.grade.uniforms.flashColor.value.set(...new THREE.Color(col).toArray()); }

  msg(t) { this.ui.message(t); }
  pop(u, text, color, big) { this.ui.float(u, text, color, big); }
  number(u, n, color, o) { this.ui.float(u, String(n), color, o.crit || o.weak, o.weak ? 'WEAK' : o.resist ? '抵抗' : o.crit ? '會心' : null); }

  // ---------------------------------------------------------------- per frame
  update(dt) {
    this.t += dt;
    for (const u of [...this.units, ...(this.summonU ? [this.summonU] : [])]) {
      const breathe = u.side === 'party' && u.alive && !u.ox ? Math.sin(this.t * 3 + u.x) * 0.02 : 0;
      let sx = 0; if (u.shakeT > 0) { u.shakeT -= dt; sx = Math.sin(u.shakeT * 80) * 0.08; }
      const bob = u.side === 'enemy' && u.alive && !u.broken && (u.E.kind === 'bat' || u.E.kind === 'bird' || u.E.kind === 'wisp') ? 0.6 + Math.sin(this.t * 4 + u.x) * 0.15 : u.side === 'summon' ? 0.4 + Math.sin(this.t * 2) * 0.15 : 0;
      u.spr.tick?.(dt);
      u.spr.mesh.position.set(u.x + (u.ox || 0) + sx, (u.oy || 0) + bob + (u.spr.voxel && u.side === 'party' ? 0 : breathe), u.z);
      if (u.shadow) { u.shadow.position.set(u.x + (u.ox || 0), 0.02, u.z); u.shadow.visible = u.spr.mesh.visible && !u.jumping; }
      if (u.flash > 0) { u.flash = Math.max(0, u.flash - dt * 4); const f = Math.max(u.spr.glow ?? 0.18, u.flash); u.spr.mat.emissive.setRGB(f, f, f); }
      else if (u.side !== 'summon') { const g = u.spr.glow ?? 0.18; u.spr.mat.emissive.setRGB(g, g, g); }
      if (u.side === 'enemy' && u.broken && u.alive) u.spr.mesh.rotation.z = 0.2 + Math.sin(this.t * 6) * 0.03; else if (u.side === 'enemy') u.spr.mesh.rotation.z = 0;
      // a hit makes them flinch for a moment, then they settle back: standing, or down on one knee when badly hurt
      if (u.hurtT > 0) u.hurtT -= dt;
      if (u.side === 'party' && u.alive && !(u.hurtT > 0)) {
        const f = u.spr.frame, rest = f <= 1 || f === BPOSE.hurt || f === BPOSE.weak;
        if (rest) u.spr.setFrame(u.hp < u.st.hp * 0.25 ? BPOSE.weak : Math.floor(this.t * 1.6 + u.x) % 2 ? BPOSE.idle2 : BPOSE.idle);
      }
    }
    // camera: gentle sway, intro sweep, focus on the actor, zoom for resonance
    const cur = this.current;
    const fx = cur && cur.side !== 'summon' ? (cur.x + (cur.ox || 0)) * 0.15 : 0;
    const zoom = this.camZoom ? 0.8 : 1;
    const intro = this.camIntro ? 1.3 : 1;
    { const d = fx - (this.camX ?? 0); this.camX = Math.abs(d) < 0.002 ? fx : (this.camX ?? 0) + d * Math.min(1, dt * 3); }
    const shake = this.camShake > 0 ? (this.camShake -= dt, (Math.random() - 0.5) * this.camShake * 0.6) : 0;
    if (this.portrait) {
      // tall screens: look over the party's shoulders at the foes, so the line of battle runs up the screen
      const yaw = 1.45, D = 15.5 * zoom * intro * (this.fit || 1), tx = this.camX * 0.3 - 0.8;
      this.camera.position.set(tx + Math.sin(yaw) * D + shake, 8.6 * zoom * intro * (this.fit || 1), Math.cos(yaw) * D);
      this.camera.lookAt(tx, -1.4, 0);
    } else {
      this.camera.position.set(this.camX + shake + 0.4, 5.2 * zoom * intro, 14.5 * zoom * intro);
      this.camera.lookAt(this.camX * 0.6, -0.2, 0);
    }
    this.flashLight.intensity *= Math.exp(-dt * 8);
    const gu = this.G.post.grade.uniforms; gu.flash.value *= Math.exp(-dt * 6);
    this.fx.update(dt); this.vfx.update(dt);
    if (this.ui) this.ui.tick();
  }

  // ---------------------------------------------------------------- rewards
  async victory() {
    this.G.audio.music('victory');
    for (const u of this.allies) u.spr.setFrame(BPOSE.win);
    const E = this.units.filter(u => u.side === 'enemy' && !u.fled).map(u => u.E);
    let exp = E.reduce((s, e) => s + e.exp, 0), gil = E.reduce((s, e) => s + e.gil, 0);
    const P = this.party.flatMap(u => u.on);
    const best = (k) => Math.max(0, ...this.party.map(u => u.fx?.[k] || 0)) + (this.S.meal?.n > 0 ? this.S.meal.fx[k] || 0 : 0);
    if (P.includes('p_exp')) exp = Math.round(exp * 1.5);
    if (P.includes('p_gil')) gil = Math.round(gil * 1.5);
    exp = Math.round(exp * (1 + best('exp'))); gil = Math.round(gil * (1 + best('gil')));
    const dropMul = 1 + best('drop') + (this.dropBonus || 0);
    const drops = [];
    this.S.kills = this.S.kills || {}; this.S.dropSeen = this.S.dropSeen || {};
    for (const u of this.units.filter(u => u.side === 'enemy' && !u.fled)) {
      const e = u.E; this.S.kills[u.id] = (this.S.kills[u.id] || 0) + 1;
      (e.drops || []).forEach(([id, ch], slot) => { if (id && Math.random() < Math.min(1, ch * dropMul)) { drops.push(id); addItem(this.S, id, 1); this.S.dropSeen[u.id + ':' + slot] = 1; } });
    }
    const woke = [];
    for (const eid of NEW_ECHOES) {
      const EE = ECHOES[eid]; if (this.S.echoes[eid] || woke.length || (this.S.chapter || 1) < (EE.ch || 2)) continue;
      for (const u of this.units.filter(u => u.side === 'enemy' && !u.fled)) if (huntMatch(EE, u.E) && Math.random() < (u.E.boss ? 0.35 : 0.03) * dropMul) { woke.push(eid); break; }
    }
    for (const eid of woke) addEcho(this.S, eid);
    this.S.gil += gil;
    const { gainExp, gainBond } = await import('./party.js?v=19');
    const ups = gainExp(this.S, exp);
    const bond = gainBond(this.S, 4 + 3 * E.length + 36 * E.filter(e => e.boss).length); // per fight, not per enemy level: bond 5 takes ~55 battles anywhere
    const ap = E.reduce((s, e) => s + (e.ap || 1), 0);
    const learned = gainAP(this.S, ap);
    if (this.S.meal?.n > 0) { this.S.meal.n--; if (!this.S.meal.n) this.S.meal = null; }
    this.S.battles++;
    this.lastSpoils = { exp, gil, drops, ap, woke };
    await this.ui.results({ exp, gil, drops, ups, bond, ap, learned, woke });
    for (const eid of woke) { this.G.audio.sfx('resonance'); this.G.ui.toast(`迴響水晶「<b>${ECHOES[eid].name}</b>」甦醒了！`, 3500); }
  }
}

// ======================================================================
// Battle UI: timeline, enemy shields, party panel, commands, numbers, cut-ins
// ======================================================================
class BattleUI {
  constructor(b) { this.b = b; this.root = b.dom; this.floats = []; }
  show() {
    const b = this.b;
    this.root.innerHTML = `
      <div class="b-top"><div class="b-tl" id="btl"></div><div class="b-msg" id="bmsg"></div></div>
      <div class="b-enemies" id="ben"></div>
      <div class="b-party" id="bpt"></div>
      <div class="b-cmd" id="bcmd"></div>
      <div class="b-float" id="bfl"></div>
      <div class="b-banner" id="bbn"></div>
      <div class="b-cutin" id="bcut"></div>
      <div class="b-tools"><button id="bauto">自動 OFF</button><button id="bspd">速度 ×1</button></div>`;
    this.root.classList.add('on');
    this.tl = this.root.querySelector('#btl'); this.msgEl = this.root.querySelector('#bmsg'); this.en = this.root.querySelector('#ben');
    this.pt = this.root.querySelector('#bpt'); this.cmd = this.root.querySelector('#bcmd'); this.fl = this.root.querySelector('#bfl');
    this.bn = this.root.querySelector('#bbn'); this.cut = this.root.querySelector('#bcut');
    this.root.querySelector('#bauto').onclick = () => { b.auto = !b.auto; b.S.settings.auto = b.auto; this.autoBtn(); if (b.auto && this.cancelCmd) this.cancelCmd('auto'); };
    this.root.querySelector('#bspd').onclick = () => { b.S.settings.speed = b.S.settings.speed === 2 ? 1 : 2; this.spdBtn(); };
    this.autoBtn(); this.spdBtn();
    // enemy info panels
    this.en.innerHTML = '';
    for (const u of b.units.filter(u => u.side === 'enemy')) this.addEnemy(u);
    this.refresh(); this.timeline();
  }
  addEnemy(u) {
    const d = document.createElement('div'); d.className = 'b-einfo' + (u.boss ? ' boss' : '');
    d.innerHTML = `<div class="b-ename">${u.name}<span class="b-etr">${[...u.traits].filter(t => TRAIT_N[t]).map(t => `<i title="${TRAIT_N[t][1]}：${TRAIT_N[t][2]}">${TRAIT_N[t][0]}</i>`).join('')}</span><span class="b-est"></span></div><div class="b-ebar"><i></i></div><div class="b-erow"><span class="b-shield"><b></b></span><span class="b-weak"></span></div>`;
    this.en.appendChild(d); u.info = d;
    d.onclick = () => this.pickHook && this.pickHook(u);
  }
  hide() { this.root.classList.remove('on'); this.root.innerHTML = ''; }
  autoBtn() { const e = this.root.querySelector('#bauto'); if (e) { e.textContent = this.b.auto ? '自動 ON' : '自動 OFF'; e.classList.toggle('lit', this.b.auto); } }
  spdBtn() { const e = this.root.querySelector('#bspd'); if (e) e.textContent = '速度 ×' + (this.b.S.settings.speed || 1); }
  message(t) { this.msgEl.textContent = t; this.msgEl.classList.remove('pop'); void this.msgEl.offsetWidth; this.msgEl.classList.add('pop'); clearTimeout(this.mt); this.mt = setTimeout(() => this.msgEl.classList.remove('pop'), 1600); }
  icon(u) {
    if (u.side === 'summon') return `<span class="ti sum">${u.name[0]}</span>`;
    if (u.side === 'party') return `<span class="ti pty" style="--c:${u.color}">${u.name[0]}</span>`;
    return `<span class="ti foe${u.boss ? ' boss' : ''}">${u.name[0]}${/[A-D]$/.test(u.name) ? '<sub>' + u.name.slice(-1) + '</sub>' : ''}</span>`;
  }
  timeline(extra) {
    const b = this.b; if (!this.tl) return;
    const cur = b.current ? this.icon(b.current).replace('class="ti', 'class="ti cur') : '';
    const q = (b.queue || []).filter(u => u.alive || u.side === 'summon').map(u => this.icon(u)).join('');
    const nx = b.nextPreview().map(u => this.icon(u)).join('');
    this.tl.innerHTML = `<span class="tl-l">${extra ? '追加' : '本回合'}</span>${cur}${q}<span class="tl-sep">▶</span><span class="tl-l">下回合</span><span class="tl-next">${nx}</span>`;
  }
  refresh() {
    const b = this.b; if (!this.pt) return;
    this.pt.innerHTML = b.party.map(u => {
      const st = Object.keys(u.status).map(k => STATUS_S[k] || '').join('') + Object.keys(u.barrier || {}).map(e => ICON[e]).join('') + (u.stance ? '構' : '') + (u.enchant ? ICON[u.enchant.el] : '');
      const bf = Object.entries(u.buffs).map(([k, v]) => `<i class="${v.v > 0 ? 'up' : 'dn'}">${({ atk: '攻', def: '防', mag: '魔', spr: '精', spd: '速' })[k]}</i>`).join('');
      return `<div class="b-pc ${u.alive ? '' : 'ko'} ${b.current === u ? 'cur' : ''}" data-id="${u.id}">
        <div class="b-pn"><b style="color:${u.color}">${u.name}</b><span class="b-st">${st}${bf}${u.taunt ? '<i class="up">挑</i>' : ''}${u.jumping ? '<i class="up">跳</i>' : ''}</span></div>
        <div class="b-bars"><div class="b-hp"><div class="bar"><i style="width:${u.hp / u.st.hp * 100}%"></i></div><em>${u.hp}</em></div>
        <div class="b-mp"><div class="bar mp"><i style="width:${u.mp / u.st.mp * 100}%"></i></div><em>${u.mp}</em></div>
        <div class="b-lim ${u.limit >= 100 ? 'full' : ''}"><i style="width:${u.limit}%"></i></div></div></div>`;
    }).join('');
    for (const u of b.units.filter(u => u.side === 'enemy')) {
      const d = u.info; if (!d) continue;
      d.style.display = u.alive ? '' : 'none';
      d.querySelector('.b-ebar i').style.width = (u.hp / u.st.hp * 100) + '%';
      const sh = d.querySelector('.b-shield'); sh.classList.toggle('broken', u.broken); sh.querySelector('b').textContent = u.broken ? 'BREAK' : u.shield;
      d.querySelector('.b-est').textContent = (u.phase === 'phys' ? '🛡' : u.phase === 'mag' ? '🔮' : '') + (u.charging ? '⚡' : '') + (u.count != null ? '⏳' + u.count : '') + (u.hard ? '殼' + u.hard : '') + (u.curEl ? ICON[u.curEl] || '' : '') + (u.stoleItem || u.stoleGil ? '💰' : '') + Object.keys(u.status).map(k => STATUS_S[k] || '').join('') + (u.noArmor && u.traits.has('armor') ? '破' : '') + (u.grounded ? '墜' : '') + (u.mark ? '印' : '');
      d.querySelector('.b-etr').style.opacity = (u.noArmor && u.traits.has('armor')) || (u.grounded && u.traits.has('fly')) ? 0.35 : 1;
      const allWeak = [...u.weak, ...Object.keys(u.extraWeak || {}).filter(w => !u.weak.includes(w))];
      const tags = u.E.hideWeak ? allWeak.filter(w => u.revealed.has(w)).slice(0, 10) : allWeak;
      d.querySelector('.b-weak').innerHTML = (u.E.hideWeak ? [...tags, '?'] : tags).map(w => w === '?' || !u.revealed.has(w) ? '<i class="unk">?</i>' : `<i title="${ELEM[w] || WPN[w]}">${ICON[w]}</i>`).join('');
    }
  }
  tick() {
    // keep enemy panels and floating numbers glued to the sprites
    const b = this.b, cam = b.camera, W = this.root.clientWidth, H = this.root.clientHeight;
    const v = new THREE.Vector3();
    for (const u of b.units.filter(u => u.side === 'enemy')) {
      if (!u.info) continue;
      v.set(u.x + (u.ox || 0), -0.15, u.z).project(cam);
      u.info.style.transform = `translate(${(v.x * 0.5 + 0.5) * W}px, ${(-v.y * 0.5 + 0.5) * H}px) translate(-50%, 0)`;
      u.info.classList.toggle('target', this.targetSet?.includes(u));
    }
    for (const u of b.party) { const el = this.pt.querySelector(`[data-id="${u.id}"]`); if (el) el.classList.toggle('target', !!this.targetSet?.includes(u)); }
    const now = performance.now();
    this.floats = this.floats.filter(f => {
      const e = (now - f.t0) / 1000; if (e > 1.2) { f.el.remove(); return false; }
      const u = f.u; v.set(u.x + (u.ox || 0), (u.side === 'enemy' ? u.spr.h * 0.8 : 2.4) + e * 0.6 + f.k * 0.35, u.z).project(cam);
      f.el.style.transform = `translate(${(v.x * 0.5 + 0.5) * W}px, ${(-v.y * 0.5 + 0.5) * H}px) translate(-50%,-50%) scale(${e < 0.1 ? 1.6 - e * 6 : 1})`;
      f.el.style.opacity = e > 0.9 ? 1 - (e - 0.9) / 0.3 : 1;
      return true;
    });
    if (this.cursorU) {
      const u = this.cursorU; v.set(u.x + (u.ox || 0), (u.side === 'enemy' ? u.spr.h + 0.2 : 2.8) + Math.sin(now / 150) * 0.08, u.z).project(cam);
      this.cursor.style.transform = `translate(${(v.x * 0.5 + 0.5) * W}px, ${(-v.y * 0.5 + 0.5) * H}px) translate(-50%,-100%)`;
    }
  }
  float(u, text, color, big, tag) {
    const el = document.createElement('div'); el.className = 'fnum' + (big ? ' big' : '');
    el.innerHTML = (tag ? `<small>${tag}</small>` : '') + text; el.style.color = color;
    this.fl.appendChild(el);
    const k = this.floats.filter(f => f.u === u && performance.now() - f.t0 < 400).length;
    this.floats.push({ el, u, t0: performance.now(), k });
  }
  async banner(title, sub, color = '#fff') {
    this.bn.innerHTML = `<div class="bb-in" style="--c:${color}"><small>${sub}</small><b>${title}</b></div>`;
    this.bn.classList.add('on'); this.b.G.audio.sfx('banner');
    await wait(1000); this.bn.classList.remove('on'); await wait(150);
  }
  async cutin(eid, name) {
    const E = ECHOES[eid];
    this.cut.innerHTML = `<div class="cut-bg" style="--c:${E.color}"></div><img class="cut-img" src="${renderPortrait(E.look, 'battle')}"><div class="cut-txt"><small>RESONANCE ・ ${E.name}</small><b>${name}</b></div>`;
    this.cut.classList.add('on'); this.b.G.audio.sfx('resonance');
    this.b.flash(E.color, 0.5);
    await wait(1500); this.cut.classList.remove('on'); await wait(200);
  }

  // ---------------------------------------------------------------- commands
  async command(u, extra) {
    const b = this.b, S = b.S;
    const hid = new Set(S.heroes[u.hero]?.hide || []), vis = (l) => l.filter(s => !hid.has(s)), sk0 = skillsOf(S, u.hero), sk = { own: vis(sk0.own), echo: vis(sk0.echo) }, arts = vis(artsOf(S, u.hero)), spells = vis(spellsOf(S, u.hero));
    const items = Object.keys(S.items).filter(i => ITEMS[i] && ITEMS[i].tgt && ITEMS[i].use && !ITEMS[i].use.grow);
    const opts = [
      { k: 'attack', label: '攻擊', sub: u.hands.map(h => ICON[h.type] || '👊').join('') },
      { k: 'skill', label: '技能', disabled: !sk.own.length },
      { k: 'arts', label: '戰技', disabled: !arts.length, sub: arts.length ? arts.length + '' : '' },
      { k: 'magic', label: '魔法', disabled: !spells.length, sub: spells.length ? spells.length + '' : '' },
      { k: 'echo', label: u.echo ? '迴響：' + ECHOES[u.echo].short : '迴響', disabled: !sk.echo.length },
      { k: 'item', label: '道具', disabled: !items.length },
      { k: 'defend', label: '防禦' },
    ];
    if (u.limit >= 100) opts.splice(1, 0, { k: 'limit', label: '★ 極限技', cls: 'lim' });
    if (S.summons.length && !b.summonU && !extra) opts.push({ k: 'summon', label: '召喚' });
    if (!extra) opts.push({ k: 'flee', label: '逃跑', disabled: b.units.some(x => x.boss) || b.opts.noFlee });
    const row = (s) => { const D = SKILLS[s]; const tags = b.tagsOf(u, D); const cost = b.mpCost(u, D); return { label: D.name, sub: tags.map(t => ICON[t] || '').join('') + (cost ? ` <em>${cost}</em>` : ''), disabled: cost > u.mp || (u.status.silence && !D.art && (D.spell || ['mag', 'heal', 'debuff'].includes(D.type))), desc: D.desc + (D.art ? `　（${WPN[D.art]}戰技）` : '') }; };
    const pickSkill = async (list, title) => {
      for (;;) {
        const j = await this.list(list.map(row), { title, cancel: true });
        if (j < 0) return null;
        const sid = list[j], D = SKILLS[sid];
        const t = await this.pickTarget(u, D); if (!t) continue;
        if (D.relay) return { kind: 'relay', targets: t };
        return { kind: 'skill', skill: sid, targets: t };
      }
    };
    for (;;) {
      if (b.auto) return { kind: 'auto' }; // auto was switched on while a sub-menu was open: every menu unwinds back here
      const i = await this.list(opts.map(o => ({ label: o.label, sub: o.sub, disabled: o.disabled, cls: o.cls })), { title: u.name + (extra ? '・追加' : ''), cancel: false, cmd: true });
      if (i === 'auto' || i < 0 || b.auto) return { kind: 'auto' };
      const o = opts[i];
      if (o.k === 'attack') { const t = await this.pickTarget(u, ['whip', 'boomerang'].includes(u.wpn) ? { tgt: 'enemies' } : SKILLS.attack); if (t) return { kind: 'skill', skill: 'attack', targets: t }; continue; }
      if (o.k === 'skill' || o.k === 'echo' || o.k === 'arts') { const a = await pickSkill(o.k === 'skill' ? sk.own : o.k === 'echo' ? sk.echo : arts, o.label); if (a) return a; continue; }
      if (o.k === 'magic') {
        const schools = Object.keys(SCHOOL_N).filter(sc => spells.some(s => SKILLS[s].school === sc));
        for (;;) {
          const j = schools.length === 1 ? 0 : await this.list(schools.map(sc => ({ label: SCHOOL_N[sc], sub: spells.filter(s => SKILLS[s].school === sc).length + '' })), { title: '魔法', cancel: true });
          if (j < 0) break;
          const list = spells.filter(s => SKILLS[s].school === schools[j]).sort((a, b2) => SKILLS[a].tier - SKILLS[b2].tier || SKILLS[a].mp - SKILLS[b2].mp);
          const a = await pickSkill(list, SCHOOL_N[schools[j]]); if (a) return a;
          if (schools.length === 1) break;
        }
        continue;
      }
      if (o.k === 'limit') return { kind: 'limit' };
      if (o.k === 'item') {
        const cats = Object.keys(ITEM_CATS).filter(c => items.some(i => ITEMS[i].cat === c));
        let got = null;
        for (;;) {
          const c = cats.length === 1 ? 0 : await this.list(cats.map(c => ({ label: ITEM_CATS[c], sub: items.filter(i => ITEMS[i].cat === c).length + '' })), { title: '道具', cancel: true });
          if (c < 0) break;
          const list = items.filter(i => ITEMS[i].cat === cats[c]);
          const j = await this.list(list.map(i => ({ label: ITEMS[i].name, sub: '×' + S.items[i], desc: ITEMS[i].desc })), { title: ITEM_CATS[cats[c]], cancel: true });
          if (j < 0) { if (cats.length === 1) break; continue; }
          const id = list[j], I = ITEMS[id];
          if (I.tgt === 'none') { got = { kind: 'item', item: id, targets: [] }; break; }
          const t = await this.pickTarget(u, { tgt: I.tgt === 'enemies' || I.tgt === 'random' ? 'enemies' : I.tgt === 'enemy' ? 'enemy' : I.tgt === 'allies' ? 'allies' : I.tgt === 'dead' ? 'dead' : I.tgt === 'self' ? 'self' : I.tgt === 'allyOther' ? 'allyOther' : 'ally' }); if (!t) continue;
          got = { kind: 'item', item: id, targets: t }; break;
        }
        if (got) return got; continue;
      }
      if (o.k === 'defend') return { kind: 'defend' };
      if (o.k === 'flee') return { kind: 'flee' };
      if (o.k === 'summon') {
        const j = await this.list(S.summons.map(s => ({ label: SUMMONS[s].name, sub: `<em>${SUMMONS[s].mp}</em>`, disabled: u.mp < SUMMONS[s].mp, desc: SUMMONS[s].desc })), { title: '召喚', cancel: true });
        if (j < 0) continue; return { kind: 'summon', sid: S.summons[j] };
      }
    }
  }
  // a vertical list menu for battle. returns index, -1 for cancel, or 'auto'
  list(items, o = {}) {
    const G = this.b.G;
    if (this.b.auto && !o.cmd) return Promise.resolve(-1);
    return new Promise((res) => {
      let sel = items.findIndex(i => !i.disabled); if (sel < 0) sel = 0;
      const box = this.cmd;
      const draw = () => {
        box.innerHTML = `<div class="bc-title">${o.title || ''}</div><div class="bc-list">${items.map((it, i) => `<div class="bc-it ${i === sel ? 'sel' : ''} ${it.disabled ? 'dis' : ''} ${it.cls || ''}" data-i="${i}"><span>${it.label}</span><span class="bc-sub">${it.sub || ''}</span></div>`).join('')}</div>${items[sel]?.desc ? `<div class="bc-desc">${items[sel].desc}</div>` : ''}${o.cancel ? '<div class="bc-back">✕ 返回</div>' : ''}`;
        box.querySelectorAll('.bc-it').forEach(el => el.onclick = () => { const i = +el.dataset.i; if (items[i].disabled) return; if (sel === i || G.input.touchy) { done(i); } else { sel = i; draw(); } });
        const bk = box.querySelector('.bc-back'); if (bk) bk.onclick = () => done(-1);
        const s = box.querySelector('.sel'); if (s) s.scrollIntoView({ block: 'nearest' });
      };
      const done = (v) => { off(); box.classList.remove('on'); this.cancelCmd = null; G.audio.sfx(v === -1 ? 'cancel' : 'ok'); res(v); };
      const off = G.input.on((k) => {
        if (k === 'up') { do sel = (sel + items.length - 1) % items.length; while (items[sel].disabled && items.some(i => !i.disabled)); G.audio.sfx('move'); draw(); }
        if (k === 'down') { do sel = (sel + 1) % items.length; while (items[sel].disabled && items.some(i => !i.disabled)); G.audio.sfx('move'); draw(); }
        if (k === 'ok' && !items[sel].disabled) done(sel);
        if (k === 'cancel' && o.cancel) done(-1);
      });
      this.cancelCmd = () => { off(); box.classList.remove('on'); this.cancelCmd = null; res(-1); }; // the auto button: close as a cancel
      box.classList.add('on'); draw();
    });
  }
  // choose targets with the cursor (or tap). returns array or null
  pickTarget(u, S) {
    const b = this.b, G = b.G;
    if (b.auto) return Promise.resolve(null);
    let pool, multi = false;
    if (S.tgt === 'enemy') pool = b.foes;
    else if (S.tgt === 'enemies' || S.tgt === 'random') { pool = b.foes; multi = true; }
    else if (S.tgt === 'allies') { pool = b.allies; multi = true; }
    else if (S.tgt === 'self') return Promise.resolve([u]);
    else if (S.tgt === 'dead') pool = b.party.filter(p => !p.alive);
    else if (S.tgt === 'allyOther') pool = b.allies.filter(p => p !== u && !p.jumping);
    else pool = b.allies;
    if (!pool.length) { b.msg('沒有可以選擇的目標'); return Promise.resolve(null); }
    return new Promise((res) => {
      let i = 0;
      if (!this.cursor) { this.cursor = document.createElement('div'); this.cursor.className = 'b-cursor'; this.cursor.textContent = '▼'; this.root.appendChild(this.cursor); }
      const set = () => { this.targetSet = multi ? pool : [pool[i]]; this.cursorU = multi ? null : pool[i]; this.cursor.style.display = multi ? 'none' : 'block'; b.msg(multi ? (S.tgt === 'allies' ? '我方全體' : '敵方全體') : pool[i].name + (pool[i].side === 'enemy' ? `  HP ${Math.round(pool[i].hp / pool[i].st.hp * 100)}%` : `  HP ${pool[i].hp}/${pool[i].st.hp}`)); };
      const done = (v) => { off(); this.targetSet = null; this.cursorU = null; this.cursor.style.display = 'none'; this.pickHook = null; this.pt.onclick = null; this.cancelCmd = null; G.audio.sfx(v ? 'ok' : 'cancel'); res(v); };
      this.cancelCmd = () => done(null);
      const off = G.input.on((k) => {
        if (!multi && (k === 'up' || k === 'left')) { i = (i + pool.length - 1) % pool.length; G.audio.sfx('move'); set(); }
        if (!multi && (k === 'down' || k === 'right')) { i = (i + 1) % pool.length; G.audio.sfx('move'); set(); }
        if (k === 'ok') done(multi ? pool : [pool[i]]);
        if (k === 'cancel') done(null);
      });
      this.pickHook = (tu) => { const j = pool.indexOf(tu); if (j < 0) return; if (multi || j === i) done(multi ? pool : [pool[j]]); else { i = j; set(); } };
      this.pt.onclick = (e) => { const el = e.target.closest('.b-pc'); if (!el) return; const tu = b.party.find(p => p.id === el.dataset.id); if (tu) this.pickHook(tu); };
      // tapping the 3D sprites
      G.tapHook = (nx, ny) => {
        const ray = new THREE.Raycaster(); ray.layers.enableAll(); ray.setFromCamera(new THREE.Vector2(nx, ny), b.camera);
        const hit = ray.intersectObjects(pool.map(p => p.spr.mesh), true)[0];
        if (hit) { let o = hit.object; let tu; while (o && !(tu = pool.find(p => p.spr.mesh === o))) o = o.parent; if (tu) this.pickHook(tu); }
      };
      set();
    }).finally(() => { G.tapHook = null; });
  }
  resonanceMenu(opts) {
    return this.list(opts.map(o => { const E = ECHOES[o.e], R = SKILLS[E.resonance]; return { label: `${E.short}「${R.name}」`, sub: o.u.name, desc: R.desc }; }), { title: '★ 共鳴 RESONANCE ★', cancel: false });
  }
  results(r) {
    const G = this.b.G;
    return new Promise((res) => {
      const lines = [`<div class="r-row"><span>經驗值</span><b>${r.exp}</b></div>`, `<div class="r-row"><span>金幣</span><b>${r.gil} G</b></div>`];
      if (r.ap) lines.push(`<div class="r-row"><span>AP</span><b>${r.ap}</b></div>`);
      if (r.drops.length) lines.push(`<div class="r-row"><span>獲得</span><b>${r.drops.map(itemName).join('、')}</b></div>`);
      for (const [id, sp] of r.learned || []) lines.push(`<div class="r-bond">${HEROES[id].name} 學會了「${SKILLS[sp].name}」！</div>`);
      for (const [id, lv, sk] of r.ups) lines.push(`<div class="r-up">${HEROES[id].name} 升到了 Lv ${lv}！${sk.length ? '　學會了 ' + sk.join('、') : ''}</div>`);
      for (const eid of r.woke || []) lines.push(`<div class="r-bond" style="color:#ffe04a">✦ 新的迴響水晶甦醒了：${ECHOES[eid].name}</div>`);
      for (const [e, lv, got] of r.bond) lines.push(`<div class="r-bond">迴響「${ECHOES[e].short}」羈絆提升到 ${lv}！${got.length ? '　習得：' + got.join('、') : ''}</div>`);
      this.cmd.classList.remove('on');
      const box = document.createElement('div'); box.className = 'b-result'; box.innerHTML = `<h3>勝利！</h3>${lines.join('')}<div class="r-ok">▶ 繼續</div>`;
      this.root.appendChild(box);
      setTimeout(() => {
        const off = G.input.on((k) => { if (k === 'ok' || k === 'cancel') { off(); box.remove(); res(); } });
        if (G.grind) setTimeout(() => { if (box.isConnected) { off(); box.remove(); res(); } }, 1100);
        box.onclick = () => { off(); box.remove(); res(); };
      }, 500);
    });
  }
}
