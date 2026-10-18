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
uniform int uLumpN,uStyle;
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
  vec3 c;
  if(uStyle==0){
    float dif=clamp(dot(n,uSun),0.,1.);
    c=mix(uDeep,uLight,smoothstep(-.25,.35,vH)*.7+dif*.3);
    c=mix(c,uShallow,sh*.85);
    float n2=hash(floor(p*2.1));
    float foam=smoothstep(.34,.42,vH+n2*.07)*.8+smoothstep(.93,1.,sh)*(.6+.4*sin(uTime*2.+n2*6.));
    c=mix(c,uFoam,clamp(foam,0.,1.)*.8);
    float spec=pow(clamp(dot(reflect(-uSun,n),vec3(0.,.8,.6)),0.,1.),24.);
    c+=spec*.35;
  } else if(uStyle==2){
    // toon: few soft-edged colour bands, crisp foam blobs, thin animated ripple rings near shores
    float dif=dot(n,uSun);
    float t=vH*1.1+dif*.3+(vnoise(p*.035+uTime*.02)-.5)*.35;
    c=t<.2?uDeep:t<.5?mix(uDeep,uLight,.55):uLight;
    c=mix(c,uShallow,step(.45,sh));
    float ring=step(.9,fract(sh*3.2-uTime*.35))*step(.5,sh)*(1.-step(.95,sh));
    c=mix(c,uFoam,ring*.9);
    c=mix(c,uFoam,step(.95,sh));
    float blob=step(.37,vH+(vnoise(p*.6+uTime*.3)-.5)*.16);
    c=mix(c,uFoam,blob);
    float lines=step(.96,fract(fbm(p*.05+vec2(uTime*.01,0.))*4.5+vH*1.2));   // drawn wave contours
    c=mix(c,mix(uLight,uFoam,.6),lines*.7);
  } else {
    // real / paint: detail normals, Fresnel sky reflection, sun glint, sub-surface tint, cloud shadows, broken foam
    float k=uStyle==1?.55:.3, ee=.25;
    float r0=ripple(p,uTime);
    float gx=(ripple(p+vec2(ee,0.),uTime)-r0)/ee, gz=(ripple(p+vec2(0.,ee),uTime)-r0)/ee;
    n=normalize(n+vec3(-gx*k*.35,0.,-gz*k*.35));
    vec3 V=normalize(cameraPosition-vW);
    float ndv=max(dot(n,V),0.);
    float fr=.02+.98*pow(1.-ndv,5.);
    vec3 R=reflect(-V,n);
    vec3 sky=mix(uSkyH,uSkyZ,clamp(R.y*1.6,0.,1.));
    float dif=clamp(dot(n,uSun),0.,1.);
    vec3 body=mix(uDeep,uLight,smoothstep(-.3,.45,vH)*.6+dif*.25);
    body+=uShallow*smoothstep(.2,.45,vH)*(uStyle==1?.12:.25);             // light through wave crests
    body=mix(body,uShallow,smoothstep(.0,1.,sh)*.9);
    body=mix(body,uShallow*1.35+vec3(.08,.06,0.),smoothstep(.7,.98,sh)*.6);   // sand under very shallow water
    c=mix(body,sky,clamp(fr*(uStyle==1?2.2:1.)+(uStyle==1?.1:0.),0.,1.));
    float spec=pow(max(dot(R,uSun),0.),uStyle==1?160.:60.)*(uStyle==1?5.:.8)+(uStyle==1?pow(max(dot(R,uSun),0.),12.)*.12:0.);
    c+=spec*vec3(1.,.92,.8);
    if(uStyle==3) c=mix(c,uShallow*.9,(fbm(p*.018)-.45)*.6);          // painterly colour patches
    float cs=smoothstep(.48,.72,fbm(p*.011+vec2(uTime*.012,uTime*.006)));
    c*=1.-cs*(uStyle==1?.32:.18);
    float br=fbm(p*.7+vec2(uTime*.25,0.));
    float foam=smoothstep(.3,.45,vH+(br-.5)*.32)*smoothstep(.35,.6,br);
    float surf=smoothstep(.86,.97,sh)*smoothstep(.3,.7,fbm(p*1.3+vec2(0.,uTime*.4)+sh*6.));
    surf+=smoothstep(.97,1.,sh);
    c=mix(c,uFoam,clamp(foam*.85+surf,0.,1.));
  }
  float f=smoothstep(uFogNear,uFogFar,vViewZ);
  gl_FragColor=vec4(mix(c,uFogColor,f),1.);
}`;

const PAL = {
  pixel: { deep: 0x0b2f4a, light: 0x2f7fa8, shallow: 0x46b8ae, foam: 0xdff2f2 },
  real: { deep: 0x05263c, light: 0x175a7e, shallow: 0x3aa8aa, foam: 0xf4fbfc, skyH: 0xdbe8f0, skyZ: 0x7aa0c4 },
  toon: { deep: 0x2470b4, light: 0x3f9ad8, shallow: 0x62d2cc, foam: 0xffffff },
  paint: { deep: 0x1d5470, light: 0x4a8fa6, shallow: 0x86c4b0, foam: 0xf6f1e4, skyH: 0xeae4d2, skyZ: 0x9cbccc },
};

export function createOcean(scene, style = 'pixel') {
  const pal = PAL[style] || PAL.pixel;
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
      uSkyH: { value: new THREE.Color(pal.skyH ?? 0xcfe0ea) },
      uSkyZ: { value: new THREE.Color(pal.skyZ ?? 0x6a90b0) },
      uStyle: { value: { pixel: 0, real: 1, toon: 2, paint: 3 }[style] ?? 0 },
      uFogColor: { value: new THREE.Color(0x9fb8c8) },
      uFogNear: { value: 400 }, uFogFar: { value: 900 },
      uLumps: { value: lumps }, uWob: { value: wob }, uLumpN: { value: 0 },
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
