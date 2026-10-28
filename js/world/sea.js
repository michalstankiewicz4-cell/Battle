// The game's sea: WaterKit (the Water Lab's sea, in metres) — Gerstner waves from a sea state, Fresnel sky reflection,
// sun glitter, light through the crests, crest foam, detail ripples — with the game's islands as its shore (shallow
// water clears and turns green, waves die down, surf on the beaches), FoamKit's foam with memory (whitecaps leave lace,
// every ship's wake stays for minutes, splashes and torpedo tracks) and the player's bow wave and Kelvin waves.
// The ships ride the same waves (heightAt). Default sea: the Water Lab's open ocean, moderate (Beaufort 4), North Atlantic.
import * as THREE from '../../vendor/three.module.js';
import { SEAS, LOOKS, waveSet, heightAt as waterHeight, waterUniforms, setWaves, polarGrid, waterMaterial, hullTexture, GLSL_SHIP } from '../env/waterkit.js';
import { FoamMap, breaking } from '../env/foamkit.js';
import { U, KNOTS } from './constants.js';

const MAXL = 64;
// The shore for WaterKit: landH(xz) from the island lumps (same ellipses and wobble as islands.js), height in metres,
// negative = water depth; off the beach the bottom falls away at about 1:8.
const GLSL_LUMPS = /* glsl */`
#define MAXL ${MAXL}
uniform vec4 uLumps[MAXL];   // x, z, rx, rz (m)
uniform vec4 uLumpW[MAXL];   // wobble phases, has wobble
uniform float uLumpH[MAXL];  // height (m)
uniform int uLumpN;
float landH(vec2 p) {
  float h = -80.0;
  for (int i = 0; i < MAXL; i++) {
    if (i >= uLumpN) break;
    vec4 L = uLumps[i], W = uLumpW[i];
    vec2 d = (p - L.xy) / L.zw; float r = length(d);
    if (W.w > 0.5) { float a = atan(d.y, d.x); r /= 0.9 + 0.09 * sin(3.0 * a + W.x) + 0.05 * sin(7.0 * a + W.y) + 0.025 * sin(13.0 * a + W.z); }
    float e = r < 1.0 ? uLumpH[i] * sqrt(1.0 - r * r) - ${(0.6 * U).toFixed(1)} : -${(0.6 * U).toFixed(1)} - (r - 1.0) * min(L.z, L.w) * 0.12;
    h = max(h, e);
  }
  return h;
}`;

// how fast a ship looks to the water: the battle runs faster than real time; the shown knots are game knots
export const VIS = KNOTS * 0.5144;        // m/s of the game -> m/s as it looks (knots × 0.5144)

