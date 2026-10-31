// Generated content: weapon types with their own battle rules, 1000+ pieces of equipment with effects,
// 400 spells, 500 items and the weapon arts. Everything is built from tables so it stays consistent.
import { ELEM, WPN, ICON, ELEM_COLOR, SKILLS, ITEMS, GEAR, ENEMIES, setGearResolver } from './data.js?v=14';
import { BESTIARY_NEW } from './monsters.js?v=14';
import { H_TRAITS } from './horde.js?v=14';
import { applyDepth } from './depth.js?v=14';
export { BESTIARY_NEW };

export const ELS = ['fire', 'ice', 'thunder', 'water', 'wind', 'earth', 'light', 'dark'];
const EANIM = { fire: 'fire', ice: 'ice', thunder: 'thunder', water: 'water', wind: 'wind', earth: 'quake', light: 'holy', dark: 'dark' };
export const STAT_N = { atk: '攻擊', def: '防禦', mag: '魔力', spr: '精神', spd: '速度', hp: 'HP', mp: 'MP' };
export const STATUS_N = { poison: '中毒', sleep: '睡眠', silence: '沉默', blind: '失明', slow: '緩速', stun: '暈眩', stop: '停止', doom: '死亡宣告', confuse: '混亂', curse: '詛咒', regen: '再生', haste: '加速', reflect: '反射', reraise: '自動復活', protect: '護佑', shell: '魔障' };
export const STATUS_S = { poison: '毒', sleep: '眠', silence: '默', blind: '盲', slow: '緩', stun: '暈', stop: '停', doom: '亡', confuse: '亂', curse: '咒', regen: '再', haste: '速', reflect: '反', reraise: '生' };
export const FAM_N = { beast: '野獸', flying: '飛行', plant: '植物', amorph: '軟體', undead: '不死', machine: '機械', aquatic: '水棲', spirit: '靈體', dragon: '龍族', humanoid: '人型', demon: '惡魔' };
export const TRAIT_N = { fly: ['🪽', '飛行', '近戰武器傷害×0.6；弓、迴旋鏢更有效；土屬性無效'], armor: ['🛡️', '重甲', '物理防禦×1.6；戰鎚、火槍無視，斧可以削弱'], evade: ['💨', '敏捷', '物理攻擊有25%會被閃開；弓、火槍、魔法必中'] };

// ================================================================ weapon types
// h: hands; atk/mag: multipliers of the tier's power; tags: weaknesses it hits; trait: its battle rule
export const WTYPES = {
  sword: { n: '劍', h: 1, atk: 1.0, tags: ['sword'], model: 'sword', melee: true, mat: 'metal', noun: '劍', trait: '招架：攻擊後到下次行動前，有30%機率擋開物理攻擊並反擊' },
  greatsword: { n: '大劍', h: 2, atk: 1.55, tags: ['sword', 'greatsword'], model: 'greatsword', melee: true, mat: 'metal', noun: '大劍', spd: -2, trait: '橫掃：普通攻擊會波及另一名敵人（60%傷害）。雙手武器，速度-2' },
  dagger: { n: '短劍', h: 1, atk: 0.62, tags: ['dagger'], model: 'dagger', melee: true, mat: 'metal', noun: '短劍', spd: 2, trait: '連擊：普通攻擊打兩下；對破防、睡眠、暈眩、停止的敵人傷害×1.5' },
  katana: { n: '刀', h: 1, atk: 1.05, tags: ['sword', 'katana'], model: 'katana', melee: true, mat: 'metal', noun: '刀', trait: '拔刀：每場戰鬥的第一次攻擊必定會心；會心傷害×2' },
  spear: { n: '槍', h: 1, atk: 1.0, tags: ['spear'], model: 'spear', melee: false, mat: 'metal', noun: '槍', trait: '貫穿：普通攻擊會刺穿到後方另一名敵人（50%）；打飛行敵人不減傷' },
  axe: { n: '斧', h: 1, atk: 1.18, tags: ['axe'], model: 'axe', melee: true, mat: 'metal', noun: '斧', trait: '破甲：命中時降低敵人防禦1級，重甲敵人會失去重甲；命中率90%' },
  hammer: { n: '戰鎚', h: 1, atk: 1.1, tags: ['hammer'], model: 'hammer', melee: true, mat: 'metal', noun: '戰鎚', trait: '震擊：無視重甲；35%機率不打弱點也削減1格破防值' },
  bow: { n: '弓', h: 2, atk: 1.3, tags: ['bow'], model: 'bow', melee: false, mat: 'wood', noun: '弓', trait: '遠程：打飛行敵人×1.3、必定命中、不會被反擊。雙手武器' },
  gun: { n: '火槍', h: 1, atk: 0.8, tags: ['gun'], model: 'gun', melee: false, mat: 'gun', noun: '火槍', trait: '穿甲：無視防禦與重甲、必定命中，但不會會心' },
  staff: { n: '法杖', h: 2, atk: 0.45, mag: 0.85, tags: ['staff'], model: 'staff', melee: true, mat: 'wood', noun: '法杖', trait: '治療量+30%；普通攻擊會回復少量MP。雙手武器' },
  rod: { n: '魔杖', h: 1, atk: 0.35, mag: 0.7, tags: ['staff'], model: 'rod', melee: true, mat: 'wood', noun: '魔杖', trait: '屬性魔法傷害+20%；屬性魔法打中弱點時多削1格破防值' },
  knuckle: { n: '拳套', h: 1, atk: 0.8, tags: ['knuckle'], model: null, melee: true, mat: 'metal', noun: '拳套', trait: '連段：連續攻擊同一個敵人，每次傷害+20%（最多+100%）' },
  whip: { n: '長鞭', h: 1, atk: 0.85, tags: ['whip'], model: 'whip', melee: false, mat: 'leather', noun: '鞭', trait: '群打：普通攻擊打全體（50%傷害）；附加狀態的機率×2' },
  boomerang: { n: '迴旋鏢', h: 1, atk: 0.85, tags: ['boomerang'], model: 'boomerang', melee: false, mat: 'wood', noun: '迴旋鏢', trait: '迴旋：普通攻擊打全體（65%傷害）；打飛行敵人×1.2' },
  harp: { n: '豎琴', h: 2, atk: 0.5, mag: 0.6, tags: ['harp'], model: 'harp', melee: false, mat: 'wood', noun: '豎琴', trait: '樂曲：普通攻擊改成演奏，替一名隊友提升能力。雙手武器' },
  tome: { n: '魔導書', h: 1, atk: 0.3, mag: 0.8, tags: ['tome'], model: 'tome', melee: false, mat: 'book', noun: '魔導書', trait: '詠讀：普通攻擊變成魔法傷害，並自動帶上敵人已知的弱點屬性' },
};
export const SHIELD_KINDS = {
  buckler: { n: '小圓盾', block: 0.15, def: 0.7, spr: 0.4, spd: 1, desc: '輕巧，格擋率15%' },
  kite: { n: '鳶盾', block: 0.25, def: 1.0, spr: 0.5, desc: '格擋率25%' },
  tower: { n: '塔盾', block: 0.35, def: 1.4, spr: 0.6, spd: -2, desc: '格擋率35%，速度-2' },
  aegis: { n: '魔法盾', block: 0.15, def: 0.8, spr: 1.2, mblock: 0.2, desc: '格擋率15%，並有20%機率擋下魔法' },
};
for (const [k, t] of Object.entries(WTYPES)) { WPN[k] = t.n; ICON[k] = ICON[k] || { greatsword: '⚔️', katana: '🗾', hammer: '🔨', gun: '🔫', rod: '🪄', knuckle: '🥊', whip: '➰', boomerang: '🪃', harp: '🎵', tome: '📖' }[k]; ELEM_COLOR[k] = ELEM_COLOR[k] || '#e8eef8'; }
WPN.shield = '盾'; ICON.shield = '🛡️';

// which weapons and armor styles each hero can use
export const APT = {
  aren: { w: ['sword', 'greatsword', 'katana', 'axe', 'spear'], shield: true, styles: ['heavy', 'light'] },
  sylvie: { w: ['spear', 'sword', 'hammer', 'whip'], shield: true, styles: ['heavy', 'light'] },
  mira: { w: ['staff', 'rod', 'hammer', 'harp', 'tome'], shield: true, styles: ['light', 'robe'] },
  talo: { w: ['rod', 'staff', 'tome', 'dagger', 'boomerang'], shield: false, styles: ['light', 'robe'] },
  rena: { w: ['axe', 'hammer', 'gun', 'knuckle', 'boomerang', 'dagger'], shield: true, styles: ['heavy', 'light'] },
  neo: { w: ['bow', 'gun', 'dagger', 'whip', 'boomerang', 'harp', 'sword'], shield: false, styles: ['light', 'robe'] },
};

// ================================================================ tiers and materials
const T_ATK = [8, 15, 26, 38, 52, 66, 80, 96];
const T_DEF = [6, 12, 20, 30, 42, 54, 66, 80];
const T_PRICE = [60, 200, 600, 1400, 2800, 5000, 8000, 12000];
const MATS = {
  metal: ['青銅', '鐵', '鋼', '白銀', '秘銀', '精金', '龍骨', '星鐵'],
  wood: ['橡木', '楓木', '白樺', '銀杏', '秘銀', '精靈', '世界樹', '星辰'],
  gun: ['短管', '燧發', '鋼管', '白銀', '秘銀', '精金', '龍息', '星鐵'],
  leather: ['皮', '荊棘', '鋼絲', '銀線', '秘銀', '精靈', '龍筋', '星輝'],
  book: ['入門', '見習', '研究', '秘傳', '禁斷', '賢者', '龍語', '星辰'],
};
export const TIER_N = ['一', '二', '三', '四', '五', '六', '七', '八'];

// ================================================================ effect affixes
// fx keys understood by party.gearFx / battle: el, onHit, drain, mpdrain, crit, dbl, brk, slay, first, lowhp, mpcost,
// resist, immune, auto, counter, thorns, evade, hpP, mpP, mpregen, survive, cover, limitup, exp, gil, drop, enc, healup, magup, steal, ap
const W_AFFIX = [
  ['fire', '炎之', () => ({ el: 'fire' })], ['ice', '冰之', () => ({ el: 'ice' })], ['thunder', '雷之', () => ({ el: 'thunder' })], ['water', '水之', () => ({ el: 'water' })],
  ['wind', '風之', () => ({ el: 'wind' })], ['earth', '地之', () => ({ el: 'earth' })], ['light', '聖', () => ({ el: 'light' })], ['dark', '魔', () => ({ el: 'dark' })],
  ['venom', '毒牙', () => ({ onHit: { poison: 0.3 } })], ['dream', '夢見', () => ({ onHit: { sleep: 0.2 } })], ['mute', '封口', () => ({ onHit: { silence: 0.25 } })], ['shade', '暗幕', () => ({ onHit: { blind: 0.25 } })],
  ['heavy', '遲滯', () => ({ onHit: { slow: 0.25 } })], ['shock', '震盪', () => ({ onHit: { stun: 0.15 } })], ['vamp', '吸血', () => ({ drain: 0.2 })], ['soul', '吸魂', () => ({ mpdrain: 0.06 })],
  ['swift', '疾風', (t) => ({ spd: 2 + t, first: 0.35 })], ['keen', '銳利', () => ({ crit: 0.12 })], ['twin', '連擊', () => ({ dbl: 0.25 })], ['breach', '破甲', () => ({ brk: 0.25 })],
  ['dragon', '屠龍', () => ({ slay: { dragon: 1.6 } })], ['holy', '破邪', () => ({ slay: { undead: 1.6, demon: 1.3 } })], ['beast', '獵獸', () => ({ slay: { beast: 1.6 } })], ['iron', '斬鐵', () => ({ slay: { machine: 1.6 } })],
  ['sky', '落鷹', () => ({ slay: { flying: 1.6 } })], ['wood', '伐木', () => ({ slay: { plant: 1.6 } })], ['sea', '淨海', () => ({ slay: { aquatic: 1.6, amorph: 1.3 } })], ['spirit', '鎮魂', () => ({ slay: { spirit: 1.6 } })],
  ['brave', '背水', () => ({ lowhp: 0.6 })], ['sage', '賢者', (t) => ({ mag: 3 + t * 3, mpcost: 0.2 })], ['guard', '守護', (t) => ({ def: 2 + t * 2, spr: 2 + t * 2 })], ['luck', '幸運', () => ({ drop: 0.3, gil: 0.2, steal: 0.3 })],
];
const RES_N = { fire: '耐火', ice: '耐寒', thunder: '絕緣', water: '防水', wind: '抗風', earth: '堅岩', light: '光明', dark: '暗護' };
const resVal = (t) => t < 4 ? 0.5 : t < 6 ? 0.25 : t < 7 ? 0 : -0.5;
const A_AFFIX = [
  ...ELS.map((e) => [`r${e}`, RES_N[e], (t) => ({ resist: { [e]: resVal(t) } })]),
  ['ipoison', '無毒', () => ({ immune: ['poison'] })], ['isleep', '清醒', () => ({ immune: ['sleep'] })], ['isilence', '咒言', () => ({ immune: ['silence'] })], ['iblind', '明目', () => ({ immune: ['blind'] })],
  ['istun', '不動', () => ({ immune: ['stun', 'stop'] })], ['idoom', '長生', () => ({ immune: ['doom'] })], ['iconf', '冷靜', () => ({ immune: ['confuse'] })], ['icurse', '聖潔', () => ({ immune: ['curse', 'slow'] })],
  ['regen', '再生', () => ({ auto: ['regen'] })], ['haste', '加速', () => ({ auto: ['haste'] })], ['reflect', '反射', () => ({ auto: ['reflect'] })], ['protect', '護佑', () => ({ auto: ['protect'] })],
  ['shell', '魔障', () => ({ auto: ['shell'] })], ['counter', '反擊', () => ({ counter: 0.25 })], ['thorns', '荊棘', () => ({ thorns: 0.2 })], ['evade', '閃避', () => ({ evade: 0.1 })],
  ['giant', '巨人', () => ({ hpP: 0.12 })], ['mind', '冥想', () => ({ mpP: 0.15, mpregen: 0.03 })], ['survive', '不屈', () => ({ survive: 1 })], ['cover', '騎士', () => ({ cover: 1 })],
  ['limit', '激昂', () => ({ limitup: 0.3 })], ['exp', '學者', () => ({ exp: 0.2 })], ['gil', '富豪', () => ({ gil: 0.3 })], ['stealth', '隱密', () => ({ enc: -0.4 })],
];
const AFFIX_BY_ID = Object.fromEntries([...W_AFFIX, ...A_AFFIX].map(a => [a[0], a]));

