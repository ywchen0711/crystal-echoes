// The save state and everything derived from it: stats, skills, echoes, levels, items.
import { HEROES, ECHOES, PASSIVES, SKILLS, ITEMS, GEAR, EXP_NEXT, AP_CAP, BOND_EXP, STAR_COST, SUMMONS, ECHO_ORDER } from './data.js';
import { APT, WTYPES, ARTS_BY_TYPE, MASTERY_AT, mergeFx } from './content.js';

export const EQUIP_SLOTS = ['R', 'L', 'head', 'body', 'arms', 'waist', 'legs', 'feet', 'back', 'acc1', 'acc2'];
export const SLOT_N = { R: '右手', L: '左手', head: '頭', body: '身體', arms: '手', waist: '腰', legs: '腿', feet: '腳', back: '背', acc1: '飾品1', acc2: '飾品2' };
const START_KIT = { aren: { body: 'a_cloth', feet: 'g_feet_light1' }, sylvie: { L: 'g_buckler1', body: 'a_cloth', feet: 'g_feet_light1' }, mira: { body: 'g_body_robe1', head: 'g_head_robe1' }, talo: { body: 'g_body_robe1', head: 'g_head_robe1' }, rena: { body: 'g_body_light2', arms: 'g_arms_light2', feet: 'g_feet_light2' }, neo: { body: 'g_body_light2', back: 'g_back_light2', feet: 'g_feet_light2' } };

export function newState() {
  return {
    v: 1, party: ['aren'], reserve: [], heroes: {}, echoes: {}, items: { potion: 3 }, gil: 200,
    flags: {}, quests: {}, chests: [], tablets: [], mogu: [], summons: [],
    map: 'port', x: 17, z: 21, dir: 'up', chapter: 1, time: 0, steps: 0, battles: 0, arena: 0, mount: null,
    settings: { quality: 1, music: 0.6, sfx: 0.8, speed: 1 },
  };
}
export function addHero(S, id, lv) {
  const H = HEROES[id];
  if (!S.heroes[id]) {
    S.heroes[id] = { lv: lv || 1, exp: 0, hp: 1, mp: 1, equip: { R: H.start, ...(START_KIT[id] || { body: 'a_cloth' }) }, echo: null, learned: [], on: [], spells: [], ap: {}, mastery: {}, grow: {} };
    const st = heroStats(S, id); S.heroes[id].hp = st.hp; S.heroes[id].mp = st.mp;
    // catch up exp to the level
    S.heroes[id].exp = 0;
  }
  if (!S.party.includes(id) && !S.reserve.includes(id)) { if (S.party.length < 4) S.party.push(id); else S.reserve.push(id); }
}
export function addEcho(S, id) {
  if (!S.echoes[id]) S.echoes[id] = { bond: 1, bexp: 0, star: 0 };
}

