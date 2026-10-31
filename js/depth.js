// Strategic depth: 24 echoes with keystones, echo pairs, elemental states and reactions,
// monster traits that each demand a different answer, and gear sets worth hunting for.
import { ECHOES, SKILLS, PASSIVES, ECHO_ORDER, ENEMIES, GEAR, ELEM } from './data.js?v=14';

// ================================================================ elemental states and reactions
// a hit leaves its element on the target; the next element can react with it
export const STATE_N = { wet: ['💧', '濕潤'], burn: ['🔥', '燃燒'], chill: ['❄️', '凍傷'], frozen: ['🧊', '凍結'], mud: ['🟫', '泥濘'], erosion: ['🌑', '侵蝕'] };
export const STATE_OF = { water: 'wet', fire: 'burn', ice: 'chill', dark: 'erosion' };
export const STATE_KEYS = Object.keys(STATE_N);
export const REACTIONS = [
  ['感電', '⚡ 雷 → 濕潤', '傷害×1.8、多削1格破防、50%暈眩'],
  ['凍結', '❄️ 冰 → 濕潤', '凍住1回合不能行動（頭目改為多削1格破防）'],
  ['融解', '🔥 火 → 凍傷／凍結', '傷害×2'],
  ['粉碎', '🔨 戰鎚、拳套、土 → 凍結', '傷害×2.5、多削1格破防'],
  ['蒸氣', '💧 水 → 燃燒', '傷害×1.4，敵全體50%失明'],
  ['延燒', '🌀 風 → 燃燒', '傷害×1.3，燃燒蔓延到敵全體'],
  ['寒風', '🌀 風 → 濕潤', '濕潤變成凍傷（速度大降）'],
  ['泥沼', '🪨 土 → 濕潤', '傷害×1.2，泥濘：無法閃避、飛行墜落'],
  ['聖爆', '✨ 光 → 侵蝕', '傷害×2，消除敵人的強化'],
];
export const STATE_DESC = { wet: '水屬性留下。可被雷、冰、風、土引發反應', burn: '火屬性留下。每回合受到傷害、無法再生', chill: '冰屬性留下。速度×0.7', frozen: '不能行動。被打中會粉碎', mud: '無法閃避，飛行的敵人會墜落', erosion: '闇屬性留下。精神×0.75，被光打中會聖爆' };

// ================================================================ monster traits
export const TRAITS_NEW = {
  regen: ['💚', '再生', '每回合回復HP。燃燒、中毒或被「破邪」打中時停止再生'],
  undying: ['💀', '不死', '倒下時會復活一次。用光或火給最後一擊、或在破防中擊倒就不會復活'],
  thorns: ['🌵', '荊棘', '近戰攻擊它會反彈20%傷害。遠程、魔法不受影響'],
  mimmune: ['🔮', '魔抗', '魔法傷害×0.35。用物理攻擊，或用「催化」等消除抗性'],
  ghost: ['👻', '靈體', '不帶屬性的物理攻擊×0.3。魔法、屬性武器、附魔才有效'],
  enrage: ['💢', '狂暴', 'HP低於一半會狂暴：傷害×1.4，35%機率再行動。用控場或一口氣打倒'],
  aura: ['🔆', '光環', '活著時強化其他敵人（戰意：傷害×1.3／守護：受傷×0.7）。優先擊倒'],
  summoner: ['📯', '召喚者', '每2回合呼叫同伴。先打倒它'],
  burst: ['💥', '自爆', '倒下時對全隊造成火傷。用冰、水擊倒或在破防中擊倒就不會爆炸'],
  absorb: ['🌀', '吸收', '吸收自己的屬性。換其他屬性打'],
  reflect: ['🪞', '魔鏡', '反射單體魔法。用全體魔法、物理，或驅散'],
  curse: ['🕯️', '詛咒之觸', '物理攻擊會附加詛咒（全能力下降）。帶防詛咒的飾品'],
  stealth: ['🫥', '隱匿', '單體攻擊有60%打不到。全體攻擊、光屬性或偵察能讓它現形'],
  swarm: ['🐜', '群聚', '同伴倒下時其餘同族攻擊上升'],
};
const FAM_T = { beast: ['enrage', 'swarm'], flying: ['stealth', 'swarm'], plant: ['regen', 'thorns'], amorph: ['absorb', 'regen'], undead: ['undying', 'curse'], machine: ['burst', 'mimmune'], aquatic: ['regen', 'absorb'], spirit: ['ghost', 'stealth'], dragon: ['enrage', 'mimmune'], humanoid: ['summoner', 'aura'], demon: ['aura', 'reflect', 'curse'] };
const BOSS_T = ['enrage', 'regen', 'summoner', 'thorns', 'reflect'];
const hashStr = (str) => { let h = 2166136261; for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };

// ================================================================ keystones of the first eight echoes
const KEY8 = {
  evina: ['aegisheart', '不動之盾', '持盾時格擋率+15%；挑釁與掩護必定吸引敵人'],
  lumia: ['resonate', '元素共振', '你引發的元素反應，加成再提高50%'],
  kaz: ['opportunist', '趁虛而入', '攻擊破防、睡眠、暈眩、凍結的敵人必定會心，並順手偷竊'],
  gareth: ['dragoon', '龍騎', '跳躍落地讓目標墜落並多削1格破防；對飛行敵人傷害×1.5'],
  unran: ['firstcut', '拔刀術', '每場戰鬥第一次攻擊必定會心，並多削1格破防'],
  fino: ['encore', '餘韻', '你施加的能力提升多持續2回合'],
  sera: ['grace', '慈光', '你的回復同時解除1種異常；復活時至少回復50% HP'],
  bolt: ['artisan', '天匠', '投擲道具傷害+50%、打中就削破防；對機械系傷害×1.3'],
};
for (const [id, [key, kn, kd]] of Object.entries(KEY8)) Object.assign(ECHOES[id], { key, keyName: kn, keyDesc: kd, how: '光之祠堂' });

