// Every place in the game, painted with a tiny grid painter, plus the look of each area.

// ---------------------------------------------------------------- painter
class G {
  constructor(w, h, fill = '.') { this.w = w; this.hh = h; this.g = Array.from({ length: h }, () => Array(w).fill(fill)); this.hg = Array.from({ length: h }, () => Array(w).fill('0')); }
  set(x, z, ch) { if (x >= 0 && z >= 0 && x < this.w && z < this.hh) this.g[z][x] = ch; return this; }
  get(x, z) { return this.g[z]?.[x]; }
  rect(x0, z0, x1, z1, ch) { for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) this.set(x, z, ch); return this; }
  h(x0, z0, x1, z1, lv) { for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if (this.hg[z] && x >= 0 && x < this.w) this.hg[z][x] = String(lv); return this; }
  ell(cx, cz, rx, rz, ch, only) { for (let z = Math.floor(cz - rz); z <= cz + rz; z++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x - cx) / rx, dz = (z - cz) / rz; if (dx * dx + dz * dz <= 1 && (!only || only.includes(this.get(x, z)))) this.set(x, z, ch); } return this; }
  eh(cx, cz, rx, rz, lv) { for (let z = Math.floor(cz - rz); z <= cz + rz; z++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x - cx) / rx, dz = (z - cz) / rz; if (dx * dx + dz * dz <= 1) this.h(x, z, x, z, lv); } return this; }
  path(pts, ch, wdt = 1, only) {
    for (let k = 0; k < pts.length - 1; k++) {
      const [x0, z0] = pts[k], [x1, z1] = pts[k + 1], n = Math.max(Math.abs(x1 - x0), Math.abs(z1 - z0)) || 1;
      for (let i = 0; i <= n; i++) { const x = Math.round(x0 + (x1 - x0) * i / n), z = Math.round(z0 + (z1 - z0) * i / n); for (let a = 0; a < wdt; a++) for (let b = 0; b < wdt; b++) { const xx = x + a - (wdt >> 1), zz = z + b - (wdt >> 1); if (!only || only.includes(this.get(xx, zz))) this.set(xx, zz, ch); } }
    }
    return this;
  }
  scatter(x0, z0, x1, z1, ch, p, on, seed = 1) { let s = seed * 9301 + 49297; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if (r() < p && (!on || on.includes(this.get(x, z)))) this.set(x, z, ch); return this; }
  done() { return { grid: this.g.map(r => r.join('')), heights: this.hg.map(r => r.join('')) }; }
}

// ---------------------------------------------------------------- looks
export const THEMES = {
  port: { tiles: { main: ['cobble', '#cdbb9a'], second: ['grass', '#5c9a44'], third: ['dirt', '#7a6a5a'], fourth: ['brick', '#b8aa94'], wood: ['wood', '#9a6a3c'], grass: ['grass', '#5c9a44'], temple: ['temple', '#d8d0c0'] }, wall: ['stonewall', '#aaa294'], roof: '#3a74b8', sky: ['#6aa0e8', '#f4e4c8'], light: 'day', water: '#3a7ab8', motes: '#fff2c0', bgm: 'town', fog: ['#c8d8e8', 30, 70] },
  portNight: { tiles: { main: ['cobble', '#b8a88a'], second: ['grass', '#4a8a3a'], third: ['dirt', '#5a4a3a'], wood: ['wood', '#8a5a30'], temple: ['temple', '#c8c0b0'] }, wall: ['stonewall', '#8a8478'], roof: '#2a5aa0', sky: ['#1a2050', '#5a4a7a'], light: 'night', night: true, water: '#1a3a6a', waterDeep: '#0a1a3a', motes: '#ffe8a0', bgm: 'night', fog: ['#1a2040', 20, 60] },
  interior: { tiles: { main: ['wood', '#9a6a3c'], second: ['carpet', '#8a2a3a'], temple: ['temple', '#d8d0c0'] }, wall: ['plaster', '#e8dcc0', '#6a4428'], cap: ['wood', '#5a3a24'], wallH: 2.6, sky: ['#1a1410', '#1a1410'], light: 'interior', night: true, bgm: null, edgeDrop: -0.5, fog: ['#100c08', 14, 40] },
  sanctum: { tiles: { main: ['temple', '#d8d8e8'], second: ['carpet', '#3a4a8a'] }, wall: ['temple', '#b8bcd8'], cap: ['temple', '#9a9ec0'], wallH: 3.2, sky: ['#0a0a1a', '#1a1a3a'], light: 'sanctum', night: true, bgm: 'sanctum', edgeDrop: -0.5, motes: '#ffe8a0', fog: ['#0a0a20', 14, 40] },
  field: { tiles: { main: ['grass', '#62a046'], second: ['dirt', '#b08a5a'], third: ['dirt', '#7a6a50'], sand: ['sand', '#e2cc94'], snow: ['snow', '#eef2f8'], grass: ['grass', '#62a046'], cobble: ['cobble', '#c8b89a'] }, wall: ['stonewall', '#8a8a72'], cap: ['grass', '#4e8a3c'], cliffTile: 'main', wallH: 1.6, sky: ['#5a96e8', '#f0e8d0'], light: 'day', water: '#3a78c0', tree: 'tree', bgm: 'world', motes: '#fff8d0', fog: ['#d8e4f0', 40, 110], edgeDrop: -1 },
  forest: { tiles: { main: ['grass', '#4a8038'], second: ['dirt', '#8a6a44'], third: ['dirt', '#5a4a38'], grass: ['grass', '#3e7030'] }, wall: ['stonewall', '#6a6a58'], cap: ['grass', '#3a6a2a'], wallH: 1.6, sky: ['#3a6a5a', '#a8c8a0'], light: 'forest', water: '#2a6a7a', waterDeep: '#0a2a2a', tree: 'tree', treeColors: { leaf: '#3a7a3a' }, bushColor: '#3a7a34', bgm: 'forest', motes: '#d8ffa0', fireflies: true, fog: ['#5a7a5a', 16, 50] },
  mountain: { tiles: { main: ['dirt', '#a8865a'], second: ['dirt', '#8a6a48'], third: ['dirt', '#6a5a48'], grass: ['grass', '#7a9a4a'] }, wall: ['stonewall', '#9a8a74'], cap: ['dirt', '#8a7a5a'], wallH: 2, sky: ['#6a9ae0', '#f0e0c8'], light: 'day', tree: 'pine', bgm: 'world', fog: ['#e0d8c8', 30, 80] },
  anvil: { tiles: { main: ['cobble', '#a89a88'], second: ['metal', '#6a7480'], third: ['dirt', '#5a4a3a'], wood: ['wood', '#7a4a28'], brick: ['brick', '#a86a4a'] }, wall: ['brick', '#8a5a44'], roof: '#b84a3a', houseWall: ['brick', '#b07a5a'], sky: ['#e89a6a', '#f4d8b0'], light: 'dusk', water: '#3a6a8a', bgm: 'anvil', motes: '#ffc890', fog: ['#e8b890', 24, 70] },
  mine: { tiles: { main: ['cave', '#6a5e70'], second: ['dirt', '#5a4a3a'], third: ['cave', '#3a3440'], metal: ['metal', '#5a6470'], wood: ['wood', '#6a4428'] }, wall: ['cave', '#4a4250'], cap: ['cave', '#3a3440'], wallH: 3, sky: ['#0a080c', '#1a1418'], light: 'cave', night: true, water: '#2a5a7a', bgm: 'dungeon', motes: '#8affb0', fog: ['#0c0a10', 10, 34], pillar: ['cave', '#5a5262'] },
  coast: { tiles: { main: ['sand', '#e8d4a0'], second: ['grass', '#6aa64a'], third: ['dirt', '#9a8a6a'] }, wall: ['stonewall', '#a89a84'], cap: ['grass', '#5a9a40'], wallH: 1.4, sky: ['#5aa8f0', '#f4ecd8'], light: 'day', tree: 'palm', water: '#2a8ac8', bgm: 'world', fog: ['#e0f0f8', 30, 90] },
  azurelle: { tiles: { main: ['temple', '#e4e0d4'], second: ['grass', '#5aa048'], third: ['dirt', '#6a7a8a'], cobble: ['cobble', '#d8d0c0'], wood: ['wood', '#a87a48'] }, wall: ['temple', '#c8ccd0'], roof: '#2a8a8a', houseWall: ['plaster', '#f4f0e8', '#4a7a8a'], sky: ['#58a0f0', '#f0f4f8'], light: 'day', water: '#2a8ad0', waterDeep: '#0a3a7a', bgm: 'azurelle', motes: '#e8f8ff', fog: ['#d8e8f4', 30, 80], rail: '#d8d8d0' },
  temple: { tiles: { main: ['temple', '#7a9aa8'], second: ['temple', '#5a7a88'], third: ['cave', '#2a3a48'], crystal: ['crystal', '#4ac8f0'] }, wall: ['temple', '#5a7080'], cap: ['temple', '#4a6070'], wallH: 3, sky: ['#04101a', '#0a2030'], light: 'deep', night: true, water: '#1a6a9a', waterDeep: '#04203a', bgm: 'dungeon2', motes: '#8ae8ff', fog: ['#061826', 12, 40], pillar: ['temple', '#8aa8b8'] },
  sky: { tiles: { main: ['temple', '#e8e4f4'], second: ['cloud', '#f4f0ff'], third: ['crystal', '#a88ae8'], grass: ['grass', '#8ac86a'] }, wall: ['temple', '#c8c0e0'], cap: ['temple', '#d8d0f0'], wallH: 2, sky: ['#3a5ad8', '#f8d8f0'], light: 'sky', water: '#6a8ae8', bgm: 'sky', motes: '#ffffff', fog: ['#e8d8f8', 30, 90], edgeDrop: -8, clouds: true, pillar: ['temple', '#f0ecf8'] },
  skyDark: { tiles: { main: ['temple', '#6a5a8a'], second: ['crystal', '#5a3a8a'], third: ['cave', '#2a1a3a'] }, wall: ['temple', '#4a3a6a'], cap: ['temple', '#3a2a5a'], wallH: 2, sky: ['#0a0418', '#4a1a4a'], light: 'void', night: true, bgm: 'last', motes: '#c8a0ff', fog: ['#1a0a2a', 20, 70], edgeDrop: -8, clouds: true, pillar: ['temple', '#7a6a9a'] },
};