export function heroStats(S, id) {
  const H = HEROES[id], h = S.heroes[id], lv = h.lv;
  const st = {};
  for (const k of ['hp', 'mp', 'atk', 'def', 'mag', 'spr', 'spd']) st[k] = Math.round(H.base[k] + H.grow[k] * (lv - 1));
  for (const slot of EQUIP_SLOTS) { const g = GEAR[h.equip[slot]]; if (!g) continue; for (const k of ['hp', 'mp', 'atk', 'def', 'mag', 'spr', 'spd']) { if (k === 'atk' && slot === 'L' && g.type !== 'shield' && GEAR[h.equip.R]?.type && GEAR[h.equip.R].type !== 'shield') continue; st[k] += g[k] || 0; } }
  for (const k in h.grow || {}) st[k] += h.grow[k];
  const fx = gearFx(S, id, true);
  if (fx.hpP) st.hp = Math.round(st.hp * (1 + fx.hpP)); if (fx.mpP) st.mp = Math.round(st.mp * (1 + fx.mpP));
  st.spd = Math.max(1, st.spd);
  // echo bonus scales with star
  if (h.echo && ECHOES[h.echo]) { const E = ECHOES[h.echo], star = S.echoes[h.echo]?.star || 0; for (const k in E.stat) st[k] = Math.round(st[k] * (1 + E.stat[k] * (1 + star * 0.35))); }
  const on = h.on || [];
  const mul = { p_hp10: ['hp', 0.1], p_hp20: ['hp', 0.2], p_mp10: ['mp', 0.1], p_mp20: ['mp', 0.2], p_atk10: ['atk', 0.1], p_atk20: ['atk', 0.2], p_mag10: ['mag', 0.1], p_def10: ['def', 0.1], p_spr10: ['spr', 0.1], p_spd10: ['spd', 0.1] };
  for (const p of on) if (mul[p]) st[mul[p][0]] = Math.round(st[mul[p][0]] * (1 + mul[p][1]));
  st.hp = Math.min(9999, st.hp); st.mp = Math.min(999, st.mp);
  return st;
}
// the weapons held in each hand (a shield or an empty hand is not a weapon)
export function hands(S, id) {
  const h = S.heroes[id], out = [];
  const base = heroStats(S, id).atk;
  const R = GEAR[h.equip.R], L = GEAR[h.equip.L];
  for (const [slot, g] of [['R', R], ['L', L]]) if (g && g.type !== 'shield') out.push({ slot, type: g.type, gid: h.equip[slot], fx: g.fx || {}, atk: slot === 'L' && out.length ? base - (R.atk || 0) + (g.atk || 0) : base, off: slot === 'L' && out.length > 0 });
  if (!out.length) out.push({ slot: 'R', type: 'knuckle', gid: null, fx: {}, atk: Math.round(base * 0.7), unarmed: true });
  return out;
}
export function weaponType(S, id) { return hands(S, id)[0].type; }
export function shieldOf(S, id) { const h = S.heroes[id]; return [GEAR[h.equip.L], GEAR[h.equip.R]].filter(g => g?.type === 'shield'); }
// every effect from equipment (plus the current meal) merged together
export function gearFx(S, id, statsOnly) {
  const h = S.heroes[id]; let fx = {};
  for (const slot of EQUIP_SLOTS) { const g = GEAR[h.equip[slot]]; if (!g?.fx) continue; const f = { ...g.fx }; if ((slot === 'R' || slot === 'L') && g.type !== 'shield') { delete f.el; delete f.onHit; } fx = mergeFx(fx, f); }
  if (!statsOnly && S.meal?.n > 0) fx = mergeFx(fx, Object.fromEntries(Object.entries(S.meal.fx).filter(([k]) => !['start', 'limit'].includes(k))));
  return fx;
}
export function masteryLv(S, id, type) { const p = S.heroes[id].mastery?.[type] || 0; return MASTERY_AT.filter(m => p >= m).length; }
// weapon arts available from what is in the hands right now
export function artsOf(S, id) {
  const h = S.heroes[id], types = new Set();
  for (const s of ['R', 'L']) { const g = GEAR[h.equip[s]]; if (g) types.add(g.type); }
  const out = [];
  for (const t of types) { const lv = masteryLv(S, id, t); (ARTS_BY_TYPE[t] || []).forEach((a, i) => { if (i < lv) out.push(a); }); }
  return out;
}
// spells: learned for good, plus the ones taught by equipment worn right now
export function spellsOf(S, id) {
  const h = S.heroes[id], set = new Set(h.spells || []);
  for (const slot of EQUIP_SLOTS) { const g = GEAR[h.equip[slot]]; if (g?.teach) set.add(g.teach); }
  return [...set];
}
export function gainAP(S, amount) {
  const out = [];
  for (const id of S.party) {
    const h = S.heroes[id]; if (h.hp <= 0) continue; h.ap = h.ap || {}; h.spells = h.spells || [];
    const mul = 1 + (gearFx(S, id).ap || 0);
    for (const slot of EQUIP_SLOTS) {
      const g = GEAR[h.equip[slot]]; if (!g?.teach || h.spells.includes(g.teach)) continue;
      h.ap[g.teach] = (h.ap[g.teach] || 0) + Math.round(amount * mul);
      if (h.ap[g.teach] >= g.ap) { h.spells.push(g.teach); delete h.ap[g.teach]; out.push([id, g.teach]); }
    }
  }
  return out;
}
// old saves had one weapon, one armor and one accessory
export function migrate(S) {
  for (const id in S.heroes) {
    const h = S.heroes[id], e = h.equip;
    if ('w' in e || 'a' in e || 'x' in e) h.equip = { R: e.w || null, body: e.a || null, acc1: e.x || null, ...(START_KIT[id]?.L ? { L: START_KIT[id].L } : {}) };
    h.spells = h.spells || []; h.ap = h.ap || {}; h.mastery = h.mastery || {}; h.grow = h.grow || {};
  }
}
export function apUsed(S, id) { return (S.heroes[id].on || []).reduce((a, p) => a + (PASSIVES[p]?.ap || 0), 0); }
export function apCap(S, id) { return AP_CAP(S.heroes[id].lv); }

