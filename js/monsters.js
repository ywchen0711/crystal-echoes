// The big bestiary: classic RPG monster types (original names and art), each with recoloured cousins
// that get stronger, the way monster families grow in old console RPGs.
import { Px, ramp, shade, mix, rnd, registerMonster } from './pixel.js?v=19';
import { ENEMIES, SKILLS } from './data.js?v=19';

// ---------------------------------------------------------------- art (all face left; battle flips them)
const D = {};
D.beast = (c) => { // big horned quadruped; wings and a scorpion tail are options
  const p = new Px(40, 30), R = ramp(c.body), M = ramp(c.mane || shade(c.body, -0.25)), H = ramp(c.horn || '#e8e0c8');
  if (c.wing) { const W = ramp(c.wing); for (let i = 0; i < 8; i++) p.line(22, 10, 34 - i * 2, 1 + i * 0.6, W[i % 3]); }
  p.sell(22, 15, 12, 7, R);
  for (const x of [12, 17, 26, 31]) p.srect(x, 18, 4, 11, x < 20 ? R : [R[1], R[2], R[2]]);
  p.sell(10, 12, 6, 6, M); p.sell(7, 13, 5, 4, R); p.srect(1, 13, 5, 4, R); p.rect(1, 16, 4, 1, '#3a0a1a'); p.set(2, 17, '#fff'); p.set(4, 17, '#fff');
  p.set(6, 11, c.eye || '#ffd23a');
  p.line(8, 9, 4, 3, H[1]); p.line(9, 9, 6, 2, H[0]); p.line(11, 9, 14, 3, H[2]); p.set(3, 4, H[0]);
  if (c.tail) { for (let i = 0; i < 6; i++) p.set(34 + i, 12 - i * 1.5, R[1]); p.sell(39, 3, 1.5, 2, ramp(c.tail)); }
  else p.line(33, 13, 39, 8, R[2]);
  return p.outline();
};
D.ogre = (c) => {
  const p = new Px(30, 38), S = ramp(c.body), C = ramp(c.cloth || '#6a4a2a');
  p.srect(8, 28, 6, 9, S); p.srect(16, 28, 6, 9, S);
  p.sell(15, 21, 10, 9, S); p.srect(6, 24, 18, 6, C);
  p.srect(3, 13, 5, 12, S); p.srect(22, 13, 5, 12, S);
  p.sell(15, 9, 6, 6, S);
  if (c.oneEye) { p.sell(15, 8, 2.5, 2, ramp('#fff8e0')); p.set(15, 8, '#1c1424'); } else { p.rect(11, 8, 2, 2, c.eye || '#ffe03a'); p.rect(17, 8, 2, 2, c.eye || '#ffe03a'); }
  p.rect(12, 12, 6, 1, '#3a1a1a'); p.set(12, 13, '#fff'); p.set(17, 13, '#fff');
  if (c.horn) { p.line(10, 4, 7, 0, c.horn); p.line(20, 4, 23, 0, c.horn); }
  p.line(3, 25, 0, 6, '#6a4a2a'); p.sell(1, 5, 2.5, 4, ramp('#7a5a3a')); for (let i = 0; i < 4; i++) p.set(0 + (i % 2) * 3, 3 + i * 2, '#c8c8c8');
  return p.outline();
};
D.imp = (c) => {
  const p = new Px(24, 24), R = ramp(c.body), W = ramp(c.wing || shade(c.body, -0.3));
  for (let i = 0; i < 6; i++) { p.line(12, 9, 3 + i, 2 + i * 0.5, W[i % 3]); p.line(12, 9, 21 - i, 2 + i * 0.5, W[i % 3]); }
  p.sell(12, 14, 4, 5, R); p.sell(12, 7, 4, 4, R);
  p.line(9, 4, 7, 0, R[2]); p.line(15, 4, 17, 0, R[2]);
  p.set(10, 7, c.eye || '#ffe03a'); p.set(14, 7, c.eye || '#ffe03a'); p.rect(10, 10, 4, 1, '#1c1424');
  p.line(10, 18, 9, 22, R[2]); p.line(14, 18, 15, 22, R[2]);
  p.line(16, 15, 21, 21, R[1]); p.set(22, 22, R[2]);
  p.line(7, 22, 5, 6, '#8a8a9a'); p.line(3, 6, 7, 6, '#c8c8d8'); p.set(3, 5, '#c8c8d8'); p.set(5, 5, '#c8c8d8'); p.set(7, 5, '#c8c8d8');
  return p.outline();
};
D.mimic = (c) => {
  const p = new Px(26, 24), R = ramp(c.body || '#8a5a2a'), M = ramp(c.metal || '#e8c050');
  p.srect(2, 12, 22, 11, R); p.rect(2, 16, 22, 2, M[1]); p.srect(11, 15, 4, 4, M);
  p.srect(3, 2, 20, 7, R); p.rect(3, 2, 20, 1, M[0]);
  p.rect(3, 9, 20, 3, '#3a0a1a');
  for (let i = 0; i < 6; i++) { p.set(4 + i * 3.4, 9, '#fff'); p.set(5 + i * 3.4, 11, '#fff'); }
  p.sell(9, 11, 3, 1.5, ramp('#e85a8a'));
  p.set(7, 5, c.eye || '#ffe03a'); p.set(18, 5, c.eye || '#ffe03a');
  return p.outline();
};
D.cactus = (c) => {
  const p = new Px(20, 28), R = ramp(c.body || '#5ab84a');
  p.srect(7, 5, 6, 20, R); p.sell(10, 5, 3, 3, R);
  p.srect(2, 10, 4, 3, R); p.srect(2, 6, 3, 5, R); p.srect(14, 13, 4, 3, R); p.srect(15, 9, 3, 5, R);
  p.line(8, 25, 5, 27, R[2]); p.line(12, 25, 15, 27, R[2]);
  for (let i = 0; i < 8; i++) p.set(7 + (i % 2) * 6, 7 + i * 2.2, '#f4f0c8');
  p.set(8, 9, '#1c1424'); p.set(11, 9, '#1c1424'); p.rect(9, 12, 2, 2, '#1c1424');
  if (c.flower) p.sell(10, 2, 2, 1.5, ramp(c.flower));
  return p.outline();
};
D.bomb = (c) => {
  const p = new Px(24, 24), R = ramp(c.body || '#ff8a3a'), F = ramp(c.flame || '#ffe04a');
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; p.line(12, 12, 12 + Math.cos(a) * 11, 12 + Math.sin(a) * 11, F[i % 3]); }
  p.sell(12, 12, 8, 8, R);
  p.rect(8, 10, 2, 3, '#1c1424'); p.rect(14, 10, 2, 3, '#1c1424'); p.set(8, 10, '#fff'); p.set(14, 10, '#fff');
  p.ell(12, 16, 3, 1.5, '#3a0a1a'); p.set(11, 16, '#fff');
  return p.outline();
};
D.eye = (c) => {
  const p = new Px(28, 26), R = ramp(c.body || '#c86a8a'), W = ramp(c.wing || '#6a3a5a');
  for (let i = 0; i < 6; i++) { p.line(14, 10, 2 + i, 2 + i, W[i % 3]); p.line(14, 10, 26 - i, 2 + i, W[i % 3]); }
  for (let i = 0; i < 4; i++) for (let k = 0; k < 7; k++) p.set(9 + i * 3 + Math.sin(k + i) * 1.2, 17 + k, R[k % 3]);
  p.sell(14, 11, 7, 7, R);
  p.sell(13, 11, 4.5, 4.5, ramp('#fff8f0')); p.sell(12, 11, 2.5, 2.5, ramp(c.iris || '#e8302a')); p.set(12, 11, '#1c1424'); p.set(11, 10, '#fff');
  return p.outline();
};
D.mushroom = (c) => {
  const p = new Px(24, 26), C = ramp(c.body || '#d84a4a'), S = ramp('#f4e8d0');
  p.srect(8, 14, 8, 9, S); p.line(9, 23, 7, 25, S[2]); p.line(14, 23, 16, 25, S[2]);
  p.sell(12, 9, 11, 6, C); p.rect(2, 12, 20, 2, C[2]);
  for (const [x, y] of [[7, 6], [13, 4], [17, 8], [10, 10], [4, 10]]) p.sell(x, y, 1.5, 1.2, ramp(c.spot || '#fff4e8'));
  p.set(9, 17, '#1c1424'); p.set(14, 17, '#1c1424'); p.rect(10, 20, 4, 1, '#6a2a2a');
  return p.outline();
};
D.insect = (c) => {
  const p = new Px(32, 22), R = ramp(c.body || '#3a5a8a');
  p.sell(18, 12, 10, 6, R); p.line(18, 6, 18, 17, R[0]);
  p.sell(7, 13, 4, 4, R);
  for (let i = 0; i < 3; i++) { p.line(12 + i * 5, 16, 9 + i * 5, 21, R[2]); p.line(14 + i * 5, 16, 16 + i * 5, 21, R[2]); }
  p.set(5, 12, c.eye || '#ffe03a');
  if (c.horn) { p.line(5, 11, 1, 4, R[1]); p.line(4, 10, 0, 5, R[0]); }
  if (c.stinger) { for (let i = 0; i < 9; i++) p.sell(27 + Math.sin(i * 0.4) * 3, 12 - i * 1.2, 1.8, 1.8, R); p.line(24, 1, 22, 4, c.stinger); }
  if (c.pincer) { p.line(3, 15, 0, 17, R[1]); p.line(3, 16, 0, 19, R[1]); }
  return p.outline();
};
D.spider = (c) => {
  const p = new Px(32, 22), R = ramp(c.body || '#3a2a3a');
  for (let i = 0; i < 4; i++) { p.line(14, 12, 4 - i, 4 + i * 4, R[2]); p.line(4 - i, 4 + i * 4, 1 - i * 0.5, 14 + i * 2, R[2]); p.line(18, 12, 28 + i, 4 + i * 4, R[1]); p.line(28 + i, 4 + i * 4, 31, 14 + i * 2, R[1]); }
  p.sell(21, 11, 7, 6, R); p.sell(11, 12, 5, 4, R);
  if (c.mark) p.sell(21, 10, 2, 3, ramp(c.mark));
  for (let i = 0; i < 4; i++) p.set(8 + i, 11 - (i % 2), c.eye || '#ff3a3a');
  return p.outline();
};
D.ghost = (c) => {
  const p = new Px(22, 26), R = ramp(c.body || '#e8eef8');
  p.sell(11, 10, 8, 8, R); p.srect(3, 10, 16, 10, R);
  for (let i = 0; i < 5; i++) p.sell(5 + i * 3, 21, 1.6, 2.5 - (i % 2), R);
  p.ell(8, 9, 1.6, 2.2, '#1c1424'); p.ell(14, 9, 1.6, 2.2, '#1c1424'); p.ell(11, 14, 2, 2.4, '#1c1424');
  p.line(2, 14, 0, 18, R[1]); p.line(20, 13, 21, 9, R[2]);
  if (c.crown) { p.rect(7, 1, 8, 2, '#e8c050'); p.set(7, 0, '#e8c050'); p.set(11, 0, '#e8c050'); p.set(14, 0, '#e8c050'); }
  return p;
};
D.hydra = (c) => {
  const n = c.heads || 3, p = new Px(40, 36), R = ramp(c.body), B = ramp(c.belly || '#e8d8a0');
  p.sell(22, 28, 14, 7, R); p.sell(22, 30, 9, 4, B);
  for (let h = 0; h < n; h++) {
    const bx = 18 + h * (16 / Math.max(1, n - 1)), top = 7 + (h % 2) * 5;
    for (let i = 0; i <= 8; i++) { const t = i / 8; p.sell(bx - t * t * 6, 26 - t * (26 - top - 3), 2.6, 2.6, R); }
    const hx = bx - 8;
    p.sell(hx, top, 4.5, 3.2, R); p.srect(hx - 7, top, 5, 3, R); p.rect(hx - 7, top + 2, 5, 1, '#3a0a1a'); p.set(hx - 6, top + 3, '#fff'); p.set(hx - 4, top + 3, '#fff');
    p.set(hx - 1, top - 1, c.eye || '#ffe03a'); p.line(hx + 1, top - 3, hx + 3, top - 6, R[0]);
  }
  p.line(34, 28, 39, 22, R[2]);
  return p.outline();
};
D.octopus = (c) => {
  const p = new Px(32, 30), R = ramp(c.body || '#c84a6a');
  for (let t = 0; t < 6; t++) for (let i = 0; i < 12; i++) p.sell(6 + t * 4 + Math.sin(i * 0.6 + t) * 2.5, 16 + i * 1.1, 1.8 - i * 0.08, 1.8, R);
  p.sell(16, 10, 9, 9, R);
  p.rect(11, 10, 3, 3, '#fff8e0'); p.rect(18, 10, 3, 3, '#fff8e0'); p.set(12, 11, '#1c1424'); p.set(19, 11, '#1c1424');
  for (let i = 0; i < 6; i++) p.set(12 + i * 2, 4 + (i % 2), R[0]);
  return p.outline();
};
D.turtle = (c) => {
  const p = new Px(34, 22), R = ramp(c.body || '#6a8a4a'), S = ramp(c.shell || '#8a6a3a');
  p.srect(9, 14, 5, 7, R); p.srect(22, 14, 5, 7, R);
  p.sell(19, 11, 13, 7, S);
  for (let i = 0; i < 4; i++) p.line(10 + i * 6, 6, 9 + i * 6, 15, S[2]);
  if (c.spike) for (let i = 0; i < 5; i++) { p.line(10 + i * 4, 5, 9 + i * 4, 1, c.spike); }
  p.sell(5, 12, 4, 3, R); p.set(3, 11, '#1c1424'); p.line(1, 13, 4, 13, '#3a1a1a');
  p.line(31, 13, 33, 15, R[2]);
  return p.outline();
};
D.frog = (c) => {
  const p = new Px(24, 18), R = ramp(c.body || '#5ab84a'), B = ramp(c.belly || '#e8e0a0');
  p.sell(13, 11, 9, 5, R); p.sell(11, 13, 5, 3, B);
  p.sell(6, 5, 2.5, 2.5, R); p.sell(13, 5, 2.5, 2.5, R); p.set(6, 5, '#1c1424'); p.set(13, 5, '#1c1424'); p.set(5, 4, '#fff');
  p.line(3, 11, 10, 11, '#3a1a1a');
  p.line(18, 14, 23, 17, R[2]); p.line(17, 15, 21, 17, R[1]); p.line(7, 15, 5, 17, R[2]);
  if (c.crown) { p.rect(7, 0, 6, 2, '#e8c050'); }
  return p.outline();
};
D.rabbit = (c) => {
  const p = new Px(22, 20), R = ramp(c.body || '#f4ecdc');
  p.sell(13, 13, 7, 5, R); p.sell(7, 9, 4, 4, R);
  p.srect(6, 0, 2, 6, R); p.srect(9, 1, 2, 6, R); p.set(6, 2, '#f4a0b0'); p.set(9, 3, '#f4a0b0');
  p.set(5, 8, c.eye || '#e8302a'); p.set(3, 10, '#e8a0a0');
  p.sell(20, 12, 2, 2, ramp('#ffffff')); p.line(10, 17, 8, 19, R[2]); p.line(16, 17, 17, 19, R[2]);
  if (c.horn) p.line(5, 5, 2, 0, c.horn);
  return p.outline();
};
D.gargoyle = (c) => {
  const p = new Px(30, 30), R = ramp(c.body || '#7a7a8a'), W = ramp(shade(c.body || '#7a7a8a', -0.25));
  for (let i = 0; i < 8; i++) { p.line(15, 10, 3 + i, 2 + i * 1.2, W[i % 3]); p.line(15, 10, 27 - i, 2 + i * 1.2, W[i % 3]); }
  p.sell(15, 18, 6, 7, R); p.srect(9, 24, 4, 5, R); p.srect(17, 24, 4, 5, R);
  p.sell(13, 9, 4, 4, R); p.line(11, 6, 9, 2, R[0]); p.line(16, 6, 18, 2, R[2]);
  p.set(11, 9, c.eye || '#ff4a3a'); p.set(15, 9, c.eye || '#ff4a3a'); p.rect(11, 12, 4, 1, '#1c1424');
  p.line(9, 18, 5, 24, R[1]); p.line(21, 18, 25, 24, R[2]);
  return p.outline();
};
D.mummy = (c) => {
  const p = new Px(20, 30), R = ramp(c.body || '#d8ccb0');
  p.srect(6, 10, 9, 11, R); p.srect(6, 20, 4, 9, R); p.srect(11, 20, 4, 9, R);
  p.sell(10, 6, 4, 4, R); p.srect(2, 11, 4, 3, R); p.srect(15, 11, 4, 3, R); p.srect(0, 12, 3, 2, R);
  for (let i = 0; i < 12; i++) p.line(5, 4 + i * 2.2, 15, 5 + i * 2.2, R[2]);
  p.set(8, 6, c.eye || '#ffe03a'); p.set(12, 6, c.eye || '#ffe03a');
  if (c.crown) { p.srect(5, 0, 10, 3, ramp('#e8c050')); p.rect(6, 3, 8, 1, '#3a5aa8'); }
  return p.outline();
};
D.elemental = (c) => {
  const p = new Px(24, 28), R = ramp(c.body), L = ramp(shade(c.body, 0.4));
  for (let i = 0; i < 26; i++) { const t = i / 25, w = 3 + Math.sin(t * Math.PI) * 7; p.rect(12 - w + Math.sin(t * 9) * 1.5, 27 - i, w * 2, 1, i % 4 === 0 ? R[2] : R[1]); }
  p.sell(12, 11, 5, 6, L);
  p.rect(9, 10, 2, 2, '#1c1424'); p.rect(14, 10, 2, 2, '#1c1424'); p.set(9, 10, '#fff'); p.set(14, 10, '#fff');
  if (c.rock) for (let i = 0; i < 8; i++) p.srect(4 + rnd() * 14, 6 + rnd() * 18, 3, 3, ramp(c.rock));
  return p;
};
D.worm = (c) => {
  const p = new Px(30, 32), R = ramp(c.body || '#c8a060');
  for (let i = 0; i < 14; i++) p.sell(18 + Math.sin(i * 0.5) * 4, 30 - i * 1.8, 5 - i * 0.05, 3, R);
  p.sell(12, 6, 7, 6, R); p.ell(9, 6, 4, 4, '#3a0a1a');
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; p.set(9 + Math.cos(a) * 3, 6 + Math.sin(a) * 3, '#f4f0d8'); }
  for (let i = 0; i < 6; i++) p.set(15 + i, 12 + i * 3, R[2]);
  return p.outline();
};
D.pudding = (c) => {
  const p = new Px(22, 18), R = ramp(c.body || '#f4d070'), T = ramp(c.top || '#8a4a1a');
  p.sell(11, 11, 9, 6, R); p.rect(2, 15, 18, 2, R[2]);
  p.sell(11, 6, 7, 2.5, T); for (let i = 0; i < 4; i++) p.line(5 + i * 4, 7, 5 + i * 4, 9 + (i % 2), T[1]);
  p.rect(7, 11, 2, 2, '#1c1424'); p.rect(13, 11, 2, 2, '#1c1424'); p.rect(10, 14, 2, 1, '#6a2a2a');
  return p.outline();
};
for (const [k, f] of Object.entries(D)) registerMonster(k, f);

