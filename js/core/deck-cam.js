// Deck walk (F): first-person view of a sailor on the player's own deck (the sailor is not drawn).
// WASD walks (Shift runs), the mouse looks around (pointer lock), the right button holds binoculars to the eyes
// (wheel = their zoom). The sailor walks on whatever the model has underfoot (decks, steps up to 0.6 m) and is
// stopped by walls; he never steps off the hull. Works in the ship's own frame (metres), so he rides with the ship.
import * as THREE from '../../vendor/three.module.js';
import { clamp, wrapAngle } from './util.js';

const EYE = 1.65, STEP = 0.6, WALK = 2.2, RUN = 5, WIDE_FOV = 70;
const PITCH = 1.35;

export function createDeckCam({ settings, input }) {
  const ray = new THREE.Raycaster();
  const Mnow = new THREE.Matrix4(), Mray = new THREE.Matrix4(), Minv = new THREE.Matrix4();
  const G = new THREE.Matrix4(), B = new THREE.Matrix4(), Sc = new THREE.Matrix4();
  const qY = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0), ONE = new THREE.Vector3(1, 1, 1), P0 = new THREE.Vector3();
  const o = new THREE.Vector3(), d = new THREE.Vector3(), eye = new THREE.Vector3();
  let ship = null, x = 0, y = 0, z = 0, yaw = 0, pitch = -0.05, bino = 6;

  // ship frame (metres, +z bow, +y up, waterline 0) -> world: now (for the eye) and as last drawn (for the rays,
  // so they meet the meshes where they are); the old models are scaled ×U on the body, the scale is taken out
  function frames(s) {
    const body = s.model.body;
    G.compose(P0.set(s.x, 0, s.z), qY.setFromAxisAngle(Y, s.th), ONE);
    B.compose(body.position, body.quaternion, ONE);
    Mnow.multiplyMatrices(G, B);
    const k = body.scale.x || 1;
    Mray.copy(body.matrixWorld).multiply(Sc.makeScale(1 / k, 1 / k, 1 / k));
    Minv.copy(Mray).invert();
  }
  const target = (s) => (s.model.lod ? s.model.lod.levels[0].object : s.model.body);
  // first hit of a ray given in the ship frame; returns the hit in the ship frame (or null)
  function cast(s, ox, oy, oz, dx, dy, dz, far) {
    o.set(ox, oy, oz).applyMatrix4(Mray);
    d.set(dx, dy, dz).transformDirection(Mray);
    ray.set(o, d); ray.far = far; ray.near = 0;
    const h = ray.intersectObject(target(s), true)[0];
    return h ? h.point.clone().applyMatrix4(Minv) : null;
  }
  const floorAt = (s, px, pz, from) => cast(s, px, from + STEP, pz, 0, -1, 0, STEP + 3);

  // place the sailor on the lowest open deck found across the hull (the main deck rather than a roof)
  function enter(s, viewYaw) {
    ship = s; frames(s);
    const L = s.cls.L, hb = s.cls.W / 2, lines = s.model.lines;
    let best = null;
    for (let i = 0; i <= 12; i++) {
      const pz = -L * 0.38 + L * 0.76 * i / 12, w = lines ? Math.max(0, lines.hw(pz)) : hb;
      for (const side of [0.55, -0.55, 0]) {
        const h = cast(s, w * side, 40, pz, 0, -1, 0, 60);
        if (h && h.y > -0.5 && (!best || h.y < best.y - 0.05)) best = h;
      }
    }
    if (best) { x = best.x; y = best.y; z = best.z; } else { x = 0; z = 0; y = s.cls.H; }
    yaw = wrapAngle(viewYaw - s.th); pitch = -0.05; bino = 6;
  }

  function look(dx, dy) {
    const k = 0.0022 * settings.data.mouse.rotSens / (binoOn() ? bino : 1);
    yaw = wrapAngle(yaw - dx * k);
    pitch = clamp(pitch - dy * k, -PITCH, PITCH);
  }
  const binoOn = () => input.dragging;               // right button held
  function wheel(dy) { if (binoOn()) bino = clamp(bino * Math.exp(-dy * 0.0012 * settings.data.mouse.zoomSens), 3, 10); }

  function update(dt, cam) {
    const s = ship;
    frames(s);
    // walking: forward/back along the view, sideways across it; a wall stops the move (try each axis alone)
    const f = input.isDown('KeyW', 'ArrowUp') - input.isDown('KeyS', 'ArrowDown');
    const r = input.isDown('KeyD', 'ArrowRight') - input.isDown('KeyA', 'ArrowLeft');
    if ((f || r) && dt > 0) {
      const v = (input.isDown('ShiftLeft', 'ShiftRight') ? RUN : WALK) * dt / Math.hypot(f, r);
      const mx = (Math.sin(yaw) * f - Math.cos(yaw) * r) * v, mz = (Math.cos(yaw) * f + Math.sin(yaw) * r) * v;
      for (const [ax, az] of [[mx, mz], [mx, 0], [0, mz]]) {
        if (!ax && !az) continue;
        const len = Math.hypot(ax, az);
        if (cast(s, x, y + 1.0, z, ax / len, 0, az / len, len + 0.35)) continue;      // wall
        const fl = floorAt(s, x + ax, z + az, y);
        if (!fl) continue;                                                              // the edge of the deck
        x += ax; z += az; y = fl.y; break;
      }
    }
    eye.set(x, y + EYE, z).applyMatrix4(Mnow);
    cam.position.copy(eye);
    cam.rotation.order = 'YXZ';
    cam.rotation.set(pitch, s.th + yaw + Math.PI, 0);
    const fov = binoOn() ? WIDE_FOV / bino : WIDE_FOV;
    if (Math.abs(cam.fov - fov) > 0.01) { cam.fov += (fov - cam.fov) * Math.min(1, dt * 12 || 1); cam.updateProjectionMatrix(); }
  }

  return {
    enter, update, look, wheel,
    get bino() { return binoOn(); },
    get zoom() { return binoOn() ? bino : 1; },
    get yaw() { return ship ? ship.th + yaw : 0; },
    get pos() { return { x, y, z }; },
  };
}
