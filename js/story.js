// The story, every conversation, side quests, sanctum trials, minigames and the shops' stock.
import { HEROES, ECHOES, SKILLS, ITEMS, GEAR, ENEMIES, ARENA, SUMMONS } from './data.js?v=15';
import { addHero, addEcho, setEcho, addItem, itemName, healAll, heroStats } from './party.js?v=15';
import { GEAR_BY_TIER, SPELLS } from './content.js?v=15';
import { sideStory, SIDE_QUESTS } from './sidestory.js?v=15';

const wait = (ms) => new Promise(r => setTimeout(r, ms));

// shop stock comes from the generated tables: plain gear of the town's tiers, a few rare pieces, and items
const tierGear = (tiers) => tiers.flatMap(t => GEAR_BY_TIER[t].base);
const rareGear = (tiers, n, seed) => { const pool = tiers.flatMap(t => GEAR_BY_TIER[t].rare); const out = []; for (let i = 0; i < n && pool.length; i++) out.push(pool[(seed * 7 + i * 37) % pool.length]); return [...new Set(out)]; };
const accGear = (maxT) => GEAR_BY_TIER.slice(0, maxT + 1).flatMap(b => b.acc).filter(g => GEAR[g].price);
const foods = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => `i_food${a + i}`);
const scrollsUpTo = (t) => Object.keys(ITEMS).filter(i => ITEMS[i].cat === 'scroll' && SKILLS[ITEMS[i].use.cast].tier <= t);
export const SHOPS = {
  port_items: ['potion', 'ether', 'antidote', 'i_c_poison', 'i_c_sleep', 'i_c_blind', 'feather', 'tent', 'bombfrag', 'frostfrag', 'i_tw_dagger1', 'i_tw_hammer1', 'smokeball', 'i_repel', 'i_scope', ...foods(1, 6)],
  port_gear: [...tierGear([0, 1])],
  anvil_items: ['potion', 'hipotion', 'ether', 'antidote', 'i_c_poison', 'i_c_sleep', 'i_c_silence', 'i_c_blind', 'i_c_slow', 'i_c_stun', 'feather', 'tent', 'smokeball', 'i_repel', 'i_lure', 'i_scope', 'i_b_atk1', 'i_b_def1', 'i_b_mag1', 'i_b_spr1', 'i_b_spd1', 'i_refine1', 'i_refine2', ...foods(7, 18)],
  anvil_gear: [...tierGear([2, 3])],
  anvil_mats: ['bombfrag', 'frostfrag', 'boltfrag', 'i_t_water1', 'i_t_wind1', 'i_t_earth1', 'i_t_light1', 'i_t_dark1', ...['dagger', 'spear', 'axe', 'hammer', 'bow', 'gun', 'boomerang', 'sword'].map(w => `i_tw_${w}1`), 'i_s_poison1', 'i_s_sleep1', 'i_s_blind1', 'i_s_silence1', 'megapotion', ...rareGear([1, 2, 3], 14, 3)],
  azur_items: ['hipotion', 'i_hp3', 'i_hp4', 'xpotion', 'ether', 'hiether', 'i_mp3', 'i_el1', 'antidote', 'i_c_all', 'i_c_confuse', 'i_c_curse', 'feather', 'i_rv2', 'megapotion', 'i_ga2', 'tent', 'i_cottage', 'i_warp', 'i_repel', 'i_haste', 'i_regen', 'i_reflect', 'i_ba_atk1', 'i_ba_def1', 'i_ba_mag1', 'i_ba_spr1', 'i_ba_spd1', 'i_refine3', ...foods(19, 40), ...scrollsUpTo(3)],
  azur_gear: [...tierGear([4, 5]).filter(g => GEAR[g].slot === 'hand'), ...rareGear([3, 4, 5], 16, 11)],
  azur_armor: [...tierGear([4, 5]).filter(g => GEAR[g].slot !== 'hand'), ...accGear(5)],
  late_items: ['i_hp5', 'i_hp6', 'i_mp4', 'i_el2', 'i_ga3', 'i_rv3', 'i_gm1', 'i_reraise', 'i_mirror', 'i_refine4', ...ELS_T(2), ...ELS_T(3), ...scrollsUpTo(5)],
  late_gear: [...tierGear([6, 7]), ...rareGear([6, 7], 20, 5), ...accGear(7)],
};
function ELS_T(t) { return ['fire', 'ice', 'thunder', 'water', 'wind', 'earth', 'light', 'dark'].map(e => `i_t_${e}${t}`); }
export const SPELL_SHOP = (maxTier) => SPELLS.filter(s => SKILLS[s].tier <= maxTier && !/x\d_/.test(s));
const INN_PRICE = { port: 30, anvil: 60, azurelle: 100 };

// ---------------------------------------------------------------- quests
export const QUESTS = {
  q_bigfang: { name: '討伐巨牙狼王', board: 'board_port', from: '白帆港 漁夫工會', desc: '港口東邊的道路上（港口出口往東一點），出現了一頭巨大的狼王，害商人不敢出門。請把牠打倒！', rewardText: '600 G', reward: { gil: 600 } },
  q_necklace: { name: '遺失的貝殼項鍊', board: 'board_port', from: '港口的小女孩 莉莉', desc: '我和爸爸去森林採草藥時，把媽媽送我的貝殼項鍊弄丟了……好像是在低語森林的深處。', rewardText: '復甦之羽 ×2、300 G', reward: { gil: 300, items: [['feather', 2]] } },
  q_mogu: { name: '咪咕捉迷藏', board: 'board_port', from: '神殿的修女', desc: '神殿養的五隻小咪咕跑出去玩，躲在港口各個角落不回來。找到牠們，靠近按確定就能抓住喔！', rewardText: '迴響碎片 ×1、500 G', reward: { gil: 500, items: [['shard', 1]] } },
  q_jump: { name: '跳繩大挑戰', board: 'board_port', from: '港口的小孩 小葵', desc: '跟我一起跳繩！連續跳 20 下以上就算你厲害！', rewardText: '迴響碎片 ×1', reward: { items: [['shard', 1]] } },
  q_letter: { name: '老漁夫的信', board: 'board_port', from: '老漁夫 哈克', desc: '把這封信送給鐵砧城的鍛冶師傅。他是我年輕時的老朋友。', rewardText: '高級回復藥 ×3、星鐵 ×1', reward: { items: [['hipotion', 3], ['stariron', 1]] }, after: 'ch2' },
  q_golem: { name: '討伐鐵甲魔像', board: 'board_anvil', from: '鐵砧城 礦工公會', desc: '風鳴礦坑東側的岔路深處，有一隻失控的鐵甲魔像在守著礦脈。打倒牠！', rewardText: '1200 G（魔像身上會掉星鐵）', reward: { gil: 1200 } },
  q_windgem: { name: '收集風晶石', board: 'board_anvil', from: '飛空艇技師 波可', desc: '我在研究新的風力引擎，需要三顆「風晶石」。礦坑裡的風之精和岩石魔像身上有。', rewardText: '迴響碎片 ×2、800 G', reward: { gil: 800, items: [['shard', 2]] } },
  q_leo: { name: '熔爐之心的試煉', board: 'board_anvil', from: '鐵砧城 鍛冶師傅', desc: '城裡的大熔爐深處住著炎獅「烈牙」。據說得到牠認可的人，可以召喚牠的力量。去鍛冶屋找我。', rewardText: '召喚獸「炎獅 烈牙」', reward: {} },
  q_kingcrab: { name: '討伐霸王蟹', board: 'board_azur', from: '蒼瀾 漁民公會', desc: '蒼瀾西南方的湖岸邊（往沉沒神殿的路口西側），霸王蟹把漁網都剪壞了。', rewardText: '2000 G（霸王蟹身上有生命護符）', reward: { gil: 2000 } },
  q_fox: { name: '霜狐的雪原', board: 'board_azur', from: '水守長老', desc: '大陸西北的雪原上住著霜狐「霜月」。雪原和這邊隔著一條淺河，要騎乘機械鳥才過得去。', rewardText: '召喚獸「霜狐 霜月」', reward: {}, after: 'bird' },
  q_whale: { name: '鯨之歌', board: 'board_azur', from: '湖邊的詩人', desc: '湖的東南角有一片淺灘，夜裡會聽見巨鯨的歌聲。騎著機械鳥去看看吧。', rewardText: '召喚獸「潮鯨 滄溟」', reward: {}, after: 'bird' },
  q_hawk: { name: '雷鳴峰的守護者', board: 'board_azur', from: '天文學者', desc: '山脈中央有一座只能從天空抵達的高峰，雷鷹「雷翼」在那裡築巢。', rewardText: '召喚獸「雷鷹 雷翼」', reward: {}, after: 'airship_built' },
};
Object.assign(QUESTS, SIDE_QUESTS);

