// Menus and windows: dialogue, choices, the main menu, shops, inns, notices and little overlays.
import { HEROES, ECHOES, PASSIVES, SKILLS, ITEMS, GEAR, ECHO_ORDER, EXP_NEXT, SUMMONS, STAR_COST, BOND_EXP, ELEM, WPN, ICON } from './data.js';
import { heroStats, skillsOf, apUsed, apCap, equip, canEquip, setEcho, togglePassive, starUp, ownedEchoes, itemName, addItem, echoSkills } from './party.js';
import { personSheet, battleSheet } from './pixel.js';
import { lookOf } from './field.js';

const $ = (s) => document.querySelector(s);
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const portraitCache = new Map();
export function portrait(look) {
  const L = lookOf(look); if (!L) return '';
  const key = JSON.stringify(L); if (portraitCache.has(key)) return portraitCache.get(key);
  const sh = personSheet(L); const c = document.createElement('canvas'); c.width = 20; c.height = 18;
  c.getContext('2d').drawImage(sh, 0, 0, 20, 18, 0, 0, 20, 18);
  const url = c.toDataURL(); portraitCache.set(key, url); return url;
}
export function fullSprite(look, battle = false) {
  const L = lookOf(look); const sh = battle ? battleSheet(L) : personSheet(L); const c = document.createElement('canvas'); c.width = 20; c.height = 32;
  c.getContext('2d').drawImage(sh, 0, 0, 20, 32, 0, 0, 20, 32); return c.toDataURL();
}

export class UI {
  constructor(game) {
    this.G = game; this.layer = $('#ui');
  }
  get S() { return this.G.S; }

  // ---------------------------------------------------------------- small overlays
  areaName(name) { const e = $('#area'); e.textContent = name; e.classList.remove('show'); void e.offsetWidth; e.classList.add('show'); }
  danger(lv) { const e = $('#danger'); e.className = lv < 0 ? '' : 'lv' + lv; }
  toast(t, ms = 2200) { const e = document.createElement('div'); e.className = 'toast'; e.innerHTML = t; $('#toasts').appendChild(e); setTimeout(() => e.classList.add('out'), ms); setTimeout(() => e.remove(), ms + 500); }
  async fade(to, ms = 400) { const e = $('#fade'); e.style.transition = `opacity ${ms}ms`; e.style.opacity = to; await wait(ms); }
  async chapter(n, title, sub) {
    const e = $('#chapter'); e.innerHTML = `<small>第 ${n} 章</small><b>${title}</b><i>${sub || ''}</i>`; e.classList.add('on');
    this.G.audio.sfx('banner'); await wait(2600); e.classList.remove('on'); await wait(600);
  }
  objective(t) { const e = $('#objective'); if (!t) { e.style.display = 'none'; return; } e.style.display = ''; e.innerHTML = `<b>◆</b> ${t}`; }
  hud() {
    const S = this.S; const e = $('#hudparty');
    e.innerHTML = S.party.map(id => { const h = S.heroes[id], st = heroStats(S, id); return `<div class="hp-mini"><img src="${portrait(id)}"><div><div class="bar"><i style="width:${h.hp / st.hp * 100}%"></i></div><div class="bar mp"><i style="width:${h.mp / st.mp * 100}%"></i></div></div></div>`; }).join('');
    $('#hudgil').textContent = S.gil + ' G';
  }

