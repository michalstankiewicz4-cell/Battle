// Camera rig (same approach as the land game): isometric orthographic follow camera with yaw rotation
// (Q/E or right-drag) and wheel zoom for play, plus a low perspective showcase camera for the start screen.
import * as THREE from '../../vendor/three.module.js';
import { clamp } from './util.js';

const VIEW_H = 60;                                  // visible world height at zoom 1
const ISO_OFFSET = new THREE.Vector3(0, 70, 52);
const UP = new THREE.Vector3(0, 1, 0);

export function createCameraRig({ settings, input }) {
  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, -150, 350);
  const persp = new THREE.PerspectiveCamera(42, 1, 0.5, 1200);
  let camera = ortho;
  let yaw = 0.35, userZoom = 1, initialised = false, orbit = 0;
  const look = new THREE.Vector3(), tmp = new THREE.Vector3();

  input.onWheel = (dy) => { userZoom = clamp(userZoom * Math.exp(-dy * 0.0012 * settings.data.mouse.zoomSens), 0.4, 2.2); };
  input.onDrag = (dx) => { if (camera === ortho) yaw -= dx * 0.006 * settings.data.mouse.rotSens; };

  function resize(w, h) {
    const a = w / h;
    ortho.left = -a * VIEW_H / 2; ortho.right = a * VIEW_H / 2; ortho.top = VIEW_H / 2; ortho.bottom = -VIEW_H / 2;
    ortho.updateProjectionMatrix();
    persp.aspect = a; persp.updateProjectionMatrix();
  }

  // ctx: { mode, target: {x,z}, ship: {x,z,th} }
  function update(dt, t, ctx) {
    if (ctx.mode === 'menu') {
      camera = persp;
      orbit += dt * 0.05;
      const s = ctx.ship, a = s.th + 2.2 + Math.sin(orbit) * 0.5;
      const d = 26 + s.L * 1.1;
      persp.position.set(s.x + Math.sin(a) * d, 6 + s.L * 0.25, s.z + Math.cos(a) * d);
      // keep the ship on the right third of the screen (menu sits on the left)
      tmp.set(s.x, 2, s.z);
      persp.lookAt(tmp);
      persp.rotateY(0.28);
      persp.up.copy(UP);
      initialised = false;
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
    update, resize,
    get camera() { return camera; },
    get yaw() { return yaw; },
    get zoom() { return userZoom; },
  };
}
