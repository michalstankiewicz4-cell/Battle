// Ship entity: movement (telegraph throttle, rudder), wave bobbing, turret traverse within arcs,
// firing solutions, damage, fires, repair party and sinking.
import * as THREE from '../../vendor/three.module.js';
import { CLASSES, THROTTLE, THROTTLE_STOP, FIRE, EDGE, DEPTHS, DIVE_RATE } from './constants.js';
import { buildShip } from './models.js';
import { waveAt } from './ocean.js';
import { clamp, wrapAngle } from '../core/util.js';

let nextId = 1;

export function createShip(scene, clsKey, side, x, z, th) {
  const cls = CLASSES[clsKey];
  const model = buildShip(cls, side);
  scene.add(model.group);
  const ship = {
    id: nextId++, cls, side, name: '', x, z, th, vx: 0, vz: 0,
    speed: 0, throttle: THROTTLE_STOP, rudder: 0, steer: 0,
    hp: cls.hp, maxHp: cls.hp, alive: true, sinkT: 0, removed: false,
    model,
    turrets: cls.turrets.map((spec, i) => ({ spec, yaw: spec.arc.c, reload: Math.random() * 0.5, pivot: model.turrets[i], desired: spec.arc.c, inArc: false })),
    torpReload: 0,
    repair: cls.repair ? { charges: cls.repair.charges, cd: 0, active: 0 } : null,
    fires: [],
    wakeT: 0, smokeT: 0, hitFlash: 0,
    stats: { dmg: 0, kills: 0, hits: 0, shots: 0 },
    // submarines: depth level (0 surface, 1 periscope, 2 deep), current keel offset y (<= 0) and battery 0..1
    sub: cls.sub ? { level: 0, y: 0, batt: 1, ghost: false } : null,
  };
  place(ship, 0);
  return ship;
}

// Depth band a submarine is actually in (from its current keel offset): 0 surface, 1 periscope, 2 deep.
export function depthLevel(s) {
  if (!s.sub) return 0;
  const y = s.sub.y;
  return y > -0.35 ? 0 : y > -2.6 ? 1 : 2;
}
// Can shells hit / torpedoes hit / guns fire? (submarines only partly; everyone else always)
export const shellable = (s) => !s.sub || s.sub.y > -0.6;
export const torpable = (s) => !s.sub || s.sub.y > -2.6;

// Forward and starboard unit vectors.
export const fwdOf = (th) => ({ x: Math.sin(th), z: Math.cos(th) });

// Local (right, forward) -> world.
export function toWorld(s, lr, lf) {
  const c = Math.cos(s.th), n = Math.sin(s.th);
  return { x: s.x + lr * c + lf * n, z: s.z - lr * n + lf * c };
}

// Is the world point inside the hull outline (pointed bow, rounded stern)? pad widens it.
export function hullHit(s, x, z, pad = 0) {
  const dx = x - s.x, dz = z - s.z, c = Math.cos(s.th), n = Math.sin(s.th);
  const f = dx * n + dz * c, r = dx * c - dz * n;
  const hl = s.cls.L / 2 + pad, hw = s.cls.W / 2 + pad;
  if (Math.abs(f) > hl) return false;
  const taper = f > 0 ? clamp((hl - f) / (hl * 0.6), 0.15, 1) : clamp((hl + f) / (hl * 0.25), 0.5, 1);
  return Math.abs(r) < hw * taper;
}

function place(s, t) {
  const g = s.model.group, b = s.model.body;
  g.position.set(s.x, 0, s.z);
  g.rotation.y = s.th;
  const L = s.cls.L;
  const f = fwdOf(s.th);
  const hb = waveAt(s.x + f.x * L * 0.4, s.z + f.z * L * 0.4, t), hs = waveAt(s.x - f.x * L * 0.4, s.z - f.z * L * 0.4, t);
  const sink = s.sinkT;
  const sy = s.sub ? s.sub.y : 0, ride = s.sub ? clamp(1 + sy / 1.3, 0, 1) : 1;   // submerged boats stop riding the waves
  b.position.y = (hb + hs) * 0.5 * 0.7 * ride + sy - sink * 0.45;
  b.rotation.x = -Math.atan2(hb - hs, L * 0.8) * 0.6 * ride + sink * 0.05;
  b.rotation.z = s.rudder * clamp(s.speed / s.cls.speed, -1, 1) * 0.07 + sink * 0.12;
}

