// Paper dolls: people as Paper Mario-style cut-outs. Every figure is a set of flat parts drawn with the canvas (inked
// outlines, soft cel shading, big readable faces), hinged like a paper puppet and always turned to the reader. A figure
// has two drawings, three-quarter views from the front and from the back; turning left or right flips the card over.
// The parts of one look are packed into one texture; the joints take the same poses as the voxel people.
import * as THREE from '../lib/three.module.min.js';
import { shade, mix } from './pixel.js?v=19';
import { VoxelPerson, isPaper, easeBack, tintWeapon, weaponGrid, WPN_TILT, SKINS, POSES, JOINTS, DIR_ANGLE, camYaw, VS, POP_T, FLIP_T, BWIN, toLayer, renderVoxelPortrait } from './voxel.js?v=19';

const PPU = 8;                        // texture pixels per body unit (a person is about 46 units tall)
const INK = '#2b1d2c', LW = 0.36;     // outline colour and half its width
const HIP = 15.5;                     // hip height
const GOLD = '#e8c050', TAU = Math.PI * 2;
const skinOf = (s) => SKINS[s.skin] || s.skin || SKINS.light;
const rgba = (h, a) => { const n = parseInt(h.slice(1, 7), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

// ---------------------------------------------------------------- drawing helpers (units, y down, pivot at 0,0)
function part(x0, x1, y0, y1, draw) {
  const pad = 0.9; x0 -= pad; x1 += pad; y0 -= pad; y1 += pad;
  const cv = document.createElement('canvas'); cv.width = Math.ceil((x1 - x0) * PPU); cv.height = Math.ceil((y1 - y0) * PPU);
  const g = cv.getContext('2d'); g.translate(-x0 * PPU, -y0 * PPU); g.scale(PPU, PPU); g.lineJoin = 'round'; g.lineCap = 'round';
  draw(g);
  return { cv, x0, y0, w: cv.width / PPU, h: cv.height / PPU };
}
// a shape and its outline: the stroke goes down first, so the fill covers its inner half (and any seams in a union)
function ink(g, path, fill, lw = LW, rule = 'nonzero') { g.beginPath(); path(g); g.lineWidth = lw * 2; g.strokeStyle = INK; g.stroke(); g.fillStyle = fill; g.fill(rule); }
// shade the far side of the last shape (everything left of x: the figure faces right), fading out over `soft`
function cel(g, path, x, col, soft = 1.2) {
  g.save(); g.beginPath(); path(g); g.clip();
  const gr = g.createLinearGradient(x - soft, 0, x + soft, 0); gr.addColorStop(0, rgba(col, 0.75)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; g.fillRect(x - 60, -80, 60 + soft, 160); g.restore();
}
function clipped(g, path, f) { g.save(); g.beginPath(); path(g); g.clip(); f(); g.restore(); }
function stroke(g, col, w, f) { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); f(g); g.stroke(); }
const ell = (cx, cy, rx, ry, r = 0) => (p) => p.ellipse(cx, cy, rx, ry, r, 0, TAU);

// ---------------------------------------------------------------- the parts
function legPart(s, far) {
  const d = (c) => (far ? shade(c, -0.2) : c);
  const L = d(s.legs || '#3a3048'), B = d(s.boots || '#5a3a2a');
  return part(-2.8, 5.2, -0.8, HIP + 0.2, (g) => {
    const pants = (p) => { p.moveTo(-2.3, -0.6); p.lineTo(2.4, -0.6); p.quadraticCurveTo(2.6, 5, 1.95, 10.4); p.lineTo(-1.85, 10.4); p.quadraticCurveTo(-2.6, 5, -2.3, -0.6); p.closePath(); };
    ink(g, pants, L); cel(g, pants, -0.5, shade(L, -0.4));
    stroke(g, rgba(shade(L, -0.45), 0.6), 0.22, (p) => { p.moveTo(0.5, 6.3); p.quadraticCurveTo(1.3, 6.8, 2.1, 6.5); });
    if (s.knee) { const k = ell(1.1, 6.6, 1.75, 1.5); ink(g, k, d(s.knee)); cel(g, k, 0.5, shade(s.knee, -0.35), 0.8); }
    const boot = (p) => { p.moveTo(-2.15, 9.3); p.lineTo(2.2, 9.3); p.lineTo(2.3, 12.3); p.quadraticCurveTo(4.9, 12.5, 4.95, 14.3); p.lineTo(4.95, HIP); p.lineTo(-2.3, HIP); p.closePath(); };
    ink(g, boot, B); cel(g, boot, -0.4, shade(B, -0.4));
    clipped(g, boot, () => {
      g.fillStyle = shade(B, -0.42); g.fillRect(-3, HIP - 0.75, 9, 1);
      g.fillStyle = shade(B, 0.2); g.fillRect(-3, 9.3, 6, 1.0);
      g.fillStyle = 'rgba(255,255,255,0.2)'; g.beginPath(); g.ellipse(3.6, 13.2, 0.9, 0.32, -0.3, 0, TAU); g.fill();
    });
    if (s.sabaton) ink(g, ell(3.2, 13.5, 1.8, 1.0, -0.15), d(s.sabaton), 0.28);
  });
}

function torsoPart(s, back) {
  const skin = skinOf(s), T = s.top || '#3d5a9a', T2 = s.top2 || shade(T, -0.2), belt = s.belt || '#6a4628';
  return part(-7.4, 7.8, -16, s.robe ? 13.4 : 5.4, (g) => {
    ink(g, (p) => p.rect(-1.0, -15.4, 2.4, 2.8), shade(skin, -0.14), 0.3);
    let body;
    if (s.robe) {
      body = (p) => { p.moveTo(-3.7, -13.6); p.quadraticCurveTo(-5.0, -5, -6.5, 12.6); p.quadraticCurveTo(0.3, 13.5, 7.1, 12.6); p.quadraticCurveTo(5.5, -5, 4.3, -13.6); p.quadraticCurveTo(0.3, -14.7, -3.7, -13.6); p.closePath(); };
      ink(g, body, T);
      clipped(g, body, () => {
        g.fillStyle = s.top2 ? T2 : shade(T, -0.25); g.fillRect(-8, 10.9, 16, 3);
        if (s.trim) { g.fillStyle = s.trim; g.fillRect(-8, 10.4, 16, 0.55); }
        if (!back && s.top2) { g.fillStyle = T2; g.beginPath(); g.moveTo(0.9, -13.8); g.lineTo(2.4, -13.8); g.lineTo(3.2, 13); g.lineTo(1.0, 13); g.fill(); }
        g.strokeStyle = rgba(shade(T, -0.45), 0.45); g.lineWidth = 0.22;
        for (const x of [-3.4, 5.0]) { g.beginPath(); g.moveTo(x * 0.45, -1); g.quadraticCurveTo(x * 0.9, 6, x * 1.15, 12.4); g.stroke(); }
      });
    } else {
      const skirt = (p) => { p.moveTo(-4.3, -2); p.lineTo(-5.2, 4.6); p.quadraticCurveTo(0.3, 5.3, 5.7, 4.6); p.lineTo(4.5, -2); p.closePath(); };
      ink(g, skirt, shade(T, -0.08));
      clipped(g, skirt, () => {
        g.fillStyle = s.top2 ? T2 : shade(T, -0.3); g.fillRect(-7, 3.5, 14, 2.5);
        if (!back) { g.strokeStyle = rgba(shade(T, -0.5), 0.6); g.lineWidth = 0.22; g.beginPath(); g.moveTo(1.7, -1); g.lineTo(2.0, 4.9); g.stroke(); }
      });
      cel(g, skirt, -1.6, shade(T, -0.42));
      body = (p) => { p.moveTo(-3.9, 0); p.quadraticCurveTo(-4.6, -7, -4.1, -12.4); p.quadraticCurveTo(-3.7, -14.0, -2.1, -14.2); p.lineTo(2.6, -14.2); p.quadraticCurveTo(4.5, -13.9, 4.7, -11.9); p.quadraticCurveTo(5.2, -8.4, 4.3, -4.6); p.lineTo(4.2, 0); p.closePath(); };
      ink(g, body, T);
    }
    cel(g, body, -1.4, shade(T, -0.42), 1.6);
    clipped(g, body, () => {
      g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.ellipse(back ? -0.5 : 2.8, -10.5, 2.2, 3, 0.2, 0, TAU); g.fill();
      if (s.top2) { g.fillStyle = s.trim || shade(T2, 0.05); g.fillRect(-7, -14.8, 15, 1.5); }
      if (!back && !s.robe) { g.fillStyle = T2; g.fillRect(0.95, -13.6, 1.5, 11.6); g.fillStyle = shade(T2, 0.4); for (let y = -11.6; y < -2.6; y += 2.7) { g.beginPath(); g.arc(1.7, y, 0.32, 0, TAU); g.fill(); } }
      if (!back && s.collar) { g.fillStyle = s.collar; g.beginPath(); g.moveTo(-2.6, -14.8); g.lineTo(3.8, -14.8); g.lineTo(2.6, -12.0); g.lineTo(1.4, -13.2); g.lineTo(0.0, -12.0); g.closePath(); g.fill(); }
      if (!back && s.straps) { g.strokeStyle = s.straps; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-3.6, -14); g.lineTo(4.6, -2.6); g.stroke(); }
    });
    if (s.plate >= 2) {
      const pl = back ? (p) => { p.moveTo(-4.0, -13.4); p.quadraticCurveTo(3.4, -13.9, 3.0, -9); p.quadraticCurveTo(2.4, -5.2, -1.0, -4.8); p.quadraticCurveTo(-4.4, -6, -4.0, -13.4); p.closePath(); }
        : (p) => { p.moveTo(-3.4, -13.4); p.quadraticCurveTo(5.4, -13.9, 4.8, -9); p.quadraticCurveTo(4.3, -5.3, 1.3, -4.6); p.quadraticCurveTo(-3.3, -5.6, -3.4, -13.4); p.closePath(); };
      ink(g, pl, shade(T, 0.18), 0.3); cel(g, pl, -0.8, shade(T, -0.3));
      clipped(g, pl, () => { g.fillStyle = 'rgba(255,255,255,0.28)'; g.beginPath(); g.ellipse(back ? 0 : 2.8, -11.2, 1.0, 1.9, 0.3, 0, TAU); g.fill(); });
      if (s.plate >= 4) { g.beginPath(); pl(g); g.strokeStyle = GOLD; g.lineWidth = 0.4; g.stroke(); }
      if (s.plate >= 6 && !back) ink(g, (p) => { p.moveTo(1.9, -10.6); p.lineTo(2.9, -9.2); p.lineTo(1.9, -7.8); p.lineTo(0.9, -9.2); p.closePath(); }, '#d84a4a', 0.25);
    }
    if (s.emblem && !back) ink(g, (p) => { p.moveTo(2.0, -11.0); p.lineTo(3.1, -9.6); p.lineTo(2.0, -8.2); p.lineTo(0.9, -9.6); p.closePath(); }, s.emblem, 0.26);
    // belt and buckle; a pouch on the hip
    if (!s.robe) ink(g, (p) => p.roundRect(-5.5, -2.6, 2.0, 2.8, 0.5), '#6a4a2a', 0.26);
    ink(g, (p) => { p.moveTo(-4.45, -2.8); p.lineTo(4.65, -2.8); p.lineTo(4.65, -1.0); p.lineTo(-4.45, -1.0); p.closePath(); }, belt, 0.3);
    if (!back) { ink(g, (p) => p.rect(1.0, -3.05, 1.7, 2.3), s.buckle || GOLD, 0.26); g.fillStyle = shade(belt, -0.3); g.fillRect(1.5, -2.4, 0.7, 1.0); }
    if (s.sash && !back) {
      const sh = (p) => { p.moveTo(1.0, -1.2); p.lineTo(2.8, -1.2); p.lineTo(3.2, s.robe ? 9.5 : 6.4); p.lineTo(1.2, s.robe ? 9.5 : 6.4); p.closePath(); };
      ink(g, sh, s.sash, 0.28); clipped(g, sh, () => { g.fillStyle = s.trim || GOLD; g.fillRect(0, (s.robe ? 9.5 : 6.4) - 1.0, 4, 1.2); });
    }
  });
}

function armPart(s, far) {
  const d = (c) => (far ? shade(c, -0.2) : c);
  const T = d(s.top || '#3d5a9a'), hand = s.gloves ? d(s.gloves) : d(skinOf(s));
  const cuff = d(s.cuff || (s.gloves ? shade(s.gloves, -0.2) : shade(s.top || '#3d5a9a', -0.25)));
  return part(-3, 3, -5.2, 11.8, (g) => {
    const sleeve = (p) => { p.moveTo(-1.65, 0); p.arc(0, 0, 1.65, Math.PI, 0); p.lineTo(1.45, 8.4); p.lineTo(-1.35, 8.4); p.closePath(); };
    ink(g, sleeve, T); cel(g, sleeve, -0.3, shade(T, -0.42), 0.9);
    ink(g, (p) => p.rect(-1.55, 7.4, 3.1, 1.4), cuff, 0.28);
    const h = (p) => { p.arc(0.15, 10.0, 1.5, 0, TAU); p.moveTo(1.85, 9.3); p.arc(1.2, 9.3, 0.65, 0, TAU); };
    ink(g, h, hand); cel(g, h, -0.3, shade(hand, -0.3), 0.8);
    if (s.pauldron) {
      const pd = d(s.pauldron), pp = (p) => { p.moveTo(-2.7, 1.6); p.quadraticCurveTo(-2.9, -2.6, 0, -2.7); p.quadraticCurveTo(2.9, -2.6, 2.8, 1.6); p.quadraticCurveTo(0, 2.6, -2.7, 1.6); p.closePath(); };
      if (s.pauldronSpike) ink(g, (p) => { p.moveTo(-0.9, -2.2); p.lineTo(-0.1, -5.0); p.lineTo(0.9, -2.2); p.closePath(); }, '#f4f0e0', 0.25);
      ink(g, pp, pd); cel(g, pp, -0.6, shade(pd, -0.38));
      stroke(g, 'rgba(255,255,255,0.4)', 0.3, (p) => p.arc(0, -0.2, 1.8, -2.6, -0.9));
    }
  });
}

// the head: a round skull with the jaw toward the front, the face on the right-hand side of it
const skull = (p) => { p.ellipse(0.3, -7.6, 7.2, 6.9, 0, 0, TAU); p.moveTo(7.2, -5.6); p.quadraticCurveTo(5.8, -0.4, 2.6, 0.3); p.quadraticCurveTo(-2.0, 0.1, -4.4, -5.6); p.closePath(); }; // both wound clockwise, so the union fills
function eye(g, cx, cy, w, col, mode, dir) {
  const h = w * 2.3;
  if (mode === 'blink') { stroke(g, INK, 0.42, (p) => { p.moveTo(cx - w, cy + 0.1); p.quadraticCurveTo(cx, cy + 0.9, cx + w * 1.1, cy + 0.1); }); return; }
  if (mode === 'hurt') { stroke(g, INK, 0.45, (p) => { p.moveTo(cx - w * dir, cy - 0.9); p.lineTo(cx + w * 0.7 * dir, cy); p.lineTo(cx - w * dir, cy + 0.9); }); return; }
  g.fillStyle = '#fbf8f4'; g.beginPath(); g.ellipse(cx, cy, w, h * 0.5, 0, 0, TAU); g.fill();
  const gr = g.createLinearGradient(0, cy - h * 0.5, 0, cy + h * 0.5); gr.addColorStop(0, shade(col, -0.5)); gr.addColorStop(1, shade(col, 0.4));
  g.fillStyle = gr; g.beginPath(); g.ellipse(cx + w * 0.14, cy + 0.12, w * 0.8, h * 0.45, 0, 0, TAU); g.fill();
  g.fillStyle = '#140e1c'; g.beginPath(); g.ellipse(cx + w * 0.18, cy + 0.15, w * 0.38, h * 0.24, 0, 0, TAU); g.fill();
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(cx - w * 0.18, cy - h * 0.17, w * 0.32, 0, TAU); g.fill(); g.beginPath(); g.arc(cx + w * 0.42, cy + h * 0.2, w * 0.15, 0, TAU); g.fill();
  stroke(g, INK, 0.55, (p) => { p.moveTo(cx - w * 1.15, cy - h * 0.2); p.quadraticCurveTo(cx, cy - h * 0.68, cx + w * 1.25, cy - h * 0.32); });
}
function face(g, s, mode) {
  const skin = skinOf(s), col = s.eyes || '#3a2a48', brow = shade(s.hair || '#6a4a2a', -0.35);
  g.fillStyle = 'rgba(255,110,110,0.26)'; for (const [x, w] of [[0.6, 1.3], [5.6, 0.9]]) { g.beginPath(); g.ellipse(x, -2.7, w, 0.55, 0, 0, TAU); g.fill(); }
  eye(g, 1.0, -5.3, 1.3, col, mode, 1); eye(g, 4.9, -5.3, 1.0, col, mode, -1);
  stroke(g, rgba(shade(skin, -0.45), 0.85), 0.28, (p) => { p.moveTo(6.0, -3.6); p.lineTo(6.4, -2.9); p.lineTo(5.9, -2.75); });
  if (mode === 'hurt') ink(g, ell(3.7, -1.4, 0.6, 0.45), '#6a2a2a', 0.2);
  else stroke(g, '#7a3030', 0.3, (p) => { p.moveTo(2.9, -1.6); p.quadraticCurveTo(3.7, -1.0, 4.5, -1.7); });
  return brow;
}
function brows(g, brow, mode) {
  const up = mode === 'hurt' ? -0.4 : 0;
  stroke(g, brow, 0.5, (p) => { p.moveTo(-0.5, -8.7 + up); p.quadraticCurveTo(1.0, -9.5, 2.5, -8.9 - up); });
  stroke(g, brow, 0.45, (p) => { p.moveTo(4.0, -8.9 - up); p.quadraticCurveTo(5.0, -9.4, 6.1, -8.8 + up); });
}
const ear = (g, s, x) => { const e = ell(x, -5.3, 1.15, 1.55); ink(g, e, skinOf(s), 0.3); stroke(g, rgba(shade(skinOf(s), -0.4), 0.8), 0.25, (p) => p.arc(x, -5.3, 0.6, -1.2, 1.6)); };

// hair: a cap over the top and back that ends in bangs at the front
function hairCap(style) {
  const nape = style === 'bob' ? 0.4 : style === 'long' || style === 'braid' ? -1.2 : -2.6, spiky = style === 'spiky', lock = style === 'bob' || style === 'long';
  return (p) => {
    p.moveTo(-1.3, -6.0);
    if (lock) { p.quadraticCurveTo(-0.3, -2.4, -0.8, 1.2); p.lineTo(-3.4, 1.6); p.lineTo(-4.8, nape); }  // a lock over the ear
    else { p.lineTo(-1.5, -3.4); p.lineTo(-2.3, -3.2); p.lineTo(-4.5, nape); } // a sideburn, then round the ear
    p.lineTo(-6.8, nape - 0.6); p.quadraticCurveTo(-8.9, -10, -4.6, -14.7); p.quadraticCurveTo(1.0, -17.1, 6.6, -12.8); p.quadraticCurveTo(8.3, -10.5, 7.7, -8.0);
    // bangs: strands that sweep toward the face, each a curve from a parting down to its tip
    const tip = spiky ? 1.0 : 0, strands = [[7.4, -10.2, 6.6, -7.9 + tip * 0.4], [6.0, -10.6, 4.6, -7.3 + tip], [3.8, -10.8, 2.4, -7.6 + tip], [1.6, -10.6, 0.2, -7.9 + tip]];
    for (const [px_, py, tx, ty] of strands) { p.lineTo(px_, py); p.quadraticCurveTo(px_ - 0.2, ty + 0.6, tx, ty); }
    p.lineTo(-0.6, -9.6); p.closePath();
  };
}
function hairFront(g, s) {
  const style = s.hairStyle || 'short', H = s.hair || '#6a4a2a', HL = shade(H, 0.32), HD = shade(H, -0.28);
  if (style === 'bald') { if (s.hair) ink(g, (p) => { p.moveTo(-1.6, -3.8); p.lineTo(-2.2, -7.6); p.quadraticCurveTo(-5.6, -9.4, -7.4, -8.0); p.quadraticCurveTo(-7.6, -4.4, -6.2, -2.6); p.closePath(); }, H); return; }
  if (style === 'spiky') for (const [x, y, tx, ty] of [[-6.5, -6, -11.6, -9.5], [-6.8, -11, -11.2, -15.5], [-3.5, -14.2, -6.0, -19.6], [1.0, -15.6, 0.6, -20.6], [5.0, -14.2, 7.6, -18.0]]) {
    const sp = (p) => { p.moveTo(x - 2.4, y + 1.2); p.lineTo(tx, ty); p.lineTo(x + 2.0, y - 1.4); p.closePath(); }; ink(g, sp, H); cel(g, sp, x - 1, HD);
  }
  const cap = hairCap(style); ink(g, cap, H); cel(g, cap, -3.6, HD, 1.8);
  clipped(g, cap, () => {
    stroke(g, rgba(HL, 0.85), 0.75, (p) => p.arc(0.6, -8.2, 6.0, -2.6, -1.25));
    g.strokeStyle = rgba(HD, 0.6); g.lineWidth = 0.22; for (const [x0, y0, x1, y1] of [[-3.4, -14, -6.2, -6], [0.4, -15.2, -2.2, -9.6], [4.4, -13.4, 3.6, -9.8]]) { g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 - 1, (y0 + y1) / 2, x1, y1); g.stroke(); }
  });
  if (style === 'ponytail') ink(g, ell(-6.9, -10.6, 0.95, 1.1), '#c84a4a', 0.28);
}
function hairBackPart(s, back) {
  const style = s.hairStyle || 'short', H = s.hair || '#6a4a2a', HD = shade(H, -0.28);
  if (style === 'long') return part(-9.4, 8.6, -14, 14.6, (g) => {
    const pn = back ? (p) => { p.moveTo(-7.2, -12); p.quadraticCurveTo(-9.0, -2, -7.6, 13.8); p.quadraticCurveTo(0, 15.0, 7.0, 13.4); p.quadraticCurveTo(8.4, -2, 7.4, -10.5); p.closePath(); }
      : (p) => { p.moveTo(-7.2, -12); p.quadraticCurveTo(-9.3, -2, -8.2, 13.6); p.quadraticCurveTo(-3, 15.4, 1.6, 13.0); p.lineTo(3.2, -6); p.closePath(); };
    ink(g, pn, H); cel(g, pn, -4.5, HD, 2.4);
    clipped(g, pn, () => { g.strokeStyle = rgba(HD, 0.55); g.lineWidth = 0.24; for (let x = -6; x <= 6; x += 2.4) { g.beginPath(); g.moveTo(x * 0.8, -6); g.quadraticCurveTo(x, 4, x * 1.05, 14); g.stroke(); } });
  });
  if (style === 'ponytail' && !back) return part(-12.8, -4, -13, 6.6, (g) => {
    const tl = (p) => { p.moveTo(-6.4, -12.2); p.quadraticCurveTo(-12.6, -9, -10.7, 1.0); p.quadraticCurveTo(-9.9, 4.6, -7.6, 6.0); p.quadraticCurveTo(-8.6, 1.0, -6.0, -7.2); p.closePath(); };
    ink(g, tl, H); cel(g, tl, -8.6, HD, 1.6);
  });
  if (style === 'braid' && !back) return part(-8.6, -3.2, -6, 15, (g) => braid(g, H, -5.8, -4.6, -0.14));
  return null;
}
function braid(g, H, x, y, lean) {
  const HD = shade(H, -0.28);
  for (let i = 0; i < 8; i++) { const b = ell(x + i * lean * 2.2, y + i * 2.1, 1.55 - i * 0.05, 1.35); ink(g, b, i % 2 ? HD : H, 0.28); }
  ink(g, (p) => p.rect(x + 8 * lean * 2.2 - 1.0, y + 16.4, 2.0, 1.0), '#6ac8f0', 0.24);
  ink(g, (p) => { const bx = x + 8 * lean * 2.2; p.moveTo(bx - 1.2, y + 17.4); p.lineTo(bx, y + 19.4); p.lineTo(bx + 1.2, y + 17.4); p.closePath(); }, H, 0.24);
}
// the back of the head: hair over almost all of it
function headBack(g, s) {
  const style = s.hairStyle || 'short', H = s.hair || '#6a4a2a', HL = shade(H, 0.32), HD = shade(H, -0.28), skin = skinOf(s);
  ink(g, skull, skin); cel(g, skull, -2, shade(skin, -0.3), 3);
  if (style !== 'bob' && style !== 'long') ear(g, s, 4.0);
  if (style === 'bald') { if (s.hair) ink(g, (p) => { p.moveTo(-6.8, -8.6); p.quadraticCurveTo(0.3, -9.6, 7.3, -8.2); p.quadraticCurveTo(7.0, -4.8, 5.0, -3.8); p.quadraticCurveTo(0.3, -2.4, -5.6, -3.6); p.quadraticCurveTo(-7.4, -5.4, -6.8, -8.6); p.closePath(); }, H);
    stroke(g, 'rgba(255,255,255,0.35)', 0.7, (p) => p.arc(-0.6, -9.6, 4.4, -2.6, -1.4)); return; }
  if (style === 'spiky') for (const [x, y, tx, ty] of [[-6.4, -7, -11.4, -9.4], [-5.8, -12, -9.8, -17.2], [-1.2, -14.8, -1.6, -20.6], [3.6, -14.2, 6.0, -19.4], [6.6, -9.6, 11.0, -12.0]]) {
    const sp = (p) => { p.moveTo(x - 2.2, y + 1.4); p.lineTo(tx, ty); p.lineTo(x + 2.2, y - 1.0); p.closePath(); }; ink(g, sp, H); cel(g, sp, x - 1, HD);
  }
  const nape = style === 'bob' ? 0.6 : style === 'long' ? -1 : -2.4;
  const cap = (p) => { p.moveTo(-6.9, nape - 0.4); p.quadraticCurveTo(-9.0, -10, -4.6, -14.6); p.quadraticCurveTo(1.0, -17.0, 6.0, -13.8); p.quadraticCurveTo(8.6, -10.4, 7.6, nape - 0.8); p.quadraticCurveTo(0.3, nape + 1.2, -6.9, nape - 0.4); p.closePath(); };
  ink(g, cap, H); cel(g, cap, -2.4, HD, 3);
  clipped(g, cap, () => {
    stroke(g, rgba(HL, 0.8), 0.8, (p) => p.arc(0.0, -8.0, 6.2, -2.5, -1.0));
    g.strokeStyle = rgba(HD, 0.65); g.lineWidth = 0.24; for (let x = -5; x <= 5; x += 2.5) { g.beginPath(); g.moveTo(x * 0.3 + 0.3, -15); g.quadraticCurveTo(x * 1.1, -8, x * 1.15, nape); g.stroke(); }
  });
  if (style === 'ponytail') { const tl = (p) => { p.moveTo(-1.6, -10); p.quadraticCurveTo(-3.6, -2, -1.6, 6.6); p.quadraticCurveTo(0.6, 7.8, 1.4, 6.4); p.quadraticCurveTo(1.6, -2, 1.0, -10); p.closePath(); }; ink(g, tl, H); cel(g, tl, -0.6, HD, 1.2); ink(g, ell(-0.3, -10.2, 1.4, 1.0), '#c84a4a', 0.28); }
  if (style === 'braid') braid(g, H, -0.2, -3.8, 0.02);
}