  // ---------------------------------------------------------------- dialogue
  say(name, text, look, o = {}) {
    const box = $('#dialog'), G = this.G;
    return new Promise((res) => {
      const pic = look ? portrait(look) : '';
      box.innerHTML = `${pic ? `<img class="dl-face" src="${pic}">` : ''}<div class="dl-body">${name ? `<div class="dl-name">${name}</div>` : ''}<div class="dl-text"></div><div class="dl-next">▼</div></div>`;
      box.className = 'on' + (pic ? ' face' : '') + (o.narr ? ' narr' : '') + (o.shout ? ' shout' : '');
      const el = box.querySelector('.dl-text');
      const chars = [...text]; let i = 0, done = false;
      const spd = this.S.settings.textSpeed || 28;
      const tick = () => { if (done) return; i++; el.innerHTML = chars.slice(0, i).join('').replace(/\n/g, '<br>'); if (i % 3 === 0 && chars[i - 1] !== ' ') G.audio.sfx('talk'); if (i >= chars.length) { done = true; box.classList.add('ready'); } else this.tt = setTimeout(tick, spd); };
      tick();
      const adv = () => { if (!done) { done = true; clearTimeout(this.tt); el.innerHTML = text.replace(/\n/g, '<br>'); box.classList.add('ready'); return; } off(); box.onclick = null; box.className = ''; res(); };
      const off = G.input.on((k) => { if (k === 'ok' || k === 'cancel') adv(); });
      box.onclick = adv;
    });
  }
  // a list chooser. items: strings or {label, sub, disabled, desc}. returns index or -1
  choose(items, o = {}) {
    const G = this.G;
    items = items.map(i => typeof i === 'string' ? { label: i } : i);
    return new Promise((res) => {
      const wrap = document.createElement('div'); wrap.className = 'chooser ' + (o.cls || '') + (o.info ? ' wide' : '');
      this.layer.appendChild(wrap);
      let sel = Math.max(0, Math.min(items.length - 1, o.start || 0));
      if (items[sel]?.disabled && !o.allowDisabled) { const f = items.findIndex(i => !i.disabled); if (f >= 0) sel = f; }
      const draw = () => {
        const info = typeof o.info === 'function' ? o.info(sel) : (o.info || '');
        wrap.innerHTML = `<div class="ch-box">${o.title ? `<div class="ch-title">${o.title}</div>` : ''}<div class="ch-cols"><div class="ch-list">${items.map((it, i) => `<div class="ch-it ${i === sel ? 'sel' : ''} ${it.disabled ? 'dis' : ''}" data-i="${i}">${it.icon ? `<img src="${it.icon}">` : ''}<span class="ch-l">${it.label}</span>${it.sub !== undefined ? `<span class="ch-s">${it.sub}</span>` : ''}</div>`).join('')}</div>${info ? `<div class="ch-info">${info}</div>` : ''}</div>${items[sel]?.desc ? `<div class="ch-desc">${items[sel].desc}</div>` : ''}${o.cancel !== false ? '<div class="ch-back">✕ 返回</div>' : ''}</div>`;
        wrap.querySelectorAll('.ch-it').forEach(el => el.onclick = () => { const i = +el.dataset.i; if (items[i].disabled && !o.allowDisabled) { G.audio.sfx('error'); return; } if (i === sel || G.input.touchy) done(i); else { sel = i; G.audio.sfx('move'); draw(); } });
        const b = wrap.querySelector('.ch-back'); if (b) b.onclick = () => done(-1);
        const s = wrap.querySelector('.ch-it.sel'); if (s) s.scrollIntoView({ block: 'nearest' });
      };
      const done = (v) => { off(); wrap.remove(); G.audio.sfx(v < 0 ? 'cancel' : 'ok'); res(v); };
      const off = G.input.on((k) => {
        if (k === 'up') { sel = (sel + items.length - 1) % items.length; G.audio.sfx('move'); draw(); }
        if (k === 'down') { sel = (sel + 1) % items.length; G.audio.sfx('move'); draw(); }
        if ((k === 'left' || k === 'right') && o.lr) { const r = o.lr(sel, k === 'left' ? -1 : 1); if (r) draw(); }
        if (k === 'ok') { if (items[sel].disabled && !o.allowDisabled) { G.audio.sfx('error'); return; } done(sel); }
        if ((k === 'cancel' || k === 'menu') && o.cancel !== false) done(-1);
      });
      this.redraw = draw;
      draw();
    });
  }
  async yesno(q, name, look) { if (q) await this.sayKeep(name, q, look); const r = await this.choose(['是', '否'], { cls: 'small', cancel: true }); this.closeKeep(); return r === 0; }
  async sayKeep(name, text, look) { await this.say(name, text, look); const box = $('#dialog'); box.className = 'on keep' + (look ? ' face' : ''); box.innerHTML = `${look ? `<img class="dl-face" src="${portrait(look)}">` : ''}<div class="dl-body">${name ? `<div class="dl-name">${name}</div>` : ''}<div class="dl-text">${text.replace(/\n/g, '<br>')}</div></div>`; }
  closeKeep() { const box = $('#dialog'); box.className = ''; }
  async info(html, title) { await this.choose([{ label: '確定' }], { title, info: html, cancel: true, cls: 'infobox' }); }

