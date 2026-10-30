// Keyboard and touch in one place. Field code reads the axis; menus listen for key events.
export class Input {
  constructor() {
    this.keys = new Set(); this.listeners = []; this.axis = { x: 0, y: 0 }; this.run = false;
    this.touchy = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const map = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Enter: 'ok', KeyZ: 'ok', Space: 'ok', Escape: 'cancel', KeyX: 'cancel', Backspace: 'cancel', KeyC: 'menu', Tab: 'menu', KeyM: 'map', KeyR: 'mount' };
    addEventListener('keydown', (e) => {
      if (e.repeat && !['up', 'down', 'left', 'right'].includes(map[e.code])) return;
      this.keys.add(e.code);
      const k = map[e.code]; if (k) { this.emit(k); if (e.code === 'Tab' || e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault(); }
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
    this.stick = { x: 0, y: 0, id: null };
  }
  on(fn) { this.listeners.push(fn); return () => { this.listeners = this.listeners.filter(f => f !== fn); }; }
  // only the newest listener gets events (menus stack)
  emit(k) { const l = this.listeners[this.listeners.length - 1]; if (l) l(k); }
  poll() {
    const K = this.keys;
    let x = (K.has('ArrowRight') || K.has('KeyD') ? 1 : 0) - (K.has('ArrowLeft') || K.has('KeyA') ? 1 : 0);
    let y = (K.has('ArrowDown') || K.has('KeyS') ? 1 : 0) - (K.has('ArrowUp') || K.has('KeyW') ? 1 : 0);
    if (this.stick.id !== null) { x = this.stick.x; y = this.stick.y; }
    this.axis.x = x; this.axis.y = y;
    this.run = K.has('ShiftLeft') || K.has('ShiftRight') || this.stick.run;
    this.turn = (K.has('KeyE') || K.has('PageDown') ? 1 : 0) - (K.has('KeyQ') || K.has('PageUp') ? 1 : 0);
    return this;
  }
  // on-screen stick + buttons
  bindTouch(el) {
    const pad = el.querySelector('#tpad'), knob = el.querySelector('#tknob');
    const start = (e) => { const t = e.changedTouches[0]; this.stick.id = t.identifier; this.stick.cx = t.clientX; this.stick.cy = t.clientY; pad.style.left = t.clientX + 'px'; pad.style.top = t.clientY + 'px'; pad.classList.add('on'); move(e); e.preventDefault(); };
    const move = (e) => {
      for (const t of e.changedTouches) if (t.identifier === this.stick.id) {
        let dx = t.clientX - this.stick.cx, dy = t.clientY - this.stick.cy; const d = Math.hypot(dx, dy), R = 50;
        if (d > R) { dx *= R / d; dy *= R / d; }
        this.stick.x = dx / R; this.stick.y = dy / R; this.stick.run = d > R * 0.95;
        knob.style.transform = `translate(${dx}px,${dy}px)`;
        // menus: a flick of the stick acts like arrow keys
        const now = performance.now();
        if (d > 30 && now - (this.lastFlick || 0) > 260) { this.lastFlick = now; this.emit(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')); }
      }
      e.preventDefault();
    };
    const end = (e) => { for (const t of e.changedTouches) if (t.identifier === this.stick.id) { this.stick.id = null; this.stick.x = this.stick.y = 0; knob.style.transform = ''; pad.classList.remove('on'); } };
    const zone = el.querySelector('#tzone');
    zone.addEventListener('touchstart', start, { passive: false }); zone.addEventListener('touchmove', move, { passive: false }); zone.addEventListener('touchend', end); zone.addEventListener('touchcancel', end);
    for (const b of el.querySelectorAll('[data-k]')) b.addEventListener('touchstart', (e) => { e.preventDefault(); this.emit(b.dataset.k); b.classList.add('down'); setTimeout(() => b.classList.remove('down'), 150); }, { passive: false });
    for (const b of el.querySelectorAll('[data-k]')) b.addEventListener('mousedown', (e) => { e.preventDefault(); this.emit(b.dataset.k); });
  }
}
