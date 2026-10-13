// Procedural sound (Web Audio, no files): filtered noise bursts for guns, splashes, hits and explosions.
// The audio context starts on the first user gesture (browser autoplay rules).
export function createSound(getVolume) {
  let ctx = null, master = null, noise = null;
  function init() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.connect(ctx.destination);
      const len = ctx.sampleRate * 2;
      noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { ctx = null; }
  }
  addEventListener('pointerdown', init, { once: false });
  addEventListener('keydown', init, { once: false });

  function burst({ freq = 400, q = 0.7, dur = 0.5, gain = 0.5, type = 'lowpass', attack = 0.005, delay = 0, sweep = 0 }) {
    if (!ctx || ctx.state === 'suspended') { ctx?.resume?.(); }
    if (!ctx) return;
    const v = getVolume();
    if (v <= 0) return;
    master.gain.value = v;
    const t = ctx.currentTime + delay;
    const src = ctx.createBufferSource(); src.buffer = noise;
    src.playbackRate.value = 0.6 + Math.random() * 0.3;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(30, freq * sweep), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t, Math.random()); src.stop(t + dur + 0.05);
  }
  function tone(freq, dur, gain, delay = 0) {
    if (!ctx) return;
    const v = getVolume(); if (v <= 0) return;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  }

  let lastGun = 0;
  return {
    init,
    gun(cal, mine) {
      const now = performance.now();
      if (!mine && now - lastGun < 120) return;
      lastGun = now;
      const k = mine ? 1 : 0.35;
      burst({ freq: 900 - cal * 900, dur: 0.5 + cal * 1.2, gain: 0.55 * k, sweep: 0.2 });
      burst({ freq: 90, dur: 0.6 + cal, gain: 0.5 * k, attack: 0.01 });
    },
    splash(cal) { burst({ freq: 1800, type: 'bandpass', q: 0.6, dur: 0.6 + cal, gain: 0.08, delay: 0, sweep: 0.4 }); },
    hit(kind, onMe) {
      const k = onMe ? 0.6 : 0.3;
      if (kind === 'torp') { burst({ freq: 120, dur: 1.6, gain: 0.9 * k + 0.2 }); return; }
      burst({ freq: kind === 'cit' ? 500 : 1400, type: 'bandpass', q: 1.2, dur: 0.35, gain: 0.35 * k });
      burst({ freq: 160, dur: 0.5, gain: 0.3 * k });
    },
    boom() { burst({ freq: 70, dur: 2.5, gain: 0.8, attack: 0.02 }); burst({ freq: 600, dur: 1.2, gain: 0.25, sweep: 0.2 }); },
    torp() { burst({ freq: 300, type: 'bandpass', dur: 0.4, gain: 0.25 }); },
    repair() { tone(660, 0.15, 0.12); tone(880, 0.2, 0.12, 0.12); },
    bell() { tone(988, 0.5, 0.12); tone(988, 0.5, 0.12, 0.35); },
    click() { tone(1200, 0.05, 0.05); },
  };
}