// people's looks used by NPCs
export const LOOKS = {
  fisher: { skin: 'tan', hair: '#e8e8e8', hairStyle: 'short', beard: '#e8e8e8', top: '#3a6a8a', legs: '#4a4a3a', boots: '#3a2a1a', hat: 'cap', hatColor: '#c84a3a' },
  girl: { skin: 'light', hair: '#e8c45a', hairStyle: 'bob', top: '#e87a8a', legs: '#f4e8d8', boots: '#a84a4a', robe: true },
  boy: { skin: 'light', hair: '#c8a04a', hairStyle: 'spiky', top: '#6aa84a', legs: '#5a4a3a', boots: '#4a3a2a' },
  merchant: { skin: 'light', hair: '#6a4a2a', hairStyle: 'short', top: '#c8a04a', top2: '#7a5a2a', legs: '#4a3a2a', boots: '#3a2a1a', beard: '#6a4a2a' },
  lady: { skin: 'pale', hair: '#8a3a2a', hairStyle: 'long', top: '#6a4a8a', legs: '#6a4a8a', boots: '#3a2a3a', robe: true },
  guard: { skin: 'light', hair: '#4a3a2a', hairStyle: 'short', top: '#4a5a8a', top2: '#c8ccd8', legs: '#3a3a4a', boots: '#2a2a3a', hat: 'helm', hatColor: '#9aa4b8', weapon: 'spear', pauldron: '#c8ccd8' },
  priest: { skin: 'light', hair: '#c8c8c8', hairStyle: 'bald', top: '#f4f0e4', top2: '#4a7ac8', legs: '#f4f0e4', boots: '#a87a4a', robe: true, beard: '#e8e8e8' },
  smith: { skin: 'tan', hair: '#3a2a20', hairStyle: 'bald', beard: '#3a2a20', top: '#6a4a3a', top2: '#3a3a3a', legs: '#3a3a3a', boots: '#2a2a2a', weapon: 'wrench' },
  innkeep: { skin: 'light', hair: '#c86a3a', hairStyle: 'bob', top: '#f4f0e4', top2: '#6a8a4a', legs: '#6a8a4a', boots: '#4a3a2a', robe: true },
  sailor: { skin: 'tan', hair: '#2a2a2a', hairStyle: 'short', top: '#f4f4f4', top2: '#3a5aa8', legs: '#3a5aa8', boots: '#2a2a2a', hat: 'band', hatColor: '#3a5aa8' },
  oldman: { skin: 'light', hair: '#d8d8d8', hairStyle: 'short', beard: '#d8d8d8', top: '#7a6a5a', legs: '#5a4a3a', boots: '#3a2a1a', weapon: 'staff' },
  oldwoman: { skin: 'light', hair: '#d8d8d8', hairStyle: 'bob', top: '#8a5a6a', legs: '#8a5a6a', boots: '#3a2a2a', robe: true },
  scholar: { skin: 'light', hair: '#3a3a5a', hairStyle: 'short', top: '#3a3a6a', top2: '#e8c050', legs: '#3a3a6a', boots: '#2a2a3a', robe: true, hat: 'cap', hatColor: '#2a2a4a' },
  engineer: { skin: 'tan', hair: '#5a3a2a', hairStyle: 'short', top: '#8a6a3a', top2: '#4a4a4a', legs: '#4a4a5a', boots: '#2a2a2a', hat: 'band', hatColor: '#3a3a3a' },
  noble: { skin: 'pale', hair: '#e8d8a8', hairStyle: 'long', top: '#2a8a8a', top2: '#f4f0e8', legs: '#f4f0e8', boots: '#4a7a8a', robe: true, collar: '#e8c050' },
  watchman: { skin: 'light', hair: '#2a4a5a', hairStyle: 'short', top: '#2a7a7a', top2: '#e8eef8', legs: '#2a3a48', boots: '#2a2a3a', hat: 'helm', hatColor: '#4a8a9a', weapon: 'spear' },
  cultist: { skin: '#9a8a9a', hair: '#1a1a1a', hairStyle: 'short', top: '#2a1a2a', top2: '#8a3a5a', legs: '#1a1a1a', boots: '#1a1a1a', hat: 'hood', hatColor: '#2a1a2a', robe: true },
  child2: { skin: 'tan', hair: '#2a2a2a', hairStyle: 'ponytail', top: '#4a8ac8', legs: '#f4e8d8', boots: '#4a3a2a', robe: true },
  mogu: null, // the little critters for hide and seek are drawn separately
};
const npc = (x, z, id, look, extra = {}) => ({ k: 'npc', x, z, id, look, ...extra });
const lamp = (x, z) => ({ k: 'lamp', x, z });
const chest = (x, z, id, item, extra = {}) => ({ k: 'chest', x, z, id, item, ...extra });
const warp = (x, z, w, d, to, tx, tz, dir = 'down', extra = {}) => ({ k: 'warp', x, z, w, d, to, tx, tz, dir, ...extra });
const ev = (x, z, w, d, id, extra = {}) => ({ k: 'event', x, z, w, d, id, ...extra });
const save = (x, z) => ({ k: 'crystal', x, z });

export const MAPS = {};

