// The deeper half of the story: nights at the inn where the party talks about who they are, the side stories that grow
// out of those talks (each one a few steps across the map), the last two of the six apostles, and fishing.
import { ITEMS, GEAR, ENEMIES } from './data.js?v=16';
import { addItem, itemName } from './party.js?v=16';

// ---------------------------------------------------------------- new things to own
Object.assign(ITEMS, {
  k_goggles: { name: '舊護目鏡', key: true, desc: '蕾娜的父親卡爾戴過的飛行護目鏡。鏡片裂了一道。' },
  k_flightlog: { name: '燕號的航行日誌', key: true, desc: '卡爾留下的最後一本日誌。最後一頁寫著給蕾娜的話。' },
  k_keeperlog: { name: '燈塔守的日誌', key: true, desc: '三十年前白帆港燈塔守「薩爾」的日誌，字跡被海水暈開了。' },
  k_names: { name: '希爾薇的名冊', key: true, desc: '希爾薇記下的三個名字。騎士團的紀錄上只寫著「小隊殉職」。' },
  k_letter_s: { name: '瑟琳的信', key: true, desc: '寫給水守長老的信。信封上的字很工整。' },
  k_memory: { name: '無聲者的記憶', key: true, desc: '十二片石板拼成的記憶。摸起來是溫的。' },
  i_fishbait: { name: '釣餌', price: 20, sell: 5, mat: true, cat: 'tool', desc: '釣魚用的餌。每次釣魚用掉一個' },
});
Object.assign(GEAR, {
  w_swallow_wrench: { name: '燕之扳手', slot: 'w', type: 'axe', price: 0, atk: 52, mag: 22, spd: 4, desc: '卡爾設計圖上的扳手。蕾娜照著打出來了' },
  w_tide_bow: { name: '潮華之弓', slot: 'w', type: 'bow', price: 0, atk: 54, mag: 14, spd: 5, desc: '瑟琳年輕時用的弓。教尼歐射箭的就是這把' },
  w_scholar_rod: { name: '學院的星杖', slot: 'w', type: 'staff', price: 0, atk: 12, mag: 48, spr: 8, desc: '魔法學院給塔洛的入學禮物' },
  w_oath_spear: { name: '誓約之槍', slot: 'w', type: 'spear', price: 0, atk: 56, def: 10, spr: 6, desc: '刻著三個名字的槍' },
  x_ashlamp: { name: '灰燼的燈', slot: 'x', price: 0, atk: 8, mag: 8, hp: 120, desc: '燈塔守父子傳下來的小提燈' },
  x_silent: { name: '無聲者的徽章', slot: 'x', price: 0, hp: 200, mp: 40, atk: 10, mag: 10, def: 6, spr: 6, desc: '歐勒斯的騎士徽章。被記住的英雄的證明' },
  x_angler: { name: '釣魚名人徽章', slot: 'x', price: 0, spd: 4, hp: 80, desc: '把十二種魚都釣過一遍的證明' },
});
// the fifth apostle, who attacks the workshop
ENEMIES.vahl = { name: '鐵面的瓦爾', kind: 'knight', colors: { body: '#5a5a62', trim: '#c8a040', cape: '#2a2a30', plume: '#c8a040', weapon: 'sword', shield: true }, lv: 23, hp: 5200, atk: 62, def: 36, mag: 30, spr: 24, spd: 16, shield: 9, weak: ['thunder', 'water', 'axe'], resist: ['fire', 'sword'], exp: 1500, gil: 1800, drops: [['stariron', 1], ['shard', 1]], acts: [['e_smash', 2], ['e_laser', 2], ['e_guard', 1], ['e_charge', 1]], boss: true, scale: 1.45, twice: 0.45 };

// ---------------------------------------------------------------- side quests (in the quest log once they start)
export const SIDE_QUESTS = {
  q_names: { name: '希爾薇的名冊', from: '希爾薇', desc: '希爾薇第一支小隊的三個人，在騎士團的紀錄上只剩下「小隊殉職」四個字。她記得他們倒下的地方：低語森林、風鳴礦坑、沉沒神殿。去那裡找到他們的紀念石。', rewardText: '誓約之槍', reward: {} },
  q_exam: { name: '塔洛的入學考', from: '蒼瀾魔法學院', desc: '蒼瀾的魔法學院願意讓塔洛參加獎學金考試。考場在水守之殿旁的學院分館——找院長談。', rewardText: '學院的星杖、塔洛的學費', reward: {} },
  q_wings: { name: '天匠的翅膀', from: '蕾娜', desc: '七年前，蕾娜的父親卡爾駕著滑翔機「燕號」飛向雷鳴峰，再也沒有回來。有了飛空艇，終於可以去峰頂看看了。', rewardText: '燕之扳手', reward: {} },
  q_keeper: { name: '燈塔守的名字', from: '白帆港的老奶奶', desc: '三十年前，白帆港的燈塔守在暴風雨夜為了點燈而死。重建的燈塔上，沒有刻他的名字。燈塔頂上應該還留著他的日誌。', rewardText: '灰燼的燈', reward: {} },
  q_serene: { name: '潮華的歸來', from: '水守長老', desc: '有人在鯨之淺灘看見了一個穿藍色法衣的女人。長老想見瑟琳一面，可是不敢自己去。', rewardText: '潮華之弓', reward: {} },
  q_ig: { name: '拾憶者', from: '白帆港的收藏家', desc: '收藏家說，十二片石板是某個人的記憶。把它帶到浮空遺跡最上面的黑色水晶前。', rewardText: '無聲者的徽章', reward: {} },
  q_fish: { name: '港口釣魚名人', from: '釣魚老伯 阿吉', desc: '在港口碼頭和蒼瀾的運河邊都能釣魚。把十二種魚都釣上來看看！', rewardText: '釣魚名人徽章（全種類）', reward: {} },
};

