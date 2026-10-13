// Shells (ballistic arcs with dispersion; islands block low trajectories) and torpedoes.
import * as THREE from '../../vendor/three.module.js';
import { hullHit, toWorld, fwdOf, turretPos } from './ships.js';
import { wrapAngle } from '../core/util.js';
import { torpGeo } from './models.js';

const MAXT = 96;
const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), S1 = new THREE.Vector3(1, 1, 1), E = new THREE.Euler();
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);

// Truncated-normal-ish random in [-1, 1].
const tri = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

// Time t at which a projectile of horizontal speed v from (px,pz) meets a target at (tx,tz) moving (vx,vz). null if impossible.
export function intercept(px, pz, v, tx, tz, vx, vz) {
  const dx = tx - px, dz = tz - pz;
  const a = vx * vx + vz * vz - v * v, b = 2 * (dx * vx + dz * vz), c = dx * dx + dz * dz;
  if (Math.abs(a) < 1e-6) return b < 0 ? -c / b : null;
  const disc = b * b - 4 * a * c;
  if (disc < 0) return null;
  const s = Math.sqrt(disc), t1 = (-b - s) / (2 * a), t2 = (-b + s) / (2 * a);
  const t = Math.min(t1, t2) > 0 ? Math.min(t1, t2) : Math.max(t1, t2);
  return t > 0 ? t : null;
}

