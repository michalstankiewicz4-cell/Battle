// Application shell: renderer + pixel pipeline, world, camera rig, UI and the mode state machine
// (menu -> play -> dead), pause handling and the frame loop.
import * as THREE from '../../vendor/three.module.js';
import { PixelPipeline } from '../render/pixel-pipeline.js';
import { StylePipeline } from '../render/style-pipeline.js';
import { LOOK, setStyle, STYLES } from '../render/look.js';
import { createWorld } from '../world/index.js';
import { Input } from '../input/input.js';
import { createSettings } from './settings.js';
import { createCameraRig } from './cameras.js';
import { createSound } from './sound.js';
import { read, write, KEYS } from './storage.js';
import { setLang, onLang, t } from '../i18n/index.js';
import { createHud } from '../ui/hud.js';
import { createMenu } from '../ui/menu.js';
import { CLASS_KEYS } from '../world/constants.js';
import { VERSION } from '../version.js';

const NO_CTL = { thr: 0, steer: 0, aim: null, fire: false, weapon: 'guns', repair: false };

export function createApp({ appEl, uiEl }) {
  const settings = createSettings();
  setLang(settings.data.lang);

  // Graphics style: ?style=… in the URL wins (previews), otherwise Options > Graphics. Applied at start-up.
  const urlStyle = new URLSearchParams(location.search).get('style');
  setStyle(STYLES.includes(urlStyle) ? urlStyle : settings.data.gfx.style);

  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = LOOK.detail;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  appEl.appendChild(renderer.domElement);
  const canvas = renderer.domElement;

  let muted = false;
  const sound = createSound(() => (muted ? 0 : settings.data.vol));
  const scene = new THREE.Scene();
  const world = createWorld(scene, { sound });
  const S = world.S;
  const input = new Input(canvas);
  const pipe = LOOK.style === 'pixel' ? new PixelPipeline(renderer) : new StylePipeline(renderer, LOOK.style);
  const rig = createCameraRig({ settings, input });

  /* ---- persistent progress ---- */
  const progress = {
    best: 0, bestWave: 0, cls: 'ca',
    save() { write(KEYS.save, { best: this.best, bestWave: this.bestWave, cls: this.cls }); },
    load() {
      const d = read(KEYS.save);
      if (!d || typeof d !== 'object') return;
      this.best = Math.max(0, Math.floor(+d.best) || 0);
      this.bestWave = Math.max(0, Math.floor(+d.bestWave) || 0);
      if (CLASS_KEYS.includes(d.cls)) this.cls = d.cls;
    },
  };
  progress.load();

  /* ---- aiming: mouse ray onto the sea plane (y = 0) ---- */
  const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3(), ndc = new THREE.Vector2();
  function seaAt() {
    ray.setFromCamera(ndc.set(input.mouse.x, input.mouse.y), rig.camera);
    return ray.ray.intersectPlane(plane, hit) ? { x: hit.x, z: hit.z } : null;
  }

  /* ---- state machine ---- */
  let mode = 'menu', paused = false, weapon = 'guns', thrStep = 0, repairReq = false, deadT = 0;
  const hud = createHud(uiEl);
  const menu = createMenu(uiEl, {
    actions: { start: (cls) => startRun(cls), resume: () => resume(), quit: () => goMenu() },
    settings, progress,
  });

  function goMenu() {
    mode = 'menu'; paused = false;
    world.reset('menu', progress.cls); input.clear();
    hud.show(false); menu.show('main');
  }
  function startRun(cls) {
    progress.cls = cls; progress.save();
    mode = 'play'; paused = false; weapon = 'guns'; deadT = 0;
    world.reset('play', cls); input.clear();
    menu.hide(); hud.show(true);
    hud.banner(t('ev.start'), t('cls.' + cls), 2.5);
  }
  function pause() { paused = true; input.clear(); menu.show('pause'); }
  function resume() { paused = false; input.clear(); menu.hide(); }
  function finish() {
    mode = 'dead';
    const p = world.player;
    const newBest = S.score > progress.best;
    progress.best = Math.max(progress.best, S.score); progress.bestWave = Math.max(progress.bestWave, S.wave); progress.save();
    const mm = Math.floor(S.time / 60), ss = String(Math.floor(S.time % 60)).padStart(2, '0');
    menu.setResult({ wave: S.wave, kills: S.kills, dmg: Math.round(S.dmg), acc: p.stats.shots ? Math.round(p.stats.hits / p.stats.shots * 100) : 0, time: `${mm}:${ss}`, score: S.score, newBest });
    menu.show('dead');
  }

  addEventListener('keydown', (e) => {
    if (e.code !== 'Escape' || e.repeat) return;
    e.preventDefault();
    if (mode === 'dead') return;
    if (mode === 'menu') { menu.back(); return; }
    if (!paused) pause(); else if (!menu.back()) resume();
  });
  input.onPress = (code) => {
    if (code === 'KeyM') { muted = !muted; return; }
    if (paused || mode !== 'play') return;
    if (code === 'KeyW' || code === 'ArrowUp') thrStep = 1;
    else if (code === 'KeyS' || code === 'ArrowDown') thrStep = -1;
    else if (code === 'Digit1') weapon = 'guns';
    else if (code === 'Digit2' && world.player.cls.torps) weapon = 'torps';
    else if (code === 'KeyR') repairReq = true;
  };

  /* ---- settings -> systems ---- */
  function applySettings() {
    const d = settings.data;
    pipe.setParams(d.gfx);
    hud.showFps(d.gfx.showFps);
    setLang(d.lang);
  }
  settings.onChange(applySettings);
  onLang(() => menu.refresh());
  applySettings();
  document.title = `Steel Salvo — Naval Battle Browser Game v${VERSION}`;

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    rig.resize(w, h);
    pipe.resize(w, h);
  }
  addEventListener('resize', resize);
  resize();

  /* ---- world events -> HUD ---- */
  function drainEvents() {
    while (S.events.length) {
      const e = S.events.shift();
      if (e.type === 'wave') hud.banner(t('ev.wave', { n: e.n }), t('ev.waveSub', { count: e.count }));
      else if (e.type === 'cleared') hud.banner(t('ev.cleared', { n: e.n }), t('ev.clearedSub'));
      else if (e.type === 'kill') hud.feed(t('ev.kill', { cls: t('cls.' + e.cls), name: e.name }), 'kill');
      else if (e.type === 'repair') hud.feed(t('ev.repair'), 'rep');
    }
  }

  /* ---- frame loop ---- */
  let last = performance.now(), frames = 0, fpsT = last, hudT = 0;
  let aim = null;

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t0 = now / 1000;
    const sdt = paused ? 0 : dt;
    const playing = mode === 'play' && !paused;
    const p = world.player;

    let ctl = NO_CTL;
    if (playing) {
      aim = seaAt();
      const steer = input.isDown('KeyA', 'ArrowLeft') - input.isDown('KeyD', 'ArrowRight');
      ctl = { thr: thrStep, steer, aim, fire: input.firing, weapon, repair: repairReq };
    } else if (mode === 'menu') ctl = { ...NO_CTL };
    thrStep = 0; repairReq = false;
    world.fx.camera = rig.camera;
    world.update(sdt, t0, ctl);
    if (playing) drainEvents();
    if (mode === 'play' && !p.alive) {
      deadT += dt;
      if (deadT > 3.5) finish();
    }

    // camera looks a little toward the aim point, like a gunnery officer
    const tgt = { x: p.x, z: p.z };
    if (playing && aim && p.alive) {
      const dx = aim.x - p.x, dz = aim.z - p.z, d = Math.hypot(dx, dz), k = Math.min(d * 0.22, 26) / (d || 1);
      tgt.x += dx * k; tgt.z += dz * k;
    }
    rig.update(sdt || (mode === 'menu' ? dt : 0), t0, { mode, target: tgt, ship: { x: p.x, z: p.z, th: p.th, L: p.cls.L } });
    pipe.render(scene, rig.camera);

    if (mode !== 'menu') hud.frame(sdt, world, rig.camera, playing ? aim : null, weapon, input.mouse);
    frames++;
    if (now - fpsT > 500) {
      if (settings.data.gfx.showFps) hud.setFps(t('hud.fps', { version: VERSION, fps: Math.round(frames * 1000 / (now - fpsT)), w: pipe.rt.width, h: pipe.rt.height }));
      frames = 0; fpsT = now;
    }
    hudT += dt;
    if (hudT > 0.1 && mode !== 'menu') { hudT = 0; hud.text(world, weapon, { repair: 'R' }); }
    requestAnimationFrame(frame);
  }

  goMenu();
  requestAnimationFrame(frame);
  return { world, settings, input, pipe, rig, menu, progress, get mode() { return mode; }, get paused() { return paused; }, goMenu, startRun, pause, resume };
}
