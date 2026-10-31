// The map: a minimap in the corner, a full map with fog of war and markers, and fast travel between visited towns.
const CELL = 6; // pixels per map cell on the full-size base image

export class AutoMap {
  constructor(G) {
    this.G = G; this.mini = document.getElementById('minimap'); this.mctx = this.mini?.getContext('2d');
    this.t = 0; this.lastCell = '';
    if (this.mini) this.mini.addEventListener('click', (e) => { e.stopPropagation(); if (this.G.mode === 'field' && !this.G.busy && !this.G.menuOpen) this.G.openMap(); });
  }
  get S() { return this.G.S; }
  // ---------------------------------------------------------------- per map
  onLoad(field) {
    this.f = field; const map = field.map, th = field.theme || {};
    this.id = field.mapId; this.W = map.W; this.H = map.H;
    this.S.explored = this.S.explored || {};
    this.bits = decode(this.S.explored[this.id], map.W * map.H);
    // base picture of the whole map
    const c = document.createElement('canvas'); c.width = map.W * CELL; c.height = map.H * CELL; const g = c.getContext('2d');
    const tileCol = (k) => (th.tiles?.[k] || th.tiles?.main || [0, '#8a8a7a'])[1];
    for (const cell of map.cells) {
      let col;
      if (cell.void) col = null;
      else if (cell.water) col = th.water || '#3a7ab8';
      else if (cell.shallow) col = '#6aa8c8';
      else if (cell.wall) col = shade((th.wall || [0, '#6a6a6a'])[1], -0.35);
      else if (cell.tree) col = '#2e5a2a';
      else if (cell.bush) col = '#3e7a34';
      else if (cell.cliff) col = '#7a6a5a';
      else if (cell.bridge) col = '#9a6a3c';
      else if (cell.stairs) col = shade(tileCol(cell.kind), 0.15);
      else col = tileCol(cell.kind);
      if (!col) continue;
      g.fillStyle = col; g.fillRect(cell.i * CELL, cell.j * CELL, CELL, CELL);
      // a little height shading so terraces read
      if (cell.h > 0 && !cell.water) { g.fillStyle = `rgba(255,255,255,${Math.min(0.25, cell.h * 0.05)})`; g.fillRect(cell.i * CELL, cell.j * CELL, CELL, CELL); }
    }
    for (const o of field.def.objs || []) if (o.k === 'house') {
      g.fillStyle = o.roof || th.roof || '#a84a3a'; g.fillRect(o.x * CELL, o.z * CELL, (o.w || 1) * CELL, (o.d || 1) * CELL);
      g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 1; g.strokeRect(o.x * CELL + 0.5, o.z * CELL + 0.5, (o.w || 1) * CELL - 1, (o.d || 1) * CELL - 1);
    }
    this.base = c;
    // fog: dark where not yet explored
    const fog = document.createElement('canvas'); fog.width = map.W; fog.height = map.H; this.fog = fog; this.fctx = fog.getContext('2d');
    this.fctx.fillStyle = '#05060c'; this.fctx.fillRect(0, 0, map.W, map.H);
    const id = this.fctx.getImageData(0, 0, map.W, map.H);
    for (let i = 0; i < map.W * map.H; i++) if (this.bits[i]) id.data[i * 4 + 3] = 0;
    this.fctx.putImageData(id, 0, 0);
    // towns and interiors are fully known; the world map and dungeons are explored by walking
    this.open = !!(field.def.town || field.def.interior);
    this.S.flags['visit_' + this.id] = true;
    // places already visited are known on the world map
    if (field.world) for (const o of field.def.objs || []) if (o.to && this.S.flags['visit_' + o.to[0]]) this.revealAt(o.x, o.z, 6);
    this.lastCell = ''; this.reveal(true);
    this.draw();
  }
  revealAt(ci, cj, R) {
    for (let j = cj - R; j <= cj + R; j++) for (let i = ci - R; i <= ci + R; i++) {
      if (i < 0 || j < 0 || i >= this.W || j >= this.H || (i - ci) ** 2 + (j - cj) ** 2 > R * R) continue;
      const k = j * this.W + i; if (!this.bits[k]) { this.bits[k] = 1; this.fctx.clearRect(i, j, 1, 1); this.dirty = true; }
    }
  }
  reveal(force) {
    const p = this.f?.player; if (!p) return;
    const ci = Math.floor(p.x), cj = Math.floor(p.z), key = ci + ',' + cj;
    if (!force && key === this.lastCell) return; this.lastCell = key;
    const R = this.f.world ? 7 : 5; let changed = false;
    for (let j = cj - R; j <= cj + R; j++) for (let i = ci - R; i <= ci + R; i++) {
      if (i < 0 || j < 0 || i >= this.W || j >= this.H || (i - ci) ** 2 + (j - cj) ** 2 > R * R) continue;
      const k = j * this.W + i; if (!this.bits[k]) { this.bits[k] = 1; changed = true; this.fctx.clearRect(i, j, 1, 1); }
    }
    if (changed) { this.dirty = true; this.saveT = 1.5; }
  }
  tick(dt) {
    if (!this.f || !this.mini) return;
    this.reveal();
    if (this.saveT > 0 && (this.saveT -= dt) <= 0 && this.dirty) { this.S.explored[this.id] = encode(this.bits); this.dirty = false; }
    this.t += dt; if (this.t < 0.12) return; this.t = 0;
    this.draw();
  }
  explored() { if (this.open) return 1; let n = 0, m = 0; for (const c of this.f.map.cells) { if (c.void) continue; m++; if (this.bits[c.j * this.W + c.i]) n++; } return m ? n / m : 1; }
  // things worth marking: exits, chests, save crystals, NPCs, world spots
  markers() {
    const f = this.f, out = [];
    for (const it of f.built?.interact || []) {
      if (it.kind === 'chest' && !it.open) out.push({ x: it.c.i + 0.5, z: it.c.j + 0.5, k: 'chest' });
      if (it.kind === 'save') out.push({ x: it.c.i + 0.5, z: it.c.j + 0.5, k: 'save' });
      if (it.kind === 'board') out.push({ x: it.c.i + 1.5, z: it.c.j + 0.5, k: 'board' });
      if (it.kind === 'door') out.push({ x: it.x, z: it.z - 1, k: 'door' });
    }
    for (const o of f.def.objs || []) {
      if (o.k === 'warp' && (!o.cond || this.G.cond(o.cond))) out.push({ x: o.x + (o.w || 1) / 2, z: o.z + (o.d || 1) / 2, k: 'exit', name: o.label });
      if (['town', 'dungeon', 'spot'].includes(o.k) && o.name) out.push({ x: o.x + 0.5, z: o.z + 0.5, k: o.k === 'town' ? 'town' : 'dungeon', name: o.name, visited: o.to && this.S.flags['visit_' + o.to[0]], locked: o.cond && !this.G.cond(o.cond), spot: o });
    }
    for (const n of f.npcs || []) out.push({ x: n.x, z: n.z, k: 'npc' });
    return out;
  }
  // ---------------------------------------------------------------- the corner minimap: rotates with the camera, hero in the middle
  draw() {
    const cv = this.mini, g = this.mctx, f = this.f; if (!cv || !f?.player || cv.offsetParent === null) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), size = cv.clientWidth || 140;
    if (cv.width !== Math.round(size * dpr)) { cv.width = cv.height = Math.round(size * dpr); }
    const W = cv.width, R = W / 2, zoom = (f.world ? 4 : 6) * dpr; // screen px per cell
    const p = f.player;
    g.save(); g.clearRect(0, 0, W, W);
    g.beginPath(); g.arc(R, R, R - 1, 0, 7); g.clip();
    g.fillStyle = '#0a0c18'; g.fillRect(0, 0, W, W);
    g.translate(R, R); g.rotate(f.yawCur || 0); g.scale(zoom / CELL, zoom / CELL); g.translate(-p.x * CELL, -p.z * CELL);
    g.imageSmoothingEnabled = false;
    g.drawImage(this.base, 0, 0);
    if (!this.open) g.drawImage(this.fog, 0, 0, this.W * CELL, this.H * CELL);
    for (const m of this.markers()) if (this.open || this.bits[Math.floor(m.z) * this.W + Math.floor(m.x)]) mark(g, m, CELL, (f.yawCur || 0), zoom / CELL);
    g.restore();
    // the hero: an arrow pointing where they face, relative to the camera
    g.save(); g.translate(R, R);
    g.rotate(Math.PI - (p.spr?.ang ?? 0) + (f.yawCur || 0));
    g.fillStyle = '#ffe04a'; g.strokeStyle = '#3a2a00'; g.lineWidth = 1.5 * dpr;
    g.beginPath(); g.moveTo(0, -7 * dpr); g.lineTo(5 * dpr, 6 * dpr); g.lineTo(0, 3 * dpr); g.lineTo(-5 * dpr, 6 * dpr); g.closePath(); g.fill(); g.stroke();
    g.restore();
    // north marker on the rim
    const nx = R + Math.sin(f.yawCur || 0) * (R - 9 * dpr), ny = R - Math.cos(f.yawCur || 0) * (R - 9 * dpr);
    g.fillStyle = '#ff6a5a'; g.font = `bold ${10 * dpr}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('N', nx, ny);
    g.strokeStyle = 'rgba(232,236,248,0.9)'; g.lineWidth = 2 * dpr; g.beginPath(); g.arc(R, R, R - 1.5 * dpr, 0, 7); g.stroke();
  }
  // ---------------------------------------------------------------- the full map
  async openFull() {
    const f = this.f, G = this.G; if (!f) return;
    this.S.explored[this.id] = encode(this.bits);
    const wrap = document.createElement('div'); wrap.className = 'mapview';
    const enc = f.encTable?.(); const lv = enc?.lv;
    const ms = this.markers(); const chests = ms.filter(m => m.k === 'chest').length;
    const totalChests = (f.built?.interact || []).filter(i => i.kind === 'chest').length;
    const travel = this.travelList();
    wrap.innerHTML = `<div class="mv-box"><div class="mv-head"><b>${f.def.name || ''}</b><span>${this.open ? '' : `探索 ${Math.round(this.explored() * 100)}%　`}寶箱 ${totalChests - chests}/${totalChests}${lv ? `　怪物 Lv ${Math.max(1, lv - 2)}~${lv + 3}` : '　安全區域'}</span></div>
      <div class="mv-body"><canvas></canvas></div>
      <div class="mv-legend"><span><i style="background:#ffe04a"></i>你</span><span><i style="background:#e8b040"></i>寶箱</span><span><i style="background:#6ae0ff"></i>存檔</span><span><i style="background:#8aff8a"></i>出口</span><span><i style="background:#fff"></i>人物</span>${f.world ? '<span><i style="background:#ff8a6a"></i>城鎮</span><span><i style="background:#c8a0ff"></i>迷宮</span>' : ''}</div>
      <div class="mv-foot">${travel.length ? '<button class="mv-travel">傳送到其他城鎮</button>' : ''}<button class="mv-close">關閉</button></div></div>`;
    document.getElementById('ui').appendChild(wrap);
    const cv = wrap.querySelector('canvas'), body = wrap.querySelector('.mv-body');
    const bw = body.clientWidth, bh = body.clientHeight, sc = Math.max(1, Math.min(bw / (this.W * CELL), bh / (this.H * CELL)) * (window.devicePixelRatio || 1));
    cv.width = Math.round(this.W * CELL * sc); cv.height = Math.round(this.H * CELL * sc);
    cv.style.width = Math.round(cv.width / (window.devicePixelRatio || 1)) + 'px';
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.scale(sc, sc);
    g.drawImage(this.base, 0, 0);
    if (!this.open) g.drawImage(this.fog, 0, 0, this.W * CELL, this.H * CELL);
    for (const m of ms) if (this.open || this.bits[Math.floor(m.z) * this.W + Math.floor(m.x)]) mark(g, m, CELL, 0, sc, true);
    const p = f.player; g.save(); g.translate(p.x * CELL, p.z * CELL); g.rotate(-(p.spr?.ang ?? 0) + Math.PI);
    g.fillStyle = '#ffe04a'; g.strokeStyle = '#000'; g.lineWidth = 1.2; const s = this.f.world ? 9 : 7;
    g.beginPath(); g.moveTo(0, -s); g.lineTo(s * 0.7, s * 0.8); g.lineTo(0, s * 0.4); g.lineTo(-s * 0.7, s * 0.8); g.closePath(); g.fill(); g.stroke(); g.restore();
    G.audio.sfx('ok');
    const pick = await new Promise((res) => {
      const off = G.input.on((k) => { if (k === 'cancel' || k === 'menu' || k === 'map') { off(); res(null); } if (k === 'ok' && travel.length) { off(); res('travel'); } });
      wrap.querySelector('.mv-close').onclick = () => { off(); res(null); };
      const tb = wrap.querySelector('.mv-travel'); if (tb) tb.onclick = () => { off(); res('travel'); };
    });
    wrap.remove();
    if (pick === 'travel') {
      const i = await G.ui.choose(travel.map(t => ({ label: t.name, sub: t.here ? '目前所在' : '', disabled: t.here })), { title: '傳送到哪裡？' });
      if (i >= 0) return travel[i];
    }
    return null;
  }
  // visited towns you can jump to (from the world map or from inside a town)
  travelList() {
    const f = this.f; if (!(f.world || f.def.town)) return [];
    const W = (this.G.MAPS || {}).world; if (!W) return [];
    return (W.objs || []).filter(o => o.k === 'town' && o.to && this.S.flags['visit_' + o.to[0]] && (!o.cond || this.G.cond(o.cond))).map(o => ({ name: o.name, to: o.to, spot: o, here: o.to[0] === this.id }));
  }
}

function mark(g, m, cell, rot, sc, big) {
  const x = m.x * cell, y = m.z * cell, r = (big ? 4 : 3.2) * cell / 6 / Math.max(0.6, sc) * (big ? 1.4 : 1.6);
  g.save(); g.translate(x, y); g.rotate(-rot);
  const col = { chest: '#e8b040', save: '#6ae0ff', exit: '#8aff8a', door: '#c8a87a', board: '#ffd08a', npc: '#ffffff', town: '#ff8a6a', dungeon: '#c8a0ff' }[m.k] || '#fff';
  g.fillStyle = m.locked ? '#7a7a8a' : col; g.strokeStyle = 'rgba(0,0,0,0.7)'; g.lineWidth = Math.max(0.6, r * 0.25);
  g.beginPath();
  if (m.k === 'save' || m.k === 'dungeon') { g.moveTo(0, -r * 1.3); g.lineTo(r, 0); g.lineTo(0, r * 1.3); g.lineTo(-r, 0); g.closePath(); }
  else if (m.k === 'exit') { g.moveTo(0, -r * 1.2); g.lineTo(r * 1.1, r * 0.8); g.lineTo(-r * 1.1, r * 0.8); g.closePath(); }
  else if (m.k === 'npc') g.arc(0, 0, r * 0.7, 0, 7);
  else if (m.k === 'town') { g.rect(-r, -r * 0.5, r * 2, r * 1.4); g.moveTo(-r * 1.2, -r * 0.5); g.lineTo(0, -r * 1.5); g.lineTo(r * 1.2, -r * 0.5); }
  else g.rect(-r, -r * 0.8, r * 2, r * 1.6);
  g.fill(); g.stroke();
  if (big && m.name && (m.k === 'town' || m.k === 'dungeon')) {
    g.font = `bold ${Math.max(5, 9 / sc * 1.6)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'top';
    g.lineWidth = Math.max(1, 2.5 / sc * 1.4); g.strokeStyle = 'rgba(0,0,0,0.85)'; g.fillStyle = m.locked ? '#a0a0b0' : '#fff';
    const label = m.locked ? '？？？' : m.name; g.strokeText(label, 0, r * 1.6); g.fillText(label, 0, r * 1.6);
  }
  g.restore();
}
function shade(hex, k) { const n = parseInt((hex || '#888888').slice(1), 16); const f = (v) => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)))); return `rgb(${f(n >> 16 & 255)},${f(n >> 8 & 255)},${f(n & 255)})`; }
function encode(bits) { let s = ''; for (let i = 0; i < bits.length; i += 8) { let b = 0; for (let k = 0; k < 8; k++) if (bits[i + k]) b |= 1 << k; s += String.fromCharCode(b); } return btoa(s); }
function decode(str, n) { const out = new Uint8Array(n); if (!str) return out; try { const s = atob(str); for (let i = 0; i < n; i++) out[i] = (s.charCodeAt(i >> 3) >> (i & 7)) & 1; } catch (e) { } return out; }
