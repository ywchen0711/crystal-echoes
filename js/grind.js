// Auto-grinding: the hero wanders around where you started, fights on auto, patches up between fights,
// and stops on your conditions with a summary of what was earned.
import { HEROES, ITEMS } from './data.js?v=12';
import { heroStats, itemName } from './party.js?v=12';

export const GRIND_DEFAULT = { hp: 0.35, battles: 0, lvUp: 0, heal: true, ether: true, speed: 2 };
export const GRIND_OPTS = {
  hp: [[0.5, 'HP低於50%'], [0.35, 'HP低於35%'], [0.2, 'HP低於20%'], [0, '不停（有人倒下才停）']],
  battles: [[10, '10場'], [30, '30場'], [100, '100場'], [0, '不限']],
  lvUp: [[1, '升1級'], [3, '升3級'], [5, '升5級'], [0, '不限']],
};

export class Grind {
  constructor(G, cfg) {
    this.G = G; this.cfg = { ...GRIND_DEFAULT, ...cfg };
    const S = G.S, p = G.field.player;
    this.home = { x: p.x, z: p.z }; this.target = null; this.stuck = 0; this.last = { x: p.x, z: p.z };
    this.stats = { battles: 0, exp: 0, gil: 0, ap: 0, drops: {}, t0: S.time, lv0: Object.fromEntries(S.party.map(id => [id, S.heroes[id].lv])), echoes: [] };
    this.oldAuto = S.settings.auto; this.oldSpeed = S.settings.speed;
    S.settings.auto = true; S.settings.speed = this.cfg.speed || 2;
    this.banner = document.createElement('div'); this.banner.className = 'grind-banner';
    this.banner.onclick = (e) => { e.stopPropagation(); this.stop('你停止了自動練功'); };
    document.body.appendChild(this.banner); this.update();
  }
  // ---------------------------------------------------------------- wandering: pick a reachable spot near home that is not an exit
  safeCell(i, j) {
    const f = this.G.field, c = f.map.at(i, j);
    if (!c || c.block || c.water || c.void || c.spot || c.stairs) return false;
    if (c.marks.some(m => m.k === 'warp' || m.k === 'event' || m.k === 'npc' || m.spot)) return false;
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = f.map.at(i + a, j + b); if (!n || n.marks.some(m => m.k === 'warp' || m.k === 'event') || n.spot) return false; }
    return Math.abs((c.h || 0) - (f.map.at(Math.floor(this.home.x), Math.floor(this.home.z))?.h || 0)) < 1.2;
  }
  pickTarget() {
    for (let k = 0; k < 30; k++) {
      const i = Math.floor(this.home.x + (Math.random() - 0.5) * 10), j = Math.floor(this.home.z + (Math.random() - 0.5) * 10);
      if (this.safeCell(i, j)) return { x: i + 0.5, z: j + 0.5 };
    }
    return { x: this.home.x, z: this.home.z };
  }
  input(dt) {
    const f = this.G.field, p = f.player;
    if (!this.target || Math.hypot(this.target.x - p.x, this.target.z - p.z) < 0.4) this.target = this.pickTarget();
    // no progress for a while: try somewhere else
    if (Math.hypot(p.x - this.last.x, p.z - this.last.z) < 0.02) { if ((this.stuck += dt) > 0.7) { this.target = this.pickTarget(); this.stuck = 0; } } else this.stuck = 0;
    this.last = { x: p.x, z: p.z };
    // never step onto an exit: if the next step would land on an unsafe cell, turn away
    let wx = this.target.x - p.x, wz = this.target.z - p.z; const l = Math.hypot(wx, wz) || 1; wx /= l; wz /= l;
    const ni = Math.floor(p.x + wx * 0.7), nj = Math.floor(p.z + wz * 0.7);
    if ((ni !== Math.floor(p.x) || nj !== Math.floor(p.z)) && !this.safeCell(ni, nj)) { this.target = this.pickTarget(); return { axis: { x: 0, y: 0 }, run: false }; }
    const cy = Math.cos(f.yawCur), sy = Math.sin(f.yawCur);
    return { axis: { x: wx * cy - wz * sy, y: wx * sy + wz * cy }, run: true, turn: 0 };
  }
  // ---------------------------------------------------------------- between fights
  async afterBattle(res, spoils) {
    const S = this.G.S, st = this.stats;
    if (res === 'lose') return this.stop('全滅了，停止自動練功');
    if (res === 'win' && spoils) {
      st.battles++; st.exp += spoils.exp || 0; st.gil += spoils.gil || 0; st.ap += spoils.ap || 0;
      for (const d of spoils.drops || []) st.drops[d] = (st.drops[d] || 0) + 1;
      for (const e of spoils.woke || []) st.echoes.push(e);
    }
    this.update();
    const party = S.party.map(id => ({ id, h: S.heroes[id], st: heroStats(S, id) }));
    if (party.some(x => x.h.hp <= 1)) { if (!this.revive(party)) return this.stop('有隊員倒下了'); }
    if (this.cfg.heal) this.patch(party);
    if (this.cfg.hp && party.some(x => x.h.hp < x.st.hp * this.cfg.hp)) return this.stop(`有隊員HP低於${Math.round(this.cfg.hp * 100)}%，而且沒有回復藥了`);
    if (this.cfg.battles && st.battles >= this.cfg.battles) return this.stop(`打完${st.battles}場了`);
    if (this.cfg.lvUp && S.party.some(id => S.heroes[id].lv - (st.lv0[id] || S.heroes[id].lv) >= this.cfg.lvUp)) return this.stop(`升了${this.cfg.lvUp}級`);
    return null;
  }
  // use the weakest potion that does the job
  patch(party) {
    const S = this.G.S;
    const heals = Object.keys(S.items).filter(i => ITEMS[i]?.use?.heal && !ITEMS[i].use.revive && ITEMS[i].tgt !== 'allies' && S.items[i] > 0).sort((a, b) => ITEMS[a].use.heal - ITEMS[b].use.heal);
    const mps = Object.keys(S.items).filter(i => ITEMS[i]?.use?.mp && !ITEMS[i].use.heal && S.items[i] > 0).sort((a, b) => ITEMS[a].use.mp - ITEMS[b].use.mp);
    for (const x of party) {
      let guard = 0;
      while (x.h.hp < x.st.hp * Math.max(0.6, this.cfg.hp + 0.2) && guard++ < 6) {
        const need = x.st.hp - x.h.hp, id = heals.find(i => S.items[i] > 0 && ITEMS[i].use.heal >= need * 0.5) || [...heals].reverse().find(i => S.items[i] > 0);
        if (!id) break; this.spend(id); x.h.hp = Math.min(x.st.hp, x.h.hp + ITEMS[id].use.heal);
      }
      if (this.cfg.ether && x.st.mp > 0 && x.h.mp < x.st.mp * 0.25) { const id = mps.find(i => S.items[i] > 0); if (id) { this.spend(id); x.h.mp = Math.min(x.st.mp, x.h.mp + ITEMS[id].use.mp); } }
    }
  }
  revive(party) {
    const S = this.G.S; let ok = true;
    for (const x of party.filter(x => x.h.hp <= 1)) {
      const id = Object.keys(S.items).filter(i => ITEMS[i]?.use?.revive && ITEMS[i].tgt === 'dead' && S.items[i] > 0).sort((a, b) => ITEMS[a].use.revive - ITEMS[b].use.revive)[0];
      if (!id || !this.cfg.heal) { ok = false; continue; }
      this.spend(id); x.h.hp = Math.max(1, Math.round(x.st.hp * ITEMS[id].use.revive));
    }
    return ok;
  }
  spend(id) { const S = this.G.S; S.items[id]--; if (!S.items[id]) delete S.items[id]; this.stats.used = this.stats.used || {}; this.stats.used[id] = (this.stats.used[id] || 0) + 1; }
  update() {
    const st = this.stats;
    this.banner.innerHTML = `<b>⚔ 自動練功中</b><span>戰鬥 ${st.battles}${this.cfg.battles ? '/' + this.cfg.battles : ''}　EXP +${st.exp}　${st.gil} G</span><small>點這裡停止</small>`;
  }
  // ---------------------------------------------------------------- the end: a summary
  async stop(reason) {
    if (this.stopped) return 'stopped'; this.stopped = true;
    const G = this.G, S = G.S, st = this.stats;
    S.settings.auto = this.oldAuto; S.settings.speed = this.oldSpeed;
    this.banner.remove(); G.grind = null;
    const ups = S.party.filter(id => S.heroes[id].lv > (st.lv0[id] || 0)).map(id => `${HEROES[id].name} Lv ${st.lv0[id]} → ${S.heroes[id].lv}`);
    const drops = Object.entries(st.drops).sort((a, b) => b[1] - a[1]);
    const used = Object.entries(st.used || {});
    const secs = Math.max(0, Math.round(S.time - st.t0)), dur = secs < 60 ? `${secs} 秒` : `${Math.round(secs / 60)} 分鐘`;
    const html = `<div class="gi"><h4>自動練功結束</h4><div class="gi-trait">${reason}</div>
      <div>戰鬥 <b>${st.battles}</b> 場　約 ${dur}</div><div>經驗值 <b>+${st.exp}</b>　金幣 <b>+${st.gil}</b>　AP <b>+${st.ap}</b></div>
      ${ups.length ? `<div style="color:#8affb0">${ups.join('<br>')}</div>` : ''}
      ${st.echoes.length ? `<div style="color:#ffe04a">✦ 迴響水晶甦醒：${st.echoes.length} 個</div>` : ''}
      ${drops.length ? `<div class="gi-fx">${drops.slice(0, 24).map(([d, n]) => `<span>${itemName(d)} ×${n}</span>`).join('')}</div>` : '<div class="gi-kind">沒有掉落物</div>'}
      ${used.length ? `<div class="gi-kind">用掉：${used.map(([d, n]) => `${itemName(d)}×${n}`).join('、')}</div>` : ''}</div>`;
    await G.ui.info(html, '自動練功');
    return 'stopped';
  }
}
