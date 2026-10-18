// Camera rig: isometric orthographic follow camera (play), gun camera (C: perspective view from above
// the turret that bears on the view direction, mouse look with pointer lock, wheel = binocular zoom)
// and a low perspective showcase camera for the start screen.
import * as THREE from '../../vendor/three.module.js';
import { clamp, wrapAngle } from './util.js';
import { toWorld } from '../world/ships.js';

const VIEW_H = 60;                                  // visible world height at zoom 1
const ISO_OFFSET = new THREE.Vector3(0, 70, 52);
const UP = new THREE.Vector3(0, 1, 0);
const GUN_FOV = 52;                                 // gun camera field of view at zoom ×1
const PITCH_MIN = -0.6, PITCH_MAX = 0.08;
const TOP = { dd: 1.7, ca: 2.8, bb: 4.0, ss: 1.0 };          // superstructure height above the deck per class

export function createCameraRig({ settings, input }) {
  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, -150, 350);
  const persp = new THREE.PerspectiveCamera(42, 1, 0.3, 1200);
  let camera = ortho;
  let yaw = 0.35, userZoom = 1, initialised = false, orbit = 0;
  let view = 'iso';                                 // 'iso' | 'gun' (during play)
  let gYaw = 0, gPitch = -0.05, gZoom = 1, gInit = false;
  const gPos = new THREE.Vector3(), gWant = new THREE.Vector3();
  const look = new THREE.Vector3(), tmp = new THREE.Vector3();

  const turnView = (dx, dy) => {
    const k = 0.0022 * settings.data.mouse.rotSens / gZoom;
    gYaw = wrapAngle(gYaw - dx * k);
    gPitch = clamp(gPitch - dy * k * 0.6, PITCH_MIN, PITCH_MAX);
  };
  input.onWheel = (dy) => {
    const z = Math.exp(-dy * 0.0012 * settings.data.mouse.zoomSens);
    if (view === 'gun') gZoom = clamp(gZoom * z, 1, 8);
    else userZoom = clamp(userZoom * z, 0.4, 2.2);
  };
  input.onDrag = (dx, dy) => {
    if (view === 'gun') turnView(dx, dy);
    else if (camera === ortho) yaw -= dx * 0.006 * settings.data.mouse.rotSens;
  };
  input.onLook = (dx, dy) => { if (view === 'gun') turnView(dx, dy); };

  function resize(w, h) {
    const a = w / h;
    ortho.left = -a * VIEW_H / 2; ortho.right = a * VIEW_H / 2; ortho.top = VIEW_H / 2; ortho.bottom = -VIEW_H / 2;
    ortho.updateProjectionMatrix();
    persp.aspect = a; persp.updateProjectionMatrix();
  }

  // Height of the gun camera above the sea for a ship (used to start the view looking at the current aim point).
  const gunHeight = (ship) => (ship.cls.sub ? 1.5 : ship.cls.H + TOP[ship.cls.key] + 0.9);

  // Enter/leave the gun camera. aim: current aim point (the view starts looking at it).
  function setView(v, ship, aim) {
    if (v === view) return;
    view = v;
    if (v === 'gun' && ship) {
      const ax = aim ? aim.x : ship.x + Math.sin(ship.th) * 60, az = aim ? aim.z : ship.z + Math.cos(ship.th) * 60;
      const d = Math.max(20, Math.hypot(ax - ship.x, az - ship.z));
      gYaw = Math.atan2(ax - ship.x, az - ship.z);
      gPitch = clamp(-Math.atan2(gunHeight(ship), d), PITCH_MIN, PITCH_MAX);
      gZoom = ship.cls.sub ? 1.5 : 1; gInit = false;
    }
  }

  // Turret the camera sits over: looking forward of the beam → the most forward turret,
  // looking aft → the most aft one (so the superstructure stays behind the camera).
  function pickTurret(ship) {
    const fwd = Math.abs(wrapAngle(gYaw - ship.th)) < Math.PI / 2;
    return ship.turrets.reduce((a, b) => ((fwd ? b.spec.z > a.spec.z : b.spec.z < a.spec.z) ? b : a));
  }

  // ctx: { mode, target: {x,z}, ship: {x,z,th,L}, player (ship entity, for the gun camera) }
  function update(dt, t, ctx) {
    if (ctx.mode === 'menu') {
      camera = persp;
      if (persp.fov !== 42) { persp.fov = 42; persp.updateProjectionMatrix(); }
      orbit += dt * 0.05;
      const s = ctx.ship, a = s.th + 2.2 + Math.sin(orbit) * 0.5;
      const d = 26 + s.L * 1.1;
      persp.position.set(s.x + Math.sin(a) * d, 6 + s.L * 0.25, s.z + Math.cos(a) * d);
      tmp.set(s.x, 2, s.z);
      persp.up.copy(UP);
      persp.lookAt(tmp);
      persp.rotateY(0.28);                          // keep the ship right of centre (the menu is on the left)
      initialised = false;
    } else if (view === 'gun' && ctx.mode === 'play' && ctx.player) {
      camera = persp;
      const p = ctx.player;
      gYaw = wrapAngle(gYaw + (input.isDown('KeyE') - input.isDown('KeyQ')) * 0.9 * dt / gZoom);
      if (p.cls.sub) {
        // periscope: eye at the top of the attack periscope, a few decimetres above the waves at periscope depth
        const base = toWorld(p, 0.08, 0.75);
        gWant.set(base.x, p.model.body.position.y + p.cls.H + 0.95 + 1.25 + 0.08 + Math.sin(t * 1.3) * 0.06, base.z);
      } else {
        // above and a little behind the turret, high enough to clear the superstructure
        const tr = pickTurret(p);
        const base = toWorld(p, 0, tr.spec.z);
        const back = tr.spec.size * 3.2;
        const up = p.cls.H + TOP[p.cls.key] + 0.9 + p.model.body.position.y * 0.5;
        gWant.set(base.x - Math.sin(gYaw) * back, up, base.z - Math.cos(gYaw) * back);
      }
      if (!gInit) { gPos.copy(gWant); gInit = true; } else gPos.lerp(gWant, 1 - Math.exp(-6 * dt));
      persp.position.copy(gPos);
      persp.rotation.order = 'YXZ';
      persp.rotation.set(gPitch, gYaw + Math.PI, 0);
      const fov = GUN_FOV / gZoom;
      if (Math.abs(persp.fov - fov) > 0.01) { persp.fov += (fov - persp.fov) * Math.min(1, dt * 10); persp.updateProjectionMatrix(); }
    } else {
      camera = ortho;
      yaw += (input.isDown('KeyE') - input.isDown('KeyQ')) * 1.6 * dt;
      tmp.set(ctx.target.x, 0, ctx.target.z);
      if (!initialised) { look.copy(tmp); initialised = true; }
      look.lerp(tmp, 1 - Math.exp(-5 * dt));
      ortho.position.copy(look).add(tmp.copy(ISO_OFFSET).applyAxisAngle(UP, yaw));
      ortho.lookAt(look);
      const zt = (ctx.mode === 'dead' ? 0.75 : 1) * userZoom;
      if (Math.abs(ortho.zoom - zt) > 0.002) { ortho.zoom += (zt - ortho.zoom) * Math.min(1, dt * 8); ortho.updateProjectionMatrix(); }
    }
    camera.updateMatrixWorld();
  }

  return {
    update, resize, setView,
    get camera() { return camera; },
    get yaw() { return yaw; },
    get zoom() { return view === 'gun' ? gZoom : userZoom; },
    get view() { return view; },
    get gunYaw() { return gYaw; },
  };
}