// ================================================================ spells (400)
const SP = {}; // id -> skill
const spellOrder = [];
const addSpell = (id, o) => { SP[id] = { mp: 0, ...o }; spellOrder.push(id); };
const SINGLE = {
  fire: ['火焰', '烈焰', '爆炎', '獄炎', '終焉之炎'], ice: ['冰霜', '冰暴', '冰牙', '絕對零度', '永凍棺'], thunder: ['雷擊', '落雷', '雷光槍', '雷神鎚', '天雷滅'],
  water: ['水彈', '激流', '漩渦', '怒濤', '深淵之水'], wind: ['疾風', '烈風', '風刃', '真空斬', '天之風'], earth: ['石礫', '岩槍', '地裂', '崩山', '大地之怒'],
  light: ['聖光', '光矢', '光輪', '神聖', '審判之光'], dark: ['暗影', '暗黑', '虛空彈', '冥界門', '終末之闇'],
};
const MULTI = {
  fire: ['火雨', '炎陣', '火龍捲', '煉獄', '太陽崩落'], ice: ['冰雨', '冰華', '暴風雪', '冰河期', '白銀世界'], thunder: ['雷雨', '雷網', '雷暴', '萬雷', '雷霆審判'],
  water: ['驟雨', '浪潮', '大洪水', '潮汐', '海神之怒'], wind: ['旋風', '龍捲風', '風暴', '颶風', '天嵐'], earth: ['地震', '落石', '地崩', '大地震', '隕岩落'],
  light: ['聖域之光', '光之雨', '天使之翼', '聖光十字', '天堂之門'], dark: ['黑霧', '暗潮', '闇之渦', '黑洞', '終焉'],
};
const P1 = [1.1, 1.9, 2.6, 3.4, 4.4], M1 = [5, 12, 20, 30, 44], PA = [0.9, 1.3, 1.9, 2.6, 3.4], MA = [10, 20, 32, 46, 64];
const SPRICE = [150, 600, 1800, 4500, 9000];
for (const e of ELS) {
  const en = ELEM[e];
  for (let t = 0; t < 5; t++) addSpell(`m_${e}${t + 1}`, { name: SINGLE[e][t], school: 'black', tier: t + 1, mp: M1[t], type: 'mag', tgt: 'enemy', pow: P1[t], el: e, anim: EANIM[e], desc: `${en}屬性單體魔法（威力${P1[t]}）` });
  for (let t = 0; t < 5; t++) addSpell(`m_${e}a${t + 1}`, { name: MULTI[e][t], school: 'black', tier: t + 1, mp: MA[t], type: 'mag', tgt: 'enemies', pow: PA[t], el: e, anim: EANIM[e], desc: `${en}屬性全體魔法（威力${PA[t]}）` });
  addSpell(`m_${e}_mark`, { name: `${en}之印`, school: 'black', tier: 1, mp: 6, type: 'mag', tgt: 'enemy', pow: 0.5, el: e, mark: e, anim: EANIM[e], desc: `${en}屬性小傷害並留下印記：3回合內下一次${en}屬性攻擊傷害×1.5、多削1格破防` });
  addSpell(`m_${e}_chain`, { name: `連鎖${SINGLE[e][0].slice(0, 1)}${['彈', '刃', '光', '珠', '刃', '石', '矢', '球'][ELS.indexOf(e)]}`, school: 'black', tier: 2, mp: 14, type: 'mag', tgt: 'enemy', pow: 1.3, el: e, chain: 3, anim: EANIM[e], desc: `${en}屬性魔法，打中後彈跳到其他敵人3次（每次威力-20%）` });
  addSpell(`m_${e}_field`, { name: `${en}之領域`, school: 'black', tier: 3, mp: 18, type: 'special', tgt: 'self', field: e, anim: EANIM[e], desc: `把戰場變成${en}屬性領域3回合：所有${en}屬性傷害×1.4` });
  addSpell(`m_${e}_delay`, { name: `${en}之時限`, school: 'black', tier: 3, mp: 22, type: 'mag', tgt: 'enemy', pow: 3.2, el: e, delay: true, anim: EANIM[e], desc: `在敵人身上設下${en}屬性魔力，回合結束時爆發（威力3.2）` });
  addSpell(`m_${e}_burst`, { name: `${en}爆`, school: 'black', tier: 4, mp: 30, type: 'mag', tgt: 'enemy', pow: 1.6, el: e, burst: true, anim: EANIM[e], desc: `${en}屬性魔法。敵人身上每有一個異常狀態或弱化，傷害+60%（之後清除）` });
}
// dual-element spells: hit two weaknesses at once
const DUO_N = ['彈', '陣', '崩'];
for (let i = 0; i < ELS.length; i++) for (let j = i + 1; j < ELS.length; j++) {
  const a = ELS[i], b = ELS[j], nm = ELEM[a] + ELEM[b];
  addSpell(`m_${a}_${b}1`, { name: nm + DUO_N[0], school: 'arcane', tier: 2, mp: 14, type: 'mag', tgt: 'enemy', pow: 1.5, el: [a, b], anim: EANIM[a], desc: `${ELEM[a]}＋${ELEM[b]}雙屬性單體魔法，能同時打中兩種弱點` });
  addSpell(`m_${a}_${b}2`, { name: nm + DUO_N[1], school: 'arcane', tier: 3, mp: 30, type: 'mag', tgt: 'enemies', pow: 1.4, el: [a, b], anim: EANIM[b], desc: `${ELEM[a]}＋${ELEM[b]}雙屬性全體魔法` });
  addSpell(`m_${a}_${b}3`, { name: nm + DUO_N[2], school: 'arcane', tier: 5, mp: 52, type: 'mag', tgt: 'enemy', pow: 2.2, hits: 2, el: [a, b], anim: EANIM[a], desc: `${ELEM[a]}和${ELEM[b]}交替的兩連擊大魔法` });
}
// white
const HEAL1 = ['治癒', '中治癒', '高治癒', '大治癒', '完全治癒'], HEALA = ['癒合之風', '治癒之雨', '生命之泉', '大地之息', '天使之歌'];
for (let t = 0; t < 5; t++) {
  addSpell(`m_cure${t + 1}`, { name: HEAL1[t], school: 'white', tier: t + 1, mp: [4, 9, 16, 26, 40][t], type: 'heal', tgt: 'ally', pow: [1.6, 2.4, 3.4, 4.6, 0][t], base: [30, 80, 180, 400, 0][t], full: t === 4, anim: 'heal', desc: t === 4 ? '單體HP全滿' : '回復單體HP' });
  addSpell(`m_cura${t + 1}`, { name: HEALA[t], school: 'white', tier: t + 1, mp: [10, 18, 28, 40, 60][t], type: 'heal', tgt: 'allies', pow: [1.1, 1.6, 2.2, 3.0, 4.0][t], base: [30, 60, 120, 260, 500][t], anim: 'heal', desc: '回復全體HP' });
}
addSpell('m_raise1', { name: '復甦', school: 'white', tier: 2, mp: 16, type: 'heal', tgt: 'dead', revive: 0.3, anim: 'raise', desc: '以30% HP復活' });
addSpell('m_raise2', { name: '再生之光', school: 'white', tier: 4, mp: 30, type: 'heal', tgt: 'dead', revive: 0.7, anim: 'raise', desc: '以70% HP復活' });
addSpell('m_raise3', { name: '天使降臨', school: 'white', tier: 5, mp: 60, type: 'heal', tgt: 'allies', revive: 1, full: true, anim: 'raise', desc: '全體復活並完全回復' });
const CURE_ST = [['poison', '解毒'], ['sleep', '喚醒'], ['silence', '解咒'], ['blind', '明目'], ['slow', '回速'], ['stun', '鎮定'], ['confuse', '正氣'], ['curse', '祛邪']];
for (const [s, n] of CURE_ST) addSpell(`m_cure_${s}`, { name: n, school: 'white', tier: 1, mp: 3, type: 'heal', tgt: 'ally', cureOnly: [s, ...(s === 'curse' ? ['doom'] : s === 'stun' ? ['stop'] : [])], anim: 'heal', desc: `解除${STATUS_N[s]}${s === 'curse' ? '和死亡宣告' : s === 'stun' ? '和停止' : ''}` });
addSpell('m_esuna', { name: '淨化', school: 'white', tier: 2, mp: 8, type: 'heal', tgt: 'ally', cure: true, anim: 'heal', desc: '解除單體所有異常狀態' });
addSpell('m_esunaga', { name: '大淨化', school: 'white', tier: 4, mp: 20, type: 'heal', tgt: 'allies', cure: true, anim: 'heal', desc: '解除全體所有異常狀態' });
for (let t = 0; t < 3; t++) {
  addSpell(`m_regen${t + 1}`, { name: ['再生', '持續再生', '生命之種'][t], school: 'white', tier: [1, 3, 5][t], mp: [8, 16, 28][t], type: 'buff', tgt: 'ally', regen: [3, 4, 6][t], anim: 'heal', desc: `每回合回復HP，持續${[3, 4, 6][t]}回合` });
  addSpell(`m_regena${t + 1}`, { name: ['群體再生', '生命之環', '世界樹之息'][t], school: 'white', tier: [2, 4, 5][t], mp: [16, 30, 48][t], type: 'buff', tgt: 'allies', regen: [3, 4, 6][t], anim: 'heal', desc: `全體每回合回復HP，持續${[3, 4, 6][t]}回合` });
}
const BUFF_ST = [['atk', '力量'], ['def', '守護'], ['mag', '智慧'], ['spr', '心靈'], ['spd', '迅捷']], BUFF_T = ['祝福', '加護', '神佑'];
for (const [k, n] of BUFF_ST) for (let t = 0; t < 3; t++) {
  addSpell(`m_b_${k}${t + 1}`, { name: n + BUFF_T[t], school: k === 'spd' ? 'time' : 'white', tier: [1, 3, 5][t], mp: [5, 10, 18][t], type: 'buff', tgt: 'ally', buff: { [k]: t + 1 }, anim: 'buff', desc: `單體${STAT_N[k]}提升${t + 1}級` });
  addSpell(`m_ba_${k}${t + 1}`, { name: '全體' + n + BUFF_T[t], school: k === 'spd' ? 'time' : 'white', tier: [2, 4, 5][t], mp: [12, 22, 36][t], type: 'buff', tgt: 'allies', buff: { [k]: t + 1 }, anim: 'buff', desc: `全體${STAT_N[k]}提升${t + 1}級` });
}
for (const e of ELS) {
  addSpell(`m_bar_${e}`, { name: `${ELEM[e]}之護壁`, school: 'white', tier: 2, mp: 6, type: 'buff', tgt: 'ally', barrier: e, anim: 'buff', desc: `單體受到的${ELEM[e]}屬性傷害減半，4回合` });
  addSpell(`m_bara_${e}`, { name: `${ELEM[e]}之結界`, school: 'white', tier: 3, mp: 16, type: 'buff', tgt: 'allies', barrier: e, anim: 'buff', desc: `全體受到的${ELEM[e]}屬性傷害減半，4回合` });
}
addSpell('m_reflect', { name: '反射', school: 'white', tier: 3, mp: 12, type: 'buff', tgt: 'ally', status: 'reflect', self: true, anim: 'buff', desc: '單體魔法會反射回施法者，3回合' });
addSpell('m_reflecta', { name: '全體反射', school: 'white', tier: 5, mp: 34, type: 'buff', tgt: 'allies', status: 'reflect', self: true, anim: 'buff', desc: '全體反射魔法，3回合' });
addSpell('m_dispel', { name: '驅散', school: 'white', tier: 2, mp: 8, type: 'debuff', tgt: 'enemy', dispel: true, anim: 'holy', desc: '消除敵人身上所有強化' });
addSpell('m_dispela', { name: '全驅散', school: 'white', tier: 4, mp: 20, type: 'debuff', tgt: 'enemies', dispel: true, anim: 'holy', desc: '消除敵全體的強化' });
addSpell('m_reraise', { name: '守護天使', school: 'white', tier: 4, mp: 24, type: 'buff', tgt: 'ally', status: 'reraise', self: true, anim: 'raise', desc: '倒下時自動以20% HP復活一次' });
addSpell('m_reraisea', { name: '天使之群', school: 'white', tier: 5, mp: 60, type: 'buff', tgt: 'allies', status: 'reraise', self: true, anim: 'raise', desc: '全體獲得自動復活' });
addSpell('m_sanctify', { name: '祝聖', school: 'white', tier: 3, mp: 20, type: 'heal', tgt: 'allies', pow: 1.0, base: 60, field: 'light', anim: 'holy', desc: '全體回復，並把戰場變成光之領域3回合' });
// time
const TIME = [
  ['m_haste', '加速', 2, 8, { type: 'buff', tgt: 'ally', status: 'haste', self: true, desc: '單體速度×1.5，4回合' }],
  ['m_hastea', '全體加速', 4, 26, { type: 'buff', tgt: 'allies', status: 'haste', self: true, desc: '全體速度×1.5，4回合' }],
  ['m_slow', '緩速', 1, 6, { type: 'debuff', tgt: 'enemy', status: 'slow', chance: 0.8, desc: '使單體緩速' }],
  ['m_slowa', '全體緩速', 3, 18, { type: 'debuff', tgt: 'enemies', status: 'slow', chance: 0.6, desc: '使敵全體緩速' }],
  ['m_stop', '停止', 3, 16, { type: 'debuff', tgt: 'enemy', status: 'stop', chance: 0.6, desc: '使單體停止2回合（受傷也不會解除）' }],
  ['m_stopa', '時間凍結', 5, 44, { type: 'debuff', tgt: 'enemies', status: 'stop', chance: 0.4, desc: '使敵全體停止' }],
  ['m_delay', '遲滯', 1, 6, { type: 'debuff', tgt: 'enemy', delayT: true, desc: '把敵人本回合的行動延到最後' }],
  ['m_delaya', '時之沼', 3, 18, { type: 'debuff', tgt: 'enemies', delayT: true, desc: '把敵全體本回合的行動延到最後' }],
  ['m_quick', '迅捷之時', 4, 30, { type: 'special', tgt: 'allyOther', quick: true, desc: '讓一名隊友立刻再行動一次' }],
  ['m_grav1', '重力', 2, 10, { type: 'mag', tgt: 'enemy', gravity: 0.25, desc: '削去敵人目前HP的25%（頭目效果降低）' }],
  ['m_grav2', '重力球', 3, 20, { type: 'mag', tgt: 'enemies', gravity: 0.25, desc: '削去敵全體目前HP的25%' }],
  ['m_grav3', '黑洞重力', 5, 40, { type: 'mag', tgt: 'enemies', gravity: 0.45, desc: '削去敵全體目前HP的45%' }],
  ['m_comet', '彗星', 3, 22, { type: 'mag', tgt: 'enemy', pow: 2.4, pierce: true, desc: '無屬性、無視精神的單體魔法' }],
  ['m_meteor', '流星', 4, 36, { type: 'mag', tgt: 'random', pow: 1.0, hits: 5, desc: '隨機落下5顆流星（無屬性）' }],
  ['m_meteor2', '隕石雨', 5, 60, { type: 'mag', tgt: 'random', pow: 1.2, hits: 8, desc: '隨機落下8顆隕石' }],
  ['m_timebreak', '時空破', 5, 50, { type: 'mag', tgt: 'enemies', pow: 2.2, pierce: true, desc: '無視精神的全體魔法' }],
  ['m_foresight', '預知', 2, 8, { type: 'buff', tgt: 'ally', buff: { spd: 1 }, evadeT: 0.5, desc: '單體閃避率+50%，持續到下次行動' }],
  ['m_rewind', '倒轉', 4, 26, { type: 'heal', tgt: 'ally', rewind: true, desc: 'HP回到本回合開始時的數值，並解除異常狀態' }],
  ['m_teleport', '瞬移', 1, 4, { type: 'special', tgt: 'self', flee100: true, desc: '必定從戰鬥中逃走（頭目戰無效）' }],
  ['m_accel', '加速陣', 3, 20, { type: 'special', tgt: 'self', field: 'haste', desc: '3回合內全隊速度提升' }],
];
for (const [id, n, t, mp, o] of TIME) addSpell(id, { name: n, school: 'time', tier: t, mp, anim: o.type === 'mag' ? 'meteor' : o.type === 'debuff' ? 'dark' : 'buff', ...o });
// curses
const CURSE = [['poison', '毒', '毒霧'], ['sleep', '睡眠', '安眠'], ['silence', '沉默', '靜寂'], ['blind', '黑暗', '暗幕'], ['stun', '暈眩', '震盪'], ['doom', '死亡宣告', '死神之歌'], ['confuse', '混亂', '狂亂'], ['curse', '詛咒', '咒縛']];
for (const [s, n, na] of CURSE) {
  addSpell(`m_s_${s}1`, { name: n, school: 'curse', tier: s === 'doom' ? 3 : 1, mp: s === 'doom' ? 18 : 5, type: 'debuff', tgt: 'enemy', status: s, chance: s === 'doom' ? 0.5 : 0.65, anim: 'dark', desc: `使單體${STATUS_N[s]}` });
  addSpell(`m_s_${s}2`, { name: '強' + n, school: 'curse', tier: s === 'doom' ? 4 : 3, mp: s === 'doom' ? 28 : 12, type: 'debuff', tgt: 'enemy', status: s, chance: 0.9, anim: 'dark', desc: `高機率使單體${STATUS_N[s]}` });
  addSpell(`m_sa_${s}1`, { name: na, school: 'curse', tier: s === 'doom' ? 4 : 2, mp: s === 'doom' ? 30 : 12, type: 'debuff', tgt: 'enemies', status: s, chance: 0.45, anim: 'dark', desc: `使敵全體${STATUS_N[s]}` });
  addSpell(`m_sa_${s}2`, { name: '大' + na, school: 'curse', tier: s === 'doom' ? 5 : 4, mp: s === 'doom' ? 44 : 22, type: 'debuff', tgt: 'enemies', status: s, chance: 0.7, anim: 'dark', desc: `高機率使敵全體${STATUS_N[s]}` });
}
const DOWN = [['atk', '衰弱'], ['def', '破甲'], ['mag', '愚鈍'], ['spr', '失神'], ['spd', '遲鈍']];
for (const [k, n] of DOWN) for (let t = 0; t < 2; t++) {
  addSpell(`m_d_${k}${t + 1}`, { name: (t ? '大' : '') + n, school: 'curse', tier: t ? 3 : 1, mp: t ? 12 : 5, type: 'debuff', tgt: 'enemy', debuff: { [k]: t + 1 }, anim: 'dark', desc: `降低單體${STAT_N[k]}${t + 1}級` });
  addSpell(`m_da_${k}${t + 1}`, { name: '群體' + (t ? '大' : '') + n, school: 'curse', tier: t ? 4 : 2, mp: t ? 24 : 12, type: 'debuff', tgt: 'enemies', debuff: { [k]: t + 1 }, anim: 'dark', desc: `降低敵全體${STAT_N[k]}${t + 1}級` });
}
// arcane specials
const ARC = [
  ['m_scan', '窺探', 1, 2, { type: 'special', tgt: 'enemy', analyze: true, anim: 'scan', desc: '看穿單體所有弱點與特性' }],
  ['m_scana', '全知之眼', 3, 10, { type: 'special', tgt: 'enemies', analyze: true, anim: 'scan', desc: '看穿敵全體的弱點' }],
  ['m_osmose', '吸魔', 2, 0, { type: 'mag', tgt: 'enemy', osmose: true, pow: 0.5, anim: 'dark', desc: '吸取敵人的MP' }],
  ['m_drain1', '吸血', 2, 10, { type: 'mag', tgt: 'enemy', pow: 1.2, el: 'dark', drain: true, anim: 'dark', desc: '闇屬性，吸取傷害一半的HP' }],
  ['m_drain2', '吸血之牙', 3, 20, { type: 'mag', tgt: 'enemy', pow: 2.0, el: 'dark', drain: true, anim: 'dark', desc: '闇屬性，吸取HP' }],
  ['m_drain3', '血之宴', 5, 44, { type: 'mag', tgt: 'enemies', pow: 1.6, el: 'dark', drain: true, anim: 'dark', desc: '闇屬性全體，吸取HP' }],
  ['m_mpheal1', '以太之流', 2, 0, { type: 'heal', tgt: 'allyOther', mpHeal: 0.2, anim: 'heal', desc: '把自己20%最大MP分給隊友' }],
  ['m_mpheal2', '魔力之泉', 4, 0, { type: 'heal', tgt: 'allies', mpHealFlat: 40, anim: 'heal', desc: '全體回復40 MP（消耗自己HP的20%）', hpCost: 0.2 }],
  ['m_flare', '魔力爆發', 4, 0, { type: 'mag', tgt: 'enemy', mpBurst: true, anim: 'explode', desc: '消耗所有剩餘MP，MP越多傷害越大' }],
  ['m_star1', '星塵', 1, 6, { type: 'mag', tgt: 'enemies', pow: 0.8, anim: 'meteor', desc: '無屬性全體魔法' }],
  ['m_star2', '星光', 3, 22, { type: 'mag', tgt: 'enemies', pow: 1.6, anim: 'meteor', desc: '無屬性全體魔法' }],
  ['m_star3', '星爆', 5, 50, { type: 'mag', tgt: 'enemies', pow: 3.0, anim: 'meteor', desc: '無屬性全體大魔法' }],
  ['m_bolt1', '魔彈', 1, 3, { type: 'mag', tgt: 'enemy', pow: 1.0, anim: 'scan', desc: '無屬性單體魔法' }],
  ['m_bolt2', '魔砲', 3, 14, { type: 'mag', tgt: 'enemy', pow: 2.3, anim: 'laser', desc: '無屬性單體魔法' }],
  ['m_bolt3', '魔導砲', 5, 36, { type: 'mag', tgt: 'enemy', pow: 4.2, anim: 'laser', desc: '無屬性單體大魔法' }],
  ['m_shatter', '碎盾', 3, 16, { type: 'special', tgt: 'enemy', chip: 1, anim: 'laser', desc: '不管弱點，直接削減1格破防值' }],
  ['m_shattera', '碎盾之雨', 5, 40, { type: 'special', tgt: 'enemies', chip: 1, anim: 'laser', desc: '敵全體各削減1格破防值' }],
  ['m_unresist', '破魔', 3, 12, { type: 'debuff', tgt: 'enemy', unresist: true, anim: 'dark', desc: '使敵人失去所有抗性與重甲，3回合' }],
  ['m_hp2mp', '生命轉換', 2, 0, { type: 'special', tgt: 'self', hp2mp: true, anim: 'heal', desc: '消耗25%最大HP，回復等量的MP' }],
  ['m_sacrifice', '犧牲', 3, 0, { type: 'heal', tgt: 'allies', sacrifice: true, anim: 'heal', desc: '自己剩1 HP，把失去的HP分給全體隊友' }],
  ['m_pray', '祈禱', 1, 6, { type: 'heal', tgt: 'allies', pow: 0.6, base: 20, regenAdd: 2, anim: 'heal', desc: '全體小回復並再生2回合' }],
  ['m_treasure', '尋寶術', 2, 8, { type: 'special', tgt: 'self', dropUp: true, anim: 'scan', desc: '本場戰鬥掉寶率提升' }],
  ['m_gilrain', '金幣雨', 3, 0, { type: 'special', tgt: 'enemies', gilToss: true, anim: 'light', desc: '撒出金幣造成傷害（消耗等級×50 G）' }],
  ['m_mirror', '鏡像', 3, 14, { type: 'buff', tgt: 'self', evadeT: 1, anim: 'buff', desc: '下一次受到的攻擊必定閃開' }],
];
for (const [id, n, t, mp, o] of ARC) addSpell(id, { name: n, school: 'arcane', tier: t, mp, ...o });
// make weak: give the enemy a new weakness so the party can break it
for (const e of ELS) addSpell(`m_weak_${e}`, { name: `${ELEM[e]}之弱化`, school: 'arcane', tier: 2, mp: 10, type: 'debuff', tgt: 'enemy', addWeak: e, anim: EANIM[e], desc: `讓敵人3回合內變成弱${ELEM[e]}屬性（也能用來破防）` });
// pad to exactly 400 with higher-rank variants of the single-element spells
{
  const extra = ['極', '真', '神'];
  let k = 0;
  while (spellOrder.length < 400) {
    const e = ELS[k % 8], r = Math.floor(k / 8) % 3, base = SP[`m_${e}${3 + r}`];
    addSpell(`m_${e}x${r}_${k}`, { ...base, name: extra[r] + base.name.slice(-2), tier: Math.min(5, 3 + r), mp: Math.round(base.mp * 1.3), pow: +(base.pow * 1.15).toFixed(2), hits: r === 2 ? 2 : 1, pow2: true, desc: `${ELEM[e]}屬性單體魔法（強化版${r === 2 ? '，兩連擊' : ''}）` });
    k++;
  }
}
const SCHOOL_N = { black: '黑魔法', white: '白魔法', time: '時空魔法', curse: '咒術', arcane: '秘術' };
for (const id of spellOrder) { SP[id].price = SPRICE[SP[id].tier - 1]; SP[id].spell = true; SKILLS[id] = SP[id]; }
export const SPELLS = spellOrder.slice(0, 400);
export { SCHOOL_N };

