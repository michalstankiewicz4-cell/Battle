// Keyboard + mouse. Keys are tracked by KeyboardEvent.code; onPress(code) fires on key-down edges.
// Left mouse button = fire (held), right button drag = rotate camera, wheel = zoom.
// Pointer lock (gun camera): mouse movement goes to onLook(dx, dy) instead of moving the cursor.
export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.down = new Set();
    this.mouse = { x: 0, y: 0, px: 0, py: 0 };
    this.firing = false;
    this.dragging = false;
    this.locked = false;
    this.onPress = null; this.onWheel = null; this.onDrag = null; this.onLook = null;
    this.onCanvasDown = null; this.onLockChange = null;
    const typing = (e) => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName || '');
    addEventListener('keydown', (e) => {
      if (typing(e)) return;
      if (['Space', 'Tab', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
      if (!e.repeat) this.onPress?.(e.code);
      this.down.add(e.code);
    });
    addEventListener('keyup', (e) => this.down.delete(e.code));
    addEventListener('blur', () => this.clear());
    addEventListener('mousemove', (e) => {
      if (this.locked) { this.onLook?.(e.movementX || 0, e.movementY || 0); return; }
      const mx = e.clientX, my = e.clientY;
      if (this.dragging) this.onDrag?.(mx - this.mouse.px, my - this.mouse.py);
      this.mouse.px = mx; this.mouse.py = my;
      this.mouse.x = mx / innerWidth * 2 - 1; this.mouse.y = -(my / innerHeight) * 2 + 1;
    });
    canvas.addEventListener('mousedown', (e) => {
      this.onCanvasDown?.(e);
      if (e.button === 0) this.firing = true;
      if (e.button === 2 || e.button === 1) this.dragging = true;
    });
    addEventListener('mouseup', (e) => {
      if (e.button === 0) this.firing = false;
      if (e.button === 2 || e.button === 1) this.dragging = false;
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('wheel', (e) => { e.preventDefault(); this.onWheel?.(e.deltaY); }, { passive: false });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === canvas;
      this.onLockChange?.(this.locked);
    });
  }
  // Pointer lock needs a user gesture (a key press or click); failures are ignored (the cursor aim still works).
  lock() {
    if (this.locked || !this.canvas.requestPointerLock) return;
    try { const p = this.canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* not allowed here */ }
  }
  unlock() { if (this.locked) document.exitPointerLock?.(); }
  isDown(...codes) { return codes.some((c) => this.down.has(c)) ? 1 : 0; }
  clear() { this.down.clear(); this.firing = false; this.dragging = false; }
}
