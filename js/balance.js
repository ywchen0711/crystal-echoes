// How hard the enemies hit and how long they last, measured rather than guessed: each story boss was auto-battled
// (the real battle engine, animations skipped) at the level and shop gear a player has when they get there, and its
// HP and damage were moved until the fight takes about 6–9 rounds and pushes the party down to 30–50% HP at its worst
// moment. Regular monsters: 2–3 rounds and a scratch. [hp ×, damage ×] on top of the numbers in data.js.
export const BAL = {
  ashhound: [1.6, 2.7], bigfang: [2.6, 2.9], rottree: [3.3, 2.9], leo_trial: [5.3, 4.4], irongolem: [4.2, 4.0],
  tia: [3.2, 3.1], fox_trial: [5.1, 7.5], kingcrab: [1.9, 4.0], serene: [3.5, 3.2], leviath: [2.2, 2.4], vahl: [2.8, 3.2],
  hawk_trial: [2.6, 5.0], saren: [2.4, 3.4], whale_trial: [2.4, 3.6], silent: [2.7, 3.3], silence: [2.7, 3.3],
  goldslime: [1, 1], elderdragon: [1, 1], machina: [1, 1], abyss: [1, 1],
};
export const MOB = [1.4, 2.4];       // every regular monster, the generated bestiary too
export const BOSS = [2.5, 3.0];      // bosses not measured one by one (arena, seals, generated)
// difficulty: the measured line assumes a well-equipped party with four echoes; normal sits a little under it so a
// party that skipped the optional shrines still gets through, easy keeps most of the old softness, hard goes past it
export const DIFF = { easy: { name: '輕鬆', k: 0.3, hp: 1, dmg: 1 }, normal: { name: '普通', k: 0.8, hp: 0.9, dmg: 0.9 }, hard: { name: '困難', k: 1, hp: 1.2, dmg: 1.15 } };
export const DIFF_ORDER = ['easy', 'normal', 'hard'];
export function balanceFor(id, E, diff = 'normal') {
  const b = BAL[id] || (E.boss ? BOSS : MOB), D = DIFF[diff] || DIFF.normal;
  return [(1 + (b[0] - 1) * D.k) * D.hp, (1 + (b[1] - 1) * D.k) * D.dmg];
}