// ================================================================ weapon arts (learned by weapon mastery)
export const MASTERY_AT = [0, 8, 25, 60, 120];
const ARTS = {
  sword: [['斬擊', 0, { pow: 1.15 }, '劍屬性單體攻擊'], ['招架架式', 4, { type: 'buff', tgt: 'self', stance: 'parry', pow: 0 }, '本回合擋開所有物理攻擊並反擊'], ['十字斬', 8, { pow: 0.75, hits: 2 }, '兩連擊，適合破防'], ['劍氣', 10, { pow: 1.2, ranged: true, tgt: 'enemies' }, '劍氣打全體，飛行敵人也不減傷'], ['破鋒', 16, { pow: 1.6, dispel: true }, '攻擊並消除敵人的強化']],
  greatsword: [['橫掃', 0, { pow: 0.9, tgt: 'enemies' }, '大劍橫掃全體'], ['蓄力斬', 6, { type: 'special', tgt: 'self', charge: true }, '蓄力，下一次攻擊傷害×2.5'], ['破山', 12, { pow: 1.4, chip: 1 }, '不管弱點，削減1格破防值'], ['地裂斬', 16, { pow: 1.3, tgt: 'enemies', el: 'earth' }, '大劍＋土屬性全體攻擊'], ['捨身斬', 20, { pow: 3.0, recoil: 0.15 }, '超大傷害，自己受到15%最大HP反傷']],
  dagger: [['雙牙', 0, { pow: 0.55, hits: 2 }, '兩連擊'], ['偷竊', 0, { type: 'special', steal: true }, '偷取道具'], ['偷襲', 6, { pow: 1.3, vsHelpless: 2.0 }, '對破防、睡眠、暈眩、停止的敵人傷害×2'], ['毒刃', 8, { pow: 1.0, status: 'poison', chance: 0.9 }, '高機率中毒'], ['影縫', 16, { pow: 0.8, status: 'stop', chance: 0.5 }, '50%機率使敵人停止']],
  katana: [['居合', 0, { pow: 1.4, iai: true }, '如果是本回合第一個行動，必定會心'], ['燕返', 8, { pow: 0.8, hits: 2, critUp: 0.3 }, '兩連擊，會心率高'], ['明鏡止水', 10, { type: 'buff', tgt: 'self', stance: 'counter', pow: 0 }, '本回合反擊所有物理攻擊'], ['霞斬', 14, { pow: 1.1, tgt: 'enemies' }, '全體攻擊'], ['一閃', 24, { pow: 3.6, critUp: 0.5 }, '必殺的一刀']],
  spear: [['突刺', 0, { pow: 1.05, pierce2: true }, '刺穿兩名敵人'], ['跳躍', 6, { pow: 2.1, jump: true }, '跳上高空，下回合降落造成大傷害'], ['迴旋槍', 10, { pow: 1.0, tgt: 'enemies' }, '全體攻擊'], ['穿甲刺', 12, { pow: 1.5, ignoreDef: 0.5, vsArmor: 1.5 }, '無視一半防禦，對重甲×1.5'], ['龍騎衝', 22, { pow: 2.2, jump: true, tgt: 'enemies' }, '跳躍後對全體降落']],
  axe: [['劈砍', 0, { pow: 1.15, debuff: { def: 1 } }, '攻擊並降低防禦1級'], ['碎甲', 8, { pow: 1.3, debuff: { def: 2 }, unarmor: true }, '降低防禦2級並擊碎重甲'], ['狂暴斧', 12, { pow: 0.6, hits: 4, tgt: 'random' }, '隨機四連擊'], ['投斧', 10, { pow: 1.2, ranged: true }, '遠程攻擊，飛行敵人不減傷'], ['戰吼', 14, { type: 'buff', tgt: 'self', buff: { atk: 2 }, taunt: 2, pow: 0 }, '攻擊提升2級並吸引敵人攻擊']],
  hammer: [['震擊', 0, { pow: 1.1, delayT: true }, '把敵人本回合的行動延到最後'], ['碎盾擊', 8, { pow: 1.0, chip: 1 }, '不管弱點，削減1格破防值'], ['地震鎚', 12, { pow: 1.0, tgt: 'enemies', el: 'earth', status: 'stun', chance: 0.25 }, '土屬性全體攻擊，可能暈眩'], ['粉碎', 14, { pow: 1.5, vsArmor: 2.0 }, '對重甲敵人傷害×2'], ['迴天鎚', 22, { pow: 2.4, status: 'stun', chance: 0.6 }, '重擊，高機率暈眩']],
  bow: [['瞄準射擊', 0, { pow: 1.1, reveal: true }, '攻擊並看穿一個弱點'], ['連射', 6, { pow: 0.5, hits: 3 }, '三連射'], ['落鷹箭', 10, { pow: 1.2, vsFly: 2.0, ground: true }, '對飛行敵人×2，並把它打下來2回合'], ['麻痺箭', 12, { pow: 0.9, status: 'stun', chance: 0.6 }, '高機率暈眩'], ['箭雨', 18, { pow: 0.55, hits: 3, tgt: 'enemies' }, '全體三連擊']],
  gun: [['速射', 0, { pow: 0.6, hits: 2, pierce: true }, '無視防禦的兩連射'], ['弱點彈', 6, { pow: 1.2, weakEl: true }, '自動換上敵人已知弱點屬性的子彈'], ['散彈', 10, { pow: 0.8, tgt: 'enemies', pierce: true }, '無視防禦的全體攻擊'], ['穿甲彈', 12, { pow: 1.3, unarmor: true, pierce: true }, '擊碎敵人的重甲'], ['狙擊', 20, { pow: 3.0, pierce: true }, '一發超大傷害']],
  staff: [['杖擊', 0, { pow: 1.0, mpGain: 4 }, '攻擊並回復4 MP'], ['祈禱', 4, { type: 'heal', tgt: 'allies', pow: 0.7, base: 25 }, '全體小回復'], ['魔力轉換', 8, { type: 'heal', tgt: 'allyOther', mpHeal: 0.25 }, '把自己25%最大MP分給隊友'], ['聖光杖', 12, { type: 'mag', pow: 1.6, el: 'light' }, '光屬性魔法攻擊'], ['守護結界', 18, { type: 'buff', tgt: 'allies', buff: { spr: 2, def: 1 } }, '全體精神+2、防禦+1']],
  rod: [['魔力彈', 0, { type: 'mag', pow: 1.0 }, '無屬性魔法攻擊'], ['元素增幅', 4, { type: 'buff', tgt: 'self', amp: 1.6 }, '下一個魔法威力×1.6'], ['屬性附魔', 10, { type: 'buff', tgt: 'allies', enchant: true }, '3回合內全隊普通攻擊帶上魔杖的屬性（沒有則為火）'], ['雙重詠唱', 16, { type: 'buff', tgt: 'self', dualNext: true }, '下一個魔法連續施放兩次'], ['魔力吸取', 12, { type: 'mag', osmose: true, pow: 0.6 }, '吸取敵人MP']],
  knuckle: [['連拳', 0, { pow: 0.45, hits: 3 }, '三連擊'], ['氣功波', 6, { pow: 1.2, ranged: true, pierce: true }, '遠程，無視防禦'], ['崩拳', 10, { pow: 1.3, chip: 1, status: 'stun', chance: 0.3 }, '削減1格破防值，可能暈眩'], ['百裂拳', 16, { pow: 0.4, hits: 6, tgt: 'random' }, '隨機六連擊'], ['氣合', 12, { type: 'heal', tgt: 'self', pow: 0, base: 0, healP: 0.3, buff: { atk: 1 } }, '回復30% HP並提升攻擊']],
  whip: [['鞭笞', 0, { pow: 0.6, tgt: 'enemies' }, '全體攻擊'], ['纏繞', 6, { pow: 0.8, status: 'slow', chance: 0.9 }, '高機率緩速'], ['馴服', 10, { pow: 0.5, status: 'confuse', chance: 0.6 }, '使敵人混亂'], ['鞭擊連舞', 14, { pow: 0.55, hits: 4, tgt: 'random' }, '隨機四連擊'], ['弱點抽打', 12, { pow: 0.8, tgt: 'enemies', reveal: true }, '全體攻擊並看穿弱點']],
  boomerang: [['迴旋', 0, { pow: 0.75, tgt: 'enemies' }, '全體攻擊'], ['雙迴旋', 8, { pow: 0.5, hits: 2, tgt: 'enemies' }, '全體兩連擊'], ['截擊', 10, { pow: 1.2, vsFly: 2.0 }, '對飛行敵人×2'], ['回馬鏢', 12, { pow: 1.0, steal: true }, '攻擊並偷取道具'], ['風車', 18, { pow: 1.2, tgt: 'enemies', el: 'wind' }, '風屬性全體攻擊']],
  harp: [['戰歌', 0, { type: 'buff', tgt: 'allies', buff: { atk: 1, mag: 1 } }, '全體攻擊、魔力+1'], ['安魂曲', 6, { type: 'buff', tgt: 'allies', regen: 3 }, '全體再生3回合'], ['搖籃曲', 10, { type: 'debuff', tgt: 'enemies', status: 'sleep', chance: 0.5 }, '使敵全體睡眠'], ['疾風之歌', 14, { type: 'buff', tgt: 'allies', buff: { spd: 1 } }, '全體速度+1'], ['終章', 20, { type: 'debuff', tgt: 'enemies', debuff: { atk: 1, mag: 1, spd: 1 } }, '敵全體攻擊、魔力、速度-1']],
  tome: [['書頁風暴', 0, { type: 'mag', pow: 0.5, hits: 3, tgt: 'random', randEl: true }, '隨機屬性的三連擊'], ['知識之光', 6, { type: 'special', tgt: 'enemies', analyze: true }, '看穿敵全體所有弱點'], ['封印術', 10, { type: 'debuff', tgt: 'enemy', status: 'silence', chance: 0.9 }, '高機率沉默'], ['引用', 12, { type: 'mag', pow: 1.8, weakEl: true }, '施放敵人已知弱點屬性的魔法'], ['賢者之言', 18, { type: 'buff', tgt: 'allies', buff: { mag: 2 } }, '全體魔力+2']],
  shield: [['盾擊', 0, { pow: 0.9, status: 'stun', chance: 0.3, byDef: true }, '傷害取決於防禦，可能暈眩'], ['掩護', 4, { type: 'buff', tgt: 'self', stance: 'cover', pow: 0 }, '本回合替所有隊友承受攻擊'], ['鐵壁', 8, { type: 'buff', tgt: 'self', buff: { def: 2, spr: 2 }, stance: 'wall', pow: 0 }, '防禦精神+2，本回合格擋率100%'], ['反射盾', 12, { type: 'buff', tgt: 'self', status: 'reflect', self: true }, '反射魔法3回合'], ['衝鋒盾', 18, { pow: 1.6, byDef: true, delayT: true }, '依防禦造成傷害並延遲敵人行動']],
};
export const ARTS_BY_TYPE = {};
for (const [wt, list] of Object.entries(ARTS)) {
  ARTS_BY_TYPE[wt] = [];
  list.forEach(([name, mp, o, desc], i) => {
    const id = `a_${wt}_${i}`;
    const isPhys = !o.type || o.type === 'phys';
    SKILLS[id] = { name, mp, type: 'phys', tgt: 'enemy', wpn: wt === 'shield' ? undefined : wt, anim: wt === 'bow' || wt === 'gun' ? 'arrow' : wt === 'spear' ? 'thrust' : o.tgt === 'enemies' ? 'wave' : o.hits > 1 ? 'slash2' : 'slash', desc, art: wt, lvl: i, ...o };
    if (!isPhys && !o.anim) SKILLS[id].anim = o.type === 'heal' ? 'heal' : o.type === 'debuff' ? (o.status === 'sleep' ? 'song' : 'dark') : o.type === 'mag' ? (o.el ? EANIM[o.el] : 'scan') : wt === 'harp' ? 'song' : 'buff';
    if (wt === 'tome' && o.type === 'mag') SKILLS[id].wpn = undefined;
    ARTS_BY_TYPE[wt].push(id);
  });
}

