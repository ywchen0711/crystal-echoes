// Three hundred more monsters. Each one is built around a battle mechanic that asks for a different answer
// (split it with fire, wait out its phase, kill the guardian first, cure the poison that stops its leech...),
// carries a signature move, and drops two things of its own: a battle item made from it and a rare charm
// whose effect echoes how it fought.
import { ENEMIES, SKILLS, ITEMS, GEAR } from './data.js?v=14';
import { BESTIARY_NEW } from './monsters.js?v=14';

// ---------------------------------------------------------------- the mechanics (shown in the bestiary and the tactics book)
export const H_TRAITS = {
  split: ['🧫', '分裂', '被物理攻擊時可能分裂成兩隻（各分一半HP）。用火、冰屬性攻擊不會分裂，或用魔法一口氣打倒'],
  phase: ['🌗', '相位', '每回合在「物理無效」與「魔法無效」之間切換。看清楚形態再出手'],
  counter: ['🥊', '鬥魂', '被近戰攻擊時40%會反擊。用遠程、魔法，或趁它暈眩、睡著、破防時打'],
  shift: ['🌈', '七彩', '每回合換一種屬性，弱點跟著變。看它變成什麼屬性，就用相反屬性打'],
  guardian: ['🏰', '守衛', '活著時會替同伴擋下單體攻擊。先打倒它，或用全體攻擊'],
  martyr: ['🕊️', '殉道', '倒下時替其他敵人回復35%HP並強化防禦。最後再打倒它，或在破防中擊倒'],
  leech: ['🩸', '吸血', '攻擊會吸取傷害一半的HP。讓它中毒或燃燒就吸不了'],
  mpburn: ['🔻', '噬魔', '攻擊會燒掉目標12%的MP。讓法師站後排、防禦，或先打倒它'],
  charge: ['⚡', '蓄力', '每三回合蓄力一次，下回合放出全體重擊。蓄力時打破防、暈眩就能打斷，不然就全員防禦'],
  harden: ['🐚', '鋼殼', '每被打一次就更硬（最多減傷48%）。用重擊或魔法速戰速決'],
  adapt: ['🧬', '變異', '會對最後打中它的屬性產生抗性。輪流換屬性打'],
  intimidate: ['👑', '威壓', '戰鬥開始時讓全隊攻擊下降。用強化道具或魔法抵銷'],
  thief: ['🦝', '盜寶', '會偷走道具，下回合帶著逃走。在它逃走前打倒就能拿回來'],
  flee: ['💨', '膽小', '兩回合後就會逃走，但身上帶著寶物。先制、高速度、一回合打倒'],
  countdown: ['⏳', '末日', '倒數歸零時對全隊造成最大HP 45% 的傷害，然後重新倒數。在倒數結束前打倒'],
  hunter: ['🎯', '獵殺', '鎖定一名隊員，單體攻擊都打他，所有敵人對他傷害+30%。讓他防禦或用掩護'],
};