  // ---------------------------------------------------------------- main menu
  async mainMenu() {
    const G = this.G, S = this.S;
    this.G.audio.sfx('ok');
    let start = 0;
    for (;;) {
      this.hud();
      const opts = ['隊伍狀態', '迴響水晶', '能力配置', '裝備', '道具', '委託任務', '召喚獸', '隊伍編成', '存檔', '設定', '關閉選單'];
      const i = await this.choose(opts.map(l => ({ label: l })), { title: `${G.mapName()}　<span class="gil">${S.gil} G</span>　<span class="tm">${fmtTime(S.time)}</span>`, info: this.partySummary(), start, cls: 'mainmenu' });
      start = Math.max(0, i);
      if (i < 0 || i === 10) break;
      if (i === 0) await this.statusMenu();
      if (i === 1) await this.echoMenu();
      if (i === 2) await this.passiveMenu();
      if (i === 3) await this.equipMenu();
      if (i === 4) await this.itemMenu();
      if (i === 5) await this.questMenu();
      if (i === 6) await this.summonMenu();
      if (i === 7) await this.formationMenu();
      if (i === 8) { if (G.canSave()) { G.save(); this.toast('已存檔'); G.audio.sfx('save'); } else this.toast('這裡無法存檔（請到存檔水晶旁）'); }
      if (i === 9) await this.settingsMenu();
    }
    this.hud();
  }
  partySummary() {
    const S = this.S;
    return `<div class="ps">${S.party.map(id => { const h = S.heroes[id], st = heroStats(S, id); return `<div class="ps-row"><img src="${fullSprite(id)}"><div><b style="color:${HEROES[id].color}">${HEROES[id].name}</b> <small>Lv ${h.lv}　${HEROES[id].title}</small><div class="ps-bars"><span>HP ${h.hp}/${st.hp}</span><span>MP ${h.mp}/${st.mp}</span></div><small>迴響：${h.echo ? ECHOES[h.echo].short : '—'}</small></div></div>`; }).join('')}</div>`;
  }
  heroPick(title, all = false) {
    const S = this.S, list = all ? [...S.party, ...S.reserve] : S.party;
    return this.choose(list.map(id => ({ label: HEROES[id].name, sub: 'Lv ' + S.heroes[id].lv, icon: portrait(id) })), { title }).then(i => i < 0 ? null : list[i]);
  }
  statusHTML(id) {
    const S = this.S, h = S.heroes[id], st = heroStats(S, id), H = HEROES[id];
    const sk = skillsOf(S, id);
    return `<div class="st"><img class="st-big" src="${fullSprite(id, true)}"><div><h3 style="color:${H.color}">${H.name} <small>${H.title}</small></h3>
      <div>Lv ${h.lv}　EXP ${h.exp}/${EXP_NEXT(h.lv)}</div>
      <table><tr><td>HP</td><td>${h.hp}/${st.hp}</td><td>MP</td><td>${h.mp}/${st.mp}</td></tr><tr><td>攻擊</td><td>${st.atk}</td><td>防禦</td><td>${st.def}</td></tr><tr><td>魔力</td><td>${st.mag}</td><td>精神</td><td>${st.spr}</td></tr><tr><td>速度</td><td>${st.spd}</td><td>AP</td><td>${apUsed(S, id)}/${apCap(S, id)}</td></tr></table>
      <div>武器 ${GEAR[h.equip.w]?.name || '—'}　防具 ${GEAR[h.equip.a]?.name || '—'}　飾品 ${GEAR[h.equip.x]?.name || '—'}</div>
      <div>迴響 ${h.echo ? ECHOES[h.echo].name : '—'}</div>
      <div class="st-sk">技能：${sk.own.map(s => SKILLS[s].name).join('、')}${sk.echo.length ? '<br>迴響技能：' + sk.echo.map(s => SKILLS[s].name).join('、') : ''}</div>
      <div class="st-bio">${H.bio}</div></div></div>`;
  }
  async statusMenu() { const S = this.S; const list = [...S.party, ...S.reserve]; await this.choose(list.map(id => ({ label: HEROES[id].name, sub: 'Lv ' + S.heroes[id].lv, icon: portrait(id) })), { title: '隊伍狀態', info: (i) => this.statusHTML(list[i]) }); }