// ================================================================ equipment
const gearList = [];
const put = (id, g) => { GEAR[id] = g; gearList.push(id); };
// spell teaching: spread every spell over the equipment that matches its tier
const spellsAtTier = [1, 2, 3, 4, 5].map(t => SPELLS.filter(s => SKILLS[s].tier === t));
const teachPick = (() => { const idx = [0, 0, 0, 0, 0]; return (itemTier, schools) => { const st = Math.min(5, Math.ceil((itemTier + 1) * 5 / 8)); const pool = spellsAtTier[st - 1].filter(s => !schools || schools.includes(SKILLS[s].school)); const list = pool.length ? pool : spellsAtTier[st - 1]; const s = list[idx[st - 1] % list.length]; idx[st - 1]++; return s; }; })();
const apFor = (s) => 15 + SKILLS[s].tier * 15;
function mergeFx(a, b) {
  const o = { ...a };
  for (const k in b) {
    if (typeof b[k] === 'number') o[k] = (o[k] || 0) + b[k];
    else if (Array.isArray(b[k])) o[k] = [...(o[k] || []), ...b[k]];
    else if (typeof b[k] === 'object') { o[k] = { ...(o[k] || {}) }; for (const j in b[k]) o[k][j] = k === 'resist' ? Math.min(o[k][j] ?? 1, b[k][j]) : k === 'slay' ? Math.max(o[k][j] || 1, b[k][j]) : (o[k][j] || 0) + b[k][j]; }
    else o[k] = b[k];
  }
  return o;
}
export { mergeFx };
const STATKEYS = ['hp', 'mp', 'atk', 'def', 'mag', 'spr', 'spd'];
function variant(baseId, aff, schools) {
  const B = GEAR[baseId], [aid, prefix, fn] = aff;
  const f = fn(B.tier);
  const g = { ...B, name: prefix + B.name, price: Math.round(B.price * 1.8), base: baseId, affix: aid, fx: mergeFx(B.fx || {}, Object.fromEntries(Object.entries(f).filter(([k]) => !STATKEYS.includes(k)))), rare: true };
  for (const k of STATKEYS) { if (g[k]) g[k] = Math.round(g[k] * 1.08); if (f[k]) g[k] = (g[k] || 0) + f[k]; }
  const s = teachPick(B.tier, schools); g.teach = s; g.ap = apFor(s);
  put(baseId + '_' + aid, g);
}
// weapons
for (const [wt, W] of Object.entries(WTYPES)) {
  const mats = MATS[W.mat];
  for (let t = 0; t < 8; t++) {
    const id = `g_${wt}${t + 1}`, k = W.h === 2 ? 1 : 1;
    const g = { name: mats[t] + W.noun, slot: 'hand', type: wt, hands: W.h, tier: t, price: Math.round(T_PRICE[t] * (W.h === 2 ? 1.3 : 1)), atk: Math.max(1, Math.round(T_ATK[t] * W.atk * k)) };
    if (W.mag) g.mag = Math.round(T_ATK[t] * W.mag);
    if (wt === 'staff') g.spr = Math.round(T_ATK[t] * 0.25);
    if (W.spd) g.spd = W.spd;
    put(id, g);
  }
}
// shields
for (const [sk, S] of Object.entries(SHIELD_KINDS)) for (let t = 0; t < 8; t++) {
  const id = `g_${sk}${t + 1}`;
  const g = { name: MATS.metal[t] + S.n, slot: 'hand', type: 'shield', kind: sk, hands: 1, tier: t, price: Math.round(T_PRICE[t] * 0.8), def: Math.round(T_DEF[t] * 0.3 * S.def), spr: Math.round(T_DEF[t] * 0.2 * S.spr), fx: { block: S.block + t * 0.01, ...(S.mblock ? { mblock: S.mblock } : {}) } };
  if (S.spd) g.spd = S.spd;
  put(id, g);
}
// armor: 7 places x 3 styles
export const ARMOR_SLOTS = { head: '頭', body: '身體', arms: '手', waist: '腰', legs: '腿', feet: '腳', back: '背' };
const SLOT_W = { head: 0.22, body: 0.5, arms: 0.15, waist: 0.12, legs: 0.22, feet: 0.15, back: 0.14 };
const ARMOR_N = {
  heavy: { head: '頭盔', body: '鎧甲', arms: '護手', waist: '腰甲', legs: '護腿', feet: '鐵靴', back: '披風' },
  light: { head: '皮帽', body: '皮甲', arms: '手套', waist: '皮帶', legs: '皮褲', feet: '皮靴', back: '斗篷' },
  robe: { head: '法帽', body: '法袍', arms: '法術手套', waist: '腰飾', legs: '綁腿', feet: '布鞋', back: '披肩' },
};
const ARMOR_MAT = { heavy: MATS.metal, light: ['麻布', '皮革', '硬革', '銀狼', '秘銀絲', '精靈', '龍鱗', '星輝'], robe: ['棉', '絲綢', '月光', '白銀', '秘銀', '精靈', '龍紋', '星辰'] };
export const STYLE_N = { heavy: '重裝', light: '輕裝', robe: '法衣' };
for (const slot of Object.keys(ARMOR_SLOTS)) for (const style of ['heavy', 'light', 'robe']) for (let t = 0; t < 8; t++) {
  const D = T_DEF[t] * SLOT_W[slot];
  const g = { name: ARMOR_MAT[style][t] + ARMOR_N[style][slot], slot, style, tier: t, price: Math.round(T_PRICE[t] * SLOT_W[slot] * 1.4) };
  if (style === 'heavy') { g.def = Math.round(D); g.spr = Math.round(D * 0.3); if (slot === 'body' || slot === 'feet') g.spd = -1; if (slot === 'body') g.hp = 10 + t * 25; }
  if (style === 'light') { g.def = Math.round(D * 0.7); g.spr = Math.round(D * 0.5); if (slot === 'feet' || slot === 'legs') g.spd = 1 + (t >> 2); if (slot === 'arms') g.atk = 1 + t; }
  if (style === 'robe') { g.def = Math.round(D * 0.45); g.spr = Math.round(D * 1.0); g.mag = Math.round(D * 0.5); if (slot === 'body' || slot === 'head') g.mp = 5 + t * 8; }
  for (const k of STATKEYS) if (!g[k]) delete g[k];
  put(`g_${slot}_${style}${t + 1}`, g);
}
// variants: 4 per weapon, 2 per shield and armor piece
{
  let wi = 0;
  for (const [wt] of Object.entries(WTYPES)) for (let t = 0; t < 8; t++) {
    const base = `g_${wt}${t + 1}`, used = new Set();
    for (let n = 0; n < 4; n++) {
      let a; do { a = W_AFFIX[(wi * 7 + n * 11 + t * 3) % W_AFFIX.length]; wi++; } while (used.has(a[0]));
      used.add(a[0]);
      variant(base, a, ['black', 'arcane', 'curse', 'time']);
    }
  }
  let si = 0;
  for (const sk of Object.keys(SHIELD_KINDS)) for (let t = 0; t < 8; t++) for (let n = 0; n < 2; n++) { variant(`g_${sk}${t + 1}`, A_AFFIX[(si * 5 + n * 13) % A_AFFIX.length], ['white', 'time']); si++; }
  let ai = 0;
  for (const slot of Object.keys(ARMOR_SLOTS)) for (const style of ['heavy', 'light', 'robe']) for (let t = 0; t < 8; t++) {
    const base = `g_${slot}_${style}${t + 1}`; const a1 = A_AFFIX[(ai * 7) % A_AFFIX.length], a2 = A_AFFIX[(ai * 7 + 17) % A_AFFIX.length]; ai++;
    variant(base, a1, ['white', 'time', 'arcane']); if (a2[0] !== a1[0]) variant(base, a2, ['white', 'curse', 'black']);
  }
}
// accessories
const ACC = [];
const acc = (name, tier, o, desc) => ACC.push([name, tier, o, desc]);
for (const [k, names] of Object.entries({ atk: ['力量戒指', '巨力戒指', '神力戒指'], def: ['守護手環', '鋼鐵手環', '金剛手環'], mag: ['魔力耳環', '魔導耳環', '賢者耳環'], spr: ['精神護符', '心眼護符', '聖心護符'], spd: ['疾風羽飾', '迅雷羽飾', '神速羽飾'], hp: ['生命護符', '活力護符', '巨人護符'], mp: ['魔力項鍊', '魔泉項鍊', '星海項鍊'] }))
  names.forEach((n, i) => acc(n, [1, 3, 6][i], { [k]: [k === 'hp' ? 80 : k === 'mp' ? 20 : 5, k === 'hp' ? 220 : k === 'mp' ? 50 : 12, k === 'hp' ? 500 : k === 'mp' ? 100 : 24][i] }, ''));
