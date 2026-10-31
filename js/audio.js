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
// Each song: chords (one per bar), a melody on an eighth-note grid ('-' holds, '.' rests), and optionally a
// counter-melody (ctr) for a second instrument. The main theme (title) comes back in the ending, transposed.
const TITLE_MEL = 'A4 - D5 - E5 - F#5 - | E5 - - - C#5 - A4 - | B4 - D5 - F#5 - B5 - | A5 - - - - - . . | G5 - F#5 - E5 - D5 - | F#5 - - - A4 - D5 - | E5 - - - F#5 - G5 - | E5 - - - - - . . | B5 - - - A5 - G5 - | A5 - - - E5 - - - | A5 - - - G5 - F#5 - | F#5 - - - D5 - - - | G5 - F#5 - E5 - D5 - | C#5 - D5 - E5 - A5 - | F#5 - - - E5 - D5 - | D5 - - - - - - -';
const TITLE_CTR = 'F#4 - - - - - - - | E4 - - - - - - - | D4 - - - - - - - | C#4 - - - - - - - | B3 - - - - - - - | A3 - - - - - - - | B3 - - - G3 - - - | C#4 - - - - - - - | D4 - - - - - - - | C#4 - - - - - - - | C#4 - - - - - - - | D4 - - - F#4 - - - | B3 - - - - - - - | C#4 - - - E4 - - - | A3 - - - - - - - | A3 - - - - - - -';
const TITLE_CH = ['D', 'A/C#', 'Bm', 'F#m', 'G', 'D/F#', 'Em7', 'A', 'G', 'A', 'F#m', 'Bm', 'Em', 'A', 'D', 'Asus4'];
const SONGS = {
  title: { bpm: 80, chords: TITLE_CH, per: 4, style: { arp: 'harp', pad: 'strings', bell: true, lead: 'piano', ctrInst: 'strings', bass: 'root4', echo: true },
    melody: TITLE_MEL, ctr: TITLE_CTR },
  town: { bpm: 118, chords: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G'], per: 4, style: { arp: 'pluck', bass: 'walk', drums: 'light', pad: false },
    melody: 'E5 . G5 . C6 - B5 A5 | G5 - - . D5 . E5 F5 | E5 . C5 . A4 - B4 C5 | D5 - - - . . . . | E5 . G5 . C6 - D6 E6 | D6 - B5 . G5 - A5 B5 | C6 - A5 . F5 - G5 A5 | G5 - - - - - . .',
    ctr: 'C4 - - - E4 - - - | D4 - - - B3 - - - | C4 - - - E4 - - - | F4 - - - - - - - | C4 - - - E4 - - - | D4 - - - G4 - - - | A4 - - - F4 - - - | D4 - - - B3 - - -' },
  night: { gain: 1.25, bpm: 76, chords: ['Am7', 'Fmaj7', 'Cmaj7', 'Em7'], per: 4, style: { arp: 'harp', pad: 'strings', lead: 'ocarina', echo: true },
    melody: 'E5 - - - D5 - C5 - | A4 - - - - - - - | G4 - C5 - E5 - G5 - | F#5 - E5 - - - - -' },
  world: { bpm: 126, chords: ['D', 'A', 'Bm', 'G', 'D', 'A', 'G', 'A'], per: 4, style: { arp: 'up', bass: 'root8', drums: 'march', pad: 'strings', lead: 'horn', ctrInst: 'strings', crash: true },
    melody: 'D5 - - A4 D5 - E5 F#5 | E5 - - - C#5 - A4 - | B4 - D5 - F#5 - B5 - | A5 - - - G5 F#5 E5 - | F#5 - - D5 F#5 - A5 - | G5 - F#5 - E5 - D5 E5 | D5 - B4 - G4 - B4 D5 | C#5 - - - E5 - - -',
    ctr: 'F#4 - - - - - - - | E4 - - - - - - - | D4 - - - - - - - | D4 - - - B3 - - - | A3 - - - - - - - | C#4 - - - - - - - | B3 - - - D4 - - - | E4 - - - - - - -' },
  forest: { bpm: 96, chords: ['Em', 'C', 'D', 'Bm', 'Em', 'Am', 'B7', 'Em'], per: 4, style: { arp: 'harp', bass: 'root4', pad: 'strings', lead: 'flute' },
    melody: 'B4 - - E5 - - G5 - | F#5 - E5 - D5 - - - | E5 - D5 - C5 - B4 - | A4 - - - B4 - - - | G5 - - F#5 - E5 - - | C5 - - E5 - A5 - - | F#5 - - D#5 - B4 - - | E5 - - - - - - -' },
  dungeon: { bpm: 100, chords: ['Am', 'Am', 'F', 'E', 'Dm', 'Am', 'E', 'E7'], per: 4, style: { arp: 'down', bass: 'root8', drums: 'tom', pad: 'strings', lead: 'flute' },
    melody: 'A4 - . C5 - . E5 - | D#5 - E5 - - - . . | F5 - E5 - D5 - C5 - | B4 - - - G#4 - - - | A4 - . D5 - . F5 - | E5 - C5 - A4 - - - | B4 - C5 - D5 - E5 - | G#4 - - - - - . .' },
  dungeon2: { gain: 1.15, bpm: 88, chords: ['Dm', 'Bb', 'C', 'A', 'Dm', 'Gm', 'A', 'A7'], per: 4, style: { arp: 'harp', bass: 'root4', pad: 'choir', bell: true, lead: 'celesta', echo: true },
    melody: 'D5 - - F5 - - A5 - | G5 - F5 - E5 - - - | E5 - - G5 - - C6 - | C#6 - - - - - - - | D6 - - A5 - - F5 - | G5 - - Bb5 - - D5 - | E5 - F5 - G5 - E5 - | C#5 - - - - - - -' },
  anvil: { bpm: 112, chords: ['Gm', 'Eb', 'F', 'D', 'Gm', 'Cm', 'D', 'D7'], per: 4, style: { arp: 'up', bass: 'root8', drums: 'anvil', pad: false, lead: 'brass' },
    melody: 'G4 - Bb4 - D5 - G5 - | F5 - Eb5 - D5 - - - | C5 - D5 - Eb5 - F5 - | F#5 - - - D5 - - - | G5 - F5 - Eb5 - D5 - | Eb5 - D5 - C5 - Bb4 - | A4 - Bb4 - C5 - D5 - | D5 - - - - - . .' },
  azurelle: { bpm: 100, chords: ['F', 'C/E', 'Dm', 'Bb', 'F', 'Gm', 'Bb', 'C'], per: 4, style: { arp: 'harp', bass: 'root4', pad: 'strings', lead: 'flute', bell: true, echo: true },
    melody: 'A5 - - G5 F5 - C5 - | E5 - - D5 C5 - - - | D5 - - E5 F5 - A5 - | Bb5 - - A5 G5 - - - | A5 - - C6 - - F5 - | G5 - - Bb5 - - D5 - | F5 - E5 - D5 - Bb4 - | C5 - - - - - - -' },
  sanctum: { gain: 2.2, bpm: 66, chords: ['C', 'Am', 'F', 'G', 'C', 'Em', 'F', 'Gsus4'], per: 4, style: { pad: 'choir', bell: true, arp: 'slow', lead: 'celesta', echo: true },
    melody: 'E5 - - - G5 - - - | A5 - - - - - - - | F5 - - - A5 - - - | G5 - - - - - - - | C6 - - - B5 - - - | G5 - - - - - - - | A5 - - - F5 - - - | G5 - - - - - - -' },
  sky: { bpm: 108, chords: ['Eb', 'Bb', 'Cm', 'Ab', 'Eb', 'Bb', 'Ab', 'Bb'], per: 4, style: { arp: 'up', bass: 'root4', pad: 'strings', lead: 'flute', drums: 'light', bell: true },
    melody: 'G5 - - Bb5 - - Eb6 - | D6 - - - Bb5 - - - | C6 - Bb5 - G5 - Eb5 - | F5 - - - - - - - | G5 - - Bb5 - - Eb6 - | F6 - - - D6 - - - | C6 - Bb5 - Ab5 - G5 - | F5 - - - Bb5 - - -' },
  last: { bpm: 132, chords: ['Bm', 'G', 'Em', 'F#', 'Bm', 'G', 'C', 'F#7'], per: 4, style: { arp: 'down', bass: 'root8', drums: 'epic', pad: 'choir', lead: 'brass', ctrInst: 'strings', crash: true },
    melody: 'B4 - D5 - F#5 - B5 - | A5 - G5 - F#5 - - - | G5 - F#5 - E5 - D5 - | C#5 - - - A#4 - - - | B4 - F#5 - B5 - D6 - | C#6 - B5 - A5 - G5 - | E5 - G5 - C6 - B5 - | A#5 - - - - - - -',
    ctr: 'D4 - - - F#4 - - - | D4 - - - B3 - - - | B3 - - - G4 - - - | F#4 - - - C#4 - - - | D4 - - - F#4 - - - | B3 - - - D4 - - - | C4 - - - E4 - - - | C#4 - - - E4 - - -' },
  battle: { bpm: 152, chords: ['Am', 'F', 'G', 'E', 'Am', 'F', 'Dm', 'E', 'F', 'G', 'Em', 'Am', 'Dm', 'E', 'Am', 'E7'], per: 4, style: { arp: 'battle', bass: 'gallop', drums: 'battle', lead: 'brass', pad: 'strings', ctrInst: 'strings', crash: true },
    melody: 'A5 - E5 A5 - B5 C6 - | A5 - - F5 - C5 F5 - | G5 - D5 G5 - A5 B5 - | G#5 - - E5 - - - - | A5 - C6 - B5 - A5 - | F5 - A5 - C6 - D6 - | D6 - C6 - B5 - A5 - | G#5 - B5 - E6 - - - | C6 - - A5 - - F5 - | D6 - - B5 - - G5 - | E6 - D6 - B5 - G5 - | A5 - - - E5 A5 C6 - | D6 - C6 - A5 - F5 - | G#5 - B5 - E6 - D6 - | C6 - B5 - A5 - E5 - | E5 - G#5 - B5 - D6 -',
    ctr: 'C4 - - - E4 - - - | A3 - - - C4 - - - | B3 - - - D4 - - - | B3 - - - G#3 - - - | C4 - - - E4 - - - | C4 - - - A3 - - - | F4 - - - D4 - - - | E4 - - - G#4 - - - | A4 - - - - - - - | B4 - - - - - - - | G4 - - - - - - - | E4 - - - A4 - - - | F4 - - - - - - - | E4 - - - G#4 - - - | E4 - - - C4 - - - | B3 - - - D4 - - -' },
  battle2: { bpm: 160, chords: ['Cm', 'Ab', 'Bb', 'G', 'Cm', 'Ab', 'Fm', 'G', 'Ab', 'Bb', 'Gm', 'Cm', 'Fm', 'G', 'Cm', 'G7'], per: 4, style: { arp: 'battle', bass: 'gallop', drums: 'battle', lead: 'brass', pad: 'choir', ctrInst: 'strings', crash: true },
    melody: 'C5 - Eb5 G5 - C6 - Bb5 | Ab5 - G5 - Eb5 - C5 - | D5 - F5 Bb5 - D6 - C6 | B5 - - - G5 - D5 - | C5 - Eb5 G5 - C6 - D6 | Eb6 - D6 - C6 - Ab5 - | F5 - Ab5 - C6 - Eb6 - | D6 - - - B5 - G5 - | C6 - - - Eb6 - - - | D6 - - - F6 - - - | G6 - F6 - D6 - Bb5 - | C6 - - - G5 - Eb5 - | F5 - G5 - Ab5 - C6 - | B5 - C6 - D6 - F6 - | Eb6 - D6 - C6 - G5 - | B5 - - - D6 - F6 -',
    ctr: 'Eb4 - - - G4 - - - | C4 - - - Eb4 - - - | D4 - - - F4 - - - | D4 - - - B3 - - - | Eb4 - - - G4 - - - | C4 - - - Eb4 - - - | C4 - - - Ab4 - - - | B3 - - - D4 - - - | Eb4 - - - - - - - | F4 - - - - - - - | D4 - - - G4 - - - | Eb4 - - - C4 - - - | C4 - - - F4 - - - | D4 - - - B3 - - - | C4 - - - Eb4 - - - | D4 - - - F4 - - -' },
  boss: { bpm: 160, chords: ['Dm', 'Bb', 'C', 'A', 'Dm', 'Bb', 'Gm', 'A7'], per: 4, style: { arp: 'battle', bass: 'gallop', drums: 'epic', lead: 'brass', pad: 'choir', ctrInst: 'horn', crash: true },
    melody: 'D5 - F5 - A5 - D6 - | C6 - Bb5 - A5 - F5 - | G5 - E5 - C5 - E5 G5 | A5 - - - C#6 - - - | D6 - C6 - Bb5 - A5 - | Bb5 - A5 - G5 - F5 - | G5 - Bb5 - D6 - G5 - | A5 - - - - - E5 -',
    ctr: 'D4 - - - A3 - - - | D4 - - - F4 - - - | E4 - - - G4 - - - | E4 - - - C#4 - - - | F4 - - - D4 - - - | D4 - - - F4 - - - | Bb3 - - - D4 - - - | C#4 - - - E4 - - -' },
  victory: { bpm: 140, chords: ['C', 'F', 'G', 'C'], per: 4, style: { arp: 'up', bass: 'root4', drums: 'light', lead: 'brass', pad: 'strings' }, once: false,
    melody: 'G5 G5 G5 - C6 - - - | A5 - C6 - F6 - - - | D6 - B5 - G5 - D6 - | C6 - - - - - - -' },
  // the main theme again, a fourth higher and slower, carried by strings and a choir
  ending: { bpm: 70, chords: TITLE_CH, per: 4, transpose: 5, style: { arp: 'harp', bass: 'root4', pad: 'choir', bell: true, lead: 'strings', ctrInst: 'horn', echo: true },
    melody: TITLE_MEL, ctr: TITLE_CTR },
  // inns and houses: a warm little tune on piano over a harp
  inn: { gain: 1.25, bpm: 92, chords: ['F', 'Am', 'Bb', 'C', 'F', 'Dm', 'Gm', 'C', 'Bb', 'C', 'Am', 'Dm', 'Gm', 'C', 'F', 'F'], per: 4, style: { arp: 'harp', bass: 'root4', lead: 'piano', bell: true, ctrInst: 'ocarina' },
    melody: 'C5 - F5 - A5 - G5 F5 | E5 - - - C5 - - - | D5 - F5 - Bb5 - A5 G5 | G5 - - - - - . . | A5 - C6 - A5 - F5 - | F5 - E5 - D5 - A4 - | Bb4 - D5 - G5 - F5 - | E5 - - - - - . . | D6 - - C6 Bb5 - A5 - | G5 - - - E5 - C5 - | C6 - - Bb5 A5 - G5 - | F5 - - - D5 - - - | D5 - G5 - Bb5 - A5 - | G5 - E5 - C5 - E5 - | F5 - - - A4 - C5 - | F5 - - - - - . .',
    ctr: '. . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | F4 - - - - - - - | E4 - - - - - - - | E4 - - - - - - - | D4 - - - - - - - | Bb3 - - - - - - - | C4 - - - - - - - | A3 - - - C4 - - - | A3 - - - - - - -' },
  // mountain paths: an ocarina over open fifths and a light march
  highland: { bpm: 112, chords: ['G', 'F', 'C', 'G', 'G', 'F', 'C', 'D', 'Em', 'C', 'G', 'D', 'Em', 'C', 'F', 'G'], per: 4, style: { arp: 'up', bass: 'root4', drums: 'light', pad: 'strings', lead: 'ocarina', ctrInst: 'horn', echo: true },
    melody: 'D5 - G5 - - A5 B5 - | C6 - B5 - A5 - F5 - | G5 - E5 - C5 - E5 - | D5 - - - - - . . | D5 - G5 - - A5 B5 - | C6 - D6 - C6 - A5 - | G5 - A5 - E5 - G5 - | F#5 - - - - - . . | B5 - - - G5 - E5 - | G5 - - - E5 - C5 - | D5 - G5 - B5 - D6 - | A5 - - - F#5 - - - | G5 - A5 - B5 - G5 - | E5 - G5 - C6 - B5 - | A5 - G5 - F5 - A5 - | G5 - - - - - . .',
    ctr: 'B3 - - - - - - - | A3 - - - - - - - | G3 - - - - - - - | B3 - - - - - - - | B3 - - - - - - - | C4 - - - - - - - | E4 - - - - - - - | A3 - - - - - - - | E4 - - - - - - - | E4 - - - - - - - | D4 - - - - - - - | F#4 - - - - - - - | E4 - - - - - - - | C4 - - - - - - - | C4 - - - - - - - | B3 - - - - - - -' },
  // the coast: a breezy flute, plucked harp and a lazy beat
  seaside: { bpm: 104, chords: ['E', 'C#m', 'A', 'B', 'E', 'G#m', 'A', 'B', 'C#m', 'A', 'E', 'B', 'A', 'B', 'E', 'E'], per: 4, style: { arp: 'harp', bass: 'root4', drums: 'light', pad: 'strings', lead: 'flute', bell: true, echo: true },
    melody: 'B4 - E5 - G#5 - B5 - | G#5 - - - E5 - C#5 - | C#5 - E5 - A5 - G#5 - | F#5 - - - - - . . | B4 - E5 - G#5 - B5 - | D#6 - - - B5 - G#5 - | A5 - G#5 - F#5 - E5 - | F#5 - - - - - . . | E5 - - - G#5 - - - | C#6 - - - B5 - A5 - | G#5 - - - E5 - B4 - | D#5 - F#5 - B5 - - - | C#6 - B5 - A5 - G#5 - | F#5 - G#5 - A5 - B5 - | G#5 - - - E5 - - - | E5 - - - - - . .' },
  // the mines: a music box ringing in the dark, low toms, a choir far off
  mine: { bpm: 92, chords: ['Am', 'Am', 'F', 'E', 'Am', 'Am', 'Dm', 'E', 'F', 'G', 'Am', 'Am', 'Dm', 'E', 'Am', 'E7'], per: 4, style: { arp: 'down', bass: 'root4', drums: 'tom', pad: 'choir', lead: 'celesta', echo: true },
    melody: 'E5 - - - . . A5 - | G5 - E5 - - - . . | F5 - - - . . C6 - | B5 - G#5 - - - . . | E5 - - - . . A5 - | C6 - B5 - A5 - . . | F5 - A5 - D6 - C6 - | B5 - - - - - . . | A5 - - - C6 - - - | B5 - - - D6 - - - | C6 - B5 - A5 - E5 - | A5 - - - - - . . | F5 - - - A5 - D6 - | B5 - - - G#5 - E5 - | A5 - - - C6 - E6 - | D6 - - - B5 - G#5 -' },
};
const parseLine = (str) => (str || '').replace(/\|/g, ' ').split(/\s+/).filter(Boolean);