// ================================================================ 白帆港 Whitesail Port
{
  const g = new G(34, 28, '.');
  g.rect(0, 0, 33, 0, '#').rect(0, 0, 0, 27, '#').rect(33, 0, 33, 27, '#');
  g.rect(1, 1, 3, 20, ',');
  g.h(8, 0, 32, 7, 2);
  g.rect(5, 0, 7, 22, '~');
  g.rect(11, 8, 12, 8, '^').rect(27, 8, 28, 8, '^');
  g.rect(5, 12, 7, 12, '=').rect(5, 18, 7, 18, '=');
  g.rect(1, 21, 32, 22, 'w').rect(5, 21, 7, 22, '=');
  g.rect(1, 23, 32, 27, '~').rect(10, 23, 12, 26, 'w').rect(26, 23, 30, 26, 'w');
  g.rect(33, 14, 33, 16, '.');
  g.rect(14, 16, 21, 19, 'b');
  g.rect(18, 1, 21, 7, 'b');
  const m = g.done();
  MAPS.port = {
    name: '白帆港', theme: 'port', ...m, bgm: 'town', town: true,
    objs: [
      { k: 'house', x: 9, z: 1, w: 5, d: 3, dormers: [1.5], chimney: 4, door: 1 },
      { k: 'house', x: 16, z: 1, w: 8, d: 4, roof: '#c84a3a', wall: ['plaster', '#f4ece0', '#7a5a3a'], door: 4, sign: 'shop', h: 3, id: 'temple' },
      { k: 'house', x: 26, z: 1, w: 5, d: 3, dormers: [2], door: 2, chimney: 1 },
      { k: 'house', x: 14, z: 9, w: 6, d: 4, dormers: [1, 3.5], door: 5, sign: 'guild', id: 'guild' },
      { k: 'board', x: 14, z: 13, id: 'board_port' },
      { k: 'house', x: 24, z: 9, w: 5, d: 4, door: 2, sign: 'inn', id: 'inn', dormers: [1.8], chimney: 4 },
      { k: 'house', x: 9, z: 15, w: 4, d: 3, door: 1, sign: 'item', id: 'itemshop' },
      { k: 'house', x: 24, z: 16, w: 5, d: 3, door: 2, sign: 'weapon', id: 'weaponshop', roof: '#3a6aa8' },
      { k: 'house', x: 1, z: 2, w: 3, d: 2, door: 1, roof: '#4a84c0' },
      { k: 'house', x: 1, z: 9, w: 3, d: 3, door: 1, roof: '#4a84c0' },
      { k: 'house', x: 1, z: 15, w: 3, d: 2, door: 1, roof: '#3a6aa8' },
      { k: 'house', x: 27, z: 23, w: 3, d: 2, h: 5.5, roof: '#c84a3a', wall: ['plaster', '#f4f0e8', '#c84a3a'], door: 1, id: 'lighthouse', lamp: true },
      { k: 'fountain', x: 17, z: 17 },
      { k: 'ship', x: 1, z: 25, len: 7 },
      lamp(10, 9), lamp(22, 9), lamp(13, 14), lamp(22, 14), lamp(8, 20), lamp(30, 20), lamp(4, 13), lamp(15, 7), lamp(25, 7), lamp(29, 13), lamp(11, 22), lamp(26, 22), lamp(31, 15),
      { k: 'barrel', x: 23, z: 11 }, { k: 'barrel', x: 23, z: 12 }, { k: 'crate', x: 30, z: 12 }, { k: 'crate', x: 31, z: 12, s: 0.7 }, { k: 'barrel', x: 13, z: 21 }, { k: 'crate', x: 14, z: 21 }, { k: 'crate', x: 18, z: 22, s: 0.6 }, { k: 'barrel', x: 24, z: 22 }, { k: 'barrel', x: 31, z: 22 },
      { k: 'bush', x: 13, z: 12, flower: '#f4704a' }, { k: 'bush', x: 21, z: 12, flower: '#f4e46a' }, { k: 'bush', x: 8, z: 8, flower: '#f4704a' }, { k: 'tree', x: 2, z: 7 }, { k: 'tree', x: 2, z: 13 }, { k: 'tree', x: 31, z: 5 }, { k: 'tree', x: 9, z: 5 },
      { k: 'planter', x: 16, z: 5, w: 2, flower: '#f45a8a' }, { k: 'planter', x: 22, z: 5, w: 2, flower: '#f4e46a' },
      { k: 'stall', x: 9, z: 12, color: '#3a74b8', sign: 'item', goods: ['#e85a3a', '#f4c04a', '#4ac86a'] },
      { k: 'stall', x: 29, z: 19, color: '#c84a4a', sign: 'weapon', goods: ['#c8e8f8', '#8ab8e8', '#f4f0e4'] },
      { k: 'wallrail', x: 1, z: 20, len: 3 },
      { k: 'flowers', x: 12, z: 19 }, { k: 'flowers', x: 23, z: 19 }, { k: 'flowers', x: 2, z: 19 }, { k: 'flowers', x: 30, z: 3 },
      save(21, 20),
      warp(33, 14, 1, 3, 'world', 9, 34, 'right'),
      warp(19, 13, 1, 1, 'guild_in', 6, 7, 'up', { door: true }),
      warp(26, 13, 1, 1, 'inn_port', 6, 7, 'up', { door: true }),
      warp(28, 25, 1, 1, 'lighthouse', 6, 8, 'up', { door: true, cond: 'lighthouse_open' }),
      warp(20, 5, 1, 1, 'temple_port', 7, 8, 'up', { door: true }),
      npc(16, 20, 'port_fisher', 'fisher', { dir: 'down' }),
      npc(10, 11, 'port_itemshop', 'merchant', { dir: 'down', shop: 'port_items' }),
      npc(30, 18, 'port_weapon', 'smith', { dir: 'down', shop: 'port_gear' }),
      npc(2, 18, 'port_girl', 'girl', { dir: 'right', bubble: true }),
      npc(25, 14, 'port_guard', 'guard', { dir: 'down' }),
      npc(20, 3, 'port_oldwoman', 'oldwoman', { dir: 'down', wander: true }, ),
      npc(14, 20, 'port_sailor', 'sailor', { dir: 'down', wander: true }),
      npc(12, 7, 'port_boy', 'boy', { dir: 'down', wander: true }),
      npc(31, 16, 'port_jumprope', 'child2', { dir: 'left' }),
      npc(29, 3, 'port_collector', 'scholar', { dir: 'down' }),
      npc(18, 13, 'talo_stall', 'talo', { dir: 'down', hero: 'talo', cond: '!talo_joined' }),
      npc(15, 11 + 3, 'board_hint', null, { hidden: true }),
      ev(28, 23, 3, 3, 'lighthouse_gate', { cond: '!lighthouse_open' }),
      { k: 'tablet', x: 2, z: 1, id: 'tab_port1' }, { k: 'tablet', x: 31, z: 26 - 1, id: 'tab_port2' },
      { k: 'mogu', x: 3, z: 6, id: 'mogu1' }, { k: 'mogu', x: 32, z: 11, id: 'mogu2' }, { k: 'mogu', x: 11, z: 25, id: 'mogu3' }, { k: 'mogu', x: 25, z: 2, id: 'mogu4' }, { k: 'mogu', x: 8, z: 14, id: 'mogu5' },
    ],
    spawn: [17, 21, 'up'],
  };
}

// ---------------------------------------------------------------- interiors
function room(w, d, opts = {}) {
  const g = new G(w, d + 1, opts.floor || '.');
  g.rect(0, 0, w - 1, 0, '#').rect(0, 0, 0, d, '#').rect(w - 1, 0, w - 1, d, '#');
  g.rect(0, d, w - 1, d, 'x');
  g.set(Math.floor(w / 2), d, opts.floor || '.');
  if (opts.carpet) g.rect(Math.floor(w / 2) - 1, 1, Math.floor(w / 2) + 1, d - 1, ',');
  return g;
}
function interior(id, name, back, opts = {}) {
  const w = opts.w || 13, d = opts.d || 9, g = room(w, d, opts);
  if (opts.paint) opts.paint(g);
  const m = g.done();
  MAPS[id] = {
    name, theme: opts.theme || 'interior', ...m, interior: true,
    objs: [warp(Math.floor(w / 2), d, 1, 1, back[0], back[1], back[2], 'down'), ...(opts.objs || [])],
    spawn: [Math.floor(w / 2), d - 1, 'up'], bgm: opts.bgm,
  };
}
const innObjs = (keeper, town) => [
  { k: 'bed', x: 1, z: 1, color: '#c84a4a' }, { k: 'bed', x: 3, z: 1, color: '#4a7ac8' }, { k: 'bed', x: 9, z: 1, color: '#4ac86a' }, { k: 'bed', x: 11, z: 1, color: '#c8a04a' },
  { k: 'table', x: 5, z: 4, w: 3 }, { k: 'barrel', x: 1, z: 7 }, { k: 'barrel', x: 11, z: 7 }, { k: 'shelf', x: 5, z: 1, w: 3 },
  { k: 'light', x: 6, z: 4, y: 2.2, color: '#ffb860', i: 9, d: 10 }, { k: 'light', x: 2, z: 5, y: 2, color: '#ffb860', i: 4, d: 6 },
  npc(6, 6, keeper, 'innkeep', { dir: 'down', inn: town }),
];
interior('inn_port', '白帆港 旅店「海鷗亭」', ['port', 26, 14], { objs: innObjs('inn_port_keeper', 'port') });
interior('guild_in', '冒險者公會', ['port', 19, 14], {
  objs: [{ k: 'table', x: 2, z: 3, w: 2 }, { k: 'table', x: 9, z: 3, w: 2 }, { k: 'shelf', x: 1, z: 1, w: 3 }, { k: 'shelf', x: 9, z: 1, w: 3 }, { k: 'barrel', x: 11, z: 6 }, { k: 'light', x: 6, z: 4, y: 2.2, i: 9, d: 10 },
    npc(6, 2, 'guild_master', 'merchant', { dir: 'down' }), npc(3, 5, 'guild_adv1', 'guard', { dir: 'right' }), npc(10, 5, 'guild_adv2', 'lady', { dir: 'left' })],
  paint: (g) => g.rect(5, 1, 7, 8, ','),
});
interior('temple_port', '海潮神殿', ['port', 20, 6], {
  theme: 'sanctum', w: 15, d: 10, carpet: true,
  objs: [{ k: 'bigcrystal', x: 6, z: 1, color: '#6ad8ff', dim: false }, { k: 'pillar', x: 2, z: 3 }, { k: 'pillar', x: 12, z: 3 }, { k: 'pillar', x: 2, z: 7 }, { k: 'pillar', x: 12, z: 7 },
    npc(9, 4, 'temple_priest', 'priest', { dir: 'down' }), npc(4, 6, 'temple_nun', 'lady', { dir: 'right' })],
});
interior('lighthouse', '燈塔頂', ['port', 28, 26], {
  theme: 'sanctum', w: 13, d: 9,
  objs: [{ k: 'bigcrystal', x: 5, z: 2, color: '#6ad8ff', id: 'tidecrystal' }, { k: 'pillar', x: 2, z: 2 }, { k: 'pillar', x: 10, z: 2 }, { k: 'torch', x: 2, z: 6 }, { k: 'torch', x: 10, z: 6 },
    ev(3, 5, 7, 1, 'lighthouse_scene', { cond: '!saren_met' })],
});