for (const e of ELS) { acc(`${ELEM[e]}之戒`, 2, { fx: { resist: { [e]: 0.5 } } }, `${ELEM[e]}屬性傷害減半`); acc(`${ELEM[e]}龍之戒`, 6, { fx: { resist: { [e]: -0.5 } } }, `吸收${ELEM[e]}屬性`); }
for (const [s, n] of [['poison', '解毒徽章'], ['sleep', '清醒之鈴'], ['silence', '言靈石'], ['blind', '鷹眼石'], ['stun', '不動石'], ['doom', '生命之沙'], ['confuse', '冷靜之香'], ['curse', '聖潔之鏡']]) acc(n, 2, { fx: { immune: [s, ...(s === 'stun' ? ['stop'] : s === 'curse' ? ['slow'] : [])] } }, `防止${STATUS_N[s]}`);
for (const [s, n, t] of [['regen', '再生之環', 3], ['haste', '加速手環', 5], ['reflect', '反射戒指', 5], ['protect', '護佑徽章', 3], ['shell', '魔障徽章', 3]]) acc(n, t, { fx: { auto: [s] } }, `戰鬥開始時自動${STATUS_N[s]}`);
const ACC_FX = [
  ['反擊', { counter: 0.3 }, '受到物理攻擊時30%反擊'], ['騎士', { cover: 1 }, '替瀕死的隊友承受攻擊'], ['閃避', { evade: 0.12 }, '閃避率+12%'], ['會心', { crit: 0.15 }, '會心率+15%'],
  ['連擊', { dbl: 0.25 }, '普通攻擊25%機率再攻擊一次'], ['吸血', { drain: 0.15 }, '物理傷害的15%轉為HP'], ['吸魂', { mpdrain: 0.05 }, '物理傷害的5%轉為MP'], ['先制', { first: 1 }, '戰鬥第一回合最先行動'],
  ['不屈', { survive: 1 }, '受到致命傷時以1HP存活一次'], ['荊棘', { thorns: 0.25 }, '受到物理攻擊時反彈25%傷害'], ['激昂', { limitup: 0.4 }, '極限值累積+40%'], ['節約', { mpcost: 0.25 }, 'MP消耗-25%'],
  ['慈愛', { healup: 0.3 }, '回復量+30%'], ['背水', { lowhp: 0.8 }, 'HP越低攻擊越強（最多+80%）'], ['破甲', { brk: 0.2 }, '20%機率不打弱點也削減破防值'], ['神偷', { steal: 0.5 }, '偷竊成功率+50%'],
];
const ACC_TIER_N = [['護符', '徽章'], ['之證', '寶石']];
for (const [n, fx, d] of ACC_FX) { acc(n + '護符', 2, { fx }, d); acc(n + '寶珠', 6, { fx: Object.fromEntries(Object.entries(fx).map(([k, v]) => [k, typeof v === 'number' && v < 1 ? +(v * 1.8).toFixed(2) : v])) }, d + '（強化）'); }
for (const [f, n] of Object.entries({ dragon: '屠龍', undead: '破邪', beast: '獵獸', machine: '斬鐵', flying: '落鷹', plant: '伐木', aquatic: '淨海', spirit: '鎮魂' })) acc(`${n}之牙`, 3, { fx: { slay: { [f]: 1.5 } } }, `對${FAM_N[f]}傷害×1.5`);
for (const [n, fx, d, t] of [['學者眼鏡', { exp: 0.3 }, '經驗值+30%', 2], ['賢者眼鏡', { exp: 0.6 }, '經驗值+60%', 6], ['招財貓', { gil: 0.5 }, '金幣+50%', 2], ['黃金招財貓', { gil: 1.0 }, '金幣+100%', 6], ['尋寶羅盤', { drop: 0.5 }, '掉寶率+50%', 3], ['寶藏地圖', { drop: 1.0 }, '掉寶率+100%', 7], ['隱者斗笠', { enc: -0.5 }, '遇敵率減半', 3], ['挑戰者徽章', { enc: 0.8 }, '遇敵率提升', 2], ['學習之書', { ap: 0.5 }, '學習魔法的AP+50%', 3], ['大學習之書', { ap: 1.0 }, 'AP加倍', 6], ['迴響耳飾', { limitup: 0.2, mpregen: 0.03 }, '極限+20%、每回合回復MP', 4], ['旅人的鈴鐺', { enc: -0.25, exp: 0.1 }, '遇敵率-25%、經驗+10%', 1]]) acc(n, t, { fx }, d);
ACC.forEach(([name, tier, o, desc], i) => {
  const id = `g_acc${i + 1}`;
  const g = { name, slot: 'acc', tier, price: Math.round(T_PRICE[tier] * 0.9), desc, ...o };
  const s = teachPick(tier, null); g.teach = s; g.ap = apFor(s);
  put(id, g);
});
// legacy equipment keeps its id but moves to the new slots
for (const [id, g] of Object.entries(GEAR)) {
  if (g.slot === 'w') { g.slot = 'hand'; g.hands = WTYPES[g.type]?.h || 1; g.tier = Math.min(7, Math.floor((g.atk || 8) / 12)); }
  else if (g.slot === 'a') { g.slot = 'body'; g.style = g.mag || g.spr > g.def ? 'robe' : g.def >= 13 ? 'heavy' : 'light'; g.tier = Math.min(7, Math.floor((g.def || 3) / 6)); }
  else if (g.slot === 'x') { g.slot = 'acc'; g.tier = 3; if (g.immune) g.fx = { immune: ['poison', 'sleep', 'silence', 'blind', 'slow', 'stun', 'stop', 'doom', 'confuse', 'curse'] }; }
}
export const GEAR_COUNT = Object.keys(GEAR).length;