// ================================================================ sixteen new echoes
const NEW = {
  enri: {
    name: '灰燼巫女 焰璃', short: '焰璃', role: '業火', color: '#ff8a5a',
    look: { skin: 'pale', hair: '#ff6a3a', hairStyle: 'long', top: '#3a1a1a', top2: '#ff6a3a', legs: '#2a1414', boots: '#2a1a1a', robe: true, hat: 'circlet', hatColor: '#ffd04a', weapon: 'rod', eyes: '#ff8a3a' },
    stat: { mag: 0.1, spd: 0.04 },
    skills: [[1, 'ember_dart'], [2, 'wildfire'], [3, 'cinder_dance'], [5, 'conflagrate']],
    passives: [[2, 'p_fireup'], [3, 'p_burnlong'], [5, 'p_mag10']],
    resonance: 'res_enri', key: 'inferno', keyName: '業火', keyDesc: '你造成的燃燒傷害×2；燃燒中的敵人倒下時，火焰會蔓延到其他敵人',
    hunt: { el: 'fire' }, ch: 2,
    lore: ['她出生在火山腳下的村莊。', '那年火山爆發，她把熔岩唱成了一場溫柔的雨。', '「火會燒掉一切，也會讓種子發芽。」'],
  },
  lan: {
    name: '潮汐祭司 瀾', short: '瀾', role: '潮汐', color: '#6ad0f0',
    look: { skin: 'light', hair: '#4ac8e8', hairStyle: 'braid', top: '#e8f4f8', top2: '#2a7ab8', legs: '#e8f4f8', boots: '#8aa8c8', robe: true, hat: 'hood', hatColor: '#2a7ab8', weapon: 'staff', eyes: '#2a7ab8' },
    stat: { spr: 0.1, mp: 0.08 },
    skills: [[1, 'tide_orb'], [2, 'drench'], [3, 'mist_veil'], [5, 'tsunami']],
    passives: [[2, 'p_spr10'], [3, 'p_wetlong'], [5, 'p_mp20']],
    resonance: 'res_lan', key: 'tide', keyName: '潮汐', keyDesc: '你的水屬性攻擊讓全體敵人濕潤；濕潤的敵人受到所有傷害+15%',
    hunt: { fam: 'aquatic' }, ch: 2,
    lore: ['她每天清晨替海潮祈禱。', '有一年海沒有退潮，她走進海裡，和大海說了一整夜的話。', '「水沒有形狀，所以它什麼都能成為。」'],
  },
  ting: {
    name: '雷霆射手 霆', short: '霆', role: '連鎖閃電', color: '#ffe04a',
    look: { skin: 'tan', hair: '#ffe04a', hairStyle: 'spiky', top: '#2a2a4a', top2: '#ffe04a', legs: '#2a2a3a', boots: '#1a1a2a', hat: 'band', hatColor: '#ffe04a', weapon: 'bow', eyes: '#ffe04a' },
    stat: { atk: 0.08, spd: 0.06 },
    skills: [[1, 'spark_arrow'], [2, 'storm_volley'], [3, 'static_field'], [5, 'judgement']],
    passives: [[2, 'p_thunderup'], [3, 'p_spd10'], [5, 'p_atk10']],
    resonance: 'res_ting', key: 'chain', keyName: '連鎖閃電', keyDesc: '你的雷屬性攻擊會跳到另一名敵人；目標濕潤時跳兩次',
    hunt: { el: 'thunder' }, ch: 2,
    lore: ['他在暴風雨的山頂上練箭。', '雷打中他的箭，箭卻飛得更遠了。', '「不要躲雷，要跟它一起飛。」'],
  },
  souka: {
    name: '冰晶公主 霜華', short: '霜華', role: '永凍', color: '#bfe8ff',
    look: { skin: 'pale', hair: '#e8f8ff', hairStyle: 'long', top: '#bfe8ff', top2: '#ffffff', legs: '#bfe8ff', boots: '#8ac8e8', robe: true, hat: 'crown', hatColor: '#bfe8ff', weapon: 'rod', eyes: '#4a8ac8' },
    stat: { mag: 0.08, spr: 0.06 },
    skills: [[1, 'frost_kiss'], [2, 'glaze'], [3, 'diamond_dust'], [5, 'absolute']],
    passives: [[2, 'p_mag10'], [3, 'p_freezelong'], [5, 'p_spr10']],
    resonance: 'res_souka', key: 'permafrost', keyName: '永凍', keyDesc: '你造成的凍結持續2回合；凍結的瞬間削減1格破防',
    hunt: { el: 'ice' }, ch: 3,
    lore: ['北方的冰之國有一位不會笑的公主。', '因為她一笑，整座城就會開滿冰花。', '「冰不是冷漠，是把美好的瞬間留住。」'],
  },
  mor: {
    name: '屍術師 莫爾', short: '莫爾', role: '靈魂收割', color: '#b06aff',
    look: { skin: 'pale', hair: '#2a2a3a', hairStyle: 'short', top: '#1a1a2a', top2: '#6a3aa8', legs: '#1a1a2a', boots: '#1a1a1a', robe: true, hat: 'hood', hatColor: '#1a1a2a', weapon: 'tome', eyes: '#c84aff' },
    stat: { mag: 0.1, mp: 0.06 },
    skills: [[1, 'hex'], [2, 'rot'], [3, 'soul_burst'], [5, 'doomcall']],
    passives: [[2, 'p_mp10'], [3, 'p_soulharvest'], [5, 'p_mag10']],
    resonance: 'res_mor', key: 'harvest', keyName: '靈魂收割', keyDesc: '敵人倒下時全隊回復8% MP；目標每有一種負面狀態，你的闇屬性傷害+25%',
    hunt: { fam: 'undead' }, ch: 2,
    lore: ['大家都怕他，因為他能和死者說話。', '可是他只是在替死者，把來不及說的話說完。', '「死亡不是終點，被遺忘才是。」'],
  },
  leona: {
    name: '聖騎士 雷歐納', short: '雷歐納', role: '破邪', color: '#fff0a0',
    look: { skin: 'light', hair: '#f4d48a', hairStyle: 'short', top: '#e8eef8', top2: '#ffd04a', legs: '#c8ccd8', boots: '#8a8ea0', pauldron: '#ffd04a', hat: 'helm', hatColor: '#e8eef8', hatBand: '#ffd04a', weapon: 'sword', shield: true, cape: '#3a5ac8', eyes: '#3a6ac8' },
    stat: { hp: 0.08, atk: 0.06, spr: 0.06 },
    skills: [[1, 'smite'], [2, 'consecrate'], [3, 'aegis_light'], [5, 'divine_lance']],
    passives: [[2, 'p_hp10'], [3, 'p_antiundead'], [5, 'p_atk10']],
    resonance: 'res_leona', key: 'purge', keyName: '破邪', keyDesc: '你打中的敵人無法再生、無法以「不死」復活；對不死、惡魔系傷害×1.5',
    hunt: { fam: 'demon' }, ch: 3,
    lore: ['魔王的軍隊來襲那天，他是城裡最年輕的騎士。', '他舉起劍，劍上的光讓黑夜退後了一步。', '「光不必很強，只要不熄滅。」'],
  },
  tika: {
    name: '鍊金術士 蒂卡', short: '蒂卡', role: '調合', color: '#a8e86a',
    look: { skin: 'light', hair: '#c87a3a', hairStyle: 'bob', top: '#5a8a4a', top2: '#e8d8a0', legs: '#4a3a2a', boots: '#3a2a1a', hat: 'feather', hatColor: '#5a8a4a', weapon: 'rod', eyes: '#3a6a3a' },
    stat: { mp: 0.06, spr: 0.06, spd: 0.04 },
    skills: [[1, 'acid_flask'], [2, 'elixir_mist'], [3, 'catalyst'], [5, 'philosopher']],
    passives: [[2, 'p_itemup'], [3, 'p_itemsave'], [5, 'p_spr10']],
    resonance: 'res_tika', key: 'alchemy', keyName: '調合', keyDesc: '道具效果+60%、30%機率不消耗；投擲道具也會留下屬性狀態',
    hunt: { fam: 'amorph' }, ch: 2,
    lore: ['她的實驗室爆炸過九十九次。', '第一百次，她調出了能讓枯樹開花的藥。', '「失敗只是還沒找到對的比例。」'],
  },
  gou: {
    name: '武僧 剛', short: '剛', role: '百裂', color: '#ffb04a',
    look: { skin: 'tan', hair: '#1a1a1a', hairStyle: 'short', top: '#e8a03a', top2: '#8a3a1a', legs: '#3a2a1a', boots: '#2a1a10', weapon: null, eyes: '#2a1a10' },
    stat: { atk: 0.1, hp: 0.06 },
    skills: [[1, 'palm_strike'], [2, 'hundred_fist'], [3, 'chakra'], [5, 'dragon_fist']],
    passives: [[2, 'p_hp10'], [3, 'p_combo'], [5, 'p_atk20']],
    resonance: 'res_gou', key: 'flurry', keyName: '百裂', keyDesc: '連段換目標也不會中斷；4連段以上每次命中多削1格破防；拳套攻擊無視荊棘',
    hunt: { fam: 'beast' }, ch: 2,
    lore: ['他在瀑布下打了十年的拳。', '有一天瀑布停了一瞬間——他打出的拳，讓水倒著飛。', '「拳頭是用來守護，不是用來炫耀的。」'],
  },
  barg: {
    name: '狂戰士 巴爾格', short: '巴爾格', role: '血怒', color: '#ff6a5a',
    look: { skin: 'tan', hair: '#c83a2a', hairStyle: 'spiky', beard: '#c83a2a', top: '#5a3a2a', top2: '#2a2a2a', legs: '#3a2a1a', boots: '#2a1a10', hat: 'horned', hatColor: '#7a7a7a', weapon: 'axe', eyes: '#c83a2a' },
    stat: { atk: 0.14, hp: 0.06 },
    skills: [[1, 'cleave'], [2, 'bloodlust'], [3, 'reckless'], [5, 'rampage']],
    passives: [[2, 'p_atk10'], [3, 'p_bloodrage'], [5, 'p_hp20']],
    resonance: 'res_barg', key: 'rage', keyName: '血怒', keyDesc: 'HP低於50%時：攻擊×1.5、物理傷害吸血10%、極限累積×2',
    hunt: { trait: 'enrage' }, ch: 3,
    lore: ['他的部落被巨龍燒毀時，他只有一把斧頭。', '他追了巨龍三年，最後卻在龍窩裡救下了一顆蛋。', '「憤怒讓我站起來，但不能決定我往哪裡走。」'],
  },
  kage: {
    name: '忍者 影丸', short: '影丸', role: '影分身', color: '#8a8aaa',
    look: { skin: 'light', hair: '#1a1a2a', hairStyle: 'ponytail', top: '#2a2a3a', top2: '#c83a3a', legs: '#1a1a2a', boots: '#1a1a1a', hat: 'band', hatColor: '#c83a3a', weapon: 'katana', eyes: '#c83a3a' },
    stat: { spd: 0.14, atk: 0.05 },
    skills: [[1, 'shuriken'], [2, 'utsusemi'], [3, 'shadow_bind'], [5, 'oboro']],
    passives: [[2, 'p_spd10'], [3, 'p_dodgecounter'], [5, 'p_crit']],
    resonance: 'res_kage', key: 'shadow', keyName: '影分身', keyDesc: '每回合第一次受到的攻擊必定閃開，並立刻反擊',
    hunt: { trait: 'stealth' }, ch: 3,
    lore: ['沒有人看過他的臉。', '人們只記得，每次村子遇到危險，月光下總會多一道影子。', '「影子不會說話，但一直都在。」'],
  },
  chrono: {
    name: '時魔導士 克羅諾', short: '克羅諾', role: '時之齒輪', color: '#e8d08a',
    look: { skin: 'pale', hair: '#c8c8d8', hairStyle: 'long', top: '#3a3a6a', top2: '#e8c050', legs: '#3a3a6a', boots: '#2a2a3a', robe: true, hat: 'wizard', hatColor: '#3a3a6a', hatBand: '#e8c050', weapon: 'staff', eyes: '#e8c050' },
    stat: { spd: 0.08, mp: 0.08 },
    skills: [[1, 'haste_s'], [2, 'slow_s'], [3, 'quick_s'], [5, 'stop_s']],
    passives: [[2, 'p_mp10'], [3, 'p_timelong'], [5, 'p_spd10']],
    resonance: 'res_chrono', key: 'gears', keyName: '時之齒輪', keyDesc: '加速、緩速、停止的時間加倍；每場戰鬥一次，隊友受到致命傷時時間倒流（回到本回合開始時的HP）',
    hunt: { fam: 'spirit' }, ch: 3,
    lore: ['他修好了城裡那座停了一百年的鐘。', '鐘聲響起時，城裡的人都想起了自己忘記的事。', '「時間不會倒流，但可以被好好珍惜。」'],
  },
  gaia: {
    name: '風水師 蓋亞', short: '蓋亞', role: '地脈', color: '#8ad06a',
    look: { skin: 'dark', hair: '#4a8a3a', hairStyle: 'bob', top: '#6a5a3a', top2: '#4a8a3a', legs: '#5a4a2a', boots: '#3a2a1a', robe: true, hat: 'hood', hatColor: '#4a8a3a', weapon: 'staff', eyes: '#4a8a3a' },
    stat: { mag: 0.08, spr: 0.06 },
    skills: [[1, 'geo_fire'], [2, 'geo_water'], [3, 'geo_thunder'], [5, 'geo_quake']],
    passives: [[2, 'p_spr10'], [3, 'p_mag10'], [5, 'p_mp20']],
    resonance: 'res_gaia', key: 'leyline', keyName: '地脈', keyDesc: '你創造的領域持續5回合；每回合結束時讓全體敵人陷入該屬性的狀態',
    hunt: { fam: 'plant' }, ch: 2,
    lore: ['她能聽見大地的心跳。', '旱災那年，她找到了地底的河，整個王國因此活了下來。', '「大地一直在說話，只是我們走得太快。」'],
  },
  taka: {
    name: '弓聖 鷹', short: '鷹', role: '鷹眼', color: '#c8b890',
    look: { skin: 'light', hair: '#8a5a3a', hairStyle: 'ponytail', top: '#4a6a3a', top2: '#c8b890', legs: '#3a3a2a', boots: '#3a2a1a', hat: 'feather', hatColor: '#4a6a3a', cape: '#3a5a2a', weapon: 'bow', eyes: '#8a5a3a' },
    stat: { atk: 0.08, spd: 0.06 },
    skills: [[1, 'mark_shot'], [2, 'pin_shot'], [3, 'eagle_eye'], [5, 'piercing_arrow']],
    passives: [[2, 'p_atk10'], [3, 'p_marksman'], [5, 'p_crit']],
    resonance: 'res_taka', key: 'hawkeye', keyName: '鷹眼', keyDesc: '弓、火槍每次命中都會發現一個弱點；印記的傷害從×1.5變成×1.8，而且命中後不會消失',
    hunt: { trait: 'fly' }, ch: 2,
    lore: ['她能射中一里外的一片落葉。', '可是她一生只射過一次人——為了救一隻被獵人追趕的白鹿。', '「看得清楚，才知道什麼時候不該放箭。」'],
  },
  iwa: {
    name: '盾王 岩', short: '岩', role: '鐵壁反擊', color: '#a8a8b8',
    look: { skin: 'tan', hair: '#5a4a3a', hairStyle: 'short', beard: '#5a4a3a', top: '#7a7a8a', top2: '#3a3a4a', legs: '#5a5a6a', boots: '#3a3a3a', pauldron: '#9a9aaa', hat: 'helm', hatColor: '#7a7a8a', weapon: 'hammer', shield: true, eyes: '#3a2a1a' },
    stat: { def: 0.14, hp: 0.1 },
    skills: [[1, 'shield_bash'], [2, 'iron_wall'], [3, 'rampart'], [5, 'earthshaker']],
    passives: [[2, 'p_def10'], [3, 'p_hp20'], [5, 'p_counter']],
    resonance: 'res_iwa', key: 'bulwark', keyName: '鐵壁反擊', keyDesc: '反擊傷害×1.5；受到攻擊時多15%機率反擊；荊棘效果加倍',
    hunt: { trait: 'armor' }, ch: 2,
    lore: ['他守的橋，一千年來沒有人能通過。', '直到一個迷路的孩子哭著走來，他第一次讓開了路。', '「盾是為了讓人回家，不是為了把人擋在外面。」'],
  },
  seri: {
    name: '星占術師 星璃', short: '星璃', role: '命運之輪', color: '#d8b0ff',
    look: { skin: 'pale', hair: '#c8a0ff', hairStyle: 'long', top: '#2a1a4a', top2: '#ffe04a', legs: '#2a1a4a', boots: '#1a1030', robe: true, hat: 'circlet', hatColor: '#ffe04a', weapon: 'tome', eyes: '#ffe04a' },
    stat: { mag: 0.06, spd: 0.06, spr: 0.04 },
    skills: [[1, 'star_dice'], [2, 'comet'], [3, 'horoscope'], [5, 'stardust']],
    passives: [[2, 'p_crit'], [3, 'p_mag10'], [5, 'p_mp20']],
    resonance: 'res_seri', key: 'fortune', keyName: '命運之輪', keyDesc: '隨機目標的招式優先打破防值最少的敵人；會心率+15%；每擊破一名敵人極限值+25',
    hunt: { trait: 'reflect' }, ch: 3,
    lore: ['她替國王占卜，說王國會在星星墜落那天滅亡。', '那天她爬上高塔，把墜落的星星一顆一顆接住。', '「命運是一張地圖，不是一道命令。」'],
  },
  yuri: {
    name: '召喚士 由莉', short: '由莉', role: '契約', color: '#6ae0c0',
    look: { skin: 'light', hair: '#4ac8a0', hairStyle: 'long', top: '#2a6a5a', top2: '#e8e0ff', legs: '#2a4a4a', boots: '#1a2a2a', robe: true, hat: 'horned', hatColor: '#e8e0ff', weapon: 'rod', eyes: '#4ac8a0' },
    stat: { mag: 0.08, mp: 0.1 },
    skills: [[1, 'mana_link'], [2, 'eidolon_gift'], [3, 'call_spirit'], [5, 'pact_light']],
    passives: [[2, 'p_mp10'], [3, 'p_summonup'], [5, 'p_mp20']],
    resonance: 'res_yuri', key: 'pact', keyName: '契約', keyDesc: '召喚獸MP消耗-40%、多行動一次，大招多削2格破防',
    hunt: { trait: 'summoner' }, ch: 3,
    lore: ['幻獸們不聽任何人的命令。', '她從來不命令牠們，只是每天陪牠們看夕陽。', '「契約不是鎖鏈，是約定。」'],
  },
};
const QUIZ = (E) => [['你是誰？', [E.short, '路過的旅人', '一位國王'], 0], ['你的力量叫什麼？', ['遺忘', E.keyName, '貪婪'], 1], ['你最後說了什麼？', [E.lore[2], '「力量就是一切。」', '「與我無關。」'], 0]];
for (const [id, E] of Object.entries(NEW)) { E.quiz = QUIZ(E); E.how = '狩獵'; ECHOES[id] = E; if (!ECHO_ORDER.includes(id)) ECHO_ORDER.push(id); }
export const NEW_ECHOES = Object.keys(NEW);
export function huntText(E) {
  if (!E.hunt) return '在世界各地的「光之祠堂」通過試煉';
  const h = E.hunt;
  const what = h.fam ? ({ beast: '野獸', flying: '飛行', plant: '植物', amorph: '軟體', undead: '不死', machine: '機械', aquatic: '水棲', spirit: '靈體', dragon: '龍族', humanoid: '人型', demon: '惡魔' })[h.fam] + '系的怪物'
    : h.trait ? `有「${(TRAITS_NEW[h.trait] || { fly: [0, '飛行'], armor: [0, '重甲'], evade: [0, '敏捷'] }[h.trait])[1]}」特性的怪物` : `${ELEM[h.el]}屬性的怪物`;
  return `第${h.ch || E.ch}章以後，擊敗${what}時有機會喚醒（頭目機率更高）`;
}
export function huntMatch(E, M) { const h = E.hunt; return !!h && ((h.fam && M.fam === h.fam) || (h.trait && M.traits?.includes(h.trait)) || (h.el && M.el === h.el)); }