// ---------------------------------------------------------------- objectives per story step
export function objectiveText(G) {
  const f = G.S.flags;
  if (!f.intro_done) return '';
  if (!f.priest_talked) return '到港口北邊高處的「海潮神殿」找神官';
  if (!f.talo_joined) return '去廣場找算命的男孩塔洛';
  if (!f.saren_met) return '入夜了，前往港口南邊碼頭的燈塔';
  if (!f.rottree_done) return '追擊灰燼的薩倫，前往北方的「低語森林」';
  if (!f.rena_joined) return '越過森林東方，前往山腳下的「鐵砧城」';
  if (!f.tia_done) return '前往鐵砧城北方的「風鳴礦坑」';
  if (!f.neo_joined) return '渡過東邊的大橋，前往「水都蒼瀾」';
  if (!f.serene_done) return '經由湖上的堤道，前往「沉沒神殿」';
  if (!f.airship_built) return '回到鐵砧城，到蕾娜的工房打造飛空艇';
  if (!f.finale_done) return '搭乘飛空艇，前往東北高原上空的「浮空遺跡」';
  return '自由探索：競技場、四處封印之地、光之祠堂';
}

// ---------------------------------------------------------------- helpers bound to the game
export function makeStory(G) {
  const S = () => G.S, F = () => G.S.flags, ui = G.ui;
  const say = (who, text, look, o) => ui.say(who, text, look === undefined ? whoLook(who) : look, o);
  const narr = (text) => ui.say('', text, null, { narr: true });
  const whoLook = (who) => ({ 艾倫: 'aren', 希爾薇: 'sylvie', 米菈: 'mira', 塔洛: 'talo', 蕾娜: 'rena', 尼歐: 'neo' })[who] || null;
  const flag = (k, v = true) => { F()[k] = v; };
  const give = (id, n = 1, quiet) => { addItem(S(), id, n); if (!quiet) { ui.toast(`獲得 <b>${itemName(id)}</b>${n > 1 ? ' ×' + n : ''}`); G.audio.sfx('item'); } };
  const gil = (n) => { S().gil += n; ui.toast(`獲得 <b>${n} G</b>`); G.audio.sfx('item'); };
  const join = async (id, lv) => { addHero(S(), id, lv); G.audio.sfx('levelup'); ui.toast(`<b>${HEROES[id].name}</b> 加入了隊伍！`, 2600); if (S().reserve.includes(id)) ui.toast('隊伍滿了，可以在選單的「隊伍編成」換人上場', 4000); ui.hud(); };
  const echo = async (eid, hero) => {
    addEcho(S(), eid); G.audio.sfx('resonance');
    ui.toast(`獲得迴響水晶「<b>${ECHOES[eid].name}</b>」！`, 3000);
    if (hero && S().heroes[hero] && !S().heroes[hero].echo) setEcho(S(), hero, eid);
    else { const free = S().party.find(h => S().heroes[h] && !S().heroes[h].echo); if (free) setEcho(S(), free, eid); }
  };
  const battle = (troop, o = {}) => G.fight({ troop, ...o });
  const npcW = (id) => G.field.npc(id);
  const player = () => G.field.player;
  const leader = () => HEROES[S().party[0]].name;
  const quest = (q) => S().quests[q];
  const setQ = (q, v) => { S().quests[q] = v; G.field.refreshBubbles(); };
  let side; // the side story, made once the helpers below exist

  async function rewardQuest(q) {
    const Q = QUESTS[q]; setQ(q, 'done');
    G.audio.sfx('levelup'); ui.toast(`委託完成：<b>${Q.name}</b>`, 2600);
    if (Q.reward.gil) gil(Q.reward.gil);
    for (const [id, n] of Q.reward.items || []) give(id, n);
  }

  // shops that also teach magic, and weapon shops that also refine
  const shopOrMagic = async (list, title, tier) => {
    for (;;) { const c = await ui.choose([{ label: '買賣道具' }, { label: '學習魔法', sub: `第${tier}級以下` }], { title, cls: 'small' }); if (c < 0) return; if (c === 0) await ui.shop(list, title); else await ui.magicShop(SPELL_SHOP(tier), '魔法店'); }
  };
  const gearOrSmith = async (list, title, maxTier) => {
    for (;;) { const c = await ui.choose([{ label: '買賣裝備' }, { label: '強化・鑲嵌' }], { title, cls: 'small' }); if (c < 0) return; if (c === 0) await ui.shop(list, title); else await ui.smith(maxTier); }
  };

  side = sideStory(G, { say, narr, flag, give, gil, battle, echo, quest, setQ, player, F, S, ui, wait });

  // ---------------------------------------------------------------- events (map triggers)
  const EV = {
    async intro() {
      G.field.locked = true;
      await ui.fade(1, 10);
      G.audio.music('title');
      await narr('在艾斯特蘭大陸，人們相信——\n水晶裡沉睡著古代英雄們的「迴響」。');
      await narr('英雄的回憶化成光，守護著大地。\n只要還有人記得他們，水晶就會一直發光。');
      await narr('但是最近，各地的水晶一個接一個地黯淡下來……');
      await ui.fade(0, 800);
      G.audio.music('town');
      const p = player();
      const mira = G.field.addNpc({ id: 'mira_tmp', look: 'mira', x: Math.floor(p.x) - 1, z: Math.floor(p.z), dir: 'up' });
      await say('米菈', '到了到了！這裡就是白帆港！\n海的味道好香喔，艾倫！');
      await say('艾倫', '米菈，別跑太快。我們是來工作的——\n騎士團交代我護送你到港口的燈塔，調律那裡的「潮聲水晶」。');
      await say('米菈', '我知道啦～不過調律要等神官大人的許可才行。\n我們先去神殿打聲招呼吧！');
      const syl = G.field.addNpc({ id: 'syl_tmp', look: 'sylvie', x: 22, z: 17, dir: 'left' });
      await G.field.walk(syl, [[19, 18], [18, 20]], 3.5);
      G.field.face(syl, p);
      await say('希爾薇', '……果然是你，艾倫。騎士團說會派人來，沒想到是你這個菜鳥。');
      await say('艾倫', '希爾薇前輩！你被派駐在這個港口嗎？');
      await say('希爾薇', '燈塔的水晶這幾天光芒忽明忽暗，港口的人都很不安。\n我也一起去神殿吧。神殿在北邊的高處，走樓梯上去。');
      await say('希爾薇', '對了，到了新的城鎮，記得看看廣場上的「委託板」。\n幫居民的忙，可以得到不錯的報酬。');
      G.field.removeNpc('mira_tmp'); G.field.removeNpc('syl_tmp');
      await join('mira', 1); await join('sylvie', 2);
      flag('intro_done'); G.updateObjective();
      ui.toast(G.input.touchy ? '點右下角 <b>☰</b> 打開選單' : '按 <b>C</b>（或右下角 ☰）打開選單', 3500);
      G.field.locked = false;
    },
    async lighthouse_gate() {
      if (F().talo_joined) return;
      await say('希爾薇', '燈塔要等神官大人的許可才能進去。');
      G.field.player.z -= 0.6; G.field.syncWalker(G.field.player);
    },
    async lighthouse_scene() {
      G.field.locked = true;
      flag('saren_met');
      const saren = G.field.addNpc({ id: 'saren', look: 'cultist', x: 6, z: 4, dir: 'up' });
      await say('米菈', '水晶……光芒好微弱。我馬上開始調律——');
      await say('塔洛', '等等！有人在那裡！');
      G.field.face(saren, player());
      await say('？？？', '來得正好，海潮神殿的小調律師。\n可惜你調律的不是時候。', 'cultist');
      await say('艾倫', '你是誰！離水晶遠一點！');
      await say('灰燼的薩倫', '我是「蝕夜六使」之一，灰燼的薩倫。\n這個世界的迴響太吵了。我們要讓一切回歸「緘默」。', 'cultist');
      G.camShake?.(0.5);
      const cr = G.field.built.props.find(p => p.id === 'tidecrystal'); if (cr) { cr.mat.emissiveIntensity = 0.2; cr.mat.color.set('#5a7a8a'); }
      G.audio.sfx('break');
      await say('灰燼的薩倫', '……這座燈塔，還是跟以前一樣亮啊。', 'cultist');
      await say('塔洛', '以前？', 'talo');
      await say('灰燼的薩倫', '水晶已經裂開了。陪我的獵犬們玩玩吧。', 'cultist');
      ui.toast('戰鬥提示：攻擊敵人的<b>弱點</b>可以削減「破防值」！', 4000);
      const r = await battle(['ashhound', 'ashhound'], { bg: 'temple', noFlee: true, tutorial: 'break' });
      if (r !== 'win') return;
      await say('灰燼的薩倫', '哼，有點本事。……不過，這座水晶我已經拿到想要的東西了。', 'cultist');
      await say('灰燼的薩倫', '下一個是北方「低語森林」的古樹。\n你們追得上的話，就來吧。', 'cultist');
      G.field.removeNpc('saren');
      G.audio.sfx('flee');
      await wait(400);
      if (cr) { cr.mat.emissiveIntensity = 1.6; cr.mat.color.set('#ffe8a0'); }
      G.audio.sfx('resonance');
      await narr('裂開的水晶裡，一道溫暖的光飄了出來，\n停在艾倫的掌心。');
      await say('？？？', '……謝謝你們守住了它。\n我是很久以前守護這片海的騎士，艾薇娜。', 'evina');
      await say('艾薇娜', '水晶碎了，但我的迴響還在。\n讓我借給你力量吧，年輕的騎士。', 'evina');
      await echo('evina', 'aren');
      await say('米菈', '是「迴響水晶」！傳說中的英雄的力量……！');
      await say('塔洛', '裝備迴響就能用英雄的技能。打越多仗，「羈絆」越深，還能學會被動能力喔。\n——書上是這樣寫的。');
      await say('塔洛', '還有，如果在同一回合讓所有敵人都「破防」，就會進入「追加階段」，\n最後還能發動迴響的必殺技「共鳴」！');
      await say('希爾薇', '先回港口休息吧。天亮後，我們去追那個薩倫。');
      ui.toast('打開選單的「迴響水晶」可以更換迴響', 3500);
      flag('port_night', false);
      S().chapter = 1;
      G.updateObjective();
      await G.warp('port', 28, 26, 'down', { quiet: true });
      await say('塔洛', '對了，森林東邊有一座「光之祠堂」。\n那裡沉睡著另一位英雄的迴響。順路去看看吧！');
      G.field.locked = false;
    },
    async rottree() {
      G.field.locked = true;
      await say('米菈', '這棵大樹……在哭泣。樹幹裡有黑色的灰燼在蔓延！');
      await say('艾倫', '是薩倫做的！大家，準備戰鬥！');
      const r = await battle(['rottree'], { bg: 'forest', noFlee: true });
      if (r !== 'win') return;
      flag('rottree_done');
      await narr('灰燼散去，古樹的葉子重新變回了翠綠色。\n樹根下，一顆小小的水晶碎片閃著光。');
      await say('米菈', '水晶碎片裡……有影像！');
      await narr('影像裡，六個穿著黑袍的人影站在一座浮在空中的遺跡上。\n「蝕夜六使」的目標，是大陸上的「大水晶」。');
      await say('希爾薇', '東邊山腳下的「鐵砧城」，北邊礦坑的深處就有一顆風之大水晶。\n他們下一個目標一定是那裡。');
      await say('塔洛', '鐵砧城在森林東邊，過了山腳就是了。\n……我只是順便跟去喔，順便。');
      S().chapter = 2; G.updateObjective();
      await ui.chapter(2, '鐵與風之城', '鐵砧城與風鳴礦坑');
      G.field.locked = false;
    },
    async tia() {
      G.field.locked = true;
      const tia = G.field.addNpc({ id: 'tia', look: { skin: 'pale', hair: '#8affb0', hairStyle: 'long', top: '#3a8a6a', top2: '#e8e0a0', legs: '#1a4a3a', boots: '#2a2a2a', cape: '#1a4a3a', weapon: 'spear', hat: 'hood', hatColor: '#1a4a3a' }, x: 12, z: 5, dir: 'down' });
      await say('嵐羽的緹雅', '哎呀，薩倫說的就是你們？\n比想像中還小隻嘛。', tia.def.look);
      await say('蕾娜', '就是你把礦坑封起來的！大家都沒辦法工作了！', 'rena');
      await say('嵐羽的緹雅', '工作？迴響？吵死了。\n風會把一切都吹散——你們的回憶也一樣！', tia.def.look);
      const r = await battle(['tia'], { bg: 'cave', noFlee: true });
      if (r !== 'win') return;
      flag('tia_done');
      await say('嵐羽的緹雅', '……可惡，我竟然輸了。\n不過沒關係，「無聲者」大人說過，大水晶不只這一顆。', tia.def.look);
      await say('蕾娜', '你為什麼要討厭回憶？大家都只是想好好工作而已！', 'rena');
      await say('嵐羽的緹雅', '……我出生的村子在一場大風裡被吹走了。後來的地圖上，那裡畫的是一片草原。\n連地圖都不記得的地方，回憶又有什麼用。', tia.def.look);
      G.field.removeNpc('tia'); G.audio.sfx('flee');
      await narr('風之大水晶重新發出了明亮的綠光。\n礦坑裡吹起了溫柔的風。');
      await say('蕾娜', '啾比！你怎麼了——啾比在發光！', 'rena');
      await narr('水晶的風捲起蕾娜的機械鳥「啾比」，\n它的身體一下子變得好大好大！');
      await say('蕾娜', '哇……啾比變得可以載人了！\n有了它，在大陸上移動就快多了，還能越過淺淺的河呢！', 'rena');
      flag('bird');
      ui.toast('在大地圖上按 <b>R</b>（或 🐦 按鈕）可以騎乘機械鳥', 4000);
      await say('希爾薇', '緹雅說的「無聲者」……應該就是六使的首領。\n下一顆大水晶在東邊，水都「蒼瀾」的沉沒神殿裡。');
      S().chapter = 3; G.updateObjective();
      await ui.chapter(3, '水之都的守護者', '水都蒼瀾與沉沒神殿');
      G.field.locked = false;
    },
    async serene() {
      G.field.locked = true;
      const se = G.field.addNpc({ id: 'serene', look: { skin: 'pale', hair: '#8ae0ff', hairStyle: 'long', top: '#3a5ab8', top2: '#f4e8ff', legs: '#3a5ab8', boots: '#2a2a4a', robe: true, hat: 'hood', hatColor: '#2a3a8a', weapon: 'rod' }, x: 12, z: 6, dir: 'down' });
      await say('潮華的瑟琳', '水守的小少爺，你來得太晚了。\n水神的迴響，已經是我的了。', se.def.look);
      await say('尼歐', '瑟琳……你曾經也是水守的一員！為什麼要背叛蒼瀾？', 'neo');
      await say('潮華的瑟琳', '因為沒有人記得我。\n我守了水晶十年，大家只記得水神，不記得我。', se.def.look);
      await say('潮華的瑟琳', '那就讓所有的迴響都消失吧——這樣才公平！', se.def.look);
      let r = await battle(['serene'], { bg: 'temple', noFlee: true });
      if (r !== 'win') return;
      await say('潮華的瑟琳', '水神之影，出來吧！把他們吞沒！', se.def.look);
      r = await battle(['leviath', 'eel', 'eel'], { bg: 'temple', noFlee: true });
      if (r !== 'win') return;
      flag('serene_done');
      await say('潮華的瑟琳', '……我輸了。\n可是你們阻止不了「緘默」的。浮空遺跡已經升上天空了。', se.def.look);
      await say('尼歐', '瑟琳……我記得你。小時候教我射箭的人，就是你。', 'neo');
      await say('潮華的瑟琳', '…………', se.def.look);
      G.field.removeNpc('serene'); G.audio.sfx('flee');
      await narr('瑟琳沒有再說什麼，化作一陣水霧消失了。\n水之大水晶恢復了湛藍的光芒。');
      await say('蕾娜', '浮空遺跡在天上的話……我們需要飛空艇！\n爺爺的工房裡有一艘做到一半的船，只差一個零件——', 'rena');
      await say('尼歐', '水守之殿裡收藏著「水晶透鏡」。帶去吧，就當作謝禮。', 'neo');
      give('k_lens');
      G.updateObjective();
      G.field.locked = false;
    },
    async saren2() {
      G.field.locked = true;
      const sa = G.field.addNpc({ id: 'saren', look: 'cultist', x: 14, z: 15, dir: 'down' });
      await say('灰燼的薩倫', '真沒想到，你們真的追到天上來了。', 'cultist');
      await say('艾倫', '薩倫！你們到底想做什麼？讓所有的迴響消失，又有什麼好處！');
      await say('灰燼的薩倫', '三十年前，白帆港的燈塔守是我爸爸。暴風雨那晚，他為了點燈死在燈塔上。\n三艘船都回來了。可是重建燈塔的時候，牌子上只刻了出錢的商人。', 'cultist');
      await say('灰燼的薩倫', '你不懂。被遺忘的人，有多寂寞。\n——不過，先打贏我再說吧！', 'cultist');
      const r = await battle(['saren'], { bg: 'sky', noFlee: true });
      if (r !== 'win') return;
      flag('saren2_done');
      await say('灰燼的薩倫', '……去吧。最上面，「無聲者」歐勒斯大人在等你們。\n聽聽他的故事。他……其實也是一位英雄。', 'cultist');
      await say('艾倫', '薩倫。你爸爸的名字，是什麼？');
      await say('灰燼的薩倫', '…………薩爾。燈塔守，薩爾。', 'cultist');
      G.field.removeNpc('saren');
      G.field.locked = false;
    },
    async finale() {
      G.field.locked = true;
      const or = G.field.addNpc({ id: 'ores', look: { skin: 'pale', hair: '#e8e8f0', hairStyle: 'long', top: '#d8d8e8', top2: '#8a8aa8', legs: '#4a4a6a', boots: '#2a2a3a', cape: '#4a4a6a', weapon: 'sword', shield: true, pauldron: '#8a8aa8' }, x: 14, z: 8, dir: 'down' });
      await say('無聲者 歐勒斯', '歡迎，迴響之子們。', or.def.look);
      await say('無聲者 歐勒斯', '一千年前，我和艾薇娜、露米婭他們一起守護了這個世界。\n可是，歷史只記住了他們的名字。', or.def.look);
      await say('無聲者 歐勒斯', '我的水晶沒有人祈禱，漸漸沒了聲音。\n被遺忘的英雄，就只能在黑暗裡，聽著別人的迴響。', or.def.look);
      await say('米菈', '所以……你才想讓所有的迴響都消失？', 'mira');
      await say('無聲者 歐勒斯', '若是所有人都被遺忘，就沒有人會寂寞了。\n「緘默」會帶來真正的平等。', or.def.look);
      await say('艾倫', '才不是那樣！被忘記很難過，我懂。\n但是把大家的回憶都抹掉，只會讓更多人跟你一樣寂寞！');
      await say('艾倫', '我們會記得你。歐勒斯——你的名字，我們記住了！');
      await say('無聲者 歐勒斯', '……那就用你們的劍，證明給我看吧！', or.def.look);
      let r = await battle(['silent'], { bg: 'void', noFlee: true, music: 'boss' });
      if (r !== 'win') return;
      await say('無聲者 歐勒斯', '……好溫暖的光。\n原來，被人記住，是這種感覺……', or.def.look);
      await say('無聲者 歐勒斯', '可是，太遲了。我放出的「緘默」，已經不聽我的話了——快逃！', or.def.look);
      G.field.removeNpc('ores');
      G.audio.sfx('summon');
      await narr('黑色的水晶裂開，一個巨大的影子浮了出來。\n那是吞噬一切聲音與回憶的存在——「緘默」。');
      await say('艾倫', '大家，這是最後一戰了！');
      await say('希爾薇', '我會守住大家的背後。');
      await say('塔洛', '……我還要去魔法學院呢！才不會在這裡輸！');
      await say('米菈', '所有的迴響……請借給我們力量！');
      r = await battle(['silence'], { bg: 'void', noFlee: true, music: 'last' });
      if (r !== 'win') return;
      flag('finale_done'); flag('cleared');
      await G.ending();
      G.field.locked = false;
    },
    async sanctum(o) { await sanctum(o.echo); },
    async bigfang() {
      if (await ui.yesno('前方有一頭巨大的狼王在徘徊。要挑戰嗎？')) {
        const r = await battle(['bigfang', 'wolf', 'wolf'], { bg: 'field' });
        if (r === 'win') { setQ('q_bigfang', 'ready'); ui.toast('回到白帆港的委託板回報吧！'); }
      } else { G.field.player.x -= 0.8; G.field.syncWalker(G.field.player); }
    },
    async golem_boss() {
      if (await ui.yesno('礦脈前站著一隻巨大的鐵甲魔像。要挑戰嗎？')) {
        const r = await battle(['irongolem'], { bg: 'cave' });
        if (r === 'win') { setQ('q_golem', 'ready'); ui.toast('回到鐵砧城的委託板回報吧！'); }
      } else { G.field.player.z += 0.8; G.field.syncWalker(G.field.player); }
    },
  };

  // ---------------------------------------------------------------- sanctum trial
  async function sanctum(eid) {
    const E = ECHOES[eid];
    if (S().echoes[eid]) { await narr(`大水晶靜靜地發著光。\n${E.name}的迴響，已經與你們同在。`); return; }
    G.field.locked = true;
    await narr('祠堂的牆上刻著古老的壁畫……');
    for (const l of E.lore) await narr(l);
    await say(E.name, `……旅人啊。想要我的力量，就先成為我吧。\n如果你是我，會怎麼做？`, E.look);
    for (const [q, opts, ans] of E.quiz) {
      await ui.sayKeep(E.name, q, E.look);
      const i = await ui.choose(opts, { cancel: false, cls: 'small' });
      ui.closeKeep();
      if (i !== ans) { G.audio.sfx('error'); await say(E.name, '……不對。那不是我。\n再看看壁畫上的故事，想好了再來吧。', E.look); G.field.locked = false; return; }
      G.audio.sfx('ok');
    }
    await say(E.name, '沒錯。你真的懂我。\n我的迴響，就交給你們了。', E.look);
    await echo(eid);
    G.field.locked = false;
  }

  // ---------------------------------------------------------------- talking to people
  const TALK = {
    async port_fisher() {
      if (F().cleared) return say('老漁夫 哈克', '燈塔又亮起來了。晚上出海，看著那道光，就覺得安心啊。', 'fisher');
      if (!quest('q_letter') && F().saren_met) {
        await say('老漁夫 哈克', '你們要去東邊的鐵砧城嗎？那可以幫我送一封信嗎？\n給那邊的鍛冶師傅，我年輕時的朋友。', 'fisher');
        if (await ui.yesno('要接下送信的委託嗎？')) { setQ('q_letter', 'taken'); give('k_letter'); }
        return;
      }
      if (quest('q_letter') === 'taken') return say('老漁夫 哈克', '信就拜託你們了。鐵砧城的鍛冶屋在城裡的右邊。', 'fisher');
      return say('老漁夫 哈克', F().saren_met ? '昨晚燈塔那邊好亮……是你們在保護水晶吧？謝啦。' : '燈塔的水晶這陣子一閃一閃的，漁船晚上都不敢出海。', 'fisher');
    },
    async port_girl() {
      const q = quest('q_necklace');
      if (q === 'taken' && S().items.k_necklace) { await say('莉莉', '啊！是我的貝殼項鍊！謝謝大哥哥大姊姊！', 'girl'); addItem(S(), 'k_necklace', -1); delete S().items.k_necklace; await rewardQuest('q_necklace'); return; }
      if (q === 'done') return say('莉莉', '我每天都戴著項鍊喔！媽媽說我很適合～', 'girl');
      if (q === 'taken') return say('莉莉', '項鍊……應該在低語森林的深處，西邊的小空地附近……', 'girl');
      return say('莉莉', '嗚嗚……媽媽送我的項鍊不見了……\n（委託板上好像貼著她的委託）', 'girl');
    },
    async port_guard() { return say('港口衛兵', F().saren_met ? '辛苦了，騎士大人！港口的大家都很感謝你們。' : '這裡是白帆港。旅店在右邊，道具店在左邊的小屋。武器店在廣場右下。', 'guard'); },
    async port_oldwoman() { return say('老奶奶', '神殿供奉著守護這片海的騎士……叫做艾薇娜大人。\n小時候，奶奶的奶奶常常講她的故事給我聽。', 'oldwoman'); },
    async port_sailor() { return say('水手', F().ch2 ? '聽說東邊的鐵砧城在造會飛的船！真想坐坐看。' : '從港口出去往東走，可以到大陸各地。路上會有魔物，小心點！\n右上角的燈號變紅色，就表示快要遇到敵人了。', 'sailor'); },
    async port_boy() { return say('男孩', '我長大以後要當騎士！像艾倫哥哥一樣！\n……雖然我還不知道艾倫哥哥厲不厲害。', 'boy'); },
    async port_jumprope() {
      const q = quest('q_jump');
      if (!q) return say('小葵', '我在練跳繩！委託板上有貼我的挑戰書喔～', 'child2');
      if (q === 'done') { await say('小葵', '再跳一次嗎？', 'child2'); if (await ui.yesno()) await jumpRope(); return; }
      await say('小葵', '來跳繩吧！繩子轉到腳下的時候按確定跳起來！\n連續跳 20 下以上就算你贏！', 'child2');
      if (await ui.yesno('要挑戰跳繩嗎？')) { const n = await jumpRope(); if (n >= 20) { await say('小葵', `${n} 下！好厲害！這個給你！`, 'child2'); await rewardQuest('q_jump'); } else await say('小葵', `${n} 下……再加油喔！`, 'child2'); }
    },
    async port_collector() {
      const n = S().tablets.length; const got = F().tablet_reward || 0;
      const tiers = [[3, 'hipotion', 3], [6, 'shard', 2], [9, 'x_earring', 1], [12, 'x_crystal', 1]];
      await say('收藏家', `我在收集古代的「石板碎片」。地上閃閃發光的地方，有時候會找到喔。\n你現在有 ${n} 片。`, 'scholar');
      let k = got; while (k < tiers.length && n >= tiers[k][0]) { const [, id, c] = tiers[k]; await say('收藏家', `${tiers[k][0]} 片！太棒了，這個送你。`, 'scholar'); give(id, c); k++; }
      F().tablet_reward = k;
      if (k < tiers.length) await say('收藏家', `收集到 ${tiers[k][0]} 片的話，我會再送你好東西。全部一共有 12 片。`, 'scholar');
    },
    async talo_stall() {
      if (!F().priest_talked) return say('算命的男孩', '算命一次 10 G……\n什麼？沒錢？那就別擋著我做生意。', 'talo');
      G.field.locked = true;
      await say('塔洛', '……你們就是神官說的騎士？我叫塔洛。\n先說好，我不是在擺攤算命，是在「觀測星象」。', 'talo');
      await say('塔洛', '昨晚的星象很糟。「灰燼之影」會在今晚來到燈塔。\n大人都說我在亂講，可是星星不會騙人。', 'talo');
      await say('艾倫', '我相信你。你願意一起去燈塔嗎？');
      await say('塔洛', '……哼，我只是要確認我的預言對不對而已。\n順便讓你們看看真正的黑魔法。', 'talo');
      G.field.removeNpc('talo_stall');
      await join('talo', 2);
      flag('talo_joined'); flag('lighthouse_open'); flag('port_night');
      await say('希爾薇', '天色暗了。我們去南邊碼頭的燈塔吧。');
      G.updateObjective();
      await ui.fade(1, 600);
      await G.warp('port', Math.floor(player().x), Math.floor(player().z), player().dir, { quiet: true });
      await ui.fade(0, 600);
      G.field.locked = false;
    },
    async temple_priest() {
      if (!F().priest_talked) {
        await say('神官', '歡迎，海潮神殿的米菈。還有騎士團的各位。', 'priest');
        await say('神官', '燈塔的潮聲水晶，光芒越來越弱了。\n今晚就請你們去調律吧。', 'priest');
        await say('神官', '對了，廣場上有個叫塔洛的孩子，一直說「今晚燈塔會有災難」。\n大家都不信他……不過，他的眼神很認真。去和他談談吧。', 'priest');
        flag('priest_talked'); G.updateObjective(); give('potion', 3); give('tent', 1);
        return;
      }
      if (F().saren_met && !F().priest_gift) { flag('priest_gift'); await say('神官', '你們守住了水晶的迴響。這是神殿的一點心意。', 'priest'); give('feather', 2); give('ether', 2); return; }
      return say('神官', '願水晶的迴響守護你們。\n累了的話，到旅店好好休息吧。', 'priest');
    },
    async temple_nun() {
      const q = quest('q_mogu');
      if (q === 'taken' && S().mogu.length >= 5) { await say('修女', '五隻咪咕都回來了！謝謝你們！', 'lady'); await rewardQuest('q_mogu'); return; }
      if (q === 'taken') return say('修女', `已經找到 ${S().mogu.length} 隻了。剩下的還躲在港口的某個角落……`, 'lady');
      return say('修女', '神殿的咪咕們最喜歡躲在角落、花叢和碼頭邊了。', 'lady');
    },
    async port_itemshop() { await say('道具店老闆', '歡迎光臨！我也會教一點簡單的魔法喔。', 'merchant'); await shopOrMagic(SHOPS.port_items, '道具店', 1); },
    async port_weapon() { await say('武器店老闆', '好的武器能保命。十六種武器、七個部位的防具，慢慢挑！', 'smith'); await gearOrSmith(SHOPS.port_gear, '武器・防具店', 2); },
    async guild_master() { return say('公會長', '冒險者公會歡迎你！\n委託板上的工作完成後，回到委託板就能領報酬。', 'merchant'); },
    async guild_adv1() { return say('冒險者', '敵人頭上的數字是「破防值」，打中弱點就會減少。\n減到零，敵人就會暈倒一陣子，受到的傷害也會變大！', 'guard'); },
    async guild_adv2() { return say('冒險者', '聽說大陸各地有「光之祠堂」，裡面住著傳說英雄的迴響。\n要回答英雄的問題才能得到力量喔。答案就藏在壁畫裡。', 'lady'); },
    async forest_hunter() { return say('獵人', '這片森林深處有東西在作怪……樹木都在哭。\n往北走，就是森林的深處。路上有存檔水晶，記得先存檔。', 'guard'); },
    // anvil
    async rena_npc() {
      G.field.locked = true;
      await say('蕾娜', '喂！你們就是那些騎士嗎？聽說你們在追「蝕夜六使」？', 'rena');
      await say('蕾娜', '我叫蕾娜，是飛空艇技師！這是我的搭檔，機械鳥「啾比」。\n北邊的礦坑被一陣怪風封住了，礦工們都沒辦法工作！', 'rena');
      await say('艾倫', '那陣風，一定是六使做的。我們正要去礦坑。');
      await say('蕾娜', '那我也去！礦坑的路我最熟了。\n而且……我爺爺說過，風之大水晶是飛空艇的夢想之源。', 'rena');
      G.field.removeNpc('rena_npc');
      await join('rena', Math.max(8, S().heroes.aren.lv - 1));
      await say('蕾娜', '等一下，先去我家工房一趟！爺爺說有東西要給我。', 'rena');
      flag('rena_joined'); flag('mine_open'); G.updateObjective();
      G.field.locked = false;
    },
    async workshop_gramps() {
      if (F().rena_joined && !F().bolt_given) {
        flag('bolt_given');
        await say('老技師 古德', '蕾娜要和騎士們去礦坑？……好，那這個交給你。', 'engineer');
        await say('老技師 古德', '這是我們家代代相傳的迴響水晶，\n第一位「天匠」波爾特的迴響。他會保護你的。', 'engineer');
        await echo('bolt', 'rena');
        await say('蕾娜', '爺爺……！我一定會成為天匠的！', 'rena');
        return;
      }
      if (F().serene_done && !F().airship_built) {
        if (!S().items.k_lens) return say('老技師 古德', '飛空艇「晨星號」只差最後一個零件「水晶透鏡」……', 'engineer');
        G.field.locked = true;
        await say('老技師 古德', '水晶透鏡！有了這個，晨星號就能飛了！\n蕾娜，最後的組裝，你來做吧。', 'engineer');
        delete S().items.k_lens;
        await ui.fade(1, 600); G.audio.sfx('door'); await wait(400); G.audio.sfx('item'); await wait(400); G.audio.sfx('levelup'); await wait(600);
        flag('airship_built'); S().chapter = 4;
        await ui.fade(0, 600);
        await say('蕾娜', '完成了！飛空艇「晨星號」！\n停在工房前面的廣場，隨時可以出發！', 'rena');
        await say('老技師 古德', '在大地圖上可以搭乘它，按 R 起飛，在空地上按確定降落。\n東北高原上空的浮空遺跡，現在也到得了了。', 'engineer');
        G.updateObjective();
        await ui.chapter(4, '天空的迴響', '浮空遺跡與緘默');
        G.field.locked = false;
        return;
      }
      return say('老技師 古德', '飛空艇是我們家三代人的夢想。\n我年輕時摔了三次，蕾娜的爸爸摔了五次……哈哈哈！', 'engineer');
    },
    async anvil_item() { await say('道具店', '礦坑裡很危險，多帶點藥吧。魔法也可以在這裡學。', 'merchant'); await shopOrMagic(SHOPS.anvil_items, '道具店', 2); },
    async anvil_gear() { await say('武器店', '鐵砧城的武器，大陸第一！強化和鑲嵌也交給我。', 'smith'); await gearOrSmith(SHOPS.anvil_gear, '武器・防具店', 5); },
    async anvil_stall() { await say('攤販', '投擲道具打在弱點上效果超好！還有礦坑裡挖到的稀有裝備喔。', 'engineer'); await ui.shop(SHOPS.anvil_mats, '攤販'); },
    async anvil_forge() {
      if (quest('q_letter') === 'taken') { await say('鍛冶師傅 鋼爾', '哈克那傢伙寫信給我？……哈哈，他還是一樣愛操心。謝啦！', 'smith'); delete S().items.k_letter; await rewardQuest('q_letter'); }
      if (quest('q_leo') === 'taken') {
        await say('鍛冶師傅 鋼爾', '你們要挑戰熔爐之心？炎獅烈牙可是很兇的。\n準備好了嗎？', 'smith');
        if (await ui.yesno()) await trial('leo', 'leo_trial', 'cave');
        return;
      }
      await say('鍛冶師傅 鋼爾', '我是鍛冶師傅鋼爾。拿「星鐵」來，我就能打造傳說中的星鐵武器！\n一件需要 3 個星鐵（防具 2 個），外加 5000 G 工錢。', 'smith');
      const list = Object.keys(GEAR).filter(g => GEAR[g].forge);
      for (;;) {
        const i = await ui.choose(list.map(g => ({ label: GEAR[g].name, sub: `星鐵 ${GEAR[g].forge}`, disabled: (S().items.stariron || 0) < GEAR[g].forge || S().gil < 5000, desc: ui.gearLine(g) })), { title: `鍛造　星鐵 ×${S().items.stariron || 0}　${S().gil} G`, info: (i) => ui.whoCan(list[i]) });
        if (i < 0) return;
        const g = list[i]; S().items.stariron -= GEAR[g].forge; if (!S().items.stariron) delete S().items.stariron; S().gil -= 5000;
        G.audio.sfx('door'); await wait(300); G.audio.sfx('door'); give(g);
      }
    },
    async anvil_guard() { return say('衛兵', F().tia_done ? '礦坑的風停了！礦工們都回去工作了。' : '北邊的礦坑被怪風封住了……出城往北，山路盡頭就是礦坑入口。', 'guard'); },
    async anvil_kid() { return say('小孩', '蕾娜姊姊的啾比會說話喔！……騙你的，只會「啾」。', 'boy'); },
    async anvil_elder() { return say('鎮長', F().tia_done ? '多虧了你們，鐵砧城的爐火又旺起來了！' : '礦坑是鐵砧城的命脈。拜託你們了。', 'oldman'); },
    async anvil_engineer() { const q = quest('q_windgem'); if (q === 'taken' && (S().items.windgem || 0) >= 3) { S().items.windgem -= 3; if (!S().items.windgem) delete S().items.windgem; await say('技師 波可', '三顆風晶石！太好了，新的引擎可以轉了！', 'engineer'); await rewardQuest('q_windgem'); return; } return say('技師 波可', q === 'taken' ? `風晶石帶來了嗎？（持有 ${S().items.windgem || 0}/3）` : '我在研究會轉的風力引擎。', 'engineer'); },
    async anvil_hall() { return say('學者', '傳說第一位天匠波爾特，造出了第一艘會飛的船。\n後來最優秀的工匠，都會被稱為「天匠」。', 'scholar'); },
    // azurelle
    async neo_npc() {
      G.field.locked = true;
      await say('尼歐', '你們就是在鐵砧城擊退六使的騎士？我是尼歐，水守一族的軍師。', 'neo');
      await say('尼歐', '沉沒神殿的水門被人從裡面打開了。\n有人想奪走水之大水晶——而我知道那個人是誰。', 'neo');
      await say('尼歐', '我需要你們的力量。作為交換，我的弓也借給你們。', 'neo');
      G.field.removeNpc('neo_npc');
      await join('neo', Math.max(14, S().heroes.aren.lv - 1));
      flag('neo_joined'); flag('temple_open'); G.updateObjective();
      await say('尼歐', '沉沒神殿在城南湖中的小島上，從堤道走過去。\n出發前，可以到城裡的競技場試試身手。', 'neo');
      G.field.locked = false;
    },
    async azur_item() { await say('道具店', '水都的藥品，品質保證！魔法學院的老師也在這裡教課。', 'merchant'); await shopOrMagic(F().airship_built ? [...SHOPS.azur_items, ...SHOPS.late_items] : SHOPS.azur_items, '道具店', F().cleared ? 5 : F().airship_built ? 4 : 3); },
    async azur_weapon() { await say('武器店', '秘銀打造的武器，又輕又利。', 'smith'); await gearOrSmith(F().airship_built ? [...SHOPS.azur_gear, ...SHOPS.late_gear] : SHOPS.azur_gear, '武器店', 7); },
    async azur_armor() { await say('防具店', '水都的絲綢法衣，可是有名的喔。', 'lady'); await ui.shop(SHOPS.azur_armor, '防具・飾品店'); },
    async azur_arena() { await arena(); },
    async azur_watch() { return say('衛兵', '上面是「水守之殿」，水守的長老住在那裡。', 'watchman'); },
    async azur_noble() { return say('貴婦人', '蒼瀾的運河像蜘蛛網一樣。坐小船遊城是最棒的享受。', 'noble'); },
    async azur_girl() { return say('女孩', '聽說湖的東南邊有一片淺灘，晚上會聽見鯨魚唱歌喔。', 'girl'); },
    async azur_fisher() { return say('漁夫', F().cleared ? '天空的遺跡不見了，湖面又變得好安靜。' : '湖上的堤道通往沉沒神殿。以前只有水守才能進去。', 'fisher'); },
    async azur_garden() { return say('老園丁', '這座庭園的花，是水守一族一代一代種下的。\n種花的人會老去，但花會一直開下去。', 'oldwoman'); },
    async palace_elder() { return say('水守長老', F().serene_done ? '瑟琳那孩子……其實一直很努力。是我們沒有好好看著她。' : '沉沒神殿裡供奉著水神的迴響。拜託你們，守住它。', 'noble'); },
    async palace_guard() { return say('水守衛兵', '尼歐大人小時候是個愛哭鬼喔。……這是秘密。', 'watchman'); },
    async inn_port_keeper() { if (await ui.inn(INN_PRICE.port)) await side.night(); },
    async inn_anvil_keeper() { if (await ui.inn(INN_PRICE.anvil)) await side.night(); },
    async inn_azur_keeper() { if (await ui.inn(INN_PRICE.azurelle)) await side.night(); },
  };

  // ---------------------------------------------------------------- quest boards
  async function board(id) {
    const list = Object.keys(QUESTS).filter(q => QUESTS[q].board === id && (!QUESTS[q].after || G.cond(QUESTS[q].after)));
    for (;;) {
      const i = await ui.choose(list.map(q => ({ label: QUESTS[q].name, sub: { taken: '進行中', ready: '★可回報', done: '完成' }[quest(q)] || '新委託' })), { title: '委託板', info: (i) => { const Q = QUESTS[list[i]]; return `<div class="st"><div><h3>${Q.name}</h3><p>${Q.desc}</p><p>委託人：${Q.from}</p><p>報酬：${Q.rewardText}</p></div></div>`; } });
      if (i < 0) return;
      const q = list[i], st = quest(q);
      if (!st) {
        if (await ui.yesno(`接下「${QUESTS[q].name}」嗎？`)) {
          setQ(q, 'taken'); G.audio.sfx('ok'); ui.toast(`接受委託：${QUESTS[q].name}`);
          if (q === 'q_mogu') G.field.load(G.field.mapId, Math.floor(player().x), Math.floor(player().z), player().dir);
          if (q === 'q_letter') give('k_letter');
        }
      } else if (st === 'ready') await rewardQuest(q);
      else if (st === 'taken') ui.toast('委託還沒完成');
    }
  }

  // ---------------------------------------------------------------- trials, seals, arena
  async function trial(sid, enemy, bg) {
    const r = await battle([enemy], { bg, noFlee: true });
    if (r !== 'win') return false;
    if (!S().summons.includes(sid)) S().summons.push(sid);
    G.audio.sfx('summon');
    await narr(`${SUMMONS[sid].name}認可了你們的力量。\n現在可以在戰鬥中「召喚」牠了！`);
    const q = { leo: 'q_leo', fox: 'q_fox', whale: 'q_whale', hawk: 'q_hawk' }[sid];
    if (q && quest(q) && quest(q) !== 'done') setQ(q, 'done');
    return true;
  }
  const SPOT_EVENTS = {
    async trial_fox() { if (S().summons.includes('fox')) return narr('雪原上，霜狐留下的足跡閃閃發光。'); await narr('白茫茫的雪原中央，一隻銀白色的狐狸靜靜地看著你們。'); if (await ui.yesno('要接受霜狐的試煉嗎？')) await trial('fox', 'fox_trial', 'snow'); },
    async trial_hawk() { if (S().summons.includes('hawk')) return narr('雷鳴峰的頂端，雷光偶爾閃過。'); await narr('雷雲在峰頂盤旋，一隻金色的巨鷹張開了翅膀。'); if (await ui.yesno('要接受雷鷹的試煉嗎？')) await trial('hawk', 'hawk_trial', 'mountain'); },
    async trial_whale() { if (S().summons.includes('whale')) return narr('淺灘上，遠方傳來溫柔的鯨歌。'); await narr('湖面忽然隆起，一頭巨大的鯨浮上了水面。'); if (await ui.yesno('要接受潮鯨的試煉嗎？')) await trial('whale', 'whale_trial', 'coast'); },
    async seal_dragon() { await seal('elderdragon', 'mountain', 'seal_dragon'); },
    async seal_machina() { await seal('machina', 'cave', 'seal_machina'); },
    async seal_abyss() { await seal('abyss', 'temple', 'seal_abyss'); },
    async seal_gold() { await seal('goldslime', 'field', 'seal_gold'); },
  };
  async function seal(enemy, bg, key) {
    if (F()[key]) return narr('封印已經解開了。這裡只剩下安靜的風。');
    if (!F().cleared) return narr('古老的封印散發著強大的力量……\n現在的你們還碰不得。（通關後才能挑戰）');
    await narr(`封印的石碑上寫著：「沉睡於此的，是${ENEMIES[enemy].name}。」`);
    if (!await ui.yesno('要解開封印挑戰嗎？（非常強大）')) return;
    const r = await battle([enemy], { bg, noFlee: true, music: 'boss' });
    if (r === 'win') { flag(key); await narr('封印解開了！傳說中的武具到手了。'); const all = ['seal_dragon', 'seal_machina', 'seal_abyss', 'seal_gold'].every(k => F()[k]); if (all) await narr('四處封印全部解開了！你們是真正的傳說！'); }
  }
  async function arena() {
    await say('競技場管理員', `歡迎來到蒼瀾競技場！\n目前的階級：${S().arena ? ARENA[S().arena - 1].name + ' 通過' : '尚未挑戰'}`, 'watchman');
    const i = await ui.choose(ARENA.map((a, k) => ({ label: a.name + '挑戰', sub: k < S().arena ? '已通過' : '', disabled: k > S().arena || (k === 4 && !F().cleared), desc: `建議等級 ${a.lv}　獎品：${a.prize.map(([id, n]) => itemName(id) + '×' + n).join('、')}` })), { title: '競技場' });
    if (i < 0) return;
    const A = ARENA[i];
    const r = await battle(A.troop, { bg: 'arena', noFlee: true, arena: true });
    if (r === 'win') { await say('競技場管理員', `精彩！${A.name}挑戰成功！`, 'watchman'); if (i >= S().arena) { S().arena = i + 1; for (const [id, n] of A.prize) give(id, n); } }
  }

  // ---------------------------------------------------------------- jump rope minigame
  function jumpRope() {
    return new Promise((res) => {
      const box = document.createElement('div'); box.className = 'minigame';
      box.innerHTML = `<canvas width="320" height="200"></canvas><div class="mg-info">繩子轉到下面時按 <b>確定</b>（或點畫面）跳！<br><span id="mgc">0</span> 下</div>`;
      document.getElementById('ui').appendChild(box);
      const c = box.querySelector('canvas'), g = c.getContext('2d');
      let ang = Math.PI, speed = 2.2, count = 0, jumpT = 0, over = false, prevDown = false, cleared = false;
      const kidL = G.ui && null;
      const jump = () => { if (jumpT <= 0 && !over) { jumpT = 0.42; G.audio.sfx('jump2'); } };
      const off = G.input.on((k) => { if (k === 'ok') jump(); if (k === 'cancel' && over) finish(); });
      box.onclick = () => over ? finish() : jump();
      const finish = () => { off(); box.remove(); res(count); };
      let last = performance.now();
      const loop = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        if (!over) { ang += dt * speed; jumpT -= dt; }
        const a = ang % (Math.PI * 2);
        const ry = 100 + Math.cos(a) * 80; // rope height: bottom when cos = 1
        const down = Math.cos(a) > 0.9;
        if (down && !prevDown && !over) {
          if (jumpT > 0) { count++; speed = Math.min(7, speed + 0.12); box.querySelector('#mgc').textContent = count; G.audio.sfx('ok'); }
          else { over = true; G.audio.sfx('error'); box.querySelector('.mg-info').innerHTML = `跳了 <b>${count}</b> 下！<br>按確定結束`; }
        }
        prevDown = down;
        g.fillStyle = '#f4e8c8'; g.fillRect(0, 0, 320, 200); g.fillStyle = '#c8a878'; g.fillRect(0, 170, 320, 30);
        const jy = jumpT > 0 ? Math.sin(Math.PI * (1 - jumpT / 0.42)) * 34 : 0;
        // the jumper
        g.fillStyle = '#a8303a'; g.fillRect(150, 130 - jy, 20, 26); g.fillStyle = '#f3c9a4'; g.fillRect(152, 112 - jy, 16, 16); g.fillStyle = '#e8c45a'; g.fillRect(150, 108 - jy, 20, 7); g.fillStyle = '#2a2838'; g.fillRect(152, 156 - jy, 6, 14); g.fillRect(162, 156 - jy, 6, 14);
        // rope holders
        g.fillStyle = '#4a8ac8'; g.fillRect(30, 120, 16, 40); g.fillRect(274, 120, 16, 40); g.fillStyle = '#f3c9a4'; g.fillRect(31, 104, 14, 14); g.fillRect(275, 104, 14, 14);
        g.strokeStyle = '#3a2a2a'; g.lineWidth = 3; g.beginPath(); g.moveTo(46, 130); g.quadraticCurveTo(160, ry * 2 - 130, 274, 130); g.stroke();
        if (Math.sin(a) < 0) { /* rope behind: draw again lighter so it reads */ }
        if (!cleared && count >= 20) { cleared = true; G.audio.sfx('levelup'); }
        if (box.isConnected) requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    });
  }

  // ---------------------------------------------------------------- bubbles over heads
  function bubble(def) {
    const id = def.id;
    if (['talo_stall', 'rena_npc', 'neo_npc'].includes(id)) return '!';
    if (id === 'temple_priest' && !F().priest_talked) return '!';
    if (id === 'port_girl' && quest('q_necklace') === 'taken' && S().items.k_necklace) return '!';
    if (id === 'temple_nun' && quest('q_mogu') === 'taken' && S().mogu.length >= 5) return '!';
    if (id === 'anvil_forge' && (quest('q_letter') === 'taken' || quest('q_leo') === 'taken')) return '!';
    if (id === 'anvil_engineer' && quest('q_windgem') === 'taken' && (S().items.windgem || 0) >= 3) return '!';
    if (id === 'workshop_gramps' && ((F().rena_joined && !F().bolt_given) || (F().serene_done && !F().airship_built))) return '!';
    if (id === 'port_fisher' && F().saren_met && !quest('q_letter')) return '!';
    if (id === 'port_jumprope' && quest('q_jump') === 'taken') return '?';
    if (id === 'port_collector') { const tiers = [3, 6, 9, 12]; if ((F().tablet_reward || 0) < 4 && S().tablets.length >= tiers[F().tablet_reward || 0]) return '!'; }
    if (def.bubble) return '...';
    return null;
  }

  Object.assign(TALK, side.wrap({ ...TALK }), side.TALK);
  Object.assign(SPOT_EVENTS, side.spotWrap({ ...SPOT_EVENTS }));
  Object.assign(EV, side.EV);
  const bubbleAll = (def) => side.bubble(def) || bubble(def);
  const objective = () => { const o = objectiveText(G), h = side.sideHint(); return h && F().cleared ? o + '　／　' + h : o || h; };
  return { EV, TALK, SPOT_EVENTS, SIGNS: side.SIGNS, board, bubble: bubbleAll, sanctum, objectiveText: objective, QUESTS };
}
