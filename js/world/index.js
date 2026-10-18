// World facade: sea, islands, light, ships, combat, effects and the PvE wave director.
import * as THREE from '../../vendor/three.module.js';
import { createOcean } from './ocean.js';
import { createIslands } from './islands.js';
import { createFx } from './fx.js';
import { createCombat } from './combat.js';
import { createShip, stepShip, aimTurrets, damage, useRepair, removeShip, fwdOf, toWorld } from './ships.js';
import { initAi, stepAi } from './ai.js';
import { CLASSES, EDGE, THROTTLE } from './constants.js';
import { clamp } from '../core/util.js';
import { LOOK, lightFor } from '../render/look.js';

const NAMES = ['Kestrel', 'Varga', 'Halvard', 'Morrow', 'Teskel', 'Orsk', 'Brann', 'Velka', 'Ishmar', 'Corvin', 'Daska', 'Ruhn', 'Selvik', 'Toria', 'Karsk', 'Nemmet', 'Aldric', 'Feyn'];
const KILL_PTS = { dd: 800, ca: 1300, bb: 2200 };

function waveRoster(n) {
  const fixed = [['dd', 'dd'], ['dd', 'ca'], ['ca', 'dd', 'dd'], ['bb', 'dd', 'dd'], ['ca', 'ca', 'dd', 'dd']];
  if (n <= fixed.length) return fixed[n - 1];
  const count = Math.min(7, 3 + Math.floor(n / 2));
  const r = [];
  for (let i = 0; i < count; i++) {
    const u = Math.random();
    r.push(u < 0.18 + n * 0.01 ? 'bb' : u < 0.55 ? 'ca' : 'dd');
  }
  return r;
}