// sanctum interior (one per echo; the echo id comes from the warp)
for (const [id, echo, back] of [['sanc_kaz', 'kaz', ['world', 18, 39]], ['sanc_lumia', 'lumia', ['world', 23, 19]], ['sanc_fino', 'fino', ['world', 28, 29]], ['sanc_gareth', 'gareth', ['world', 45, 7]], ['sanc_sera', 'sera', ['world', 58, 19]], ['sanc_unran', 'unran', ['world', 4, 41]]]) {
  interior(id, '光之祠堂', back, {
    theme: 'sanctum', w: 13, d: 10, carpet: true,
    objs: [{ k: 'bigcrystal', x: 5, z: 1, color: '#ffe8a0' }, { k: 'pillar', x: 2, z: 2 }, { k: 'pillar', x: 10, z: 2 }, { k: 'pillar', x: 2, z: 6 }, { k: 'pillar', x: 10, z: 6 },
      { k: 'torch', x: 3, z: 8 }, { k: 'torch', x: 9, z: 8 }, ev(4, 4, 5, 1, 'sanctum', { echo })],
  });
}

// ================================================================ world map
{
  const W = 64, H = 44, g = new G(W, H, '.');
  // sea all around
  g.rect(0, 0, W - 1, H - 1, '~');
  g.ell(32, 22, 31, 21, '.');
  g.ell(10, 38, 9, 5, '.');            // southwest bulge for the port
  g.ell(55, 12, 9, 10, '.');           // northeast lands
  g.ell(10, 5, 10, 5.5, '.');          // north-west snowfield land
  // coast sand
  for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) if (g.get(x, z) === '.') { for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (g.get(x + a, z + b) === '~') { g.set(x, z, ':'); break; } }
  // snow in the far north-west
  g.ell(9, 3, 9, 4, 'k', ['.', ':']);
  // whisper forest
  g.ell(13, 14, 8, 7, 'Y', ['.']); g.ell(13, 15, 3, 5, '.'); g.path([[13, 21], [13, 14], [10, 10]], '.', 2);
  // mountains across the middle
  g.ell(34, 11, 11, 7, '@', ['.', ':']); g.ell(42, 15, 5, 4, '@', ['.']); g.ell(27, 14, 4, 4, '@', ['.']);
  g.eh(34, 11, 11, 7, 2);
  g.path([[34, 21], [34, 17], [36, 14]], ',', 2); g.h(33, 13, 37, 21, 0); // mountain pass to the mine
  g.set(36, 14, ','); g.rect(39, 6, 41, 9, '@'); g.ell(40, 8, 2, 2, '.'); g.h(39, 6, 41, 9, 4); // thunder peak plateau (airship only)
  // river and lake to the east
  g.path([[47, 0], [47, 8], [46, 16], [47, 25]], '~', 2);
  g.ell(54, 33, 9, 6, '~'); g.ell(54, 33, 2, 1.5, ':');
  g.path([[54, 27], [54, 31]], '=', 1); // causeway to the sunken temple
  g.ell(60, 38, 1.5, 1.5, '%'); g.path([[60, 38], [57, 41]], '%', 2);
  // shallows: ford to the snow, ring around the dragon islet
  g.rect(16, 6, 18, 8, '~'); g.rect(16, 7, 18, 7, '%'); g.path([[16, 2], [16, 10]], '~', 1); g.set(16, 7, '%'); g.rect(17, 2, 18, 10, '.'); g.ell(9, 3, 9, 4, 'k', ['.', ':']);
  g.ell(45, 6, 2.5, 2.5, '%'); g.ell(45, 6, 1.2, 1.2, '.');
  // roads
  g.path([[9, 34], [16, 34], [22, 30], [28, 29], [34, 24], [34, 21]], ',', 1);
  g.path([[13, 22], [13, 26], [16, 34]], ',', 1);
  g.path([[22, 30], [23, 19]], ',', 1);
  g.path([[34, 24], [40, 24], [45, 24], [49, 23], [52, 22]], ',', 1);
  g.rect(46, 23, 48, 24, '='); // bridge over the river
  g.path([[52, 22], [58, 19]], ',', 1);
  // southern islets (airship)
  g.ell(4, 41, 2, 1.5, '.'); g.ell(20, 42, 1.5, 1, '.'); g.ell(62, 42, 1.2, 1.2, '.');
  g.ell(2, 12, 1.5, 2, '.'); g.ell(30, 2, 2, 1.2, '.');
  g.ell(60, 4, 2, 2, '.'); g.rect(57, 1, 63, 7, '@'); g.ell(60, 4, 1.4, 1.4, '.'); g.h(57, 1, 63, 7, 3);
  // trees here and there
  g.scatter(1, 1, 62, 42, 'Y', 0.05, ['.'], 3);
  g.scatter(40, 17, 62, 30, 'Y', 0.04, ['.'], 5);
  // keep spot cells clear
  const spots = [[8, 34], [13, 22], [23, 18], [18, 38], [34, 22], [36, 14], [28, 28], [45, 6], [52, 22], [54, 33], [58, 18], [8, 3], [40, 8], [60, 38], [60, 4], [4, 41], [2, 12], [30, 2], [62, 42], [20, 42]];
  for (const [x, z] of spots) { g.set(x, z, g.get(x, z) === '@' || g.get(x, z) === '~' ? '.' : g.get(x, z) === 'Y' ? '.' : g.get(x, z)); }
  for (const [x, z] of spots) for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (g.get(x + a, z + b) === 'Y') g.set(x + a, z + b, '.');
  const m = g.done();
  const S = (x, z, k, name, to, extra = {}) => ({ k: extra.icon || 'spot', x, z, name, to, ...extra });
  MAPS.world = {
    name: '艾斯特蘭大陸', theme: 'field', ...m, world: true,
    objs: [
      S(8, 34, 'town', '白帆港', ['port', 32, 15, 'left'], { icon: 'town', roof: '#3a74b8', tower: true }),
      S(13, 22, 'dungeon', '低語森林', ['forest1', 14, 32, 'up'], { icon: 'dungeon', style: 'forest' }),
      S(23, 18, 'sanctum', '光之祠堂', ['sanc_lumia', 6, 9, 'up'], { icon: 'dungeon', style: 'sanctum' }),
      S(18, 38, 'sanctum', '光之祠堂', ['sanc_kaz', 6, 9, 'up'], { icon: 'dungeon', style: 'sanctum' }),
      S(34, 22, 'town', '鐵砧城', ['anvil', 17, 26, 'up'], { icon: 'town', roof: '#b84a3a', wallColor: '#b07a5a', tower: true, cond: 'ch2' }),
      S(36, 14, 'dungeon', '風鳴礦坑', ['mine1', 12, 30, 'up'], { icon: 'dungeon', style: 'cave', cond: 'mine_open' }),
      S(28, 28, 'sanctum', '光之祠堂', ['sanc_fino', 6, 9, 'up'], { icon: 'dungeon', style: 'sanctum' }),
      S(45, 6, 'sanctum', '光之祠堂', ['sanc_gareth', 6, 9, 'up'], { icon: 'dungeon', style: 'sanctum' }),
      S(52, 22, 'town', '水都蒼瀾', ['azurelle', 1, 15, 'right'], { icon: 'town', roof: '#2a8a8a', wallColor: '#f4f0e8', tower: true, cond: 'ch3' }),
      S(54, 33, 'dungeon', '沉沒神殿', ['temple1', 12, 30, 'up'], { icon: 'dungeon', style: 'ruin', color: '#7a9aa8', tile: 'temple', cond: 'temple_open' }),
      S(58, 18, 'sanctum', '光之祠堂', ['sanc_sera', 6, 9, 'up'], { icon: 'dungeon', style: 'sanctum' }),
      S(8, 3, 'trial', '霜狐的雪原', null, { icon: 'dungeon', style: 'ruin', color: '#d8e8f8', tile: 'snow', event: 'trial_fox' }),
      S(40, 8, 'trial', '雷鳴峰', null, { icon: 'dungeon', style: 'ruin', color: '#e8d870', event: 'trial_hawk' }),
      S(60, 38, 'trial', '鯨之淺灘', null, { icon: 'dungeon', style: 'ruin', color: '#4a8ac8', event: 'trial_whale' }),
      S(60, 4, 'dungeon', '浮空遺跡', ['sky1', 14, 30, 'up'], { icon: 'dungeon', style: 'ruin', color: '#e8e0f8', cond: 'ch4' }),
      S(4, 41, 'sanctum', '光之祠堂', ['sanc_unran', 6, 9, 'up'], { icon: 'dungeon', style: 'sanctum' }),
      S(2, 12, 'seal', '封印之地・西', null, { icon: 'dungeon', style: 'ruin', color: '#8a6a9a', event: 'seal_dragon' }),
      S(30, 2, 'seal', '封印之地・北', null, { icon: 'dungeon', style: 'ruin', color: '#8a6a9a', event: 'seal_machina' }),
      S(62, 42, 'seal', '封印之地・東', null, { icon: 'dungeon', style: 'ruin', color: '#8a6a9a', event: 'seal_abyss' }),
      S(20, 42, 'seal', '封印之地・南', null, { icon: 'dungeon', style: 'ruin', color: '#8a6a9a', event: 'seal_gold' }),
      { k: 'tablet', x: 25, z: 33, id: 'tab_w1' }, { k: 'tablet', x: 43, z: 27, id: 'tab_w2' }, { k: 'tablet', x: 7, z: 3, id: 'tab_w3' }, { k: 'tablet', x: 58, z: 9, id: 'tab_w4' },
      ev(14, 33, 1, 3, 'bigfang', { cond: 'q_bigfang_taken&!q_bigfang_done', battle: true }),
    ],
    zones: [
      { x0: 0, z0: 24, x1: 30, z1: 44, enc: { troops: [['slime', 'slime'], ['wolf'], ['bat', 'slime'], ['bud', 'wolf'], ['slime', 'bat', 'slime']], lv: 2 } },
      { x0: 0, z0: 0, x1: 30, z1: 24, enc: { troops: [['fwolf', 'bud'], ['goblin'], ['wolf', 'wolf', 'bat'], ['poisonbud', 'goblin']], lv: 5 } },
      { x0: 30, z0: 0, x1: 47, z1: 30, enc: { troops: [['hawk', 'bandit'], ['rockgolem'], ['bandit', 'bandit'], ['hawk', 'hawk']], lv: 9 } },
      { x0: 47, z0: 0, x1: 64, z1: 44, enc: { troops: [['crab', 'leapfish'], ['gull', 'gull'], ['waterslime', 'crab'], ['leapfish', 'gull', 'waterslime']], lv: 15 } },
      { x0: 30, z0: 30, x1: 47, z1: 44, enc: { troops: [['hawk', 'bandit'], ['crab', 'gull']], lv: 12 } },
    ],
    encRate: 34,
    spawn: [9, 34, 'right'],
  };
}

