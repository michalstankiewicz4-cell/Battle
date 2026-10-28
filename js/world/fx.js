// Particle effects on two instanced pools: "glow" (unlit: fire, muzzle flashes, explosions, tracers)
// and "lit" (smoke, water splashes, wake foam). Particles are soft camera-facing billboards; flat ones lie on the water.
import * as THREE from '../../vendor/three.module.js';
import { U } from './constants.js';


const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), S = new THREE.Vector3();
const C = new THREE.Color();

// Soft puff texture (noisy radial gradient) for billboard particles.
function puffTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  for (let i = 0; i < 9; i++) {
    const x = 32 + (Math.sin(i * 2.4) * 9), y = 32 + (Math.cos(i * 1.7) * 9), r = 16 + (i % 3) * 5;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  }
  // fade to zero at the border so the quad edge never shows
  g.globalCompositeOperation = 'destination-in';
  const mask = g.createRadialGradient(32, 32, 0, 32, 32, 31);
  mask.addColorStop(0, 'rgba(0,0,0,1)'); mask.addColorStop(0.6, 'rgba(0,0,0,.9)'); mask.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = mask; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
// Billboard material with a per-instance alpha attribute (aAlpha).
function billboardMat(additive) {
  const m = new THREE.MeshBasicMaterial({ map: puffTex(), transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = 'attribute float aAlpha;\nvarying float vAlpha;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvAlpha = aAlpha;');
    sh.fragmentShader = 'varying float vAlpha;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.a *= vAlpha;');
  };
  return m;
}
const camQ = new THREE.Quaternion(), FLAT = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2), QY = new THREE.Quaternion(), UPV = new THREE.Vector3(0, 1, 0);

function pool(scene, n, material) {
  const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.5, 1.5), material, n);
  const alpha = new THREE.InstancedBufferAttribute(new Float32Array(n), 1);
  alpha.setUsage(THREE.DynamicDrawUsage); mesh.geometry.setAttribute('aAlpha', alpha);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < n; i++) { mesh.setMatrixAt(i, zero); mesh.setColorAt(i, C.set(0xffffff)); }
  scene.add(mesh);
  const ps = [], slots = new Array(n);
  let next = 0;
  return {
    mesh,
    add(o) {
      if (o.keep !== true && fxRef.density < 1 && Math.random() > fxRef.density) return;   // Options: effects density
      const p = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, g: 0, drag: 0, life: 1, t: 0, s0: 1, s1: 1, sy: 1, c0: 0xffffff, c1: null, ry: Math.random() * 6.28, ...o };
      p.i = next; next = (next + 1) % n;
      if (slots[p.i]) slots[p.i].dead = true;        // pool full: recycle the oldest slot
      slots[p.i] = p;
      ps.push(p);
    },
    update(dt) {
      for (let k = ps.length - 1; k >= 0; k--) {
        const p = ps[k];
        if (p.dead) { ps.splice(k, 1); continue; }
        p.t += dt;
        const u = p.t / p.life;
        if (u >= 1) { mesh.setMatrixAt(p.i, zero); slots[p.i] = null; ps.splice(k, 1); continue; }
        p.vy -= p.g * dt;
        const d = Math.exp(-p.drag * dt);
        p.vx *= d; p.vy *= d; p.vz *= d;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        const s = p.s0 + (p.s1 - p.s0) * u;
        {
          // flat particles (foam, rings) lie on the water; the rest face the camera
          if (p.sy < 0.3) { Q.copy(QY.setFromAxisAngle(UPV, p.ry)).multiply(FLAT); S.set(s * 1.3, s * 1.3, 1); }
          else { Q.copy(camQ); S.set(s * 1.25, s * 1.25 * Math.max(1, p.sy * 0.8), 1); }
          alpha.array[p.i] = Math.min(1, u * 10) * Math.pow(1 - u, 1.3) * (p.a ?? 1);
        }
        M.compose(P.set(p.x, p.y, p.z), Q, S);
        mesh.setMatrixAt(p.i, M);
        C.set(p.c0); if (p.c1 !== null) C.lerp(TMP.set(p.c1), u);
        mesh.setColorAt(p.i, C);
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      alpha.needsUpdate = true;
    },
    clear() { for (const p of ps) mesh.setMatrixAt(p.i, zero); ps.length = 0; slots.fill(null); mesh.instanceMatrix.needsUpdate = true; },
  };
}
const TMP = new THREE.Color();
const fxRef = { density: 1 };
// Height of flat foam: above the highest wave crest so waves never cut it.
const SURF = 0.47 * U;
const R = (a = 1) => (Math.random() * 2 - 1) * a;