// ---------------------------------------------------------------- signature moves
Object.assign(SKILLS, {
  e_splitram: { name: '分裂衝撞', type: 'phys', tgt: 'random', pow: 0.6, hits: 2, anim: 'bite' },
  e_phasewave: { name: '相位波', type: 'mag', tgt: 'enemies', pow: 0.85, pierce: true, anim: 'dark' },
  e_stance: { name: '鬥魂架勢', type: 'buff', tgt: 'self', buff: { def: 1, atk: 1 }, anim: 'buff' },
  e_prism: { name: '七彩光線', type: 'mag', tgt: 'enemy', pow: 1.35, anim: 'holy' },
  e_shieldwall: { name: '守護之壁', type: 'buff', tgt: 'allyE', buff: { def: 1, spr: 1 }, anim: 'buff' },
  e_prayer: { name: '殉道祈禱', type: 'heal', tgt: 'allyE', pow: 1.2, base: 60, anim: 'heal' },
  e_leechbite: { name: '吸血之牙', type: 'phys', tgt: 'enemy', pow: 1.1, anim: 'bite' },
  e_manabite: { name: '噬魔咬', type: 'phys', tgt: 'enemy', pow: 0.9, anim: 'bite' },
  e_chargeblast: { name: '蓄力爆擊', type: 'phys', tgt: 'enemies', pow: 1.9, anim: 'quake' },
  e_harden: { name: '硬化', type: 'buff', tgt: 'self', buff: { def: 2 }, anim: 'buff' },
  e_mutate: { name: '突變', type: 'buff', tgt: 'self', buff: { atk: 1, mag: 1 }, anim: 'dark' },
  e_kingroar: { name: '霸王怒吼', type: 'debuff', tgt: 'enemies', debuff: { atk: 1, def: 1 }, anim: 'quake' },
  e_snatch: { name: '順手牽羊', type: 'phys', tgt: 'enemy', pow: 0.7, anim: 'claw' },
  e_scurry: { name: '亂竄', type: 'buff', tgt: 'self', buff: { spd: 2 }, anim: 'buff' },
  e_tick: { name: '時之針', type: 'mag', tgt: 'enemy', pow: 1.0, anim: 'dark' },
  e_hunt: { name: '獵殺突擊', type: 'phys', tgt: 'enemy', pow: 1.6, anim: 'claw' },
});
const SIG = { split: 'e_splitram', phase: 'e_phasewave', counter: 'e_stance', shift: 'e_prism', guardian: 'e_shieldwall', martyr: 'e_prayer', leech: 'e_leechbite', mpburn: 'e_manabite', charge: 'e_tackle', harden: 'e_harden', adapt: 'e_mutate', intimidate: 'e_kingroar', thief: 'e_snatch', flee: 'e_scurry', countdown: 'e_tick', hunter: 'e_hunt' };