// ================================================================ 低語森林 Whisper Forest
{
  const g = new G(30, 34, 'Y');
  g.path([[14, 33], [14, 28], [10, 24], [10, 18], [15, 14], [20, 10], [16, 5], [15, 0]], ',', 3);
  g.ell(14, 29, 4, 3, '.'); g.ell(10, 20, 4, 4, '.'); g.ell(21, 10, 4, 3, '.'); g.ell(16, 4, 4, 3, '.');
  g.path([[10, 20], [4, 24], [3, 29]], '.', 2); g.ell(3, 29, 2.5, 2.5, '.'); // side clearing with a chest
  g.path([[21, 10], [26, 15], [25, 22]], '.', 2); g.ell(25, 23, 3, 3, '.');
  g.path([[18, 28], [24, 30]], '~', 2); g.set(20, 29, '|').set(21, 29, '|'); g.set(20, 28, '|').set(21, 28, '|'); g.set(20, 30, '|').set(21, 30, '|');
  g.path([[24, 30], [28, 31]], '~', 2);
  g.path([[10, 18], [17, 18]], ',', 2);
  g.scatter(0, 0, 29, 33, 'y', 0.12, ['.'], 7);
  g.path([[14, 33], [14, 28], [10, 24], [10, 18], [15, 14], [20, 10], [16, 5], [15, 0]], ',', 2);
  g.path([[10, 20], [4, 24], [3, 29]], ':', 2); g.ell(3, 29, 1.5, 1.5, ':', ['.', 'y']);
  g.path([[21, 10], [26, 15], [25, 22]], ':', 2); g.ell(25, 23, 2, 2, ':', ['.', 'y']);
  
  const m = g.done();
  MAPS.forest1 = {
    name: '低語森林', theme: 'forest', ...m,
    objs: [
      warp(13, 33, 3, 1, 'world', 13, 23, 'down'), warp(14, 0, 3, 1, 'forest2', 15, 28, 'up'),
      chest(3, 29, 'c_f1a', 'hipotion'), chest(26, 24, 'c_f1b', 'w_iron_sword'), chest(22, 9, 'c_f1c', null, { gil: 300 }),
      { k: 'reeds', x: 18, z: 27 }, { k: 'reeds', x: 25, z: 31 }, { k: 'rock', x: 12, z: 28 }, { k: 'rock', x: 7, z: 21 }, { k: 'flowers', x: 15, z: 31 }, { k: 'flowers', x: 9, z: 19 },
      { k: 'tablet', x: 4, z: 27, id: 'tab_f1' },
      npc(11, 22, 'forest_hunter', 'guard', { dir: 'down' }),
    ],
    enc: { troops: [['fwolf', 'fwolf'], ['poisonbud', 'goblin'], ['wisp', 'fwolf'], ['goblin', 'goblin'], ['wisp', 'poisonbud', 'wisp']], lv: 6 }, encRate: 26,
    spawn: [14, 31, 'up'],
  };
}
{
  const g = new G(30, 30, 'Y');
  g.path([[15, 29], [15, 24], [9, 19], [9, 14], [15, 10], [15, 6]], ',', 3);
  g.ell(15, 5, 6, 4, '.'); g.ell(9, 16, 4, 4, '.');
  g.path([[9, 16], [3, 12], [3, 6]], '.', 2); g.ell(3, 5, 2.5, 2.5, '.');
  g.path([[15, 24], [22, 22], [25, 16]], '.', 2); g.ell(25, 15, 3, 3, '.');
  g.scatter(0, 0, 29, 29, 'y', 0.1, ['.'], 11);
  g.path([[15, 29], [15, 24], [9, 19], [9, 14], [15, 10], [15, 6]], ',', 2);
  g.path([[9, 16], [3, 12], [3, 6]], ':', 2); g.ell(3, 5, 1.5, 1.5, ':', ['.', 'y']);
  g.path([[15, 24], [22, 22], [25, 16]], ':', 2); g.ell(25, 15, 2, 2, ':', ['.', 'y']);
  g.ell(15, 4, 4, 2.5, 'g');
  const m = g.done();
  MAPS.forest2 = {
    name: '低語森林・深處', theme: 'forest', ...m,
    objs: [
      warp(14, 29, 3, 1, 'forest1', 15, 1, 'down'),
      save(12, 10), chest(3, 4, 'c_f2a', null, { item: 'k_necklace', cond: 'q_necklace_taken' }), chest(26, 14, 'c_f2b', 'a_leather'), chest(4, 6, 'c_f2c', 'ether'),
      { k: 'deco', x: 15, z: 2, sprite: 'tree', colors: { leaf: '#5a4a6a', bark: '#4a3a3a' }, scale: 1.8, block: true },
      ev(13, 7, 5, 1, 'rottree', { cond: '!rottree_done' }),
      { k: 'flowers', x: 20, z: 5 }, { k: 'flowers', x: 10, z: 5 }, { k: 'rock', x: 21, z: 23 },
    ],
    enc: { troops: [['fwolf', 'poisonbud', 'fwolf'], ['goblin', 'wisp'], ['goblin', 'goblin', 'poisonbud'], ['wisp', 'wisp']], lv: 7 }, encRate: 24,
    spawn: [15, 27, 'up'],
  };
}

