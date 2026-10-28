// Salvo camera: a picture-in-picture view (top-right corner) that rides behind the player's most recent
// shell in flight (or torpedo, when no shell is flying), then holds on the impact for a moment.
// Rendered through a second, small post pipeline, so it matches the main view.
import * as THREE from '../../vendor/three.module.js';
import { PostPipeline } from '../render/post.js';
import { U } from '../world/constants.js';

// Size follows the CSS frame (#pip in hud.css): 320×180, or 200×113 on windows up to 900 px wide.
export const PIP = { w: 320, h: 180, margin: 12 };
const pipSize = () => (innerWidth <= 900 ? [200, 113] : [320, 180]);
const HOLD = 1.8;                                  // seconds to keep looking at the impact

export function createSalvoCam(renderer) {
  const cam = new THREE.PerspectiveCamera(46, 16 / 9, 1, 900 * U);
  const pipe = new PostPipeline(renderer);
  let size = pipSize();
  pipe.resize(size[0], size[1]);
  let follow = null, kind = null, hold = 0, active = false;
  const pos = new THREE.Vector3(), want = new THREE.Vector3(), look = new THREE.Vector3(), lookWant = new THREE.Vector3();
  let fresh = true;

  // Newest player projectile: the shell fired most recently that is already flying, else a torpedo.
  function pick(world) {
    const p = world.player;
    let best = null;
    for (const sh of world.combat.shells) if (sh.owner === p && sh.t >= 0 && (!best || sh.t < best.t)) best = sh;
    if (best) return ['shell', best];
    let tb = null;
    for (const tp of world.combat.torps) if (tp.owner === p && (!tb || tp.dist < tb.dist)) tb = tp;
    return tb ? ['torp', tb] : [null, null];
  }

  return {
    get active() { return active; },
    camera: cam,
    setParams(gfx) { pipe.setParams(gfx); },
    // Returns true while the picture-in-picture should be shown.
    update(dt, world, enabled) {
      if (!enabled) { active = false; follow = null; return false; }
      const shells = world.combat.shells, torps = world.combat.torps;
      const alive = follow && (kind === 'shell' ? shells.includes(follow) : torps.includes(follow));
      if (follow && !alive) { follow = null; hold = HOLD; }       // landed: keep the last view on the impact
      if (!follow) {
        const [k, f] = pick(world);
        // a new salvo interrupts the hold only once its shells are clear of the muzzle
        if (f && (hold <= 0 || (k === 'shell' && f.t > 0.25))) { follow = f; kind = k; hold = 0; fresh = true; }
      }
      if (follow) {
        if (kind === 'shell') {
          const s = follow, dx = s.x1 - s.x0, dz = s.z1 - s.z0, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d;
          const u = Math.min(1, s.t / s.T), slope = (-s.y0 + 4 * s.apex * (1 - 2 * u)) / d;   // dy per unit of horizontal travel
          want.set(s.x - ux * 6 * U, s.y + 1.4 * U - slope * 6 * U, s.z - uz * 6 * U);
          lookWant.set(s.x + ux * 20 * U, s.y + slope * 20 * U, s.z + uz * 20 * U);
        } else {
          const tp = follow, ux = Math.sin(tp.th), uz = Math.cos(tp.th);
          want.set(tp.x - ux * 5 * U, 1.2 * U, tp.z - uz * 5 * U);
          lookWant.set(tp.x + ux * 25 * U, 0.2 * U, tp.z + uz * 25 * U);
        }
        if (fresh) { pos.copy(want); look.copy(lookWant); fresh = false; }
        else { pos.lerp(want, 1 - Math.exp(-12 * dt)); look.lerp(lookWant, 1 - Math.exp(-8 * dt)); }
        active = true;
      } else if (hold > 0) {
        hold -= dt; active = true;
      } else active = false;
      if (active) { cam.position.copy(pos); cam.lookAt(look); cam.updateMatrixWorld(); }
      return active;
    },
    // Draws the picture into the top-right corner of the main canvas; returns the rectangle (top-left origin) or null.
    render(scene, fullW, fullH) {
      if (!active) return null;
      const [w, h] = pipSize();
      if (w !== size[0]) { size = [w, h]; pipe.resize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); }
      pipe.render(scene, cam, { x: fullW - PIP.margin - w, y: fullH - PIP.margin - h, w, h, fullW, fullH });
      return { x: fullW - PIP.margin - w, y: PIP.margin, w, h };
    },
  };
}
