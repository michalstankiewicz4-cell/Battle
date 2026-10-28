// Islands: clusters of flattened "lumps" (ellipsoids) with a wobbly outline, vertex-coloured sand/grass/cliffs, trees, rocks.
// Land test (isLand) uses the same ellipses, so shells, torpedoes and ships all agree on where the shore is.
import * as THREE from '../../vendor/three.module.js';
import { mulberry32 } from '../core/util.js';
import { EDGE, SAFE_R, U } from './constants.js';
import { mat } from '../render/materials.js';

const SAND = new THREE.Color(0xc9b47a), GRASS = new THREE.Color(0x4f7a3a), ROCK = new THREE.Color(0x7a7470), DARK = new THREE.Color(0x3c5a2c);

export function createIslands(scene, seed = 7) {
  const rnd = mulberry32(seed);
  const lumps = [];
  const group = new THREE.Group();
  scene.add(group);

  // Island clusters spread over the map, keeping the start area free.
  const clusters = [];
  for (let tries = 0; clusters.length < 11 && tries < 400; tries++) {
    const x = (rnd() * 2 - 1) * (EDGE - 40 * U), z = (rnd() * 2 - 1) * (EDGE - 40 * U);
    if (Math.hypot(x, z) < SAFE_R + 30 * U) continue;
    if (clusters.some((c) => Math.hypot(c.x - x, c.z - z) < 85 * U)) continue;
    clusters.push({ x, z, s: 0.7 + rnd() * 0.8 });
  }
  for (const c of clusters) {
    const n = 2 + Math.floor(rnd() * 4);
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, d = i === 0 ? 0 : (6 + rnd() * 10) * c.s * U;
      const rx = (7 + rnd() * 9) * c.s * U, rz = (7 + rnd() * 9) * c.s * U;
      lumps.push({ x: c.x + Math.cos(a) * d, z: c.z + Math.sin(a) * d, rx, rz, h: (2.5 + rnd() * 6 * c.s) * U });
    }
  }

  // Geometry: upper hemisphere, flattened, jittered, coloured by height (and by slope in detail styles).
  buildDetailed(group, lumps);

  // Shoreline scale of a lump in direction (dx, dz) (detailed islands have a wobbly outline).
  const scaleAt = (l, dx, dz) => (l.wob ? wobble(l.wob, Math.atan2(dz, dx)) : 1);
  // True when (x,z) is inside any island (optionally inflated by `pad` units).
  function isLand(x, z, pad = 0) {
    for (const l of lumps) {
      const k = scaleAt(l, (x - l.x) / l.rx, (z - l.z) / l.rz);
      const dx = (x - l.x) / (l.rx * 0.92 * k + pad), dz = (z - l.z) / (l.rz * 0.92 * k + pad);
      if (dx * dx + dz * dz < 1) return true;
    }
    return false;
  }
  // Height of the island surface (0 on water) — used for shells that slam into hills.
  function heightAt(x, z) {
    let h = 0;
    for (const l of lumps) {
      const k = scaleAt(l, (x - l.x) / l.rx, (z - l.z) / l.rz);
      const dx = (x - l.x) / (l.rx * k), dz = (z - l.z) / (l.rz * k), r2 = dx * dx + dz * dz;
      if (r2 < 1) h = Math.max(h, l.h * Math.sqrt(1 - r2) - 0.6 * U);
    }
    return h;
  }
  return { lumps, isLand, heightAt, group };
}

// Outline wobble of the islands (shared with the ocean shader for shallows and surf).
export const wobble = (w, a) => 0.9 + 0.09 * Math.sin(3 * a + w[0]) + 0.05 * Math.sin(7 * a + w[1]) + 0.025 * Math.sin(13 * a + w[2]);