// skills: own (by level) + echo (by bond and star)
export function skillsOf(S, id) {
  const H = HEROES[id], h = S.heroes[id], out = [];
  for (const [lv, sk] of H.skills) if (h.lv >= lv && !out.includes(sk)) out.push(sk);
  const es = echoSkills(S, h.echo);
  return { own: out, echo: es.filter(s => !out.includes(s)) };
}
export function echoSkills(S, eid) {
  if (!eid) return [];
  const E = ECHOES[eid], e = S.echoes[eid]; if (!e) return [];
  const out = [];
  for (const [b, sk] of E.skills) if (e.bond >= b) out.push(sk);
  if (E.starSkills) for (let s = 1; s <= e.star; s++) for (const sk of E.starSkills[s] || []) out.push(sk);
  return out;
}
export function bondFor(S, eid) { return S.echoes[eid]?.bond || 0; }
// give bond exp to equipped echoes, returns list of [echo, newBond, unlocked]
export function gainBond(S, amount) {
  const out = [];
  for (const id of S.party) {
    const eid = S.heroes[id].echo; if (!eid) continue;
    const e = S.echoes[eid]; if (e.bond >= 5) continue;
    e.bexp += amount;
    while (e.bond < 5 && e.bexp >= BOND_EXP[e.bond + 1]) {
      e.bond++;
      const E = ECHOES[eid], got = [];
      for (const [b, sk] of E.skills) if (b === e.bond) got.push(SKILLS[sk].name);
      for (const [b, p] of E.passives) if (b === e.bond) { got.push(PASSIVES[p].name + '（被動）'); }
      out.push([eid, e.bond, got]);
    }
    // passives are learned by the hero wearing the echo
    for (const [b, p] of ECHOES[eid].passives) if (e.bond >= b && !S.heroes[id].learned.includes(p)) S.heroes[id].learned.push(p);
  }
  return out;
}
export function learnEchoPassives(S, id) {
  const eid = S.heroes[id].echo; if (!eid) return;
  const e = S.echoes[eid];
  for (const [b, p] of ECHOES[eid].passives) if (e.bond >= b && !S.heroes[id].learned.includes(p)) S.heroes[id].learned.push(p);
}
export function starUp(S, eid) {
  const e = S.echoes[eid]; if (!e || e.star >= 3) return false;
  const cost = STAR_COST[e.star + 1];
  if ((S.items.shard || 0) < cost) return false;
  S.items.shard -= cost; e.star++; return true;
}

export function gainExp(S, amount) {
  const ups = [];
  for (const id of [...S.party, ...S.reserve]) {
    const h = S.heroes[id]; const share = S.party.includes(id) ? amount : Math.floor(amount * 0.5);
    if (S.party.includes(id) && h.hp <= 0) continue;
    h.exp += share;
    while (h.lv < 60 && h.exp >= EXP_NEXT(h.lv)) {
      h.exp -= EXP_NEXT(h.lv);
      const before = heroStats(S, id); h.lv++; const after = heroStats(S, id);
      h.hp += after.hp - before.hp; h.mp += after.mp - before.mp;
      const learned = HEROES[id].skills.filter(([l]) => l === h.lv).map(([, s]) => SKILLS[s].name);
      ups.push([id, h.lv, learned]);
    }
  }
  return ups;
}

export function addItem(S, id, n = 1) {
  if (GEAR[id]) { S.items[id] = (S.items[id] || 0) + n; return; }
  S.items[id] = (S.items[id] || 0) + n; if (S.items[id] <= 0) delete S.items[id];
}
export function itemName(id) { return ITEMS[id]?.name || GEAR[id]?.name || id; }
export { WTYPES };
export function healAll(S) { for (const id in S.heroes) { const st = heroStats(S, id); S.heroes[id].hp = st.hp; S.heroes[id].mp = st.mp; } }
export function clampHP(S) { for (const id in S.heroes) { const st = heroStats(S, id); const h = S.heroes[id]; h.hp = Math.min(h.hp, st.hp); h.mp = Math.min(h.mp, st.mp); } }
export function equip(S, id, slot, gid) {
  const h = S.heroes[id];
  const take = (s) => { const old = h.equip[s]; if (old) addItem(S, old, 1); h.equip[s] = null; };
  take(slot);
  const g = GEAR[gid];
  const other = slot === 'R' ? 'L' : 'R';
  // two-handed weapons use both hands
  if (g && (slot === 'R' || slot === 'L') && (g.hands === 2 || GEAR[h.equip[other]]?.hands === 2)) take(other);
  if (gid) { S.items[gid]--; if (!S.items[gid]) delete S.items[gid]; }
  h.equip[slot] = gid || null; clampHP(S);
}
export function slotFits(slot, gid) {
  const g = GEAR[gid]; if (!g) return false;
  if (slot === 'R' || slot === 'L') return g.slot === 'hand';
  if (slot === 'acc1' || slot === 'acc2') return g.slot === 'acc';
  return g.slot === slot;
}
export function canEquip(id, gid) {
  const g = GEAR[gid]; if (!g) return false;
  const A = APT[id]; if (!A) return true;
  if (g.slot === 'hand') return g.type === 'shield' ? A.shield : A.w.includes(g.type);
  if (g.style) return A.styles.includes(g.style);
  return true;
}
export function setEcho(S, id, eid) {
  // an echo can only be worn by one hero at a time
  for (const o in S.heroes) if (S.heroes[o].echo === eid) S.heroes[o].echo = null;
  S.heroes[id].echo = eid; learnEchoPassives(S, id); clampHP(S);
}
export function togglePassive(S, id, p) {
  const h = S.heroes[id];
  if (h.on.includes(p)) { h.on = h.on.filter(x => x !== p); clampHP(S); return true; }
  if (apUsed(S, id) + PASSIVES[p].ap > apCap(S, id)) return false;
  h.on.push(p); return true;
}
export function ownedEchoes(S) { return ECHO_ORDER.filter(e => S.echoes[e]); }
export { SUMMONS };