// refined (+N) and enchanted (@element) equipment are made on the fly from their base
setGearResolver((id) => {
  const m = /^(.+?)(?:\+(\d))?(?:@(\w+))?$/.exec(id); if (!m || (!m[2] && !m[3])) return undefined;
  const B = GEAR[m[1]]; if (!B) return undefined;
  const n = +(m[2] || 0), e = m[3];
  const g = { ...B, name: B.name + (n ? '+' + n : '') + (e ? `〔${ELEM[e]}〕` : ''), price: Math.round((B.price || 500) * (1 + n * 0.3) * (e ? 1.4 : 1)), refine: n, enchant: e, base: B.base || m[1] };
  for (const k of STATKEYS) if (g[k] > 0) g[k] = Math.round(g[k] * (1 + n * 0.08));
  if (e) g.fx = mergeFx(B.fx || {}, B.slot === 'hand' && B.type !== 'shield' ? { el: e } : { resist: { [e]: 0.5 } });
  return g;
});

// ================================================================ items (500)
const itemList = [];
const addI = (id, o) => { if (!ITEMS[id]) ITEMS[id] = o; itemList.push(id); };
for (const id of Object.keys(ITEMS)) itemList.push(id);
const HPN = [['i_hp3', '特級回復藥', 900, 300], ['i_hp4', '萬能回復藥', 1600, 600], ['i_hp5', '生命之水', 2600, 1000], ['i_hp6', '仙丹', 4000, 1600], ['i_hp7', '天使之淚', 6500, 2600]];
for (const [id, n, h, p] of HPN) addI(id, { name: n, price: p, use: { heal: h }, tgt: 'ally', desc: `回復${h} HP`, cat: 'heal' });
for (const [id, n, m, p] of [['i_mp3', '特級魔力水', 300, 1200], ['i_mp4', '魔力結晶', 500, 2200], ['i_mp5', '魔力精華', 999, 4000]]) addI(id, { name: n, price: p, use: { mp: m }, tgt: 'ally', desc: `回復${m} MP`, cat: 'heal' });
for (const [id, n, h, m, p] of [['i_el1', '小靈藥', 500, 60, 900], ['i_el2', '靈藥', 2000, 200, 3000], ['i_el3', '神之靈藥', 9999, 999, 9000]]) addI(id, { name: n, price: p, use: { heal: h, mp: m }, tgt: 'ally', desc: `回復${h >= 9999 ? '全部' : h} HP 和 ${m >= 999 ? '全部' : m} MP`, cat: 'heal' });
for (const [id, n, h, p] of [['i_ga2', '群體高級藥', 800, 1200], ['i_ga3', '群體特級藥', 1600, 2600], ['i_ga4', '生命之霧', 3000, 5000], ['i_ga5', '天使之歌盒', 9999, 9000]]) addI(id, { name: n, price: p, use: { heal: h }, tgt: 'allies', desc: `全體回復${h >= 9999 ? '全部' : h} HP`, cat: 'heal' });
for (const [id, n, m, p] of [['i_gm1', '魔力霧', 80, 1500], ['i_gm2', '魔力之雨', 250, 4500]]) addI(id, { name: n, price: p, use: { mp: m }, tgt: 'allies', desc: `全體回復${m} MP`, cat: 'heal' });
for (const [s, n, p] of [['poison', '解毒草', 15], ['sleep', '醒神鈴', 20], ['silence', '潤喉糖', 20], ['blind', '眼藥水', 20], ['slow', '活力藥', 30], ['stun', '鎮定劑', 30], ['confuse', '鎮靜香', 30], ['curse', '聖水', 60]]) addI(`i_c_${s}`, { name: n, price: p, use: { cureOnly: [s, ...(s === 'curse' ? ['doom'] : s === 'stun' ? ['stop'] : [])] }, tgt: 'ally', desc: `解除${STATUS_N[s]}`, cat: 'cure' });
addI('i_c_all', { name: '群體萬能藥', price: 300, use: { cure: true }, tgt: 'allies', desc: '解除全體異常狀態', cat: 'cure' });
for (const [id, n, r, p, tg] of [['i_rv2', '鳳凰之羽', 0.5, 800, 'dead'], ['i_rv3', '鳳凰之尾', 1, 2000, 'dead'], ['i_rv4', '不死鳥之火', 0.5, 6000, 'deadAll']]) addI(id, { name: n, price: p, use: { revive: r }, tgt: tg === 'deadAll' ? 'allies' : 'dead', desc: tg === 'deadAll' ? '全體復活（50% HP）' : `復活並回復${r * 100}% HP`, cat: 'revive' });
const THROW = { fire: ['炸彈碎片', '火焰瓶', '爆炎石', '紅蓮之核'], ice: ['冰晶碎片', '寒冰瓶', '霜凍石', '冰魔之核'], thunder: ['雷光碎片', '雷鳴瓶', '電光石', '雷神之核'], water: ['水泡珠', '激流瓶', '怒濤石', '海神之核'], wind: ['風之羽', '旋風瓶', '疾風石', '天嵐之核'], earth: ['碎石袋', '岩石瓶', '地裂石', '大地之核'], light: ['閃光粉', '聖光瓶', '天使石', '聖王之核'], dark: ['暗影粉', '毒煙瓶', '冥界石', '魔王之核'] };
for (const e of ELS) THROW[e].forEach((n, t) => { const id = t === 0 && ({ fire: 'bombfrag', ice: 'frostfrag', thunder: 'boltfrag' })[e] || `i_t_${e}${t + 1}`; addI(id, { name: n, price: [80, 300, 900, 2400][t], use: { dmg: [160, 450, 1100, 2600][t], el: e }, tgt: t === 0 || t === 2 ? 'enemies' : 'enemy', desc: `${ELEM[e]}屬性${t === 0 || t === 2 ? '全體' : '單體'}傷害${[160, 450, 1100, 2600][t]}（打中弱點會破防）`, cat: 'throw' }); });
for (const [w, n1, n2] of [['dagger', '飛刀', '暗殺飛刀'], ['spear', '投槍', '龍騎投槍'], ['axe', '手斧', '戰斧迴旋'], ['hammer', '鐵球', '流星錘'], ['bow', '箭束', '神射箭'], ['gun', '子彈包', '炸裂彈'], ['boomerang', '迴力標', '風神迴力標'], ['sword', '手裏劍', '風魔手裏劍']]) {
  addI(`i_tw_${w}1`, { name: n1, price: 120, use: { dmg: 220, wpn: w }, tgt: 'enemy', desc: `${WPN[w]}屬性單體傷害220（打中弱點會破防）`, cat: 'throw' });
  addI(`i_tw_${w}2`, { name: n2, price: 1200, use: { dmg: 1200, wpn: w }, tgt: 'enemies', desc: `${WPN[w]}屬性全體傷害1200`, cat: 'throw' });
}
for (const [s, n1, n2] of [['poison', '毒針', '毒霧彈'], ['sleep', '催眠香', '大催眠香'], ['silence', '封口符', '封印卷'], ['blind', '墨汁', '煙霧墨汁'], ['slow', '遲緩粉', '泥沼粉'], ['stun', '閃光彈', '震撼彈'], ['doom', '死神卡', '死神之鐮'], ['confuse', '混亂香', '狂亂鈴']]) {
  addI(`i_s_${s}1`, { name: n1, price: 100, use: { status: s, chance: 0.8 }, tgt: 'enemy', desc: `使單體${STATUS_N[s]}`, cat: 'throw' });
  addI(`i_s_${s}2`, { name: n2, price: 400, use: { status: s, chance: 0.6 }, tgt: 'enemies', desc: `使敵全體${STATUS_N[s]}`, cat: 'throw' });
}
for (const [k, n] of [['atk', '力量'], ['def', '鐵壁'], ['mag', '智慧'], ['spr', '心靈'], ['spd', '迅捷']]) {
  ['藥', '大藥', '極藥'].forEach((sfx, t) => addI(`i_b_${k}${t + 1}`, { name: n + sfx, price: [80, 300, 900][t], use: { buff: { [k]: t + 1 } }, tgt: 'ally', desc: `${STAT_N[k]}提升${t + 1}級`, cat: 'buff' }));
  ['香', '聖香'].forEach((sfx, t) => addI(`i_ba_${k}${t + 1}`, { name: n + sfx, price: [400, 1500][t], use: { buff: { [k]: t + 1 } }, tgt: 'allies', desc: `全體${STAT_N[k]}提升${t + 1}級`, cat: 'buff' }));
}
for (const [id, n, o, d, p] of [['i_haste', '加速藥', { status: 'haste' }, '加速4回合', 300], ['i_reflect', '反射鏡', { status: 'reflect' }, '反射魔法3回合', 500], ['i_regen', '再生藥', { regen: 4 }, '再生4回合', 200], ['i_reraise', '天使的護符', { status: 'reraise' }, '倒下時自動復活一次', 1500], ['i_mirror', '幻影粉', { evadeT: 1 }, '下一次攻擊必定閃開', 400]]) addI(id, { name: n, price: p, use: { ...o, self: true }, tgt: 'ally', desc: d, cat: 'buff' });
for (const [k, n1, n2, v1, v2] of [['hp', '生命之種', '生命之果', 20, 60], ['mp', '魔力之種', '魔力之果', 5, 15], ['atk', '力量之種', '力量之果', 1, 3], ['def', '守護之種', '守護之果', 1, 3], ['mag', '智慧之種', '智慧之果', 1, 3], ['spr', '心靈之種', '心靈之果', 1, 3], ['spd', '迅捷之種', '迅捷之果', 1, 2]]) {
  addI(`i_seed_${k}`, { name: n1, price: 0, sell: 300, use: { grow: { [k]: v1 } }, field: true, tgt: 'ally', desc: `永久提升${STAT_N[k]} ${v1}`, cat: 'seed' });
  addI(`i_fruit_${k}`, { name: n2, price: 0, sell: 900, use: { grow: { [k]: v2 } }, field: true, tgt: 'ally', desc: `永久提升${STAT_N[k]} ${v2}`, cat: 'seed' });
}
const FOODS = [['烤魚', { start: { atk: 1 } }], ['海鮮湯', { start: { spr: 1 } }], ['野菜燉肉', { start: { def: 1 } }], ['蘋果派', { start: { spd: 1 } }], ['香料咖哩', { start: { atk: 1, mag: 1 } }], ['蜂蜜蛋糕', { start: { mag: 1 } }], ['蘑菇濃湯', { auto: ['regen'] }], ['烤羊排', { start: { atk: 2 } }], ['龍蝦鍋', { start: { def: 2, spr: 1 } }], ['水晶果凍', { start: { mag: 2 } }],
  ['港口漁夫飯', { exp: 0.2 }], ['商人便當', { gil: 0.3 }], ['獵人肉乾', { drop: 0.3 }], ['戰士早餐', { limit: 30 }], ['騎士牛排', { start: { atk: 1, def: 1 } }], ['精靈沙拉', { start: { spr: 2 } }], ['冰淇淋', { resist: { fire: 0.5 } }], ['熱可可', { resist: { ice: 0.5 } }], ['烤地瓜', { resist: { earth: 0.5 } }], ['薑汁湯', { resist: { water: 0.5 } }],
  ['雷鳥蛋捲', { resist: { thunder: 0.5 } }], ['風乾火腿', { resist: { wind: 0.5 } }], ['聖誕布丁', { resist: { light: 0.5 } }], ['黑巧克力', { resist: { dark: 0.5 } }], ['極品壽司', { start: { atk: 1, mag: 1, spd: 1 } }], ['鐵砧炭烤', { start: { atk: 2, def: 1 } }], ['水都燉飯', { start: { mag: 2, spr: 1 } }], ['天空蛋糕', { start: { spd: 2 } }], ['迴響茶', { mpregen: 0.05 }], ['煎餅', { first: 1 }],
  ['辣味炒麵', { crit: 0.1 }], ['甜甜圈', { limit: 50 }], ['藥膳雞湯', { auto: ['regen'], start: { spr: 1 } }], ['皇家套餐', { start: { atk: 2, def: 2, mag: 2, spr: 2 } }], ['冒險者三明治', { exp: 0.1, gil: 0.1 }], ['月光酒', { start: { mag: 1 }, mpregen: 0.03 }], ['勇者拉麵', { start: { atk: 3 } }], ['賢者茶點', { start: { mag: 3 } }], ['守衛乾糧', { start: { def: 3 } }], ['疾風烤串', { start: { spd: 3 } }]];