// ================================================================ 鐵砧城 Anvilholm
{
  const g = new G(34, 28, '.');
  g.rect(0, 0, 33, 0, '#').rect(0, 0, 0, 27, '#').rect(33, 0, 33, 27, '#').rect(0, 27, 33, 27, '#');
  g.rect(16, 27, 18, 27, '.');
  g.h(1, 1, 32, 9, 2); g.rect(15, 10, 18, 10, '^');
  g.rect(1, 1, 32, 9, ';'); g.rect(4, 3, 29, 8, 'm');
  g.rect(14, 11, 19, 26, 'b');
  g.rect(1, 18, 6, 26, '~'); g.rect(1, 22, 6, 22, '=');
  g.rect(26, 20, 32, 26, ',');
  const m = g.done();
  MAPS.anvil = {
    name: '鐵砧城', theme: 'anvil', ...m, town: true,
    tiles: { fourth: ['metal', '#5a6470'] },
    objs: [
      { k: 'house', x: 2, z: 11, w: 5, d: 4, door: 2, sign: 'inn', id: 'inn_a', chimney: 1 },
      { k: 'house', x: 8, z: 11, w: 4, d: 3, door: 1, sign: 'item', chimney: 3 },
      { k: 'house', x: 21, z: 11, w: 5, d: 4, door: 2, sign: 'forge', chimney: 1, roof: '#8a3a2a' },
      { k: 'house', x: 27, z: 11, w: 5, d: 3, door: 2, sign: 'weapon' },
      { k: 'house', x: 8, z: 18, w: 5, d: 3, door: 2, chimney: 4 },
      { k: 'house', x: 21, z: 18, w: 4, d: 3, door: 1, chimney: 2 },
      { k: 'house', x: 3, z: 2, w: 8, d: 4, door: 4, sign: 'workshop', id: 'workshop', roof: '#6a6a7a', wall: ['metal', '#7a8490'], chimney: 2, h: 3 },
      { k: 'house', x: 22, z: 2, w: 8, d: 4, door: 4, roof: '#8a3a2a', h: 3.2, chimney: 6, sign: 'arena', id: 'hall' },
      { k: 'gear', x: 13, z: 4, r: 1.2, spin: 0.4 }, { k: 'gear', x: 18, z: 3, r: 0.8, spin: -0.7 },
      { k: 'airship', x: 16, z: 6, id: 'dock_airship', cond: 'airship_built' },
      lamp(13, 12), lamp(20, 12), lamp(13, 19), lamp(20, 19), lamp(13, 25), lamp(20, 25), lamp(7, 8), lamp(26, 8), lamp(14, 9), lamp(19, 9),
      { k: 'barrel', x: 7, z: 16 }, { k: 'crate', x: 26, z: 16 }, { k: 'crate', x: 27, z: 16, s: 0.6 }, { k: 'barrel', x: 31, z: 9 - 1 }, { k: 'crate', x: 2, z: 8 },
      { k: 'smoke', x: 12, z: 5, y: 3 }, { k: 'stall', x: 27, z: 21, color: '#e8a040', sign: 'shop' },
      save(16, 22),
      warp(16, 27, 3, 1, 'world', 34, 23, 'down'),
      warp(4, 15, 1, 1, 'inn_anvil', 6, 7, 'up', { door: true }),
      warp(7, 6, 1, 1, 'workshop_in', 6, 7, 'up', { door: true }),
      npc(9, 15, 'anvil_item', 'merchant', { dir: 'down', shop: 'anvil_items' }),
      npc(29, 15, 'anvil_gear', 'smith', { dir: 'down', shop: 'anvil_gear' }),
      npc(23, 15, 'anvil_forge', 'smith', { dir: 'down', forge: true }),
      npc(28, 22, 'anvil_stall', 'engineer', { dir: 'down', shop: 'anvil_mats' }),
      npc(16, 14, 'anvil_guard', 'guard', { dir: 'down' }),
      npc(10, 23, 'anvil_kid', 'boy', { dir: 'right', wander: true }),
      npc(24, 7, 'anvil_elder', 'oldman', { dir: 'down' }),
      npc(30, 24, 'anvil_engineer', 'engineer', { dir: 'left', wander: true }),
      npc(26, 6, 'anvil_hall', 'scholar', { dir: 'down' }),
      npc(17, 16, 'rena_npc', 'rena', { hero: 'rena', dir: 'down', cond: 'ch2&!rena_joined' }),
      { k: 'board', x: 14, z: 21, id: 'board_anvil' },
      { k: 'tablet', x: 31, z: 2, id: 'tab_a1' },
    ],
    spawn: [17, 25, 'up'],
  };
}
interior('inn_anvil', '鐵砧城 旅店「熔爐之火」', ['anvil', 4, 16], { objs: innObjs('inn_anvil_keeper', 'anvil') });
interior('workshop_in', '蕾娜的工房', ['anvil', 7, 7], {
  floor: 'm', objs: [{ k: 'gear', x: 2, z: 2, r: 0.7, spin: 0.6 }, { k: 'gear', x: 10, z: 2, r: 0.5, spin: -1 }, { k: 'table', x: 4, z: 3, w: 4 }, { k: 'crate', x: 1, z: 7 }, { k: 'crate', x: 11, z: 7 }, { k: 'barrel', x: 11, z: 5 }, { k: 'shelf', x: 5, z: 1, w: 3 }, { k: 'light', x: 6, z: 4, y: 2.2, i: 9, d: 10 },
    npc(6, 5, 'workshop_gramps', 'engineer', { dir: 'down' })],
});