// Denser, smoothly deformed islands with wet sand, slope-based cliffs, instanced trees (trunk + two crowns),
// shoreline rocks and a lighthouse on the largest island.
const WET = new THREE.Color(0x8a7a52), CLIFF = new THREE.Color(0x6a625a), GRASS_D = new THREE.Color(0x58743c);
function buildDetailed(group, lumps) {
  const r2 = mulberry32(77);
  const m0 = mat(0xffffff, 'land', { vertexColors: true });
  const col = new THREE.Color(), nrm = new THREE.Vector3();
  const trunks = [], crowns = [], rocks = [];
  const D = new THREE.Object3D();
  for (const l of lumps) {
    const g = new THREE.SphereGeometry(1, 40, 16, 0, Math.PI * 2, 0, Math.PI * 0.6);
    const p = g.attributes.position;
    const s1 = r2() * 6.28, s2 = r2() * 6.28, s3 = r2() * 6.28;
    l.wob = [s1, s2, s3];
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const a = Math.atan2(z, x);
      const j = wobble(l.wob, a);
      x *= j; z *= j;
      y = Math.max(0, (y + 0.309) / 1.309);
      const ridge = 1 + 0.18 * Math.sin(5 * a + s2) * y;
      p.setXYZ(i, x * l.rx, Math.pow(y, 0.85) * l.h * ridge - 0.6 * U, z * l.rz);
    }
    g.computeVertexNormals();
    const nr = g.attributes.normal;
    const colors = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const hy = p.getY(i), k = Math.max(0, hy) / l.h;
      nrm.fromBufferAttribute(nr, i);
      const n = Math.sin(p.getX(i) * 0.7 / U) * Math.sin(p.getZ(i) * 0.6 / U) * 0.5 + 0.5;
      if (hy < 0.12 * U) col.copy(WET);
      else if (k < 0.1) col.copy(SAND);
      else col.copy(GRASS_D).lerp(DARK, n * 0.6).lerp(ROCK, Math.max(0, (k - 0.65) / 0.35));
      if (nrm.y < 0.72 && hy > 0.3 * U) col.lerp(CLIFF, Math.min(1, (0.72 - nrm.y) * 4));
      colors.set([col.r, col.g, col.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const m = new THREE.Mesh(g, m0);
    m.position.set(l.x, 0, l.z);
    m.receiveShadow = true; m.castShadow = true;
    group.add(m);
    const trees = Math.floor(l.rx * l.rz / (3.5 * U * U));
    for (let i = 0; i < trees; i++) {
      const a = r2() * Math.PI * 2, r = 0.15 + r2() * 0.6;
      const top = l.h * Math.pow(Math.sqrt(Math.max(0, 1 - r * r)), 0.85) * 0.9 - 0.6 * U;
      if (top < 0.7 * U) continue;
      const s = (0.35 + r2() * 0.4) * U, x = l.x + Math.cos(a) * r * l.rx * wobble(l.wob, a), z = l.z + Math.sin(a) * r * l.rz * wobble(l.wob, a);
      trunks.push([x, top + 0.5 * s, z, s]);
      crowns.push([x, top + 1.4 * s, z, s * 1.15], [x, top + 2.2 * s, z, s * 0.8]);
    }
    const nr0 = Math.floor((l.rx + l.rz) / U * 0.6);
    for (let i = 0; i < nr0; i++) {
      const a = r2() * Math.PI * 2, r = (0.86 + r2() * 0.1) * wobble(l.wob, a);
      rocks.push([l.x + Math.cos(a) * r * l.rx, 0.05 * U, l.z + Math.sin(a) * r * l.rz, (0.25 + r2() * 0.55) * U]);
    }
  }
  const inst = (geo, m, list, yScale = 1) => {
    const im = new THREE.InstancedMesh(geo, m, list.length);
    list.forEach(([x, y, z, s], i) => { D.position.set(x, y, z); D.rotation.set(0, r2() * 6.28, 0); D.scale.set(s, s * yScale, s); D.updateMatrix(); im.setMatrixAt(i, D.matrix); });
    im.castShadow = true; im.receiveShadow = true;
    group.add(im);
  };
  inst(new THREE.CylinderGeometry(0.12, 0.18, 1, 6), mat(0x5a4030, 'tree'), trunks);
  inst(new THREE.ConeGeometry(0.95, 1.6, 7), mat(0x2f5a2a, 'tree'), crowns);
  inst(new THREE.DodecahedronGeometry(1, 0), mat(0x7a7470, 'land'), rocks, 0.6);
  // lighthouse on the largest island, on the side facing the map centre
  const big = lumps.reduce((a, b) => (a.rx * a.rz > b.rx * b.rz ? a : b));
  const a = Math.atan2(-big.z, -big.x), x = big.x + Math.cos(a) * big.rx * 0.62, z = big.z + Math.sin(a) * big.rz * 0.62;
  const base = big.h * Math.pow(Math.sqrt(1 - 0.62 * 0.62), 0.85) * 0.9 - 0.6 * U;
  const lh = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.62 - i * 0.07, 0.68 - i * 0.07, 1.1, 14), mat(i % 2 ? 0xb03028 : 0xf0ece0, 'paint'));
    seg.position.y = 0.55 + i * 1.1; lh.add(seg);
  }
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.6, 10), new THREE.MeshBasicMaterial({ color: 0xfff0b0 }));
  lamp.position.y = 4.7; lh.add(lamp);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.6, 10), mat(0x2a2a2a, 'dark')); cap.position.y = 5.3; lh.add(cap);
  lh.position.set(x, base, z); lh.scale.setScalar(U);
  lh.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  group.add(lh);
}