FOODS.forEach(([n, fx], i) => addI(`i_food${i + 1}`, { name: n, price: 80 + (i % 10) * 40 + Math.floor(i / 10) * 200, use: { meal: fx }, field: true, desc: '料理：之後5場戰鬥都有效果　' + mealDesc(fx), cat: 'food' }));
function mealDesc(fx) { const o = []; if (fx.start) o.push(Object.entries(fx.start).map(([k, v]) => STAT_N[k] + '+' + v).join('、') + '（戰鬥開始時）'); if (fx.auto) o.push('自動再生'); if (fx.exp) o.push(`經驗+${fx.exp * 100}%`); if (fx.gil) o.push(`金幣+${fx.gil * 100}%`); if (fx.drop) o.push(`掉寶+${fx.drop * 100}%`); if (fx.limit) o.push(`極限值初始+${fx.limit}`); if (fx.resist) o.push(Object.keys(fx.resist).map(e => ELEM[e]).join('') + '屬性傷害減半'); if (fx.mpregen) o.push('每回合回復MP'); if (fx.first) o.push('先制'); if (fx.crit) o.push('會心+10%'); return o.join('、'); }
const FAM_MAT = { beast: '獸牙', flying: '羽毛', plant: '花蜜', amorph: '凝膠', undead: '骨片', machine: '齒輪', aquatic: '鱗片', spirit: '靈晶', dragon: '龍鱗', humanoid: '布料', demon: '魔角' };
const MAT_T = ['小', '普通的', '堅硬的', '上等的', '稀有的', '精良的', '傳說的', '神話的'];
for (const [f, n] of Object.entries(FAM_MAT)) for (let t = 0; t < 8; t++) addI(`i_m_${f}${t + 1}`, { name: MAT_T[t] + n, price: 0, sell: [10, 25, 60, 120, 240, 420, 700, 1100][t], mat: true, desc: `${FAM_N[f]}系怪物的素材。可以拿去鍛造強化或賣錢`, cat: 'mat', fam: f, tier: t });
const GEM_T = ['碎晶', '晶石', '寶珠', '神珠'];
for (const e of ELS) GEM_T.forEach((n, t) => addI(`i_gem_${e}${t + 1}`, { name: ELEM[e] + '之' + n, price: [0, 0, 0, 0][t], sell: [50, 200, 600, 1500][t], mat: true, gem: e, tier: t, desc: `鐵匠可以把它鑲到裝備上：武器帶上${ELEM[e]}屬性、防具抵抗${ELEM[e]}屬性（需要${['一~二', '三~四', '五~六', '七~八'][t]}階以下的裝備）`, cat: 'mat' }));
['強化石', '上等強化石', '精煉石', '大精煉石', '神匠之石'].forEach((n, t) => addI(`i_refine${t + 1}`, { name: n, price: [200, 800, 2000, 5000, 0][t], sell: [50, 200, 500, 1200, 3000][t], mat: true, refine: t + 1, desc: `鐵匠強化裝備用：可以強化到+${t + 1}`, cat: 'mat' }));
// scrolls cast a spell without MP
{
  const pick = SPELLS.filter(s => ['mag', 'heal', 'debuff', 'buff'].includes(SKILLS[s].type)).filter((_, i) => i % 4 === 0).slice(0, 80);
  pick.forEach((s, i) => { const S = SKILLS[s]; addI(`i_sc_${s}`, { name: S.name + '卷軸', price: S.price ? Math.round(S.price * 0.4) : 200, use: { cast: s }, tgt: S.tgt, desc: `不用MP施放「${S.name}」：${S.desc}`, cat: 'scroll' }); });
}
const TREASURE_N = ['古代金幣', '珍珠', '紅寶石', '藍寶石', '翡翠', '黃玉', '紫水晶', '月長石', '虎眼石', '琥珀', '珊瑚', '象牙雕', '銀燭台', '金酒杯', '古書', '星圖', '貝殼化石', '恐龍化石', '王冠碎片', '女神像'];
TREASURE_N.forEach((n, i) => ['', '（大）', '（極品）', '（傳說）'].forEach((sfx, t) => addI(`i_tr${i + 1}_${t}`, { name: n + sfx, price: 0, sell: Math.round((40 + i * 15) * [1, 4, 15, 50][t]), mat: true, desc: '可以賣個好價錢的寶物', cat: 'treasure' })));
for (const [id, n, o, d, p] of [['i_cottage', '小屋', { tent: true }, '在存檔水晶旁使用，全員完全回復（比帳篷高級）', 600], ['i_repel', '驅魔香', { repel: 150 }, '之後150步不會遇到敵人', 120], ['i_lure', '誘魔香', { lure: 100 }, '之後100步更容易遇到敵人', 100], ['i_scope', '偵察鏡', { analyze: true }, '戰鬥中使用，看穿單體所有弱點', 60], ['i_warp', '傳送羽毛', { warpWorld: true }, '從迷宮瞬間回到大地圖', 300], ['i_rope', '逃脫繩', { escape: true }, '必定從戰鬥中逃走（頭目戰無效）', 80]]) addI(id, { name: n, price: p, use: o, field: !!(o.tent || o.repel || o.lure || o.warpWorld), tgt: o.analyze ? 'enemy' : o.escape ? 'none' : undefined, desc: d, cat: 'tool' });
// fill up to 500 with extra treasures
{ let k = 0; while (Object.keys(ITEMS).length < 500) { addI(`i_trx${k}`, { name: ['失落的', '神秘的', '閃亮的', '古老的', '奇妙的'][k % 5] + ['懷錶', '硬幣', '羽飾', '雕像', '戒指', '石碑', '鈴鐺', '面具'][Math.floor(k / 5) % 8], price: 0, sell: 200 + k * 20, mat: true, desc: '收藏家會高價收購的珍品', cat: 'treasure' }); k++; } }
for (const id of Object.keys(ITEMS)) if (!ITEMS[id].cat) { const I = ITEMS[id]; I.cat = I.key ? 'key' : I.mat ? 'mat' : I.use?.dmg ? 'throw' : I.use?.revive ? 'revive' : I.use?.cure ? 'cure' : I.use?.tent || I.use?.escape ? 'tool' : 'heal'; }
export const ITEM_COUNT = Object.keys(ITEMS).length;
export const ITEM_CATS = { heal: '回復', cure: '治療', revive: '復活', throw: '投擲', buff: '強化', scroll: '卷軸', food: '料理', seed: '成長', tool: '道具', mat: '素材', treasure: '寶物', key: '重要' };