export function createSea(scene, renderer, { sea = 'moderate', look = 'atlantic', dir = 210 } = {}) {
  const u = waterUniforms();
  Object.assign(u, {
    uLumps: { value: Array.from({ length: MAXL }, () => new THREE.Vector4(1e6, 1e6, 1, 1)) },
    uLumpW: { value: Array.from({ length: MAXL }, () => new THREE.Vector4()) },
    uLumpH: { value: new Array(MAXL).fill(0) }, uLumpN: { value: 0 },
  });
  const S = SEAS[sea], Lk = LOOKS[look];
  const waves = waveSet(S, dir, 7); setWaves(u, waves);
  u.uDeep.value.set(Lk.deep); u.uScatter.value.set(Lk.scatter); u.uShine.value = Lk.shine; u.uRipples.value = Lk.ripples; u.uCrest.value = Lk.crest;
  u.uReflect.value = 1; u.uPlanar.value = 0; u.uAlpha.value = 1;
  u.uLodC.value.set(0, 0, 1, 0);
  // the player's hull for the bow wave and Kelvin waves (set by setPlayer)
  const brk = breaking(waves, S.Hs, Lk.crest);
  const grids = { high: polarGrid(256, 200, 0.6, 16000), light: polarGrid(128, 130, 1, 16000) };
  const mesh = new THREE.Mesh(grids.high, waterMaterial(u, { land: GLSL_LUMPS }));
  mesh.frustumCulled = false; mesh.renderOrder = 1;
  scene.add(mesh);
  let foam = null, detail = true, playerKey = '';
  try { foam = new FoamMap(renderer, u, GLSL_SHIP); } catch { foam = null; }   // needs float render targets

  return {
    mesh, u, waves,
    // the sea surface height at (x, z) and time t (the ships float on what is drawn)
    heightAt: (x, z, t) => waterHeight(waves, x, z, t, 0),
    setLumps(list) {
      const n = Math.min(MAXL, list.length);
      for (let i = 0; i < MAXL; i++) {
        const l = list[i];
        if (i < n) { u.uLumps.value[i].set(l.x, l.z, l.rx, l.rz); u.uLumpH.value[i] = l.h; if (l.wob) u.uLumpW.value[i].set(l.wob[0], l.wob[1], l.wob[2], 1); else u.uLumpW.value[i].set(0, 0, 0, 0); }
        else { u.uLumps.value[i].set(1e6, 1e6, 1, 1); u.uLumpH.value[i] = 0; }
      }
      u.uLumpN.value = n;
    },
    // the player's hull outline (half-breadth along the length) for the waves it makes
    setPlayer(cls, lines) {
      const key = cls.key + (lines ? ':lines' : '');
      if (key === playerKey) return; playerKey = key;
      const hl = cls.L / 2, hb = cls.W / 2;
      const L = lines || { zStern: -hl, zBow: hl, hw: (z) => hb * Math.max(0, z > 0 ? Math.min(1, (hl - z) / (hl * 0.6)) : Math.min(1, (hl + z) / (hl * 0.25))) };
      const tex = hullTexture(L);
      if (u.uHull.value) u.uHull.value.dispose();
      u.uHull.value = tex.tex; u.uHullZ.value.set(tex.z0, tex.z1, tex.max, 0);
      u.uShip.value.set(0, L.zBow, L.zStern, hb);
    },
    // Water detail (Options > Graphics > Detailed water): per-pixel wave normals, the denser grid and the foam memory.
    setDetail(on) { detail = on; u.uPixelN.value = on ? 1 : 0; mesh.geometry = on ? grids.high : grids.light; if (!on && foam) foam.clear(); },
    // per frame: time, the grid's centre (the camera's target), the player, every ship, the fog, the sun direction
    update(dt, t, cx, cz, player, ships, fog, sun) {
      u.uTime.value = t; u.uShift.value = 0;
      mesh.position.set(Math.round(cx / 4) * 4, 0, Math.round(cz / 4) * 4); u.uLodC.value.set(cx, cz, 1, 0);
      if (fog) { u.uFogCol.value.copy(fog.color); u.uFogFar.value = fog.far; u.uSkyH.value.copy(fog.color); }
      if (sun) u.uSun.value.copy(sun);
      // the player's waves and hull foam (analytic, near the ship); a surfaced ship only
      const sv = player && player.alive && (!player.sub || player.sub.y > -0.35 * U) ? Math.abs(player.speed) * VIS : 0;
      if (player) { u.uShipXf.value.set(player.x, player.z, Math.sin(player.th), Math.cos(player.th)); u.uShip.value.x = sv; }
      const foamOn = !!foam && detail;
      u.uShipFx.value.set(1, 1, 1, foamOn ? 1 : 0);
      if (foamOn && dt > 0) {
        const fleet = ships.filter((s) => s.alive && (!s.sub || s.sub.y > -0.35 * U)).map((s) => ({ x: s.x, z: s.z, th: s.th, v: Math.abs(s.speed) * VIS, halfL: s.cls.L / 2, halfB: s.cls.W / 2 }));
        const a = (dir) * Math.PI / 180;
        // ship foam lives shorter than in the lab: the battle runs about 5× fast, so the wake keeps its length in metres
        foam.update(dt, { centre: [cx, cz], heading: [0, 0], residualLife: 1 + 3.2 * S.Hs, shipLife: 120 * VIS * 1.2, brk, windDir: [Math.sin(a), Math.cos(a)], windRows: Math.min(1, Math.max(0, (S.Hs - 3) / 4)), on: true, fleet });
      }
    },
    // splashes and torpedo tracks into the foam memory (world x, z in metres)
    splash(x, z, size) { if (foam && detail) foam.stamp(x, z, 2.5 + 3.5 * size, { active: 1, foam: 0.9, ring: 0.6, life: 1.2 }); },
    track(x, z) { if (foam && detail) foam.stamp(x, z, 2.4, { active: 0.15, foam: 0.8, ring: 0, life: 0.01 }); },
    get foam() { return foam; },
  };
}