// ================================================================ echo pairs: two echoes in the same party
export const PAIRS = [
  ['enri', 'lan', 'steam', '蒸氣爆發', '「蒸氣」反應傷害×2，失明必定命中'],
  ['lan', 'ting', 'storm', '雷雨', '「感電」必定暈眩（頭目除外），連鎖閃電多跳一次'],
  ['souka', 'gou', 'shatter', '碎冰拳', '「粉碎」反應傷害再×1.5'],
  ['mor', 'leona', 'twilight', '光與影', '對同一目標交替用光、闇打中時傷害+40%'],
  ['evina', 'iwa', 'twinwall', '雙壁', '全隊格擋率+10%'],
  ['kaz', 'kage', 'twins', '暗影雙子', '第一回合全隊先制；會心時順手偷竊'],
  ['chrono', 'fino', 'timesong', '時之歌', '戰鬥開始時全隊加速'],
  ['yuri', 'sera', 'covenant', '聖約', '召喚獸登場時全隊回復30% HP'],
  ['taka', 'gareth', 'skyhunt', '天空獵手', '對飛行敵人傷害×1.5'],
  ['tika', 'bolt', 'workshop', '工房', '道具40%機率不消耗'],
  ['lumia', 'enri', 'pyre', '星火', '火屬性魔法讓目標燃燒時間+2回合'],
  ['unran', 'kage', 'iaido', '居合', '刀類攻擊對破防的敵人必定會心'],
];
export function pairsOf(echoes) { const s = new Set(echoes.filter(Boolean)); return PAIRS.filter(([a, b]) => s.has(a) && s.has(b)); }