// ---------------------------------------------------------------- fishing
// [id, name, where (port / azur / both), rarity weight, size cm, what you keep]
export const FISH = [
  ['sardine', '沙丁魚', 'port', 30, [12, 20], 'i_food1'],
  ['mackerel', '青花魚', 'port', 22, [25, 40], 'i_food2'],
  ['flounder', '比目魚', 'port', 14, [20, 45], 'i_food3'],
  ['octopus', '章魚', 'port', 9, [30, 80], 'i_food8'],
  ['tuna', '黑鮪魚', 'port', 3, [90, 220], 'i_food11'],
  ['lanternfish', '燈籠魚', 'port', 2, [8, 15], 'shard', 'night'],
  ['carp', '鯉魚', 'azur', 28, [25, 60], 'i_food4'],
  ['trout', '虹鱒', 'azur', 22, [20, 45], 'i_food5'],
  ['catfish', '鯰魚', 'azur', 12, [40, 100], 'i_food9'],
  ['eelfish', '鰻魚', 'azur', 8, [40, 90], 'i_food12'],
  ['crysfish', '水晶魚', 'azur', 2, [10, 18], 'i_gem_water2'],
  ['oldboot', '舊靴子', 'both', 6, [25, 30], null],
];

export function sideStory(G, h) {
  const { say, narr, flag, give, gil, battle, echo, quest, setQ, player, F, S, ui, wait } = h;
  const has = (id) => (S().items[id] || 0) > 0;
  const take = (id) => { delete S().items[id]; };
  const finish = async (q, gear) => { setQ(q, 'done'); G.audio.sfx('levelup'); ui.toast(`支線完成：<b>${SIDE_QUESTS[q].name}</b>`, 2800); if (gear) give(gear); };
  const start = (q) => { setQ(q, 'taken'); G.audio.sfx('ok'); ui.toast(`新的支線：<b>${SIDE_QUESTS[q].name}</b>（選單→委託任務）`, 3200); };
  const inParty = (id) => S().heroes[id];
  const SER = { skin: 'pale', hair: '#8ae0ff', hairStyle: 'long', top: '#3a5ab8', top2: '#f4e8ff', legs: '#3a5ab8', boots: '#2a2a4a', robe: true, hat: 'hood', hatColor: '#2a3a8a', weapon: 'rod' };
  const ORES = { skin: 'pale', hair: '#e8e8f0', hairStyle: 'long', top: '#d8d8e8', top2: '#8a8aa8', legs: '#4a4a6a', boots: '#2a2a3a', cape: '#4a4a6a', weapon: 'sword', shield: true, pauldron: '#8a8aa8' };
  const VAHL = { skin: 'tan', hair: '#3a3a3a', hairStyle: 'short', top: '#5a5a62', top2: '#c8a040', legs: '#3a3a42', boots: '#2a2a2a', cape: '#2a2a30', weapon: 'sword', shield: true, hat: 'helm', hatColor: '#6a6a72' };

  // ================================================================ nights at the inn
  // one talk per night, the first whose moment has come; each opens a door somewhere
  const NIGHTS = [
    ['n_aren', 'saren_met', async () => {
      await narr('夜深了。艾倫一個人站在旅店的陽台上，看著燈塔的光一圈一圈掃過海面。');
      await say('米菈', '睡不著嗎？');
      await say('艾倫', '……米菈，你記得你媽媽的臉嗎？');
      await say('米菈', '記得呀。她笑起來，左邊會有一個酒窩。');
      await say('艾倫', '我媽媽在我五歲的時候走了。我記得她的聲音、她煮的湯的味道……\n可是她的臉，我已經想不起來了。');
      await say('艾倫', '薩倫說要讓一切「回歸緘默」的時候，我突然好害怕。\n如果連聲音和湯的味道也忘了，她就真的不在了。');
      await say('米菈', '……調律師的老師說過，回憶不是被「記住」的，是被「傳下去」的。');
      await say('米菈', '你把她的湯的味道說給我聽。這樣，就有兩個人記得了。');
      await say('艾倫', '……是加了很多蔥的馬鈴薯湯。很鹹。');
      await say('米菈', '噗。好，我記住了。很鹹的馬鈴薯湯。');
    }],
    ['n_sylvie', 'rottree_done', async () => {
      await narr('桌上的燭火快燒完了。希爾薇還在一本小冊子上寫字。');
      await say('塔洛', '前輩，你在寫日記？');
      await say('希爾薇', '不是。是名字。');
      await say('希爾薇', '三年前「霧之戰」，我的第一支小隊只有我活下來。\n騎士團的紀錄上，他們的名字被寫成四個字——「小隊殉職」。');
      await say('希爾薇', '盧卡斯、貝絲、老葛。盧卡斯很會烤麵包，貝絲怕蟲，老葛每次都說「這是最後一次出任務」。');
      await say('希爾薇', '被寫成「小隊」的人，就沒有名字了。所以我自己記。');
      await say('艾倫', '前輩……他們倒下的地方，你知道在哪裡嗎？');
      await say('希爾薇', '低語森林的西邊、風鳴礦坑的深處、還有……沉沒神殿。\n那時候我們在追一個黑袍的人。現在想起來，也許就是六使。');
      await say('艾倫', '那我們順路去看看他們吧。一起。');
      await say('希爾薇', '…………嗯。謝謝你，菜鳥。');
      start('q_names'); give('k_names', 1, true);
    }],
    ['n_talo', 'rena_joined', async () => {
      await narr('塔洛坐在床上，一枚一枚地數著硬幣。');
      await say('蕾娜', '哇，存了不少嘛！要買什麼？', 'rena');
      await say('塔洛', '……魔法學院的學費。一萬 G。我現在有兩千三百。');
      await say('塔洛', '我媽在港口幫人縫漁網，一張網二十 G。\n我在廣場算命，是因為那是唯一能用魔法賺錢的方法。');
      await say('塔洛', '星星是真的會說話的。可是一個窮小孩說的話，沒有人要聽。\n……學院的徽章，大人就會聽了。');
      await say('蕾娜', '我覺得你現在說的話，我們都有在聽喔。', 'rena');
      await say('塔洛', '……哼。那是因為你們比較笨。');
      flag('talo_dream');
    }],
    ['n_rena', 'tia_done', async () => {
      await narr('蕾娜在窗邊擦著一副舊護目鏡的鏡帶。啾比在她腳邊打盹。');
      await say('蕾娜', '這是我爸的備用護目鏡。他叫卡爾，是鐵砧城最會飛的人。', 'rena');
      await say('蕾娜', '七年前，他開著自己做的滑翔機「燕號」，說要飛上雷鳴峰看雷鷹的巢。\n然後就再也沒有回來。', 'rena');
      await say('蕾娜', '爺爺說他一定是摔下來了。大家都這樣說。\n可是他們連峰頂都沒去過，憑什麼這樣說！', 'rena');
      await say('塔洛', '……雷鳴峰四面都是懸崖。星圖上說，只能從天上去。', 'talo');
      await say('蕾娜', '所以我才要造飛空艇。不只是為了爺爺的夢想。\n等晨星號飛起來，我第一個要去的地方，就是那座山頂。', 'rena');
      start('q_wings');
    }],
    ['n_neo', 'neo_joined', async () => {
      await narr('蒼瀾的夜晚，運河上漂著小小的燈。尼歐靠在窗邊，很久沒有說話。');
      await say('艾倫', '你說你知道打開水門的人是誰。');
      await say('尼歐', '……瑟琳。她教我射箭，教我怎麼在水裡憋氣，教我看星星判斷潮水。\n她是水守裡最優秀的人。');
      await say('尼歐', '三年前長老要選新的軍師。所有人都以為會是她。\n結果長老選了我——因為我是長老家的孩子。');
      await say('尼歐', '她的位置，是我拿走的。我什麼都沒做，就拿走了。');
      await say('艾倫', '那不是你的錯。');
      await say('尼歐', '我知道。可是「不是我的錯」，沒辦法讓她回來。');
    }],
    ['n_serene', 'serene_done', async () => {
      await narr('尼歐坐在旅店門口的台階上，手裡轉著一支舊箭。');
      await say('米菈', '還在想瑟琳的事嗎？');
      await say('尼歐', '她最後什麼都沒說。我說「我記得你」，她什麼都沒說。');
      await say('米菈', '可是她聽見了。被記住的人，第一次聽到的時候都說不出話的。\n……我在神殿看過好多次了。');
      await say('尼歐', '……如果她還活著，我想跟她說一聲對不起。不是以軍師的身份。');
    }],
    ['n_mira', 'airship_built', async () => {
      await narr('明天就要搭飛空艇了。米菈抱著膝蓋坐在床上，臉色很白。');
      await say('希爾薇', '還在怕高？');
      await say('米菈', '……我六歲的時候爬上神殿的鐘樓，卡在上面一整個晚上。\n從那之後，只要腳下是空的，我就沒辦法呼吸。');
      await say('希爾薇', '明天上船的時候，抓著我的手。我不會放開。');
      await say('米菈', '……前輩。我想了很久。比起高的地方，我更怕的是——\n在這裡停下來，然後忘記大家一起走過的路。');
      await say('米菈', '所以我會上船的。腿會抖，但是我會上去。');
    }],
    ['n_eve', 'airship_built&ch4&n_mira', async () => {
      await narr('決戰的前一晚。旅店的大桌子上擺滿了老闆娘多煮的菜。');
      await say('蕾娜', '等這一切結束，你們要做什麼？我要把晨星號改成三層的！', 'rena');
      await say('塔洛', '我要去魔法學院。用自己的錢。……大概。', 'talo');
      await say('尼歐', '我要回水守之殿，把軍師的位置讓出來。讓大家重新選一次。', 'neo');
      await say('希爾薇', '我要回騎士團，把那份紀錄改掉。');
      await say('米菈', '我要把每一顆水晶都調律好。一顆一顆，慢慢來。');
      await say('艾倫', '我……我想把這趟旅行，從頭到尾，好好說給一個人聽。');
      await say('塔洛', '給誰？');
      await say('艾倫', '還不知道。也許是很多很多年以後的某個人。');
    }],
    ['n_after', 'cleared', async () => {
      await narr('戰鬥結束後的第一個安靜的夜晚。');
      await say('艾倫', '歐勒斯說，他的水晶沒有人祈禱，就慢慢沒了聲音。');
      await say('米菈', '浮空遺跡上那顆黑色的水晶，現在還在那裡。很安靜。');
      await say('塔洛', '……港口那個收藏家，一直在收集石板碎片吧？\n那些碎片上的文字，我看過一次。是很古老的騎士團文字。');
      await say('希爾薇', '騎士團的文字？');
      await say('塔洛', '「銀翼」。上面刻著「銀翼」。跟艾倫你的騎士團同一個名字。');
      flag('ig_hint');
    }],
  ];
  async function night() {
    for (const [id, cond, fn] of NIGHTS) {
      if (F()[id] || !G.cond(cond)) continue;
      if (!inParty('neo') && /neo|serene/.test(id)) continue;
      if (!inParty('rena') && id === 'n_rena') continue;
      F()[id] = true;
      await ui.fade(1, 500); await ui.fade(0, 500);
      await fn();
      await ui.fade(1, 400); await ui.fade(0, 400);
      return true;
    }
    return false;
  }

  // ================================================================ the fifth apostle: the workshop is attacked
  async function workshopRaid() {
    G.field.locked = true;
    await narr('就在古德接過水晶透鏡的時候——工房的鐵門被人一腳踢開了。');
    const v = G.field.addNpc({ id: 'vahl', look: VAHL, x: 6, z: 7, dir: 'up' });
    await say('鐵面的瓦爾', '晨星號。三代人的夢想，是吧，古德。', VAHL);
    await say('老技師 古德', '……瓦爾？你是瓦爾？你還活著……', 'engineer');
    await say('蕾娜', '爺爺，你認識他？', 'rena');
    await say('鐵面的瓦爾', '我是你曾祖父的徒弟。第一張飛空艇的引擎圖，是我畫的。\n可是專利上只寫著「天匠 波爾特」。我的名字，連一個角落都沒有。', VAHL);
    await say('鐵面的瓦爾', '我是「蝕夜六使」的第五人。這艘船，不准飛。', VAHL);
    await say('艾倫', '要拆這艘船，先過我們這關！');
    const r = await battle(['vahl', 'sentry', 'sentry'], { bg: 'cave', noFlee: true });
    if (r !== 'win') { G.field.locked = false; return false; }
    await say('鐵面的瓦爾', '……哼。力氣不小。', VAHL);
    await say('老技師 古德', '瓦爾。我父親臨死前，一直叫著你的名字。\n他說，引擎那一半是瓦爾畫的。是他沒有勇氣改掉專利上的字。', 'engineer');
    await say('鐵面的瓦爾', '…………現在說這些，又有什麼用。', VAHL);
    await say('蕾娜', '有用！等晨星號飛起來，我要在船頭刻上兩個名字。\n波爾特，還有瓦爾。', 'rena');
    await say('鐵面的瓦爾', '……隨便你。', VAHL);
    G.field.removeNpc('vahl'); G.audio.sfx('flee');
    await narr('瓦爾沒有回頭。可是他走出門的時候，腳步停了一下。');
    flag('vahl_done');
    G.field.locked = false;
    return true;
  }

  // ================================================================ memorial stones (Sylvie)
  const STONES = {
    memorial_forest: ['盧卡斯', '盧卡斯。很會烤麵包。出任務前一天，他烤了一整籃，說「回來的時候還熱的話就分你們」。', '……麵包，早就冷了。'],
    memorial_mine: ['貝絲', '貝絲。怕蟲，可是第一個衝進礦坑的是她。她說「怕的東西就要先看清楚」。', '你說得對。我現在看清楚了。'],
    memorial_temple: ['老葛', '老葛。每次都說「這是最後一次出任務」。這一次，他說中了。', '……笨蛋。誰要你說中的。'],
  };
  async function memorial(id) {
    const [name, line, after] = STONES[id];
    if (quest('q_names') !== 'taken' || !inParty('sylvie')) return say('', `苔蘚覆蓋的小石碑。刻著一行模糊的字：「${name}」。`, null);
    if (F()[id]) return say('', `「${name}」的石碑。旁邊擺著一束新的野花。`, null);
    G.field.locked = true;
    await narr(`苔蘚覆蓋的小石碑。希爾薇蹲下來，用手套把字上的泥擦掉。`);
    await say('希爾薇', line);
    await say('希爾薇', after);
    F()[id] = true; G.audio.sfx('resonance');
    const n = Object.keys(STONES).filter(k => F()[k]).length;
    ui.toast(`希爾薇的名冊 ${n}/3`, 2600);
    if (n === 3) { await say('艾倫', '三個人都找到了。回白帆港的神殿吧——神官大人可以把名字刻上去。'); setQ('q_names', 'ready'); }
    G.field.locked = false;
  }

  // ================================================================ Talo's exam
  const EXAM = [
    ['第一題：敵人頭上的數字減到零，會發生什麼事？', ['敵人逃走', '敵人「破防」，暈倒一陣子、受到的傷害變大', '敵人變得更強'], 1],
    ['第二題：先用水屬性攻擊讓敵人「濕潤」，再用雷打下去，會怎麼樣？', ['沒有變化', '引發「感電」反應', '敵人回復HP'], 1],
    ['第三題：打「飛行」的敵人，哪一種武器最有效？', ['戰斧', '弓', '短劍'], 1],
    ['第四題：同一回合讓所有敵人都破防，會進入什麼？', ['追加階段', '逃跑模式', '睡眠'], 0],
    ['最後一題：魔法學院的院訓是？\n（提示：答案寫在學院的門口）', ['力量就是一切', '知識是用來分享的', '贏的人才是對的'], 1],
  ];
  async function exam() {
    const q = quest('q_exam');
    if (q === 'done') return say('學院院長', '塔洛同學最近交了一份很長的論文。題目是「星象與潮汐」。\n……寫得比老師還好。', 'scholar');
    if (!F().talo_dream || !inParty('talo') || !F().neo_joined) return say('學院院長', '這裡是蒼瀾魔法學院的分館。門口刻著學院的院訓：\n「知識是用來分享的」。', 'scholar');
    G.field.locked = true;
    if (!q) {
      await say('學院院長', '……你就是那個在白帆港算命的孩子？\n水守的尼歐大人寫了推薦信給我們。', 'scholar');
      await say('塔洛', '尼歐……？', 'talo');
      await say('尼歐', '我只是寫了實話。', 'neo');
      await say('學院院長', '學院有一個獎學金名額。考過了，學費全免。\n考題是戰鬥的知識——魔法師要先活下來，才能做研究。', 'scholar');
      start('q_exam');
    }
    if (!await ui.yesno('現在就參加考試嗎？（大家可以在旁邊小聲提示）')) { G.field.locked = false; return; }
    for (const [t, opts, ans] of EXAM) {
      await ui.sayKeep('學院院長', t, 'scholar');
      const i = await ui.choose(opts, { cancel: false, cls: 'small' }); ui.closeKeep();
      if (i !== ans) { G.audio.sfx('error'); await say('學院院長', '……可惜。準備好了再來吧。', 'scholar'); await say('塔洛', '剛、剛剛那題是我手滑！', 'talo'); G.field.locked = false; return; }
      G.audio.sfx('ok');
    }
    await say('學院院長', '全對。恭喜你，塔洛同學。歡迎來到蒼瀾魔法學院。', 'scholar');
    await say('塔洛', '…………', 'talo');
    await say('蕾娜', '咦，塔洛在哭嗎？', 'rena');
    await say('塔洛', '才沒有！是……是星星太亮了！', 'talo');
    await say('學院院長', '這把星杖是入學禮物。還有——兩千三百 G，請你寄回家給你母親吧。', 'scholar');
    await finish('q_exam', 'w_scholar_rod');
    G.field.locked = false;
  }

  // ================================================================ Rena's father, on Thunder Peak
  async function wreck() {
    if (quest('q_wings') !== 'taken' || F().wings_found || !inParty('rena')) return false;
    G.field.locked = true;
    await narr('峰頂的岩石間，卡著一架斷了翅膀的木製滑翔機。\n機身上用紅漆寫著：「燕號」。');
    await say('蕾娜', '……爸爸的燕號。', 'rena');
    await narr('駕駛座是空的。座椅下壓著一副護目鏡，和一本用油布包好的日誌。');
    await say('蕾娜', '日誌……最後一頁……', 'rena');
    await narr('「第三十一天。腿還是不能動。雷鷹每天都會帶魚回來，放在我旁邊。」');
    await narr('「我把翅膀的新設計畫好了。用雷鷹的羽毛排列，風會自己托起來。」');
    await narr('「蕾娜，如果你看到這本日誌，那表示你飛上來了。爸爸就知道你會。」\n「接下來的設計圖，交給你了。天匠蕾娜。」');
    await say('蕾娜', '…………', 'rena');
    await say('希爾薇', '……蕾娜。');
    await say('蕾娜', '我沒事。我只是……他明明可以寫「救救我」的。\n他寫的卻是設計圖。笨蛋爸爸。', 'rena');
    await say('蕾娜', '雷鷹照顧了他。所以雷鷹才在這裡，一直守著這座山頂。', 'rena');
    give('k_goggles'); give('k_flightlog');
    F().wings_found = true; setQ('q_wings', 'ready');
    await say('艾倫', '把日誌帶回去給古德爺爺吧。');
    G.field.locked = false;
    return true;
  }

  // ================================================================ the keeper's name (Saren)
  async function keeperLog() {
    if (quest('q_keeper') !== 'taken' || has('k_keeperlog')) return;
    G.field.locked = true;
    await narr('水晶台座的底下，有一塊鬆動的石磚。裡面藏著一本被海水泡過的日誌。');
    await narr('「暴風雨。燈油只剩一點。兒子薩倫發燒了，可是燈不能滅。」');
    await narr('「港口還有三艘船沒回來。我去頂上點燈。薩倫，等爸爸回來。」');
    await narr('日誌到這裡就斷了。');
    give('k_keeperlog');
    await say('米菈', '……薩倫說「被遺忘的人有多寂寞」。他說的，是他的爸爸。');
    G.field.locked = false;
  }
  async function sarenLamp() {
    G.field.locked = true;
    const sa = G.field.addNpc({ id: 'saren_l', look: 'cultist', x: 6, z: 4, dir: 'up' });
    await narr('燈塔頂上，有一個人背對著你們站在水晶前。');
    await say('灰燼的薩倫', '……你們把那塊牌子掛上去了。「燈塔守 薩爾」。', 'cultist');
    await say('灰燼的薩倫', '那天晚上三艘船都回來了。可是人們只記得船回來了，\n沒有人記得是誰點的燈。', 'cultist');
    await say('艾倫', '現在大家都記得了。牌子就在門口，每個進燈塔的人都會看到。');
    await say('灰燼的薩倫', '……我燒了那麼多東西，想讓大家跟我一樣忘記。\n結果讓我想起來的，是你們。真諷刺。', 'cultist');
    G.field.face(sa, player());
    await say('灰燼的薩倫', '這是我爸的提燈。我一直帶在身上。\n……燈這種東西，就該給會往前走的人。', 'cultist');
    await finish('q_keeper', 'x_ashlamp');
    await say('灰燼的薩倫', '我會留在這裡。從今天起，白帆港的燈，我來點。', 'cultist');
    G.field.removeNpc('saren_l');
    flag('saren_keeper');
    G.field.locked = false;
  }

  // ================================================================ Serene comes home
  async function sereneShoal() {
    if (quest('q_serene') !== 'taken' || F().serene_met) return false;
    G.field.locked = true;
    await narr('淺灘的盡頭，一個穿藍色法衣的女人，赤腳站在水裡。');
    await say('潮華的瑟琳', '……是你們啊。來抓我回去嗎？', SER);
    if (inParty('neo')) {
      await say('尼歐', '不是。我是來……說對不起的。不是以軍師的身份，是以你教過的那個愛哭鬼的身份。', 'neo');
      await say('潮華的瑟琳', '…………', SER);
      await say('尼歐', '軍師的位置我會讓出來。我已經跟長老說了，要重新選。\n如果你願意回來，你可以參加。', 'neo');
      await say('潮華的瑟琳', '……你長大了，尼歐。', SER);
      await say('潮華的瑟琳', '可是我不能就這樣回去。我做過的事，要先讓我自己認可。\n——拉弓吧。讓我看看我教的人，現在有多強。', SER);
    } else {
      await say('潮華的瑟琳', '尼歐沒有來嗎……也好。\n先讓我看看，打倒我的你們，是不是真的值得我認輸。', SER);
    }
    const r = await battle(['serene'], { bg: 'coast', noFlee: true, hard: 1.5 });
    if (r !== 'win') { G.field.locked = false; return true; }
    await say('潮華的瑟琳', '……好。我輸得心服口服。', SER);
    await say('潮華的瑟琳', '這把弓給你。我年輕時用的。\n——還有這封信，替我交給長老。我現在還沒有臉見他。', SER);
    give('k_letter_s');
    F().serene_met = true; setQ('q_serene', 'ready');
    await say('潮華的瑟琳', '下次見面的時候，我會自己走進水守之殿的大門。', SER);
    G.field.locked = false;
    return true;
  }

  // ================================================================ the collector's secret, and Ores's memory
  async function igReveal() {
    G.field.locked = true;
    await say('收藏家', '十二片……全部到齊了。', 'scholar');
    await say('收藏家', '我一直沒有說。我叫伊格，是「蝕夜六使」的最後一人。\n我不戰鬥。我的工作，是撿起被忘記的東西。', 'scholar');
    await say('艾倫', '你是六使……！');
    await say('伊格', '這些石板，是歐勒斯大人的水晶碎掉以後，散落在大陸上的碎片。\n上面刻的，是他的記憶。一千年前，銀翼騎士團的第一位團長的記憶。', 'scholar');
    await say('伊格', '把它帶去浮空遺跡最上面的黑色水晶。也許……他還能再發出一次聲音。', 'scholar');
    give('k_memory'); for (let i = 0; i < 12; i++) addItem(S(), 'tablet', -1); if ((S().items.tablet || 0) <= 0) delete S().items.tablet;
    start('q_ig');
    G.field.locked = false;
  }
  async function oresMemory() {
    G.field.locked = true;
    await narr('記憶放進黑色水晶的瞬間，水晶裡響起了一陣低沉的聲音。\n那是一千年前的戰場的聲音。');
    await say('？？？', '……誰？是誰在叫我的名字？\n不，不要再讓我想起來了——！', ORES);
    await narr('記憶的碎片化成了騎士的形體。那是被困在黑暗裡一千年的痛苦本身。');
    const r = await battle(['silent'], { bg: 'void', noFlee: true, music: 'boss', hard: 1.35 });
    if (r !== 'win') { G.field.locked = false; return; }
    await narr('黑色的水晶慢慢變成了透明的銀色。');
    await say('無聲者 歐勒斯', '……原來如此。我被忘記，是因為我自己先忘記了。\n忘記了我為什麼拿起劍。', ORES);
    await say('無聲者 歐勒斯', '我是為了讓更多人可以平凡地生活，平凡地被忘記。\n被忘記……其實是和平的證明啊。', ORES);
    await say('艾倫', '可是我們會記得你。銀翼騎士團的第一位團長，歐勒斯。');
    await say('無聲者 歐勒斯', '……謝謝你，後輩。這枚徽章，本來就是銀翼的東西。還給你們。', ORES);
    take('k_memory');
    await finish('q_ig', 'x_silent');
    flag('ores_rest');
    await narr('浮空遺跡的頂端，從那天起，有一顆水晶一直發著溫柔的銀光。');
    G.field.locked = false;
  }

  // ================================================================ fishing
  function fishGame(where) {
    return new Promise((res) => {
      const pool = FISH.filter(f => (f[2] === where || f[2] === 'both') && (f[6] !== 'night' || G.nightFor?.(G.field.mapId) || F().cleared));
      const tot = pool.reduce((a, f) => a + f[3], 0); let r = Math.random() * tot; let fish = pool[0]; for (const f of pool) { r -= f[3]; if (r < 0) { fish = f; break; } }
      const hard = fish[3] <= 3 ? 3 : fish[3] <= 9 ? 2 : 1;
      const box = document.createElement('div'); box.className = 'minigame';
      box.innerHTML = `<canvas width="320" height="200"></canvas><div class="mg-info">等浮標沉下去……</div>`;
      document.getElementById('ui').appendChild(box);
      const c = box.querySelector('canvas'), g = c.getContext('2d'), info = box.querySelector('.mg-info');
      // phases: wait for a bite, hook it in time, then reel: keep the marker inside the moving zone
      let phase = 'wait', t = 0, biteAt = 1.2 + Math.random() * 2.5, hookT = 0, catchP = 0.3, zone = 0.5, zoneV = 0.5, mark = 0.5, markV = 0, done = false;
      const end = (ok) => { if (done) return; done = true; phase = ok ? 'got' : 'lost'; G.audio.sfx(ok ? 'levelup' : 'error'); info.innerHTML = ok ? `釣到了 <b>${fish[1]}</b>！<br>按確定` : '魚跑掉了……<br>按確定'; };
      const finishG = () => { off(); box.remove(); res(phase === 'got' ? fish : null); };
      const press = () => {
        if (done) { finishG(); return; }
        if (phase === 'wait') { info.textContent = '太早了！魚被嚇跑了'; end(false); return; }
        if (phase === 'bite') { phase = 'reel'; G.audio.sfx('ok'); info.innerHTML = '一直按<b>確定</b>拉線（會往右），不按就會往左滑——<br>讓黃色標記待在綠色區域裡！'; return; }
        if (phase === 'reel') { markV = Math.min(1.4, markV + 0.42); G.audio.sfx('move'); }
      };
      const off = G.input.on((k) => { if (k === 'ok') press(); if (k === 'cancel' && done) finishG(); });
      box.onclick = () => press();
      let last = performance.now();
      const loop = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
        if (phase === 'wait' && t > biteAt) { phase = 'bite'; hookT = 0.75 - hard * 0.12; G.audio.sfx('item'); info.innerHTML = '<b>咬餌了！快按確定！</b>'; }
        else if (phase === 'bite') { hookT -= dt; if (hookT <= 0) end(false); }
        else if (phase === 'reel') {
          zoneV += (Math.random() - 0.5) * dt * (2 + hard * 2.2); zoneV = Math.max(-0.6 - hard * 0.25, Math.min(0.6 + hard * 0.25, zoneV));
          zone += zoneV * dt; if (zone < 0.12 || zone > 0.88) { zoneV *= -1; zone = Math.max(0.12, Math.min(0.88, zone)); }
          markV -= 1.5 * dt; markV *= Math.pow(0.35, dt); mark += markV * dt; if (mark <= 0 || mark >= 1) { mark = Math.max(0, Math.min(1, mark)); markV = 0; }
          const w = 0.25 - hard * 0.03; const inZ = Math.abs(mark - zone) < w / 2;
          catchP += (inZ ? 0.27 : -0.12 - hard * 0.03) * dt;
          if (catchP >= 1) end(true); else if (catchP <= 0) end(false);
        }
        // draw: sea, the line, the meter
        g.fillStyle = where === 'azur' ? '#3a7aa8' : '#2a5a8a'; g.fillRect(0, 0, 320, 200);
        g.fillStyle = 'rgba(255,255,255,0.12)'; for (let i = 0; i < 6; i++) g.fillRect((i * 70 + t * 20) % 340 - 20, 40 + i * 25, 30, 2);
        const by = phase === 'bite' ? 92 + Math.sin(t * 40) * 4 : 86 + Math.sin(t * 3) * 2;
        g.strokeStyle = '#e8e8e8'; g.lineWidth = 1; g.beginPath(); g.moveTo(320, 0); g.lineTo(160, by); g.stroke();
        g.fillStyle = '#e83a3a'; g.beginPath(); g.arc(160, by, 6, 0, Math.PI * 2); g.fill(); g.fillStyle = '#fff'; g.fillRect(156, by - 7, 8, 4);
        if (phase === 'bite') { g.fillStyle = '#ffe04a'; g.font = 'bold 28px sans-serif'; g.fillText('！', 172, by - 10); }
        if (phase === 'reel' || done) {
          const w = 0.25 - hard * 0.03;
          g.fillStyle = '#1a2a3a'; g.fillRect(20, 160, 280, 14);
          g.fillStyle = '#4ac86a'; g.fillRect(20 + (zone - w / 2) * 280, 160, w * 280, 14);
          g.fillStyle = '#ffe04a'; g.fillRect(20 + mark * 280 - 3, 156, 6, 22);
          g.fillStyle = '#1a2a3a'; g.fillRect(20, 184, 280, 6); g.fillStyle = '#ff9a3a'; g.fillRect(20, 184, 280 * Math.max(0, Math.min(1, catchP)), 6);
        }
        if (box.isConnected) requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    });
  }
  async function fishing(where) {
    S().fish = S().fish || {};
    if (!has('i_fishbait')) { await say('', '沒有釣餌了。（港口的釣魚老伯阿吉有在賣）', null); return; }
    if (!await ui.yesno(`要在這裡釣魚嗎？（釣餌 ×${S().items.i_fishbait}）`)) return;
    for (;;) {
      addItem(S(), 'i_fishbait', -1); if ((S().items.i_fishbait || 0) <= 0) delete S().items.i_fishbait;
      const f = await fishGame(where);
      if (f) {
        const size = Math.round(f[4][0] + Math.random() * (f[4][1] - f[4][0])); const first = !S().fish[f[0]];
        S().fish[f[0]] = Math.max(S().fish[f[0]] || 0, size);
        if (f[5]) give(f[5]); else ui.toast('……是舊靴子。');
        ui.toast(`${f[1]} ${size} cm${first ? '　<b>新紀錄！</b>' : ''}（圖鑑 ${Object.keys(S().fish).length}/${FISH.length}）`, 2600);
      }
      if (!has('i_fishbait') || !await ui.yesno('再釣一次嗎？')) break;
    }
  }
  async function angler() {
    S().fish = S().fish || {};
    const n = Object.keys(S().fish).length;
    if (!quest('q_fish')) { await say('釣魚老伯 阿吉', '年輕人，會釣魚嗎？碼頭邊的木牌那裡是好釣點。\n蒼瀾的運河也釣得到不一樣的魚喔。', 'fisher'); start('q_fish'); give('i_fishbait', 5); }
    else if (n >= FISH.length && quest('q_fish') !== 'done') { await say('釣魚老伯 阿吉', '十二種全部釣到了？！……你是我見過最厲害的釣客。這個徽章給你！', 'fisher'); await finish('q_fish', 'x_angler'); }
    else {
      const best = Object.entries(S().fish).sort((a, b) => b[1] - a[1])[0];
      await say('釣魚老伯 阿吉', `目前釣到 ${n}/${FISH.length} 種。${best ? `最大的是 ${FISH.find(f => f[0] === best[0])[1]} ${best[1]} cm！` : ''}\n${n >= 6 && !F().fish_tip ? '聽說晚上的港口，會有發光的魚喔。' : '稀有的魚很會跑，綠色區域也比較窄。'}`, 'fisher');
      if (n >= 6) F().fish_tip = true;
    }
    if (n >= 6 && !F().fish6) { F().fish6 = true; await say('釣魚老伯 阿吉', '六種了！這個拿去，是老伯年輕時撿到的寶貝。', 'fisher'); give('i_tr2_2'); }
    await ui.shop(['i_fishbait'], '釣具');
  }

  // ================================================================ talking: new people and new lines for old ones
  const TALK = {
    port_angler: angler,
    academy_dean: exam,
    lighthouse_saren: async () => say('灰燼的薩倫', '晚上出海的船，看到燈就會回來。……我爸說的。', 'cultist'),
    azur_serene: async () => say('潮華的瑟琳', '我還在學怎麼當一個普通的水守。\n……尼歐的箭術，其實已經比我好了。不要告訴他。', SER),
  };
  // wrap an existing talk: the side story first, otherwise the old line
  const wrap = (base) => ({
    async port_oldwoman() {
      if (F().saren2_done && !quest('q_keeper')) {
        await say('老奶奶', '你們說……那個穿黑袍的人叫「薩倫」？', 'oldwoman');
        await say('老奶奶', '三十年前，燈塔守薩爾有個兒子，也叫薩倫。\n暴風雨那晚，薩爾為了點燈死在燈塔上。後來商會重建燈塔，牌子上只刻了出錢的人。', 'oldwoman');
        await say('老奶奶', '那孩子後來離開了港口，再也沒有回來……\n燈塔頂上，也許還留著薩爾的東西。', 'oldwoman');
        start('q_keeper'); return;
      }
      if (quest('q_keeper') === 'taken') return say('老奶奶', has('k_keeperlog') ? '那本日誌……帶去神殿給神官看看吧。他可以幫忙做一塊新的牌子。' : '燈塔頂上，也許還留著薩爾的東西。', 'oldwoman');
      if (quest('q_keeper') === 'done') return say('老奶奶', '最近晚上，燈塔的燈總是準時亮起來。\n點燈的人是誰，大家都知道，只是不說。', 'oldwoman');
      return base.port_oldwoman();
    },
    async temple_priest() {
      if (quest('q_names') === 'ready') {
        await say('神官', '希爾薇小姐的名冊……好。神殿的牆上，還有位置。', 'priest');
        await narr('三個名字，被刻在海潮神殿的石牆上。就在艾薇娜的名字旁邊。');
        await say('希爾薇', '盧卡斯、貝絲、老葛。……以後經過這裡，我會跟你們打招呼的。');
        await say('希爾薇', '這把槍，是我入團的時候三個人一起湊錢買的。我一直捨不得用。\n——現在可以了。');
        take('k_names'); await finish('q_names', 'w_oath_spear'); return;
      }
      if (quest('q_keeper') === 'taken' && has('k_keeperlog')) {
        await say('神官', '燈塔守薩爾的日誌……這是港口欠他的。\n我會請工匠做一塊新的牌子，掛在燈塔的門口。', 'priest');
        take('k_keeperlog'); setQ('q_keeper', 'ready'); flag('keeper_plaque');
        await say('神官', '牌子掛好了。……晚上去燈塔看看吧。也許有人在等你們。', 'priest'); return;
      }
      return base.temple_priest();
    },
    async workshop_gramps() {
      if (quest('q_wings') === 'ready' && has('k_flightlog')) {
        G.field.locked = true;
        await say('老技師 古德', '這是……卡爾的字。', 'engineer');
        await narr('古德一頁一頁地翻著日誌，翻到最後一頁的時候，手停住了。');
        await say('老技師 古德', '……我一直跟大家說他摔死了。因為如果他沒有摔死，\n那就是我這個做父親的，沒有去找他。', 'engineer');
        await say('蕾娜', '爺爺……', 'rena');
        await say('老技師 古德', '蕾娜，這張設計圖，你來做。我老了，手會抖。\n——不，我們一起做。三代人一起。', 'engineer');
        await ui.fade(1, 500); G.audio.sfx('door'); await wait(300); G.audio.sfx('door'); await wait(300); G.audio.sfx('levelup'); await ui.fade(0, 500);
        await say('蕾娜', '完成了！照著爸爸的設計做的扳手——「燕之扳手」！', 'rena');
        take('k_flightlog'); await finish('q_wings', 'w_swallow_wrench');
        await say('蕾娜', '護目鏡我留著。以後開晨星號的時候，我要戴著它。', 'rena');
        G.field.locked = false; return;
      }
      if (F().serene_done && !F().airship_built && has('k_lens') && !F().vahl_done) { if (!await workshopRaid()) return; }
      return base.workshop_gramps();
    },
    async palace_elder() {
      if (F().cleared && F().serene_done && !quest('q_serene')) {
        await say('水守長老', '……有人在鯨之淺灘，看見了瑟琳。', 'noble');
        await say('水守長老', '我想見她，可是我不敢去。是我沒有好好看著她。\n選軍師的時候，我選了自己的孫子。我騙自己說那是為了水守。', 'noble');
        await say('水守長老', '可以拜託你們，替我去見她一面嗎？', 'noble');
        start('q_serene'); return;
      }
      if (quest('q_serene') === 'ready' && has('k_letter_s')) {
        await say('水守長老', '這是……瑟琳的字。她從小寫字就很工整。', 'noble');
        await narr('長老讀完信，把信紙按在胸口，很久沒有說話。');
        await say('水守長老', '「我會自己走進大門。」……好。我會等她。這次，我會好好地等。', 'noble');
        take('k_letter_s'); await finish('q_serene', 'w_tide_bow'); flag('serene_back'); return;
      }
      return base.palace_elder();
    },
    async port_collector() {
      if (F().cleared && S().tablets.length >= 12 && !quest('q_ig')) return igReveal();
      if (quest('q_ig') === 'taken') return say('伊格', '浮空遺跡的最上面。黑色的水晶前。……拜託了。', 'scholar');
      if (quest('q_ig') === 'done') return say('伊格', '撿起被忘記的東西，是我的工作。\n現在，我想去撿一些還沒被忘記的東西了。比如說，你們的故事。', 'scholar');
      return base.port_collector();
    },
    async port_fisher() { if (quest('q_fish') && !F().fish_fisher) { F().fish_fisher = true; return say('老漁夫 哈克', '阿吉那傢伙又在找人陪他釣魚啦？他年輕的時候，可是釣過三公尺的鮪魚喔。', 'fisher'); } return base.port_fisher(); },
  });

  // ================================================================ signs and spots
  const SIGNS = {
    memorial_forest: () => memorial('memorial_forest'),
    memorial_mine: () => memorial('memorial_mine'),
    memorial_temple: () => memorial('memorial_temple'),
    fish_port: () => fishing('port'),
    fish_azur: () => fishing('azur'),
    keeper_plaque: () => say('', F().keeper_plaque ? '燈塔的門口掛著一塊新的木牌：\n「燈塔守 薩爾　在暴風雨之夜點亮了這座燈塔」' : '燈塔的門口掛著一塊舊牌子，刻著商會捐款人的名字。', null),
    academy_motto: () => say('', '學院的門口刻著院訓：\n「知識是用來分享的」', null),
  };
  const EV = {
    async keeper_log() { await keeperLog(); },
    async saren_lamp() { if (quest('q_keeper') === 'ready' && F().cleared) await sarenLamp(); else if (quest('q_keeper') === 'ready') await narr('燈塔頂很安靜。……也許，等一切結束以後再來看看吧。'); },
    async ores_crystal() { if (quest('q_ig') === 'taken' && has('k_memory')) await oresMemory(); },
  };
  // spot events that also carry a side story
  const spotWrap = (base) => ({
    async trial_hawk() { if (await wreck()) return; return base.trial_hawk(); },
    async trial_whale() { if (await sereneShoal()) return; return base.trial_whale(); },
  });
  const bubble = (def) => {
    const id = def.id;
    if (id === 'port_oldwoman' && F().saren2_done && !quest('q_keeper')) return '!';
    if (id === 'temple_priest' && (quest('q_names') === 'ready' || (quest('q_keeper') === 'taken' && has('k_keeperlog')))) return '!';
    if (id === 'workshop_gramps' && quest('q_wings') === 'ready') return '!';
    if (id === 'palace_elder' && ((F().cleared && F().serene_done && !quest('q_serene')) || quest('q_serene') === 'ready')) return '!';
    if (id === 'port_collector' && F().cleared && S().tablets.length >= 12 && !quest('q_ig')) return '!';
    if (id === 'academy_dean' && F().talo_dream && F().neo_joined && quest('q_exam') !== 'done' && inParty('talo')) return '!';
    if (id === 'port_angler' && (!quest('q_fish') || (Object.keys(S().fish || {}).length >= FISH.length && quest('q_fish') !== 'done'))) return '!';
    return null;
  };
  // objective hints for the side stories, shown under the main objective
  const sideHint = () => {
    if (quest('q_wings') === 'taken' && F().airship_built && !F().wings_found) return '支線：搭飛空艇去雷鳴峰找「燕號」';
    if (quest('q_names') === 'taken') return `支線：找到希爾薇小隊的紀念石（${Object.keys(STONES).filter(k => F()[k]).length}/3）`;
    return '';
  };
  return { TALK, wrap, SIGNS, EV, spotWrap, bubble, night, sideHint };
}