// hats and helmets, drawn last on the head
function hat(g, s, back) {
  const C = s.hatColor || '#4a3a8a', CL = shade(C, 0.25), CD = shade(C, -0.3), band = s.hatBand, k = s.hat;
  if (k === 'wizard') {
    const brim = ell(0.6, -12.6, 10.6, 2.4); ink(g, brim, CD);
    const cone = (p) => { p.moveTo(-5.4, -12.9); p.quadraticCurveTo(-4.3, -23, -9.4, -28.6); p.quadraticCurveTo(0.8, -24.6, 6.6, -12.9); p.quadraticCurveTo(0.6, -11.8, -5.4, -12.9); p.closePath(); };
    ink(g, cone, C); cel(g, cone, -2.0, CD, 2.4);
    clipped(g, cone, () => { if (band) { g.fillStyle = band; g.fillRect(-8, -15.4, 16, 2.0); } g.fillStyle = 'rgba(255,255,255,0.14)'; g.beginPath(); g.ellipse(2.6, -17, 1.0, 4.0, -0.3, 0, TAU); g.fill(); });
    return;
  }
  if (k === 'hood') {
    const hd = (p) => { p.moveTo(-7.6, 1.6); p.quadraticCurveTo(-10.2, -9, -5.6, -15.0); p.quadraticCurveTo(1.0, -18.2, 6.9, -13.4); p.quadraticCurveTo(9.5, -9.6, 8.4, -4.0); p.quadraticCurveTo(7.7, 0.9, 5.0, 1.9); p.closePath(); if (!back) { p.moveTo(8.0, -6.0); p.ellipse(3.4, -6.0, 4.6, 5.6, 0, 0, -TAU, true); } };
    ink(g, hd, C, LW, 'evenodd'); cel(g, hd, -3, CD, 2.6);
    if (!back) { clipped(g, ell(3.4, -6.0, 4.6, 5.6), () => { g.fillStyle = 'rgba(30,15,40,0.28)'; g.fillRect(-2, -12, 12, 3.2); }); if (band) stroke(g, band, 0.5, (p) => p.ellipse(3.4, -6.0, 5.0, 6.0, 0, 3.6, 5.9)); }
    return;
  }
  if (k === 'helm' || k === 'horned' || k === 'crown') {
    if (k === 'crown') {
      const G = band || GOLD, cr = (p) => { p.moveTo(-5.0, -13.0); p.lineTo(-5.4, -17.0); p.lineTo(-3.4, -15.0); p.lineTo(-1.4, -18.4); p.lineTo(0.6, -15.2); p.lineTo(2.8, -18.6); p.lineTo(4.4, -15.0); p.lineTo(6.6, -17.0); p.lineTo(6.2, -12.6); p.quadraticCurveTo(0.6, -11.8, -5.0, -13.0); p.closePath(); };
      ink(g, cr, G); cel(g, cr, -2.4, shade(G, -0.35), 2);
      if (!back) ink(g, ell(1.4, -13.6, 0.8, 0.9), '#d83a5a', 0.24);
      for (const [x, y] of [[-5.4, -17.0], [-1.4, -18.4], [2.8, -18.6], [6.6, -17.0]]) ink(g, ell(x, y, 0.5, 0.5), '#fff4c8', 0.2);
      return;
    }
    if (k === 'horned') ink(g, (p) => { p.moveTo(-5.0, -13.4); p.quadraticCurveTo(-10.6, -14.2, -11.2, -21.0); p.quadraticCurveTo(-8.2, -16.4, -4.0, -15.9); p.closePath(); }, '#e8dcc0');
    if (band && k === 'helm') { const pl = (p) => { p.moveTo(-6.4, -14.4); p.quadraticCurveTo(-2.4, -22.4, 5.6, -16.0); p.quadraticCurveTo(-0.6, -18.4, -6.4, -14.4); p.closePath(); }; ink(g, pl, band); cel(g, pl, -3, shade(band, -0.3)); }
    const hm = back ? (p) => { p.moveTo(-7.4, -3.6); p.quadraticCurveTo(-9.4, -16.4, 0.4, -16.5); p.quadraticCurveTo(8.9, -16.1, 7.9, -4.8); p.quadraticCurveTo(0.3, -3.0, -7.4, -3.6); p.closePath(); }
      : (p) => { p.moveTo(-7.4, -3.8); p.quadraticCurveTo(-9.4, -16.4, 0.6, -16.5); p.quadraticCurveTo(8.9, -16.1, 8.2, -8.6); p.lineTo(-0.4, -8.6); p.lineTo(-2.0, -4.0); p.closePath(); };
    ink(g, hm, C); cel(g, hm, -3, CD, 2.6);
    clipped(g, hm, () => {
      g.fillStyle = CD; g.fillRect(-10, -10.4, 20, 1.8);
      g.fillStyle = 'rgba(255,255,255,0.32)'; g.beginPath(); g.ellipse(2.6, -14.2, 3.0, 1.1, -0.2, 0, TAU); g.fill();
      g.fillStyle = CL; for (const x of [-5.6, -2.6, 0.6, 3.8, 6.6]) { g.beginPath(); g.arc(x, -9.5, 0.3, 0, TAU); g.fill(); }
    });
    if (k === 'horned') ink(g, (p) => { p.moveTo(4.6, -14.6); p.quadraticCurveTo(10.6, -15.6, 10.6, -22.2); p.quadraticCurveTo(8.4, -17.4, 3.6, -16.1); p.closePath(); }, '#f4ecd8');
    return;
  }
  if (k === 'cap' || k === 'feather') {
    if (k === 'feather') { const f = ell(-6.4, -17.2, 4.8, 1.15, -1.0); ink(g, f, band || '#d83a3a', 0.28); clipped(g, f, () => { g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(-8.8, -21.0, 1.6, 1.4, -1.0, 0, TAU); g.fill(); }); stroke(g, rgba(shade(band || '#d83a3a', -0.4), 0.8), 0.18, (p) => { p.moveTo(-4.0, -13.4); p.lineTo(-8.8, -21.0); }); }
    const cp = (p) => { p.moveTo(-7.1, -9.6); p.quadraticCurveTo(-7.7, -16.6, 0.4, -16.8); p.quadraticCurveTo(7.7, -16.5, 7.7, -9.8); p.quadraticCurveTo(0.3, -8.6, -7.1, -9.6); p.closePath(); };
    ink(g, cp, C); cel(g, cp, -3, CD, 2.4);
    clipped(g, cp, () => { g.fillStyle = CD; g.fillRect(-9, -11.0, 18, 1.4); g.fillStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); g.ellipse(2.4, -14.8, 2.6, 1.0, -0.2, 0, TAU); g.fill(); });
    if (!back) ink(g, ell(8.6, -9.7, 3.8, 1.0, -0.06), CD); else ink(g, ell(7.9, -9.9, 1.4, 0.8), CD);
    ink(g, ell(0.2, -16.9, 0.75, 0.55), CL, 0.24);
    return;
  }
  if (k === 'circlet' || k === 'band') {
    if (k === 'band') for (const [tx, ty] of [[-11.4, -7.6], [-10.8, -5.0]]) ink(g, (p) => { p.moveTo(-6.8, -10.4); p.quadraticCurveTo(-9, -9.6, tx, ty); p.lineTo(tx + 0.6, ty + 1.2); p.quadraticCurveTo(-8.6, -8.2, -6.6, -9.0); p.closePath(); }, CD, 0.26);
    const w = k === 'band' ? 1.0 : 0.55;
    stroke(g, INK, w + 0.7, (p) => { p.moveTo(-7.0, -9.6); p.quadraticCurveTo(0.5, -11.8, 7.8, -10.1); });
    stroke(g, C, w, (p) => { p.moveTo(-7.0, -9.6); p.quadraticCurveTo(0.5, -11.8, 7.8, -10.1); });
    if (k === 'circlet' && !back) ink(g, (p) => { p.moveTo(6.1, -11.9); p.lineTo(6.9, -10.7); p.lineTo(6.1, -9.5); p.lineTo(5.3, -10.7); p.closePath(); }, band || '#6ac8f0', 0.24);
  }
}
function headPart(s, mode) {
  const back = mode === 'back', top = s.hat === 'wizard' ? -29.6 : s.hat ? -23 : -21.4;
  return part(-12.2, 11.4, top, s.hairStyle === 'ponytail' || s.hairStyle === 'braid' ? 16 : 2.8, (g) => {
    if (back) { headBack(g, s); if (s.hat) hat(g, s, true); return; }
    const skin = skinOf(s);
    ink(g, skull, skin); cel(g, skull, -2.6, shade(skin, -0.3), 2.4);
    const style = s.hairStyle || 'short';
    const brow = face(g, s, mode);
    if (s.beard) {
      const bd = (p) => { p.moveTo(-3.2, -5); p.quadraticCurveTo(-2.6, 2.4, 2.6, 2.7); p.quadraticCurveTo(6.9, 2.1, 7.1, -4.2); p.quadraticCurveTo(5.5, -0.9, 3.0, -1.0); p.quadraticCurveTo(0.2, -1.5, -1.2, -4.6); p.closePath(); };
      ink(g, bd, s.beard); cel(g, bd, 0.4, shade(s.beard, -0.3), 2);
      ink(g, (p) => { p.moveTo(2.4, -1.8); p.quadraticCurveTo(4.5, -3.5, 6.6, -2.4); p.quadraticCurveTo(4.6, -1.4, 2.4, -1.8); p.closePath(); }, shade(s.beard, -0.08), 0.26);
    }
    hairFront(g, s);
    if (style !== 'bob' && style !== 'long' && s.hat !== 'hood' && !(s.hat in { helm: 1, horned: 1 })) ear(g, s, -3.0);
    brows(g, brow, mode);
    if (s.hat) hat(g, s, false);
  });
}