// ================================================================ passives, skills and resonance for the new echoes
Object.assign(PASSIVES, {
  p_burnlong: { name: '長燃', ap: 3, desc: '你造成的燃燒多持續2回合' },
  p_wetlong: { name: '深浸', ap: 3, desc: '你造成的濕潤多持續2回合' },
  p_freezelong: { name: '寒徹', ap: 4, desc: '冰屬性打中凍傷的敵人時，30%機率直接凍結' },
  p_soulharvest: { name: '吸魂', ap: 4, desc: '你給最後一擊時回復15% MP' },
  p_antiundead: { name: '驅魔', ap: 3, desc: '對不死、惡魔系傷害×1.3' },
  p_itemup: { name: '藥學', ap: 3, desc: '回復道具的效果+30%' },
  p_itemsave: { name: '節省', ap: 4, desc: '使用道具時25%機率不消耗' },
  p_combo: { name: '氣脈', ap: 4, desc: '連段上限從5提高到8' },
  p_bloodrage: { name: '狂血', ap: 5, desc: 'HP低於30%時攻擊×1.3，極限值快速累積' },
  p_dodgecounter: { name: '見切', ap: 4, desc: '閃開攻擊後50%機率反擊' },
  p_timelong: { name: '時延', ap: 3, desc: '你施加的加速多持續2回合' },
  p_marksman: { name: '神射', ap: 3, desc: '弓、火槍的會心率+15%' },
  p_summonup: { name: '喚靈', ap: 4, desc: '召喚獸的傷害+30%' },
});
const NEW_SKILLS = {
  // enri
  ember_dart: { name: '火燄之矢', mp: 4, type: 'mag', tgt: 'enemy', pow: 1.0, el: 'fire', anim: 'fire', desc: '火屬性魔法，必定讓目標燃燒' },
  wildfire: { name: '野火', mp: 10, type: 'mag', tgt: 'enemies', pow: 0.8, el: 'fire', anim: 'fire', desc: '火屬性全體魔法' },
  cinder_dance: { name: '灰燼之舞', mp: 14, type: 'mag', tgt: 'random', pow: 0.55, hits: 4, el: ['fire', 'wind'], anim: 'fire', desc: '火、風交替的隨機四連擊（自己就能引發延燒）' },
  conflagrate: { name: '焚城', mp: 24, type: 'mag', tgt: 'enemies', pow: 1.5, el: 'fire', vsState: { burn: 2 }, anim: 'fire', desc: '火屬性全體魔法，對燃燒中的敵人×2' },
  res_enri: { name: '赤蓮天落', type: 'mag', tgt: 'enemies', pow: 3.0, el: ['fire', 'wind'], anim: 'resonance', desc: '火＋風全體大傷害，並延燒' },
  // lan
  tide_orb: { name: '潮之珠', mp: 4, type: 'mag', tgt: 'enemy', pow: 1.0, el: 'water', anim: 'water', desc: '水屬性魔法' },
  drench: { name: '浸透', mp: 6, type: 'debuff', tgt: 'enemies', pow: 0.4, el: 'water', anim: 'water', desc: '讓全體敵人濕潤（之後用雷、冰、風、土引發反應）' },
  mist_veil: { name: '水幕', mp: 12, type: 'buff', tgt: 'allies', barrier: 'fire', regen: 2, anim: 'water', desc: '全體火屬性護壁並再生' },
  tsunami: { name: '海嘯', mp: 22, type: 'mag', tgt: 'enemies', pow: 1.7, el: 'water', anim: 'water', desc: '水屬性全體大魔法' },
  res_lan: { name: '深海之詠', type: 'mag', tgt: 'enemies', pow: 2.6, el: 'water', anim: 'resonance', desc: '水屬性全體大傷害，全員濕潤' },
  // ting
  spark_arrow: { name: '雷光箭', mp: 4, type: 'phys', tgt: 'enemy', pow: 1.15, wpn: 'bow', el: 'thunder', anim: 'arrow', desc: '弓＋雷屬性攻擊' },
  storm_volley: { name: '雷雨箭', mp: 10, type: 'phys', tgt: 'random', pow: 0.5, hits: 4, wpn: 'bow', el: 'thunder', anim: 'arrow', desc: '弓＋雷隨機四連擊' },
  static_field: { name: '靜電場', mp: 12, type: 'debuff', tgt: 'enemies', addWeak: 'thunder', anim: 'thunder', desc: '3回合內敵全體弱雷' },
  judgement: { name: '天雷審判', mp: 22, type: 'phys', tgt: 'enemies', pow: 1.5, wpn: 'bow', el: 'thunder', anim: 'thunder', desc: '弓＋雷全體攻擊' },
  res_ting: { name: '萬雷穿', type: 'phys', tgt: 'enemies', pow: 3.0, wpn: 'bow', el: 'thunder', anim: 'resonance', desc: '弓＋雷全體超大傷害' },
  // souka
  frost_kiss: { name: '霜吻', mp: 4, type: 'mag', tgt: 'enemy', pow: 1.0, el: 'ice', anim: 'ice', desc: '冰屬性魔法，讓目標凍傷' },
  glaze: { name: '冰封', mp: 10, type: 'mag', tgt: 'enemy', pow: 0.6, el: 'ice', freeze: 0.7, anim: 'ice', desc: '70%直接凍結（對濕潤的敵人必定；頭目無效）' },
  diamond_dust: { name: '鑽石星塵', mp: 14, type: 'mag', tgt: 'enemies', pow: 1.2, el: 'ice', anim: 'ice', desc: '冰屬性全體魔法' },
  absolute: { name: '永劫冰棺', mp: 24, type: 'mag', tgt: 'enemy', pow: 2.4, el: 'ice', vsState: { frozen: 2, chill: 1.4 }, anim: 'ice', desc: '冰屬性大魔法，對凍結的敵人×2' },
  res_souka: { name: '白銀世界', type: 'mag', tgt: 'enemies', pow: 2.8, el: 'ice', freeze: 0.6, anim: 'resonance', desc: '冰屬性全體大傷害，60%凍結' },
  // mor
  hex: { name: '咒縛', mp: 5, type: 'debuff', tgt: 'enemy', status: 'curse', chance: 0.85, debuff: { spr: 1 }, anim: 'dark', desc: '詛咒並降低精神' },
  rot: { name: '腐蝕', mp: 9, type: 'debuff', tgt: 'enemies', pow: 0.5, el: 'dark', status: 'poison', chance: 0.5, anim: 'dark', desc: '闇屬性全體，侵蝕並50%中毒' },
  soul_burst: { name: '靈魂爆裂', mp: 14, type: 'mag', tgt: 'enemy', pow: 1.0, el: 'dark', burst: true, anim: 'dark', desc: '引爆目標身上的負面狀態，每種+60%傷害' },
  doomcall: { name: '死神召喚', mp: 18, type: 'debuff', tgt: 'enemy', status: 'doom', chance: 0.7, anim: 'dark', desc: '死亡宣告（頭目無效）' },
  res_mor: { name: '冥府之門', type: 'mag', tgt: 'enemies', pow: 2.4, el: 'dark', burst: true, anim: 'resonance', desc: '闇屬性全體，引爆負面狀態' },
  // leona
  smite: { name: '懲戒', mp: 5, type: 'phys', tgt: 'enemy', pow: 1.3, wpn: 'sword', el: 'light', anim: 'holyslash', desc: '劍＋光屬性攻擊' },
  consecrate: { name: '聖別', mp: 12, type: 'buff', tgt: 'allies', enchantEl: 'light', anim: 'holy', desc: '3回合內全隊的物理攻擊帶光屬性（對靈體、不死有效）' },
  aegis_light: { name: '聖盾', mp: 12, type: 'buff', tgt: 'allies', barrier: 'dark', buff: { def: 1 }, anim: 'buff', desc: '全體闇屬性護壁並提升防禦' },
  divine_lance: { name: '神聖之槍', mp: 22, type: 'phys', tgt: 'enemies', pow: 1.6, wpn: 'sword', el: 'light', anim: 'holy', desc: '劍＋光全體攻擊' },
  res_leona: { name: '聖光審判', type: 'phys', tgt: 'enemies', pow: 3.2, wpn: 'sword', el: 'light', dispel: true, anim: 'resonance', desc: '光屬性全體超大傷害並驅散強化' },
  // tika
  acid_flask: { name: '強酸瓶', mp: 5, type: 'debuff', tgt: 'enemy', pow: 0.6, el: 'earth', debuff: { def: 2 }, anim: 'quake', desc: '土屬性，大幅降低防禦' },
  elixir_mist: { name: '靈藥霧', mp: 12, type: 'heal', tgt: 'allies', pow: 0.8, base: 40, cure: true, anim: 'heal', desc: '全體回復並解除異常' },
  catalyst: { name: '催化', mp: 14, type: 'debuff', tgt: 'enemies', unresist: true, anim: 'scan', desc: '3回合內敵全體失去抗性、重甲與魔抗' },
  philosopher: { name: '賢者之石', mp: 28, type: 'heal', tgt: 'allies', pow: 0, healP: 0.5, mpHealFlat: 30, cure: true, anim: 'raise', desc: '全體回復50% HP、30 MP並解除異常' },
  res_tika: { name: '萬能調合', type: 'heal', tgt: 'allies', pow: 0, full: true, revive: 0.6, cure: true, anim: 'resonance', desc: '全體完全回復並復活' },
  // gou
  palm_strike: { name: '掌底', mp: 0, type: 'phys', tgt: 'enemy', pow: 1.1, art: 'knuckle', anim: 'slash', desc: '拳套攻擊，累積連段' },
  hundred_fist: { name: '百裂拳', mp: 10, type: 'phys', tgt: 'enemy', pow: 0.32, hits: 6, art: 'knuckle', anim: 'slash2', desc: '拳套六連擊' },
  chakra: { name: '氣功', mp: 8, type: 'heal', tgt: 'self', pow: 0, healP: 0.3, cure: true, anim: 'heal', desc: '回復自己30% HP並解除異常' },
  dragon_fist: { name: '昇龍拳', mp: 20, type: 'phys', tgt: 'enemy', pow: 2.8, art: 'knuckle', el: 'earth', brk: 1, anim: 'quake', desc: '拳套＋土大傷害，弱點多削1格' },
  res_gou: { name: '天地崩拳', type: 'phys', tgt: 'random', pow: 0.7, hits: 8, art: 'knuckle', el: 'earth', anim: 'resonance', desc: '拳套＋土隨機八連擊' },
  // barg
  cleave: { name: '劈砍', mp: 4, type: 'phys', tgt: 'enemies', pow: 0.8, art: 'axe', anim: 'wave', desc: '斧全體攻擊' },
  bloodlust: { name: '嗜血', mp: 0, type: 'buff', tgt: 'self', buff: { atk: 2 }, hpCost: 0.15, anim: 'buff', desc: '消耗15% HP，攻擊大幅提升' },
  reckless: { name: '捨身一擊', mp: 10, type: 'phys', tgt: 'enemy', pow: 2.6, art: 'axe', recoil: 0.1, anim: 'slash', desc: '斧大傷害，自己受到反傷' },
  rampage: { name: '暴走', mp: 18, type: 'phys', tgt: 'random', pow: 0.7, hits: 5, art: 'axe', anim: 'slash2', desc: '斧隨機五連擊' },
  res_barg: { name: '狂神之怒', type: 'phys', tgt: 'enemies', pow: 3.4, art: 'axe', anim: 'resonance', desc: '斧全體超大傷害' },
  // kage
  shuriken: { name: '手裏劍', mp: 0, type: 'phys', tgt: 'enemy', pow: 1.0, wpn: 'dagger', ranged: true, anim: 'arrow', desc: '短劍屬性遠程攻擊，不會被荊棘反傷' },
  utsusemi: { name: '空蟬', mp: 6, type: 'buff', tgt: 'self', evadeT: 1, buff: { spd: 1 }, anim: 'buff', desc: '下一次攻擊必定閃開，速度提升' },
  shadow_bind: { name: '影縫', mp: 12, type: 'debuff', tgt: 'enemy', status: 'stop', chance: 0.45, delayT: true, anim: 'dark', desc: '延後行動並45%停止' },
  oboro: { name: '朧月', mp: 20, type: 'phys', tgt: 'enemies', pow: 1.4, art: 'katana', el: 'dark', anim: 'wave', desc: '刀＋闇全體攻擊' },
  res_kage: { name: '影分身之術', type: 'phys', tgt: 'random', pow: 0.65, hits: 9, art: 'katana', el: 'dark', anim: 'resonance', desc: '刀＋闇隨機九連擊' },
  // chrono
  haste_s: { name: '加速', mp: 6, type: 'buff', tgt: 'ally', status: 'haste', self: true, anim: 'buff', desc: '單體加速' },
  slow_s: { name: '緩速', mp: 8, type: 'debuff', tgt: 'enemies', status: 'slow', chance: 0.7, anim: 'dark', desc: '敵全體70%緩速' },
  quick_s: { name: '迅捷', mp: 16, type: 'special', tgt: 'allyOther', quick: true, anim: 'buff', desc: '讓一名隊友立刻行動' },
  stop_s: { name: '停止', mp: 18, type: 'debuff', tgt: 'enemy', status: 'stop', chance: 0.6, anim: 'dark', desc: '60%停止' },
  res_chrono: { name: '時之終焉', type: 'buff', tgt: 'allies', status: 'haste', self: true, buff: { spd: 2 }, heal: 0.3, anim: 'resonance', desc: '全體加速、大幅提升速度並回復' },
  // gaia
  geo_fire: { name: '地脈・炎', mp: 8, type: 'mag', tgt: 'enemy', pow: 0.8, el: 'fire', field: 'fire', anim: 'fire', desc: '火之領域（火屬性×1.4）並造成火傷' },
  geo_water: { name: '地脈・水', mp: 8, type: 'mag', tgt: 'enemies', pow: 0.5, el: 'water', field: 'water', anim: 'water', desc: '水之領域並讓全體濕潤' },
  geo_thunder: { name: '地脈・雷', mp: 10, type: 'mag', tgt: 'enemies', pow: 0.6, el: 'thunder', field: 'thunder', anim: 'thunder', desc: '雷之領域並造成雷傷' },
  geo_quake: { name: '大地脈動', mp: 20, type: 'mag', tgt: 'enemies', pow: 1.5, el: 'earth', field: 'earth', anim: 'quake', desc: '土之領域並造成大地傷害' },
  res_gaia: { name: '星脈共鳴', type: 'mag', tgt: 'enemies', pow: 1.0, hits: 4, el: ['fire', 'water', 'thunder', 'earth'], anim: 'resonance', desc: '火→水→雷→土四連擊（自己就能連續引發反應）' },
  // taka
  mark_shot: { name: '標記射擊', mp: 4, type: 'phys', tgt: 'enemy', pow: 1.0, wpn: 'bow', markWeak: true, anim: 'arrow', desc: '在目標身上留下它弱點屬性的印記（下次該屬性傷害×1.5）' },
  pin_shot: { name: '釘射', mp: 8, type: 'phys', tgt: 'enemy', pow: 1.1, wpn: 'bow', ground: true, delayT: true, anim: 'arrow', desc: '讓飛行的敵人墜落並延後行動' },
  eagle_eye: { name: '鷹之眼', mp: 3, type: 'special', tgt: 'enemy', analyze: true, anim: 'scan', desc: '看穿目標的全部弱點' },
  piercing_arrow: { name: '破魔之矢', mp: 20, type: 'phys', tgt: 'enemy', pow: 2.4, wpn: 'bow', pierce: true, anim: 'arrow', desc: '無視防禦的強力一箭' },
  res_taka: { name: '天穹萬箭', type: 'phys', tgt: 'random', pow: 0.55, hits: 10, wpn: 'bow', anim: 'resonance', desc: '弓隨機十連擊' },
  // iwa
  shield_bash: { name: '盾擊', mp: 4, type: 'phys', tgt: 'enemy', pow: 1.0, wpn: 'hammer', delayT: true, anim: 'slash', desc: '戰鎚屬性攻擊並延後目標行動' },
  iron_wall: { name: '鐵壁', mp: 8, type: 'buff', tgt: 'self', stance: 'wall', taunt: 2, anim: 'buff', desc: '必定格擋並吸引攻擊，格擋後反擊' },
  rampart: { name: '堡壘', mp: 14, type: 'buff', tgt: 'allies', buff: { def: 2 }, anim: 'buff', desc: '全體防禦大幅提升' },
  earthshaker: { name: '震地', mp: 20, type: 'phys', tgt: 'enemies', pow: 1.3, wpn: 'hammer', el: 'earth', chip: 1, anim: 'quake', desc: '戰鎚＋土全體攻擊，不打弱點也削1格破防' },
  res_iwa: { name: '不落要塞', type: 'buff', tgt: 'allies', buff: { def: 3, spr: 3 }, heal: 0.3, anim: 'resonance', desc: '全體防禦精神極大提升並回復' },
  // seri
  star_dice: { name: '命運骰', mp: 5, type: 'mag', tgt: 'enemy', pow: 1.4, randEl: true, luck: true, anim: 'meteor', desc: '隨機屬性、威力0.5~2.5倍的魔法' },
  comet: { name: '彗星', mp: 12, type: 'mag', tgt: 'random', pow: 0.7, hits: 3, anim: 'meteor', desc: '無屬性隨機三連擊' },
  horoscope: { name: '星象', mp: 16, type: 'buff', tgt: 'allies', buff: { atk: 1, mag: 1, spd: 1 }, anim: 'song', desc: '全體攻擊、魔力、速度提升' },
  stardust: { name: '星塵爆', mp: 22, type: 'mag', tgt: 'enemies', pow: 1.6, weakEl: true, anim: 'meteor', desc: '對每個敵人都用它已知的弱點屬性' },
  res_seri: { name: '命運之星', type: 'mag', tgt: 'random', pow: 0.9, hits: 7, weakEl: true, anim: 'resonance', desc: '專打弱點的隨機七連擊' },
  // yuri
  mana_link: { name: '魔力連結', mp: 0, type: 'heal', tgt: 'ally', pow: 0, mpHealFlat: 25, anim: 'heal', desc: '回復隊友25 MP' },
  eidolon_gift: { name: '幻獸之恩', mp: 10, type: 'buff', tgt: 'allies', buff: { mag: 1 }, regen: 2, anim: 'song', desc: '全體魔力提升並再生' },
  call_spirit: { name: '精靈召喚', mp: 12, type: 'mag', tgt: 'enemies', pow: 1.0, randEl: true, anim: 'meteor', desc: '隨機屬性的全體魔法' },
  pact_light: { name: '契約之光', mp: 16, type: 'buff', tgt: 'allies', heal: 0.25, buff: { spr: 1 }, anim: 'heal', desc: '全體回復25%並提升精神' },
  res_yuri: { name: '幻獸總進擊', type: 'mag', tgt: 'random', pow: 0.9, hits: 6, el: ['fire', 'ice', 'thunder', 'water'], anim: 'resonance', desc: '火冰雷水隨機六連擊' },
};