// ---------------------------------------------------------------- new enemy skills
Object.assign(SKILLS, {
  e_selfdestruct: { name: '自爆', type: 'phys', tgt: 'enemy', selfDestruct: true, anim: 'explode' },
  e_needles: { name: '萬針', type: 'phys', tgt: 'enemy', fixedLv: 12, anim: 'arrow' },
  e_badbreath: { name: '惡臭氣息', type: 'debuff', tgt: 'enemies', multiStatus: ['poison', 'blind', 'silence', 'sleep', 'confuse', 'slow'], chance: 0.35, anim: 'dark' },
  e_gaze: { name: '魔眼凝視', type: 'debuff', tgt: 'enemy', status: 'confuse', chance: 0.55, anim: 'dark' },
  e_stopgaze: { name: '石化之瞳', type: 'debuff', tgt: 'enemy', status: 'stop', chance: 0.45, anim: 'dark' },
  e_web: { name: '蛛網', type: 'debuff', tgt: 'enemies', status: 'slow', chance: 0.55, anim: 'dark' },
  e_stomp: { name: '震地踏', type: 'phys', tgt: 'enemies', pow: 0.9, status: 'stun', chance: 0.2, anim: 'quake' },
  e_regen: { name: '再生', type: 'buff', tgt: 'self', regen: 3, anim: 'heal' },
  e_multibite: { name: '亂咬', type: 'phys', tgt: 'random', pow: 0.6, hits: 3, anim: 'bite' },
  e_doom: { name: '死之宣告', type: 'debuff', tgt: 'enemy', status: 'doom', chance: 0.35, anim: 'dark' },
  e_ink: { name: '墨汁', type: 'debuff', tgt: 'enemies', status: 'blind', chance: 0.5, anim: 'dark' },
  e_hex: { name: '詛咒', type: 'debuff', tgt: 'enemy', status: 'curse', chance: 0.6, anim: 'dark' },
  e_mpsuck: { name: '吸魔', type: 'special', tgt: 'enemy', mpSuck: 0.25, anim: 'dark' },
  e_chomp: { name: '大口咬', type: 'phys', tgt: 'enemy', pow: 2.1, anim: 'bite' },
  e_blizzard: { name: '暴風雪', type: 'mag', tgt: 'enemies', pow: 1.2, el: 'ice', anim: 'ice' },
  e_storm: { name: '雷暴', type: 'mag', tgt: 'enemies', pow: 1.2, el: 'thunder', anim: 'thunder' },
  e_inferno: { name: '烈焰地獄', type: 'mag', tgt: 'enemies', pow: 1.5, el: 'fire', anim: 'fire' },
  e_flood: { name: '大洪水', type: 'mag', tgt: 'enemies', pow: 1.4, el: 'water', anim: 'water' },
  e_holy: { name: '聖光', type: 'mag', tgt: 'enemy', pow: 1.6, el: 'light', anim: 'holy' },
  e_meteor: { name: '流星雨', type: 'mag', tgt: 'random', pow: 0.9, hits: 4, anim: 'meteor' },
  e_flare: { name: '核爆', type: 'mag', tgt: 'enemy', pow: 3.0, pierce: true, anim: 'explode' },
  e_dance: { name: '詭異舞步', type: 'buff', tgt: 'self', buff: { spd: 1, def: 1 }, anim: 'song' },
  e_metalflee: { name: '溜走', type: 'special', tgt: 'self', flee: true, anim: 'buff' },
  e_heal2: { name: '大回復', type: 'heal', tgt: 'allyE', pow: 2.2, base: 120, anim: 'heal' },
  e_roar: { name: '咆哮', type: 'debuff', tgt: 'enemies', debuff: { atk: 1 }, status: 'stun', chance: 0.15, anim: 'quake' },
  e_tailsting: { name: '毒尾', type: 'phys', tgt: 'enemy', pow: 1.3, status: 'poison', chance: 0.6, anim: 'thrust' },
  e_tentacle: { name: '觸手纏繞', type: 'phys', tgt: 'random', pow: 0.55, hits: 4, status: 'slow', chance: 0.2, anim: 'claw' },
  e_spores2: { name: '睡眠孢子', type: 'debuff', tgt: 'enemies', status: 'sleep', chance: 0.4, anim: 'song' },
  e_laughgas: { name: '笑氣', type: 'debuff', tgt: 'enemies', status: 'confuse', chance: 0.35, anim: 'song' },
  e_quake2: { name: '大地震', type: 'mag', tgt: 'enemies', pow: 1.5, el: 'earth', anim: 'quake' },
  e_gust: { name: '真空波', type: 'mag', tgt: 'enemies', pow: 1.3, el: 'wind', anim: 'wind' },
  e_darkwave: { name: '冥界波', type: 'mag', tgt: 'enemies', pow: 1.5, el: 'dark', anim: 'dark' },
});