// ---------------------------------------------------------------- what each kind of creature is called, where it lives, how big it is
const KINDS = {
  slime: ['凝膠', 1, '核'], pudding: ['布丁', 1, '凍'], wolf: ['狼', 1, '牙'], beast: ['魔獸', 2, '角'], ogre: ['巨人', 2, '骨'], imp: ['小鬼', 1, '角'], mimic: ['寶箱', 1, '鎖'],
  cactus: ['仙人掌', 1, '刺'], bomb: ['爆彈', 1, '火藥'], eye: ['魔眼', 1, '晶體'], mushroom: ['菇', 1, '孢子'], insect: ['甲蟲', 1, '甲殼'], spider: ['蜘蛛', 1, '絲'], ghost: ['幽靈', 1, '靈氣'],
  hydra: ['多頭蛇', 2, '鱗'], octopus: ['章魚', 2, '墨囊'], turtle: ['龜', 1, '殼'], frog: ['蛙', 1, '黏液'], rabbit: ['兔', 1, '尾毛'], gargoyle: ['石像鬼', 1, '石心'], mummy: ['木乃伊', 1, '繃帶'],
  elemental: ['元素靈', 1, '精華'], worm: ['沙蟲', 2, '顎'], bat: ['蝠', 1, '翼膜'], bird: ['怪鳥', 1, '羽'], skeleton: ['骷髏', 1, '骨'], golem: ['魔像', 2, '核心'], goblin: ['哥布林', 1, '耳飾'],
  plant: ['魔花', 1, '花粉'], mage: ['術士', 1, '咒符'], knight: ['騎士', 1, '鎧片'], crab: ['蟹', 1, '鉗'], fish: ['魚', 1, '鰭'], wisp: ['鬼火', 1, '燐光'], tree: ['樹精', 2, '樹心'],
  serpent: ['海蛇', 2, '鱗'], mech: ['機兵', 2, '齒輪'], dragon: ['龍', 3, '龍鱗'],
};
const HAB = {
  slime: ['field', 'forest', 'cave', 'coast'], pudding: ['cave', 'temple', 'forest'], wolf: ['field', 'forest', 'snow', 'mountain'], beast: ['field', 'mountain', 'snow', 'void'], ogre: ['mountain', 'cave', 'forest'],
  imp: ['cave', 'temple', 'sky', 'void'], mimic: ['cave', 'temple', 'sky'], cactus: ['field', 'coast', 'mountain'], bomb: ['cave', 'mountain', 'sky'], eye: ['cave', 'temple', 'sky', 'void'], mushroom: ['forest', 'cave'],
  insect: ['forest', 'field', 'cave', 'coast'], spider: ['forest', 'cave', 'temple'], ghost: ['temple', 'cave', 'void'], hydra: ['coast', 'temple', 'forest', 'void'], octopus: ['coast', 'temple'], turtle: ['coast', 'mountain', 'cave'],
  frog: ['field', 'forest', 'coast'], rabbit: ['field', 'snow', 'forest'], gargoyle: ['temple', 'sky', 'mountain', 'void'], mummy: ['temple', 'cave'], elemental: ['cave', 'sky', 'temple', 'mountain', 'void', 'coast', 'snow'],
  worm: ['field', 'mountain', 'cave', 'coast'], bat: ['cave', 'forest', 'temple'], bird: ['mountain', 'sky', 'coast', 'field'], skeleton: ['cave', 'temple', 'void'], golem: ['mountain', 'cave', 'sky'],
  goblin: ['field', 'forest', 'cave', 'mountain'], plant: ['forest', 'field', 'temple'], mage: ['temple', 'cave', 'sky', 'void'], knight: ['temple', 'sky', 'void'], crab: ['coast'], fish: ['coast', 'temple'],
  wisp: ['forest', 'temple', 'cave', 'void'], tree: ['forest'], serpent: ['coast', 'temple'], mech: ['sky', 'cave', 'void'], dragon: ['mountain', 'sky', 'void', 'snow'],
};
const ACTS = {
  slime: [['e_tackle', 3]], pudding: [['e_tackle', 2], ['e_regen', 1]], wolf: [['e_bite', 3], ['e_howl', 1]], beast: [['e_claw', 2], ['e_stomp', 1], ['e_roar', 1]], ogre: [['e_smash', 2], ['e_tackle', 2], ['e_stomp', 1]],
  imp: [['e_claw', 1], ['$mag', 2], ['e_hex', 1]], mimic: [['e_chomp', 3], ['e_doom', 1]], cactus: [['e_needles', 2], ['e_dance', 1], ['e_tackle', 1]], bomb: [['$mag', 3], ['e_selfdestruct', 1]], eye: [['e_gaze', 1], ['$mag', 2], ['e_stopgaze', 1]],
  mushroom: [['e_spore', 1], ['e_spores2', 1], ['e_tackle', 2]], insect: [['e_bite', 2], ['e_claw', 1]], spider: [['e_bite', 2], ['e_web', 1], ['e_tailsting', 1]], ghost: [['$mag', 2], ['e_drain', 1], ['e_hex', 1]],
  hydra: [['e_multibite', 2], ['$big', 1], ['e_regen', 1]], octopus: [['e_tentacle', 2], ['e_ink', 1], ['e_water', 1]], turtle: [['e_tackle', 2], ['e_guard', 1], ['$mag', 1]], frog: [['e_tackle', 2], ['$mag', 1]],
  rabbit: [['e_bite', 3], ['e_dance', 1]], gargoyle: [['e_claw', 2], ['e_gust', 1], ['e_stopgaze', 1]], mummy: [['e_smash', 2], ['e_hex', 1], ['e_doom', 1]], elemental: [['$mag', 3], ['$big', 1]],
  worm: [['e_chomp', 1], ['e_tackle', 2], ['e_quake', 1]], bat: [['e_drain', 2], ['e_claw', 1]], bird: [['e_claw', 2], ['$mag', 1]], skeleton: [['e_smash', 2], ['e_tackle', 1]], golem: [['e_smash', 2], ['e_stomp', 1], ['e_guard', 1]],
  goblin: [['e_smash', 1], ['e_tackle', 2], ['e_steal', 1]], plant: [['e_spore', 1], ['e_roots', 1], ['e_tackle', 1]], mage: [['$mag', 3], ['$big', 1]], knight: [['e_smash', 2], ['e_sweep', 1], ['e_guard', 1]],
  crab: [['e_claw', 2], ['e_guard', 1]], fish: [['e_bite', 2], ['e_water', 1]], wisp: [['$mag', 3]], tree: [['e_roots', 2], ['e_smash', 1], ['e_regen', 1]], serpent: [['e_bite', 2], ['$big', 1]],
  mech: [['e_smash', 1], ['e_laser', 1], ['e_guard', 1]], dragon: [['e_claw', 2], ['$big', 2], ['e_roar', 1]],
};
const FAM = { slime: 'amorph', pudding: 'amorph', wolf: 'beast', beast: 'beast', ogre: 'humanoid', imp: 'demon', mimic: 'machine', cactus: 'plant', bomb: 'spirit', eye: 'demon', mushroom: 'plant', insect: 'beast', spider: 'beast', ghost: 'undead', hydra: 'dragon', octopus: 'aquatic', turtle: 'aquatic', frog: 'aquatic', rabbit: 'beast', gargoyle: 'demon', mummy: 'undead', elemental: 'spirit', worm: 'beast', bat: 'flying', bird: 'flying', skeleton: 'undead', golem: 'machine', goblin: 'humanoid', plant: 'plant', mage: 'humanoid', knight: 'undead', crab: 'aquatic', fish: 'aquatic', wisp: 'spirit', tree: 'plant', serpent: 'dragon', mech: 'machine', dragon: 'dragon' };
const FLY = new Set(['imp', 'bomb', 'eye', 'ghost', 'gargoyle', 'bat', 'bird', 'wisp']);
const ARMOR = new Set(['mimic', 'insect', 'turtle', 'gargoyle', 'knight', 'crab', 'golem']);
const RESIST_PHYS = new Set(['pudding', 'ghost', 'elemental']);
const STAT_M = { // hp, atk, def, mag, spd
  slime: [0.8, 0.9, 0.9, 1, 0.9], pudding: [1.1, 0.9, 0.6, 1.2, 0.7], wolf: [1, 1.1, 0.9, 0.6, 1.3], beast: [1.9, 1.35, 1.2, 0.9, 1.0], ogre: [1.7, 1.4, 1.1, 0.5, 0.7], imp: [0.7, 0.8, 0.8, 1.35, 1.3], mimic: [1.4, 1.5, 1.6, 1.0, 1.1],
  cactus: [0.6, 0.8, 0.8, 0.6, 1.7], bomb: [0.8, 1.0, 0.8, 1.2, 1.0], eye: [0.9, 0.7, 0.9, 1.3, 1.1], mushroom: [0.9, 0.8, 0.8, 1.1, 0.8], insect: [1.0, 1.1, 1.4, 0.6, 1.0], spider: [0.9, 1.1, 0.9, 0.9, 1.3], ghost: [0.8, 0.6, 1.3, 1.3, 1.1],
  hydra: [2.2, 1.2, 1.1, 1.2, 0.8], octopus: [1.5, 1.1, 0.9, 1.0, 0.9], turtle: [1.4, 1.0, 2.0, 0.8, 0.5], frog: [0.8, 0.9, 0.8, 1.0, 1.2], rabbit: [0.6, 0.9, 0.7, 0.6, 1.6], gargoyle: [1.3, 1.2, 1.5, 1.0, 1.0], mummy: [1.3, 1.1, 1.0, 0.8, 0.7],
  elemental: [1.0, 0.8, 1.0, 1.4, 1.0], worm: [1.8, 1.3, 1.0, 0.6, 0.8], bat: [0.8, 1.0, 0.8, 0.8, 1.4], bird: [1.0, 1.1, 0.9, 0.9, 1.4], skeleton: [1.0, 1.1, 1.0, 0.8, 0.9], golem: [2.0, 1.3, 1.7, 0.5, 0.5], goblin: [1.0, 1.0, 1.0, 0.6, 1.0],
  plant: [1.2, 0.9, 0.9, 1.2, 0.7], mage: [0.9, 0.6, 0.8, 1.5, 1.0], knight: [1.5, 1.3, 1.5, 0.9, 0.9], crab: [1.1, 1.1, 1.5, 0.6, 0.8], fish: [0.9, 1.0, 0.8, 0.9, 1.3], wisp: [0.7, 0.6, 1.2, 1.3, 1.2], tree: [2.4, 1.2, 1.1, 1.1, 0.5],
  serpent: [2.4, 1.2, 1.1, 1.3, 1.0], mech: [1.6, 1.2, 1.6, 1.1, 0.8], dragon: [3.0, 1.4, 1.3, 1.3, 1.0],
};
// mechanics tweak the body: a guardian is tough, a coward is frail and quick, a thing that hardens starts soft
const MECH_M = { split: [1.2, 1, 1, 1, 1], phase: [0.9, 1, 1, 1, 1], counter: [1, 1.1, 1.1, 0.8, 1], shift: [1, 0.9, 1, 1.15, 1], guardian: [1.35, 0.9, 1.25, 0.9, 0.9], martyr: [0.8, 0.8, 1, 1.1, 1.1], leech: [1, 1.05, 0.9, 1, 1.05], mpburn: [0.9, 1, 1, 1, 1.1],
  charge: [1.15, 1.2, 1, 1, 0.85], harden: [1.1, 1, 0.75, 0.9, 0.9], adapt: [1.1, 1, 1, 1, 1], intimidate: [1.2, 1.15, 1.05, 1, 1], thief: [0.8, 0.9, 0.9, 0.9, 1.45], flee: [0.45, 0.6, 1.2, 0.7, 1.7], countdown: [1.2, 0.9, 1.1, 1.1, 0.9], hunter: [0.95, 1.2, 0.9, 0.9, 1.2] };
