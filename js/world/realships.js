// Real ships in the game: the Ship Lab's models (ShipKit, 1:1, metres) through the transformer (three levels of detail,
// mounts that train) — ORP Błyskawica as the destroyer, ORP Orzeł as the submarine. The cruiser and the battleship keep
// the older models (models.js) until they get their own.
// One transform per ship type, cloned for every ship (geometry and materials shared). The game's turrets (two on the
// destroyer: forward and aft) drive the real mounts: each main-battery mount follows the game turret on its end.
import * as THREE from '../../vendor/three.module.js';
import { transformShip } from '../shipkit/transform.js';
import { SHIPS } from '../shipkit/index.js';
import { CLASSES } from './constants.js';

export const REAL = { dd: 'blyskawica', ss: 'orzel' };

// the classes take the real hull's length and beam (hits, collisions and wakes follow the model)
for (const [key, id] of Object.entries(REAL)) {
  const L = SHIPS[id].lines; if (!L) continue;
  let hw = 0; for (let z = L.zStern; z <= L.zBow; z += 0.5) hw = Math.max(hw, L.hw(z) || 0);
  CLASSES[key].L = L.zBow - L.zStern; CLASSES[key].W = hw * 2;
}

const cache = {};
const transformed = (id) => (cache[id] ||= transformShip(id));

function pair(a, b, map) { map.set(a, b); a.children.forEach((c, i) => b.children[i] && pair(c, b.children[i], map)); }
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// Returns the same shape as models.js buildShip: { group, body, turrets: [pivot] } plus lod, lines, sync(), level().
export function buildReal(cls) {
  const T = transformed(REAL[cls.key]);
  const group = new THREE.Group(), body = new THREE.Group(); body.rotation.order = 'YXZ'; group.add(body);
  const lod = T.lod.clone(); lod.autoUpdate = false; body.add(lod);
  const map = new Map(); pair(T.lod, lod, map);
  lod.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  // main-battery mounts (not AA, not torpedo tubes), each with its trains on every level and its rest heading
  const mounts = T.mounts.map((m, i) => ({ ...m, i, trains: m.trains.map((p) => { const c = map.get(p); return { node: c, rest: c.quaternion.clone() }; }) }))
    .filter((m) => !m.aa && !m.torp && m.trains.length);
  // the game's turret pivots (not drawn): the forward one drives the mounts forward of midships, the aft one the rest
  const turrets = cls.turrets.map((spec) => { const p = new THREE.Object3D(); p.position.set(0, cls.H + spec.y, spec.z); body.add(p); return p; });
  const zOf = (m) => m.trains[0].node.position.z;
  for (const m of mounts) {
    let best = 0, bd = Infinity;
    cls.turrets.forEach((spec, k) => { const d = Math.abs(spec.z - zOf(m)) + (Math.sign(spec.z) !== Math.sign(zOf(m)) ? 1000 : 0); if (d < bd) { bd = d; best = k; } });
    m.turret = best;
  }
  const q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0);
  return {
    group, body, turrets, lod, lines: T.lines, shared: true, real: REAL[cls.key],
    // after the game turrets turned: every mount trains to its turret's bearing (relative to its own rest heading)
    sync() {
      for (const m of mounts) {
        const yaw = turrets[m.turret].rotation.y, lim = (m.arc || 150) * Math.PI / 180;
        const rel = Math.max(-lim, Math.min(lim, wrap(yaw - m.yaw0)));
        q.setFromAxisAngle(Y, rel);
        for (const t of m.trains) t.node.quaternion.copy(t.rest).multiply(q);
      }
    },
    // level of detail by how big the ship looks: an orthographic view by its zoom, a perspective one by distance
    level(camera, viewH) {
      let d;
      if (camera.isOrthographicCamera) d = viewH / camera.zoom * 0.35;
      else { camera.getWorldPosition(P); group.getWorldPosition(P2); d = P.distanceTo(P2) * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) / 0.42; }
      const lv = lod.levels; let k = 0; for (let i = 0; i < lv.length; i++) if (d >= lv[i].distance) k = i;
      lv.forEach((l, i) => { l.object.visible = i === k; });
    },
  };
}
const P = new THREE.Vector3(), P2 = new THREE.Vector3();
