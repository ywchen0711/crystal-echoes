// Synthesised music and sound: a small sequencer playing chord progressions, arpeggios and melodies.
const NOTE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const midi = (n) => { const m = /^([A-G][#b]?)(-?\d)$/.exec(n); return m ? NOTE[m[1]] + (+m[2] + 1) * 12 : null; };
const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);
function chordNotes(name, oct = 3) {
  const m = /^([A-G][#b]?)(.*)$/.exec(name); const root = NOTE[m[1]] + (oct + 1) * 12, q = m[2];
  const iv = q === 'm' ? [0, 3, 7] : q === '7' ? [0, 4, 7, 10] : q === 'm7' ? [0, 3, 7, 10] : q === 'maj7' ? [0, 4, 7, 11] : q === 'sus4' ? [0, 5, 7] : q === 'dim' ? [0, 3, 6] : q === 'add9' ? [0, 4, 7, 14] : q === '5' ? [0, 7, 12] : [0, 4, 7];
  return iv.map(i => root + i);
}

// ---------------------------------------------------------------- songs (all original)
const SONGS = {
  title: { bpm: 84, chords: ['Dmaj7', 'Bm7', 'Gmaj7', 'A', 'Dmaj7', 'F#m', 'G', 'Asus4'], per: 4, style: { arp: 'harp', pad: true, bell: true },
    melody: 'F#5 - - A5 - - E5 - | D5 - - - B4 - C#5 D5 | B4 - - D5 - - A4 - | A4 - - - - - - - | F#5 - - A5 - - D6 - | C#6 - - - A5 - F#5 - | G5 - F#5 - E5 - D5 - | E5 - - - - - - -' },
  town: { bpm: 118, chords: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G'], per: 4, style: { arp: 'pluck', bass: 'walk', drums: 'light', pad: false },
    melody: 'E5 . G5 . C6 - B5 A5 | G5 - - . D5 . E5 F5 | E5 . C5 . A4 - B4 C5 | D5 - - - . . . . | E5 . G5 . C6 - D6 E6 | D6 - B5 . G5 - A5 B5 | C6 - A5 . F5 - G5 A5 | G5 - - - - - . .' },
  night: { bpm: 76, chords: ['Am7', 'Fmaj7', 'Cmaj7', 'Em7'], per: 4, style: { arp: 'harp', pad: true },
    melody: 'E5 - - - D5 - C5 - | A4 - - - - - - - | G4 - C5 - E5 - G5 - | F#5 - E5 - - - - -' },
  world: { bpm: 126, chords: ['D', 'A', 'Bm', 'G', 'D', 'A', 'G', 'A'], per: 4, style: { arp: 'up', bass: 'root8', drums: 'march', pad: true, lead: 'brass' },
    melody: 'D5 - - A4 D5 - E5 F#5 | E5 - - - C#5 - A4 - | B4 - D5 - F#5 - B5 - | A5 - - - G5 F#5 E5 - | F#5 - - D5 F#5 - A5 - | G5 - F#5 - E5 - D5 E5 | D5 - B4 - G4 - B4 D5 | C#5 - - - E5 - - -' },
  forest: { bpm: 96, chords: ['Em', 'C', 'D', 'Bm', 'Em', 'Am', 'B7', 'Em'], per: 4, style: { arp: 'harp', bass: 'root4', pad: true, lead: 'flute' },
    melody: 'B4 - - E5 - - G5 - | F#5 - E5 - D5 - - - | E5 - D5 - C5 - B4 - | A4 - - - B4 - - - | G5 - - F#5 - E5 - - | C5 - - E5 - A5 - - | F#5 - - D#5 - B4 - - | E5 - - - - - - -' },
  dungeon: { bpm: 100, chords: ['Am', 'Am', 'F', 'E', 'Dm', 'Am', 'E', 'E7'], per: 4, style: { arp: 'down', bass: 'root8', drums: 'tom', pad: true, lead: 'flute' },
    melody: 'A4 - . C5 - . E5 - | D#5 - E5 - - - . . | F5 - E5 - D5 - C5 - | B4 - - - G#4 - - - | A4 - . D5 - . F5 - | E5 - C5 - A4 - - - | B4 - C5 - D5 - E5 - | G#4 - - - - - . .' },
  dungeon2: { bpm: 88, chords: ['Dm', 'Bb', 'C', 'A', 'Dm', 'Gm', 'A', 'A7'], per: 4, style: { arp: 'harp', bass: 'root4', pad: true, bell: true },
    melody: 'D5 - - F5 - - A5 - | G5 - F5 - E5 - - - | E5 - - G5 - - C6 - | C#6 - - - - - - - | D6 - - A5 - - F5 - | G5 - - Bb5 - - D5 - | E5 - F5 - G5 - E5 - | C#5 - - - - - - -' },
  anvil: { bpm: 112, chords: ['Gm', 'Eb', 'F', 'D', 'Gm', 'Cm', 'D', 'D7'], per: 4, style: { arp: 'up', bass: 'root8', drums: 'anvil', pad: false, lead: 'brass' },
    melody: 'G4 - Bb4 - D5 - G5 - | F5 - Eb5 - D5 - - - | C5 - D5 - Eb5 - F5 - | F#5 - - - D5 - - - | G5 - F5 - Eb5 - D5 - | Eb5 - D5 - C5 - Bb4 - | A4 - Bb4 - C5 - D5 - | D5 - - - - - . .' },
  azurelle: { bpm: 100, chords: ['F', 'C/E', 'Dm', 'Bb', 'F', 'Gm', 'Bb', 'C'], per: 4, style: { arp: 'harp', bass: 'root4', pad: true, lead: 'flute', bell: true },
    melody: 'A5 - - G5 F5 - C5 - | E5 - - D5 C5 - - - | D5 - - E5 F5 - A5 - | Bb5 - - A5 G5 - - - | A5 - - C6 - - F5 - | G5 - - Bb5 - - D5 - | F5 - E5 - D5 - Bb4 - | C5 - - - - - - -' },
  sanctum: { bpm: 66, chords: ['C', 'Am', 'F', 'G', 'C', 'Em', 'F', 'Gsus4'], per: 4, style: { pad: true, bell: true, arp: 'slow' },
    melody: 'E5 - - - G5 - - - | A5 - - - - - - - | F5 - - - A5 - - - | G5 - - - - - - - | C6 - - - B5 - - - | G5 - - - - - - - | A5 - - - F5 - - - | G5 - - - - - - -' },
  sky: { bpm: 108, chords: ['Eb', 'Bb', 'Cm', 'Ab', 'Eb', 'Bb', 'Ab', 'Bb'], per: 4, style: { arp: 'up', bass: 'root4', pad: true, lead: 'flute', drums: 'light', bell: true },
    melody: 'G5 - - Bb5 - - Eb6 - | D6 - - - Bb5 - - - | C6 - Bb5 - G5 - Eb5 - | F5 - - - - - - - | G5 - - Bb5 - - Eb6 - | F6 - - - D6 - - - | C6 - Bb5 - Ab5 - G5 - | F5 - - - Bb5 - - -' },
  last: { bpm: 132, chords: ['Bm', 'G', 'Em', 'F#', 'Bm', 'G', 'C', 'F#7'], per: 4, style: { arp: 'down', bass: 'root8', drums: 'battle', pad: true, lead: 'brass' },
    melody: 'B4 - D5 - F#5 - B5 - | A5 - G5 - F#5 - - - | G5 - F#5 - E5 - D5 - | C#5 - - - A#4 - - - | B4 - F#5 - B5 - D6 - | C#6 - B5 - A5 - G5 - | E5 - G5 - C6 - B5 - | A#5 - - - - - - -' },
  battle: { bpm: 152, chords: ['Am', 'F', 'G', 'E', 'Am', 'F', 'Dm', 'E'], per: 4, style: { arp: 'battle', bass: 'gallop', drums: 'battle', lead: 'square' },
    melody: 'A5 - E5 A5 - B5 C6 - | A5 - - F5 - C5 F5 - | G5 - D5 G5 - A5 B5 - | G#5 - - E5 - - - - | A5 - C6 - B5 - A5 - | F5 - A5 - C6 - D6 - | D6 - C6 - B5 - A5 - | G#5 - B5 - E6 - - -' },
  boss: { bpm: 160, chords: ['Dm', 'Bb', 'C', 'A', 'Dm', 'Bb', 'Gm', 'A7'], per: 4, style: { arp: 'battle', bass: 'gallop', drums: 'battle', lead: 'brass', pad: true },
    melody: 'D5 - F5 - A5 - D6 - | C6 - Bb5 - A5 - F5 - | G5 - E5 - C5 - E5 G5 | A5 - - - C#6 - - - | D6 - C6 - Bb5 - A5 - | Bb5 - A5 - G5 - F5 - | G5 - Bb5 - D6 - G5 - | A5 - - - - - E5 -' },
  victory: { bpm: 140, chords: ['C', 'F', 'G', 'C'], per: 4, style: { arp: 'up', bass: 'root4', drums: 'light', lead: 'brass' }, once: false,
    melody: 'G5 G5 G5 - C6 - - - | A5 - C6 - F6 - - - | D6 - B5 - G5 - D6 - | C6 - - - - - - -' },
  ending: { bpm: 80, chords: ['G', 'D/F#', 'Em', 'C', 'G', 'Bm', 'C', 'D'], per: 4, style: { arp: 'harp', bass: 'root4', pad: true, bell: true, lead: 'flute' },
    melody: 'B4 - D5 - G5 - - - | F#5 - - - D5 - - - | E5 - - G5 - - B5 - | A5 - - - - - - - | B5 - - A5 G5 - D5 - | F#5 - - - D5 - - - | E5 - D5 - C5 - B4 - | A4 - - - D5 - - -' },
};

export class Audio {
  constructor() { this.ctx = null; this.vol = { music: 0.6, sfx: 0.8 }; this.song = null; this.nextT = 0; this.step = 0; }
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const C = this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = C.createGain(); this.master.gain.value = 0.9; this.master.connect(C.destination);
    this.mus = C.createGain(); this.mus.gain.value = this.vol.music * 0.5; this.sfxG = C.createGain(); this.sfxG.gain.value = this.vol.sfx * 0.6;
    // simple reverb
    const len = C.sampleRate * 1.8, ir = C.createBuffer(2, len, C.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    this.rev = C.createConvolver(); this.rev.buffer = ir; this.revG = C.createGain(); this.revG.gain.value = 0.28;
    this.mus.connect(this.master); this.sfxG.connect(this.master); this.mus.connect(this.revG); this.revG.connect(this.rev); this.rev.connect(this.master);
    this.noise = C.createBuffer(1, C.sampleRate, C.sampleRate); const nd = this.noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    setInterval(() => this.schedule(), 25);
    if (this.pending) { const p = this.pending; this.pending = null; this.music(p); }
  }
  setVol(m, s) { this.vol.music = m; this.vol.sfx = s; if (this.mus) { this.mus.gain.value = m * 0.5; this.sfxG.gain.value = s * 0.6; } }

  music(name) {
    if (!this.ctx) { this.pending = name; return; }
    if (this.songName === name) return;
    this.songName = name;
    const old = this.songOut;
    if (old) { old.gain.setTargetAtTime(0, this.ctx.currentTime, 0.25); setTimeout(() => old.disconnect(), 1500); }
    if (!name || !SONGS[name]) { this.song = null; this.songOut = null; return; }
    const out = this.ctx.createGain(); out.connect(this.mus); this.songOut = out;
    const s = SONGS[name]; this.song = s;
    s.mel = s.melody.replace(/\|/g, ' ').split(/\s+/).filter(Boolean);
    this.step = 0; this.nextT = this.ctx.currentTime + 0.1;
  }
  schedule() {
    const s = this.song; if (!s || !this.ctx) return;
    const C = this.ctx, e8 = 60 / s.bpm / 2;
    while (this.nextT < C.currentTime + 0.15) {
      const st = this.step, t = this.nextT, per8 = s.per * 2;
      const totalSteps = s.chords.length * per8;
      const ci = Math.floor((st % totalSteps) / per8), chord = chordNotes(s.chords[ci].split('/')[0], 3), inBar = st % per8;
      const S = s.style;
      // melody
      const mi = st % s.mel.length, tok = s.mel[mi];
      if (tok && tok !== '-' && tok !== '.') {
        let len = 1; while (s.mel[(mi + len) % s.mel.length] === '-' && len < 16) len++;
        const m = midi(tok); if (m) this.voice(S.lead || 'square', freq(m), t, len * e8, 0.13);
      }
      // arpeggio
      if (S.arp) {
        const seq = S.arp === 'down' ? [3, 2, 1, 0, 3, 2, 1, 0] : S.arp === 'harp' ? [0, 1, 2, 3, 4, 3, 2, 1] : S.arp === 'battle' ? [0, 1, 2, 1, 0, 1, 2, 1] : S.arp === 'slow' ? [0, -1, 1, -1, 2, -1, 1, -1] : [0, 1, 2, 3, 0, 1, 2, 3];
        const k = seq[inBar % 8];
        if (k >= 0) { const notes = [...chord.map(n => n + 12), chord[0] + 24]; const n = notes[k % notes.length]; this.voice(S.arp === 'battle' ? 'pulse' : 'pluck', freq(n), t, e8 * (S.arp === 'slow' ? 2 : 0.9), S.arp === 'battle' ? 0.05 : 0.06); }
      }
      // bass
      if (S.bass) {
        const r = chord[0] - 12;
        if (S.bass === 'root8' || (S.bass === 'root4' && inBar % 2 === 0)) this.voice('bass', freq(r + (S.bass === 'root8' && inBar % 4 === 3 ? 7 : 0)), t, e8 * (S.bass === 'root4' ? 1.8 : 0.9), 0.16);
        if (S.bass === 'walk' && inBar % 2 === 0) this.voice('bass', freq(r + [0, 4, 7, 9][(inBar / 2) % 4]), t, e8 * 1.8, 0.16);
        if (S.bass === 'gallop') this.voice('bass', freq(r + (inBar % 8 === 6 ? 12 : 0)), t, e8 * 0.6, 0.17);
      }
      // pad on chord change
      if (S.pad && inBar === 0) for (const n of chord) this.voice('pad', freq(n + 12), t, e8 * per8 * 0.98, 0.035);
      if (S.bell && inBar === 0 && ci % 2 === 0) this.voice('bell', freq(chord[2] + 24), t, e8 * 6, 0.04);
      // drums
      const D = S.drums;
      if (D) {
        const b = inBar % 8;
        if (D === 'battle') { if (b % 4 === 0) this.drum('kick', t); if (b % 4 === 2) this.drum('snare', t); this.drum('hat', t, 0.5); if (b === 7) this.drum('snare', t + e8 / 2, 0.5); }
        else if (D === 'march') { if (b === 0 || b === 4) this.drum('kick', t); if (b === 2 || b === 6) this.drum('snare', t, 0.7); if (b % 2 === 1) this.drum('hat', t, 0.4); if (b === 7) this.drum('snare', t + e8 / 2, 0.4); }
        else if (D === 'light') { if (b === 0) this.drum('kick', t, 0.7); if (b === 4) this.drum('snare', t, 0.4); if (b % 2 === 0) this.drum('hat', t, 0.3); }
        else if (D === 'tom') { if (b === 0 || b === 3) this.drum('tom', t); if (b === 6) this.drum('tom', t, 0.6); }
        else if (D === 'anvil') { if (b === 0 || b === 4) this.drum('kick', t); if (b === 2 || b === 6) this.drum('clank', t, 0.6); this.drum('hat', t, 0.25); }
      }
      this.step++; this.nextT += e8;
    }
  }
  voice(type, f, t, dur, vol) {
    const C = this.ctx, g = C.createGain(), out = this.songOut; if (!out) return;
    let o, o2, filt;
    const A = type === 'pad' ? 0.4 : type === 'bell' ? 0.005 : 0.01;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + A);
    if (type === 'pluck' || type === 'bell') g.gain.exponentialRampToValueAtTime(0.001, t + Math.max(dur, 0.3) * (type === 'bell' ? 2 : 1));
    else { g.gain.setValueAtTime(vol, t + Math.max(A, dur - 0.05)); g.gain.linearRampToValueAtTime(0, t + dur + (type === 'pad' ? 0.4 : 0.06)); }
    o = C.createOscillator();
    if (type === 'square') { o.type = 'square'; filt = C.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 3000; }
    else if (type === 'pulse') { o.type = 'square'; filt = C.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 1800; }
    else if (type === 'brass') { o.type = 'sawtooth'; filt = C.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.setValueAtTime(800, t); filt.frequency.linearRampToValueAtTime(2600, t + 0.08); }
    else if (type === 'flute') { o.type = 'triangle'; o2 = C.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2; }
    else if (type === 'pluck') { o.type = 'triangle'; }
    else if (type === 'bass') { o.type = 'triangle'; }
    else if (type === 'pad') { o.type = 'sawtooth'; o2 = C.createOscillator(); o2.type = 'sawtooth'; o2.detune.value = 9; o2.frequency.value = f; filt = C.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 900; }
    else if (type === 'bell') { o.type = 'sine'; o2 = C.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2.76; }
    o.frequency.value = f;
    if (type === 'square' || type === 'brass' || type === 'flute') { const lfo = C.createOscillator(), lg = C.createGain(); lfo.frequency.value = 5.5; lg.gain.value = f * 0.006; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t + 0.15); lfo.stop(t + dur + 0.2); }
    const chain = filt ? (o.connect(filt), filt) : o;
    chain.connect(g); if (o2) { const g2 = C.createGain(); g2.gain.value = type === 'bell' ? 0.3 : type === 'flute' ? 0.15 : 1; o2.connect(g2); g2.connect(filt || g); o2.start(t); o2.stop(t + dur + 0.6); }
    g.connect(out); o.start(t); o.stop(t + dur + (type === 'pad' ? 0.6 : type === 'bell' ? 2 : 0.3));
  }
  drum(kind, t, v = 1) {
    const C = this.ctx, g = C.createGain(); const out = this.songOut; if (!out) return; g.connect(out);
    if (kind === 'kick' || kind === 'tom') {
      const o = C.createOscillator(); o.frequency.setValueAtTime(kind === 'kick' ? 140 : 220, t); o.frequency.exponentialRampToValueAtTime(kind === 'kick' ? 40 : 90, t + 0.15);
      g.gain.setValueAtTime(0.35 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25); o.connect(g); o.start(t); o.stop(t + 0.3);
    } else {
      const n = C.createBufferSource(); n.buffer = this.noise; const f = C.createBiquadFilter();
      f.type = kind === 'hat' ? 'highpass' : 'bandpass'; f.frequency.value = kind === 'hat' ? 7000 : kind === 'clank' ? 2500 : 1600; f.Q.value = kind === 'clank' ? 8 : 0.8;
      const d = kind === 'hat' ? 0.04 : 0.16; g.gain.setValueAtTime((kind === 'hat' ? 0.07 : 0.18) * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
      n.connect(f); f.connect(g); n.start(t); n.stop(t + d + 0.02);
    }
  }

  // ---------------------------------------------------------------- sound effects
  sfx(name) {
    if (!this.ctx) return;
    const C = this.ctx, t = C.currentTime;
    const tone = (f, d, type = 'square', v = 0.15, f2) => { const o = C.createOscillator(), g = C.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g); g.connect(this.sfxG); o.start(t); o.stop(t + d + 0.02); };
    const noise = (d, f, v = 0.2, type = 'bandpass', at = 0) => { const n = C.createBufferSource(); n.buffer = this.noise; const fl = C.createBiquadFilter(); fl.type = type; fl.frequency.value = f; const g = C.createGain(); g.gain.setValueAtTime(v, t + at); g.gain.exponentialRampToValueAtTime(0.001, t + at + d); n.connect(fl); fl.connect(g); g.connect(this.sfxG); n.start(t + at); n.stop(t + at + d + 0.02); };
    const arp = (fs, step = 0.06, type = 'square', v = 0.12) => fs.forEach((f, i) => { const o = C.createOscillator(), g = C.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0, t + i * step); g.gain.linearRampToValueAtTime(v, t + i * step + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + i * step + 0.25); o.connect(g); g.connect(this.sfxG); o.start(t + i * step); o.stop(t + i * step + 0.3); });
    switch (name) {
      case 'move': tone(880, 0.04, 'square', 0.05); break;
      case 'ok': tone(1320, 0.06, 'square', 0.07); break;
      case 'cancel': tone(440, 0.08, 'square', 0.07, 300); break;
      case 'talk': tone(700 + Math.random() * 200, 0.025, 'square', 0.025); break;
      case 'hit': noise(0.12, 900, 0.3); tone(180, 0.1, 'square', 0.1, 60); break;
      case 'weak': noise(0.15, 1400, 0.35); tone(320, 0.15, 'sawtooth', 0.12, 80); break;
      case 'swing': noise(0.1, 3000, 0.12, 'highpass'); break;
      case 'cast': arp([660, 880, 1100], 0.04, 'triangle', 0.08); break;
      case 'break': arp([1568, 1175, 1568, 2093], 0.05, 'square', 0.12); noise(0.3, 2000, 0.3); break;
      case 'kill': tone(600, 0.3, 'triangle', 0.12, 80); break;
      case 'buff': arp([523, 659, 784, 1046], 0.05, 'triangle', 0.1); break;
      case 'item': arp([784, 988, 1175, 1568], 0.06, 'square', 0.08); break;
      case 'chest': arp([523, 659, 784, 1046, 1318], 0.07, 'square', 0.09); break;
      case 'save': arp([784, 1175, 1568, 2349], 0.1, 'triangle', 0.1); break;
      case 'heal': arp([880, 1100, 1320, 1760], 0.07, 'sine', 0.1); break;
      case 'jump': tone(300, 0.3, 'triangle', 0.12, 1200); break;
      case 'scan': tone(1200, 0.2, 'sine', 0.08, 2400); break;
      case 'flee': tone(800, 0.3, 'square', 0.08, 200); break;
      case 'banner': noise(0.5, 600, 0.12, 'lowpass'); arp([392, 523, 784], 0.08, 'sawtooth', 0.07); break;
      case 'resonance': arp([523, 659, 784, 1046, 1318, 1568, 2093], 0.06, 'triangle', 0.12); noise(1.2, 400, 0.15, 'lowpass'); break;
      case 'summon': arp([262, 330, 392, 523, 659], 0.1, 'sawtooth', 0.08); noise(0.8, 300, 0.2, 'lowpass'); break;
      case 'encounter': arp([1046, 784, 1046, 784, 1318], 0.05, 'square', 0.1); noise(0.4, 2500, 0.15, 'highpass'); break;
      case 'step': noise(0.03, 500, 0.03, 'lowpass'); break;
      case 'door': noise(0.25, 300, 0.2, 'lowpass'); tone(150, 0.2, 'triangle', 0.08, 100); break;
      case 'levelup': arp([523, 659, 784, 1046, 784, 1046, 1318], 0.08, 'square', 0.09); break;
      case 'jump2': tone(500, 0.12, 'square', 0.07, 900); break;
      case 'miss': tone(300, 0.15, 'triangle', 0.08, 200); break;
      case 'mogu': arp([1318, 1568, 1760], 0.05, 'sine', 0.1); break;
      case 'error': tone(220, 0.15, 'square', 0.08); break;
    }
  }
}
