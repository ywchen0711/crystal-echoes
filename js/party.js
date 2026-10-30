// The save state and everything derived from it: stats, skills, echoes, levels, items.
import { HEROES, ECHOES, PASSIVES, SKILLS, ITEMS, GEAR, EXP_NEXT, AP_CAP, BOND_EXP, STAR_COST, SUMMONS, ECHO_ORDER } from './data.js';

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
    S.heroes[id] = { lv: lv || 1, exp: 0, hp: 1, mp: 1, equip: { w: H.start, a: 'a_cloth', x: null }, echo: null, learned: [], on: [] };
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
  for (const slot of ['w', 'a', 'x']) { const g = GEAR[h.equip[slot]]; if (g) for (const k of ['hp', 'mp', 'atk', 'def', 'mag', 'spr', 'spd']) st[k] += g[k] || 0; }
  // echo bonus scales with star
  if (h.echo && ECHOES[h.echo]) { const E = ECHOES[h.echo], star = S.echoes[h.echo]?.star || 0; for (const k in E.stat) st[k] = Math.round(st[k] * (1 + E.stat[k] * (1 + star * 0.35))); }
  const on = h.on || [];
  const mul = { p_hp10: ['hp', 0.1], p_hp20: ['hp', 0.2], p_mp10: ['mp', 0.1], p_mp20: ['mp', 0.2], p_atk10: ['atk', 0.1], p_atk20: ['atk', 0.2], p_mag10: ['mag', 0.1], p_def10: ['def', 0.1], p_spr10: ['spr', 0.1], p_spd10: ['spd', 0.1] };
  for (const p of on) if (mul[p]) st[mul[p][0]] = Math.round(st[mul[p][0]] * (1 + mul[p][1]));
  st.hp = Math.min(9999, st.hp); st.mp = Math.min(999, st.mp);
  return st;
}
export function weaponType(S, id) { return GEAR[S.heroes[id].equip.w]?.type || HEROES[id].wpn; }
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
export function healAll(S) { for (const id in S.heroes) { const st = heroStats(S, id); S.heroes[id].hp = st.hp; S.heroes[id].mp = st.mp; } }
export function clampHP(S) { for (const id in S.heroes) { const st = heroStats(S, id); const h = S.heroes[id]; h.hp = Math.min(h.hp, st.hp); h.mp = Math.min(h.mp, st.mp); } }
export function equip(S, id, slot, gid) {
  const h = S.heroes[id]; const old = h.equip[slot];
  if (old) addItem(S, old, 1);
  if (gid) { S.items[gid]--; if (!S.items[gid]) delete S.items[gid]; }
  h.equip[slot] = gid; clampHP(S);
}
export function canEquip(id, gid) {
  const g = GEAR[gid]; if (!g) return false;
  if (g.slot !== 'w') return true;
  const allow = { aren: ['sword'], sylvie: ['spear'], mira: ['staff'], talo: ['staff'], rena: ['axe', 'dagger'], neo: ['bow'] }[id];
  return allow.includes(g.type);
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