// Movement step. land(x,z,pad) -> bool. Returns true if the ship scraped land this frame.
export function stepShip(s, dt, t, land) {
  const cls = s.cls;
  if (!s.alive) {
    s.sinkT += dt;
    s.speed *= Math.exp(-dt * 0.8);
    s.x += Math.sin(s.th) * s.speed * dt; s.z += Math.cos(s.th) * s.speed * dt;
    place(s, t);
    if (s.sinkT > 9) s.removed = true;
    return false;
  }
  const sub = s.sub;
  if (sub) {
    // dive / surface toward the chosen level; battery drains under water and charges on the surface
    const want = DEPTHS[sub.level].y;
    sub.y += clamp(want - sub.y, -DIVE_RATE * dt, DIVE_RATE * dt);
    sub.batt = clamp(sub.batt - DEPTHS[depthLevel(s)].drain * dt, 0, 1);
    if (sub.batt <= 0 && sub.level > 0) { sub.level = 0; sub.forced = true; }   // flat battery: forced to surface
  }
  const target = cls.speed * THROTTLE[s.throttle] * (sub ? DEPTHS[depthLevel(s)].speed : 1);
  const acc = cls.accel * (Math.sign(target - s.speed) !== Math.sign(s.speed) ? 1.4 : 1);
  s.speed += clamp(target - s.speed, -acc * dt, acc * dt);
  s.rudder += clamp(s.steer - s.rudder, -dt / cls.rudderT, dt / cls.rudderT);
  const eff = clamp(Math.abs(s.speed) / cls.speed * 1.5, 0.2, 1) * Math.sign(s.speed || 1);
  s.th = wrapAngle(s.th + s.rudder * cls.turn * eff * dt);
  const f = fwdOf(s.th);
  const nx = s.x + f.x * s.speed * dt, nz = s.z + f.z * s.speed * dt;
  const probe = s.speed >= 0 ? cls.L * 0.45 : -cls.L * 0.45;
  let grounded = false;
  if (land(nx + f.x * probe, nz + f.z * probe, 0) || land(nx, nz, cls.W * 0.4)) {
    grounded = true;
    s.speed *= -0.25;
  } else { s.x = nx; s.z = nz; }
  s.vx = f.x * s.speed; s.vz = f.z * s.speed;
  // map edge: steer the position back
  if (Math.abs(s.x) > EDGE) { s.x = Math.sign(s.x) * EDGE; s.speed *= 0.9; }
  if (Math.abs(s.z) > EDGE) { s.z = Math.sign(s.z) * EDGE; s.speed *= 0.9; }

  // fires and repair
  for (let i = s.fires.length - 1; i >= 0; i--) {
    s.fires[i].t -= dt;
    s.hp -= s.maxHp * FIRE.dps * dt;
    if (s.fires[i].t <= 0) s.fires.splice(i, 1);
  }
  if (s.repair) {
    s.repair.cd = Math.max(0, s.repair.cd - dt);
    if (s.repair.active > 0) {
      s.repair.active -= dt;
      s.hp = Math.min(s.maxHp, s.hp + s.maxHp * cls.repair.heal / 10 * dt);
    }
  }
  s.torpReload = Math.max(0, s.torpReload - dt);
  s.hitFlash = Math.max(0, s.hitFlash - dt);
  place(s, t);
  return grounded;
}

// World position and world yaw of a turret.
export function turretPos(s, tr) { return toWorld(s, 0, tr.spec.z); }

// Turns turrets toward (ax, az) inside their arcs; marks which can bear.
export function aimTurrets(s, dt, ax, az) {
  const trav = s.cls.guns.traverse;
  for (const tr of s.turrets) {
    tr.reload = Math.max(0, tr.reload - dt);
    const p = turretPos(s, tr);
    const want = wrapAngle(Math.atan2(ax - p.x, az - p.z) - s.th);   // relative to the bow
    const { c, w } = tr.spec.arc;
    const ud = clamp(wrapAngle(want - c), -w, w);
    let u = wrapAngle(tr.yaw - c);
    u += clamp(ud - u, -trav * dt, trav * dt);
    tr.yaw = wrapAngle(c + u);
    tr.inArc = Math.abs(wrapAngle(want - c)) <= w;
    tr.aimed = tr.inArc && Math.abs(wrapAngle(want - tr.yaw)) < 0.03;
    tr.pivot.rotation.y = tr.yaw;
  }
}

// Applies damage; returns the damage dealt.
export function damage(s, amount, kind) {
  if (!s.alive) return 0;
  const d = Math.min(s.hp, amount);
  s.hp -= amount;
  s.hitFlash = 0.15;
  if (kind === 'fire' && s.fires.length < FIRE.max) s.fires.push({ t: FIRE.time, z: (Math.random() - 0.5) * s.cls.L * 0.7 });
  return d;
}

export function useRepair(s) {
  const r = s.repair;
  if (!r || !s.alive || r.charges <= 0 || r.cd > 0) return false;
  r.charges--; r.cd = s.cls.repair.cd; r.active = 10;
  s.fires.length = 0;
  return true;
}

export function removeShip(scene, s) {
  scene.remove(s.model.group);
  s.model.group.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });
}

export const throttleFrac = (s) => THROTTLE[s.throttle];
export const V3 = THREE.Vector3;