export function createFx(scene) {
  const glowMat = billboardMat(true);
  glowMat.color.setRGB(3.2, 2.6, 2.0);                                  // HDR so the bloom picks up fire and flashes
  const glow = pool(scene, 900, glowMat);
  const lit = pool(scene, 2600, billboardMat(false));

  const fx = {
    get density() { return fxRef.density; },
    set density(v) { fxRef.density = v; },
    // cam: the active camera (billboards face it)
    update(dt, cam) { if (cam) camQ.copy(cam.quaternion); glow.update(dt); lit.update(dt); },
    camera: null,
    clear() { glow.clear(); lit.clear(); },

    // Sizes are in the old game units (about 10 m, ~ calibre); positions in metres; every length and speed below × U.
    // Water column from a shell hitting the sea (size ~ calibre).
    splash(x, z, size = 1) {
      const n = 6 + Math.round(size * 6);
      for (let i = 0; i < n; i++) {
        lit.add({ x: x + R(0.6 * size * U), y: 0.2 * U, z: z + R(0.6 * size * U), vx: R(1.2 * U), vy: (5 + Math.random() * 6) * Math.sqrt(size) * U, vz: R(1.2 * U),
          g: 14 * U, life: 1 + Math.random() * 0.6, s0: 0.5 * size * U, s1: 0.9 * size * U, sy: 1.6, c0: 0xf2fbff, c1: 0x9ccbe0 });
      }
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * 6.28;
        lit.add({ x, y: SURF, z, vx: Math.cos(a) * 3 * size * U, vz: Math.sin(a) * 3 * size * U, drag: 2.5, life: 2.2, s0: 0.6 * size * U, s1: 1.4 * size * U, sy: 0.12, c0: 0xe6f6f8, c1: 0x5f9fbf });
      }
    },
    // Dust and rock from a shell hitting an island.
    dirt(x, y, z, size = 1) {
      for (let i = 0; i < 10; i++) {
        lit.add({ x: x + R(0.5 * U), y: y + 0.3 * U, z: z + R(0.5 * U), vx: R(3 * U), vy: (3 + Math.random() * 5) * U, vz: R(3 * U), g: 12 * U, life: 1.2, s0: 0.5 * size * U, s1: 0.2 * U, c0: 0x8a7a5a, c1: 0x5a4a3a });
      }
      fx.smoke(x, y + 0.5 * U, z, 3, 0.8 * size);
    },
    // Fireball + debris + smoke.
    explosion(x, y, z, size = 1) {
      for (let i = 0; i < 10 + size * 6; i++) {
        glow.add({ x: x + R(0.4 * U), y: y + R(0.3 * U), z: z + R(0.4 * U), vx: R(4 * size * U), vy: (2 + Math.random() * 4 * size) * U, vz: R(4 * size * U), drag: 3, g: 2 * U,
          life: 0.4 + Math.random() * 0.5, s0: 0.9 * size * U, s1: 0.2 * U, c0: 0xfff2a0, c1: 0xd0401a });
      }
      fx.smoke(x, y + 0.5 * U, z, 6, size);
    },
    // Short bright flash + puff at a gun muzzle; (dx,dz) = firing direction.
    muzzle(x, y, z, dx, dz, size = 1) {
      for (let i = 0; i < 4; i++) {
        glow.add({ x: x + dx * i * 0.3 * size * U, y, z: z + dz * i * 0.3 * size * U, vx: dx * 6 * U, vy: 0.5 * U, vz: dz * 6 * U, drag: 6, life: 0.18, s0: 0.8 * size * U, s1: 0.2 * U, c0: 0xffffd0, c1: 0xff8a30 });
      }
      for (let i = 0; i < 3; i++) {
        lit.add({ x: x + dx * 1.2 * size * U, y, z: z + dz * 1.2 * size * U, vx: (dx * 4 + R(1)) * U, vy: 0.8 * U, vz: (dz * 4 + R(1)) * U, drag: 1.5, life: 1.6, s0: 0.6 * size * U, s1: 1.8 * size * U, c0: 0xd8d8d0, c1: 0x8a8f96 });
      }
    },
    smoke(x, y, z, n = 3, size = 1, dark = false) {
      for (let i = 0; i < n; i++) {
        lit.add({ x: x + R(0.4 * size * U), y, z: z + R(0.4 * size * U), vx: (R(0.6) + 0.8) * U, vy: (1.2 + Math.random()) * U, vz: (R(0.6) + 0.4) * U, drag: 0.4,
          life: 2.5 + Math.random() * 1.5, s0: 0.5 * size * U, s1: 2.2 * size * U, c0: dark ? 0x2a2a2e : 0x6a6a70, c1: dark ? 0x55565c : 0xa6a8ae });
      }
    },
    fire(x, y, z, size = 1) {
      glow.add({ x: x + R(0.3 * U), y, z: z + R(0.3 * U), vy: (1.5 + Math.random() * 1.5) * U, life: 0.5, s0: 0.6 * size * U, s1: 0.15 * U, c0: 0xffd060, c1: 0xc02a10 });
    },
    // Foam patch left on the water (ship wake, torpedo wake).
    foam(x, z, size = 1, life = 3) {
      lit.add({ x, y: SURF - 0.02 * U, z, life, s0: 0.6 * size * U, s1: 1.6 * size * U, sy: 0.1, c0: 0xf0fafa, c1: 0x3f7fa0 });
    },
    // Bright tracer streak (shell in flight).
    tracer(x, y, z, size = 0.3) {
      glow.add({ x, y, z, life: 0.12, s0: size * U, s1: size * 0.4 * U, c0: 0xffe9a0, c1: 0xff8040 });
    },
  };
  return fx;
}
