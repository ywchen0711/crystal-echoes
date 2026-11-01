// Menus and windows: dialogue, choices, the main menu, shops, inns, notices and little overlays.
import { DIFF, DIFF_ORDER, balanceFor } from './balance.js?v=17';
import { HEROES, ECHOES, PASSIVES, SKILLS, ITEMS, GEAR, ECHO_ORDER, EXP_NEXT, SUMMONS, STAR_COST, BOND_EXP, ELEM, WPN, ICON } from './data.js?v=17';
import { heroStats, skillsOf, apUsed, apCap, equip, canEquip, setEcho, togglePassive, starUp, ownedEchoes, itemName, addItem, echoSkills, EQUIP_SLOTS, SLOT_N, slotFits, gearFx, artsOf, spellsOf, masteryLv, hands, paperLook, itemLook, gearLook } from './party.js?v=17';
import { WTYPES, fxText, ITEM_CATS, SCHOOL_N, ARTS_BY_TYPE, MASTERY_AT, STYLE_N, APT, SHIELD_KINDS, TIER_N, FAM_N, TRAIT_N, DROP_N } from './content.js?v=17';
import { ENEMIES } from './data.js?v=17';
import { GRIND_DEFAULT, GRIND_OPTS } from './grind.js?v=17';
import { STATE_N, STATE_DESC, REACTIONS, PAIRS, SETS, setBonus, huntText, NEW_ECHOES } from './depth.js?v=17';
import { monsterPx } from './pixel.js?v=17';
import { personSheet, battleSheet } from './pixel.js?v=17';
import { lookOf } from './field.js?v=17';
import { renderWeaponIcon, setDepth } from './voxel.js?v=17';
import { renderPortrait } from './paperdoll.js?v=17';

const $ = (s) => document.querySelector(s);
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const portraitCache = new Map();
export function portrait(look) {
  const L = lookOf(look); if (!L) return '';
  const key = 'p' + JSON.stringify(L); if (portraitCache.has(key)) return portraitCache.get(key);
  const url = renderPortrait(L, 'face'); portraitCache.set(key, url); return url;
}
export function fullSprite(look, battle = false) {
  const L = lookOf(look); if (!L) return '';
  const key = (battle ? 'b' : 'f') + JSON.stringify(L); if (portraitCache.has(key)) return portraitCache.get(key);
  const url = renderPortrait(L, battle ? 'battle' : 'full'); portraitCache.set(key, url); return url;
}

