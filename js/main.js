// Crystal Echoes: wires the renderer, field, battles, menus, story and saving together.
import * as THREE from '../lib/three.module.min.js';
import { createRenderer, createPost } from './render.js';
import { Field } from './field.js';
import { Battle } from './battle.js';
import { UI, fmtTime } from './ui.js';
import { Audio } from './audio.js';
import { Input } from './input.js';
import { makeStory } from './story.js';
import { MAPS } from './maps.js';
import { HEROES, ITEMS, ENEMIES } from './data.js';
import { BESTIARY_NEW } from './content.js';
import { newState, addHero, addItem, itemName, healAll, heroStats, migrate, gearFx } from './party.js';

const SAVE_KEY = 'crystal-echoes-save-v1';
const wait = (ms) => new Promise(r => setTimeout(r, ms));

class Game {
  constructor() {
    this.canvas = document.getElementById('view');
    this.renderer = createRenderer(this.canvas);
    this.S = newState();
    this.input = new Input();
    this.audio = new Audio();
    this.ui = new UI(this);
    this.field = new Field(this);
    this.battle = new Battle(this);
    this.post = createPost(this.renderer, this.field.scene, this.field.camera);
    this.story = makeStory(this);
    this.mode = 'title';
    this.frameWaiters = [];
    this.encMul = 1;
    this.last = performance.now();
    this.resize(); addEventListener('resize', () => this.resize());
    this.input.bindTouch(document.getElementById('touch'));
    document.body.classList.toggle('touchy', this.input.touchy);
    this.canvas.addEventListener('click', (e) => { if (this.tapHook) { const r = this.canvas.getBoundingClientRect(); this.tapHook(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); } });
    this.input.on((k) => this.fieldKey(k));
    // drag on the scene (mouse, or the right side of a touch screen) to turn the camera
    { let drag = null;
      this.canvas.addEventListener('pointerdown', (e) => { if (this.mode === 'field') drag = { id: e.pointerId, x: e.clientX }; });
      addEventListener('pointermove', (e) => { if (!drag || e.pointerId !== drag.id) return; const dx = e.clientX - drag.x; drag.x = e.clientX; if (this.mode === 'field' && !this.menuOpen) this.field.yaw -= dx * 0.009; });
      const end = (e) => { if (drag && e.pointerId === drag.id) drag = null; };
      addEventListener('pointerup', end); addEventListener('pointercancel', end); }
    addEventListener('pointerdown', () => this.audio.init(), { once: false });
    addEventListener('keydown', () => this.audio.init());
    requestAnimationFrame((t) => this.loop(t));
    window.CE = this; // handy for testing
  }
  resize() {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h, false);
    for (const c of [this.field.camera, this.battle.camera]) { c.aspect = w / h; c.fov = w / h < 1.2 ? 44 : 32; c.updateProjectionMatrix(); }
    this.post?.setSize(w, h);
  }
  frame() { return new Promise(r => this.frameWaiters.push(r)); }
  loop(now) {
    let dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
    if (this.mode === 'battle') dt *= this.S.settings.speed || 1;
    this.input.poll();
    if (this.mode !== 'title') this.S.time += dt / (this.mode === 'battle' ? (this.S.settings.speed || 1) : 1);
    const ws = this.frameWaiters; this.frameWaiters = [];
    for (const w of ws) w(dt);
    if (this.mode === 'battle') {
      this.battle.update(dt);
      this.draw(this.battle.scene, this.battle.camera, 0.5, 0.2, 2.0);
    } else {
      const busy = this.busy || this.mode !== 'field' || this.menuOpen;
      this.field.update(dt, busy ? { axis: { x: 0, y: 0 }, run: false } : this.input);
      if (this.mode === 'title') this.titleCam(dt);
      this.draw(this.field.scene, this.field.camera, this.field.world ? 0.5 : 0.52, this.field.world ? 0.2 : 0.17, this.field.world ? 2.6 : 2.3);
    }
    requestAnimationFrame((t) => this.loop(t));
  }
  draw(scene, cam, focus, band, amount) {
    const q = this.S.settings.quality;
    if (q === 0) { this.renderer.render(scene, cam); return; }
    this.post.setScene(scene); this.post.setCamera(cam); this.post.tilt(focus, band, q === 2 ? amount : amount * 0.8);
    this.post.composer.render();
  }
  titleCam(dt) {
    this.tt = (this.tt || 0) + dt;
    const f = this.field, c = f.camera;
    const x = 17 + Math.sin(this.tt * 0.08) * 6, z = 16 + Math.cos(this.tt * 0.06) * 3;
    f.cam.x = x; f.cam.z = z;
    c.position.set(x + 4, 9, z + 11); c.lookAt(x, 0.5, z);
    f.player.root.visible = false;
  }

  // ---------------------------------------------------------------- state helpers
  cond(str) {
    if (!str) return true;
    return str.split('&').every(tok => {
      let neg = false; if (tok[0] === '!') { neg = true; tok = tok.slice(1); }
      let v;
      const ch = /^ch(\d)$/.exec(tok), q = /^(q_\w+?)_(taken|done|ready)$/.exec(tok);
      if (ch) v = this.S.chapter >= +ch[1];
      else if (q) { const s = this.S.quests[q[1]]; v = q[2] === 'taken' ? !!s : s === q[2]; }
      else v = !!this.S.flags[tok];
      return neg ? !v : v;
    });
  }
  leaderLook() { return this.S.party[0] || 'aren'; }
  nightFor(id) { return id === 'port' && this.S.flags.port_night; }
  mapName() { return this.field.def?.name || ''; }
  npcBubble(def) { return this.story.bubble(def); }
  moguActive(id) { return this.S.quests.q_mogu === 'taken' && !this.S.mogu.includes(id); }
  updateObjective() { this.ui.objective(this.story.objectiveText()); }
  canSave() { const d = this.field.def; return d.town || d.world || d.interior || this.nearSave(); }
  nearSave() { const p = this.field.player; return this.field.built.interact.some(it => it.kind === 'save' && Math.hypot(it.c.i + 0.5 - p.x, it.c.j + 0.5 - p.z) < 2.2); }
  applySettings() {
    const st = this.S.settings;
    this.audio.setVol(st.music, st.sfx);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, st.quality === 2 ? 2 : st.quality === 1 ? 1.5 : 1));
    this.renderer.shadowMap.enabled = st.quality > 0;
    this.encMul = st.enc || 1;
    this.resize();
  }

  // ---------------------------------------------------------------- field input
  async fieldKey(k) {
    if (this.mode !== 'field' || this.busy || this.field.locked || this.menuOpen) return;
    if (k === 'ok') return this.interact();
    if (k === 'menu') { this.menuOpen = true; await this.ui.mainMenu(); this.menuOpen = false; return; }
    if (k === 'mount') return this.toggleMount();
  }
  async toggleMount() {
    const f = this.field;
    if (!f.world) { this.ui.toast('只能在大地圖上騎乘'); return; }
    const opts = [null]; if (this.S.flags.bird) opts.push('bird'); if (this.S.flags.airship_built) opts.push('airship');
    if (opts.length === 1) { this.ui.toast('還沒有坐騎'); return; }
    const next = opts[(opts.indexOf(f.mount) + 1) % opts.length];
    if (f.mount && !f.canLand()) { this.ui.toast('這裡無法降落'); return; }
    f.setMount(next); this.S.mount = next;
    this.audio.sfx(next ? 'jump' : 'step');
    this.ui.toast(next === 'bird' ? '騎上了機械鳥「啾比」' : next === 'airship' ? '搭上了飛空艇「晨星號」' : '下來了');
    if (!next) f.onEnterCell();
  }
  async interact() {
    const f = this.field;
    if (f.mount === 'airship') { if (f.canLand()) { f.setMount(null); this.S.mount = null; this.ui.toast('降落了'); const c = f.map.at(Math.floor(f.player.x), Math.floor(f.player.z)); if (c.spot) await this.onSpot(c.spot); } else this.ui.toast('這裡無法降落'); return; }
    const it = f.facing(); if (!it) return;
    this.busy = true;
    try {
      if (it.kind === 'npc') {
        const n = it.npc; const prevDir = n.dir; n.talking = true; f.face(n, f.player);
        const d = n.def;
        if (d.inn) await this.story.TALK[d.id]?.();
        else if (this.story.TALK[d.id]) await this.story.TALK[d.id]();
        else await this.ui.say('', '……', d.look);
        n.talking = false; if (!d.wander) { n.dir = prevDir; n.ang = null; f.syncWalker(n); }
        f.refreshBubbles();
      } else if (it.kind === 'chest') {
        if (it.open) { await this.ui.say('', '寶箱是空的。', null); }
        else if (it.cond && !this.cond(it.cond)) { await this.ui.say('', '寶箱打不開……', null); }
        else {
          it.open = true; this.S.chests.push(it.id); this.audio.sfx('chest');
          let t = 0; while (t < 0.3) { t += await this.frame(); it.lidP.rotation.x = -1.9 * Math.min(1, t / 0.3); }
          const o = MAPS[f.mapId].objs.find(o => o.id === it.id);
          const item = o?.item;
          if (o?.gil) { this.S.gil += o.gil; await this.ui.say('', `找到了 ${o.gil} G！`, null); }
          if (item) { addItem(this.S, item, 1); await this.ui.say('', `找到了 ${itemName(item)}！`, null); }
          if (item === 'k_necklace' && this.S.quests.q_necklace === 'taken') this.ui.toast('找到了莉莉的項鍊！回港口交給她吧');
        }
      } else if (it.kind === 'board') await this.story.board(it.id);
      else if (it.kind === 'sign') await this.ui.say('', it.text || '……', null);
      else if (it.kind === 'save') {
        healAll(this.S); this.audio.sfx('save'); this.ui.hud();
        if (await this.ui.yesno('存檔水晶溫柔地發著光。\n隊伍的HP與MP完全回復了。\n要存檔嗎？')) { this.save(); this.ui.toast('已存檔'); }
      } else if (it.kind === 'tablet') {
        this.S.tablets.push(it.id); it.sprite.visible = false; f.built.interact = f.built.interact.filter(x => x !== it);
        addItem(this.S, 'tablet', 1); this.audio.sfx('item'); await this.ui.say('', `撿到了石板碎片！（${this.S.tablets.length}/12）`, null);
      } else if (it.kind === 'mogu') {
        this.S.mogu.push(it.id); it.spr.mesh.visible = false; f.built.interact = f.built.interact.filter(x => x !== it);
        this.audio.sfx('mogu'); await this.ui.say('咪咕', `咪咕～！（抓到了！ ${this.S.mogu.length}/5）`, null);
        f.refreshBubbles();
      }
    } finally { this.busy = false; this.ui.hud(); }
  }

  // ---------------------------------------------------------------- moving between places
  async warp(to, x, z, dir = 'down', o = {}) {
    if (o.cond && !this.cond(o.cond)) return;
    this.busy = true;
    if (!o.quiet) { if (o.door) this.audio.sfx('door'); await this.ui.fade(1, 300); }
    if (this.field.world && to !== 'world' && this.field.player) this.S.lastWorld = { x: Math.floor(this.field.player.x), z: Math.floor(this.field.player.z) };
    const mount = to === 'world' ? (o.airship ? 'airship' : null) : null;
    this.field.load(to, x, z, dir, { mount });
    this.field.player.root.visible = true;
    this.audio.music(this.field.def.bgm || this.field.theme.bgm);
    this.S.map = to; this.S.x = x; this.S.z = z; this.S.dir = dir; this.S.mount = mount;
    this.ui.hud(); this.updateObjective();
    if (!o.quiet) await this.ui.fade(0, 300);
    this.busy = false;
    this.autosave();
    // first-time events on arrival
    if (to === 'anvil' && !this.S.flags.anvil_seen) { this.S.flags.anvil_seen = true; this.ui.areaName('鐵砧城'); }
  }
  async onLockedWarp(o) {
    this.busy = true;
    if (o.to === 'lighthouse') await this.ui.say('希爾薇', '燈塔要等神官大人的許可才能進去。', 'sylvie');
    else await this.ui.say('', '門鎖著。', null);
    const p = this.field.player; p.z -= 0.6; this.field.syncWalker(p);
    this.busy = false;
  }
  async onSpot(s) {
    if (this.busy) return;
    this.busy = true;
    try {
      if (s.event) { await this.story.SPOT_EVENTS[s.event](); return; }
      if (s.cond && !this.cond(s.cond)) {
        const why = { ch2: '鐵砧城的城門緊閉著。（先追擊薩倫，前往低語森林吧）', mine_open: '礦坑被一陣怪風封住了。先去鐵砧城問問吧。', ch3: '大橋的另一頭是水都蒼瀾。（現在還不是時候）', temple_open: '堤道的水門關著。去水都蒼瀾問問吧。', ch4: '那座浮空遺跡，只有飛空艇才到得了。' }[s.cond] || '現在還進不去。';
        await this.ui.say('', why, null); return;
      }
      if (s.to) { this.busy = false; await this.warp(s.to[0], s.to[1], s.to[2], s.to[3] || 'up'); }
    } finally { this.busy = false; }
  }
  async runEvent(id, o) {
    const fn = this.story.EV[id]; if (!fn) return;
    this.busy = true;
    try { await fn(o); } finally { this.busy = false; this.ui.hud(); this.field.refreshBubbles(); }
  }

  // ---------------------------------------------------------------- battles
  bgFor() {
    const th = this.field.def.theme, f = this.field;
    if (th === 'field') { const c = f.map.at(Math.floor(f.player.x), Math.floor(f.player.z)); if (c && c.kind === 'snow') return 'snow'; if (c && (c.ch === ':' || f.player.x > 47)) return 'coast'; if (f.player.x > 29 && f.player.z < 30) return 'mountain'; return 'field'; }
    return { port: 'town', anvil: 'town', azurelle: 'town', forest: 'forest', mountain: 'mountain', mine: 'cave', temple: 'temple', sky: 'sky', skyDark: 'void', coast: 'coast', interior: 'town', sanctum: 'temple' }[th] || 'field';
  }
  async randomBattle(enc) {
    if (this.busy || this.mode !== 'field') return;
    let troop = enc.troops[Math.random() * enc.troops.length | 0];
    const wild = this.wildTroop(enc);
    if (wild) troop = wild;
    const res = await this.fight({ troop, bg: this.bgFor(), preemptive: Math.random() < 0.1, random: true });
    return res;
  }
  // pick monsters from the big bestiary that live on this kind of ground and fit the area's level
  wildTroop(enc) {
    const bg = this.bgFor(), post = this.S.flags.cleared;
    const lv = post ? Math.max(enc.lv, 28 + Math.floor(Math.random() * 24)) : enc.lv;
    const near = (E, span) => Math.abs(E.lv - lv) <= span;
    const metal = BESTIARY_NEW.filter(id => ENEMIES[id].metal && ENEMIES[id].lv <= lv + 12 && ENEMIES[id].hab.includes(bg));
    if (metal.length && Math.random() < 0.035) { const m = metal[Math.random() * metal.length | 0]; return Math.random() < 0.3 ? [m, m] : [m]; }
    if (Math.random() > (post ? 0.85 : 0.55)) return null;
    let pool = BESTIARY_NEW.filter(id => { const E = ENEMIES[id]; return !E.metal && E.hab.includes(bg) && near(E, Math.max(3, lv * 0.22)); });
    if (pool.length < 2) pool = BESTIARY_NEW.filter(id => !ENEMIES[id].metal && near(ENEMIES[id], Math.max(4, lv * 0.3)) && ENEMIES[id].hab.includes(bg));
    if (!pool.length) return null;
    const out = []; let room = 4;
    const n = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) { const id = pool[Math.random() * pool.length | 0], size = ENEMIES[id].scale >= 1.3 || ENEMIES[id].kind === 'dragon' ? 3 : ['beast', 'ogre', 'hydra', 'octopus', 'golem', 'worm', 'mech'].includes(ENEMIES[id].kind) ? 2 : 1; if (size > room) break; out.push(id); room -= size; }
    return out.length ? out : null;
  }
  async fight(opts) {
    const wasBusy = this.busy; this.busy = true;
    const snapshot = JSON.stringify(this.S);
    this.audio.sfx('encounter');
    await this.transition();
    this.mode = 'battle';
    await this.ui.fade(0, 200);
    document.body.classList.add('inbattle');
    let res;
    for (;;) {
      res = await this.battle.run(opts);
      if (res !== 'lose') break;
      const choice = await this.gameOver(!!opts.random);
      if (choice === 'retry') { const s = JSON.parse(snapshot); Object.assign(this.S, s); continue; }
      await this.ui.fade(1, 400); document.body.classList.remove('inbattle');
      this.mode = 'field';
      if (choice === 'load' && this.loadSave()) { await this.ui.fade(0, 400); this.busy = wasBusy; return 'lose'; }
      // nothing saved: back to the start of the map with full HP
      healAll(this.S); await this.warp(this.S.map, this.field.def.spawn[0], this.field.def.spawn[1], 'up', { quiet: true }); await this.ui.fade(0, 400); this.busy = wasBusy; return 'lose';
    }
    await this.ui.fade(1, 250);
    document.body.classList.remove('inbattle');
    this.mode = 'field';
    this.audio.music(this.field.def.bgm || this.field.theme.bgm);
    this.renderer.toneMappingExposure = this.field.exposure || 1;
    this.ui.hud();
    await this.ui.fade(0, 250);
    this.busy = wasBusy;
    return res;
  }
  async transition() {
    const e = document.getElementById('swirl'); e.classList.remove('go'); void e.offsetWidth; e.classList.add('go');
    this.post.grade.uniforms.flash.value = 0.8;
    await wait(450); await this.ui.fade(1, 150); e.classList.remove('go');
  }
  gameOver(random) {
    return new Promise((res) => {
      this.audio.music(null);
      const box = document.getElementById('gameover'); box.classList.add('on');
      box.innerHTML = `<h2>全滅了……</h2><p>迴響的光芒還沒有熄滅。</p><div class="go-btns"><button data-v="retry">重新挑戰這場戰鬥</button><button data-v="load">讀取存檔</button></div>`;
      const pick = (v) => { box.classList.remove('on'); off(); res(v); };
      box.querySelectorAll('button').forEach(b => b.onclick = () => pick(b.dataset.v));
      let sel = 0; const btns = [...box.querySelectorAll('button')]; btns[0].classList.add('sel');
      const off = this.input.on((k) => { if (k === 'up' || k === 'down') { btns[sel].classList.remove('sel'); sel = 1 - sel; btns[sel].classList.add('sel'); } if (k === 'ok') pick(btns[sel].dataset.v); });
    });
  }

  // ---------------------------------------------------------------- saving
  save() { try { this.S.map = this.field.mapId; this.S.x = Math.floor(this.field.player.x); this.S.z = Math.floor(this.field.player.z); this.S.dir = this.field.player.dir; this.S.mount = this.field.mount; localStorage.setItem(SAVE_KEY, JSON.stringify(this.S)); return true; } catch (e) { return false; } }
  autosave() { if (this.S.flags.intro_done && (this.field.def.town || this.field.def.world || this.field.def.interior)) { try { this.save(); localStorage.setItem(SAVE_KEY + '-auto', '1'); } catch (e) { } } }
  hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
  partyFx(id) { return gearFx(this.S, id); }
  loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY); if (!raw) return false;
      const s = JSON.parse(raw); this.S = Object.assign(newState(), s); this.S.settings = Object.assign(newState().settings, s.settings || {}); migrate(this.S);
      this.applySettings();
      this.field.load(this.S.map, this.S.x, this.S.z, this.S.dir, { mount: this.S.mount });
      this.field.player.root.visible = true;
      this.audio.music(this.field.def.bgm || this.field.theme.bgm);
      this.mode = 'field'; this.ui.hud(); this.updateObjective();
      return true;
    } catch (e) { console.error(e); return false; }
  }

  // ---------------------------------------------------------------- title and ending
  async title() {
    this.mode = 'title';
    this.field.load('port', 17, 21, 'up');
    document.body.classList.add('attitle');
    const box = document.getElementById('title');
    box.classList.add('on');
    this.audio.music('title');
    this.ui.fade(0, 1200);
    const has = this.hasSave();
    box.querySelector('.tt-menu').innerHTML = `${has ? '<button data-v="cont">繼續遊戲</button>' : ''}<button data-v="new">新的旅程</button>`;
    const btns = [...box.querySelectorAll('button')]; let sel = 0; btns[0].classList.add('sel');
    const v = await new Promise((res) => {
      btns.forEach((b, i) => b.onclick = () => { this.audio.init(); res(b.dataset.v); });
      const off = this.input.on((k) => { this.audio.init(); if (k === 'up' || k === 'down') { btns[sel].classList.remove('sel'); sel = (sel + 1) % btns.length; btns[sel].classList.add('sel'); this.audio.sfx('move'); } if (k === 'ok') { off(); res(btns[sel].dataset.v); } });
      this.titleOff = off;
    });
    this.titleOff?.(); this.audio.init(); this.audio.sfx('ok');
    box.classList.remove('on'); document.body.classList.remove('attitle');
    await this.ui.fade(1, 500);
    if (v === 'cont' && this.loadSave()) { await this.ui.fade(0, 500); return; }
    // new game
    this.S = newState();
    addHero(this.S, 'aren', 1);
    this.applySettings();
    this.field.load('port', 17, 21, 'up');
    this.field.player.root.visible = true;
    this.mode = 'field'; this.ui.hud();
    await this.runEvent('intro');
  }
  async ending() {
    this.audio.music('ending');
    await this.ui.fade(1, 1200);
    const box = document.getElementById('ending'); box.classList.add('on');
    const lines = [
      ['', '「緘默」消失了。'], ['', '浮空遺跡慢慢沉進了雲海，大陸上的水晶重新亮了起來。'],
      ['艾倫', '歐勒斯……我們會記得你。'], ['', '那天之後，海潮神殿的牆上多了一幅新的壁畫。'],
      ['', '畫裡是七位英雄。其中一位拿著盾牌，站在最後面，溫柔地笑著。'],
      ['米菈', '被記得的人，就不算真的離開——\n聖女瑟菈說的，一點也沒錯呢。'],
      ['塔洛', '我決定了。去魔法學院之前，先把這趟旅行寫成一本書。'],
      ['蕾娜', '晨星號還能飛得更遠！下次去海的另一邊看看吧！'],
      ['希爾薇', '……艾倫。你成了一個很好的騎士。'],
      ['', '水晶迴響 Crystal Echoes\n\n—— 完 ——'],
      ['', '感謝遊玩！\n通關後可以挑戰：蒼瀾競技場「傳說級」、四處「封印之地」、還沒去過的光之祠堂。'],
    ];
    for (const [who, t] of lines) {
      box.innerHTML = `<div class="end-line">${who ? `<small>${who}</small>` : ''}${t.replace(/\n/g, '<br>')}</div>`;
      await wait(400);
      await new Promise((res) => { const off = this.input.on((k) => { if (k === 'ok') { off(); res(); } }); box.onclick = () => { off(); res(); }; setTimeout(() => { off(); res(); }, 6000); });
    }
    box.classList.remove('on');
    healAll(this.S); this.S.chapter = 5;
    await this.warp('world', 9, 34, 'right', { quiet: true });
    await this.ui.fade(0, 1000);
    this.save(); this.ui.toast('已自動存檔。之後可以繼續探索！', 4000);
  }
}

const game = new Game();
game.title();