// where each instrument sits from left to right
const PAN = { piano: -0.05, brass: 0.05, horn: 0.25, strings: -0.3, choir: 0, flute: 0.1, ocarina: 0.1, celesta: 0.2, square: 0, pulse: 0.3, pluck: -0.35, bass: 0, pad: 0, bell: 0.35 };

export class Audio {
  constructor() { this.ctx = null; this.vol = { music: 0.6, sfx: 0.8 }; this.song = null; this.nextT = 0; this.step = 0; }
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const C = this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = C.createGain(); this.master.gain.value = 0.9;
    // a gentle bus compressor keeps the louder arrangements from clipping
    const comp = C.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.25;
    this.master.connect(comp); comp.connect(C.destination);
    this.mus = C.createGain(); this.mus.gain.value = this.vol.music * 0.5; this.sfxG = C.createGain(); this.sfxG.gain.value = this.vol.sfx * 0.6;
    // a hall: a long stereo reverb
    const len = C.sampleRate * 2.4, ir = C.createBuffer(2, len, C.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    this.rev = C.createConvolver(); this.rev.buffer = ir; this.revG = C.createGain(); this.revG.gain.value = 0.3;
    this.mus.connect(this.master); this.sfxG.connect(this.master); this.mus.connect(this.revG); this.revG.connect(this.rev); this.rev.connect(this.master);
    // an echo for melodies that want space (dotted-eighth delay, set per song)
    this.dly = C.createDelay(1.5); this.dlyFb = C.createGain(); this.dlyFb.gain.value = 0.32; this.dlyOut = C.createGain(); this.dlyOut.gain.value = 0.26;
    const dlf = C.createBiquadFilter(); dlf.type = 'lowpass'; dlf.frequency.value = 2600;
    this.dly.connect(dlf); dlf.connect(this.dlyFb); this.dlyFb.connect(this.dly); dlf.connect(this.dlyOut); this.dlyOut.connect(this.mus);
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
    const s = SONGS[name]; this.song = s;
    const out = this.ctx.createGain(); out.gain.value = s.gain || 1; out.connect(this.mus); this.songOut = out;
    s.mel = parseLine(s.melody); s.ctrL = parseLine(s.ctr);
    this.dly.delayTime.value = Math.min(1.4, 60 / s.bpm * 0.75);
    this.step = 0; this.nextT = this.ctx.currentTime + 0.1;
  }
  schedule() {
    const s = this.song; if (!s || !this.ctx) return;
    const C = this.ctx, e8 = 60 / s.bpm / 2, T = s.transpose || 0;
    while (this.nextT < C.currentTime + 0.15) {
      const st = this.step, t = this.nextT, per8 = s.per * 2;
      const totalSteps = s.chords.length * per8;
      const ci = Math.floor((st % totalSteps) / per8), chord = chordNotes(s.chords[ci].split('/')[0], 3).map((n) => n + T), inBar = st % per8;
      const S = s.style, sectionStart = st % (per8 * 8) === 0;
      // melody, and the counter-melody under it
      const line = (L, inst, vol, send) => {
        if (!L.length) return; const mi = st % L.length, tok = L[mi];
        if (tok && tok !== '-' && tok !== '.') {
          let len = 1; while (L[(mi + len) % L.length] === '-' && len < 16) len++;
          const m = midi(tok); if (m) this.voice(inst, freq(m + T), t, len * e8, vol, send);
        }
      };
      line(s.mel, S.lead || 'square', 0.13, S.echo);
      line(s.ctrL, S.ctrInst || 'strings', 0.075, false);
      // arpeggio
      if (S.arp) {
        const seq = S.arp === 'down' ? [3, 2, 1, 0, 3, 2, 1, 0] : S.arp === 'harp' ? [0, 1, 2, 3, 4, 3, 2, 1] : S.arp === 'battle' ? [0, 1, 2, 1, 0, 1, 2, 1] : S.arp === 'slow' ? [0, -1, 1, -1, 2, -1, 1, -1] : [0, 1, 2, 3, 0, 1, 2, 3];
        const k = seq[inBar % 8];
        if (k >= 0) { const notes = [...chord.map(n => n + 12), chord[0] + 24]; const n = notes[k % notes.length]; this.voice(S.arp === 'battle' ? 'pulse' : 'pluck', freq(n), t, e8 * (S.arp === 'slow' ? 2 : 0.9), S.arp === 'battle' ? 0.045 : 0.055); }
      }
      // bass
      if (S.bass) {
        const r = chord[0] - 12;
        if (S.bass === 'root8' || (S.bass === 'root4' && inBar % 2 === 0)) this.voice('bass', freq(r + (S.bass === 'root8' && inBar % 4 === 3 ? 7 : S.bass === 'root4' && inBar === 6 ? 7 : 0)), t, e8 * (S.bass === 'root4' ? 1.8 : 0.9), 0.16);
        if (S.bass === 'walk' && inBar % 2 === 0) this.voice('bass', freq(r + [0, 4, 7, 9][(inBar / 2) % 4]), t, e8 * 1.8, 0.16);
        if (S.bass === 'gallop') this.voice('bass', freq(r + (inBar % 8 === 6 ? 12 : 0)), t, e8 * 0.6, 0.17);
      }
      // the pad holds the chord for the bar: string section, choir, or the old synth pad
      if (S.pad && inBar === 0) { const pt = S.pad === true ? 'pad' : S.pad; for (const n of chord) this.voice(pt, freq(n + 12), t, e8 * per8 * 0.98, pt === 'pad' ? 0.035 : 0.03); }
      if (S.bell && inBar === 0 && ci % 2 === 0) this.voice('bell', freq(chord[2] + 24), t, e8 * 6, 0.04);
      // drums
      const D = S.drums;
      if (S.crash && sectionStart && st > 0) this.drum('crash', t, 0.8);
      if (D) {
        const b = inBar % 8;
        if (D === 'battle') { if (b % 4 === 0) this.drum('kick', t); if (b % 4 === 2) this.drum('snare', t); this.drum('hat', t, 0.5); if (b === 7) this.drum('snare', t + e8 / 2, 0.5); }
        else if (D === 'epic') { if (b === 0 || b === 3 || b === 6) this.drum('timp', t, b === 0 ? 1 : 0.7); if (b % 4 === 2) this.drum('snare', t, 0.8); this.drum('hat', t, 0.35); if (b === 7) { this.drum('snare', t + e8 / 2, 0.5); this.drum('timp', t + e8 / 2, 0.5); } }
        else if (D === 'march') { if (b === 0 || b === 4) this.drum('kick', t); if (b === 2 || b === 6) this.drum('snare', t, 0.7); if (b % 2 === 1) this.drum('hat', t, 0.4); if (b === 7) this.drum('snare', t + e8 / 2, 0.4); }
        else if (D === 'light') { if (b === 0) this.drum('kick', t, 0.7); if (b === 4) this.drum('snare', t, 0.4); if (b % 2 === 0) this.drum('hat', t, 0.3); }
        else if (D === 'tom') { if (b === 0 || b === 3) this.drum('tom', t); if (b === 6) this.drum('tom', t, 0.6); }
        else if (D === 'anvil') { if (b === 0 || b === 4) this.drum('kick', t); if (b === 2 || b === 6) this.drum('clank', t, 0.6); this.drum('hat', t, 0.25); }
      }
      this.step++; this.nextT += e8;
    }
  }
  voice(type, f, t, dur, vol, send = false) {
    const C = this.ctx, g = C.createGain(), out = this.songOut; if (!out) return;
    const nodes = [], stopAt = t + dur * 1.7 + 0.7;
    const osc = (wave, fr, det = 0) => { const o = C.createOscillator(); o.type = wave; o.frequency.value = fr; o.detune.value = det; nodes.push(o); return o; };
    const lp = (fr, q = 0.7) => { const b = C.createBiquadFilter(); b.type = 'lowpass'; b.frequency.value = fr; b.Q.value = q; return b; };
    const vib = (o, depth, rate = 5.5, delay = 0.18) => { const l = C.createOscillator(), lg = C.createGain(); l.frequency.value = rate; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * depth, t + delay + 0.2); l.connect(lg); lg.connect(o.frequency); nodes.push(l); };
    // the envelope: attack, then either a decay to silence (struck and plucked sounds) or a hold and release
    const env = (A, R, decay) => {
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + A);
      if (decay) g.gain.exponentialRampToValueAtTime(0.001, t + decay);
      else { g.gain.setValueAtTime(vol, t + Math.max(A, dur - 0.04)); g.gain.linearRampToValueAtTime(0, t + dur + R); }
    };
    let head = g;
    if (type === 'strings') {
      // a section: three saws a few cents apart, softened
      const f1 = lp(Math.min(5000, f * 5), 0.5); for (const d of [-8, 0, 8]) { const o = osc('sawtooth', f, d); vib(o, 0.004, 5 + Math.random()); o.connect(f1); } f1.connect(g);
      env(dur > 1.2 ? 0.25 : 0.06, 0.3);
    } else if (type === 'choir') {
      // voices: a buzzy source through two vowel formants ("ah")
      const src = C.createGain(); for (const d of [-6, 6]) { const o = osc('sawtooth', f, d); vib(o, 0.006, 4.6, 0.3); o.connect(src); }
      for (const [ff, q, gg] of [[760, 5, 1], [1180, 6, 0.6], [2500, 8, 0.25]]) { const b = C.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = ff; b.Q.value = q; const bg = C.createGain(); bg.gain.value = gg * 2.2; src.connect(b); b.connect(bg); bg.connect(g); }
      env(0.35, 0.5);
    } else if (type === 'piano') {
      const f1 = lp(Math.min(6000, f * 6)); osc('triangle', f).connect(f1); const h2 = C.createGain(); h2.gain.value = 0.35; osc('sine', f * 2).connect(h2); h2.connect(f1); const h3 = C.createGain(); h3.gain.value = 0.12; osc('sine', f * 3.01).connect(h3); h3.connect(f1); f1.connect(g);
      env(0.004, 0, Math.max(0.6, dur * 1.6));
    } else if (type === 'horn') {
      const f1 = lp(700, 1); f1.frequency.setValueAtTime(500, t); f1.frequency.linearRampToValueAtTime(1500, t + 0.09); const o = osc('sawtooth', f); vib(o, 0.005, 5); o.connect(f1); const o2 = osc('sawtooth', f, 5); o2.connect(f1); f1.connect(g);
      env(0.05, 0.12);
    } else if (type === 'ocarina' || type === 'flute') {
      const o = osc(type === 'flute' ? 'triangle' : 'sine', f); vib(o, 0.007, 5.4, 0.22); o.connect(g); const h = C.createGain(); h.gain.value = type === 'flute' ? 0.15 : 0.08; osc('sine', f * 2).connect(h); h.connect(g);
      if (type === 'ocarina') { const n = C.createBufferSource(); n.buffer = this.noise; const nb = C.createBiquadFilter(); nb.type = 'bandpass'; nb.frequency.value = f * 2; nb.Q.value = 3; const ng = C.createGain(); ng.gain.setValueAtTime(0.12, t); ng.gain.exponentialRampToValueAtTime(0.01, t + 0.12); n.connect(nb); nb.connect(ng); ng.connect(g); nodes.push(n); }
      env(0.03, 0.08);
    } else if (type === 'celesta' || type === 'bell') {
      osc('sine', f).connect(g); const h = C.createGain(); h.gain.value = type === 'bell' ? 0.3 : 0.22; osc('sine', f * (type === 'bell' ? 2.76 : 4)).connect(h); h.connect(g);
      env(0.004, 0, Math.max(0.5, dur) * (type === 'bell' ? 2 : 1.4));
    } else if (type === 'pluck') {
      const f1 = lp(Math.min(5000, f * 7)); f1.frequency.setValueAtTime(Math.min(6000, f * 8), t); f1.frequency.exponentialRampToValueAtTime(Math.max(200, f * 1.5), t + 0.4); osc('triangle', f).connect(f1); const h = C.createGain(); h.gain.value = 0.25; osc('sawtooth', f).connect(h); h.connect(f1); f1.connect(g);
      env(0.004, 0, Math.max(dur, 0.35));
    } else if (type === 'brass') {
      const f1 = lp(800); f1.frequency.setValueAtTime(800, t); f1.frequency.linearRampToValueAtTime(2600, t + 0.08); f1.frequency.linearRampToValueAtTime(1900, t + 0.3); const o = osc('sawtooth', f); vib(o, 0.006); o.connect(f1); osc('sawtooth', f, 7).connect(f1); f1.connect(g);
      env(0.02, 0.08);
    } else if (type === 'square' || type === 'pulse') {
      const f1 = lp(type === 'square' ? 3000 : 1800); const o = osc('square', f); if (type === 'square') vib(o, 0.006); o.connect(f1); f1.connect(g);
      env(0.01, 0.06);
    } else if (type === 'bass') {
      const f1 = lp(Math.min(900, f * 5)); osc('triangle', f).connect(f1); const h = C.createGain(); h.gain.value = 0.3; osc('sawtooth', f).connect(h); h.connect(f1); f1.connect(g);
      env(0.01, 0.06);
    } else { // pad
      const f1 = lp(900); osc('sawtooth', f).connect(f1); osc('sawtooth', f, 9).connect(f1); f1.connect(g);
      env(0.4, 0.4);
    }
    const pan = C.createStereoPanner ? C.createStereoPanner() : null;
    if (pan) { pan.pan.value = Math.max(-1, Math.min(1, (PAN[type] ?? 0) + (type === 'strings' || type === 'choir' ? (Math.random() - 0.5) * 0.5 : 0))); head.connect(pan); pan.connect(out); if (send) pan.connect(this.dly); }
    else { head.connect(out); if (send) head.connect(this.dly); }
    for (const n of nodes) { n.start(t); n.stop(stopAt + (type === 'bell' || type === 'celesta' ? 1.5 : 0)); }
  }
  drum(kind, t, v = 1) {
    const C = this.ctx, g = C.createGain(); const out = this.songOut; if (!out) return; g.connect(out);
    if (kind === 'kick' || kind === 'tom' || kind === 'timp') {
      const o = C.createOscillator(); const f0 = kind === 'kick' ? 140 : kind === 'tom' ? 220 : 110, f1 = kind === 'kick' ? 40 : kind === 'tom' ? 90 : 70, d = kind === 'timp' ? 0.9 : 0.25;
      o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + (kind === 'timp' ? 0.4 : 0.15));
      g.gain.setValueAtTime((kind === 'timp' ? 0.5 : 0.35) * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g); o.start(t); o.stop(t + d + 0.05);
      if (kind === 'timp') { const n = C.createBufferSource(); n.buffer = this.noise; const f = C.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400; const ng = C.createGain(); ng.gain.setValueAtTime(0.25 * v, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.3); n.connect(f); f.connect(ng); ng.connect(out); n.start(t); n.stop(t + 0.35); }
    } else {
      const n = C.createBufferSource(); n.buffer = this.noise; const f = C.createBiquadFilter();
      f.type = kind === 'hat' || kind === 'crash' ? 'highpass' : 'bandpass'; f.frequency.value = kind === 'hat' ? 7000 : kind === 'crash' ? 4500 : kind === 'clank' ? 2500 : 1600; f.Q.value = kind === 'clank' ? 8 : 0.8;
      const d = kind === 'hat' ? 0.04 : kind === 'crash' ? 1.6 : 0.16; g.gain.setValueAtTime((kind === 'hat' ? 0.07 : kind === 'crash' ? 0.12 : 0.18) * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
      n.loop = kind === 'crash'; n.connect(f); f.connect(g); n.start(t); n.stop(t + d + 0.02);
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
      case 'guard': tone(1500, 0.09, 'triangle', 0.1, 900); noise(0.06, 4200, 0.18, 'highpass'); break;
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