// ================================================================ gear sets
export const SETS = {
  inferno: { name: '焰獄', tier: 4, fams: ['dragon', 'demon', 'spirit'], pieces: [['g_rod5', '焰獄魔杖'], ['g_body_robe5', '焰獄法袍'], ['g_head_robe5', '焰獄法冠'], ['g_back_robe5', '焰獄披肩']], b2: { elUp: { fire: 0.25 } }, b4: { burnAmp: 1, spreadBurn: 1 }, d2: '火屬性傷害+25%', d4: '燃燒傷害×2，燃燒的敵人倒下時火焰蔓延' },
  tide: { name: '潮鳴', tier: 3, fams: ['aquatic', 'amorph'], pieces: [['g_staff4', '潮鳴法杖'], ['g_body_light4', '潮鳴皮甲'], ['g_legs_light4', '潮鳴綁腿'], ['g_feet_light4', '潮鳴長靴']], b2: { elUp: { water: 0.25 }, resist: { water: 0.5 } }, b4: { wetAll: 1, wetAmp: 0.2 }, d2: '水屬性傷害+25%、水傷害減半', d4: '水屬性攻擊讓全體敵人濕潤；濕潤的敵人受傷+20%' },
  thunder: { name: '雷帝', tier: 4, fams: ['machine', 'flying'], pieces: [['g_bow5', '雷帝之弓'], ['g_head_light5', '雷帝頭巾'], ['g_body_light5', '雷帝戰衣'], ['g_arms_light5', '雷帝護腕']], b2: { elUp: { thunder: 0.25 } }, b4: { shockStun: 1, chainT: 1 }, d2: '雷屬性傷害+25%', d4: '「感電」必定暈眩（頭目除外），雷屬性攻擊跳到另一名敵人' },
  vigil: { name: '守夜人', tier: 3, fams: ['undead', 'spirit'], pieces: [['g_sword4', '守夜人之劍'], ['g_head_heavy4', '守夜人頭盔'], ['g_body_heavy4', '守夜人鎧甲'], ['g_back_heavy4', '守夜人披風']], b2: { elUp: { light: 0.25 }, slay: { undead: 1.3 } }, b4: { antiUndying: 1, killHeal: 0.06 }, d2: '光屬性傷害+25%、對不死系×1.3', d4: '你打中的敵人無法「不死」復活；擊倒敵人時回復6% HP' },
  shadow: { name: '影舞', tier: 2, fams: ['beast', 'humanoid'], pieces: [['g_dagger4', '影舞短劍'], ['g_body_light3', '影舞夜行衣'], ['g_feet_light3', '影舞足袋'], ['g_back_light3', '影舞面紗']], b2: { evade: 0.1 }, b4: { dodgeCounter: 1, crit: 0.1 }, d2: '閃避+10%', d4: '閃開攻擊後必定反擊、會心+10%' },
  bastion: { name: '不滅', tier: 5, fams: ['dragon', 'machine'], pieces: [['g_tower7', '不滅塔盾'], ['g_body_heavy6', '不滅重鎧'], ['g_legs_heavy6', '不滅護腿'], ['g_feet_heavy6', '不滅鐵靴']], b2: { hpP: 0.15 }, b4: { blockUp: 0.2, thorns: 0.3 }, d2: 'HP+15%', d4: '格擋率+20%、反傷30%' },
  sage: { name: '賢者', tier: 5, fams: ['demon', 'humanoid'], pieces: [['g_tome6', '賢者魔導書'], ['g_head_robe6', '賢者之冠'], ['g_body_robe6', '賢者長袍'], ['g_arms_robe6', '賢者手套']], b2: { mpcost: 0.2 }, b4: { dualcast: 0.25 }, d2: 'MP消耗-20%', d4: '魔法25%機率連續詠唱' },
  hunter: { name: '獵人', tier: 2, fams: ['flying', 'beast'], pieces: [['g_bow3', '獵人長弓'], ['g_head_light3', '獵人羽帽'], ['g_arms_light3', '獵人護手'], ['g_legs_light3', '獵人綁腿']], b2: { slay: { flying: 1.3 } }, b4: { revealHit: 1, markAmp: 0.5 }, d2: '對飛行敵人×1.3', d4: '每次命中發現一個弱點；印記傷害再+50%' },
};
export function setBonus(equipIds) {
  const count = {};
  for (const id of equipIds) { const g = GEAR[id]; if (g?.set) count[g.set] = (count[g.set] || 0) + 1; }
  const out = [];
  for (const [s, n] of Object.entries(count)) { const D = SETS[s]; if (n >= 2) out.push(D.b2); if (n >= 4) out.push(D.b4); }
  return { count, fx: out };
}

