// Islands: clusters of flattened low-poly "lumps" (ellipsoids) with vertex-coloured sand/grass/rock and a few trees.
// Land test (isLand) uses the same ellipses, so shells, torpedoes and ships all agree on where the shore is.
import * as THREE from '../../vendor/three.module.js';
import { mulberry32 } from '../core/util.js';
import { EDGE, SAFE_R } from './constants.js';

const SAND = new THREE.Color(0xc9b47a), GRASS = new THREE.Color(0x4f7a3a), ROCK = new THREE.Color(0x7a7470), DARK = new THREE.Color(0x3c5a2c);

export function createIslands(scene, seed = 7) {
  const rnd = mulberry32(seed);
  const lumps = [];
  const group = new THREE.Group();
  scene.add(group);

  // Island clusters spread over the map, keeping the start area free.
  const clusters = [];
  for (let tries = 0; clusters.length < 11 && tries < 400; tries++) {
    const x = (rnd() * 2 - 1) * (EDGE - 40), z = (rnd() * 2 - 1) * (EDGE - 40);
    if (Math.hypot(x, z) < SAFE_R + 30) continue;
    if (clusters.some((c) => Math.hypot(c.x - x, c.z - z) < 85)) continue;
    clusters.push({ x, z, s: 0.7 + rnd() * 0.8 });
  }
  for (const c of clusters) {
    const n = 2 + Math.floor(rnd() * 4);
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, d = i === 0 ? 0 : (6 + rnd() * 10) * c.s;
      const rx = (7 + rnd() * 9) * c.s, rz = (7 + rnd() * 9) * c.s;
      lumps.push({ x: c.x + Math.cos(a) * d, z: c.z + Math.sin(a) * d, rx, rz, h: 2.5 + rnd() * 6 * c.s });
    }
  }

  // Geometry: upper hemisphere, flattened, jittered, coloured by height.
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  const treeMat = new THREE.MeshLambertMaterial({ color: 0x2f5a2a, flatShading: true });
  const treeGeo = new THREE.ConeGeometry(0.9, 2.6, 5);
  const col = new THREE.Color();
  for (const l of lumps) {
    const g = new THREE.SphereGeometry(1, 14, 7, 0, Math.PI * 2, 0, Math.PI * 0.6);
    const p = g.attributes.position;
    const colors = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const j = 0.85 + rnd() * 0.3;
      x *= j; z *= j;
      y = (y + 0.309) / 1.309;                     // the 0.6π cap spans y = 1 .. -0.309; remap to 0..1 so the rim sits slightly below water
      const hy = y * l.h - 0.6;
      p.setXYZ(i, x * l.rx, hy, z * l.rz);
      const k = Math.max(0, hy) / l.h;
      if (k < 0.12) col.copy(SAND); else if (k < 0.6) col.copy(GRASS).lerp(DARK, rnd() * 0.5); else col.copy(GRASS).lerp(ROCK, (k - 0.6) / 0.4);
      colors.set([col.r, col.g, col.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat);
    m.position.set(l.x, 0, l.z);
    group.add(m);
    const trees = Math.floor(l.rx * l.rz / 18);
    for (let i = 0; i < trees; i++) {
      const a = rnd() * Math.PI * 2, r = 0.25 + rnd() * 0.45;
      const tx = Math.cos(a) * r, tz = Math.sin(a) * r;
      const top = l.h * Math.sqrt(Math.max(0, 1 - r * r)) * 0.92 - 0.6;
      if (top < 0.8) continue;
      const tr = new THREE.Mesh(treeGeo, treeMat);
      const s = 0.7 + rnd() * 0.6;
      tr.scale.setScalar(s);
      tr.position.set(l.x + tx * l.rx, top + 1.1 * s, l.z + tz * l.rz);
      group.add(tr);
    }
  }

  // True when (x,z) is inside any island (optionally inflated by `pad` units).
  function isLand(x, z, pad = 0) {
    for (const l of lumps) {
      const dx = (x - l.x) / (l.rx * 0.92 + pad), dz = (z - l.z) / (l.rz * 0.92 + pad);
      if (dx * dx + dz * dz < 1) return true;
    }
    return false;
  }
  // Height of the island surface (0 on water) — used for shells that slam into hills.
  function heightAt(x, z) {
    let h = 0;
    for (const l of lumps) {
      const dx = (x - l.x) / l.rx, dz = (z - l.z) / l.rz, r2 = dx * dx + dz * dz;
      if (r2 < 1) h = Math.max(h, l.h * Math.sqrt(1 - r2) - 0.6);
    }
    return h;
  }
  return { lumps, isLand, heightAt, group };
}
