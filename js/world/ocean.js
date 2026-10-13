// Ocean surface: a grid that follows the camera target, displaced by a sum of directional sine waves.
// The same wave function exists in JS (waveAt) so ships can bob and pitch on the surface.
// Shallow water and surf around islands are computed in the shader from the island lump list.
import * as THREE from '../../vendor/three.module.js';

// [dirX, dirZ, amplitude, wavelength, speed]
const WAVES = [
  [0.8, 0.6, 0.20, 26, 1.0],
  [-0.4, 0.9, 0.13, 14, 1.3],
  [0.95, -0.3, 0.07, 7.5, 1.7],
  [-0.7, -0.7, 0.05, 4.3, 2.1],
];
const MAX_LUMPS = 64;

export function waveAt(x, z, t) {
  let h = 0;
  for (const [dx, dz, a, l, s] of WAVES) {
    const k = 2 * Math.PI / l;
    h += a * Math.sin((dx * x + dz * z) * k + t * s);
  }
  return h;
}

const glslWaves = WAVES.map(([dx, dz, a, l, s]) => {
  const k = (2 * Math.PI / l).toFixed(5);
  return `h+=${a.toFixed(3)}*sin((${dx.toFixed(3)}*p.x+${dz.toFixed(3)}*p.y)*${k}+t*${s.toFixed(3)});`;
}).join('');

const COMMON = `uniform float uTime;
float wave(vec2 p,float t){float h=0.;${glslWaves}return h;}`;

const VERT = `${COMMON}
varying vec3 vW;varying float vH;varying float vViewZ;
void main(){
  vec4 w=modelMatrix*vec4(position,1.);
  float h=wave(w.xz,uTime);
  w.y+=h; vW=w.xyz; vH=h;
  vec4 mv=viewMatrix*w; vViewZ=-mv.z;
  gl_Position=projectionMatrix*mv;
}`;

const FRAG = `${COMMON}
uniform vec3 uSun,uDeep,uLight,uShallow,uFoam,uFogColor;
uniform float uFogNear,uFogFar;
uniform vec4 uLumps[${MAX_LUMPS}];
uniform int uLumpN;
varying vec3 vW;varying float vH;varying float vViewZ;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
  float e=.35;
  float hx=wave(vW.xz+vec2(e,0.),uTime)-wave(vW.xz-vec2(e,0.),uTime);
  float hz=wave(vW.xz+vec2(0.,e),uTime)-wave(vW.xz-vec2(0.,e),uTime);
  vec3 n=normalize(vec3(-hx/(2.*e),1.,-hz/(2.*e)));
  float dif=clamp(dot(n,uSun),0.,1.);
  // shore proximity: 1 at the island edge, fading out over ~60% of the radius
  float sh=0.;
  for(int i=0;i<${MAX_LUMPS};i++){
    if(i>=uLumpN)break;
    vec4 L=uLumps[i];
    vec2 d=(vW.xz-L.xy)/L.zw;
    float r=length(d);
    sh=max(sh,1.-smoothstep(1.,1.6,r));
  }
  vec3 c=mix(uDeep,uLight,smoothstep(-.25,.35,vH)*.7+dif*.3);
  c=mix(c,uShallow,sh*.85);
  // crest foam and surf near shores
  float n2=hash(floor(vW.xz*2.1));
  float foam=smoothstep(.34,.42,vH+n2*.07)*.8+smoothstep(.93,1.,sh)*(.6+.4*sin(uTime*2.+n2*6.));
  c=mix(c,uFoam,clamp(foam,0.,1.)*.8);
  float spec=pow(clamp(dot(reflect(-uSun,n),vec3(0.,.8,.6)),0.,1.),24.);
  c+=spec*.35;
  float f=smoothstep(uFogNear,uFogFar,vViewZ);
  gl_FragColor=vec4(mix(c,uFogColor,f),1.);
}`;

export function createOcean(scene) {
  const SIZE = 900, SEG = 180, CELL = SIZE / SEG;
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const lumps = Array.from({ length: MAX_LUMPS }, () => new THREE.Vector4(1e5, 1e5, 1, 1));
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG,
    uniforms: {
      uTime: { value: 0 },
      uSun: { value: new THREE.Vector3(0.45, 0.8, 0.4).normalize() },
      uDeep: { value: new THREE.Color(0x0b2f4a) },
      uLight: { value: new THREE.Color(0x2f7fa8) },
      uShallow: { value: new THREE.Color(0x46b8ae) },
      uFoam: { value: new THREE.Color(0xdff2f2) },
      uFogColor: { value: new THREE.Color(0x9fb8c8) },
      uFogNear: { value: 400 }, uFogFar: { value: 900 },
      uLumps: { value: lumps }, uLumpN: { value: 0 },
    },
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  scene.add(mesh);

  return {
    mesh,
    setLumps(list) {
      const n = Math.min(MAX_LUMPS, list.length);
      for (let i = 0; i < MAX_LUMPS; i++) {
        const l = list[i];
        if (i < n) lumps[i].set(l.x, l.z, l.rx, l.rz); else lumps[i].set(1e5, 1e5, 1, 1);
      }
      mat.uniforms.uLumpN.value = n;
    },
    // Follows the camera target, snapped to the grid so the vertices never swim.
    update(t, cx, cz, fog) {
      mat.uniforms.uTime.value = t;
      mesh.position.set(Math.round(cx / CELL) * CELL, 0, Math.round(cz / CELL) * CELL);
      if (fog) {
        mat.uniforms.uFogColor.value.copy(fog.color);
        mat.uniforms.uFogNear.value = fog.near; mat.uniforms.uFogFar.value = fog.far;
      }
    },
  };
}