  echoHTML(eid) {
    const S = this.S, E = ECHOES[eid], e = S.echoes[eid];
    if (!e) return `<div class="st"><h3>？？？</h3><div>尚未取得。世界各地的「光之祠堂」裡沉睡著傳說英雄的迴響。</div></div>`;
    const holder = Object.keys(S.heroes).find(h => S.heroes[h].echo === eid);
    const sk = E.skills.map(([b, s]) => `<span class="${e.bond >= b ? '' : 'lock'}">${SKILLS[s].name}<small>羈絆${b}</small></span>`).join('');
    const ps = E.passives.map(([b, p]) => `<span class="${e.bond >= b ? '' : 'lock'}">${PASSIVES[p].name}<small>羈絆${b}</small></span>`).join('');
    const stars = '★'.repeat(e.star) + '☆'.repeat(3 - e.star);
    const R = SKILLS[E.resonance];
    return `<div class="st"><img class="st-big" src="${fullSprite(E.look, true)}"><div><h3 style="color:${E.color}">${E.name}</h3>
      <div>${stars}　羈絆 ${e.bond}/5　(${e.bexp}/${BOND_EXP[Math.min(5, e.bond + 1)] || '—'})</div>
      <div>裝備者：${holder ? HEROES[holder].name : '—'}</div>
      <div>能力加成：${Object.entries(E.stat).map(([k, v]) => ({ hp: 'HP', mp: 'MP', atk: '攻擊', def: '防禦', mag: '魔力', spr: '精神', spd: '速度' })[k] + ' +' + Math.round(v * (1 + e.star * 0.35) * 100) + '%').join('　')}</div>
      <div class="tags">技能：${sk}</div><div class="tags">被動：${ps}</div>
      ${E.starSkills ? `<div class="tags">星級魔法：${Object.entries(E.starSkills).map(([s, l]) => `<span class="${e.star >= s ? '' : 'lock'}">${l.map(x => SKILLS[x].name).join('/')}<small>★${s}</small></span>`).join('')}</div>` : ''}
      <div>共鳴：<b>${R.name}</b>　${R.desc}</div>
      <div class="st-bio">${E.lore.join('')}</div></div></div>`;
  }
  async echoMenu() {
    const S = this.S;
    for (;;) {
      const list = ECHO_ORDER;
      const i = await this.choose(list.map(e => ({ label: S.echoes[e] ? ECHOES[e].short : '？？？', sub: S.echoes[e] ? '★'.repeat(S.echoes[e].star) + ' 羈' + S.echoes[e].bond : '', icon: S.echoes[e] ? portrait(ECHOES[e].look) : '', disabled: !S.echoes[e] })), { title: `迴響水晶　迴響碎片 ×${S.items.shard || 0}`, info: (i) => this.echoHTML(list[i]), allowDisabled: false });
      if (i < 0) return;
      const eid = list[i], e = S.echoes[eid];
      const cost = STAR_COST[e.star + 1];
      const a = await this.choose([{ label: '讓隊員裝備' }, { label: e.star >= 3 ? '星級已滿' : `星級提升（碎片 ${cost}）`, disabled: e.star >= 3 || (S.items.shard || 0) < cost }], { title: ECHOES[eid].name, info: this.echoHTML(eid) });
      if (a === 0) { const h = await this.heroPick('誰要裝備「' + ECHOES[eid].short + '」？', true); if (h) { setEcho(S, h, eid); this.toast(`${HEROES[h].name} 裝備了 ${ECHOES[eid].short}`); } }
      if (a === 1) { if (starUp(S, eid)) { this.G.audio.sfx('levelup'); this.toast(`${ECHOES[eid].short} 提升到 ${'★'.repeat(S.echoes[eid].star)}！`); } }
    }
  }
  async passiveMenu() {
    const S = this.S; const id = await this.heroPick('能力配置', true); if (!id) return;
    for (;;) {
      const h = S.heroes[id]; const L = h.learned;
      if (!L.length) { await this.info('<p>還沒有學會任何被動能力。</p><p>裝備迴響並在戰鬥中提升羈絆，就能學會。學會的能力換了迴響也能繼續裝備。</p>', HEROES[id].name); return; }
      const i = await this.choose(L.map(p => ({ label: (h.on.includes(p) ? '◆ ' : '◇ ') + PASSIVES[p].name, sub: 'AP ' + PASSIVES[p].ap, desc: PASSIVES[p].desc })), { title: `${HEROES[id].name}　AP ${apUsed(S, id)}/${apCap(S, id)}` });
      if (i < 0) return;
      if (!togglePassive(S, id, L[i])) { this.G.audio.sfx('error'); this.toast('AP 不足'); }
    }
  }
  gearLine(g) { if (!g) return ''; const G = GEAR[g]; return ['atk', 'def', 'mag', 'spr', 'spd', 'hp', 'mp'].filter(k => G[k]).map(k => ({ atk: '攻', def: '防', mag: '魔', spr: '精', spd: '速', hp: 'HP', mp: 'MP' })[k] + '+' + G[k]).join(' ') + (G.immune ? ' 防異常' : ''); }
  async equipMenu() {
    const S = this.S; const id = await this.heroPick('裝備', true); if (!id) return;
    for (;;) {
      const h = S.heroes[id];
      const slots = [['w', '武器'], ['a', '防具'], ['x', '飾品']];
      const i = await this.choose(slots.map(([s, n]) => ({ label: n, sub: GEAR[h.equip[s]]?.name || '—' })), { title: HEROES[id].name + '　裝備', info: this.statusHTML(id) });
      if (i < 0) return;
      const slot = slots[i][0];
      const opts = Object.keys(S.items).filter(g => GEAR[g] && GEAR[g].slot === slot && canEquip(id, g));
      const j = await this.choose([{ label: '（卸下）', disabled: slot === 'w' }, ...opts.map(g => ({ label: GEAR[g].name, sub: this.gearLine(g) + ' ×' + S.items[g] }))], { title: slots[i][1], info: (k) => k === 0 ? '' : this.compare(id, slot, opts[k - 1]) });
      if (j < 0) continue;
      equip(S, id, slot, j === 0 ? null : opts[j - 1]); this.G.audio.sfx('item');
    }
  }
  compare(id, slot, g) {
    const S = this.S, before = heroStats(S, id); const h = S.heroes[id]; const old = h.equip[slot]; h.equip[slot] = g; const after = heroStats(S, id); h.equip[slot] = old;
    return `<div class="cmp">${['hp', 'mp', 'atk', 'def', 'mag', 'spr', 'spd'].map(k => { const d = after[k] - before[k]; return `<div><span>${({ hp: 'HP', mp: 'MP', atk: '攻擊', def: '防禦', mag: '魔力', spr: '精神', spd: '速度' })[k]}</span><b>${before[k]}</b>→<b class="${d > 0 ? 'up' : d < 0 ? 'dn' : ''}">${after[k]}</b></div>`; }).join('')}</div>`;
  }
  async itemMenu() {
    const S = this.S;
    for (;;) {
      const list = Object.keys(S.items).filter(i => S.items[i] > 0).sort((a, b) => (ITEMS[a] ? 0 : 1) - (ITEMS[b] ? 0 : 1));
      if (!list.length) { this.toast('沒有道具'); return; }
      const i = await this.choose(list.map(it => ({ label: itemName(it), sub: '×' + S.items[it], desc: ITEMS[it]?.desc || (GEAR[it] ? this.gearLine(it) : '') })), { title: '道具', cls: 'items' });
      if (i < 0) return;
      const id = list[i], I = ITEMS[id];
      if (!I || !I.use || I.use.dmg || I.use.escape) continue;
      if (I.use.tent) { if (!this.G.nearSave()) { this.toast('要在存檔水晶旁使用'); continue; } S.items[id]--; if (!S.items[id]) delete S.items[id]; const { healAll } = await import('./party.js'); healAll(S); this.G.audio.sfx('heal'); this.toast('全員完全回復了！'); continue; }
      const targets = I.tgt === 'allies' ? S.party : [await this.heroPick(I.name + ' 給誰用？', true)];
      if (!targets[0]) continue;
      let used = false;
      for (const t of targets) {
        const h = S.heroes[t], st = heroStats(S, t);
        if (I.use.revive) { if (h.hp <= 0) { h.hp = Math.round(st.hp * I.use.revive); used = true; } continue; }
        if (h.hp <= 0) continue;
        if (I.use.heal && h.hp < st.hp) { h.hp = Math.min(st.hp, h.hp + I.use.heal); used = true; }
        if (I.use.mp && h.mp < st.mp) { h.mp = Math.min(st.mp, h.mp + I.use.mp); used = true; }
        if (I.use.cure) used = true;
      }
      if (used) { S.items[id]--; if (!S.items[id]) delete S.items[id]; this.G.audio.sfx('heal'); this.hud(); } else this.G.audio.sfx('error');
    }
  }
  async questMenu() {
    const Q = this.G.quests(); const S = this.S;
    const list = Object.keys(Q).filter(q => S.quests[q]);
    if (!list.length) { await this.info('<p>還沒有接受任何委託。</p><p>城鎮的委託板上貼著居民的請求，靠近按確定就能查看。</p>', '委託任務'); return; }
    await this.choose(list.map(q => ({ label: Q[q].name, sub: S.quests[q] === 'done' ? '完成' : S.quests[q] === 'ready' ? '可回報' : '進行中' })), { title: '委託任務', info: (i) => `<div class="st"><div><h3>${Q[list[i]].name}</h3><p>${Q[list[i]].desc}</p><p>委託人：${Q[list[i]].from}</p><p>報酬：${Q[list[i]].rewardText}</p></div></div>` });
  }
  async summonMenu() {
    const S = this.S;
    if (!S.summons.length) { await this.info('<p>還沒有可以召喚的幻獸。</p><p>傳說在大陸各地，有四隻守護幻獸等待著被認可的人。</p>', '召喚獸'); return; }
    await this.choose(S.summons.map(s => ({ label: SUMMONS[s].name, sub: 'MP ' + SUMMONS[s].mp })), { title: '召喚獸', info: (i) => `<div class="st"><div><h3>${SUMMONS[S.summons[i]].name}</h3><p>${SUMMONS[S.summons[i]].desc}</p><p>召喚後會參戰三回合，第三回合施放必殺技後離開。</p></div></div>` });
  }
  async formationMenu() {
    const S = this.S;
    for (;;) {
      const all = [...S.party, ...S.reserve];
      const i = await this.choose(all.map((id, k) => ({ label: (k < S.party.length ? '' : '（待命）') + HEROES[id].name, sub: k === 0 ? '隊長' : '', icon: portrait(id) })), { title: '隊伍編成：選兩人交換位置', info: '<p>前四人上場戰鬥，第一位是隊長（地圖上顯示的角色）。</p><p>待命的隊員也會得到一半的經驗值。</p>' });
      if (i < 0) return;
      const j = await this.choose(all.map((id, k) => ({ label: HEROES[id].name, sub: k === i ? '◀' : '', icon: portrait(id) })), { title: `和誰交換「${HEROES[all[i]].name}」？` });
      if (j < 0 || j === i) continue;
      [all[i], all[j]] = [all[j], all[i]];
      S.party = all.slice(0, Math.min(4, all.length)); S.reserve = all.slice(4);
      if (!S.party.length) continue;
      this.G.field.setLeader(S.party[0]);
    }
  }
  async settingsMenu() {
    const S = this.S, st = S.settings;
    for (;;) {
      const i = await this.choose([
        { label: '音樂音量', sub: '▮'.repeat(Math.round(st.music * 10)) + '▯'.repeat(10 - Math.round(st.music * 10)) },
        { label: '音效音量', sub: '▮'.repeat(Math.round(st.sfx * 10)) + '▯'.repeat(10 - Math.round(st.sfx * 10)) },
        { label: '畫質', sub: ['流暢', '標準', '精美'][st.quality] },
        { label: '戰鬥速度', sub: '×' + (st.speed || 1) },
        { label: '文字速度', sub: (st.textSpeed || 28) <= 12 ? '快' : (st.textSpeed || 28) >= 40 ? '慢' : '普通' },
        { label: '遇敵', sub: this.G.encMul === 0.5 ? '較少' : '普通' },
      ], { title: '設定（左右鍵調整，或點兩下）', lr: (k, d) => { this.adjust(k, d); return true; } });
      if (i < 0) { this.G.applySettings(); return; }
      this.adjust(i, 1); this.G.applySettings();
    }
  }
  adjust(i, d) {
    const st = this.S.settings;
    if (i === 0) st.music = Math.max(0, Math.min(1, Math.round((st.music + d * 0.1) * 10) / 10));
    if (i === 1) st.sfx = Math.max(0, Math.min(1, Math.round((st.sfx + d * 0.1) * 10) / 10));
    if (i === 2) st.quality = (st.quality + (d > 0 ? 1 : 2)) % 3;
    if (i === 3) st.speed = st.speed === 2 ? 1 : 2;
    if (i === 4) st.textSpeed = (st.textSpeed || 28) === 28 ? 10 : (st.textSpeed || 28) === 10 ? 45 : 28;
    if (i === 5) { this.G.encMul = this.G.encMul === 0.5 ? 1 : 0.5; st.enc = this.G.encMul; }
    this.G.applySettings();
  }