export function createWorld(scene, { sound } = {}) {
  /* ---- sky and light (per graphics style) ---- */
  const lt = lightFor(LOOK.style);
  scene.background = new THREE.Color(lt.bg);
  scene.fog = new THREE.Fog(lt.bg, 400, 900);
  const hemi = new THREE.HemisphereLight(lt.sky, lt.ground, lt.hemi);
  const sun = new THREE.DirectionalLight(lt.sunColor, lt.sun);
  sun.position.set(45, 80, 40);
  if (LOOK.detail) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 10, far: 220 });
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
  }
  scene.add(hemi, sun, sun.target);

  const ocean = createOcean(scene, LOOK.style);
  const islands = createIslands(scene, 11);
  ocean.setLumps(islands.lumps);
  const fx = createFx(scene);
  const ships = [];

  const S = { mode: 'menu', wave: 0, score: 0, kills: 0, dmg: 0, time: 0, breather: 0, events: [], popups: [], cls: 'ca', threat: -1, enemiesLeft: 0 };
  let player = null;

  const combat = createCombat({ scene, fx, islands, ships, sound, onHit });

  function onHit(owner, target, dmg, kind) {
    const d = damage(target, dmg, kind === 'fire' ? 'fire' : 'hit');
    if (owner === player) { S.dmg += d; S.score += Math.round(d); if (kind !== 'torp') owner.stats.hits++; }
    if (target === player || owner === player) {
      S.popups.push({ x: target.x, z: target.z, dmg: Math.round(d), kind, mine: owner === player });
    }
    sound?.hit(kind, target === player);
  }

  /* ---- indicators on the water (player only) ---- */
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xcfe6ee });
  const ring = new THREE.Mesh(new THREE.RingGeometry(1, 1.006, 160), ringMat);
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.45;
  const aimMk = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.7, 20), new THREE.MeshBasicMaterial({ color: 0x9ff0a0 }));
  aimMk.rotation.x = -Math.PI / 2; aimMk.position.y = 0.5;
  const fan = new THREE.Group();
  const fanMat = new THREE.MeshBasicMaterial({ color: 0x9ff0a0 });
  for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.05, 1), fanMat); fan.add(b); }
  scene.add(ring, aimMk, fan);

  /* ---- spawning ---- */
  function spawnWave() {
    S.wave++;
    const roster = waveRoster(S.wave);
    const skill = Math.min(1, 0.2 + S.wave * 0.1);
    const base = Math.random() * Math.PI * 2;
    roster.forEach((k, i) => {
      let x = 0, z = 0;
      for (let tries = 0; tries < 60; tries++) {
        const a = base + (i - roster.length / 2) * 0.25 + (Math.random() - 0.5) * 0.4 + (tries > 20 ? Math.random() * 6 : 0);
        const d = 170 + Math.random() * 60;
        x = clamp(player.x + Math.sin(a) * d, -EDGE + 20, EDGE - 20);
        z = clamp(player.z + Math.cos(a) * d, -EDGE + 20, EDGE - 20);
        if (!islands.isLand(x, z, 14) && !ships.some((o) => Math.hypot(o.x - x, o.z - z) < 25)) break;
      }
      const s = createShip(scene, k, 'enemy', x, z, Math.atan2(player.x - x, player.z - z));
      s.name = NAMES[Math.floor(Math.random() * NAMES.length)];
      initAi(s, skill);
      ships.push(s);
    });
    S.events.push({ type: 'wave', n: S.wave, count: roster.length });
    sound?.bell();
  }

  function reset(mode, clsKey) {
    for (const s of ships) removeShip(scene, s);
    ships.length = 0;
    combat.clear(); fx.clear();
    S.mode = mode; S.wave = 0; S.score = 0; S.kills = 0; S.dmg = 0; S.time = 0; S.breather = mode === 'play' ? 3 : 0;
    S.events.length = 0; S.popups.length = 0; S.threat = -1;
    if (clsKey) S.cls = clsKey;
    player = createShip(scene, S.cls, 'player', 0, 0, Math.PI * 0.85);
    player.name = 'You';
    ships.push(player);
    if (mode === 'menu') { player.throttle = 3; player.steer = 0.25; }
    const show = mode === 'play';
    ring.visible = show; aimMk.visible = false; fan.visible = false;
    ring.scale.setScalar(CLASSES[S.cls].guns.range);
  }

  // ctl: { thr: -1|0|1 (telegraph step), steer, aim: {x,z}|null, fire, weapon: 'guns'|'torps', repair }
  function update(dt, t, ctl) {
    if (dt <= 0) { ocean.update(t, player.x, player.z, scene.fog); return; }
    const playing = S.mode === 'play';
    if (playing) S.time += dt;

    /* player control */
    if (player.alive && (playing || S.mode === 'menu')) {
      if (playing) {
        if (ctl.thr) player.throttle = clamp(player.throttle + ctl.thr, 0, THROTTLE.length - 1);
        player.steer = ctl.steer;
        if (ctl.repair && useRepair(player)) { S.events.push({ type: 'repair' }); sound?.repair(); }
      }
      const aim = ctl.aim;
      if (aim) aimTurrets(player, dt, aim.x, aim.z);
      else { const f = toWorld(player, 0, 40); aimTurrets(player, dt, f.x, f.z); }
      if (playing && aim && ctl.fire) {
        if (ctl.weapon === 'torps') combat.fireTorps(player, aim.x, aim.z);
        else combat.fireGuns(player, aim.x, aim.z);
      }
    }

    /* enemies */
    let left = 0;
    for (const s of ships) {
      if (s.side !== 'enemy' || !s.alive) continue;
      left++;
      const o = stepAi(s, dt, player, combat, islands.isLand);
      aimTurrets(s, dt, o.ax, o.az);
      if (o.canFire) combat.fireGuns(s, o.ax, o.az, o.err);
      if (o.torp) combat.fireTorps(s, o.torp.x, o.torp.z);
    }
    S.enemiesLeft = left;

    /* movement, collisions between ships */
    for (const s of ships) stepShip(s, dt, t, islands.isLand);
    for (let i = 0; i < ships.length; i++) for (let j = i + 1; j < ships.length; j++) {
      const a = ships[i], b = ships[j];
      if (!a.alive || !b.alive) continue;
      const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz), min = (a.cls.L + b.cls.L) * 0.3;
      if (d < min && d > 0.01) {
        const p = (min - d) / 2, ux = dx / d, uz = dz / d;
        a.x -= ux * p; a.z -= uz * p; b.x += ux * p; b.z += uz * p;
        a.speed *= 0.97; b.speed *= 0.97;
        if (a.side !== b.side) { damage(a, 120 * dt, 'hit'); damage(b, 120 * dt, 'hit'); }
      }
    }

    /* deaths */
    for (const s of ships) {
      if (s.alive && s.hp <= 0) {
        s.alive = false; s.hp = 0; s.steer = 0; s.throttle = 1;
        fx.explosion(s.x, s.cls.H + 1, s.z, 3);
        sound?.boom();
        if (s.side === 'enemy') {
          S.kills++; S.score += KILL_PTS[s.cls.key] * (1 + S.wave * 0.1) | 0;
          S.events.push({ type: 'kill', name: s.name, cls: s.cls.key });
          player.stats.kills++;
        } else if (s === player && playing) {
          S.events.push({ type: 'sunk' });
        }
      }
    }
    for (let i = ships.length - 1; i >= 0; i--) {
      const s = ships[i];
      if (s.removed && s !== player) { removeShip(scene, s); ships.splice(i, 1); }
    }

    /* per-ship effects: wake, funnel smoke, fires */
    for (const s of ships) {
      s.wakeT -= dt; s.smokeT -= dt;
      const sp = Math.abs(s.speed) / s.cls.speed;
      if (s.wakeT <= 0 && sp > 0.05 && s.alive) {
        s.wakeT = 0.09 / (0.4 + sp);
        const st = toWorld(s, (Math.random() - 0.5) * s.cls.W * 0.6, -s.cls.L * 0.5);
        fx.foam(st.x, st.z, s.cls.W * 0.7 * (0.5 + sp), 3.5);
        for (const side of [-1, 1]) {
          const bw = toWorld(s, side * s.cls.W * 0.55, s.cls.L * 0.3);
          if (Math.random() < sp) fx.foam(bw.x, bw.z, 0.6 + sp * 0.6, 2);
        }
      }
      if (s.smokeT <= 0) {
        s.smokeT = s.alive ? 0.35 : 0.12;
        const f = toWorld(s, 0, s.cls.key === 'bb' ? -0.4 : 0);
        if (s.alive) fx.smoke(f.x, s.cls.H + 1.8 + s.model.body.position.y, f.z, 1, 0.5 + s.cls.W * 0.15, false);
        else fx.smoke(f.x, 1.2, f.z, 2, 1.4, true);
      }
      for (const fr of s.fires) {
        if (Math.random() < dt * 25) {
          const p = toWorld(s, (Math.random() - 0.5) * s.cls.W * 0.5, fr.z);
          fx.fire(p.x, s.cls.H + 0.6 + s.model.body.position.y, p.z, 0.8 + s.cls.W * 0.2);
          if (Math.random() < 0.3) fx.smoke(p.x, s.cls.H + 1, p.z, 1, 0.9, true);
        }
      }
      if (!s.alive && Math.random() < dt * 10) {
        const p = toWorld(s, 0, (Math.random() - 0.5) * s.cls.L * 0.6);
        fx.fire(p.x, 0.8, p.z, 1.3);
      }
    }

    combat.update(dt);
    fx.update(dt, fx.camera);
    S.threat = player.alive ? combat.torpThreat(player) : -1;

    /* waves */
    if (playing && player.alive) {
      if (left === 0 && S.breather <= 0 && S.wave > 0) {
        S.breather = 9;
        player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.25);
        if (player.repair) player.repair.charges = Math.min(player.cls.repair.charges, player.repair.charges + 1);
        S.events.push({ type: 'cleared', n: S.wave });
      }
      if (S.breather > 0) { S.breather -= dt; if (S.breather <= 0) spawnWave(); }
    }

    /* indicators */
    ocean.update(t, player.x, player.z, scene.fog);
    sun.position.set(player.x + 45, 80, player.z + 40); sun.target.position.set(player.x, 0, player.z);
    ring.position.x = player.x; ring.position.z = player.z;
    ring.visible = playing && player.alive;
    const aim = ctl.aim;
    aimMk.visible = playing && player.alive && !!aim && ctl.weapon !== 'torps';
    fan.visible = playing && player.alive && !!aim && ctl.weapon === 'torps' && !!player.cls.torps;
    if (aim && aimMk.visible) {
      aimMk.position.set(aim.x, 0.5, aim.z);
      const bears = player.turrets.some((tr) => tr.inArc), inRange = Math.hypot(aim.x - player.x, aim.z - player.z) <= player.cls.guns.range;
      aimMk.material.color.set(bears && inRange ? 0x9ff0a0 : 0xf0a08a);
    }
    if (aim && fan.visible) {
      const tp = player.cls.torps, a = Math.atan2(aim.x - player.x, aim.z - player.z);
      const ok = combat.torpBears(player, a) && player.torpReload <= 0;
      fanMat.color.set(ok ? 0x9ff0a0 : player.torpReload > 0 ? 0x8a9aa8 : 0xf0a08a);
      fan.children.forEach((b, i) => {
        b.visible = i < tp.n;
        const th = a + (tp.n > 1 ? (i / (tp.n - 1) - 0.5) * tp.spread : 0), f = fwdOf(th);
        b.scale.z = tp.range;
        b.position.set(player.x + f.x * tp.range / 2, 0.45, player.z + f.z * tp.range / 2);
        b.rotation.y = th;
      });
    }
  }

  return {
    S, ships, islands, combat, fx, reset, update,
    get player() { return player; },
  };
}