// ================================================================ 風鳴礦坑 Windcry Mine
{
  const g = new G(26, 32, '#');
  g.path([[12, 31], [12, 25], [6, 22], [6, 15], [12, 11], [19, 11], [19, 5], [12, 3], [12, 0]], 'c', 3);
  g.ell(12, 27, 3, 2, 'c'); g.ell(6, 18, 3, 4, 'c'); g.ell(19, 8, 3, 3, 'c');
  g.path([[6, 22], [2, 26]], 'c', 2); g.ell(2, 27, 1.5, 1.5, 'c');
  g.path([[19, 11], [23, 18], [23, 24]], 'c', 2); g.ell(22, 25, 2, 2, 'c');
  g.path([[12, 25], [12, 31]], ',', 1);
  g.path([[6, 22], [6, 15], [12, 11], [19, 11]], ',', 1);
  g.h(9, 0, 22, 10, 2); g.rect(18, 11, 20, 11, '^');
  const m = g.done();
  MAPS.mine1 = {
    name: '風鳴礦坑', theme: 'mine', ...m,
    objs: [
      warp(11, 31, 3, 1, 'world', 36, 14, 'down'), warp(11, 0, 3, 1, 'mine2', 12, 26, 'up'),
      { k: 'torch', x: 10, z: 26 }, { k: 'torch', x: 14, z: 26 }, { k: 'torch', x: 4, z: 18 }, { k: 'torch', x: 8, z: 14 }, { k: 'torch', x: 17, z: 7 }, { k: 'torch', x: 21, z: 7 }, { k: 'torch', x: 11, z: 2 }, { k: 'torch', x: 23, z: 22 },
      chest(2, 27, 'c_m1a', 'hipotion'), chest(22, 26, 'c_m1b', 'x_charm'), chest(21, 5, 'c_m1c', 'ether'), chest(7, 16, 'c_m1d', null, { gil: 800 }),
      { k: 'crate', x: 14, z: 28 }, { k: 'crate', x: 4, z: 21 }, { k: 'barrel', x: 8, z: 21 }, { k: 'gear', x: 20, z: 9, r: 0.6, spin: 0.8 },
      { k: 'deco', x: 7, z: 17, sprite: 'crystal', colors: { color: '#8affb0' }, scale: 0.8 }, { k: 'deco', x: 5, z: 19, sprite: 'crystal', colors: { color: '#8affb0' }, scale: 0.6 },
      { k: 'tablet', x: 23, z: 24, id: 'tab_m1' },
      ev(22, 23, 3, 3, 'golem_boss', { cond: 'q_golem_taken&!q_golem_done', battle: true }),
    ],
    enc: { troops: [['minebat', 'minebat'], ['skeleton', 'minebat'], ['sentry'], ['windsprite', 'skeleton'], ['skeleton', 'skeleton', 'minebat']], lv: 12 }, encRate: 24,
    spawn: [12, 29, 'up'],
  };
}
{
  const g = new G(26, 28, '#');
  g.path([[12, 27], [12, 20], [5, 16], [5, 10], [12, 7]], 'c', 3);
  g.ell(12, 5, 6, 4, 'c');
  g.path([[12, 20], [20, 17], [21, 10]], 'c', 2); g.ell(21, 9, 2, 2, 'c');
  g.path([[5, 16], [2, 20]], 'c', 2); g.ell(2, 21, 1.5, 1.5, 'c');
  g.ell(12, 4, 3.5, 2, 'q');
  const m = g.done();
  MAPS.mine2 = {
    name: '風鳴礦坑・風之大廳', theme: 'mine', ...m, tiles: { crystal: ['crystal', '#6ae8a0'] },
    objs: [
      warp(11, 27, 3, 1, 'mine1', 12, 1, 'down'),
      save(4, 12), { k: 'bigcrystal', x: 11, z: 2, color: '#8affb0', id: 'windcrystal' },
      { k: 'torch', x: 7, z: 6 }, { k: 'torch', x: 17, z: 6 }, { k: 'torch', x: 10, z: 21 }, { k: 'torch', x: 4, z: 13 },
      chest(21, 8, 'c_m2a', 'shard'), chest(2, 21, 'c_m2b', 'w_hammer'),
      ev(9, 8, 7, 1, 'tia', { cond: '!tia_done' }),
      { k: 'tablet', x: 20, z: 10, id: 'tab_m2' },
    ],
    enc: { troops: [['sentry', 'windsprite'], ['skeleton', 'skeleton'], ['minebat', 'windsprite', 'minebat']], lv: 13 }, encRate: 24,
    spawn: [12, 25, 'up'],
  };
}

// ================================================================ 水都蒼瀾 Azurelle
{
  const g = new G(36, 30, '.');
  g.rect(0, 0, 35, 0, '#').rect(35, 0, 35, 29, '#').rect(0, 29, 35, 29, '~').rect(0, 0, 0, 29, '#');
  g.rect(0, 14, 0, 16, '.');
  g.h(8, 1, 34, 7, 2); g.rect(20, 8, 22, 8, '^');
  g.rect(1, 9, 34, 10, '~'); g.rect(1, 9, 3, 10, '|').rect(12, 9, 13, 10, '|').rect(28, 9, 29, 10, '|');
  g.rect(16, 11, 17, 28, '~'); g.rect(16, 15, 17, 15, '=').rect(16, 22, 17, 22, '=');
  g.rect(1, 11, 7, 28, '.'); g.rect(1, 24, 15, 28, ','); g.rect(18, 24, 34, 28, ',');
  g.rect(1, 25, 34, 28, '~'); g.rect(16, 24, 17, 24, '=');
  g.rect(1, 1, 7, 8, ','); g.h(1, 1, 7, 8, 0); g.rect(1, 1, 7, 8, 'Y'); g.rect(2, 2, 6, 7, ','); g.rect(2, 8, 2, 8, ',');
  g.rect(22, 13, 31, 20, 'b');
  const m = g.done();
  MAPS.azurelle = {
    name: '水都蒼瀾', theme: 'azurelle', ...m, town: true,
    objs: [
      { k: 'house', x: 12, z: 1, w: 12, d: 5, h: 3.4, door: 6, roof: '#1a6a7a', id: 'palace', dormers: [2, 5, 8], wall: ['temple', '#f0ece4'] },
      { k: 'house', x: 26, z: 2, w: 6, d: 4, door: 3, sign: 'arena', id: 'arena', roof: '#a83a3a' },
      { k: 'house', x: 2, z: 11, w: 5, d: 3, door: 2, sign: 'inn' },
      { k: 'house', x: 9, z: 12, w: 5, d: 3, door: 2, sign: 'item' },
      { k: 'house', x: 9, z: 18, w: 5, d: 3, door: 2, sign: 'weapon' },
      { k: 'house', x: 2, z: 18, w: 4, d: 3, door: 1, sign: 'armor' },
      { k: 'house', x: 19, z: 11, w: 3, d: 3, door: 1 }, { k: 'house', x: 32, z: 12, w: 3, d: 4, door: 1 },
      { k: 'house', x: 19, z: 18, w: 3, d: 3, door: 1 }, { k: 'house', x: 32, z: 18, w: 3, d: 4, door: 1 },
      { k: 'fountain', x: 26, z: 16 },
      lamp(8, 13), lamp(15, 13), lamp(8, 21), lamp(15, 21), lamp(18, 13), lamp(23, 12), lamp(30, 12), lamp(23, 21), lamp(30, 21), lamp(11, 7), lamp(25, 7), lamp(19, 7), lamp(33, 7),
      { k: 'planter', x: 22, z: 15, w: 2, flower: '#6ac8f0' }, { k: 'planter', x: 30, z: 18, w: 2, flower: '#f4f0e4' },
      { k: 'bush', x: 8, z: 5, flower: '#c8a0ff' }, { k: 'bush', x: 34, z: 5 },
      save(21, 23),
      warp(0, 14, 1, 3, 'world', 51, 22, 'left'),
      warp(4, 14, 1, 1, 'inn_azur', 6, 7, 'up', { door: true }),
      warp(18, 6, 1, 1, 'palace_in', 7, 8, 'up', { door: true }),
      npc(11, 15, 'azur_item', 'merchant', { dir: 'down', shop: 'azur_items' }),
      npc(11, 21, 'azur_weapon', 'smith', { dir: 'down', shop: 'azur_gear' }),
      npc(3, 21, 'azur_armor', 'lady', { dir: 'down', shop: 'azur_armor' }),
      npc(29, 6, 'azur_arena', 'watchman', { dir: 'down', arena: true }),
      npc(20, 9 - 1, 'azur_watch', 'watchman', { dir: 'down' }),
      npc(25, 22, 'azur_noble', 'noble', { dir: 'down', wander: true }),
      npc(5, 23, 'azur_girl', 'girl', { dir: 'right', wander: true }),
      npc(31, 23, 'azur_fisher', 'fisher', { dir: 'down' }),
      npc(4, 5, 'azur_garden', 'oldwoman', { dir: 'down' }),
      npc(28, 13, 'neo_npc', 'neo', { hero: 'neo', dir: 'down', cond: 'ch3&!neo_joined' }),
      { k: 'board', x: 22, z: 20, id: 'board_azur' },
      { k: 'tablet', x: 33, z: 27 - 3, id: 'tab_z1' },
    ],
    spawn: [2, 15, 'right'],
  };
}
interior('inn_azur', '蒼瀾 旅店「水晶之泉」', ['azurelle', 4, 15], { objs: innObjs('inn_azur_keeper', 'azurelle') });
interior('palace_in', '水守之殿', ['azurelle', 18, 7], {
  theme: 'sanctum', w: 15, d: 10, carpet: true,
  objs: [{ k: 'pillar', x: 2, z: 2 }, { k: 'pillar', x: 12, z: 2 }, { k: 'pillar', x: 2, z: 6 }, { k: 'pillar', x: 12, z: 6 }, { k: 'fountain', x: 6, z: 1 },
    npc(10, 3, 'palace_elder', 'noble', { dir: 'down' }), npc(4, 4, 'palace_guard', 'watchman', { dir: 'right' })],
});