  // ---------------------------------------------------------------- shops and inns
  async shop(list, title = '商店') {
    const S = this.S;
    for (;;) {
      const m = await this.choose(['購買', '出售'], { title: `${title}　<span class="gil">${S.gil} G</span>`, cls: 'small' });
      if (m < 0) return;
      if (m === 0) {
        for (;;) {
          const i = await this.choose(list.map(id => { const it = ITEMS[id] || GEAR[id]; return { label: it.name, sub: it.price + ' G' + (S.items[id] ? `　持有${S.items[id]}` : ''), disabled: S.gil < it.price, desc: ITEMS[id]?.desc || this.gearLine(id) + (GEAR[id]?.slot === 'w' ? '　' + WPN[GEAR[id].type] : '') }; }), { title: `購買　<span class="gil">${S.gil} G</span>`, info: (i) => GEAR[list[i]] ? this.whoCan(list[i]) : '' });
          if (i < 0) break;
          const id = list[i], it = ITEMS[id] || GEAR[id];
          const n = ITEMS[id] ? await this.choose([1, 3, 5, 10].map(k => ({ label: `${k} 個`, sub: it.price * k + ' G', disabled: S.gil < it.price * k })), { title: it.name, cls: 'small' }) : 0;
          if (n < 0) continue;
          const k = [1, 3, 5, 10][n]; S.gil -= it.price * k; addItem(S, id, k); this.G.audio.sfx('item'); this.toast(`買了 ${it.name} ×${k}`);
        }
      } else {
        for (;;) {
          const own = Object.keys(S.items).filter(id => S.items[id] > 0 && ((ITEMS[id] && (ITEMS[id].price || ITEMS[id].sell) && !ITEMS[id].key && id !== 'shard' && id !== 'stariron' && id !== 'tablet') || (GEAR[id] && GEAR[id].price)));
          if (!own.length) { this.toast('沒有可以賣的東西'); break; }
          const i = await this.choose(own.map(id => { const it = ITEMS[id] || GEAR[id]; return { label: it.name, sub: `${it.sell || Math.floor(it.price / 2)} G ×${S.items[id]}` }; }), { title: `出售　<span class="gil">${S.gil} G</span>` });
          if (i < 0) break;
          const id = own[i], it = ITEMS[id] || GEAR[id]; S.gil += it.sell || Math.floor(it.price / 2); addItem(S, id, -1); if (S.items[id] <= 0) delete S.items[id]; this.G.audio.sfx('item');
        }
      }
    }
  }
  whoCan(g) { const S = this.S; return `<div class="cmp">${Object.keys(S.heroes).map(id => canEquip(id, g) ? `<div><span>${HEROES[id].name}</span>${this.compareShort(id, g)}</div>` : `<div class="dim"><span>${HEROES[id].name}</span>不能裝備</div>`).join('')}</div>`; }
  compareShort(id, g) { const S = this.S, slot = GEAR[g].slot, b = heroStats(S, id); const h = S.heroes[id], old = h.equip[slot]; h.equip[slot] = g; const a = heroStats(S, id); h.equip[slot] = old; const k = slot === 'w' ? (GEAR[g].mag > GEAR[g].atk ? 'mag' : 'atk') : 'def'; const d = a[k] - b[k]; return `<b class="${d > 0 ? 'up' : d < 0 ? 'dn' : ''}">${({ atk: '攻', mag: '魔', def: '防' })[k]} ${d >= 0 ? '+' : ''}${d}</b>`; }
  async inn(price) {
    const S = this.S;
    if (!await this.yesno(`住一晚要 ${price} G，要休息嗎？\n（持有 ${S.gil} G）`, '旅店老闆', 'innkeep')) return false;
    if (S.gil < price) { await this.say('旅店老闆', '哎呀，錢好像不夠呢……', 'innkeep'); return false; }
    S.gil -= price;
    this.G.audio.music(null); await this.fade(1, 700);
    const { healAll } = await import('./party.js'); healAll(S);
    this.G.audio.sfx('save'); await wait(1200);
    await this.fade(0, 700); this.G.audio.music(this.G.field.def.bgm || this.G.field.theme.bgm);
    await this.say('旅店老闆', '早安！昨晚睡得好嗎？路上小心喔。', 'innkeep');
    this.hud();
    return true;
  }
}
export function fmtTime(s) { s = Math.floor(s); return `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}`; }