// the picture of an equipment piece: the weapon itself, or a mannequin wearing the piece
const itemIconCache = new Map();
export function itemIcon(gid, big = false) {
  const G = GEAR[gid]; if (!G) return '';
  const key = gid + (big ? 'B' : ''); if (itemIconCache.has(key)) return itemIconCache.get(key);
  let url = '';
  try {
    if (G.slot === 'hand' && G.type !== 'shield') { const f = gearLook(G); url = f.weapon ? renderWeaponIcon(f.weapon, f.weaponMetal, f.weaponAccent, f.weaponTier, f.weaponRefine) : ''; }
    else if (G.slot === 'acc') url = '';
    else url = renderPortrait(itemLook(gid), G.slot === 'head' && !big ? 'face' : 'full');
  } catch (e) { url = ''; }
  itemIconCache.set(key, url); return url;
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
      let built = false, lastInfo = null, rows = [], infoEl = null, descEl = null;
      // the whole window is built once; moving the cursor only updates the highlight, info and description
      const build = () => {
        wrap.innerHTML = `<div class="ch-box${built || o.still ? ' noanim' : ''}">${o.title ? `<div class="ch-title">${o.title}</div>` : ''}<div class="ch-cols"><div class="ch-list">${items.map((it, i) => `<div class="ch-it ${it.disabled ? 'dis' : ''}" data-i="${i}">${it.icon ? `<img src="${it.icon}">` : ''}<span class="ch-l">${it.label}</span>${it.sub !== undefined ? `<span class="ch-s">${it.sub}</span>` : ''}</div>`).join('')}</div>${o.info ? '<div class="ch-info"></div>' : ''}</div><div class="ch-desc"></div>${o.cancel !== false ? '<div class="ch-back">✕ 返回</div>' : ''}</div>`;
        built = true; lastInfo = null;
        rows = [...wrap.querySelectorAll('.ch-it')]; infoEl = wrap.querySelector('.ch-info'); descEl = wrap.querySelector('.ch-desc');
        rows.forEach(el => el.onclick = () => { const i = +el.dataset.i; if (items[i].disabled && !o.allowDisabled) { G.audio.sfx('error'); return; } if (i === sel || G.input.touchy) done(i); else { sel = i; G.audio.sfx('move'); update(); } });
        const b = wrap.querySelector('.ch-back'); if (b) b.onclick = () => done(-1);
        update();
      };
      const update = () => {
        rows.forEach((el, i) => el.classList.toggle('sel', i === sel));
        if (infoEl) { const info = typeof o.info === 'function' ? o.info(sel) : (o.info || ''); if (info !== lastInfo) { infoEl.innerHTML = info; lastInfo = info; } }
        const d = items[sel]?.desc || ''; if (descEl.innerHTML !== d) descEl.innerHTML = d; const anyDesc = items.some(it => it?.desc); descEl.style.display = d || anyDesc ? '' : 'none'; descEl.classList.toggle('keep', anyDesc);
        rows[sel]?.scrollIntoView({ block: 'nearest' });
      };
      const done = (v) => { off(); wrap.remove(); G.audio.sfx(v < 0 ? 'cancel' : 'ok'); res(v); };
      const off = G.input.on((k) => {
        if (k === 'up') { sel = (sel + items.length - 1) % items.length; G.audio.sfx('move'); update(); }
        if (k === 'down') { sel = (sel + 1) % items.length; G.audio.sfx('move'); update(); }
        if ((k === 'left' || k === 'right') && o.lr) { const r = o.lr(sel, k === 'left' ? -1 : 1); if (r === 'close') { off(); wrap.remove(); G.audio.sfx('move'); res(-2); return; } if (r) build(); else update(); }
        if (k === 'ok') { if (items[sel].disabled && !o.allowDisabled) { G.audio.sfx('error'); return; } done(sel); }
        if ((k === 'cancel' || k === 'menu') && o.cancel !== false) done(-1);
      });
      this.redraw = build;
      build();
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
      const save = async () => { if (G.canSave()) { G.save(); this.toast('已存檔'); G.audio.sfx('save'); } else this.toast('這裡無法存檔（請到存檔水晶旁）'); };
      const opts = [['狀態', () => this.statusHub()], ['迴響水晶', () => this.echoMenu()], ['能力配置', () => this.passiveMenu()], ['裝備', () => this.equipMenu()], ['魔法・戰技', () => this.magicMenu()], ['道具', () => this.itemMenu()],
        ['地圖', 'map'], ['自動練功', 'grind'], ['怪物圖鑑', () => this.bestiaryMenu()], ['委託任務', () => this.questMenu()], ['召喚獸', () => this.summonMenu()], ['隊伍編成', () => this.formationMenu()], ['戰術手冊', () => this.tacticsMenu()], ['存檔', save], ['設定', () => this.settingsMenu()], ['關閉選單', null]];
      const i = await this.choose(opts.map(([l]) => ({ label: l })), { title: `${G.mapName()}　<span class="gil">${S.gil} G</span>　<span class="tm">${fmtTime(S.time)}</span>`, info: this.partySummary(), start, cls: 'mainmenu' });
      start = Math.max(0, i);
      if (i < 0 || !opts[i][1]) break;
      const act = opts[i][1];
      if (typeof act === 'string') { this.hud(); return act; }
      try { await act(); } catch (e) { console.error(e); this.toast('這個畫面發生錯誤，已返回選單'); }
    }
    this.hud();
    if (this.G.field?.player && this.G.mode === 'field') this.G.field.setLeader(S.party[0]);
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
      <div class="st-eq">${EQUIP_SLOTS.map(sl => `<span><small>${SLOT_N[sl]}</small>${GEAR[h.equip[sl]]?.name || (sl === 'L' && GEAR[h.equip.R]?.hands === 2 ? '（雙手）' : '—')}</span>`).join('')}</div>
      <div class="st-fx">${fxText(gearFx(S, id)).join('、') || '裝備沒有特殊效果'}</div>
      <div>迴響 ${h.echo ? ECHOES[h.echo].name : '—'}</div>
      <div class="st-sk">技能：${sk.own.map(s => SKILLS[s].name).join('、')}${sk.echo.length ? '<br>迴響技能：' + sk.echo.map(s => SKILLS[s].name).join('、') : ''}</div>
      <div class="st-bio">${H.bio}</div></div></div>`;
  }
  async statusMenu() { const S = this.S; const list = [...S.party, ...S.reserve]; await this.choose(list.map(id => ({ label: HEROES[id].name, sub: 'Lv ' + S.heroes[id].lv, icon: portrait(id) })), { title: '隊伍狀態', info: (i) => this.statusHTML(list[i]) }); }

  // ---------------------------------------------------------------- the status hub: everything about one hero, and every setting for them
  fullStatusHTML(id) {
    const S = this.S, h = S.heroes[id], st = heroStats(S, id), H = HEROES[id], fx = gearFx(S, id);
    const sk = skillsOf(S, id), arts = artsOf(S, id), spells = spellsOf(S, id), hid = new Set(h.hide || []);
    const E = h.echo ? ECHOES[h.echo] : null, e = h.echo ? S.echoes[h.echo] : null;
    const pct = (v) => Math.round((v || 0) * 100) + '%';
    const derived = [['會心', pct(0.05 + (fx.crit || 0))], ['閃避', pct(fx.evade)], ['格擋', pct(fx.block)], ['反擊', pct(fx.counter)], ['連擊', pct(fx.dbl)], ['吸血', pct(fx.drain)]].filter(([, v], i) => i === 0 || v !== '0%');
    const res = Object.entries(fx.resist || {}).map(([k, v]) => `${ELEM[k] || k}${v < 0 ? '吸收' : v === 0 ? '無效' : '減半'}`);
    const wt = [...new Set(hands(S, id).map(x => x.type))].filter(t => WTYPES[t]);
    const sets = setBonus(EQUIP_SLOTS.map(sl => h.equip[sl]).filter(Boolean)).count;
    const chip = (s) => `<span class="${hid.has(s) ? 'lock' : ''}">${SKILLS[s].name}</span>`;
    return `<div class="st sth"><img class="st-big" src="${fullSprite(id, true)}"><div>
      <h3 style="color:${H.color}">${H.name} <small>${H.title}　Lv ${h.lv}</small></h3>
      <div class="sth-bar"><span>HP ${h.hp}/${st.hp}</span><span>MP ${h.mp}/${st.mp}</span><span>EXP ${h.exp}/${EXP_NEXT(h.lv)}</span><span>AP ${apUsed(S, id)}/${apCap(S, id)}</span><span>極限 ${h.limit || 0}%</span></div>
      <table class="sth-st"><tr><td>攻擊</td><td>${st.atk}</td><td>防禦</td><td>${st.def}</td><td>魔力</td><td>${st.mag}</td></tr><tr><td>精神</td><td>${st.spr}</td><td>速度</td><td>${st.spd}</td><td>${derived[0][0]}</td><td>${derived[0][1]}</td></tr></table>
      ${derived.length > 1 ? `<div class="tags">${derived.slice(1).map(([k, v]) => `<span>${k} ${v}</span>`).join('')}</div>` : ''}
      ${res.length ? `<div class="tags">抗性：${res.map(r => `<span>${r}</span>`).join('')}</div>` : ''}
      <div class="st-eq">${EQUIP_SLOTS.map(sl => `<span><small>${SLOT_N[sl]}</small>${GEAR[h.equip[sl]]?.name || (sl === 'L' && GEAR[h.equip.R]?.hands === 2 ? '（雙手）' : '—')}</span>`).join('')}</div>
      <div class="st-fx">${fxText(fx).join('、') || '裝備沒有特殊效果'}</div>
      ${Object.keys(sets).length ? `<div class="tags">套裝：${Object.entries(sets).map(([k, n]) => `<span class="${n >= 2 ? '' : 'lock'}">${SETS[k].name} ${n}/4</span>`).join('')}</div>` : ''}
      ${wt.map(t => `<div class="gi-trait">${ICON[t] || ''} ${WTYPES[t].n} 熟練 Lv${masteryLv(S, id, t)}/5：${WTYPES[t].trait}</div>`).join('')}
      <div>迴響：${E ? `<b style="color:${E.color}">${E.name}</b> ${'★'.repeat(e.star)} 羈絆${e.bond}　核心「${E.keyName}」` : '—'}</div>
      <div class="tags">被動：${(h.on || []).map(p => `<span>${PASSIVES[p].name}</span>`).join('') || '—'}</div>
      <div class="tags">技能：${[...sk.own, ...sk.echo].map(chip).join('') || '—'}</div>
      <div class="tags">戰技：${arts.map(chip).join('') || '—'}</div>
      <div class="tags">魔法：${spells.map(chip).join('') || '—'}</div>
      <small class="dim">灰色的招式在戰鬥選單中隱藏，自動戰鬥也不會使用</small>
      <div class="st-bio">${H.bio}</div></div></div>`;
  }
  async statusHub() {
    const S = this.S; let id = await this.heroPick('狀態：選擇角色', true); if (!id) return;
    let start = 0;
    for (;;) {
      const h = S.heroes[id], all = [...S.party, ...S.reserve], inParty = S.party.includes(id);
      const sk = skillsOf(S, id), arts = artsOf(S, id), spells = spellsOf(S, id), hid = new Set(h.hide || []);
      const shown = (l) => `${l.filter(s => !hid.has(s)).length}/${l.length}`;
      const rows = [
        ['裝備', `${EQUIP_SLOTS.filter(sl => h.equip[sl]).length} 件`, () => this.equipMenu(id)],
        ['⚙ 換上最強裝備', '自動', async () => { this.optimize(id); this.G.audio.sfx('item'); this.toast('已換上最強裝備'); }],
        ['迴響水晶', h.echo ? ECHOES[h.echo].short : '—', () => this.echoFor(id)],
        ['能力配置（被動）', `AP ${apUsed(S, id)}/${apCap(S, id)}`, () => this.passiveMenu(id)],
        ['魔法', shown(spells), () => this.skillToggle(id, 'magic')],
        ['戰技', shown(arts), () => this.skillToggle(id, 'arts')],
        ['技能・迴響技能', shown([...sk.own, ...sk.echo]), () => this.skillToggle(id, 'skill')],
        ['學習中的魔法・熟練度', '', () => this.magicMenu(id)],
        ['使用道具', '', () => this.itemMenu()],
        [inParty ? '移到待命' : '加入隊伍', inParty ? `第 ${S.party.indexOf(id) + 1} 位` : '待命', async () => {
          if (inParty) { if (S.party.length <= 1) { this.toast('隊伍至少要有一個人'); return; } S.party = S.party.filter(x => x !== id); S.reserve.unshift(id); }
          else { if (S.party.length >= 4) { this.toast('隊伍已滿（4人），先讓一個人待命'); return; } S.reserve = S.reserve.filter(x => x !== id); S.party.push(id); }
          this.G.field?.setLeader?.(S.party[0]); this.G.audio.sfx('item');
        }],
        ['設為隊長', S.party[0] === id ? '目前隊長' : '', async () => { if (!inParty) { this.toast('先加入隊伍'); return; } S.party = [id, ...S.party.filter(x => x !== id)]; this.G.field?.setLeader?.(id); this.G.audio.sfx('item'); }],
      ];
      const i = await this.choose(rows.map(([l, s]) => ({ label: l, sub: s })), { title: `狀態　${HEROES[id].name}　<small>◀ ▶ 換人</small>`, info: () => this.fullStatusHTML(id), start, cls: 'statushub', lr: (k, d) => { id = all[(all.indexOf(id) + d + all.length) % all.length]; start = k; return 'close'; } });
      if (i === -2) continue;
      if (i < 0) return;
      start = i;
      try { await rows[i][2](); } catch (err) { console.error(err); this.toast('這個畫面發生錯誤'); }
    }
  }
  // pick this hero's echo crystal from the ones owned, take it off, or raise its stars
  async echoFor(id) {
    const S = this.S;
    for (;;) {
      const h = S.heroes[id], list = ownedEchoes(S);
      const rows = [{ label: '（卸下迴響）', sub: '' }, ...list.map(e => { const who = Object.keys(S.heroes).find(x => S.heroes[x].echo === e); return { label: (h.echo === e ? '◆ ' : '') + ECHOES[e].short, sub: '★'.repeat(S.echoes[e].star) + ' 羈' + S.echoes[e].bond + (who && who !== id ? '　' + HEROES[who].name : ''), icon: portrait(ECHOES[e].look) }; })];
      const i = await this.choose(rows, { title: `${HEROES[id].name} 的迴響水晶　碎片 ×${S.items.shard || 0}`, info: (k) => k === 0 ? (h.echo ? this.echoHTML(h.echo) : '<p>沒有裝備迴響。</p>') : this.echoHTML(list[k - 1]), start: h.echo ? list.indexOf(h.echo) + 1 : 0 });
      if (i < 0) return;
      if (i === 0) { if (h.echo) { setEcho(S, id, null); this.toast('卸下了迴響'); } continue; }
      const eid = list[i - 1], e = S.echoes[eid], cost = STAR_COST[e.star + 1];
      const a = await this.choose([{ label: h.echo === eid ? '已裝備' : '裝備', disabled: h.echo === eid }, { label: e.star >= 3 ? '星級已滿' : `星級提升（碎片 ${cost}）`, disabled: e.star >= 3 || (S.items.shard || 0) < cost }], { title: ECHOES[eid].name, info: this.echoHTML(eid), cls: 'small' });
      if (a === 0) { setEcho(S, id, eid); this.G.audio.sfx('item'); this.toast(`${HEROES[id].name} 裝備了 ${ECHOES[eid].short}`); }
      if (a === 1 && starUp(S, eid)) { this.G.audio.sfx('levelup'); this.toast(`${ECHOES[eid].short} 提升到 ${'★'.repeat(S.echoes[eid].star)}！`); }
    }
  }
  // choose which magic, arts and skills show up in battle (hidden ones are also skipped by auto-battle)
  async skillToggle(id, kind) {
    const S = this.S; let start = 0;
    for (;;) {
      const h = S.heroes[id]; h.hide = h.hide || [];
      const sk = skillsOf(S, id);
      let list = kind === 'magic' ? spellsOf(S, id) : kind === 'arts' ? artsOf(S, id) : [...sk.own, ...sk.echo];
      if (kind === 'magic') list = list.sort((a, b) => Object.keys(SCHOOL_N).indexOf(SKILLS[a].school) - Object.keys(SCHOOL_N).indexOf(SKILLS[b].school) || SKILLS[a].tier - SKILLS[b].tier);
      const name = { magic: '魔法', arts: '戰技', skill: '技能' }[kind];
      if (!list.length) { await this.info(kind === 'arts' ? '<p>現在拿的武器還沒有學會戰技。</p><p>用同一種武器戰鬥會提升熟練度，每升一級學會一招。</p>' : kind === 'magic' ? '<p>還沒有魔法。</p><p>裝備帶 ✦ 的裝備、在戰鬥中累積 AP，或到魔法店學習。</p>' : '<p>還沒有技能。</p>', name); return; }
      const rows = [...list.map(s => { const D = SKILLS[s]; const off = h.hide.includes(s); return { label: (off ? '◇ ' : '◆ ') + D.name + (kind === 'magic' && !h.spells?.includes(s) ? ' ✦' : ''), sub: (kind === 'magic' ? SCHOOL_N[D.school] + '　' : '') + (D.mp ? 'MP ' + D.mp : ''), desc: D.desc + (off ? '　（隱藏中）' : '') + (kind === 'magic' && !h.spells?.includes(s) ? '　✦ 來自裝備，卸下就不能用' : '') }; }), { label: '全部顯示' }, { label: '全部隱藏' }];
      const i = await this.choose(rows, { title: `${HEROES[id].name} 的${name}　◆ 顯示　◇ 隱藏`, cls: 'items', start, info: (k) => k < list.length ? `<div class="gi"><h4>${SKILLS[list[k]].name}</h4><div>${SKILLS[list[k]].desc}</div>${SKILLS[list[k]].mp ? `<div>MP ${SKILLS[list[k]].mp}</div>` : ''}<p class="dim">按確定切換「顯示／隱藏」。隱藏的招式不會出現在戰鬥選單，自動戰鬥和自動練功也不會使用。</p></div>` : '<p>一次切換這個分類的全部招式。</p>' });
      if (i < 0) return;
      start = i;
      if (i === list.length) h.hide = h.hide.filter(s => !list.includes(s));
      else if (i === list.length + 1) h.hide = [...new Set([...h.hide, ...list])];
      else { const s = list[i]; h.hide = h.hide.includes(s) ? h.hide.filter(x => x !== s) : [...h.hide, s]; }
      this.G.audio.sfx('move');
    }
  }

  echoHTML(eid) {
    const S = this.S, E = ECHOES[eid], e = S.echoes[eid];
    const pairs = PAIRS.filter(p => p[0] === eid || p[1] === eid).map(p => { const o = p[0] === eid ? p[1] : p[0], on = S.party.some(x => S.heroes[x].echo === eid) && S.party.some(x => S.heroes[x].echo === o); return `<span class="${on ? '' : 'lock'}">${p[3]}<small>＋${S.echoes[o] ? ECHOES[o].short : '？？？'}：${p[4]}</small></span>`; }).join('');
    if (!e) return `<div class="st"><h3>？？？　<small>${E.role}</small></h3><div>尚未取得。</div><div class="gi-trait">取得方法：${huntText(E)}</div><div class="gi-kind">核心能力：「${E.keyName}」${E.keyDesc}</div></div>`;
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
      <div class="gi-trait">核心「${E.keyName}」：${E.keyDesc}</div>
      <div>共鳴：<b>${R.name}</b>　${R.desc}</div>
      ${pairs ? `<div class="tags">連攜：${pairs}</div>` : ''}
      <div class="st-bio">${E.lore.join('')}</div></div></div>`;
  }
  async echoMenu() {
    const S = this.S;
    for (;;) {
      const list = ECHO_ORDER;
      const i = await this.choose(list.map(e => ({ label: S.echoes[e] ? ECHOES[e].short : '？？？', sub: S.echoes[e] ? '★'.repeat(S.echoes[e].star) + ' 羈' + S.echoes[e].bond : ECHOES[e].role, icon: S.echoes[e] ? portrait(ECHOES[e].look) : '', disabled: !S.echoes[e] })), { title: `迴響水晶 ${list.filter(e => S.echoes[e]).length}/${list.length}　迴響碎片 ×${S.items.shard || 0}`, info: (i) => this.echoHTML(list[i]), allowDisabled: false });
      if (i < 0) return;
      const eid = list[i], e = S.echoes[eid];
      const cost = STAR_COST[e.star + 1];
      const a = await this.choose([{ label: '讓隊員裝備' }, { label: e.star >= 3 ? '星級已滿' : `星級提升（碎片 ${cost}）`, disabled: e.star >= 3 || (S.items.shard || 0) < cost }], { title: ECHOES[eid].name, info: this.echoHTML(eid) });
      if (a === 0) { const h = await this.heroPick('誰要裝備「' + ECHOES[eid].short + '」？', true); if (h) { setEcho(S, h, eid); this.toast(`${HEROES[h].name} 裝備了 ${ECHOES[eid].short}`); } }
      if (a === 1) { if (starUp(S, eid)) { this.G.audio.sfx('levelup'); this.toast(`${ECHOES[eid].short} 提升到 ${'★'.repeat(S.echoes[eid].star)}！`); } }
    }
  }
  async passiveMenu(pre) {
    const S = this.S; const id = pre || await this.heroPick('能力配置', true); if (!id) return;
    for (;;) {
      const h = S.heroes[id]; const L = h.learned;
      if (!L.length) { await this.info('<p>還沒有學會任何被動能力。</p><p>裝備迴響並在戰鬥中提升羈絆，就能學會。學會的能力換了迴響也能繼續裝備。</p>', HEROES[id].name); return; }
      const i = await this.choose(L.map(p => ({ label: (h.on.includes(p) ? '◆ ' : '◇ ') + PASSIVES[p].name, sub: 'AP ' + PASSIVES[p].ap, desc: PASSIVES[p].desc })), { title: `${HEROES[id].name}　AP ${apUsed(S, id)}/${apCap(S, id)}` });
      if (i < 0) return;
      if (!togglePassive(S, id, L[i])) { this.G.audio.sfx('error'); this.toast('AP 不足'); }
    }
  }
  gearLine(g) {
    if (!g) return ''; const G = GEAR[g]; if (!G) return '';
    const st = ['atk', 'def', 'mag', 'spr', 'spd', 'hp', 'mp'].filter(k => G[k]).map(k => ({ atk: '攻', def: '防', mag: '魔', spr: '精', spd: '速', hp: 'HP', mp: 'MP' })[k] + (G[k] > 0 ? '+' : '') + G[k]).join(' ');
    const f = fxText(G.fx); return st + (f.length ? '　' + f.slice(0, 2).join('、') : '');
  }
  gearKind(G) { return G.slot === 'hand' ? (G.type === 'shield' ? '盾' : (WTYPES[G.type]?.n || WPN[G.type]) + (G.hands === 2 ? '・雙手' : '')) : G.slot === 'acc' ? '飾品' : `${STYLE_N[G.style] || ''}・${SLOT_N[G.slot] || ''}`; }
  gearHTML(g, id) {
    const G = GEAR[g]; if (!G) return '';
    const W = G.slot === 'hand' && G.type !== 'shield' ? WTYPES[G.type] : null;
    const f = fxText(G.fx);
    const h = id ? this.S.heroes[id] : null;
    const teach = G.teach ? `<div class="gi-teach">✦ 可學會：<b>${SKILLS[G.teach].name}</b>（${SCHOOL_N[SKILLS[G.teach].school]}）${h ? (h.spells?.includes(G.teach) ? '　已學會' : `　AP ${h.ap?.[G.teach] || 0}/${G.ap}`) : `　需要 AP ${G.ap}`}<br><small>${SKILLS[G.teach].desc}</small></div>` : '';
    const pic = itemIcon(g, true);
    return `<div class="gi">${pic ? `<img class="gi-pic" src="${pic}">` : ''}<h4>${G.name}</h4><div class="gi-kind">${this.gearKind(G)}${G.tier != null ? `　${TIER_N[G.tier]}階` : ''}${G.refine ? `　強化+${G.refine}` : ''}</div>
      <div>${this.gearLine(g).split('　')[0] || ''}</div>
      ${W ? `<div class="gi-trait">${W.trait}</div>` : ''}${G.type === 'shield' ? `<div class="gi-trait">盾：被物理攻擊時有機會完全格擋</div>` : ''}
      ${f.length ? `<div class="gi-fx">${f.map(x => `<span>${x}</span>`).join('')}</div>` : ''}${G.desc && !G.set ? `<div>${G.desc}</div>` : ''}${G.set ? this.setHTML(G.set, id) : ''}${teach}</div>`;
  }
  setHTML(sid, id) {
    const D = SETS[sid], have = id ? setBonus(EQUIP_SLOTS.map(sl => this.S.heroes[id].equip[sl]).filter(Boolean)).count[sid] || 0 : 0;
    return `<div class="gi-teach">〔${D.name}〕套裝 ${have}/4<br><span style="opacity:${have >= 2 ? 1 : 0.5}">2件：${D.d2}</span><br><span style="opacity:${have >= 4 ? 1 : 0.5}">4件：${D.d4}</span><br><small>${D.pieces.map(p => p[1]).join('、')}</small></div>`;
  }
  // try on a piece without keeping it, to compare stats
  tryOn(id, slot, g) {
    const S = this.S, h = S.heroes[id], old = { ...h.equip };
    h.equip[slot] = g; const G = GEAR[g]; const other = slot === 'R' ? 'L' : slot === 'L' ? 'R' : null;
    if (other && G && (G.hands === 2 || GEAR[old[other]]?.hands === 2)) h.equip[other] = null;
    const st = heroStats(S, id); h.equip = old; return st;
  }
  async equipMenu(pre) {
    const S = this.S; let id = pre || await this.heroPick('裝備', true); if (!id) return;
    let start = 0;
    for (;;) {
      const h = S.heroes[id];
      const rows = EQUIP_SLOTS.map(sl => ({ label: SLOT_N[sl], sub: GEAR[h.equip[sl]]?.name || (sl === 'L' && GEAR[h.equip.R]?.hands === 2 ? '（雙手武器）' : '—') }));
      rows.push({ label: '⚙ 最強裝備', sub: '自動挑選' }, { label: '全部卸下', sub: '' }, { label: '換人', sub: '◀ ▶' });
      const i = await this.choose(rows, { title: HEROES[id].name + '　裝備', info: (k) => k < EQUIP_SLOTS.length && h.equip[EQUIP_SLOTS[k]] ? this.gearHTML(h.equip[EQUIP_SLOTS[k]], id) : this.statusHTML(id), start, lr: (k, d) => { const all = [...S.party, ...S.reserve]; id = all[(all.indexOf(id) + d + all.length) % all.length]; start = k; return 'close'; } });
      if (i === -2) continue;
      if (i < 0) return;
      start = i;
      if (i === EQUIP_SLOTS.length) { this.optimize(id); this.G.audio.sfx('item'); this.toast('已換上最強裝備'); continue; }
      if (i === EQUIP_SLOTS.length + 1) { for (const sl of EQUIP_SLOTS) if (h.equip[sl] && !(sl === 'R' && !GEAR[h.equip.R]?.type)) equip(S, id, sl, null); this.G.audio.sfx('item'); continue; }
      if (i === EQUIP_SLOTS.length + 2) { const all = [...S.party, ...S.reserve]; id = all[(all.indexOf(id) + 1) % all.length]; continue; }
      const slot = EQUIP_SLOTS[i];
      const opts = Object.keys(S.items).filter(g => S.items[g] > 0 && GEAR[g] && slotFits(slot, g) && canEquip(id, g)).sort((a, b) => (GEAR[b].tier || 0) - (GEAR[a].tier || 0) || (GEAR[b].price || 0) - (GEAR[a].price || 0));
      if (!opts.length && !h.equip[slot]) { this.toast(`沒有${HEROES[id].name}能裝在「${SLOT_N[slot]}」的東西`); continue; }
      const j = await this.choose([{ label: '（卸下）' }, ...opts.map(g => ({ icon: itemIcon(g), label: GEAR[g].name + (GEAR[g].teach && !h.spells?.includes(GEAR[g].teach) ? ' ✦' : ''), sub: this.gearKind(GEAR[g]) + ' ×' + S.items[g] }))], { title: SLOT_N[slot], info: (k) => k === 0 ? this.compareWith(id, slot, null) : this.compareWith(id, slot, opts[k - 1]) + this.gearHTML(opts[k - 1], id) });
      if (j < 0) continue;
      equip(S, id, slot, j === 0 ? null : opts[j - 1]); this.G.audio.sfx('item');
    }
  }
  // pick the strongest piece for every slot (weapons by power, armor by defence + spirit)
  optimize(id) {
    const S = this.S, h = S.heroes[id];
    const score = (g, sl) => { const G = GEAR[g]; if (!G) return -1; const main = Math.max(HEROES[id].base.atk, HEROES[id].base.mag) === HEROES[id].base.mag ? 'mag' : 'atk'; return sl === 'R' ? (G[main] || 0) * 2 + (G.atk || 0) + (G.mag || 0) + fxText(G.fx).length * 3 : (G.def || 0) + (G.spr || 0) + (G.hp || 0) / 10 + (G.mp || 0) / 5 + (G.atk || 0) + (G.mag || 0) + (G.spd || 0) * 2 + fxText(G.fx).length * 4 + (G.fx?.block || 0) * 40; };
    for (const sl of EQUIP_SLOTS) {
      if (sl === 'L' && GEAR[h.equip.R]?.hands === 2) continue;
      const cur = h.equip[sl];
      const pool = Object.keys(S.items).filter(g => S.items[g] > 0 && GEAR[g] && slotFits(sl, g) && canEquip(id, g) && (sl !== 'R' || GEAR[g].type !== 'shield') && (sl !== 'L' || GEAR[g].type === 'shield'));
      let best = cur, bs = score(cur, sl);
      for (const g of pool) { const v = score(g, sl); if (v > bs) { bs = v; best = g; } }
      if (best !== cur) equip(S, id, sl, best);
    }
  }
  // the paper doll wearing a piece (or nothing in that slot), without keeping it
  tryOnLook(id, slot, g) {
    const h = this.S.heroes[id], eq = { ...h.equip }; eq[slot] = g; const G = GEAR[g]; const other = slot === 'R' ? 'L' : slot === 'L' ? 'R' : null;
    if (other && G && (G.hands === 2 || GEAR[eq[other]]?.hands === 2)) eq[other] = null;
    return paperLook(this.S, id, eq);
  }
  compareWith(id, slot, g) {
    const before = heroStats(this.S, id), after = this.tryOn(id, slot, g);
    const now = fullSprite(paperLook(this.S, id)), next = fullSprite(this.tryOnLook(id, slot, g));
    return `<div class="pd-row"><figure><img src="${now}"><figcaption>現在</figcaption></figure><span>▶</span><figure><img src="${next}"><figcaption>試穿</figcaption></figure></div><div class="cmp">${['hp', 'mp', 'atk', 'def', 'mag', 'spr', 'spd'].map(k => { const d = after[k] - before[k]; return `<div><span>${({ hp: 'HP', mp: 'MP', atk: '攻擊', def: '防禦', mag: '魔力', spr: '精神', spd: '速度' })[k]}</span><b>${before[k]}</b>→<b class="${d > 0 ? 'up' : d < 0 ? 'dn' : ''}">${after[k]}</b></div>`; }).join('')}</div>`;
  }
  compare(id, slot, g) { return this.compareWith(id, slot, g); }
  async magicMenu(pre) {
    const S = this.S; let id = pre || await this.heroPick('魔法・戰技', true); if (!id) return;
    for (;;) {
      const h = S.heroes[id];
      const i = await this.choose([{ label: '魔法一覽', sub: spellsOf(S, id).length + '' }, { label: '學習中的魔法', sub: Object.keys(h.ap || {}).length + '' }, { label: '武器熟練度', sub: '' }], { title: HEROES[id].name + '　魔法・戰技', info: '<p>魔法可以從三個地方學會：</p><p>✦ 裝備上帶有魔法的武器或防具，戰鬥勝利會得到 AP，存滿就永久學會。</p><p>✦ 城鎮的魔法店花錢學習。</p><p>✦ 裝備的期間就能先用。</p><p>戰技：用某種武器戰鬥會提升熟練度，學會那種武器的戰技。</p>' });
      if (i < 0) return;
      if (i === 0) {
        const list = spellsOf(S, id).sort((a, b) => Object.keys(SCHOOL_N).indexOf(SKILLS[a].school) - Object.keys(SCHOOL_N).indexOf(SKILLS[b].school) || SKILLS[a].tier - SKILLS[b].tier);
        if (!list.length) { this.toast('還沒有學會魔法'); continue; }
        await this.choose(list.map(s => ({ label: SKILLS[s].name + (h.spells?.includes(s) ? '' : ' ✦'), sub: `${SCHOOL_N[SKILLS[s].school]}　MP ${SKILLS[s].mp}`, desc: SKILLS[s].desc + (h.spells?.includes(s) ? '' : '　（✦ 裝備中才能用）') })), { title: `${HEROES[id].name} 的魔法（${list.length}）`, cls: 'items' });
      }
      if (i === 1) {
        const pend = EQUIP_SLOTS.map(sl => GEAR[h.equip[sl]]).filter(g => g?.teach && !h.spells?.includes(g.teach));
        if (!pend.length) { await this.info('<p>目前的裝備沒有可以學的魔法。</p><p>名字前面有特殊字的裝備（例如「炎之」「再生」）通常帶有魔法，裝備清單裡標有 ✦。</p>', '學習中'); continue; }
        await this.choose(pend.map(g => ({ label: SKILLS[g.teach].name, sub: `AP ${h.ap?.[g.teach] || 0}/${g.ap}`, desc: `來自：${g.name}　${SKILLS[g.teach].desc}` })), { title: '學習中的魔法', cls: 'items' });
      }
      if (i === 2) {
        const types = [...new Set([...APT[id].w, ...(APT[id].shield ? ['shield'] : [])])];
        await this.choose(types.map(t => { const lv = masteryLv(S, id, t), p = h.mastery?.[t] || 0; return { label: `${ICON[t] || ''} ${WPN[t]}`, sub: `Lv ${lv}/5`, desc: `熟練度 ${p}${lv < 5 ? `／下一級 ${MASTERY_AT[lv]}` : '（已滿）'}　戰技：${(ARTS_BY_TYPE[t] || []).map((a, k) => (k < lv ? '' : '🔒') + SKILLS[a].name).join('、')}` }; }), { title: `${HEROES[id].name} 的武器熟練度`, info: (k) => `<div class="gi"><h4>${WPN[types[k]]}</h4>${WTYPES[types[k]] ? `<div class="gi-trait">${WTYPES[types[k]].trait}</div>` : '<div class="gi-trait">盾：被物理攻擊時有機會完全格擋</div>'}${(ARTS_BY_TYPE[types[k]] || []).map((a, n) => `<div class="${n < masteryLv(S, id, types[k]) ? '' : 'dim'}">${n < masteryLv(S, id, types[k]) ? '◆' : '🔒'} <b>${SKILLS[a].name}</b>　${SKILLS[a].desc}</div>`).join('')}</div>` });
      }
    }
  }
  async itemMenu() {
    const S = this.S;
    for (;;) {
      const own = Object.keys(S.items).filter(i => S.items[i] > 0);
      if (!own.length) { this.toast('沒有道具'); return; }
      const gearN = own.filter(i => GEAR[i]).length;
      const cats = Object.keys(ITEM_CATS).filter(c => own.some(i => ITEMS[i]?.cat === c));
      const rows = [...cats.map(c => ({ label: ITEM_CATS[c], sub: own.filter(i => ITEMS[i]?.cat === c).length + '' })), ...(gearN ? [{ label: '裝備品', sub: gearN + '' }] : [])];
      const c = await this.choose(rows, { title: `道具　<span class="gil">${S.gil} G</span>`, cls: 'small' });
      if (c < 0) return;
      for (;;) {
        const list = c < cats.length ? Object.keys(S.items).filter(i => S.items[i] > 0 && ITEMS[i]?.cat === cats[c]) : Object.keys(S.items).filter(i => S.items[i] > 0 && GEAR[i]).sort((a, b) => (GEAR[b].tier || 0) - (GEAR[a].tier || 0));
        if (!list.length) break;
        const i = await this.choose(list.map(it => ({ label: itemName(it), sub: '×' + S.items[it], desc: ITEMS[it]?.desc || (GEAR[it] ? this.gearKind(GEAR[it]) + '　' + this.gearLine(it) : '') })), { title: rows[c].label, cls: 'items', info: (k) => GEAR[list[k]] ? this.gearHTML(list[k]) : '' });
        if (i < 0) break;
        await this.useFieldItem(list[i]);
      }
    }
  }
  async useFieldItem(id) {
    const S = this.S, I = ITEMS[id];
    if (!I || !I.use || I.use.dmg || I.use.escape || I.use.status && !I.use.self || I.use.analyze || I.use.cast || I.use.buff || I.use.evadeT) { if (I?.use) this.toast('戰鬥中才能使用'); return; }
    const spend = () => { S.items[id]--; if (!S.items[id]) delete S.items[id]; this.hud(); };
    if (I.use.tent) { if (!this.G.nearSave()) { this.toast('要在存檔水晶旁使用'); return; } spend(); const { healAll } = await import('./party.js?v=17'); healAll(S); this.G.audio.sfx('heal'); this.toast('全員完全回復了！'); return; }
    if (I.use.meal) { S.meal = { fx: I.use.meal, n: 5, name: I.name }; spend(); this.G.audio.sfx('heal'); this.toast(`吃了${I.name}！之後5場戰鬥都有效果`); return; }
    if (I.use.repel) { S.repel = I.use.repel; S.lure = 0; spend(); this.G.audio.sfx('item'); this.toast('敵人不會靠近了'); return; }
    if (I.use.lure) { S.lure = I.use.lure; S.repel = 0; spend(); this.G.audio.sfx('item'); this.toast('敵人更容易出現了'); return; }
    if (I.use.warpWorld) { if (this.G.field.world || this.G.field.def.town || !S.lastWorld) { this.toast('這裡不能使用'); return; } spend(); this.G.audio.sfx('flee'); await this.G.warp('world', S.lastWorld.x, S.lastWorld.z, 'down'); return; }
    const targets = I.tgt === 'allies' ? S.party : [await this.heroPick(I.name + ' 給誰用？', true)];
    if (!targets[0]) return;
    let used = false;
    for (const t of targets) {
      const h = S.heroes[t], st = heroStats(S, t);
      if (I.use.grow) { for (const k in I.use.grow) h.grow[k] = (h.grow[k] || 0) + I.use.grow[k]; used = true; this.toast(`${HEROES[t].name} 的能力永久提升了！`); continue; }
      if (I.use.revive) { if (h.hp <= 0) { h.hp = Math.round(st.hp * I.use.revive); used = true; } continue; }
      if (h.hp <= 0) continue;
      if (I.use.heal && h.hp < st.hp) { h.hp = Math.min(st.hp, h.hp + I.use.heal); used = true; }
      if (I.use.mp && h.mp < st.mp) { h.mp = Math.min(st.mp, h.mp + I.use.mp); used = true; }
      if (I.use.cure || I.use.cureOnly) used = true;
    }
    if (used) { spend(); this.G.audio.sfx('heal'); } else this.G.audio.sfx('error');
  }
  // set up auto-grinding: when to stop, whether to use potions, battle speed
  async grindMenu() {
    const S = this.S; const c = S.settings.grind = { ...GRIND_DEFAULT, ...(S.settings.grind || {}) }; this._again = false;
    const lab = (k) => (GRIND_OPTS[k].find(o => o[0] === c[k]) || GRIND_OPTS[k][0])[1];
    const cyc = (k, d) => { const L = GRIND_OPTS[k]; let i = Math.max(0, L.findIndex(o => o[0] === c[k])); c[k] = L[(i + d + L.length) % L.length][0]; };
    const adj = (k, d) => { if (k === 1) cyc('hp', d); if (k === 2) cyc('battles', d); if (k === 3) cyc('lvUp', d); if (k === 4) c.heal = !c.heal; if (k === 5) c.ether = !c.ether; if (k === 6) c.speed = c.speed === 2 ? 1 : 2; };
    const pots = Object.keys(S.items).filter(i => ITEMS[i]?.use?.heal && !ITEMS[i].use.revive).reduce((n, i) => n + S.items[i], 0);
    let start = 0;
    for (;;) {
      const items = [
        { label: '▶ 開始', desc: '主角會在附近自己走動，遇到敵人就自動戰鬥。點畫面上方的橫幅、按任何方向鍵或確定鍵就會停止。' },
        { label: '停止條件：隊員HP', sub: lab('hp'), desc: '戰鬥結束後（用過回復藥）還是有人低於這個HP就停下來' },
        { label: '停止條件：場數', sub: lab('battles') },
        { label: '停止條件：等級', sub: lab('lvUp'), desc: '任何一名隊員提升到這麼多級就停下來' },
        { label: '戰鬥後自動用回復藥', sub: c.heal ? `開（${pots}個）` : '關', desc: '從效果最小的開始用，也會用鳳凰之羽復活倒下的隊員' },
        { label: 'MP不足時用魔力水', sub: c.ether ? '開' : '關' },
        { label: '戰鬥速度', sub: '×' + c.speed },
      ];
      const i = await this.choose(items, { title: '自動練功（左右鍵調整）', cls: 'grindmenu', start, still: this._again, lr: (k, d) => { adj(k, d); start = k; return 'close'; } });
      this._again = i === -2 || i > 0;
      if (i === -2) continue;
      if (i < 0) return null;
      if (i === 0) return c;
      adj(i, 1); start = i;
    }
  }
  async tacticsMenu() {
    const S = this.S;
    const tr = (k) => TRAIT_N[k] ? `<div class="gi-trait">${TRAIT_N[k][0]} <b>${TRAIT_N[k][1]}</b>：${TRAIT_N[k][2]}</div>` : '';
    const pages = [
      ['元素狀態', `<div class="gi"><h4>屬性會留在敵人身上</h4>${Object.entries(STATE_N).map(([k, [ic, n]]) => `<div>${ic} <b>${n}</b>：${STATE_DESC[k]}</div>`).join('')}<p class="gi-kind">先用一種屬性「上狀態」，再用另一種屬性「引爆」。出手順序和隊伍搭配，比單純的傷害數字更重要。</p></div>`],
      ['元素反應', `<div class="gi"><h4>元素反應</h4>${REACTIONS.map(([n, how, fx]) => `<div class="gi-trait"><b>${n}</b>　${how}</div><div style="margin:0 0 6px 1em">${fx}</div>`).join('')}<p class="gi-kind">例：瀾的「浸透」讓全體濕潤 → 霆的雷屬性箭引發感電並連鎖；或霜華先凍結，再用戰鎚粉碎。</p></div>`],
      ['怪物特性', `<div class="gi"><h4>每種特性都要用不同的方法對付</h4>${['fly', 'armor', 'evade', ...Object.keys(TRAIT_N).filter(k => !['fly', 'armor', 'evade'].includes(k))].map(tr).join('')}</div>`],
      ['迴響核心', `<div class="gi"><h4>每個迴響都有一個改變規則的核心能力</h4>${ECHO_ORDER.map(e => `<div class="gi-trait">${S.echoes[e] ? ECHOES[e].short : '？？？'}「${ECHOES[e].keyName}」</div><div style="margin:0 0 6px 1em">${ECHOES[e].keyDesc}</div>`).join('')}</div>`],
      ['迴響連攜', `<div class="gi"><h4>兩個迴響在同一隊時觸發</h4>${PAIRS.map(([a, b, , n, d]) => `<div class="gi-trait"><b>${n}</b>　${S.echoes[a] ? ECHOES[a].short : '？'} ＋ ${S.echoes[b] ? ECHOES[b].short : '？'}</div><div style="margin:0 0 6px 1em">${d}</div>`).join('')}</div>`],
      ['套裝', `<div class="gi"><h4>同一套裝備穿越多件效果越強</h4>${Object.values(SETS).map(D => `<div class="gi-trait"><b>〔${D.name}〕</b>　${D.pieces.map(p => p[1]).join('、')}</div><div style="margin:0 0 6px 1em">2件：${D.d2}<br>4件：${D.d4}<br><small class="gi-kind">掉落：${D.fams.map(f => FAM_N[f]).join('、')}系的怪物</small></div>`).join('')}</div>`],
    ];
    await this.choose(pages.map(p => ({ label: p[0] })), { title: '戰術手冊', cls: 'items', info: (i) => pages[i][1] });
  }
  async bestiaryMenu() {
    const S = this.S, kills = S.kills || {}, seen = S.dropSeen || {};
    const list = Object.keys(ENEMIES).filter(id => !id.endsWith('_trial')).sort((a, b) => ENEMIES[a].lv - ENEMIES[b].lv);
    const met = list.filter(id => kills[id] || S.flags['seen_' + id]).length;
    const pic = (id) => { try { const E = ENEMIES[id]; return monsterPx(E.kind, E.colors).canvas(3).toDataURL(); } catch (e) { return ''; } };
    await this.choose(list.map((id, n) => { const k = kills[id] || 0, E = ENEMIES[id]; return { label: k || S.flags['seen_' + id] ? E.name : '？？？', sub: `Lv ${E.lv}${k ? '　' + k : ''}` }; }), {
      title: `怪物圖鑑　${met}/${list.length}`, cls: 'items', info: (n) => {
        const id = list[n], E = ENEMIES[id], k = kills[id] || 0;
        if (!k && !S.flags['seen_' + id]) return '<div class="gi"><h4>？？？</h4><p>還沒有遇過。</p></div>';
        const rev = new Set(S.flags['seen_' + id] || []); const weak = k >= 3 ? E.weak : E.weak.filter(w => rev.has(w));
        return `<div class="gi bst"><img src="${pic(id)}"><h4>${E.name}${E.boss ? '　〔頭目〕' : ''}</h4><div class="gi-kind">Lv ${E.lv}　${FAM_N[E.fam] || ''}系　HP ${Math.round(E.hp * balanceFor(id, E, S.settings.diff)[0])}　打倒 ${k} 隻</div>
          <div>${E.traits.map(t => TRAIT_N[t] ? `<div class="gi-trait">${TRAIT_N[t][0]} ${TRAIT_N[t][1]}：${TRAIT_N[t][2]}</div>` : '').join('')}</div>
          <div>弱點：${weak.map(w => ICON[w] || w).join(' ') || '？'}${E.weak.length > weak.length ? ' ？' : ''}　${E.resist?.length ? '抗性：' + E.resist.map(w => ICON[w] || w).join(' ') : ''}</div>
          <div class="bst-drops">${(E.drops || []).map(([d, ch], s) => `<div><small>${DROP_N[s]}</small>${k ? (seen[id + ':' + s] ? '✓ ' : '') + itemName(d) : '？？？'}${k ? `<em>${ch >= 1 ? '必定' : Math.round(ch * 1000) / 10 + '%'}</em>` : ''}</div>`).join('')}</div>
          ${E.hab ? `<div class="gi-kind">出沒：${E.hab.map(h => ({ field: '草原', forest: '森林', mountain: '山地', cave: '洞窟', coast: '海邊', temple: '神殿', sky: '天空', void: '虛空', snow: '雪原' })[h]).join('、')}</div>` : ''}
          ${k < 3 && E.weak.length > weak.length ? '<div class="gi-kind">打倒3隻就會記住全部弱點</div>' : ''}</div>`;
      } });
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
    const S = this.S, st = S.settings; this._again = false;
    for (;;) {
      const i = await this.choose([
        { label: '音樂音量', sub: '▮'.repeat(Math.round(st.music * 10)) + '▯'.repeat(10 - Math.round(st.music * 10)) },
        { label: '音效音量', sub: '▮'.repeat(Math.round(st.sfx * 10)) + '▯'.repeat(10 - Math.round(st.sfx * 10)) },
        { label: '畫質', sub: ['流暢', '標準', '精美'][st.quality] },
        { label: '像素風格', sub: ['細緻', '標準', '復古', '關閉'][st.pixel ?? 0] },
        { label: '角色風格', sub: (st.depth ?? 0) === 0 ? '立體書' : st.depth < 0.8 ? '薄' : '標準' },
        { label: '戰鬥速度', sub: '×' + (st.speed || 1) },
        { label: '文字速度', sub: (st.textSpeed || 28) <= 12 ? '快' : (st.textSpeed || 28) >= 40 ? '慢' : '普通' },
        { label: '遇敵', sub: this.G.encMul === 0.5 ? '較少' : '普通' },
        { label: '小地圖', sub: st.minimap === false ? '關' : '開' },
        { label: '難度', sub: DIFF[st.diff || 'normal'].name, desc: '輕鬆：敵人較弱，適合想看故事的人／普通：要想策略／困難：給熟練的玩家' },
      ], { title: '設定（左右鍵調整，或點兩下）', start: this._setStart || 0, still: this._again, lr: (k, d) => { this.adjust(k, d); this.G.applySettings(); this._setStart = k; return 'close'; } });
      this._again = i >= 0 || i === -2;
      if (i === -2) continue;
      if (i < 0) { this._again = false; this.G.applySettings(); return; }
      this._setStart = i; this.adjust(i, 1); this.G.applySettings();
    }
  }
  adjust(i, d) {
    const st = this.S.settings;
    if (i === 0) st.music = Math.max(0, Math.min(1, Math.round((st.music + d * 0.1) * 10) / 10));
    if (i === 1) st.sfx = Math.max(0, Math.min(1, Math.round((st.sfx + d * 0.1) * 10) / 10));
    if (i === 2) st.quality = (st.quality + (d > 0 ? 1 : 2)) % 3;
    if (i === 3) st.pixel = ((st.pixel ?? 0) + (d > 0 ? 1 : 3)) % 4;
    if (i === 4) { const v = st.depth ?? 0; st.depth = v === 0 ? 0.6 : v < 0.8 ? 1 : 0; }
    if (i === 5) st.speed = st.speed === 2 ? 1 : 2;
    if (i === 6) st.textSpeed = (st.textSpeed || 28) === 28 ? 10 : (st.textSpeed || 28) === 10 ? 45 : 28;
    if (i === 7) { this.G.encMul = this.G.encMul === 0.5 ? 1 : 0.5; st.enc = this.G.encMul; }
    if (i === 8) st.minimap = st.minimap === false;
    if (i === 9) { const o = DIFF_ORDER; st.diff = o[(o.indexOf(st.diff || 'normal') + (d > 0 ? 1 : o.length - 1)) % o.length]; this.toast(`難度：${DIFF[st.diff].name}（下一場戰鬥開始生效）`); }
    this.G.applySettings();
  }

  // ---------------------------------------------------------------- shops and inns
  async shop(list, title = '商店') {
    const S = this.S;
    const groupOf = (id) => ITEMS[id] ? ITEM_CATS[ITEMS[id].cat] || '道具' : GEAR[id].slot === 'hand' ? (GEAR[id].type === 'shield' ? '盾' : '武器・' + (WTYPES[GEAR[id].type]?.n || '')) : GEAR[id].slot === 'acc' ? '飾品' : SLOT_N[GEAR[id].slot] + '（' + (STYLE_N[GEAR[id].style] || '') + '）';
    for (;;) {
      const m = await this.choose(['購買', '出售'], { title: `${title}　<span class="gil">${S.gil} G</span>`, cls: 'small' });
      if (m < 0) return;
      if (m === 0) {
        const groups = [...new Set(list.map(groupOf))];
        for (;;) {
          let sub = list;
          if (list.length > 14 && groups.length > 1) {
            const gsel = await this.choose(groups.map(g => ({ label: g, sub: list.filter(id => groupOf(id) === g).length + '' })), { title: `購買　<span class="gil">${S.gil} G</span>`, cls: 'small' });
            if (gsel < 0) break;
            sub = list.filter(id => groupOf(id) === groups[gsel]);
          }
          for (;;) {
            const i = await this.choose(sub.map(id => { const it = ITEMS[id] || GEAR[id]; return { icon: GEAR[id] ? itemIcon(id) : undefined, label: it.name + (GEAR[id]?.teach ? ' ✦' : ''), sub: it.price + ' G' + (S.items[id] ? `　持有${S.items[id]}` : ''), disabled: S.gil < it.price, desc: ITEMS[id]?.desc || this.gearKind(GEAR[id]) + '　' + this.gearLine(id) }; }), { title: `購買　<span class="gil">${S.gil} G</span>`, info: (i) => GEAR[sub[i]] ? this.gearHTML(sub[i]) + this.whoCan(sub[i]) : '' });
            if (i < 0) break;
            const id = sub[i], it = ITEMS[id] || GEAR[id];
            const n = await this.choose([1, 3, 5, 10].map(k => ({ label: `${k} 個`, sub: it.price * k + ' G', disabled: S.gil < it.price * k })), { title: it.name, cls: 'small' });
            if (n < 0) continue;
            const k = [1, 3, 5, 10][n]; S.gil -= it.price * k; addItem(S, id, k); this.G.audio.sfx('item'); this.toast(`買了 ${it.name} ×${k}`);
          }
          if (!(list.length > 14 && groups.length > 1)) break;
        }
      } else {
        for (;;) {
          const own = Object.keys(S.items).filter(id => S.items[id] > 0 && ((ITEMS[id] && (ITEMS[id].price || ITEMS[id].sell) && !ITEMS[id].key && id !== 'shard' && id !== 'stariron' && id !== 'tablet') || (GEAR[id] && GEAR[id].price))).sort((a, b) => (ITEMS[a] ? 1 : 0) - (ITEMS[b] ? 1 : 0));
          if (!own.length) { this.toast('沒有可以賣的東西'); break; }
          const i = await this.choose(own.map(id => { const it = ITEMS[id] || GEAR[id]; return { label: it.name, sub: `${it.sell || Math.floor(it.price / 2)} G ×${S.items[id]}` }; }), { title: `出售　<span class="gil">${S.gil} G</span>` });
          if (i < 0) break;
          const id = own[i], it = ITEMS[id] || GEAR[id]; S.gil += it.sell || Math.floor(it.price / 2); addItem(S, id, -1); if (S.items[id] <= 0) delete S.items[id]; this.G.audio.sfx('item');
        }
      }
    }
  }
  // magic shop: pay to teach a spell to one hero
  async magicShop(spells, title = '魔法店') {
    const S = this.S;
    const schools = Object.keys(SCHOOL_N).filter(sc => spells.some(s => SKILLS[s].school === sc));
    for (;;) {
      const c = await this.choose(schools.map(sc => ({ label: SCHOOL_N[sc], sub: spells.filter(s => SKILLS[s].school === sc).length + ' 種' })), { title: `${title}　<span class="gil">${S.gil} G</span>`, cls: 'small' });
      if (c < 0) return;
      const list = spells.filter(s => SKILLS[s].school === schools[c]).sort((a, b) => SKILLS[a].tier - SKILLS[b].tier);
      for (;;) {
        const i = await this.choose(list.map(sp => ({ label: SKILLS[sp].name, sub: SKILLS[sp].price + ' G', disabled: S.gil < SKILLS[sp].price, desc: `MP ${SKILLS[sp].mp}　${SKILLS[sp].desc}` })), { title: `${SCHOOL_N[schools[c]]}　<span class="gil">${S.gil} G</span>`, info: (k) => `<div class="cmp">${Object.keys(S.heroes).map(id => `<div class="${S.heroes[id].spells?.includes(list[k]) ? 'dim' : ''}"><span>${HEROES[id].name}</span>${S.heroes[id].spells?.includes(list[k]) ? '已學會' : '魔力 ' + heroStats(S, id).mag}</div>`).join('')}</div>` });
        if (i < 0) break;
        const sp = list[i];
        const who = Object.keys(S.heroes);
        const j = await this.choose(who.map(id => ({ label: HEROES[id].name, sub: S.heroes[id].spells?.includes(sp) ? '已學會' : '魔力 ' + heroStats(S, id).mag, disabled: S.heroes[id].spells?.includes(sp), icon: portrait(id) })), { title: `誰要學「${SKILLS[sp].name}」？`, cls: 'small' });
        if (j < 0) continue;
        S.gil -= SKILLS[sp].price; S.heroes[who[j]].spells.push(sp); this.G.audio.sfx('levelup'); this.toast(`${HEROES[who[j]].name} 學會了「${SKILLS[sp].name}」！`);
      }
    }
  }
  // blacksmith: refine (+1..+5) and set elemental gems
  async smith(maxTier = 7) {
    const S = this.S;
    const parse = (id) => { const m = /^(.+?)(?:\+(\d))?(?:@(\w+))?$/.exec(id); return { base: m[1], n: +(m[2] || 0), el: m[3] }; };
    const make = (b, n, el) => b + (n ? '+' + n : '') + (el ? '@' + el : '');
    // every piece you own, in the bag or worn
    const owned = () => { const out = []; for (const id of Object.keys(S.items)) if (S.items[id] > 0 && GEAR[id] && GEAR[id].tier != null && GEAR[id].tier <= maxTier) out.push({ id, where: null }); for (const h of Object.keys(S.heroes)) for (const sl of EQUIP_SLOTS) { const g = S.heroes[h].equip[sl]; if (g && GEAR[g] && GEAR[g].tier != null) out.push({ id: g, where: [h, sl] }); } return out; };
    const swap = (o, nid) => { if (o.where) S.heroes[o.where[0]].equip[o.where[1]] = nid; else { addItem(S, o.id, -1); if (S.items[o.id] <= 0) delete S.items[o.id]; addItem(S, nid, 1); } };
    for (;;) {
      const m = await this.choose([{ label: '強化裝備', sub: '+1～+5' }, { label: '鑲嵌寶石', sub: '屬性' }], { title: `鐵匠　<span class="gil">${S.gil} G</span>`, cls: 'small', info: '<p><b>強化</b>：用強化石把裝備強化到+5，每一級能力+8%。</p><p><b>鑲嵌</b>：用屬性寶石讓武器帶上屬性（打弱點用），或讓防具抵抗那個屬性。</p>' });
      if (m < 0) return;
      for (;;) {
        const list = owned().filter(o => m === 0 ? parse(o.id).n < 5 : GEAR[o.id].slot !== 'acc');
        if (!list.length) { this.toast('沒有可以處理的裝備'); break; }
        const i = await this.choose(list.map(o => ({ label: GEAR[o.id].name, sub: o.where ? HEROES[o.where[0]].name + '裝備中' : '背包' })), { title: m === 0 ? '要強化哪一件？' : '要鑲嵌哪一件？', info: (k) => this.gearHTML(list[k].id) });
        if (i < 0) break;
        const o = list[i], P = parse(o.id), G = GEAR[o.id];
        if (m === 0) {
          const next = P.n + 1, cost = Math.round((G.price || 500) * 0.25 * next), stones = Object.keys(S.items).filter(x => ITEMS[x]?.refine >= next).sort((a, b) => ITEMS[a].refine - ITEMS[b].refine);
          if (!stones.length) { this.toast(`需要能強化到+${next}的強化石`); continue; }
          if (!await this.yesno(`把「${G.name}」強化到+${next}？\n需要 ${ITEMS[stones[0]].name} ×1 和 ${cost} G。`)) continue;
          if (S.gil < cost) { this.toast('錢不夠'); continue; }
          S.gil -= cost; addItem(S, stones[0], -1); if (S.items[stones[0]] <= 0) delete S.items[stones[0]];
          swap(o, make(P.base, next, P.el)); this.G.audio.sfx('levelup'); this.toast(`${GEAR[make(P.base, next, P.el)].name} 完成！`);
        } else {
          const need = Math.floor((G.tier || 0) / 2) + 1;
          const gems = Object.keys(S.items).filter(x => ITEMS[x]?.gem && ITEMS[x].tier + 1 >= need && S.items[x] > 0);
          if (!gems.length) { this.toast(`需要${['一', '二', '三', '四'][need - 1]}級以上的屬性寶石`); continue; }
          const j = await this.choose(gems.map(x => ({ label: ITEMS[x].name, sub: '×' + S.items[x] })), { title: '用哪一顆寶石？', cls: 'small' });
          if (j < 0) continue;
          const el = ITEMS[gems[j]].gem, cost = Math.round((G.price || 500) * 0.2);
          if (S.gil < cost) { this.toast(`需要 ${cost} G`); continue; }
          S.gil -= cost; addItem(S, gems[j], -1); if (S.items[gems[j]] <= 0) delete S.items[gems[j]];
          swap(o, make(P.base, P.n, el)); this.G.audio.sfx('levelup'); this.toast(`${GEAR[make(P.base, P.n, el)].name} 完成！`);
        }
      }
    }
  }
  whoCan(g) { const S = this.S; return `<div class="cmp">${Object.keys(S.heroes).map(id => canEquip(id, g) ? `<div><span>${HEROES[id].name}</span>${this.compareShort(id, g)}</div>` : `<div class="dim"><span>${HEROES[id].name}</span>不能裝備</div>`).join('')}</div>`; }
  compareShort(id, g) { const S = this.S, G = GEAR[g], slot = G.slot === 'hand' ? (G.type === 'shield' ? 'L' : 'R') : G.slot === 'acc' ? 'acc1' : G.slot, b = heroStats(S, id); const a = this.tryOn(id, slot, g); const k = G.slot === 'hand' && G.type !== 'shield' ? (G.mag > G.atk ? 'mag' : 'atk') : 'def'; const d = a[k] - b[k]; return `<b class="${d > 0 ? 'up' : d < 0 ? 'dn' : ''}">${({ atk: '攻', mag: '魔', def: '防' })[k]} ${d >= 0 ? '+' : ''}${d}</b>`; }
  async inn(price) {
    const S = this.S;
    if (!await this.yesno(`住一晚要 ${price} G，要休息嗎？\n（持有 ${S.gil} G）`, '旅店老闆', 'innkeep')) return false;
    if (S.gil < price) { await this.say('旅店老闆', '哎呀，錢好像不夠呢……', 'innkeep'); return false; }
    S.gil -= price;
    this.G.audio.music(null); await this.fade(1, 700);
    const { healAll } = await import('./party.js?v=17'); healAll(S);
    this.G.audio.sfx('save'); await wait(1200);
    await this.fade(0, 700); this.G.audio.music(this.G.field.def.bgm || this.G.field.theme.bgm);
    await this.say('旅店老闆', '早安！昨晚睡得好嗎？路上小心喔。', 'innkeep');
    this.hud();
    return true;
  }
}
export function fmtTime(s) { s = Math.floor(s); return `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}`; }