function capePart(s, back) {
  const C = s.cape;
  return part(-9, 6, -1.8, 25.4, (g) => {
    const c = (p) => { p.moveTo(-3.9, -0.6); p.quadraticCurveTo(-7.0, 10, -8.4, 24.6); p.quadraticCurveTo(-1.8, 25.7, 4.8, 24.6); p.quadraticCurveTo(4.8, 10, 3.7, -0.6); p.closePath(); };
    ink(g, c, back ? C : shade(C, -0.1)); cel(g, c, back ? -3.4 : 0, shade(C, -0.4), 3);
    clipped(g, c, () => {
      g.fillStyle = s.capeTrim || shade(C, -0.32); g.fillRect(-10, 23.5, 16, 3);
      g.strokeStyle = rgba(shade(C, -0.45), 0.5); g.lineWidth = 0.25; for (const x of [-4.4, -1.4, 1.8]) { g.beginPath(); g.moveTo(x * 0.3, 2); g.quadraticCurveTo(x * 0.9, 12, x * 1.3, 24); g.stroke(); }
    });
    if (back) { ink(g, (p) => p.roundRect(-4.4, -1.6, 8.6, 2.0, 0.8), shade(C, 0.18), 0.3); }
  });
}

// a weapon or shield from its voxel model, seen from the side: the nearest cube of each column, inked like the rest
function gridPart(grid) {
  const cells = new Map(); let z0 = 1e9, z1 = -1e9, y0 = 1e9, y1 = -1e9, xa = 1e9, xb = -1e9;
  for (const [x, y, z, c] of grid.m.values()) {
    const k = z * 512 + y, o = cells.get(k); if (!o || x > o.x) cells.set(k, { x, y, z, c });
    z0 = Math.min(z0, z); z1 = Math.max(z1, z); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  for (const o of cells.values()) { xa = Math.min(xa, o.x); xb = Math.max(xb, o.x); }
  return part(z0 - 0.5, z1 + 0.5, -y1 - 0.5, -y0 + 0.5, (g) => {
    const e = LW * 0.75; g.fillStyle = INK;
    for (const o of cells.values()) g.fillRect(o.z - 0.5 - e, -o.y - 0.5 - e, 1 + 2 * e, 1 + 2 * e);
    for (const o of cells.values()) { g.fillStyle = shade(o.c, xb > xa ? -0.2 * (xb - o.x) / (xb - xa) : 0); g.fillRect(o.z - 0.51, -o.y - 0.51, 1.02, 1.02); }
  });
}
function shieldGrid(s) {
  // the same recipe as the voxel shield (voxel.js partsFor), kept short: the face only
  const g = { m: new Map() }, S = s.shieldColor || '#5a7ac8', rim = s.shieldRim || GOLD, kind = s.shieldKind || 'kite', st = s.shieldTier || 0;
  const set = (y, z, c, x = 2) => g.m.set(`${y},${z},${x}`, [x, y, z, c]);
  const shape = kind === 'buckler' ? (y, z) => ((y + 3) ** 2 + z * z) / 22
    : kind === 'tower' ? (y, z) => Math.max(Math.abs(y + 4) / 9.5, Math.abs(z) / 6.2) ** 6
    : kind === 'aegis' ? (y, z) => ((y + 3.5) ** 2 / 52 + z * z / 52) * (1 - 0.08 * Math.cos(Math.atan2(z, y + 3.5) * 6))
    : (y, z) => (y + 3.5) ** 2 / 64 + (z * z) / (40 * Math.max(0.15, Math.min(1, (y + 12) / 10)));
  for (let y = -14; y <= 6; y++) for (let z = -8; z <= 8; z++) { const v = shape(y, z); if (v > 1) continue; set(y, z, v > (kind === 'tower' ? 0.72 : 0.7) ? rim : (kind === 'kite' && st >= 3 && (y === -3 || z === 0)) || (kind === 'tower' && st >= 2 && Math.abs(z) <= 1) ? shade(S, -0.15) : shade(S, 0.08), v <= 0.62 ? 3 : 2); }
  if (kind === 'buckler') { for (let y = -4; y <= -2; y++) for (let z = -1; z <= 1; z++) set(y, z, rim, 4); set(-3, 0, s.shieldEmblem || '#fff4c8', 5); }
  else if (kind === 'aegis') { for (let y = -5; y <= -2; y++) for (let z = -1; z <= 1; z++) set(y, z, '#8ae0ff', 4); set(-4, 0, '#ffffff', 5); }
  else { for (let y = -4; y <= -3; y++) for (let z = -1; z <= 0; z++) set(y, z, s.shieldEmblem || GOLD, 4); }
  if (st >= 6) set(-3, 0, '#d84a4a', 5);
  return g;
}

// ---------------------------------------------------------------- one look: every part, packed into one texture
const dollCache = new Map();
function dollFor(look) {
  const key = JSON.stringify(look); let D = dollCache.get(key); if (D) return D;
  const s = look, P = {};
  P.legN = legPart(s, false); P.legF = legPart(s, true);
  P.torsoF = torsoPart(s, false); P.torsoB = torsoPart(s, true);
  P.armN = armPart(s, false); P.armF = armPart(s, true);
  P.headF = headPart(s, 'normal'); P.headBlink = headPart(s, 'blink'); P.headHurt = headPart(s, 'hurt'); P.headB = headPart(s, 'back');
  const hbF = hairBackPart(s, false), hbB = s.hat === 'hood' ? null : hairBackPart(s, true); // a hood covers the hair from behind if (hbF) P.hairF = hbF; if (hbB) P.hairB = hbB;
  if (s.cape) { P.capeF = capePart(s, false); P.capeB = capePart(s, true); }
  const wp = s.weapon && tintWeapon(weaponGrid(s.weapon, s.weaponTier, s.weaponRefine), s.weaponMetal, s.weaponAccent); if (wp) P.weapon = gridPart(wp);
  if (s.weaponL) { const wl = tintWeapon(weaponGrid(s.weaponL, s.weaponLTier, s.weaponLRefine), s.weaponLMetal, s.weaponLAccent); if (wl) P.weaponL = gridPart(wl); }
  if (s.shield) P.shield = gridPart(shieldGrid(s));
  // shelf packing, tallest first
  const list = Object.entries(P).sort((a, b) => b[1].cv.height - a[1].cv.height), W = 1024, gap = 4;
  let x = 0, y = 0, row = 0;
  for (const [, p] of list) { if (x + p.cv.width > W) { x = 0; y += row + gap; row = 0; } p.ax = x; p.ay = y; x += p.cv.width + gap; row = Math.max(row, p.cv.height); }
  const H = y + row, atlas = document.createElement('canvas'); atlas.width = W; atlas.height = H;
  const ag = atlas.getContext('2d'); for (const [, p] of list) ag.drawImage(p.cv, p.ax, p.ay);
  const tex = new THREE.CanvasTexture(atlas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const G = {};
  for (const [k, p] of Object.entries(P)) {
    const x0 = p.x0, x1 = p.x0 + p.w, ya = -p.y0, yb = -(p.y0 + p.h), u0 = p.ax / W, u1 = (p.ax + p.cv.width) / W, v0 = 1 - p.ay / H, v1 = 1 - (p.ay + p.cv.height) / H;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([x0, yb, 0, x1, yb, 0, x1, ya, 0, x0, ya, 0], 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute([u0, v1, u1, v1, u1, v0, u0, v0], 2));
    geo.setIndex([0, 1, 2, 0, 2, 3]); geo.computeBoundingSphere(); geo.userData.part = p;
    G[k] = geo;
  }
  D = { tex, G, P, s }; dollCache.set(key, D);
  return D;
}

// layer depths (body units) for the two views; R and L are the figure's own right and left
const LAYERS = {
  f: { hair: -4.2, cape: -3.2, armL: -2.2, legL: -1.6, legR: -1.0, torso: 0, shield: 0.7, head: 1.2, armR: 2.2 },
  b: { shield: -2.6, armR: -2.2, legR: -1.6, legL: -1.0, torso: 0, cape: 0.8, hair: 1.05, head: 1.2, armL: 2.2 },
};

export class PaperPerson {
  constructor(look, opts = {}) {
    this.voxel = true; this.paperDoll = true;
    this.scale = opts.scale || 1; this.battle = !!opts.battle; this.glow = opts.glow ?? 0.14;
    const D = this.D = dollFor(look);
    this.mat = new THREE.MeshStandardMaterial({ map: D.tex, emissiveMap: D.tex, emissive: new THREE.Color(this.glow, this.glow, this.glow), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.95, metalness: 0 });
    const G = D.G, grp = (parent, x = 0, y = 0) => { const o = new THREE.Group(); o.position.set(x, y, 0); parent.add(o); return o; };
    const quad = (parent, geo) => { if (!geo) return null; const m = new THREE.Mesh(geo, this.mat); m.castShadow = true; parent.add(m); return m; };
    this.mesh = new THREE.Group(); this.card = grp(this.mesh); this.flip = grp(this.card);
    this.body = grp(this.flip); this.body.scale.setScalar(VS * this.scale);
    this.legR = grp(this.body, 0.5, HIP); this.legL = grp(this.body, -0.7, HIP);
    this.legRm = quad(this.legR, G.legN); this.legLm = quad(this.legL, G.legF);
    this.torso = grp(this.body, 0, HIP); this.torsoM = quad(this.torso, G.torsoF);
    this.head = grp(this.torso, 0.5, 13.7); this.headM = quad(this.head, G.headF);
    this.hairM = G.hairF || G.hairB ? quad(this.head, G.hairF || G.hairB) : null;
    this.armR = grp(this.torso, 0.5, 12.3); this.armL = grp(this.torso, -0.9, 12.6);
    this.armRm = quad(this.armR, G.armN); this.armLm = quad(this.armL, G.armF);
    if (G.capeF) { this.cape = grp(this.torso, -0.8, 12.9); this.capeM = quad(this.cape, G.capeF); }
    if (G.weapon) { this.weapon = grp(this.armR, 0.15, -10.0); quad(this.weapon, G.weapon); this.weapon.rotation.z = -(WPN_TILT[look.weapon] ?? 0.8); }
    if (G.weaponL) { this.weaponL = grp(this.armL, 0.15, -10.0); quad(this.weaponL, G.weaponL); this.weaponL.rotation.z = -(WPN_TILT[look.weaponL] ?? 0.8); }
    if (G.shield) { this.shield = grp(this.armL, 0.3, -4.0); quad(this.shield, G.shield); }
    this.w = 0.7 * this.scale; this.h = 46 * VS * this.scale;
    this.paper = true; this.pop = isPaper() && !opts.noPop ? 0 : 1; this.popDelay = 0; this.flipT = 0; this.next = null;
    this.side = 1; this.view = 'f'; this.snap = true; this.face = 'normal'; this.blinkT = 1 + Math.random() * 3;
    this.frame = 0; this.t = Math.random() * 10;
    this.cur = {}; for (const j of JOINTS) this.cur[j] = 0;
    this.target = { ...POSES[0] };
    this.ang = opts.angle ?? 0; this.angT = this.ang; this.moving = false; this.phase = 0;
    this.setView('f');
    toLayer(this.mesh);
  }
  setView(v) {
    this.view = v; const G = this.D.G, Z = LAYERS[v], f = v === 'f';
    this.torsoM.geometry = f ? G.torsoF : G.torsoB; this.torso.position.z = Z.torso;
    // the near arm and leg are drawn brighter: the right ones from the front, the left ones from behind
    this.armRm.geometry = f ? G.armN : G.armF; this.armLm.geometry = f ? G.armF : G.armN;
    this.legRm.geometry = f ? G.legN : G.legF; this.legLm.geometry = f ? G.legF : G.legN;
    this.legR.position.set(f ? 0.5 : -0.7, HIP, Z.legR); this.legL.position.set(f ? -0.7 : 0.5, HIP, Z.legL);
    this.armR.position.set(f ? 0.5 : -0.9, f ? 12.3 : 12.6, Z.armR); this.armL.position.set(f ? -0.9 : 0.5, f ? 12.6 : 12.3, Z.armL);
    this.head.position.z = Z.head;
    if (this.hairM) { const geo = f ? G.hairF : G.hairB; this.hairM.visible = !!geo; if (geo) this.hairM.geometry = geo; this.hairM.position.z = Z.hair - Z.head; }
    if (this.cape) { this.capeM.geometry = f ? G.capeF : G.capeB; this.cape.position.z = Z.cape; }
    if (this.weapon) this.weapon.position.z = -0.15;
    if (this.weaponL) this.weaponL.position.z = -0.15;
    if (this.shield) this.shield.position.z = Z.shield - Z.armL;
    this.setFace(this.face, true);
  }
  setFace(m, force) { if (m === this.face && !force) return; this.face = m; const G = this.D.G; this.headM.geometry = this.view === 'b' ? G.headB : m === 'blink' ? G.headBlink : m === 'hurt' ? G.headHurt : G.headF; }
  setFrame(i) { this.frame = i; if (this.battle) this.target = { ...(POSES[i] || POSES[0]) }; }
  walk(dir, moving, phase) {
    if (typeof dir === 'number') this.angT = dir; else if (dir in DIR_ANGLE) this.angT = DIR_ANGLE[dir];
    this.moving = moving; this.phase = phase;
  }
  snapFacing() { this.ang = this.angT; this.snap = true; }
  tick(dt) {
    this.t += dt;
    const k = Math.min(1, dt * (this.battle ? 16 : 12));
    let d = this.angT - this.ang; d = Math.atan2(Math.sin(d), Math.cos(d)); this.ang += d * Math.min(1, dt * 14);
    if (Math.abs(this.angT - this.ang) < 0.002) this.ang = this.angT;
    const tg = { ...this.target };
    if (!this.battle) {
      const ph = this.phase * Math.PI * 2 * 1.5, sw = Math.sin(ph);
      if (this.moving) { tg.legL = sw * 0.62; tg.legR = -sw * 0.62; tg.armL = -sw * 0.55; tg.armR = sw * 0.55 - 0.1; tg.torso = 0.07; tg.y = Math.abs(Math.cos(ph)) * 0.9; tg.head = -0.03; }
      else { tg.legL = 0; tg.legR = 0; tg.armL = 0.05; tg.armR = -0.12; tg.torso = 0; tg.y = 0; tg.head = 0; }
    }
    for (const j of JOINTS) { const e = (tg[j] || 0) - this.cur[j]; this.cur[j] = Math.abs(e) < 0.002 ? (tg[j] || 0) : this.cur[j] + e * k; }
    this.pose();
    // which way the card shows: from the front or the back, and turned left or right; a change flips it over
    const yaw = camYaw(this.mesh), rel = this.ang - yaw, sn = Math.sin(rel), cs = Math.cos(rel);
    const side = sn > 0.2 ? 1 : sn < -0.2 ? -1 : this.side, view = cs < -0.3 ? 'b' : cs > -0.15 ? 'f' : this.view; // walking sideways shows the face
    if (this.snap) { this.snap = false; this.side = side; if (view !== this.view) this.setView(view); this.flipT = 0; this.next = null; }
    else if ((side !== (this.next?.side ?? this.side) || view !== (this.next?.view ?? this.view))) {
      if (this.pop >= 1) { this.next = { side, view }; if (this.flipT <= 0) this.flipT = FLIP_T; } else { this.side = side; if (view !== this.view) this.setView(view); }
    }
    if (this.flipT > 0) { this.flipT -= dt; if (this.next && this.flipT <= FLIP_T / 2) { this.side = this.next.side; if (this.next.view !== this.view) this.setView(this.next.view); this.next = null; } if (this.flipT < 0) this.flipT = 0; }
    const fl = this.flipT > 0 ? Math.max(0.04, Math.abs(Math.cos((1 - this.flipT / FLIP_T) * Math.PI))) : 1;
    this.flip.scale.x = this.side * fl;
    // blinking now and then; a wince when hurt, eyes shut when down
    this.blinkT -= dt; if (this.blinkT < -0.12) this.blinkT = 2.2 + Math.random() * 3.5;
    const f = this.frame, hurt = this.battle && (f === 5 || f === 10), down = this.battle && f === 6;
    this.setFace(hurt ? 'hurt' : down || this.blinkT < 0 ? 'blink' : 'normal');
    if (this.pop < 1) { if (this.popDelay > 0) this.popDelay -= dt; else this.pop = Math.min(1, this.pop + dt / POP_T); }
    const up = this.pop >= 1 ? 1 : easeBack(this.pop);
    this.card.rotation.set(-0.15 - (Math.PI / 2 - 0.15) * (1 - up) - 1.3 * this.cur.lie, yaw, 0, 'YXZ');
  }
  // the joints: the voxel people's angles about x become turns in the card's plane
  pose() {
    const c = this.cur;
    this.legR.rotation.z = -c.legR; this.legL.rotation.z = -c.legL;
    this.armR.rotation.z = -c.armR; this.armL.rotation.z = -c.armL;
    this.armR.scale.y = 0.85 + 0.15 * Math.cos(c.armRz * 2); this.armL.scale.y = 0.85 + 0.15 * Math.cos(c.armLz * 2);
    const breathe = this.moving ? 0 : Math.sin(this.t * 2.4) * 0.012;
    this.torso.rotation.z = -c.torso; this.torso.position.y = HIP + c.y; this.torso.scale.set(1, 1 + breathe, 1);
    this.head.rotation.z = -c.head;
    if (this.cape) this.cape.rotation.z = -(0.06 + (this.moving ? 0.3 + Math.sin(this.t * 9) * 0.06 : 0) + Math.max(0, -c.torso) * 0.5);
    // a little squash and stretch in the step
    const sq = this.moving ? Math.cos(this.phase * Math.PI * 6) * 0.025 : 0; this.body.scale.set(VS * this.scale * (1 - sq), VS * this.scale * (1 + sq), VS * this.scale);
    if (this.battle && this.frame === BWIN) this.body.position.y = Math.abs(Math.sin(this.t * 6)) * 0.12;
    else if (this.battle && this.frame === 10) { this.body.position.y = -0.19 * this.scale; this.torso.rotation.z = -(c.torso + Math.sin(this.t * 5) * 0.05); }
    else this.body.position.y = 0;
  }
  dispose() { this.mat.dispose(); }
}

// people for the field and battles: paper dolls in pop-up book mode, voxel models otherwise
export function personModel(look, opts = {}) { return isPaper() ? new PaperPerson(look, opts) : new VoxelPerson(look, opts); }

// ---------------------------------------------------------------- portraits drawn from the same parts
// face (160x144), full figure (192x304), or the battle cut-in (the full figure in its victory pose, facing left)
export function renderPortrait(look, mode = 'face') {
  if (!look) return '';
  if (!isPaper()) return renderVoxelPortrait(look, mode);
  const v = new PaperPerson(look, { battle: mode === 'battle', noPop: true });
  v.setView(mode === 'back' ? 'b' : 'f'); v.moving = false;
  if (mode === 'battle') v.setFrame(BWIN);
  v.cur = { ...v.cur, ...(mode === 'battle' ? POSES[BWIN] : { armL: 0.05, armR: -0.12 }) }; v.t = 0; v.pose(); v.body.position.y = 0;
  v.body.scale.setScalar(1); v.body.updateMatrixWorld(true);
  const W = mode === 'face' ? 160 : 192, Hh = mode === 'face' ? 144 : 304, S = mode === 'face' ? 6.4 : 5.1;
  if (mode === 'face') for (const o of [v.weapon, v.weaponL, v.shield]) if (o) o.visible = false; // nothing in front of the face
  const hp = new THREE.Vector3(); v.head.getWorldPosition(hp);
  const cx = mode === 'face' ? hp.x + 0.6 : 0.6, cy = mode === 'face' ? hp.y + 8.2 : 27.5, sx = mode === 'battle' ? -1 : 1;
  const base = document.createElement('canvas'); base.width = W; base.height = Hh; const g = base.getContext('2d');
  const O = new DOMMatrix([S * sx, 0, 0, -S, W / 2 - S * sx * cx, Hh / 2 + S * cy]);
  const parts = []; v.body.traverse((o) => { if (o.isMesh && o.visible && o.parent.visible) parts.push(o); });
  parts.sort((a, b) => a.matrixWorld.elements[14] - b.matrixWorld.elements[14]);
  for (const m of parts) {
    const p = m.geometry.userData.part, e = m.matrixWorld.elements;
    const M = new DOMMatrix([e[0], e[1], e[4], e[5], e[12], e[13]]), L = new DOMMatrix([1 / PPU, 0, 0, -1 / PPU, p.x0, -p.y0]);
    g.setTransform(O.multiply(M).multiply(L)); g.drawImage(p.cv, 0, 0);
  }
  v.dispose();
  // cut out of the page: a white margin, and the card's soft shadow
  const sil = document.createElement('canvas'); sil.width = W; sil.height = Hh; const sg = sil.getContext('2d');
  sg.drawImage(base, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = '#fbf6ea'; sg.fillRect(0, 0, W, Hh);
  const out = document.createElement('canvas'); out.width = W; out.height = Hh; const og = out.getContext('2d');
  const r = mode === 'face' ? 3 : 2.5;
  og.globalAlpha = 0.22; og.filter = 'brightness(0)'; og.drawImage(sil, 2, 3); og.filter = 'none'; og.globalAlpha = 1;
  for (let i = 0; i < 16; i++) og.drawImage(sil, Math.cos(i / 16 * TAU) * r, Math.sin(i / 16 * TAU) * r);
  og.drawImage(base, 0, 0);
  return out.toDataURL();
}