const MECHS = ['split', 'leech', 'counter', 'shift', 'guardian', 'harden', 'mpburn', 'charge', 'phase', 'martyr', 'adapt', 'thief', 'hunter', 'intimidate', 'countdown', 'flee'];
const MECH_W = { split: '裂殖', phase: '幻相', counter: '鬥魂', shift: '七彩', guardian: '守衛', martyr: '殉道', leech: '吸血', mpburn: '噬魔', charge: '蓄力', harden: '鋼殼', adapt: '變異', intimidate: '霸王', thief: '盜寶', flee: '膽小', countdown: '末日', hunter: '獵殺' };
const NO_BIG = new Set(['split', 'thief', 'flee']);
const ELS = ['fire', 'ice', 'thunder', 'water', 'wind', 'earth', 'light', 'dark'];
const EL_W = { fire: '炎', ice: '霜', thunder: '雷', water: '潮', wind: '嵐', earth: '岩', light: '聖', dark: '冥' };
const EL_N = { fire: '火', ice: '冰', thunder: '雷', water: '水', wind: '風', earth: '土', light: '光', dark: '闇' };
const EL_OPP = { fire: 'ice', ice: 'fire', thunder: 'water', water: 'thunder', wind: 'earth', earth: 'wind', light: 'dark', dark: 'light' };
const EL_MAG = { fire: 'e_fire', ice: 'e_ice', thunder: 'e_thunder', water: 'e_water', wind: 'e_wind', earth: 'e_quake', light: 'e_holy', dark: 'e_dark' };
const EL_BIG = { fire: 'e_inferno', ice: 'e_blizzard', thunder: 'e_storm', water: 'e_flood', wind: 'e_gust', earth: 'e_quake2', light: 'e_holy', dark: 'e_darkwave' };
// each element has a few body colours so cousins do not look alike
const EL_C = { fire: ['#e8582a', '#c8301a', '#ff9a3a'], ice: ['#a8e0f8', '#e8f6ff', '#6ab0e0'], thunder: ['#f0d040', '#e8b020', '#fff07a'], water: ['#3a8ae8', '#2a5ab8', '#6ac8e8'], wind: ['#7ad88a', '#4ab868', '#b8f0a8'],
  earth: ['#a8804a', '#7a5a3a', '#c8a868'], light: ['#fff0b0', '#f8e0e8', '#e8e8ff'], dark: ['#5a3a8a', '#3a2a5a', '#8a3a6a'], none: ['#9a9a9a', '#c86a8a', '#6a8a6a', '#8a6a4a'] };