// ================================================================ enemies: family, battlefield traits and extra weaknesses
const KIND = {
  slime: ['amorph', [], ['knuckle', 'whip']], wolf: ['beast', ['evade'], ['whip']], bat: ['flying', ['fly', 'evade'], ['boomerang']], goblin: ['humanoid', [], ['hammer']],
  plant: ['plant', [], ['katana', 'greatsword']], golem: ['machine', ['armor'], ['hammer', 'gun']], bird: ['flying', ['fly'], ['boomerang', 'gun']], skeleton: ['undead', ['armor'], ['hammer']],
  fish: ['aquatic', ['evade'], ['whip']], mage: ['humanoid', [], ['gun', 'katana']], crab: ['aquatic', ['armor'], ['hammer']], wisp: ['spirit', ['fly'], ['tome']],
  knight: ['undead', ['armor'], ['hammer', 'katana']], dragon: ['dragon', ['fly'], ['spear', 'greatsword']], tree: ['plant', [], ['greatsword']], serpent: ['dragon', [], ['katana']],
  lord: ['demon', [], ['tome']], mech: ['machine', ['armor'], ['gun', 'knuckle']],
  beast: ['beast', [], ['spear', 'greatsword']], ogre: ['humanoid', [], ['katana', 'spear']], imp: ['demon', ['fly'], ['bow', 'tome']], mimic: ['machine', ['armor'], ['hammer']],
  cactus: ['plant', ['evade'], ['katana', 'boomerang']], bomb: ['spirit', ['fly'], ['whip']], eye: ['demon', ['fly'], ['bow', 'gun']], mushroom: ['plant', [], ['axe']],
  insect: ['beast', ['armor'], ['hammer']], spider: ['beast', [], ['axe']], ghost: ['undead', ['fly', 'evade'], ['tome', 'staff']], hydra: ['dragon', [], ['katana']],
  octopus: ['aquatic', [], ['knuckle', 'katana']], turtle: ['aquatic', ['armor'], ['hammer']], frog: ['aquatic', ['evade'], ['whip']], rabbit: ['beast', ['evade'], ['boomerang']],
  gargoyle: ['demon', ['fly', 'armor'], ['hammer']], mummy: ['undead', [], ['tome']], elemental: ['spirit', [], ['tome']], worm: ['beast', [], ['spear']], pudding: ['amorph', [], ['tome', 'knuckle']],
};

// ================================================================ loot tables by tier (shops, chests, drops)
export const GEAR_BY_TIER = Array.from({ length: 8 }, () => ({ base: [], rare: [], acc: [] }));
for (const id of gearList) { const g = GEAR[id]; if (g.tier == null) continue; const b = GEAR_BY_TIER[g.tier]; (g.slot === 'acc' ? b.acc : g.rare ? b.rare : b.base).push(id); }
export function randomGear(tier, rare = true, rnd = Math.random) {
  const t = Math.max(0, Math.min(7, tier)); const B = GEAR_BY_TIER[t];
  const pool = rare ? (rnd() < 0.2 && B.acc.length ? B.acc : B.rare) : B.base;
  return pool[Math.floor(rnd() * pool.length)];
}
// ================================================================ enemies: family, traits, and four drops each
// slots: common (material), uncommon (consumable), rare (gem / seed / treasure), very rare (equipment)
const CONS = [['potion', 'antidote', 'i_c_poison', 'ether', 'i_tw_dagger1'], ['potion', 'ether', 'i_c_sleep', 'bombfrag', 'i_b_atk1'], ['hipotion', 'ether', 'i_c_silence', 'frostfrag', 'i_b_def1', 'i_tw_axe1'],
  ['hipotion', 'hiether', 'i_hp3', 'i_t_wind1', 'i_b_mag1', 'i_s_sleep1'], ['i_hp3', 'hiether', 'i_el1', 'i_t_fire2', 'i_ga2', 'i_haste'], ['i_hp4', 'i_mp3', 'i_el1', 'i_rv2', 'i_t_ice2', 'i_regen'],
  ['i_hp5', 'i_mp4', 'i_el2', 'i_rv3', 'i_t_thunder3', 'i_reflect'], ['i_hp6', 'i_mp5', 'i_el2', 'i_rv3', 'i_reraise', 'i_t_light4']];
const SEEDS = ['hp', 'mp', 'atk', 'def', 'mag', 'spr', 'spd'];
export const DROP_N = ['常見', '普通', '稀有', '極稀有'];
const hashStr = (str) => { let h = 2166136261; for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
function buildDrops(id, E) {
  const t = E.tier, h = hashStr(id), B = GEAR_BY_TIER[Math.min(7, t + (E.boss ? 1 : 0))];
  const el = E.el || ELS.find(e => E.weak.includes(e)) && ELS[(ELS.indexOf(ELS.find(e => E.weak.includes(e))) + 4) % 8] || ELS[h % 8];
  const gemT = Math.min(4, 1 + Math.floor(t / 2));
  const rareSlot = h % 5 === 0 ? `i_seed_${SEEDS[h % 7]}` : h % 3 === 0 ? `i_tr${1 + h % 20}_${Math.min(3, Math.floor(t / 2))}` : `i_gem_${el}${gemT}`;
  const gearPool = (h % 4 === 0 && B.acc.length) ? B.acc : B.rare;
  const veryRare = t >= 4 && h % 6 === 0 ? `i_fruit_${SEEDS[(h >>> 3) % 7]}` : gearPool[(h >>> 5) % gearPool.length];
  let slots = E.metal
    ? [[`i_tr${1 + h % 20}_${Math.min(3, 1 + Math.floor(t / 3))}`, 0.5], [`i_refine${Math.min(5, 1 + Math.floor(t / 2))}`, 0.3], [`i_fruit_${SEEDS[h % 7]}`, 0.15], [GEAR_BY_TIER[Math.min(7, t + 2)].rare[h % GEAR_BY_TIER[Math.min(7, t + 2)].rare.length], 0.1]]
    : [[`i_m_${E.fam}${t + 1}`, E.boss ? 1 : 0.5], [CONS[t][h % CONS[t].length], E.boss ? 1 : 0.25], [rareSlot, E.boss ? 0.5 : 0.08], [veryRare, E.boss ? 1 : 0.025]];
  // story drops (quest items, shards, fixed rewards) take over slots, keeping their own odds
  const generic = new Set(['potion', 'antidote', 'ether', 'hipotion', 'hiether', 'xpotion', 'bombfrag']);
  const special = (E.drops || []).filter(d => !generic.has(d[0]) && !String(d[0]).startsWith('i_'));
  const gen = (E.drops || []).filter(d => generic.has(d[0]));
  if (E.sig) { slots[1] = [E.sig.item, 0.35]; slots[3] = [E.sig.gear, E.sig.gearP]; } // the horde's own drops
  if (gen[0]) slots[1] = gen[0];
  special.forEach((d, i) => { const at = [1, 2, 0, 3][i] ?? 3; slots[at] = d; });
  return slots;
}
function processEnemies() {
  for (const [id, E] of Object.entries(ENEMIES)) {
    const k = KIND[E.kind] || ['beast', [], []];
    E.fam = E.fam || k[0]; E.traits = E.traits || [...k[1]];
    if (!E.wild) { if (!E.boss) E.weak = [...new Set([...E.weak, ...k[2].slice(0, 1)])]; else E.weak = [...new Set([...E.weak, ...k[2]])]; }
    else E.weak = [...new Set([...E.weak, k[2][E.lv % k[2].length]].filter(Boolean))];
    E.tier = Math.max(0, Math.min(7, Math.floor(E.lv / 7)));
    E.ap = E.boss ? 12 + E.tier * 4 : E.metal ? 10 + E.tier * 4 : 1 + Math.floor(E.tier / 2);
    E.drops = buildDrops(id, E);
  }
}
processEnemies();
applyDepth({ GEAR_BY_TIER, TRAIT_N, STATUS_N, STATUS_S, put });
Object.assign(TRAIT_N, H_TRAITS);
export const ENEMY_COUNT = Object.keys(ENEMIES).length;

// describe an equipment piece's effects in plain words
export function fxText(fx) {
  if (!fx) return [];
  const o = [];
  if (fx.el) o.push(`攻擊帶${[].concat(fx.el).map(e => ELEM[e]).join('、')}屬性`);
  if (fx.onHit) for (const [s, c] of Object.entries(fx.onHit)) o.push(`${Math.round(c * 100)}%使敵人${STATUS_N[s]}`);
  if (fx.drain) o.push(`吸血${Math.round(fx.drain * 100)}%`); if (fx.mpdrain) o.push(`吸魔${Math.round(fx.mpdrain * 100)}%`);
  if (fx.crit) o.push(`會心+${Math.round(fx.crit * 100)}%`); if (fx.dbl) o.push(`${Math.round(fx.dbl * 100)}%連擊`); if (fx.brk) o.push(`${Math.round(fx.brk * 100)}%無視弱點破防`);
  if (fx.slay) for (const [f, m] of Object.entries(fx.slay)) o.push(`對${FAM_N[f]}×${m}`);
  if (fx.first) o.push(fx.first >= 1 ? '先制' : `${Math.round(fx.first * 100)}%先制`); if (fx.lowhp) o.push('背水（HP越低越強）'); if (fx.mpcost) o.push(`MP消耗-${Math.round(fx.mpcost * 100)}%`);
  if (fx.resist) for (const [e, v] of Object.entries(fx.resist)) o.push(v < 0 ? `吸收${ELEM[e]}` : v === 0 ? `${ELEM[e]}無效` : `${ELEM[e]}傷害×${v}`);
  if (fx.immune) o.push('防' + [...new Set(fx.immune)].map(s => STATUS_N[s]).join('、'));
  if (fx.auto) o.push('自動' + fx.auto.map(s => STATUS_N[s]).join('、'));
  if (fx.block) o.push(`格擋${Math.round(fx.block * 100)}%`); if (fx.mblock) o.push(`擋魔法${Math.round(fx.mblock * 100)}%`);
  if (fx.counter) o.push(`反擊${Math.round(fx.counter * 100)}%`); if (fx.thorns) o.push(`反傷${Math.round(fx.thorns * 100)}%`); if (fx.evade) o.push(`閃避+${Math.round(fx.evade * 100)}%`);
  if (fx.hpP) o.push(`HP+${Math.round(fx.hpP * 100)}%`); if (fx.mpP) o.push(`MP+${Math.round(fx.mpP * 100)}%`); if (fx.mpregen) o.push('每回合回MP'); if (fx.survive) o.push('不屈'); if (fx.cover) o.push('保護瀕死隊友');
  if (fx.limitup) o.push(`極限+${Math.round(fx.limitup * 100)}%`); if (fx.healup) o.push(`回復+${Math.round(fx.healup * 100)}%`); if (fx.steal) o.push(`偷竊+${Math.round(fx.steal * 100)}%`);
  if (fx.exp) o.push(`經驗+${Math.round(fx.exp * 100)}%`); if (fx.gil) o.push(`金幣+${Math.round(fx.gil * 100)}%`); if (fx.drop) o.push(`掉寶+${Math.round(fx.drop * 100)}%`); if (fx.ap) o.push(`AP+${Math.round(fx.ap * 100)}%`);
  if (fx.elUp) for (const [e, v] of Object.entries(fx.elUp)) o.push(`${ELEM[e]}屬性傷害+${Math.round(v * 100)}%`);
  if (fx.burnAmp) o.push('燃燒傷害×2'); if (fx.spreadBurn) o.push('燃燒會蔓延'); if (fx.wetAll) o.push('水屬性讓全體濕潤'); if (fx.wetAmp) o.push(`濕潤的敵人受傷+${Math.round(fx.wetAmp * 100)}%`);
  if (fx.shockStun) o.push('感電必定暈眩'); if (fx.chainT) o.push('雷屬性連鎖'); if (fx.antiUndying) o.push('阻止不死復活'); if (fx.killHeal) o.push(`擊倒時回復${Math.round(fx.killHeal * 100)}%HP`);
  if (fx.dodgeCounter) o.push('閃避後反擊'); if (fx.blockUp) o.push(`格擋+${Math.round(fx.blockUp * 100)}%`); if (fx.dualcast) o.push(`${Math.round(fx.dualcast * 100)}%連續詠唱`); if (fx.revealHit) o.push('命中時發現弱點'); if (fx.markAmp) o.push(`印記傷害+${Math.round(fx.markAmp * 100)}%`);
  if (fx.enc) o.push(fx.enc < 0 ? `遇敵-${Math.round(-fx.enc * 100)}%` : `遇敵+${Math.round(fx.enc * 100)}%`);
  return o;
}
