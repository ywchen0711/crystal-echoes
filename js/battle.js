// Turn-based battles: a timeline, break shields, Full Break -> Extra Phase -> Resonance, summons and limits.
import * as THREE from '../lib/three.module.min.js';
import { Sprite, Particles, skyDome, blobShadow } from './render.js';
import { battleSheet, monsterPx, propPx, tileTex, texFrom, BPOSE } from './pixel.js';
import { VoxelPerson, VoxelSprite } from './voxel.js';
import { HEROES, ECHOES, SKILLS, ENEMIES, ITEMS, SUMMONS, ELEM, WPN, ICON, ELEM_COLOR, PASSIVES } from './data.js';
import { heroStats, skillsOf, weaponType, addItem, itemName } from './party.js';
import { lookOf } from './field.js';

const ENEMY_DMG = 1.55;
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
    this.fx = new Particles(this.scene, 900);
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
      const px = propPx(k, c); const sp = new Sprite(px.canvas(), 1, { scale: 1.3 + r() * 0.5 });
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
    this.units = [];
    const P = this.S.party;
    const slots = [[2.9, -1.9], [3.9, -0.65], [4.9, 0.6], [5.9, 1.85]];
    P.forEach((id, i) => {
      const h = this.S.heroes[id], st = heroStats(this.S, id);
      const spr = new VoxelPerson(lookOf(id), { scale: 1.25, battle: true, angle: -Math.PI / 2 + 0.45, glow: 0.12 });
      const u = { side: 'party', id, name: HEROES[id].name, hero: id, lv: h.lv, st, hp: Math.max(0, Math.min(h.hp, st.hp)), mp: Math.min(h.mp, st.mp), wpn: weaponType(this.S, id), on: h.on || [], echo: h.echo, limit: h.limit || 0, buffs: {}, status: {}, spr, home: slots[i], survived: false, color: HEROES[id].color, immune: h.equip.x === 'x_ribbon' };
      u.alive = u.hp > 0;
      this.addSprite(u, slots[i][0], slots[i][1]);
      if (u.on.includes('p_autoprotect')) this.buff(u, { def: 2 }, true);
      this.units.push(u);
    });
    const n = troop.length;
    const eslots = n === 1 ? [[-3.8, 0]] : n === 2 ? [[-2.9, -1.4], [-5.0, 1.0]] : n === 3 ? [[-2.4, -1.9], [-5.4, -0.6], [-3.2, 1.6]] : [[-2.2, -2.0], [-5.0, -1.3], [-2.6, 0.9], [-5.4, 1.9]];
    const letters = 'ABCD'; const count = {};
    troop.forEach((eid, i) => {
      const E = ENEMIES[eid]; count[eid] = (count[eid] || 0) + 1;
      let px = monsterPx(E.kind, E.colors); if (E.kind !== 'knight') px = px.flip();
      const scale = (E.boss ? 1.25 : 1.05) * (E.scale || 1);
      const spr = new VoxelSprite(px, { scale });
      const st = { hp: E.hp, mp: 999, atk: E.atk, def: E.def, mag: E.mag, spr: E.spr, spd: E.spd };
      if (opts.hard) for (const k of ['hp', 'atk', 'def', 'mag', 'spr']) st[k] = Math.round(st[k] * opts.hard);
      const u = { side: 'enemy', id: eid, E, name: E.name + (troop.filter(t => t === eid).length > 1 ? letters[count[eid] - 1] : ''), lv: E.lv, st, hp: st.hp, mp: 999, shield: E.shield, maxShield: E.shield, weak: E.weak, resist: E.resist || [], revealed: new Set(this.S.flags['seen_' + eid] || []), buffs: {}, status: {}, spr, alive: true, broken: false, brokenUntil: -1, boss: !!E.boss, home: eslots[i] };
      this.addSprite(u, eslots[i][0], eslots[i][1]);
      this.units.push(u);
    });
  }
  addSprite(u, x, z) {
    u.spr.mesh.position.set(x, 0, z); if (!u.spr.voxel) u.spr.mesh.rotation.x = -0.12; else if (u.side === 'enemy') u.spr.mesh.rotation.y = 0.4;
    u.shadow = blobShadow(u.side === 'enemy' ? 0.3 * u.spr.w : 0.5); u.shadow.position.set(x, 0.02, z);
    this.scene.add(u.spr.mesh, u.shadow);
    u.x = x; u.z = z; u.y = 0; u.ox = 0; u.oy = 0; u.flash = 0;
    if (u.side === 'party' && !u.alive) u.spr.setFrame(BPOSE.ko);
  }
  clearUnits() { for (const u of this.units || []) { this.scene.remove(u.spr.mesh, u.shadow); u.spr.dispose(); } this.units = []; if (this.summonU) { this.scene.remove(this.summonU.spr.mesh); this.summonU = null; } }

  get party() { return this.units.filter(u => u.side === 'party'); }
  get foes() { return this.units.filter(u => u.side === 'enemy' && u.alive); }
  get allies() { return this.units.filter(u => u.side === 'party' && u.alive); }

  // ---------------------------------------------------------------- main loop
  async run(opts) {
    this.opts = opts; this.S = this.G.S;
    this.buildStage(opts.bg || 'field');
    this.makeUnits(opts.troop, opts);
    this.round = 0; this.result = null; this.extraUsed = false; this.summonU = null; this.log = [];
    this.auto = !!this.S.settings.auto;
    this.ui = new BattleUI(this);
    this.ui.show();
    this.G.audio.music(opts.music || (this.units.some(u => u.boss) ? 'boss' : 'battle'));
    this.active = true;
    await this.intro();
    if (opts.preemptive) this.msg('先制攻擊！');
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

  speedOf(u) { return u.st.spd * this.bmul(u, 'spd') * (u.status.slow ? 0.5 : 1); }
  computeOrder(jitter = true) {
    const list = this.units.filter(u => u.alive && !(u.side === 'enemy' && u.brokenUntil >= this.round));
    if (this.summonU) list.push(this.summonU);
    const sc = (u) => this.speedOf(u) * (jitter ? 0.85 + Math.random() * 0.3 : 1) + (u.on?.includes('p_first') && this.round === 1 ? 1000 : 0) + (u.jumping ? 2000 : 0) + (this.opts.preemptive && this.round === 1 && u.side === 'party' ? 500 : 0);
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
    for (const u of this.units.filter(u => u.alive)) {
      if (u.status.poison) { const d = Math.max(1, Math.round(u.st.hp * 0.07)); this.damage(u, d, { color: '#c86aff' }); u.status.poison--; if (!u.status.poison) delete u.status.poison; }
      if (u.status.regen) { this.heal(u, Math.round(u.st.hp * 0.08)); u.status.regen--; if (!u.status.regen) delete u.status.regen; }
      if (u.on?.includes('p_regen') && u.alive) this.heal(u, Math.round(u.st.hp * 0.04), true);
      for (const k of ['slow', 'silence', 'blind']) if (u.status[k]) { u.status[k]--; if (!u.status[k]) delete u.status[k]; }
      for (const k in u.buffs) { u.buffs[k].t--; if (u.buffs[k].t <= 0) delete u.buffs[k]; }
      if (u.taunt) u.taunt--;
      u.defending = false;
      if (u.side === 'enemy' && u.broken && this.round >= u.brokenUntil) { u.broken = false; u.shield = u.maxShield; this.pop(u, '恢復', '#8ae0ff'); }
    }
    this.checkDeaths();
    await wait(200);
  }
  checkEnd() {
    if (!this.foes.length) this.result = 'win';
    else if (!this.allies.length) this.result = 'lose';
  }

  async turn(u) {
    if (u.side === 'summon') return this.summonTurn(u);
    if (u.status.sleep) {
      u.status.sleep--; this.pop(u, 'Zzz', '#c8c8ff'); await wait(450);
      if (u.status.sleep > 0 && Math.random() > 0.35) return; delete u.status.sleep; this.pop(u, '醒來了', '#fff');
      return;
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
    const sk = skillsOf(this.S, u.hero), all = [...sk.own, ...sk.echo];
    const dead = this.party.find(p => !p.alive);
    if (dead) { const rv = all.find(s => SKILLS[s].tgt === 'dead' && u.mp >= (SKILLS[s].mp || 0)); if (rv) return { kind: 'skill', skill: rv, targets: [dead] }; }
    if (low) { const hs = all.find(s => SKILLS[s].type === 'heal' && SKILLS[s].tgt !== 'dead' && SKILLS[s].pow > 0 && u.mp >= (SKILLS[s].mp || 0) && !u.status.silence); if (hs) return { kind: 'skill', skill: hs, targets: SKILLS[hs].tgt === 'allies' ? this.allies : [low] }; }
    if (u.limit >= 100) return { kind: 'limit' };
    // pick a weakness we know
    let best = null, bs = 0;
    for (const e of foes) for (const s of ['attack', ...all]) {
      const S = SKILLS[s]; if (!S || (S.type !== 'phys' && S.type !== 'mag')) continue; if ((S.mp || 0) > u.mp) continue; if (S.type === 'mag' && u.status.silence) continue; if (S.jump) continue;
      const tags = this.tagsOf(u, S); const w = tags.some(t => e.weak.includes(t) && e.revealed.has(t));
      const score = (S.pow || 1) * (S.hits || 1) * (w ? 2.2 : 1) * (S.tgt === 'enemies' ? Math.min(foes.length, 3) * 0.8 : 1) - (S.mp || 0) * 0.02;
      if (score > bs) { bs = score; best = { kind: 'skill', skill: s, targets: S.tgt === 'enemies' ? foes : S.tgt === 'random' ? foes : [e] }; }
    }
    return best || { kind: 'skill', skill: 'attack', targets: [foes[0]] };
  }
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
    if (S.wpn) t.push(S.wpn); else if (S === SKILLS.attack && u.side === 'party') t.push(u.wpn);
    if (S.el) for (const e of [].concat(S.el)) t.push(e);
    return t;
  }

  // ---------------------------------------------------------------- the heart: using a skill
  async useSkill(u, sid, targets, o = {}) {
    const S = SKILLS[sid];
    const isP = u.side === 'party' || u.side === 'summon';
    if (S.mp && u.side === 'party') { if (u.mp < S.mp) { this.msg('MP不足！'); await wait(500); return; } u.mp -= S.mp; }
    if (u.side === 'party' && (S.type === 'mag' || S.type === 'heal' || S.type === 'debuff') && u.status.silence && !o.limit && !o.res) { this.msg(`${u.name} 被沉默了！`); await wait(600); return; }
    if (sid !== 'attack' && !o.quiet) this.msg(S.name);
    // jumps leave the field until the next round
    if (S.jump && !o.landing) {
      u.jumping = { skill: sid, target: targets[0] }; this.G.audio.sfx('jump');
      let t = 0; while (t < 0.4) { t += await this.G.frame(); u.oy = t * 40; } u.oy = 40;
      return;
    }
    if (o.landing) { let t = 0; const tx = targets[0].x + 0.8, tz = targets[0].z; u.ox = tx - u.x; while (t < 0.3) { t += await this.G.frame(); u.oy = 40 * (1 - t / 0.3); } u.oy = 0; }
    // actor animation
    await this.actorAnim(u, S);
    const physLike = S.type === 'phys';
    const hits = S.hits || 1;
    let total = 0;
    const doHit = async (tgt, k, last) => {
      if (!tgt || (!tgt.alive && S.tgt !== 'dead')) return;
      if (S.type === 'phys' || S.type === 'mag') {
        const els = S.el ? [].concat(S.el) : [];
        const el = hits > 1 && els.length > 1 ? [els[k % els.length]] : els;
        const tags = [...(S.wpn ? [S.wpn] : sid === 'attack' && u.side === 'party' ? [u.wpn] : []), ...el];
        this.effect(S.anim, tgt, el[0] || S.wpn || 'sword', u);
        await wait(hits > 2 ? 110 : 180);
        const r = this.calc(u, tgt, S, tags, o);
        if (r.miss) { this.pop(tgt, 'MISS', '#c8c8c8'); return; }
        this.damage(tgt, r.dmg, { weak: r.weak, crit: r.crit, resist: r.resist });
        total += r.dmg;
        if (S.drain) this.heal(u, Math.round(r.dmg * 0.5));
        if (r.weak && tgt.side === 'enemy') await this.breakHit(tgt, 1 + (S.brk || 0) + (u.on?.includes('p_breaker') ? 1 : 0));
        if (S.status && tgt.alive) this.inflict(tgt, S.status, S.chance || 0.4);
        if (S.debuff && tgt.alive) this.buff(tgt, Object.fromEntries(Object.entries(S.debuff).map(([k, v]) => [k, -v])));
        if (S.steal && tgt.side === 'enemy') this.steal(u, tgt);
        if (tgt.status.sleep && tgt.alive && Math.random() < 0.5) delete tgt.status.sleep;
        if (tgt.side === 'party' && tgt.alive && physLike && tgt.on.includes('p_counter') && Math.random() < 0.35 && !o.counter) this.counterQ = [tgt, u];
      } else if (S.type === 'heal') {
        this.effect(S.anim, tgt, 'light', u); await wait(150);
        if (S.revive || S.tgt === 'dead') { if (!tgt.alive) { tgt.alive = true; tgt.hp = Math.max(1, Math.round(tgt.st.hp * (S.revive || 0.3))); tgt.spr.setFrame(BPOSE.idle); this.pop(tgt, '復活', '#fff4b0'); } }
        if (!tgt.alive) return;
        if (S.full) this.heal(tgt, tgt.st.hp);
        else if (S.pow || S.base) { let h = (u.st.mag * this.bmul(u, 'mag') * (S.pow || 0) + (S.base || 0)) * (0.95 + Math.random() * 0.1); if (u.on?.includes('p_healup')) h *= 1.25; this.heal(tgt, Math.round(h)); }
        if (S.cure) { for (const k of ['poison', 'sleep', 'silence', 'blind', 'slow']) delete tgt.status[k]; }
        if (S.buff) this.buff(tgt, S.buff);
      } else if (S.type === 'buff') {
        this.effect(S.anim, tgt, 'light', u); await wait(120);
        if (S.buff) this.buff(tgt, S.buff);
        if (S.regen) tgt.status.regen = S.regen;
        if (S.taunt) { tgt.taunt = S.taunt; this.pop(tgt, '挑釁', '#ffb04a'); }
        if (S.heal) this.heal(tgt, Math.round(tgt.st.hp * S.heal));
      } else if (S.type === 'debuff') {
        this.effect(S.anim, tgt, S.el || 'dark', u); await wait(150);
        if (S.pow) { const r = this.calc(u, tgt, { ...S, type: 'mag' }, S.el ? [S.el] : [], o); this.damage(tgt, r.dmg, { weak: r.weak }); if (r.weak && tgt.side === 'enemy') await this.breakHit(tgt, 1); }
        if (S.status && tgt.alive) this.inflict(tgt, S.status, S.chance || 0.5);
        if (S.debuff && tgt.alive) this.buff(tgt, Object.fromEntries(Object.entries(S.debuff).map(([k, v]) => [k, -v])));
      } else if (S.type === 'special') {
        if (S.analyze) { for (const w of tgt.weak) tgt.revealed.add(w); this.remember(tgt); this.pop(tgt, '弱點看穿！', '#ffe04a'); this.G.audio.sfx('scan'); this.effect('scan', tgt, 'light', u); }
        if (S.steal) { this.effect('slash', tgt, 'dagger', u); this.steal(u, tgt); }
        if (S.charge) { u.charged = true; this.pop(u, '蓄力中…', '#ff6a6a'); this.effect('buff', u, 'fire', u); }
        if (S.stealGil) { const g = Math.min(this.S.gil, 20 + Math.floor(Math.random() * 40)); this.S.gil -= g; this.pop(tgt, `被偷了 ${g}G`, '#ffe04a'); }
        if (S.flee) { this.pop(u, '逃走了', '#fff'); u.alive = false; u.fled = true; this.fadeOut(u); }
        await wait(300);
      }
      this.ui.refresh();
    };
    if (S.tgt === 'random') {
      for (let k = 0; k < hits; k++) { const pool = this.targetsFor(u, S).filter(t => t.alive); if (!pool.length) break; await doHit(pool[Math.random() * pool.length | 0], k, k === hits - 1); }
    } else {
      for (let k = 0; k < hits; k++) {
        const list = targets.filter(t => t && (t.alive || S.tgt === 'dead'));
        if (!list.length && S.tgt === 'enemy') { const alt = this.targetsFor(u, S)[0]; if (alt) list.push(alt); }
        if (S.tgt === 'enemies' || S.tgt === 'allies') { for (const t of list) doHit(t, k, k === hits - 1); await wait(260); }
        else for (const t of list) await doHit(t, k, k === hits - 1);
      }
    }
    if (S.type === 'phys' && S.buff) this.buff(u, S.buff);
    if (u.charged && (S.type === 'phys' || S.type === 'mag')) u.charged = false;
    // limit gauge
    if (u.side === 'party' && total > 0 && !o.limit) u.limit = Math.min(100, u.limit + 6);
    await wait(260);
    this.checkDeaths();
    await this.actorReturn(u);
    // dual cast
    if (u.side === 'party' && S.type === 'mag' && u.on.includes('p_dualcast') && !o.dual && !o.limit && !o.res && Math.random() < 0.4 && this.foes.length) {
      this.pop(u, '連續詠唱！', '#c8a0ff'); await wait(300);
      if (S.mp) u.mp += S.mp;
      await this.useSkill(u, sid, S.tgt === 'enemy' ? [targets[0]?.alive ? targets[0] : this.foes[0]] : this.targetsFor(u, S), { ...o, dual: true });
    }
    if (this.counterQ) { const [c, tgt] = this.counterQ; this.counterQ = null; if (c.alive && tgt.alive) { this.pop(c, '反擊！', '#ffb04a'); await this.useSkill(c, 'attack', [tgt], { counter: true, quiet: true }); } }
    // second action for bosses
    if (u.side === 'enemy' && u.E.twice && !o.second && Math.random() < u.E.twice && u.alive && !u.broken && this.allies.length) { await wait(250); await this.enemyTurn(u, true); }
  }

  calc(u, t, S, tags, o) {
    const phys = S.type === 'phys';
    const A = phys ? u.st.atk * this.bmul(u, 'atk') : u.st.mag * this.bmul(u, 'mag');
    const D = S.pierce ? 0 : phys ? t.st.def * this.bmul(t, 'def') : t.st.spr * this.bmul(t, 'spr');
    if (phys && u.status.blind && Math.random() < 0.5) return { miss: true };
    let dmg = A * (S.pow || 1) * 60 / (60 + D * 1.5);
    if (u.side === 'enemy') dmg *= ENEMY_DMG;
    if (u.side === 'summon') dmg *= 1.15;
    const weak = t.side === 'enemy' ? tags.some(x => t.weak.includes(x)) : false;
    const resist = !weak && t.side === 'enemy' && tags.length && tags.every(x => t.resist.includes(x));
    if (weak) { dmg *= 1.5; for (const x of tags) if (t.weak.includes(x)) t.revealed.add(x); this.remember(t); }
    if (resist) dmg *= 0.5;
    if (t.side === 'enemy' && t.broken) dmg *= 1.6;
    if (this.inExtra) dmg *= 1.3;
    if (u.charged) dmg *= 2.5;
    if (t.defending) dmg *= 0.5;
    if (u.on) { for (const [p, e] of [['p_fireup', 'fire'], ['p_thunderup', 'thunder'], ['p_windup', 'wind']]) if (u.on.includes(p) && tags.includes(e)) dmg *= 1.25; }
    const critC = phys ? (u.on?.includes('p_crit') ? 0.15 : 0.05) : 0;
    const crit = Math.random() < critC; if (crit) dmg *= 1.5;
    dmg *= 0.92 + Math.random() * 0.16;
    return { dmg: Math.max(1, Math.min(99999, Math.round(dmg))), weak, crit, resist };
  }
  remember(t) { if (t.side === 'enemy') this.S.flags['seen_' + t.id] = [...t.revealed]; }
  bmul(u, k) { const b = u.buffs[k]; if (!b) return 1; return b.v > 0 ? 1 + b.v * 0.25 : 1 / (1 - b.v * 0.25); }
  buff(u, o, quiet) {
    for (const k in o) {
      const cur = u.buffs[k]?.v || 0; const v = Math.max(-3, Math.min(3, cur + o[k]));
      u.buffs[k] = { v, t: 3 };
      if (!quiet) this.pop(u, ({ atk: '攻擊', def: '防禦', mag: '魔力', spr: '精神', spd: '速度' })[k] + (o[k] > 0 ? '↑' : '↓'), o[k] > 0 ? '#8affb0' : '#ff8a8a');
    }
    this.ui.refresh();
  }
  inflict(t, st, chance) {
    if (t.immune) { this.pop(t, '無效', '#c8c8c8'); return; }
    if (t.boss && (st === 'sleep')) chance *= 0.25;
    if (Math.random() > chance) return;
    t.status[st] = st === 'sleep' ? 3 : 3;
    this.pop(t, { poison: '中毒', sleep: '睡眠', silence: '沉默', blind: '失明', slow: '緩速' }[st], '#c86aff');
  }
  steal(u, t) {
    if (t.stolen) { this.pop(t, '已經沒東西了', '#c8c8c8'); return; }
    const d = t.E.drops?.find(d => !['shard', 'stariron'].includes(d[0]) && !d[0].startsWith('x_') && !d[0].startsWith('w_')) || ['potion'];
    if (Math.random() < 0.65) { t.stolen = true; addItem(this.S, d[0], 1); this.pop(t, `偷到了 ${itemName(d[0])}！`, '#ffe04a'); this.G.audio.sfx('item'); }
    else this.pop(t, '偷竊失敗', '#c8c8c8');
  }
  async breakHit(t, n) {
    if (t.broken) return;
    t.shield = Math.max(0, t.shield - n);
    this.ui.refresh();
    if (t.shield === 0) {
      t.broken = true; t.brokenUntil = this.round + 1;
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
    if (t.hp <= 0 && t.side === 'party' && t.on.includes('p_survive') && !t.survived) { t.hp = 1; t.survived = true; this.pop(t, '不屈！', '#ffb04a'); }
    this.number(t, d, o.weak ? '#ffe04a' : o.color || (t.side === 'party' ? '#ff8a8a' : '#ffffff'), o);
    t.flash = 1; t.shakeT = 0.3;
    if (t.side === 'party') { t.limit = Math.min(100, t.limit + Math.round(d / t.st.hp * 70)); if (t.hp > 0) t.spr.setFrame(BPOSE.hurt); }
    this.G.audio.sfx(o.weak ? 'weak' : 'hit');
    if (t.hp <= 0) t.dying = true;
    this.ui.refresh();
  }
  heal(t, h, quiet) { if (!t.alive) return; const before = t.hp; t.hp = Math.min(t.st.hp, t.hp + h); if (!quiet || t.hp > before) this.number(t, t.hp - before, '#8affb0', {}); this.ui.refresh(); }
  checkDeaths() {
    for (const u of this.units) if (u.alive && u.hp <= 0) {
      u.alive = false; u.dying = false;
      if (u.side === 'enemy') { this.fadeOut(u); this.G.audio.sfx('kill'); }
      else { u.spr.setFrame(BPOSE.ko); u.buffs = {}; u.status = {}; u.jumping = null; u.oy = 0; }
      this.queue = (this.queue || []).filter(q => q !== u);
    }
    this.ui.refresh(); this.ui.timeline();
  }
  async fadeOut(u) {
    const m = u.spr.mat; m.transparent = true; m.alphaTest = 0;
    this.fx.emit({ x: u.x, y: u.spr.h * 0.5, z: u.z, n: 40, color: '#c8a0ff', speed: 2, up: 1.5, life: 1, size: 0.3, gravity: -1, spread: u.spr.w * 0.6 });
    let t = 0; while (t < 0.6) { t += await this.G.frame(); m.opacity = 1 - t / 0.6; m.color.setRGB(1 + t * 2, 0.6 + t, 1 + t * 2); }
    u.spr.mesh.visible = false; u.shadow.visible = false;
  }

  // ---------------------------------------------------------------- enemies
  async enemyTurn(u, second) {
    const acts = u.E.acts; let total = acts.reduce((s, a) => s + a[1], 0), r = Math.random() * total, pick = acts[0][0];
    for (const [s, w] of acts) { r -= w; if (r <= 0) { pick = s; break; } }
    let S = SKILLS[pick];
    if (S.type === 'heal' && !this.foes.some(f => f.hp < f.st.hp * 0.6)) { pick = acts.find(a => SKILLS[a[0]].type === 'phys')?.[0] || 'e_tackle'; S = SKILLS[pick]; }
    if (S.charge && u.charged) { pick = acts.find(a => ['phys', 'mag'].includes(SKILLS[a[0]].type))[0]; S = SKILLS[pick]; }
    let targets;
    const pool = this.allies.filter(a => !a.jumping);
    if (!pool.length) return;
    if (S.tgt === 'enemy') { const taunt = pool.filter(a => a.taunt); targets = [taunt.length && Math.random() < 0.8 ? taunt[0] : pool[Math.random() * pool.length | 0]]; }
    else if (S.tgt === 'enemies' || S.tgt === 'random') targets = pool;
    else if (S.tgt === 'allyE') { const low = this.foes.sort((a, b) => a.hp / a.st.hp - b.hp / b.st.hp)[0]; targets = [low]; S = { ...S, tgt: 'ally' }; }
    else targets = [u];
    await this.useSkill(u, pick, targets, { second });
  }

  // ---------------------------------------------------------------- summons
  async summon(u, sid) {
    const D = SUMMONS[sid];
    if (u.mp < D.mp) { this.msg('MP不足！'); await wait(500); return; }
    u.mp -= D.mp;
    await this.ui.banner(D.name, '召喚', '#ffb04a');
    let px = monsterPx(D.look, D.colors); if (D.look !== 'knight') px = px.flip().flip();
    // summons face the enemies (left), their art already faces left
    const spr = new VoxelSprite(px, { scale: 2.3, glow: 0.4 });
    const su = { side: 'summon', sid, D, name: D.name, spr, st: { atk: u.st.mag * 1.1, mag: u.st.mag * 1.2, spd: u.st.spd, hp: 1, def: 0, spr: 0 }, buffs: {}, status: {}, alive: true, turns: 0, on: [], x: 7, z: -0.5, y: 0, ox: 0, oy: 0, flash: 0 };
    spr.mesh.position.set(7, 0, -0.5); spr.mesh.rotation.y = -0.4; this.scene.add(spr.mesh);
    this.summonU = su;
    this.fx.emit({ x: 7, y: 1.5, z: -0.5, n: 80, color: '#ffe0a0', speed: 4, life: 1.2, size: 0.35, gravity: -1 });
    this.G.audio.sfx('summon');
    await wait(600);
    this.ui.timeline();
  }
  async summonTurn(su) {
    su.turns++;
    const D = su.D;
    const sid = su.turns >= 3 ? D.ult : D.acts[(su.turns - 1) % D.acts.length];
    if (su.turns >= 3) { await this.ui.banner(SKILLS[sid].name, D.name, '#ffb04a'); }
    await this.useSkill(su, sid, this.targetsFor(su, SKILLS[sid]), { res: true });
    if (su.turns >= 3) {
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
    const I = ITEMS[id]; this.S.items[id]--; if (!this.S.items[id]) delete this.S.items[id];
    this.msg(I.name); u.spr.setFrame(BPOSE.item); await wait(300);
    const e = I.use;
    if (e.escape) { if (this.units.some(x => x.boss) || this.opts.noFlee) { this.msg('無法逃走！'); await wait(500); return; } this.msg('成功逃走了！'); await wait(500); this.result = 'flee'; return; }
    for (const t of targets) {
      if (e.revive) { if (!t.alive) { t.alive = true; t.hp = Math.max(1, Math.round(t.st.hp * e.revive)); t.spr.setFrame(BPOSE.idle); this.pop(t, '復活', '#fff4b0'); this.effect('raise', t, 'light', u); } continue; }
      if (!t.alive) continue;
      if (e.heal) { this.heal(t, e.heal); this.effect('heal', t, 'light', u); }
      if (e.mp) { const b = t.mp; t.mp = Math.min(t.st.mp, t.mp + e.mp); this.number(t, t.mp - b, '#8ac8ff', {}); }
      if (e.cure) { for (const k of ['poison', 'sleep', 'silence', 'blind', 'slow']) delete t.status[k]; this.pop(t, '恢復了', '#fff'); }
      if (e.dmg) { this.effect(e.el === 'fire' ? 'explode' : e.el, t, e.el, u); const weak = t.weak?.includes(e.el); this.damage(t, Math.round(e.dmg * (weak ? 1.5 : 1) * (0.9 + Math.random() * 0.2)), { weak }); if (weak) { t.revealed.add(e.el); this.remember(t); await this.breakHit(t, 1); } }
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
  effect(anim, t, el, u) {
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
      if (u.side === 'party' && u.alive && !this.current && u.spr.frame <= 1) u.spr.setFrame(Math.floor(this.t * 1.6 + u.x) % 2 ? BPOSE.idle2 : BPOSE.idle);
      if (u.side === 'party' && u.alive && u.hp < u.st.hp * 0.25 && u.spr.frame <= 1) u.spr.setFrame(BPOSE.hurt);
    }
    // camera: gentle sway, intro sweep, focus on the actor, zoom for resonance
    const cur = this.current;
    const fx = cur && cur.side !== 'summon' ? (cur.x + (cur.ox || 0)) * 0.15 : 0;
    const zoom = this.camZoom ? 0.8 : 1;
    const intro = this.camIntro ? 1.3 : 1;
    this.camX = (this.camX ?? 0) + ((fx + Math.sin(this.t * 0.3) * 0.4) - (this.camX ?? 0)) * Math.min(1, dt * 3);
    const shake = this.camShake > 0 ? (this.camShake -= dt, (Math.random() - 0.5) * this.camShake * 0.6) : 0;
    this.camera.position.set(this.camX + shake + 0.4, 5.2 * zoom * intro, 14.5 * zoom * intro);
    this.camera.lookAt(this.camX * 0.6, -0.2, 0);
    this.flashLight.intensity *= Math.exp(-dt * 8);
    const gu = this.G.post.grade.uniforms; gu.flash.value *= Math.exp(-dt * 6);
    this.fx.update(dt);
    if (this.ui) this.ui.tick();
  }

  // ---------------------------------------------------------------- rewards
  async victory() {
    this.G.audio.music('victory');
    for (const u of this.allies) u.spr.setFrame(BPOSE.win);
    const E = this.opts.troop.map(id => ENEMIES[id]);
    let exp = E.reduce((s, e) => s + e.exp, 0), gil = E.reduce((s, e) => s + e.gil, 0);
    const P = this.party.flatMap(u => u.on);
    if (P.includes('p_exp')) exp = Math.round(exp * 1.5);
    if (P.includes('p_gil')) gil = Math.round(gil * 1.5);
    const drops = [];
    for (const e of E) for (const [id, ch] of e.drops || []) if (Math.random() < ch) { drops.push(id); addItem(this.S, id, 1); }
    this.S.gil += gil;
    const { gainExp, gainBond } = await import('./party.js');
    const ups = gainExp(this.S, exp);
    const bond = gainBond(this.S, Math.max(4, Math.round(E.reduce((s, e) => s + e.lv, 0) * (E.some(e => e.boss) ? 3 : 1.2))));
    this.S.battles++;
    await this.ui.results({ exp, gil, drops, ups, bond });
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
    for (const u of b.units.filter(u => u.side === 'enemy')) {
      const d = document.createElement('div'); d.className = 'b-einfo' + (u.boss ? ' boss' : '');
      d.innerHTML = `<div class="b-ename">${u.name}</div><div class="b-ebar"><i></i></div><div class="b-erow"><span class="b-shield"><b></b></span><span class="b-weak"></span></div>`;
      this.en.appendChild(d); u.info = d;
      d.onclick = () => this.pickHook && this.pickHook(u);
    }
    this.refresh(); this.timeline();
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
      const st = Object.keys(u.status).map(k => ({ poison: '毒', sleep: '眠', silence: '默', blind: '盲', slow: '緩', regen: '再' })[k]).join('');
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
      const tags = u.E.hideWeak ? u.weak.filter(w => u.revealed.has(w)).slice(0, 8) : u.weak;
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
    const c = battleSheet(E.look); const crop = document.createElement('canvas'); crop.width = 20; crop.height = 32; crop.getContext('2d').drawImage(c, 20 * 4, 0, 20, 32, 0, 0, 20, 32);
    this.cut.innerHTML = `<div class="cut-bg" style="--c:${E.color}"></div><img class="cut-img" src="${crop.toDataURL()}"><div class="cut-txt"><small>RESONANCE ・ ${E.name}</small><b>${name}</b></div>`;
    this.cut.classList.add('on'); this.b.G.audio.sfx('resonance');
    this.b.flash(E.color, 0.5);
    await wait(1500); this.cut.classList.remove('on'); await wait(200);
  }

  // ---------------------------------------------------------------- commands
  async command(u, extra) {
    const b = this.b, S = b.S;
    const sk = skillsOf(S, u.hero);
    const items = Object.keys(S.items).filter(i => ITEMS[i] && ITEMS[i].tgt);
    const opts = [
      { k: 'attack', label: '攻擊', sub: ICON[u.wpn] },
      { k: 'skill', label: '技能', disabled: !sk.own.length },
      { k: 'echo', label: u.echo ? '迴響：' + ECHOES[u.echo].short : '迴響', disabled: !sk.echo.length },
      { k: 'item', label: '道具', disabled: !items.length },
      { k: 'defend', label: '防禦' },
    ];
    if (u.limit >= 100) opts.splice(1, 0, { k: 'limit', label: '★ 極限技', cls: 'lim' });
    if (S.summons.length && !b.summonU && !extra) opts.push({ k: 'summon', label: '召喚' });
    if (!extra) opts.push({ k: 'flee', label: '逃跑', disabled: b.units.some(x => x.boss) || b.opts.noFlee });
    for (;;) {
      const i = await this.list(opts.map(o => ({ label: o.label, sub: o.sub, disabled: o.disabled, cls: o.cls })), { title: u.name + (extra ? '・追加' : ''), cancel: false, cmd: true });
      if (i === 'auto') return { kind: 'auto' };
      const o = opts[i];
      if (o.k === 'attack') { const t = await this.pickTarget(u, SKILLS.attack); if (t) return { kind: 'skill', skill: 'attack', targets: t }; continue; }
      if (o.k === 'skill' || o.k === 'echo') {
        const list = o.k === 'skill' ? sk.own : sk.echo;
        const j = await this.list(list.map(s => { const D = SKILLS[s]; const tags = [...(D.wpn ? [D.wpn] : []), ...(D.el ? [].concat(D.el) : [])]; return { label: D.name, sub: tags.map(t => ICON[t]).join('') + (D.mp ? ` <em>${D.mp}</em>` : ''), disabled: (D.mp || 0) > u.mp || (u.status.silence && ['mag', 'heal', 'debuff'].includes(D.type)), desc: D.desc }; }), { title: o.label, cancel: true });
        if (j < 0) continue;
        const sid = list[j], D = SKILLS[sid];
        const t = await this.pickTarget(u, D); if (!t) continue;
        if (D.relay) return { kind: 'relay', targets: t };
        return { kind: 'skill', skill: sid, targets: t };
      }
      if (o.k === 'limit') return { kind: 'limit' };
      if (o.k === 'item') {
        const j = await this.list(items.map(i => ({ label: ITEMS[i].name, sub: '×' + S.items[i], desc: ITEMS[i].desc })), { title: '道具', cancel: true });
        if (j < 0) continue;
        const id = items[j], I = ITEMS[id];
        if (I.tgt === 'none') return { kind: 'item', item: id, targets: [] };
        const t = await this.pickTarget(u, { tgt: I.tgt === 'enemies' ? 'enemies' : I.tgt === 'allies' ? 'allies' : I.tgt === 'dead' ? 'dead' : 'ally' }); if (!t) continue;
        return { kind: 'item', item: id, targets: t };
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
      this.cancelCmd = (v) => { off(); box.classList.remove('on'); res(v); };
      box.classList.add('on'); draw();
    });
  }
  // choose targets with the cursor (or tap). returns array or null
  pickTarget(u, S) {
    const b = this.b, G = b.G;
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
      const done = (v) => { off(); this.targetSet = null; this.cursorU = null; this.cursor.style.display = 'none'; this.pickHook = null; this.pt.onclick = null; G.audio.sfx(v ? 'ok' : 'cancel'); res(v); };
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
        const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(nx, ny), b.camera);
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
      if (r.drops.length) lines.push(`<div class="r-row"><span>獲得</span><b>${r.drops.map(itemName).join('、')}</b></div>`);
      for (const [id, lv, sk] of r.ups) lines.push(`<div class="r-up">${HEROES[id].name} 升到了 Lv ${lv}！${sk.length ? '　學會了 ' + sk.join('、') : ''}</div>`);
      for (const [e, lv, got] of r.bond) lines.push(`<div class="r-bond">迴響「${ECHOES[e].short}」羈絆提升到 ${lv}！${got.length ? '　習得：' + got.join('、') : ''}</div>`);
      this.cmd.classList.remove('on');
      const box = document.createElement('div'); box.className = 'b-result'; box.innerHTML = `<h3>勝利！</h3>${lines.join('')}<div class="r-ok">▶ 繼續</div>`;
      this.root.appendChild(box);
      setTimeout(() => {
        const off = G.input.on((k) => { if (k === 'ok' || k === 'cancel') { off(); box.remove(); res(); } });
        box.onclick = () => { off(); box.remove(); res(); };
      }, 500);
    });
  }
}