// ---------------------------------------------------------------- roster
// kind -> { fam stats multipliers, habitat, traits, weak weapons, acts by role } and its cousins
const EL_OPP = { fire: 'ice', ice: 'fire', thunder: 'water', water: 'thunder', wind: 'earth', earth: 'wind', light: 'dark', dark: 'light' };
const EL_MAG = { fire: 'e_fire', ice: 'e_ice', thunder: 'e_thunder', water: 'e_water', wind: 'e_wind', earth: 'e_quake', light: 'e_holy', dark: 'e_dark' };
const EL_BIG = { fire: 'e_inferno', ice: 'e_blizzard', thunder: 'e_storm', water: 'e_flood', wind: 'e_gust', earth: 'e_quake2', light: 'e_holy', dark: 'e_darkwave' };
const K = {
  slime: { fam: 'amorph', m: [0.8, 0.9, 0.9, 1, 0.9], hab: ['field', 'forest', 'cave', 'coast'], acts: [['e_tackle', 3]] },
  pudding: { fam: 'amorph', m: [1.1, 0.9, 0.6, 1.2, 0.7], hab: ['cave', 'temple', 'forest'], acts: [['e_tackle', 2], ['e_regen', 1]], resistPhys: true },
  wolf: { fam: 'beast', m: [1, 1.1, 0.9, 0.6, 1.3], hab: ['field', 'forest', 'snow', 'mountain'], acts: [['e_bite', 3], ['e_howl', 1]] },
  beast: { fam: 'beast', m: [1.9, 1.35, 1.2, 0.9, 1.0], hab: ['field', 'mountain', 'snow', 'void'], acts: [['e_claw', 2], ['e_stomp', 1], ['e_roar', 1]], size: 2 },
  ogre: { fam: 'humanoid', m: [1.7, 1.4, 1.1, 0.5, 0.7], hab: ['mountain', 'cave', 'forest'], acts: [['e_smash', 2], ['e_tackle', 2], ['e_stomp', 1]], size: 2 },
  imp: { fam: 'demon', m: [0.7, 0.8, 0.8, 1.35, 1.3], hab: ['cave', 'temple', 'sky', 'void'], acts: [['e_claw', 1], ['$mag', 2], ['e_hex', 1]], traitAdd: ['fly'] },
  mimic: { fam: 'machine', m: [1.4, 1.5, 1.6, 1.0, 1.1], hab: ['cave', 'temple', 'sky'], acts: [['e_chomp', 3], ['e_doom', 1]], traitAdd: ['armor'] },
  cactus: { fam: 'plant', m: [0.6, 0.8, 0.8, 0.6, 1.7], hab: ['field', 'coast', 'mountain'], acts: [['e_needles', 2], ['e_dance', 1], ['e_tackle', 1]], traitAdd: ['evade'] },
  bomb: { fam: 'spirit', m: [0.8, 1.0, 0.8, 1.2, 1.0], hab: ['cave', 'mountain', 'sky'], acts: [['$mag', 3], ['e_selfdestruct', 1]], traitAdd: ['fly'] },
  eye: { fam: 'demon', m: [0.9, 0.7, 0.9, 1.3, 1.1], hab: ['cave', 'temple', 'sky', 'void'], acts: [['e_gaze', 1], ['$mag', 2], ['e_stopgaze', 1]], traitAdd: ['fly'] },
  mushroom: { fam: 'plant', m: [0.9, 0.8, 0.8, 1.1, 0.8], hab: ['forest', 'cave'], acts: [['e_spore', 1], ['e_spores2', 1], ['e_tackle', 2]] },
  insect: { fam: 'beast', m: [1.0, 1.1, 1.4, 0.6, 1.0], hab: ['forest', 'field', 'cave', 'coast'], acts: [['e_bite', 2], ['e_claw', 1]], traitAdd: ['armor'] },
  spider: { fam: 'beast', m: [0.9, 1.1, 0.9, 0.9, 1.3], hab: ['forest', 'cave', 'temple'], acts: [['e_bite', 2], ['e_web', 1], ['e_tailsting', 1]] },
  ghost: { fam: 'undead', m: [0.8, 0.6, 1.3, 1.3, 1.1], hab: ['temple', 'cave', 'void'], acts: [['$mag', 2], ['e_drain', 1], ['e_hex', 1]], traitAdd: ['fly', 'evade'], resistPhys: true },
  hydra: { fam: 'dragon', m: [2.2, 1.2, 1.1, 1.2, 0.8], hab: ['coast', 'temple', 'forest', 'void'], acts: [['e_multibite', 2], ['$big', 1], ['e_regen', 1]], size: 2 },
  octopus: { fam: 'aquatic', m: [1.5, 1.1, 0.9, 1.0, 0.9], hab: ['coast', 'temple'], acts: [['e_tentacle', 2], ['e_ink', 1], ['e_water', 1]], size: 2 },
  turtle: { fam: 'aquatic', m: [1.4, 1.0, 2.0, 0.8, 0.5], hab: ['coast', 'mountain', 'cave'], acts: [['e_tackle', 2], ['e_guard', 1], ['$mag', 1]], traitAdd: ['armor'] },
  frog: { fam: 'aquatic', m: [0.8, 0.9, 0.8, 1.0, 1.2], hab: ['field', 'forest', 'coast'], acts: [['e_tackle', 2], ['$mag', 1]], traitAdd: ['evade'] },
  rabbit: { fam: 'beast', m: [0.6, 0.9, 0.7, 0.6, 1.6], hab: ['field', 'snow', 'forest'], acts: [['e_bite', 3], ['e_dance', 1]], traitAdd: ['evade'] },
  gargoyle: { fam: 'demon', m: [1.3, 1.2, 1.5, 1.0, 1.0], hab: ['temple', 'sky', 'mountain', 'void'], acts: [['e_claw', 2], ['e_gust', 1], ['e_stopgaze', 1]], traitAdd: ['fly', 'armor'] },
  mummy: { fam: 'undead', m: [1.3, 1.1, 1.0, 0.8, 0.7], hab: ['temple', 'cave'], acts: [['e_smash', 2], ['e_hex', 1], ['e_doom', 1]] },
  elemental: { fam: 'spirit', m: [1.0, 0.8, 1.0, 1.4, 1.0], hab: ['cave', 'sky', 'temple', 'mountain', 'void', 'coast', 'snow'], acts: [['$mag', 3], ['$big', 1]], resistPhys: true },
  worm: { fam: 'beast', m: [1.8, 1.3, 1.0, 0.6, 0.8], hab: ['field', 'mountain', 'cave', 'coast'], acts: [['e_chomp', 1], ['e_tackle', 2], ['e_quake', 1]], size: 2 },
  bat: { fam: 'flying', m: [0.8, 1.0, 0.8, 0.8, 1.4], hab: ['cave', 'forest', 'temple'], acts: [['e_drain', 2], ['e_claw', 1]] },
  bird: { fam: 'flying', m: [1.0, 1.1, 0.9, 0.9, 1.4], hab: ['mountain', 'sky', 'coast', 'field'], acts: [['e_claw', 2], ['$mag', 1]] },
  skeleton: { fam: 'undead', m: [1.0, 1.1, 1.0, 0.8, 0.9], hab: ['cave', 'temple', 'void'], acts: [['e_smash', 2], ['e_tackle', 1]] },
  golem: { fam: 'machine', m: [2.0, 1.3, 1.7, 0.5, 0.5], hab: ['mountain', 'cave', 'sky'], acts: [['e_smash', 2], ['e_stomp', 1], ['e_guard', 1]], size: 2 },
  dragon: { fam: 'dragon', m: [3.0, 1.4, 1.3, 1.3, 1.0], hab: ['mountain', 'sky', 'void', 'snow'], acts: [['e_claw', 2], ['$big', 2], ['e_roar', 1]], size: 3 },
  goblin: { fam: 'humanoid', m: [1.0, 1.0, 1.0, 0.6, 1.0], hab: ['field', 'forest', 'cave', 'mountain'], acts: [['e_smash', 1], ['e_tackle', 2], ['e_steal', 1]] },
  plant: { fam: 'plant', m: [1.2, 0.9, 0.9, 1.2, 0.7], hab: ['forest', 'field', 'temple'], acts: [['e_spore', 1], ['e_roots', 1], ['e_tackle', 1]] },
  mage: { fam: 'humanoid', m: [0.9, 0.6, 0.8, 1.5, 1.0], hab: ['temple', 'cave', 'sky', 'void'], acts: [['$mag', 3], ['$big', 1]] },
  knight: { fam: 'undead', m: [1.5, 1.3, 1.5, 0.9, 0.9], hab: ['temple', 'sky', 'void'], acts: [['e_smash', 2], ['e_sweep', 1], ['e_guard', 1]], traitAdd: ['armor'] },
  crab: { fam: 'aquatic', m: [1.1, 1.1, 1.5, 0.6, 0.8], hab: ['coast'], acts: [['e_claw', 2], ['e_guard', 1]] },
  fish: { fam: 'aquatic', m: [0.9, 1.0, 0.8, 0.9, 1.3], hab: ['coast', 'temple'], acts: [['e_bite', 2], ['e_water', 1]] },
  wisp: { fam: 'spirit', m: [0.7, 0.6, 1.2, 1.3, 1.2], hab: ['forest', 'temple', 'cave', 'void'], acts: [['$mag', 3]] },
  tree: { fam: 'plant', m: [2.4, 1.2, 1.1, 1.1, 0.5], hab: ['forest'], acts: [['e_roots', 2], ['e_smash', 1], ['e_regen', 1]], size: 3 },
  serpent: { fam: 'dragon', m: [2.4, 1.2, 1.1, 1.3, 1.0], hab: ['coast', 'temple'], acts: [['e_bite', 2], ['$big', 1]], size: 3 },
  mech: { fam: 'machine', m: [1.6, 1.2, 1.6, 1.1, 0.8], hab: ['sky', 'cave', 'void'], acts: [['e_smash', 1], ['e_laser', 1], ['e_guard', 1]], size: 2 },
};
// [id, name, kind, level, colours, element, extra]
const R_ = [
  // amorphs
  ['m_slime2', '綠凝膠', 'slime', 4, { body: '#6ad84a' }, 'earth'], ['m_slime3', '熔岩凝膠', 'slime', 13, { body: '#ff6a2a', eye: '#ffe04a' }, 'fire'], ['m_slime4', '冰晶凝膠', 'slime', 18, { body: '#bdf0ff' }, 'ice'],
  ['m_slime5', '劇毒凝膠', 'slime', 23, { body: '#a84ac8' }, 'dark'], ['m_slime6', '凝膠大王', 'slime', 28, { body: '#3a8ae8', crown: 1 }, 'water', { scale: 1.6, hpMul: 2.5 }], ['m_slime7', '黃金凝膠', 'slime', 32, { body: '#f0d040' }, 'light', { gilMul: 12 }],
  ['m_metal1', '秘銀凝膠', 'slime', 12, { body: '#c8d0e0', eye: '#2a2a3a' }, null, { metal: true }], ['m_metal2', '白金凝膠', 'slime', 30, { body: '#f0f0ff', eye: '#3a2a6a', crown: 1 }, null, { metal: true }],
  ['m_pud1', '布丁怪', 'pudding', 8, {}, 'water'], ['m_pud2', '焦糖布丁', 'pudding', 16, { body: '#e8b060', top: '#5a2a0a' }, 'fire'], ['m_pud3', '抹茶布丁', 'pudding', 24, { body: '#8ac86a', top: '#3a5a2a' }, 'wind'], ['m_pud4', '黑芝麻布丁', 'pudding', 36, { body: '#3a3a44', top: '#1a1a1a' }, 'dark'],
  // beasts
  ['m_wolf2', '雪原狼', 'wolf', 16, { body: '#e8eef8', belly: '#ffffff', eye: '#4a8aff' }, 'ice'], ['m_wolf3', '地獄犬', 'wolf', 28, { body: '#3a1a1a', belly: '#6a2a1a', mane: '#ff6a2a', eye: '#ffe04a' }, 'fire'], ['m_wolf4', '影狼', 'wolf', 40, { body: '#2a2a44', belly: '#4a4a6a', mane: '#8a6aff', eye: '#ff3a6a' }, 'dark'],
  ['m_rab1', '角兔', 'rabbit', 2, { horn: '#e8e0c8' }, null], ['m_rab2', '殺人兔', 'rabbit', 14, { body: '#d8a8a8', eye: '#ff2a2a', horn: '#fff' }, null], ['m_rab3', '月兔', 'rabbit', 26, { body: '#e8e0ff', eye: '#8a6aff' }, 'light'],
  ['m_bst1', '角獸', 'beast', 11, { body: '#8a6a4a', mane: '#5a3a2a' }, 'earth'], ['m_bst2', '奇美拉', 'beast', 24, { body: '#c8a040', mane: '#8a5a2a', wing: '#6a4a8a' }, 'fire'], ['m_bst3', '貝西摩斯', 'beast', 31, { body: '#6a4a8a', mane: '#3a2a5a', horn: '#f4e8c8', eye: '#ff3a3a' }, 'thunder'],
  ['m_bst4', '曼提柯爾', 'beast', 35, { body: '#c86a3a', mane: '#6a2a1a', wing: '#4a2a1a', tail: '#3a3a3a' }, 'dark'], ['m_bst5', '貝西摩斯王', 'beast', 47, { body: '#3a2a4a', mane: '#1a1a2a', horn: '#e8c050', eye: '#ffe04a' }, 'thunder', { scale: 1.3 }],
  ['m_ins1', '甲蟲', 'insect', 5, { body: '#3a5a8a', horn: 1 }, 'earth'], ['m_ins2', '鐵甲蟲', 'insect', 15, { body: '#8a8a9a', horn: 1 }, null], ['m_ins3', '毒蠍', 'insect', 21, { body: '#a8603a', stinger: '#e8e04a', pincer: 1 }, 'earth'],
  ['m_ins4', '巨顎蟲', 'insect', 33, { body: '#4a6a3a', pincer: 1, horn: 1 }, 'wind'], ['m_ins5', '帝王蠍', 'insect', 46, { body: '#2a2a3a', stinger: '#ff3a3a', pincer: 1 }, 'dark', { scale: 1.3 }],
  ['m_spi1', '洞穴蜘蛛', 'spider', 8, { body: '#4a3a3a' }, null], ['m_spi2', '毒蜘蛛', 'spider', 16, { body: '#4a6a3a', mark: '#e8e04a' }, 'dark'], ['m_spi3', '黑寡婦', 'spider', 28, { body: '#1a1a24', mark: '#ff2a2a' }, 'dark'], ['m_spi4', '蜘蛛女王', 'spider', 42, { body: '#5a2a6a', mark: '#e8c050', eye: '#ffe04a' }, 'dark', { scale: 1.4 }],
  ['m_worm1', '沙蟲', 'worm', 14, {}, 'earth'], ['m_worm2', '岩蟲', 'worm', 26, { body: '#8a8a8a' }, 'earth'], ['m_worm3', '巨大沙蟲', 'worm', 42, { body: '#a8603a' }, 'earth', { scale: 1.3 }],
  // humanoids and demons
  ['m_gob2', '哥布林獵人', 'goblin', 10, { body: '#5a9a3a', cloth: '#4a6a3a' }, null], ['m_gob3', '哥布林隊長', 'goblin', 16, { body: '#4a8a5a', cloth: '#8a2a2a', hat: '#8a8a9a' }, null], ['m_gob4', '哥布林王', 'goblin', 26, { body: '#3a7a3a', cloth: '#5a2a6a', hat: '#e8c050' }, null, { scale: 1.3 }],
  ['m_ogre1', '食人魔', 'ogre', 14, { body: '#c8a070' }, null], ['m_ogre2', '巨魔', 'ogre', 20, { body: '#6a8a6a', cloth: '#4a3a2a' }, 'earth'], ['m_ogre3', '牛頭人', 'ogre', 26, { body: '#8a4a2a', horn: '#e8e0c8', cloth: '#3a2a1a' }, 'fire'],
  ['m_ogre4', '獨眼巨人', 'ogre', 32, { body: '#8a8ab8', oneEye: 1, cloth: '#5a4a2a' }, 'thunder'], ['m_ogre5', '巨人王', 'ogre', 48, { body: '#6a5a8a', horn: '#e8c050', cloth: '#8a2a2a' }, 'earth', { scale: 1.3 }],
  ['m_imp1', '小惡魔', 'imp', 6, { body: '#c84a4a' }, 'fire'], ['m_imp2', '冰小鬼', 'imp', 12, { body: '#6ab8e8' }, 'ice'], ['m_imp3', '雷小鬼', 'imp', 18, { body: '#e8c84a' }, 'thunder'], ['m_imp4', '夢魔', 'imp', 28, { body: '#8a4ac8', wing: '#3a1a4a' }, 'dark'], ['m_imp5', '大惡魔', 'imp', 40, { body: '#3a1a2a', wing: '#8a1a2a', eye: '#ff3a3a' }, 'dark', { scale: 1.5 }],
  ['m_mage2', '黑魔導士', 'mage', 18, { body: '#2a2a5a', orb: '#ff6a3a' }, 'fire'], ['m_mage3', '白魔導士', 'mage', 18, { body: '#e8e4d8', trim: '#c84a4a', orb: '#8affb0' }, 'light', { healer: true }], ['m_mage4', '大魔導士', 'mage', 36, { body: '#5a1a5a', trim: '#e8c050', orb: '#c8a0ff' }, 'dark'],
  ['m_garg1', '石像鬼', 'gargoyle', 20, {}, 'earth'], ['m_garg2', '黑曜石像鬼', 'gargoyle', 34, { body: '#3a3a4a' }, 'dark'], ['m_garg3', '魔像鬼王', 'gargoyle', 46, { body: '#6a4a3a', eye: '#ffe04a' }, 'fire', { scale: 1.3 }],
  ['m_eye1', '邪眼', 'eye', 13, {}, 'dark'], ['m_eye2', '魔眼', 'eye', 24, { body: '#6a6ab8', wing: '#3a3a6a', iris: '#ffe04a' }, 'thunder'], ['m_eye3', '千里眼', 'eye', 35, { body: '#3a8a6a', wing: '#1a4a3a', iris: '#ff3aa8' }, 'wind'], ['m_eye4', '混沌之眼', 'eye', 48, { body: '#2a1a2a', wing: '#6a1a3a', iris: '#ff2a2a' }, 'dark', { scale: 1.4 }],
  // undead
  ['m_ghost1', '幽靈', 'ghost', 10, {}, 'dark'], ['m_ghost2', '怨靈', 'ghost', 18, { body: '#a8c8e8' }, 'ice'], ['m_ghost3', '女妖', 'ghost', 26, { body: '#e8a8d8' }, 'dark'], ['m_ghost4', '亡靈之主', 'ghost', 40, { body: '#b8a8ff', crown: 1 }, 'dark', { scale: 1.4 }],
  ['m_mum1', '木乃伊', 'mummy', 12, {}, 'dark'], ['m_mum2', '王族木乃伊', 'mummy', 24, { body: '#c8b890', eye: '#ff3a3a' }, 'dark'], ['m_mum3', '法老', 'mummy', 38, { body: '#e8dcb8', crown: 1 }, 'light'],
  ['m_skel2', '骷髏法師', 'skeleton', 20, { robe: '#3a2a5a', eye: '#c84aff' }, 'dark'], ['m_skel3', '骷髏劍士', 'skeleton', 30, { armor: '#6a6a7a' }, null], ['m_skel4', '骸骨將軍', 'skeleton', 44, { armor: '#8a6a2a', eye: '#ffe04a' }, 'dark', { scale: 1.3 }],
  ['m_kn1', '活鎧甲', 'knight', 20, { body: '#7a7a8a', trim: '#c8c8d8' }, null], ['m_kn2', '暗黑騎士', 'knight', 34, { body: '#2a2a3a', trim: '#8a2a2a', cape: '#3a1a2a' }, 'dark'], ['m_kn3', '死亡騎士', 'knight', 48, { body: '#3a2a4a', trim: '#c8a0ff', cape: '#1a1a2a', weapon: 'spear' }, 'dark', { scale: 1.2 }],
  // plants and fungi
  ['m_mush1', '毒菇', 'mushroom', 4, {}, null], ['m_mush2', '睡眠菇', 'mushroom', 10, { body: '#6a6ad8' }, null], ['m_mush3', '狂笑菇', 'mushroom', 17, { body: '#e8c84a', spot: '#ff6a2a' }, null, { acts: [['e_laughgas', 2], ['e_tackle', 1]] }], ['m_mush4', '魔菇王', 'mushroom', 30, { body: '#8a2a6a' }, 'dark', { scale: 1.5 }],
  ['m_cac1', '仙人掌兵', 'cactus', 9, {}, 'earth'], ['m_cac2', '沙漠舞者', 'cactus', 20, { body: '#8ad86a', flower: '#ff6a8a' }, 'earth'], ['m_cac3', '刺球王', 'cactus', 38, { body: '#3a8a3a', flower: '#e8c050' }, 'earth', { scale: 1.4 }],
  ['m_pl2', '臭氣花', 'plant', 20, { body: '#8a5a3a', leaf: '#5a6a2a', spot: '#c8e04a' }, 'dark', { acts: [['e_badbreath', 2], ['e_roots', 1]] }], ['m_pl3', '食人花', 'plant', 28, { body: '#d83a3a', leaf: '#2a6a2a' }, 'earth'], ['m_pl4', '魔界花', 'plant', 44, { body: '#4a1a5a', leaf: '#1a3a2a', spot: '#ff3a8a' }, 'dark', { acts: [['e_badbreath', 2], ['e_drain', 1], ['e_roots', 1]] }],
  ['m_tree2', '古樹守衛', 'tree', 34, { leaf: '#2a6a3a', body: '#5a3a2a', eye: '#8affb0' }, 'earth'],
  // sea
  ['m_frog1', '青蛙兵', 'frog', 3, {}, 'water'], ['m_frog2', '毒蛙', 'frog', 9, { body: '#8a4ac8', belly: '#e8a0e8' }, 'dark'], ['m_frog3', '雷蛙', 'frog', 19, { body: '#e8c84a', belly: '#fff0a0' }, 'thunder'], ['m_frog4', '蛙王', 'frog', 30, { body: '#3a8a5a', crown: 1 }, 'water', { scale: 1.5 }],
  ['m_tur1', '刺甲龜', 'turtle', 12, { spike: '#e8e0c8' }, 'water'], ['m_tur2', '岩甲龜', 'turtle', 24, { body: '#8a8a7a', shell: '#5a5a5a' }, 'earth'], ['m_tur3', '熔岩龜', 'turtle', 36, { body: '#8a3a2a', shell: '#3a2a2a', spike: '#ff6a2a' }, 'fire'], ['m_tur4', '大地巨龜', 'turtle', 50, { body: '#5a6a3a', shell: '#4a3a2a', spike: '#e8c050' }, 'earth', { scale: 1.5 }],
  ['m_oct1', '大章魚', 'octopus', 16, {}, 'water'], ['m_oct2', '海妖', 'octopus', 32, { body: '#4a6ab8' }, 'water', { scale: 1.3 }], ['m_oct3', '深淵觸手', 'octopus', 48, { body: '#3a1a4a' }, 'dark', { scale: 1.5 }],
  ['m_crab2', '巨鉗蟹', 'crab', 22, { body: '#c84a3a' }, 'water'], ['m_crab3', '寶石蟹', 'crab', 34, { body: '#4ac8c8' }, 'ice', { gilMul: 4 }],
  ['m_fish2', '劍魚', 'fish', 22, { body: '#4a7ab8', fin: '#c8d8e8' }, 'water'], ['m_fish3', '深海魚', 'fish', 34, { body: '#2a2a5a', fin: '#ff6aa8' }, 'dark'],
  ['m_hyd1', '雙頭蛇', 'hydra', 18, { body: '#4a8a5a', heads: 2 }, 'earth'], ['m_hyd2', '三頭龍', 'hydra', 30, { body: '#8a3a3a', heads: 3 }, 'fire'], ['m_hyd3', '九頭蛇', 'hydra', 46, { body: '#3a5a8a', heads: 5 }, 'water', { scale: 1.3 }],
  // sky and fire
  ['m_bat2', '吸血大蝙蝠', 'bat', 18, { body: '#3a1a3a', eye: '#ff2a2a' }, 'dark'], ['m_bat3', '夜魔蝠', 'bat', 32, { body: '#1a1a3a', wing: '#4a1a5a', eye: '#ffe04a' }, 'dark'],
  ['m_bird2', '雷鳥', 'bird', 20, { body: '#e8d84a', wing: '#4a6ae0', crest: '#fff' }, 'thunder'], ['m_bird3', '火鳥', 'bird', 34, { body: '#ff6a2a', wing: '#c82a1a', crest: '#ffe04a' }, 'fire'], ['m_bird4', '不死鳥', 'bird', 50, { body: '#ffd04a', wing: '#ff6a2a', crest: '#fff' }, 'fire', { scale: 1.5, acts: [['e_inferno', 2], ['e_claw', 1], ['e_regen', 1]] }],
  ['m_bomb1', '炸彈火球', 'bomb', 11, {}, 'fire'], ['m_bomb2', '冰爆球', 'bomb', 19, { body: '#8ad8ff', flame: '#e8f8ff' }, 'ice'], ['m_bomb3', '雷爆球', 'bomb', 27, { body: '#e8c84a', flame: '#fff8a0' }, 'thunder'], ['m_bomb4', '大炸彈', 'bomb', 40, { body: '#c83a2a', flame: '#ff8a3a' }, 'fire', { scale: 1.6 }],
  ['m_el1', '火之精靈', 'elemental', 16, { body: '#ff6a2a' }, 'fire'], ['m_el2', '水之精靈', 'elemental', 16, { body: '#4aa8ff' }, 'water'], ['m_el3', '風之精靈', 'elemental', 17, { body: '#8affb0' }, 'wind'], ['m_el4', '土之精靈', 'elemental', 17, { body: '#a88a5a', rock: '#6a5a3a' }, 'earth'],
  ['m_el5', '炎魔', 'elemental', 34, { body: '#c82a1a' }, 'fire', { scale: 1.4 }], ['m_el6', '冰魔', 'elemental', 34, { body: '#bdf0ff' }, 'ice', { scale: 1.4 }], ['m_el7', '雷魔', 'elemental', 36, { body: '#ffe04a' }, 'thunder', { scale: 1.4 }], ['m_el8', '岩魔', 'elemental', 36, { body: '#7a6a5a', rock: '#4a3a2a' }, 'earth', { scale: 1.4 }],
  ['m_el9', '光之精靈', 'elemental', 28, { body: '#fff4b0' }, 'light'], ['m_el10', '闇之精靈', 'elemental', 28, { body: '#6a3aa8' }, 'dark'],
  ['m_wisp2', '冥火', 'wisp', 22, { body: '#c84aff' }, 'dark'], ['m_wisp3', '聖火', 'wisp', 30, { body: '#fff4b0' }, 'light'],
  ['m_mim1', '擬態寶箱', 'mimic', 10, {}, null], ['m_mim2', '貪婪寶箱', 'mimic', 22, { body: '#5a3a5a', metal: '#c8c8d8' }, 'dark'], ['m_mim3', '黃金寶箱怪', 'mimic', 36, { body: '#c89a2a', metal: '#fff4b0' }, 'light', { gilMul: 6 }], ['m_mim4', '潘朵拉之箱', 'mimic', 50, { body: '#2a1a3a', metal: '#ff3a8a' }, 'dark', { scale: 1.4 }],
  // machines and dragons
  ['m_gol2', '鐵巨人', 'golem', 28, { body: '#8a8a9a', eye: '#ff4a3a' }, null], ['m_gol3', '秘銀魔像', 'golem', 38, { body: '#c8d8e8', eye: '#4affff', core: '#8ae0ff' }, 'thunder'], ['m_gol4', '精金魔像', 'golem', 52, { body: '#e8c050', eye: '#ff3a3a', core: '#ff6a2a' }, 'fire'],
  ['m_mech2', '殺人機器', 'mech', 30, { body: '#5a6a5a', eye: '#ff3a3a' }, 'thunder'], ['m_mech3', '戰爭機甲', 'mech', 44, { body: '#3a3a4a', eye: '#ffe04a' }, 'thunder'],
  ['m_drg1', '綠龍', 'dragon', 22, { body: '#4a9a4a', belly: '#e8e0a0' }, 'wind', { scale: 0.75 }], ['m_drg2', '紅龍', 'dragon', 32, { body: '#c83a2a', belly: '#ffd08a' }, 'fire', { scale: 0.8 }], ['m_drg3', '冰龍', 'dragon', 38, { body: '#a8d8f0', belly: '#ffffff', wing: '#6a9ac8' }, 'ice', { scale: 0.8 }],
  ['m_drg4', '黑龍', 'dragon', 46, { body: '#2a2a3a', belly: '#6a4a6a', eye: '#ff2a2a' }, 'dark', { scale: 0.85 }], ['m_drg5', '白金龍', 'dragon', 55, { body: '#e8e8f8', belly: '#e8c050', wing: '#c8c8e8', eye: '#4a8aff' }, 'light', { scale: 0.9 }], ['m_drg6', '骨龍', 'dragon', 42, { body: '#d8d0b8', belly: '#a89a7a', eye: '#c84aff' }, 'dark', { scale: 0.8, fam: 'undead' }],
  ['m_ser2', '海龍', 'serpent', 40, { body: '#2a5a8a', belly: '#c8e8ff', fin: '#8ae0ff' }, 'water', { scale: 0.8 }],
  // ---- trait-built monsters: each asks for a different answer
  ['m_x1', '影蝠', 'bat', 9, { body: '#2a2a3a', eye: '#8affff' }, 'dark', { traits: ['fly', 'stealth'] }], ['m_x2', '荊棘藤', 'plant', 10, { body: '#4a7a2a' }, 'earth', { traits: ['thorns'] }],
  ['m_x3', '再生史萊姆', 'slime', 8, { body: '#6ad86a' }, 'water', { traits: ['regen'] }], ['m_x4', '骸骨兵', 'skeleton', 12, { body: '#e8e0c8' }, null, { traits: ['armor', 'undying'] }],
  ['m_x5', '狼群頭目', 'wolf', 14, { body: '#5a5a6a' }, null, { traits: ['swarm', 'aura'] }], ['m_x6', '哥布林薩滿', 'goblin', 13, { body: '#6a8a3a' }, 'fire', { traits: ['summoner'], healer: true }],
  ['m_x7', '自爆蟲', 'insect', 15, { body: '#c84a2a' }, 'fire', { traits: ['burst'] }], ['m_x8', '鏡之魔眼', 'eye', 18, { body: '#c8d8f0' }, 'light', { traits: ['fly', 'reflect'] }],
  ['m_x9', '亡靈騎士', 'knight', 22, { body: '#3a3a4a' }, 'dark', { traits: ['armor', 'undying', 'curse'] }], ['m_x10', '幽冥燈', 'wisp', 16, { body: '#8a6aff' }, 'dark', { traits: ['ghost'] }],
  ['m_x11', '熔岩布丁', 'pudding', 20, { body: '#e86a2a' }, 'fire', { traits: ['absorb', 'regen'] }], ['m_x12', '狂暴熊', 'beast', 21, { body: '#6a4a2a' }, null, { traits: ['enrage'] }],
  ['m_x13', '魔導兵器', 'mech', 26, { body: '#4a5a7a', eye: '#4affff' }, 'thunder', { traits: ['armor', 'mimmune', 'burst'] }], ['m_x14', '九頭蛇', 'hydra', 30, { body: '#3a6a5a' }, 'water', { traits: ['regen', 'enrage'] }],
  ['m_x15', '殭屍術士', 'mummy', 24, { body: '#a89a7a' }, 'dark', { traits: ['summoner', 'curse'] }], ['m_x16', '幻影刺客', 'mage', 25, { body: '#2a2a3a' }, 'dark', { traits: ['stealth', 'enrage'] }],
  ['m_x17', '水晶魔像', 'golem', 32, { body: '#bfe8ff', core: '#8ae0ff' }, 'ice', { traits: ['armor', 'reflect'] }], ['m_x18', '惡魔軍師', 'imp', 28, { body: '#8a2a4a' }, 'dark', { traits: ['fly', 'aura', 'summoner'] }],
  ['m_x19', '冰霜亡靈', 'ghost', 30, { body: '#c8e8ff' }, 'ice', { traits: ['fly', 'ghost', 'stealth'] }], ['m_x20', '雷霆鳥王', 'bird', 34, { body: '#ffe04a', wing: '#2a2a6a' }, 'thunder', { traits: ['fly', 'enrage', 'swarm'] }],
  ['m_x21', '荊棘巨木', 'tree', 36, { body: '#4a3a2a' }, 'earth', { traits: ['thorns', 'regen'] }], ['m_x22', '炸彈王', 'bomb', 38, { body: '#ff3a2a' }, 'fire', { traits: ['fly', 'burst', 'summoner'], scale: 1.5 }],
  ['m_x23', '黑曜石像鬼', 'gargoyle', 40, { body: '#2a2a3a' }, 'dark', { traits: ['fly', 'armor', 'reflect'] }], ['m_x24', '吸血伯爵', 'mage', 42, { body: '#4a1a2a' }, 'dark', { traits: ['undying', 'aura'], healer: true, fam: 'undead' }],
  ['m_x25', '深淵章魚', 'octopus', 44, { body: '#3a2a6a' }, 'water', { traits: ['absorb', 'summoner'] }], ['m_x26', '虛空蜘蛛', 'spider', 46, { body: '#2a1a3a' }, 'dark', { traits: ['stealth', 'curse'] }],
  ['m_x27', '古代機神', 'mech', 50, { body: '#c8a050' }, 'thunder', { traits: ['armor', 'mimmune', 'enrage', 'burst'], scale: 1.3 }], ['m_x28', '不死鳥雛', 'bird', 26, { body: '#ffb04a' }, 'fire', { traits: ['fly', 'undying', 'absorb'] }],
  ['m_x29', '腐沼蛙', 'frog', 17, { body: '#5a7a3a' }, 'water', { traits: ['curse', 'swarm'] }], ['m_x30', '影狐', 'wolf', 19, { body: '#3a3a5a' }, 'dark', { traits: ['stealth', 'evade'] }],
  ['m_x31', '聖騎魔像', 'golem', 44, { body: '#e8e0c8' }, 'light', { traits: ['armor', 'aura'] }], ['m_x32', '星之精', 'elemental', 38, { body: '#d8b0ff' }, 'light', { traits: ['reflect', 'regen'] }],
];
export const BESTIARY_NEW = [];
for (const [id, name, kind, lv, colors, el, ex = {}] of R_) {
  const k = K[kind], [mh, ma, md, mm, ms] = k.m;
  const hp = Math.round((22 + 12 * lv + 0.45 * lv * lv) * mh * (ex.hpMul || 1) * (ex.metal ? 0 : 1)) || 0;
  const E = {
    name, kind, colors, lv, hp: ex.metal ? 6 + Math.floor(lv / 6) : hp,
    atk: Math.round((12 + 2.0 * lv) * ma), def: ex.metal ? 999 : Math.round((5 + 1.0 * lv) * md), mag: Math.round((10 + 1.8 * lv) * mm), spr: ex.metal ? 999 : Math.round((5 + 0.9 * lv) * (k.resistPhys ? 1.3 : 1)), spd: Math.round((8 + 0.45 * lv) * ms * (ex.metal ? 2 : 1)),
    shield: ex.metal ? 1 : 2 + Math.floor(lv / 12) + (k.size || 1) - 1,
    weak: [], resist: [], exp: Math.max(4, Math.round(2.2 * Math.pow(lv, 1.25) * (k.size || 1) * (ex.metal ? 30 : 1))), gil: Math.round((2 * Math.pow(lv, 1.2) + 5) * (ex.gilMul || 1)),
    drops: [], hab: k.hab, fam: ex.fam || k.fam, traits: [...new Set([...(k.traitAdd || []), ...(ex.traits || [])])], fixedTraits: !!ex.traits, el, wild: true, scale: ex.scale,
  };
  if (ex.metal) { E.metal = true; E.traits.push('evade'); E.acts = [['e_metalflee', 2], ['e_tackle', 1], ['e_fire', 1]]; }
  else {
    const mag = el ? EL_MAG[el] : 'e_dark', big = el ? EL_BIG[el] : 'e_darkwave';
    E.acts = (ex.acts || k.acts).map(([s, w]) => [s === '$mag' ? mag : s === '$big' ? (lv >= 20 ? big : mag) : s, w]);
    if (ex.healer) E.acts.push(['e_heal2', 2]);
    if (lv >= 30 && !E.acts.some(a => a[0] === big)) E.acts.push([big, 1]);
  }
  // weaknesses: the opposing element plus a weapon; resists its own element
  if (el) { E.weak.push(EL_OPP[el]); E.resist.push(el); }
  if (!el || lv % 3 === 0) E.weak.push(['fire', 'thunder', 'light', 'wind'][lv % 4]);
  E.weak.push(['sword', 'spear', 'axe', 'dagger', 'bow', 'staff'][(lv + kind.length) % 6]);
  if (k.resistPhys) E.resist.push('sword', 'dagger');
  E.weak = [...new Set(E.weak.filter(w => !E.resist.includes(w)))];
  ENEMIES[id] = E; BESTIARY_NEW.push(id);
}