const OLD_TRAITS = { amorph: ['absorb', 'regen'], beast: ['enrage', 'swarm'], humanoid: ['summoner', 'aura'], demon: ['curse', 'reflect'], machine: ['burst', 'mimmune'], plant: ['regen', 'thorns'], spirit: ['mimmune', 'reflect'], undead: ['undying', 'curse'], aquatic: ['regen', 'absorb'], flying: ['stealth', 'swarm'], dragon: ['enrage', 'aura'] };
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)))); return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(f).map(v => v.toString(16).padStart(2, '0')).join(''); };
const hashS = (s) => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };

// ---------------------------------------------------------------- signature drops
const TIER_P = [1, 1.6, 2.6, 4, 6, 8.5, 11, 14];
function sigItem(id, E, mech, el, part) {
  const t = E.tier, k = TIER_P[t], nm = `${E.name}的${part}`;
  const big = (n) => Math.round(n * k / 10) * 10;
  const F = {
    split: [{ dmg: big(120), el: el || 'water' }, 'enemies', `對敵全體造成${EL_N[el || 'water']}屬性傷害${big(120)}`],
    phase: [{ evadeT: 1 }, 'ally', '下一次被攻擊必定閃避（幻影）'],
    counter: [{ buff: { atk: 1, def: 1 } }, 'ally', '攻擊、防禦各提升1級'],
    shift: [{ analyze: true }, 'enemy', '看穿一個敵人的全部弱點'],
    guardian: [{ buff: { def: t >= 4 ? 2 : 1 } }, 'allies', `全體防禦提升${t >= 4 ? 2 : 1}級`],
    martyr: [{ revive: t >= 4 ? 0.5 : 0.3 }, 'dead', `復活一名隊友（${t >= 4 ? 50 : 30}% HP）`],
    leech: [{ heal: big(180), regen: 3 }, 'ally', `回復${big(180)} HP，並再生3回合`],
    mpburn: [{ mp: Math.round(30 * k) }, 'ally', `回復${Math.round(30 * k)} MP`],
    charge: [{ buff: { atk: 2 } }, 'ally', '攻擊提升2級'],
    harden: [{ buff: { def: 2, spr: 1 } }, 'ally', '防禦提升2級、精神提升1級'],
    adapt: [{ cure: true, regen: 3 }, 'ally', '解除所有異常並再生3回合'],
    intimidate: [{ status: 'stun', chance: 0.55 }, 'enemies', '55%使敵全體暈眩'],
    thief: [{ escape: true }, 'ally', '從戰鬥中逃走（頭目戰無效）'],
    flee: [{ buff: { spd: 2 } }, 'ally', '速度提升2級'],
    countdown: [{ status: 'doom', chance: 0.5 }, 'enemy', '50%對單體施加死亡宣告'],
    hunter: [{ buff: { atk: 1, spd: 1 } }, 'ally', '攻擊、速度各提升1級'],
  }[mech];
  const iid = 'i_sig_' + id;
  ITEMS[iid] = { name: nm, price: 0, sell: Math.round(40 * k), use: F[0], tgt: F[1] === 'dead' ? 'dead' : F[1], desc: `${F[2]}　（${E.name}的特有掉落）`, cat: F[0].dmg || F[0].status ? 'throw' : F[0].buff || F[0].evadeT ? 'buff' : F[0].revive ? 'revive' : F[0].escape ? 'tool' : 'heal' };
  return iid;
}
const CHARM = { split: '分身', phase: '幻相', counter: '鬥魂', shift: '虹彩', guardian: '守護', martyr: '慈悲', leech: '吸血', mpburn: '噬魔', charge: '蓄能', harden: '鋼殼', adapt: '適應', intimidate: '霸氣', thief: '盜賊', flee: '疾風', countdown: '時之', hunter: '獵人' };
function sigGear(id, E, mech, el) {
  const t = E.tier, v = (a, b) => +(a + (b - a) * t / 7).toFixed(2);
  const fx = {
    split: { dbl: v(0.12, 0.3) }, phase: { mblock: v(0.1, 0.25), evade: v(0.04, 0.1) }, counter: { counter: v(0.15, 0.35) }, shift: { elUp: Object.fromEntries(ELS.map(e => [e, v(0.06, 0.15)])) },
    guardian: { cover: 1, blockUp: v(0.05, 0.15) }, martyr: { healup: v(0.15, 0.4) }, leech: { drain: v(0.06, 0.15) }, mpburn: { mpdrain: v(0.03, 0.07) }, charge: { limitup: v(0.25, 0.6) },
    harden: { blockUp: v(0.06, 0.16) }, adapt: { immune: ['poison', 'blind', 'slow'] }, intimidate: { first: v(0.25, 0.6) }, thief: { steal: v(0.3, 0.7), gil: v(0.1, 0.3) }, flee: { evade: v(0.06, 0.14), first: v(0.3, 0.7) },
    countdown: { immune: ['doom', 'stop'], survive: 1 }, hunter: { crit: v(0.06, 0.15), markAmp: v(0.2, 0.5) },
  }[mech];
  if (el) { fx.resist = { ...(fx.resist || {}), [el]: t >= 5 ? 0 : 0.5 }; }
  const stat = { harden: { def: 4 + t * 4 }, intimidate: { atk: 3 + t * 3 }, guardian: { def: 3 + t * 3, hp: 40 + t * 40 }, charge: { atk: 2 + t * 2 }, shift: { mag: 3 + t * 3 }, mpburn: { mp: 10 + t * 10 }, leech: { hp: 50 + t * 50 }, flee: { spd: 1 + (t >> 1) } }[mech] || {};
  const gid = 'g_sig_' + id;
  GEAR[gid] = { name: `${MECH_W[mech]}${KINDS[E.kind][0]}・${CHARM[mech]}之證`, slot: 'acc', tier: t, price: 0, sell: Math.round(300 * TIER_P[t]), desc: `${E.name}的特有掉落：${H_TRAITS[mech][1]}的力量`, fx, ...stat, sig: true };
  return gid;
}