// ================================================================ wire it all in (called at the end of content.js)
export function applyDepth({ GEAR_BY_TIER, TRAIT_N, STATUS_N, STATUS_S, put }) {
  Object.assign(SKILLS, NEW_SKILLS);
  Object.assign(TRAIT_N, TRAITS_NEW);
  for (const [k, [ic, n]] of Object.entries(STATE_N)) { STATUS_N[k] = n; STATUS_S[k] = ic; }
  STATUS_N.enraged = '狂暴'; STATUS_S.enraged = '💢'; STATUS_N.hidden = '隱匿'; STATUS_S.hidden = '🫥';
  // set pieces: copies of a base piece with a name and a set
  for (const [sid, D] of Object.entries(SETS)) D.pieces.forEach(([base, name], i) => {
    const B = GEAR[base]; if (!B) return;
    const id = `g_set_${sid}${i + 1}`;
    const g = { ...B, name, set: sid, rare: true, price: Math.round((B.price || 500) * 2.5), base, desc: `〔${D.name}〕套裝` };
    for (const k of ['atk', 'def', 'mag', 'spr']) if (g[k] > 0) g[k] = Math.round(g[k] * 1.12);
    put(id, g);
    GEAR_BY_TIER[Math.min(7, D.tier + 1)].rare.push(id);
  });
  // traits: a family flavour that grows with level; bosses get fair ones
  for (const [id, E] of Object.entries(ENEMIES)) {
    if (E.metal || E.fixedTraits) { if (E.traits?.includes('aura')) E.aura = E.aura || (hashStr(id) % 2 ? 'might' : 'guard'); if (E.traits?.includes('absorb') && E.el) E.absorb = [E.el]; continue; }
    const h = hashStr(id + E.name), base = new Set(E.traits || []);
    // story climaxes are already tuned (they act twice); optional superbosses get the most
    let want = E.boss ? ((E.twice || 0) >= 0.7 && E.lv < 40 ? 0 : E.lv >= 40 ? 2 : E.lv >= 12 ? 1 : 0) : E.lv < 8 ? 0 : E.lv < 18 ? 1 : E.lv < 34 ? 2 : 3;
    const pool = E.boss ? BOSS_T : [...(FAM_T[E.fam] || []), ...['thorns', 'regen', 'curse', 'stealth', 'enrage', 'burst', 'reflect', 'swarm']];
    let i = 0;
    while (want > 0 && i < pool.length * 2) {
      const t = pool[(h >>> (i * 3)) % pool.length + (i >= pool.length ? 0 : 0)] || pool[i % pool.length]; i++;
      if (base.has(t)) continue;
      if (t === 'ghost' && (base.has('mimmune') || base.has('armor'))) continue;
      if (t === 'mimmune' && base.has('ghost')) continue;
      if (t === 'absorb' && !E.el) continue;
      if (t === 'summoner' && E.boss && E.lv < 20) continue;
      if (t === 'reflect' && E.boss && E.lv < 25) continue;
      if (t === 'stealth' && E.lv < 12) continue;
      base.add(t); want--;
      // the first few levels of each family only get its signature trait
      if (!E.boss && E.lv < 14) break;
    }
    E.traits = [...base];
    if (base.has('aura')) E.aura = h % 2 ? 'might' : 'guard';
    if (base.has('absorb')) E.absorb = [E.el];
  }
  // set pieces drop from the families that guard them, in their tier band
  for (const [id, E] of Object.entries(ENEMIES)) {
    if (E.sig || !E.drops?.[3] || !String(E.drops[3][0]).startsWith('g_')) continue;
    const h = hashStr(id);
    for (const [sid, D] of Object.entries(SETS)) {
      if (!D.fams.includes(E.fam) || Math.abs(E.tier - D.tier) > 1 || (!E.boss && h % 3)) continue;
      E.drops[3] = [`g_set_${sid}${1 + (h >>> 4) % 4}`, E.boss ? 0.3 : 0.03];
      break;
    }
  }
}
