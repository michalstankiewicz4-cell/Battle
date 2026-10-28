// Application shell: renderer + pixel pipeline, world, camera rig, UI and the mode state machine
// (menu -> play -> dead), pause handling and the frame loop.
import * as THREE from '../../vendor/three.module.js';
import { PostPipeline } from '../render/post.js';
import { createWorld } from '../world/index.js';
import { Input } from '../input/input.js';
import { createSettings } from './settings.js';
import { createCameraRig } from './cameras.js';
import { createSound } from './sound.js';
import { createSalvoCam } from './salvo-cam.js';
import { read, write, KEYS } from './storage.js';
import { setLang, onLang, t } from '../i18n/index.js';
import { createHud } from '../ui/hud.js';
import { createMenu } from '../ui/menu.js';
import { CLASS_KEYS, U } from '../world/constants.js';
import { depthLevel } from '../world/ships.js';
import { VERSION } from '../version.js';

const NO_CTL = { thr: 0, steer: 0, aim: null, fire: false, weapon: 'guns', repair: false };

export function createApp({ appEl, uiEl }) {
  const settings = createSettings();
  setLang(settings.data.lang);


  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = settings.data.gfx.shadows;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;                 // updated once per frame (the salvo camera renders the scene twice)
  appEl.appendChild(renderer.domElement);
  const canvas = renderer.domElement;

  let muted = false;
  const sound = createSound(() => (muted ? 0 : settings.data.vol));
  const scene = new THREE.Scene();
  const world = createWorld(scene, { sound, renderer });
  const S = world.S;
  const input = new Input(canvas);
  const pipe = new PostPipeline(renderer);
  const salvo = createSalvoCam(renderer);
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

  /* ---- aiming: ray onto the sea plane (y = 0) through the cursor, or through the screen centre
     when the gun camera has the pointer locked; above the horizon the aim goes to max range ---- */
  const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3(), ndc = new THREE.Vector2();
  const gunAim = () => rig.view === 'gun' && input.locked;
  function seaAt() {
    if (gunAim()) ndc.set(0, 0); else ndc.set(input.mouse.x, input.mouse.y);
    ray.setFromCamera(ndc, rig.camera);
    const p = world.player;
    if (ray.ray.intersectPlane(plane, hit)) return { x: hit.x, z: hit.z };
    if (rig.view !== 'gun') return null;
    const d = ray.ray.direction, len = Math.hypot(d.x, d.z) || 1, r = p.cls.guns.range * 1.05;
    return { x: p.x + d.x / len * r, z: p.z + d.z / len * r };
  }
  const CENTER = { get px() { return innerWidth / 2; }, get py() { return innerHeight / 2; } };

  /* ---- state machine ---- */
  let mode = 'menu', paused = false, weapon = 'guns', thrStep = 0, repairReq = false, deadT = 0, depthStep = 0;
  const hud = createHud(uiEl);
  const menu = createMenu(uiEl, {
    actions: { start: (cls) => startRun(cls), pick: (cls) => { if (mode === 'menu' && cls !== world.player.cls.key) world.reset('menu', cls, true); applyGod(); }, resume: () => resume(), quit: () => goMenu() },
    settings, progress,
  });

  // Gun camera on/off (C). Entering locks the pointer (the key press is the required user gesture).
  let ownUnlock = false;
  function setGunView(on) { setView(on ? 'gun' : 'iso'); }
  // Views: 'iso' (the map), 'gun' (C) and 'deck' (F: walking on the own deck; a submarine only while surfaced).
  function setView(v) {
    if (v === rig.view) return;
    if (v === 'gun' && depthLevel(world.player) === 2) { hud.feed(t('ev.tooDeep'), 'rep'); return; }   // periscope under water
    if (v === 'deck' && depthLevel(world.player) > 0) { hud.feed(t('ev.deckWet'), 'rep'); return; }
    rig.setView(v, world.player, aim);
    const on = v !== 'iso';
    if (on) input.lock(); else if (input.locked) { ownUnlock = true; input.unlock(); }
    hud.setGunView(on);
  }
  // Esc releases the pointer lock in the browser before the page sees the key: treat that as "pause".
  input.onLockChange = (locked) => {
    if (!locked && !ownUnlock && mode === 'play' && !paused && rig.view !== 'iso') pause();
    ownUnlock = false;
  };
  input.onCanvasDown = () => { if (mode === 'play' && !paused && rig.view !== 'iso' && !input.locked) input.lock(); };

  // Options > Gameplay > Immortal ship: the player's ship takes no damage (set on every new ship and on change)
  function applyGod() { if (world.player) world.player.god = settings.data.play.god; }
  settings.onChange(applyGod);
  function goMenu() {
    setGunView(false);
    mode = 'menu'; paused = false;
    world.reset('menu', progress.cls); applyGod(); input.clear();
    hud.show(false); menu.show('main');
  }
  function startRun(cls) {
    progress.cls = cls; progress.save();
    setGunView(false);
    mode = 'play'; paused = false; weapon = 'guns'; deadT = 0;
    world.reset('play', cls); applyGod(); input.clear();
    menu.hide(); hud.show(true);
    hud.banner(t('ev.start'), t('cls.' + cls), 2.5);
  }
  function pause() { paused = true; input.clear(); if (input.locked) { ownUnlock = true; input.unlock(); } menu.show('pause'); }
  function resume() { paused = false; input.clear(); menu.hide(); }
  function finish() {
    setGunView(false);
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
    if (code === 'KeyG') {                                 // immortal ship on/off (same as Options > Gameplay)
      settings.update((x) => { x.play.god = !x.play.god; });
      if (mode === 'play') hud.feed(t(settings.data.play.god ? 'ev.godOn' : 'ev.godOff'), 'rep');
      return;
    }
    if (paused || mode !== 'play') return;
    if (code === 'KeyF' && world.player.alive) { setView(rig.view === 'deck' ? 'iso' : 'deck'); return; }
    if (rig.view === 'deck' && /^(Key[WASD]|Arrow)/.test(code)) return;           // on deck these walk
    if (code === 'KeyW' || code === 'ArrowUp') thrStep = 1;
    else if (code === 'KeyS' || code === 'ArrowDown') thrStep = -1;
    else if (code === 'Digit1') weapon = 'guns';
    else if (code === 'Digit2' && world.player.cls.torps) weapon = 'torps';
    else if (code === 'KeyR') repairReq = true;
    else if (code === 'KeyC' && world.player.alive) setGunView(rig.view !== 'gun');
    else if (code === 'KeyZ') depthStep = -1;            // submarine: rise one level
    else if (code === 'KeyX') depthStep = 1;             // submarine: dive one level
  };

  /* ---- settings -> systems ---- */
  function applySettings() {
    const d = settings.data;
    pipe.setParams(d.gfx);
    salvo.setParams(d.gfx);
    if (renderer.shadowMap.enabled !== d.gfx.shadows) {
      renderer.shadowMap.enabled = d.gfx.shadows;           // switching shadows recompiles the lit materials
      scene.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => { m.needsUpdate = true; }); });
    }
    world.setQuality({ fx: d.gfx.fx, water: d.gfx.water });
    hud.showFps(d.gfx.showFps);
    setLang(d.lang);
  }
  settings.onChange(applySettings);
  onLang(() => menu.refresh());
  applySettings();
  document.title = `Steel Salvo — Free Naval Battle Browser Game v${VERSION}`;

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
      else if (e.type === 'depth') hud.feed(t('ev.depth.' + e.level), 'rep');
      else if (e.type === 'battery') hud.banner(t('ev.battery'), t('ev.batterySub'), 2.2);
      else if (e.type === 'battLow') hud.feed(t('ev.battLow'), 'kill');
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
      const onDeck = rig.view === 'deck';                    // walking: the ship holds her course and speed, guns hold fire
      const steer = onDeck ? 0 : input.isDown('KeyA', 'ArrowLeft') - input.isDown('KeyD', 'ArrowRight');
      ctl = { thr: thrStep, steer, aim: onDeck ? null : aim, fire: !onDeck && input.firing, weapon, repair: repairReq, depth: depthStep };
    } else if (mode === 'menu') ctl = { ...NO_CTL };
    thrStep = 0; repairReq = false; depthStep = 0;
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
      const dx = aim.x - p.x, dz = aim.z - p.z, d = Math.hypot(dx, dz), k = Math.min(d * 0.22, 26 * U) / (d || 1);
      tgt.x += dx * k; tgt.z += dz * k;
    }
    if (rig.view !== 'iso' && !p.alive) setGunView(false);
    if (rig.view === 'deck' && depthLevel(p) > 0) { setGunView(false); hud.feed(t('ev.deckWet'), 'rep'); }
    if (rig.view === 'gun' && depthLevel(p) === 2) { setGunView(false); hud.feed(t('ev.tooDeep'), 'rep'); }
    if (rig.view === 'deck') { hud.setBearing((rig.gunYaw - p.th) * 180 / Math.PI); hud.setOptic(rig.deck.bino ? 'bino' : null); }
    if (rig.view === 'gun') {
      hud.setBearing((rig.gunYaw - p.th) * 180 / Math.PI);       // relative bearing from the bow
      // optics: periscope on a submarine; binoculars on ships once zoomed in (×1.5 and more), wide view below that
      hud.setOptic(p.cls.sub ? 'scope' : rig.zoom >= 1.5 ? 'bino' : null);
    }
    rig.update(sdt || (mode === 'menu' ? dt : 0), t0, { mode, target: tgt, ship: { x: p.x, z: p.z, th: p.th, L: p.cls.L }, player: p });
    // perspective views see the horizon: closer fog hides the edge of the sea grid, the sky dome fills the rest
    const persp = rig.camera.isPerspectiveCamera;
    const viewFog = (pv, cam) => {
      scene.fog.near = (pv ? 170 : 400) * U; scene.fog.far = (pv ? 410 : 900) * U;
      world.sky.visible = pv;
      if (pv) world.sky.position.copy(cam.position);
    };
    viewFog(persp, rig.camera);
    renderer.shadowMap.needsUpdate = true;
    pipe.render(scene, rig.camera);
    // salvo camera (picture-in-picture, top right) while the player's shells or torpedoes are under way
    const pip = salvo.update(sdt, world, mode === 'play' && settings.data.gfx.pip && p.alive);
    hud.setPip(pip);
    if (pip) {
      viewFog(true, salvo.camera);
      const r = salvo.render(scene, innerWidth, innerHeight);
      if (r) hud.copyPip(canvas, r.x, r.y, r.w, r.h);       // same task as the render, so the drawing buffer is still valid
    }

    if (mode !== 'menu') hud.frame(sdt, world, rig.camera, playing ? aim : null, weapon, gunAim() ? CENTER : input.mouse);
    frames++;
    if (now - fpsT > 500) {
      if (settings.data.gfx.showFps) hud.setFps(t('hud.fps', { version: VERSION, fps: Math.round(frames * 1000 / (now - fpsT)), w: pipe.rt.width, h: pipe.rt.height }));
      frames = 0; fpsT = now;
    }
    hudT += dt;
    if (hudT > 0.1 && mode !== 'menu') { hudT = 0; hud.text(world, weapon, { repair: 'R', depth: 'Z/X', gun: rig.view !== 'iso', deck: rig.view === 'deck', locked: input.locked, zoom: rig.zoom }); }
    requestAnimationFrame(frame);
  }

  goMenu();
  requestAnimationFrame(frame);
  return { world, settings, input, pipe, rig, menu, progress, get mode() { return mode; }, get paused() { return paused; }, goMenu, startRun, pause, resume };
}
