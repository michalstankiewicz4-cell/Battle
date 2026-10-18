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
uniform vec3 uSun,uDeep,uLight,uShallow,uFoam,uFogColor,uSkyH,uSkyZ;
uniform float uFogNear,uFogFar;
uniform vec4 uLumps[${MAX_LUMPS}];
uniform vec4 uWob[${MAX_LUMPS}];
uniform int uLumpN;
uniform float uDetail;
varying vec3 vW;varying float vH;varying float vViewZ;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*vnoise(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}
// small ripples: two fbm layers scrolling in different directions
float ripple(vec2 p,float t){return fbm(p*.9+vec2(t*.35,t*.2))+fbm(p*1.7-vec2(t*.25,-t*.4))*.5;}
void main(){
  float e=.35;
  float hx=wave(vW.xz+vec2(e,0.),uTime)-wave(vW.xz-vec2(e,0.),uTime);
  float hz=wave(vW.xz+vec2(0.,e),uTime)-wave(vW.xz-vec2(0.,e),uTime);
  vec3 n=normalize(vec3(-hx/(2.*e),1.,-hz/(2.*e)));
  // shore proximity: 1 at the island edge, fading out over ~60% of the radius
  float sh=0.;
  for(int i=0;i<${MAX_LUMPS};i++){
    if(i>=uLumpN)break;
    vec4 L=uLumps[i];
    vec2 d=(vW.xz-L.xy)/L.zw;
    float r=length(d);
    vec4 W=uWob[i];
    if(W.w>.5){float a=atan(d.y,d.x);r/=.9+.09*sin(3.*a+W.x)+.05*sin(7.*a+W.y)+.025*sin(13.*a+W.z);r*=1.03;}
    sh=max(sh,1.-smoothstep(1.,1.6,r));
  }
  vec2 p=vW.xz;
  // detail normals, Fresnel sky reflection, sun glint, light through crests, cloud shadows, broken foam
  vec3 c;
  float ee=.25;
  if(uDetail>.5){
    float r0=ripple(p,uTime);
    float gx=(ripple(p+vec2(ee,0.),uTime)-r0)/ee, gz=(ripple(p+vec2(0.,ee),uTime)-r0)/ee;
    n=normalize(n+vec3(-gx*.19,0.,-gz*.19));
  }
  vec3 V=normalize(cameraPosition-vW);
  float fr=.02+.98*pow(1.-max(dot(n,V),0.),5.);
  vec3 R=reflect(-V,n);
  vec3 sky=mix(uSkyH,uSkyZ,clamp(R.y*1.6,0.,1.));
  float dif=clamp(dot(n,uSun),0.,1.);
  vec3 body=mix(uDeep,uLight,smoothstep(-.3,.45,vH)*.6+dif*.25);
  body+=uShallow*smoothstep(.2,.45,vH)*.12;
  body=mix(body,uShallow,smoothstep(.0,1.,sh)*.9);
  body=mix(body,uShallow*1.35+vec3(.08,.06,0.),smoothstep(.7,.98,sh)*.6);   // sand under very shallow water
  c=mix(body,sky,clamp(fr*1.6+.08,0.,.55));
  c+=(pow(max(dot(R,uSun),0.),160.)*5.+pow(max(dot(R,uSun),0.),12.)*.12)*vec3(1.,.92,.8);
  float cs=smoothstep(.48,.72,fbm(p*.011+vec2(uTime*.012,uTime*.006)));
  c*=1.-cs*.32;
  float br=uDetail>.5?fbm(p*.7+vec2(uTime*.25,0.)):.5+.2*sin(p.x*.9+uTime)*sin(p.y*.8);
  float foam=smoothstep(.3,.45,vH+(br-.5)*.32)*smoothstep(.35,.6,br);
  float surf=smoothstep(.86,.97,sh)*smoothstep(.3,.7,fbm(p*1.3+vec2(0.,uTime*.4)+sh*6.));
  surf+=smoothstep(.97,1.,sh);
  c=mix(c,uFoam,clamp(foam*.85+surf,0.,1.));
  float f=smoothstep(uFogNear,uFogFar,vViewZ);
  gl_FragColor=vec4(mix(c,uFogColor,f),1.);
}`;

const PAL = { deep: 0x05263c, light: 0x175a7e, shallow: 0x3aa8aa, foam: 0xf4fbfc, skyH: 0xdbe8f0, skyZ: 0x7aa0c4 };

export function createOcean(scene) {
  const pal = PAL;
  const SIZE = 900, SEG = 180, CELL = SIZE / SEG;
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const lumps = Array.from({ length: MAX_LUMPS }, () => new THREE.Vector4(1e5, 1e5, 1, 1));
  const wob = Array.from({ length: MAX_LUMPS }, () => new THREE.Vector4(0, 0, 0, 0));
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG,
    uniforms: {
      uTime: { value: 0 },
      uSun: { value: new THREE.Vector3(0.45, 0.8, 0.4).normalize() },
      uDeep: { value: new THREE.Color(pal.deep) },
      uLight: { value: new THREE.Color(pal.light) },
      uShallow: { value: new THREE.Color(pal.shallow) },
      uFoam: { value: new THREE.Color(pal.foam) },
      uSkyH: { value: new THREE.Color(pal.skyH) },
      uSkyZ: { value: new THREE.Color(pal.skyZ) },
      uFogColor: { value: new THREE.Color(0x9fb8c8) },
      uFogNear: { value: 400 }, uFogFar: { value: 900 },
      uDetail: { value: 1 },
      uLumps: { value: lumps }, uWob: { value: wob }, uLumpN: { value: 0 },
    },
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  scene.add(mesh);

  return {
    mesh,
    setDetail(on) { mat.uniforms.uDetail.value = on ? 1 : 0; },
    setLumps(list) {
      const n = Math.min(MAX_LUMPS, list.length);
      for (let i = 0; i < MAX_LUMPS; i++) {
        const l = list[i];
        if (i < n) lumps[i].set(l.x, l.z, l.rx, l.rz); else lumps[i].set(1e5, 1e5, 1, 1);
        if (i < n && l.wob) wob[i].set(l.wob[0], l.wob[1], l.wob[2], 1); else wob[i].set(0, 0, 0, 0);
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