// ================================================================ 沉沒神殿 Sunken Temple
{
  const g = new G(26, 32, '#');
  g.rect(9, 24, 15, 31, 'p'); g.rect(4, 14, 21, 23, 'p'); g.rect(10, 0, 14, 13, 'p');
  g.rect(6, 16, 19, 21, '~'); g.rect(11, 16, 13, 21, '|'); g.rect(6, 18, 19, 19, '=');
  g.rect(11, 18, 13, 19, 'p');
  g.rect(1, 16, 3, 28, 'p'); g.rect(22, 16, 24, 28, 'p'); g.rect(1, 26, 8, 28, 'p'); g.rect(16, 26, 24, 28, 'p');
  g.rect(16, 4, 23, 10, 'p'); g.rect(15, 6, 16, 7, 'p');
  g.rect(2, 4, 8, 10, 'p'); g.rect(8, 6, 9, 7, 'p'); g.rect(3, 6, 7, 8, '~'); g.rect(5, 6, 5, 8, '|');
  const m = g.done();
  MAPS.temple1 = {
    name: '沉沒神殿', theme: 'temple', ...m,
    objs: [
      warp(11, 31, 3, 1, 'world', 54, 32, 'down'), warp(11, 0, 3, 1, 'temple2', 12, 26, 'up'),
      { k: 'pillar', x: 9, z: 25 }, { k: 'pillar', x: 15, z: 25 }, { k: 'pillar', x: 9, z: 29 }, { k: 'pillar', x: 15, z: 29 }, { k: 'pillar', x: 4, z: 14, broken: true }, { k: 'pillar', x: 21, z: 14 }, { k: 'pillar', x: 10, z: 2 }, { k: 'pillar', x: 14, z: 2 },
      { k: 'torch', x: 4, z: 23 }, { k: 'torch', x: 21, z: 23 }, { k: 'torch', x: 10, z: 12 }, { k: 'torch', x: 14, z: 12 },
      chest(2, 27, 'c_t1a', 'hiether'), chest(23, 27, 'c_t1b', 'a_silk'), chest(22, 5, 'c_t1c', 'shard'), chest(5, 7, 'c_t1d', 'w_trident'),
      { k: 'deco', x: 18, z: 9, sprite: 'crystal', colors: { color: '#4ac8f0' }, scale: 0.8 },
      { k: 'tablet', x: 2, z: 17, id: 'tab_t1' },
    ],
    enc: { troops: [['drowned', 'eel'], ['deepmage', 'drowned'], ['eel', 'eel'], ['drowned', 'deepmage', 'eel']], lv: 19 }, encRate: 24,
    spawn: [12, 29, 'up'],
  };
}
{
  const g = new G(26, 28, '#');
  g.rect(10, 18, 14, 27, 'p'); g.rect(3, 10, 22, 17, 'p'); g.rect(6, 1, 18, 9, 'p');
  g.rect(3, 12, 22, 15, '~'); g.rect(11, 12, 13, 15, '|');
  g.rect(8, 2, 16, 5, 'q');
  g.rect(1, 18, 4, 25, 'p'); g.rect(4, 22, 9, 23, 'p'); g.rect(20, 18, 24, 25, 'p'); g.rect(15, 22, 20, 23, 'p');
  const m = g.done();
  MAPS.temple2 = {
    name: '沉沒神殿・水晶之間', theme: 'temple', ...m,
    objs: [
      warp(11, 27, 3, 1, 'temple1', 12, 1, 'down'),
      save(14, 20), { k: 'bigcrystal', x: 11, z: 2, color: '#4aa8ff', id: 'watercrystal' },
      { k: 'pillar', x: 6, z: 2 }, { k: 'pillar', x: 18, z: 2 }, { k: 'pillar', x: 6, z: 8 }, { k: 'pillar', x: 18, z: 8 },
      { k: 'torch', x: 9, z: 9 }, { k: 'torch', x: 15, z: 9 },
      chest(2, 24, 'c_t2a', 'x_amulet'), chest(23, 24, 'c_t2b', 'w_wave_bow'),
      ev(9, 7, 7, 1, 'serene', { cond: '!serene_done' }),
    ],
    enc: { troops: [['deepmage', 'deepmage'], ['drowned', 'drowned', 'eel']], lv: 20 }, encRate: 26,
    spawn: [12, 25, 'up'],
  };
}

// ================================================================ 浮空遺跡 Sky Ruins
function skyMap(id, name, theme, paint, objs, enc, spawn, extra = {}) {
  const g = new G(28, 32, 'x'); paint(g); const m = g.done();
  MAPS[id] = { name, theme, ...m, objs, enc, encRate: 26, spawn, ...extra };
}
skyMap('sky1', '浮空遺跡・外庭', 'sky', (g) => {
  g.ell(14, 28, 5, 3.5, '.'); g.rect(13, 22, 15, 25, '|'); g.ell(14, 18, 6, 4, '.'); g.ell(14, 18, 3, 2, ',');
  g.rect(6, 17, 8, 19, '='); g.ell(4, 18, 3, 3, '.'); g.rect(20, 17, 22, 19, '='); g.ell(24, 18, 3, 3, '.');
  g.rect(13, 9, 15, 14, '|'); g.ell(14, 6, 6, 4, '.'); g.rect(13, 0, 15, 3, '|');
  g.eh(14, 18, 3, 2, 1);
}, [
  warp(13, 31, 3, 1, 'world', 60, 5, 'down', { airship: true }), warp(13, 0, 3, 1, 'sky2', 14, 30, 'up'),
  { k: 'pillar', x: 10, z: 16 }, { k: 'pillar', x: 18, z: 16 }, { k: 'pillar', x: 10, z: 20, broken: true }, { k: 'pillar', x: 18, z: 20 }, { k: 'pillar', x: 10, z: 5 }, { k: 'pillar', x: 18, z: 5 },
  chest(3, 18, 'c_s1a', 'hiether'), chest(25, 18, 'c_s1b', 'a_mythril'), save(16, 28),
  { k: 'deco', x: 12, z: 7, sprite: 'crystal', colors: { color: '#c8a0ff' }, scale: 0.9 },
], { troops: [['cloudbird', 'cloudbird'], ['crysgolem'], ['shadowknight', 'cloudbird'], ['wyvern']], lv: 26 }, [14, 29, 'up']);
skyMap('sky2', '浮空遺跡・迴廊', 'sky', (g) => {
  g.ell(14, 28, 4, 3, '.'); g.rect(13, 21, 15, 25, '|'); g.ell(14, 17, 7, 4.5, '.');
  g.rect(3, 15, 8, 16, '='); g.ell(3, 10, 2.5, 5, '.'); g.rect(2, 4, 4, 6, '|'); g.ell(8, 3, 5, 2.5, '.'); g.rect(13, 0, 15, 2, '|');
  g.rect(21, 15, 24, 16, '='); g.ell(25, 11, 2.5, 4, '.');
  g.ell(14, 17, 3, 2, 'q');
}, [
  warp(13, 31, 3, 1, 'sky1', 14, 1, 'down'), warp(13, 0, 3, 1, 'sky3', 14, 26, 'up'),
  { k: 'pillar', x: 9, z: 14 }, { k: 'pillar', x: 19, z: 14 }, { k: 'pillar', x: 9, z: 20 }, { k: 'pillar', x: 19, z: 20 },
  chest(25, 9, 'c_s2a', 'shard'), chest(3, 8, 'c_s2b', 'x_ribbon'), save(8, 3),
  ev(10, 18, 9, 1, 'saren2', { cond: '!saren2_done' }),
], { troops: [['shadowknight', 'shadowknight'], ['crysgolem', 'cloudbird'], ['wyvern', 'cloudbird']], lv: 28 }, [14, 29, 'up']);
skyMap('sky3', '浮空遺跡・緘默之座', 'skyDark', (g) => {
  g.ell(14, 25, 4, 3, '.'); g.rect(13, 17, 15, 22, '|'); g.ell(14, 10, 8, 6, '.'); g.ell(14, 8, 4, 3, ',');
}, [
  warp(13, 28, 3, 1, 'sky2', 14, 1, 'down'),
  { k: 'pillar', x: 8, z: 7 }, { k: 'pillar', x: 20, z: 7 }, { k: 'pillar', x: 8, z: 13 }, { k: 'pillar', x: 20, z: 13 },
  save(17, 25), { k: 'bigcrystal', x: 13, z: 5, color: '#c8a0ff', id: 'voidcrystal' },
  ev(10, 12, 9, 1, 'finale', { cond: '!finale_done' }),
], null, [14, 26, 'up'], { tall: 29 });

// seal sites and trials reuse a small arena map built on the fly
export function arenaMap(theme = 'field') {
  const g = new G(14, 12, 'x'); g.ell(7, 6, 6, 5, '.'); g.ell(7, 6, 3, 2, ',');
  const m = g.done(); return { name: '', theme, ...m, objs: [], spawn: [7, 9, 'up'] };
}