export function createCombat({ scene, fx, islands, ships, onHit, sound }) {
  const shells = [];
  const torps = [];
  const tmesh = new THREE.InstancedMesh(torpGeo(), new THREE.MeshLambertMaterial(), MAXT);
  tmesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  tmesh.frustumCulled = false;
  const col = new THREE.Color();
  for (let i = 0; i < MAXT; i++) { tmesh.setMatrixAt(i, ZERO); tmesh.setColorAt(i, col.set(0x222428)); }
  scene.add(tmesh);

  // Fires every ready, bearing turret of `s` at (ax, az). `err` scales dispersion (AI uses > 1). Returns shells fired.
  function fireGuns(s, ax, az, err = 1) {
    const g = s.cls.guns;
    let n = 0;
    for (const tr of s.turrets) {
      if (tr.reload > 0 || !tr.aimed) continue;
      const p = turretPos(s, tr);
      let dx = ax - p.x, dz = az - p.z, dist = Math.hypot(dx, dz);
      if (dist < 4) continue;
      const k = Math.min(1, g.range / dist);
      dx *= k; dz *= k; dist = Math.min(dist, g.range);
      const ux = dx / dist, uz = dz / dist;
      const R = g.disp * (0.3 + 0.7 * dist / g.range) * err;
      for (let b = 0; b < tr.spec.barrels; b++) {
        const lat = tri() * R, lon = tri() * R * 0.7;
        const tx = p.x + dx + uz * lat + ux * lon, tz = p.z + dz - ux * lat + uz * lon;
        const d = Math.hypot(tx - p.x, tz - p.z);
        shells.push({ x0: p.x, z0: p.z, y0: s.cls.H + 0.6, x1: tx, z1: tz, t: -b * 0.05 - Math.random() * 0.05, T: d / g.speed, apex: d * g.apex,
          owner: s, g, x: p.x, y: 1, z: p.z });
      }
      tr.reload = g.reload * (0.97 + Math.random() * 0.06);
      s.stats.shots += tr.spec.barrels;
      const a = s.th + tr.yaw, mx = Math.sin(a), mz = Math.cos(a);
      fx.muzzle(p.x + mx * tr.spec.size * 1.6, s.cls.H + tr.spec.y + 0.5, p.z + mz * tr.spec.size * 1.6, mx, mz, tr.spec.size * 1.2);
      n++;
    }
    if (n) sound?.gun(g.cal, s.side === 'player');
    return n;
  }

  // Can the torpedo tubes bear on world angle `a` (broadside arcs 25°..155° on either side)?
  function torpBears(s, a) {
    const rel = Math.abs(wrapAngle(a - s.th));
    return rel > 0.44 && rel < 2.7;
  }
  function fireTorps(s, ax, az) {
    const tp = s.cls.torps;
    if (!tp || s.torpReload > 0) return false;
    const a = Math.atan2(ax - s.x, az - s.z);
    if (!torpBears(s, a)) return false;
    const side = Math.sign(wrapAngle(a - s.th)) || 1;
    const o = toWorld(s, -side * s.cls.W * 0.5, 0);
    for (let i = 0; i < tp.n; i++) {
      const th = a + (tp.n > 1 ? (i / (tp.n - 1) - 0.5) * tp.spread : 0);
      torps.push({ x: o.x, z: o.z, th, speed: tp.speed, dist: 0, range: tp.range, owner: s, dmg: tp.dmg, wake: 0 });
    }
    s.torpReload = tp.reload;
    sound?.torp();
    return true;
  }

  function hitShips(owner, x, z, pad) {
    for (const s of ships) if (s.alive && s.side !== owner.side && hullHit(s, x, z, pad)) return s;
    return null;
  }

  function update(dt) {
    for (let i = shells.length - 1; i >= 0; i--) {
      const sh = shells[i];
      sh.t += dt;
      if (sh.t < 0) continue;
      const u = Math.min(1, sh.t / sh.T);
      sh.x = sh.x0 + (sh.x1 - sh.x0) * u; sh.z = sh.z0 + (sh.z1 - sh.z0) * u;
      sh.y = sh.y0 * (1 - u) + 4 * sh.apex * u * (1 - u);
      fx.tracer(sh.x, sh.y, sh.z, 0.2 + sh.g.cal * 0.35);
      const gh = islands.heightAt(sh.x, sh.z);
      if (gh > 0 && sh.y < gh) {                       // slammed into an island
        fx.dirt(sh.x, gh, sh.z, 0.6 + sh.g.cal);
        shells.splice(i, 1); continue;
      }
      if (u < 1) continue;
      shells.splice(i, 1);
      const target = hitShips(sh.owner, sh.x1, sh.z1, 0.15);
      if (target) {
        const g = sh.g;
        const cit = Math.random() < g.cit;
        const fire = !cit && Math.random() < g.fire;
        const dmg = g.dmg * (0.85 + Math.random() * 0.3) * (cit ? 3 : 1);
        fx.explosion(sh.x1, target.cls.H + 0.6, sh.z1, 0.5 + g.cal);
        onHit(sh.owner, target, dmg, cit ? 'cit' : fire ? 'fire' : 'hit');
      } else {
        fx.splash(sh.x1, sh.z1, 0.5 + sh.g.cal * 1.4);
        sound?.splash(sh.g.cal);
      }
    }

    for (let i = torps.length - 1; i >= 0; i--) {
      const tp = torps[i];
      const f = fwdOf(tp.th), step = tp.speed * dt;
      tp.x += f.x * step; tp.z += f.z * step; tp.dist += step;
      tp.wake -= dt;
      if (tp.wake <= 0) { tp.wake = 0.07; fx.foam(tp.x - f.x * 0.6, tp.z - f.z * 0.6, 0.45, 2.2); }
      let gone = tp.dist > tp.range;
      if (!gone && islands.isLand(tp.x, tp.z)) { fx.dirt(tp.x, 0.5, tp.z, 1); gone = true; }
      if (!gone && tp.dist > 5) {
        const s = hitShips(tp.owner, tp.x, tp.z, 0.25);
        if (s) {
          fx.explosion(tp.x, 0.4, tp.z, 2); fx.splash(tp.x, tp.z, 2.4);
          onHit(tp.owner, s, tp.dmg * (0.9 + Math.random() * 0.2), 'torp');
          gone = true;
        }
      }
      if (gone) torps.splice(i, 1);
    }
    for (let i = 0; i < MAXT; i++) {
      const tp = torps[i];
      if (!tp) { tmesh.setMatrixAt(i, ZERO); continue; }
      E.set(0, tp.th, 0); Q.setFromEuler(E);
      M.compose(P.set(tp.x, 0.05, tp.z), Q, S1);
      tmesh.setMatrixAt(i, M);
      tmesh.setColorAt(i, col.set(tp.owner.side === 'player' ? 0x203040 : 0x6a1a1a));
    }
    tmesh.instanceMatrix.needsUpdate = true;
    tmesh.instanceColor.needsUpdate = true;
  }

  function clear() { shells.length = 0; torps.length = 0; }

  // Nearest enemy torpedo that will pass close to ship `s` (for the warning). Returns distance or -1.
  function torpThreat(s) {
    let best = -1;
    for (const tp of torps) {
      if (tp.owner.side === s.side) continue;
      const dx = s.x - tp.x, dz = s.z - tp.z, d = Math.hypot(dx, dz);
      if (d > 70) continue;
      const f = fwdOf(tp.th), along = dx * f.x + dz * f.z, perp = Math.abs(dx * f.z - dz * f.x);
      if (along > 0 && perp < s.cls.L * 0.7 && (best < 0 || d < best)) best = d;
    }
    return best;
  }

  return { fireGuns, fireTorps, torpBears, update, clear, torpThreat, shells, torps };
}