// ---------------------------------------------------------------- build the roster: every kind gets eight cousins, each with its own mechanic
const kinds = Object.keys(KINDS);
const PER = { dragon: 6, serpent: 7, tree: 7 };
export const HORDE = [];
let n = 0;
for (const [ki, kind] of kinds.entries()) {
  const [noun, size, part] = KINDS[kind];
  const count = PER[kind] || 8;
  const usable = MECHS.filter(m => !(size >= 2 && NO_BIG.has(m)));
  const lo = size >= 3 ? 26 : size >= 2 ? 10 : 2, hi = size >= 3 ? 60 : size >= 2 ? 58 : 50;
  for (let i = 0; i < count && HORDE.length < 300; i++) {
    const mech = usable[(ki * 5 + i * 3) % usable.length];
    const h = hashS(kind + mech);
    const el = (i + ki) % 9 === 8 ? null : ELS[(ki * 3 + i * 5) % 8];
    const lv = Math.max(1, Math.min(62, Math.round(lo + (hi - lo) * i / Math.max(1, count - 1) + ((h % 5) - 2))));
    const id = `m_h${++n}`;
    const name = `${el ? EL_W[el] : ''}${MECH_W[mech]}${noun}`;
    const pal = EL_C[el || 'none'], body = pal[h % pal.length];
    const colors = { body, eye: el === 'dark' ? '#ff3a6a' : el === 'light' ? '#4a8aff' : '#ffe04a', wing: shade(body, -0.32), mane: shade(body, -0.25), belly: shade(body, 0.4), horn: '#e8e0c8', cloth: shade(body, -0.4), shell: shade(body, -0.3), leaf: shade(body, -0.2), trim: '#e8c050', orb: pal[(h + 1) % pal.length], crown: mech === 'intimidate' ? 1 : undefined };
    const [mh, ma, md, mm, ms] = STAT_M[kind], [xh, xa, xd, xm, xs] = MECH_M[mech];
    const E = {
      name, kind, colors, lv,
      hp: Math.round((22 + 12 * lv + 0.45 * lv * lv) * mh * xh), atk: Math.round((12 + 2.0 * lv) * ma * xa), def: Math.round((5 + 1.0 * lv) * md * xd), mag: Math.round((10 + 1.8 * lv) * mm * xm),
      spr: Math.round((5 + 0.9 * lv) * (RESIST_PHYS.has(kind) ? 1.3 : 1)), spd: Math.round((8 + 0.45 * lv) * ms * xs),
      shield: 2 + Math.floor(lv / 12) + size - 1, weak: [], resist: [],
      exp: Math.max(4, Math.round(2.4 * Math.pow(lv, 1.25) * size * (mech === 'flee' ? 3 : 1))), gil: Math.round((2 * Math.pow(lv, 1.2) + 5) * (mech === 'flee' ? 8 : mech === 'thief' ? 3 : 1)),
      drops: [], hab: HAB[kind], fam: FAM[kind], el, wild: true, horde: true, mech, fixedTraits: true, scale: size >= 3 ? 0.8 : lv >= 45 && size === 1 ? 1.2 : undefined,
    };
    // traits: the mechanic, the body's own (wings, armour), and a family trait on the stronger ones
    const tr = [mech]; if (FLY.has(kind)) tr.push('fly'); if (ARMOR.has(kind) && mech !== 'harden') tr.push('armor');
    if (lv >= 24) { const ot = OLD_TRAITS[E.fam] || []; const pick = ot[h % ot.length]; if (pick && !(pick === 'absorb' && !el)) tr.push(pick); }
    E.traits = [...new Set(tr)];
    if (E.traits.includes('absorb') && el) E.absorb = [el];
    // moves: the kind's own, its element, and the signature move
    const mag = el ? EL_MAG[el] : 'e_dark', bigM = el ? EL_BIG[el] : 'e_darkwave';
    E.acts = ACTS[kind].map(([s, w]) => [s === '$mag' ? mag : s === '$big' ? (lv >= 20 ? bigM : mag) : s, w]);
    if (!E.acts.some(a => a[0] === SIG[mech])) E.acts.push([SIG[mech], mech === 'charge' ? 0 : 2]);
    E.acts = E.acts.filter(a => a[1] > 0);
    if (lv >= 30 && el && !E.acts.some(a => a[0] === bigM)) E.acts.push([bigM, 1]);
    // weaknesses: the opposing element, a weapon; resists its own element. Shifters start on their own element.
    if (el) { E.weak.push(EL_OPP[el]); E.resist.push(el); }
    else E.weak.push(['fire', 'thunder', 'light', 'wind'][h % 4]);
    E.weak.push(['sword', 'spear', 'axe', 'dagger', 'bow', 'staff', 'hammer', 'whip'][(h >>> 4) % 8]);
    if (RESIST_PHYS.has(kind)) E.resist.push('sword', 'dagger');
    E.weak = [...new Set(E.weak.filter(w => !E.resist.includes(w)))];
    E.tier = Math.max(0, Math.min(7, Math.floor(lv / 7)));
    E.sig = { item: sigItem(id, E, mech, el, part), gear: null, gearP: mech === 'flee' ? 0.35 : mech === 'thief' ? 0.12 : 0.05 };
    E.sig.gear = sigGear(id, E, mech, el);
    ENEMIES[id] = E; BESTIARY_NEW.push(id); HORDE.push(id);
  }
}
