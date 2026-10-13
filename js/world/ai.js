// Enemy behaviour: approach to a preferred range, then sail broadside-ish around the player,
// avoid islands with feeler probes, lead the player with guns and (destroyers/cruisers) torpedoes.
import { wrapAngle, clamp } from '../core/util.js';
import { fwdOf } from './ships.js';
import { intercept } from './combat.js';

export function initAi(s, skill) {
  s.ai = {
    skill,                                            // 0..1, grows with waves
    side: Math.random() < 0.5 ? 1 : -1,               // which way to circle
    pref: s.cls.guns.range * (s.cls.key === 'dd' ? 0.55 : s.cls.key === 'ca' ? 0.7 : 0.8),
    flip: 20 + Math.random() * 20,
    avoid: 0, aimErr: { x: 0, z: 0 }, errT: 0, torpT: 4 + Math.random() * 6,
  };
  s.throttle = 5;
}

export function stepAi(s, dt, player, combat, isLand) {
  const ai = s.ai;
  if (!s.alive) return;
  const dx = player.x - s.x, dz = player.z - s.z, dist = Math.hypot(dx, dz);
  const bear = Math.atan2(dx, dz);

  // --- navigation ---
  ai.flip -= dt;
  if (ai.flip <= 0) { ai.side = -ai.side; ai.flip = 25 + Math.random() * 25; }
  let want;
  if (!player.alive) want = bear + Math.PI * 0.6 * ai.side;
  else if (dist > ai.pref * 1.15) want = bear + 0.35 * ai.side;                     // close in
  else if (dist < ai.pref * 0.6) want = bear + Math.PI * 0.75 * ai.side;            // open the range
  else want = bear + Math.PI * 0.5 * ai.side;                                       // broadside
  // feelers: steer away from land ahead
  const L = s.cls.L;
  const probe = (a, d) => { const f = fwdOf(a); return isLand(s.x + f.x * d, s.z + f.z * d, 3); };
  if (probe(s.th, L * 1.2 + 12) || probe(s.th, L * 0.7 + 4)) {
    const l = probe(s.th + 0.6, L + 10), r = probe(s.th - 0.6, L + 10);
    ai.avoid = 1.5; ai.avoidDir = l && !r ? -1 : !l && r ? 1 : (ai.avoidDir || 1);
  }
  if (ai.avoid > 0) {
    ai.avoid -= dt;
    want = s.th + ai.avoidDir * 1.2;
    s.throttle = 3;
  } else s.throttle = dist < 40 && s.cls.key !== 'dd' ? 3 : 5;
  const err = wrapAngle(want - s.th);
  s.steer = clamp(err * 2.5, -1, 1);

  // --- gunnery ---
  const g = s.cls.guns;
  ai.errT -= dt;
  if (ai.errT <= 0) {
    ai.errT = 2 + Math.random() * 2;
    const e = (1 - ai.skill) * 1.2 + 0.25;                 // lead error in seconds of target movement
    ai.aimErr.x = (Math.random() * 2 - 1) * e; ai.aimErr.z = (Math.random() * 2 - 1) * e;
  }
  let ax = player.x, az = player.z;
  const tFly = intercept(s.x, s.z, g.speed, player.x, player.z, player.vx, player.vz);
  if (tFly) {
    ax = player.x + player.vx * (tFly + ai.aimErr.x * 0.6) + ai.aimErr.z * 3;
    az = player.z + player.vz * (tFly + ai.aimErr.x * 0.6) - ai.aimErr.x * 3;
  }
  s.aimX = ax; s.aimZ = az;
  return { ax, az, canFire: player.alive && dist < g.range * 0.98, dist, err: 1.6 - ai.skill * 0.6, torp: tryTorp(s, dt, player, dist, combat) };
}

function tryTorp(s, dt, player, dist, combat) {
  const tp = s.cls.torps, ai = s.ai;
  if (!tp || !player.alive) return null;
  ai.torpT -= dt;
  if (ai.torpT > 0 || dist > tp.range * 0.8 || s.torpReload > 0) return null;
  const t = intercept(s.x, s.z, tp.speed, player.x, player.z, player.vx, player.vz);
  if (!t) return null;
  const x = player.x + player.vx * t, z = player.z + player.vz * t;
  if (!combat.torpBears(s, Math.atan2(x - s.x, z - s.z))) return null;
  ai.torpT = 6 + Math.random() * 8 - ai.skill * 4;
  return { x, z };
}
