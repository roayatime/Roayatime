import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { fbm, smooth, useT, vnoise } from "./core";

/* ================================================================== */
/* Lighting presets (time of day / weather), shared by all exteriors   */
/* ================================================================== */
export type Mood = "night" | "storm" | "dusk" | "grey" | "dawn" | "day";
export const MOODS: Record<Mood, { fog: string; fogD: number; skyTop: string; skyHor: string; sun: string; sunI: number; sunDir: [number, number, number]; amb: string; ambI: number; sea: string; seaDeep: string; stars: number; moon: number; cloud: number }> = {
  night: { fog: "#15303b", fogD: 0.0019, skyTop: "#07101a", skyHor: "#2a4e5c", sun: "#b4cbe8", sunI: 1.9, sunDir: [-0.4, 0.55, -0.7], amb: "#41687c", ambI: 1.45, sea: "#0d2a33", seaDeep: "#03141a", stars: 1, moon: 1, cloud: 0.55 },
  storm: { fog: "#22353b", fogD: 0.0036, skyTop: "#101a1f", skyHor: "#3d5258", sun: "#c3cfd2", sunI: 1.0, sunDir: [-0.3, 0.6, -0.6], amb: "#5a7078", ambI: 1.0, sea: "#1c3a40", seaDeep: "#07191d", stars: 0, moon: 0, cloud: 1 },
  dusk: { fog: "#3b3d48", fogD: 0.0022, skyTop: "#141b2b", skyHor: "#8a5e4c", sun: "#ffb27a", sunI: 1.3, sunDir: [0.75, 0.18, -0.55], amb: "#4a4d63", ambI: 0.55, sea: "#24333f", seaDeep: "#0a141c", stars: 0.2, moon: 0, cloud: 0.6 },
  grey: { fog: "#7d8a8e", fogD: 0.0026, skyTop: "#56656b", skyHor: "#a9b3b3", sun: "#e8ecec", sunI: 1.0, sunDir: [-0.2, 0.75, -0.5], amb: "#8c9a9e", ambI: 0.9, sea: "#3d5559", seaDeep: "#14272b", stars: 0, moon: 0, cloud: 0.85 },
  dawn: { fog: "#5c6470", fogD: 0.0022, skyTop: "#27334a", skyHor: "#d39b78", sun: "#ffd0a0", sunI: 1.4, sunDir: [-0.7, 0.2, 0.5], amb: "#6a6f82", ambI: 0.6, sea: "#2e4450", seaDeep: "#0c1a22", stars: 0, moon: 0, cloud: 0.55 },
  day: { fog: "#9aa9ad", fogD: 0.0016, skyTop: "#5c7d92", skyHor: "#c4ced0", sun: "#fff4e0", sunI: 1.8, sunDir: [0.4, 0.8, 0.3], amb: "#9fb0b6", ambI: 0.8, sea: "#335a63", seaDeep: "#0f2a31", stars: 0, moon: 0, cloud: 0.6 },
};

export const Lights: React.FC<{ mood: Mood; shadows?: boolean; target?: [number, number, number]; flash?: number }> = ({ mood, shadows = true, target = [0, 0, 0], flash = 0 }) => {
  const m = MOODS[mood];
  const ref = useRef<THREE.DirectionalLight>(null);
  useLayoutEffect(() => {
    const l = ref.current;
    if (!l) return;
    l.target.position.set(...target);
    l.target.updateMatrixWorld();
    const s = l.shadow.camera as THREE.OrthographicCamera;
    s.left = -260; s.right = 260; s.top = 260; s.bottom = -260; s.near = 1; s.far = 1600;
    s.updateProjectionMatrix();
    l.shadow.bias = -0.0006;
    l.shadow.normalBias = 0.6;
  }, [target]);
  const d = m.sunDir;
  return (
    <>
      <hemisphereLight args={[m.amb, "#0a0f10", m.ambI + flash * 2.5]} />
      <directionalLight
        ref={ref}
        color={m.sun}
        intensity={m.sunI + flash * 4}
        position={[target[0] + d[0] * 600, target[1] + d[1] * 600, target[2] + d[2] * 600]}
        castShadow={shadows}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
    </>
  );
};

/* ================================================================== */
/* Sky dome: gradient + procedural clouds + stars + moon (shader).     */
/* ================================================================== */
const SKY_VS = `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*p; gl_Position.z = gl_Position.w; }`;
const SKY_FS = `
uniform vec3 uTop; uniform vec3 uHor; uniform float uTime; uniform float uStars; uniform float uMoon; uniform float uCloud; uniform vec3 uMoonDir; uniform float uFlash;
varying vec3 vDir;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
float fb(vec2 p){ float s=0.0, a=0.5; for(int i=0;i<4;i++){ s+=a*n(p); p*=2.07; a*=0.5; } return s; }
void main(){
  vec3 d = normalize(vDir);
  float e = clamp(d.y, -0.2, 1.0);
  vec3 col = mix(uHor, uTop, pow(clamp(e,0.0,1.0), 0.55));
  if (e < 0.0) col = uHor*0.85;
  vec2 cp = d.xz/(0.25+max(d.y,0.02))*1.6 + vec2(uTime*0.012, uTime*0.004);
  float c = smoothstep(0.42, 0.85, fb(cp)) * uCloud * smoothstep(-0.02, 0.15, d.y);
  // stars
  vec2 sp = floor(d.xz/(d.y+1.2)*900.0);
  float st = step(0.9975, h(sp)) * uStars * smoothstep(0.05,0.35,d.y) * (1.0-c);
  col += vec3(st)*0.9;
  // moon
  float md = dot(d, normalize(uMoonDir));
  col += uMoon * (smoothstep(0.99993, 0.99996, md) * vec3(0.9,0.92,0.88) + pow(max(md,0.0), 2200.0)*vec3(0.35,0.4,0.45)) * (1.0 - c*0.85);
  vec3 cc = mix(uHor*1.15, uTop*1.6+0.03, 0.4);
  col = mix(col, cc, c*0.85);
  col += uFlash * vec3(0.55,0.6,0.7) * (0.4 + c);
  gl_FragColor = vec4(col, 1.0);
}`;

export const Sky: React.FC<{ mood: Mood; flash?: number }> = ({ mood, flash = 0 }) => {
  const { t } = useT();
  const m = MOODS[mood];
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SKY_VS,
        fragmentShader: SKY_FS,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uTop: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uTime: { value: 0 }, uStars: { value: 0 }, uMoon: { value: 0 },
          uCloud: { value: 0 }, uMoonDir: { value: new THREE.Vector3(-0.5, 0.35, -0.8) }, uFlash: { value: 0 },
        },
      }),
    [],
  );
  mat.uniforms.uTop.value.set(m.skyTop);
  mat.uniforms.uHor.value.set(m.skyHor);
  mat.uniforms.uTime.value = t;
  mat.uniforms.uStars.value = m.stars;
  mat.uniforms.uMoon.value = m.moon;
  mat.uniforms.uCloud.value = m.cloud;
  mat.uniforms.uFlash.value = flash;
  return (
    <mesh material={mat} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[4000, 32, 16]} />
    </mesh>
  );
};

/* ================================================================== */
/* Ocean: Gerstner-style sum of sines in the vertex shader of a        */
/* standard PBR material (keeps fog + lights); crest foam in fragment. */
/* Time is a uniform driven by the Remotion frame (deterministic).     */
/* ================================================================== */
const WAVES = [
  // dirX, dirZ, wavelength, amplitude
  [1.0, 0.25, 62, 1.0], [0.7, -0.7, 37, 0.55], [-0.3, 1.0, 23, 0.32], [0.95, 0.4, 14, 0.18], [-0.8, -0.45, 9, 0.1], [0.2, 0.98, 5.5, 0.05],
];
export const waveHeight = (x: number, z: number, t: number, storm: number) => {
  let y = 0;
  for (const [dx, dz, L, A] of WAVES) {
    const l = Math.hypot(dx, dz);
    const k = (2 * Math.PI) / L;
    const w = Math.sqrt(9.8 * k);
    y += A * storm * Math.sin(k * ((dx / l) * x + (dz / l) * z) - w * t);
  }
  return y;
};

export const Ocean: React.FC<{ mood: Mood; storm?: number; size?: number; seg?: number; center?: [number, number] }> = ({ mood, storm = 1, size = 2400, seg = 220, center = [0, 0] }) => {
  const { t } = useT();
  const m = MOODS[mood];
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uStorm: { value: 1 }, uFoam: { value: new THREE.Color("#c9d6d6") }, uDeep: { value: new THREE.Color() } }), []);
  const mat = useMemo(() => {
    const mm = new THREE.MeshStandardMaterial({ color: new THREE.Color(m.sea), roughness: 0.32, metalness: 0.05 });
    mm.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, uniforms);
      const W = WAVES.map(([dx, dz, L, A]) => {
        const l = Math.hypot(dx, dz);
        return `vec4(${(dx / l).toFixed(4)}, ${(dz / l).toFixed(4)}, ${((2 * Math.PI) / L).toFixed(5)}, ${A.toFixed(3)})`;
      });
      sh.vertexShader = sh.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
uniform float uTime; uniform float uStorm; varying float vH; varying float vDist;
const int NW = ${W.length};
vec4 WV[NW];`,
        )
        .replace(
          "#include <beginnormal_vertex>",
          `WV[0]=${W[0]};WV[1]=${W[1]};WV[2]=${W[2]};WV[3]=${W[3]};WV[4]=${W[4]};WV[5]=${W[5]};
vec4 wp0 = modelMatrix * vec4(position, 1.0);
float hh = 0.0; float gx = 0.0; float gz = 0.0;
for (int i = 0; i < NW; i++) {
  vec4 w = WV[i];
  float om = sqrt(9.8 * w.z);
  float ph = w.z * (w.x * wp0.x + w.y * wp0.z) - om * uTime;
  float a = w.w * uStorm;
  hh += a * sin(ph);
  gx += a * w.z * w.x * cos(ph);
  gz += a * w.z * w.y * cos(ph);
}
vH = hh / (1.6 * max(uStorm, 0.2));
vec3 objectNormal = normalize(vec3(-gx, gz, 1.0)); // local frame: x=world x, y=-world z, z=world y
#ifdef USE_TANGENT
vec3 objectTangent = vec3( tangent.xyz );
#endif`,
        )
        .replace("#include <begin_vertex>", `vec3 transformed = vec3(position.x, position.y, position.z + hh);`)
        .replace("#include <project_vertex>", `#include <project_vertex>
vDist = -mvPosition.z;`);
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", `#include <common>
uniform vec3 uFoam; uniform vec3 uDeep; varying float vH; varying float vDist;`)
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
float crest = smoothstep(0.62, 1.05, vH);
diffuseColor.rgb = mix(uDeep, diffuseColor.rgb, smoothstep(-0.8, 0.6, vH));
diffuseColor.rgb = mix(diffuseColor.rgb, uFoam, crest * 0.38);`,
        );
    };
    return mm;
  }, [uniforms]); // eslint-disable-line react-hooks/exhaustive-deps
  mat.color.set(m.sea);
  uniforms.uTime.value = t;
  uniforms.uStorm.value = storm;
  uniforms.uDeep.value.set(m.seaDeep);
  // The plane lies in XY (rotated to XZ); the shader displaces along local +Z = world +Y.
  return (
    <mesh material={mat} rotation={[-Math.PI / 2, 0, 0]} position={[center[0], 0, center[1]]} receiveShadow frustumCulled={false}>
      <planeGeometry args={[size, size, seg, seg]} />
    </mesh>
  );
};

/* ================================================================== */
/* Eilean Mor: procedural heightfield island with cliffs.              */
/* Long axis along X (~560 m), plateau 45-70 m, lighthouse summit.     */
/* ================================================================== */
export const ISLAND = { lx: 290, lz: 120, cliff: 52, summit: [-38, 12] as [number, number] };

export const islandMask = (x: number, z: number) => {
  // two overlapping lobes + multi-scale noisy coastline (0 = coast, >0 inland)
  const e1 = 1 - Math.hypot(x / ISLAND.lx, z / ISLAND.lz);
  const e2 = 0.92 - Math.hypot((x + 120) / (ISLAND.lx * 0.55), (z - 45) / (ISLAND.lz * 0.85));
  const e3 = 0.9 - Math.hypot((x - 150) / (ISLAND.lx * 0.45), (z + 30) / (ISLAND.lz * 0.7));
  const base = Math.max(e1, e2, e3);
  const wob = (fbm(x * 0.0075 + 3.1, z * 0.0075 - 1.7, 4) - 0.5) * 0.42 + (fbm(x * 0.03, z * 0.03, 3) - 0.5) * 0.12;
  return base + wob;
};

export const islandHeight = (x: number, z: number) => {
  const m = islandMask(x, z);
  const edgeN = (fbm(x * 0.02 + 5, z * 0.02 + 2, 3) - 0.5) * 0.05;
  const cliff = smooth(-0.015 + edgeN, 0.045 + edgeN, m); // steep, ragged cliff band
  const top = 34 + 22 * fbm(x * 0.006 + 1.3, z * 0.006 - 2.2, 3);
  const plateau = top + 16 * smooth(0.0, 0.7, m) * fbm(x * 0.012, z * 0.012, 4) + (vnoise(x * 0.08, z * 0.08) - 0.5) * 1.6;
  const d = Math.hypot(x - ISLAND.summit[0], z - ISLAND.summit[1]);
  const summit = 16 * Math.exp(-(d * d) / (2 * 75 * 75));
  const below = -14 + 10 * smooth(-0.25, -0.02, m); // shelf under water near the coast
  // cliff face texture: horizontal strata + noise
  const strata = (vnoise(x * 0.15, z * 0.15) - 0.5) * 2.5 * (cliff > 0.05 && cliff < 0.95 ? 1 : 0);
  let y = m < -0.015 + edgeN ? below : below + (plateau + summit - below) * cliff + strata;
  // rocky skerries / stacks just offshore
  const sk = fbm(x * 0.03 + 9, z * 0.03 + 4, 3);
  if (m < -0.03 && m > -0.24 && sk > 0.64) y = Math.max(y, (sk - 0.64) * 170 - 4);
  return y;
};

export const surfaceY = (x: number, z: number) => islandHeight(x, z);

export const Island: React.FC<{ wet?: number }> = ({ wet = 0 }) => {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(760, 420, 300, 170);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position as THREE.BufferAttribute;
    const col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      p.setY(i, islandHeight(x, z));
    }
    g.computeVertexNormals();
    const nrm = g.attributes.normal as THREE.BufferAttribute;
    const grass = new THREE.Color("#4f5f3a"), grass2 = new THREE.Color("#6b6c45"), rock = new THREE.Color("#4c4a46"), rock2 = new THREE.Color("#6f6a62"), wetc = new THREE.Color("#23231f"), tmp = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const slope = 1 - nrm.getY(i);
      const n1 = fbm(x * 0.05, z * 0.05, 3);
      tmp.copy(grass).lerp(grass2, n1);
      const r = smooth(0.18, 0.42, slope + (n1 - 0.5) * 0.15);
      const rk = rock.clone().lerp(rock2, vnoise(x * 0.2, y * 0.3));
      tmp.lerp(rk, r);
      tmp.lerp(wetc, smooth(4, -2, y));
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, []);
  const { t } = useT();
  const uni = useMemo(() => ({ uTime: { value: 0 } }), []);
  const mat = useMemo(() => {
    const mm = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0 });
    mm.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, uni);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vWP; varying vec3 vWN;")
        .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvWP = (modelMatrix * vec4(transformed,1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", `#include <common>
uniform float uTime; varying vec3 vWP; varying vec3 vWN;
float h3(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float n3(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h3(i),h3(i+vec2(1,0)),f.x), mix(h3(i+vec2(0,1)),h3(i+vec2(1,1)),f.x), f.y); }
float f3(vec2 p){ return 0.5*n3(p)+0.25*n3(p*2.1)+0.125*n3(p*4.3)+0.0625*n3(p*8.7); }`)
        .replace("#include <color_fragment>", `#include <color_fragment>
float steep = 1.0 - smoothstep(0.35, 0.75, abs(vWN.y));
vec2 tp = vec2(vWP.x + vWP.z, vWP.y);
float strata = f3(vec2(tp.x*0.08, tp.y*0.9)) ;
float crack = smoothstep(0.62, 0.7, f3(vec2(tp.x*0.35, tp.y*0.12)));
vec3 rockA = vec3(0.30,0.29,0.27), rockB = vec3(0.47,0.45,0.41);
vec3 rockc = mix(rockA, rockB, strata) * (1.0 - crack*0.55);
rockc *= 0.85 + 0.3*f3(tp*0.6);
diffuseColor.rgb = mix(diffuseColor.rgb, rockc, steep);
// lichen / guano streaks near cliff tops
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.62,0.6,0.52), steep * smoothstep(0.75,0.95,f3(vec2(tp.x*0.5, tp.y*0.05))) * 0.35);
// wet dark band + animated surf at the waterline
float wetb = smoothstep(6.0, 0.5, vWP.y);
diffuseColor.rgb *= 1.0 - wetb*0.45;
float surf = smoothstep(2.6, 0.2, vWP.y) * smoothstep(-1.5, 0.3, vWP.y) * smoothstep(0.45, 0.8, f3(vec2((vWP.x+vWP.z)*0.12 + uTime*0.6, vWP.y*0.5 - uTime*0.9)));
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.85,0.9,0.9), surf*0.8);`);
    };
    return mm;
  }, [uni]);
  uni.uTime.value = t;
  mat.roughness = 0.96 - wet * 0.4;
  return <mesh geometry={geo} material={mat} castShadow receiveShadow />;
};

/** Distant islets of the Flannan group (low-poly silhouettes). */
export const Islets: React.FC = () => {
  const items: [number, number, number, number][] = [
    [-2000, -900, 160, 34], [1500, -1500, 120, 28], [2500, 700, 190, 38], [-1100, 2000, 110, 22], [700, 2300, 140, 30], [-2700, 600, 90, 20],
  ];
  return (
    <group>
      {items.map(([x, z, r, h], i) => (
        <mesh key={i} position={[x, h * 0.32 - 6, z]} scale={[r, h, r * 0.6]} castShadow>
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color="#3a3d38" roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  );
};

/* ================================================================== */
/* Rain (instanced streaks) and sea spray, frame-driven.               */
/* ================================================================== */
export const Rain: React.FC<{ amount?: number; area?: number; center?: [number, number, number]; wind?: number }> = ({ amount = 1, area = 120, center = [0, 0, 0], wind = 0.35 }) => {
  const { t } = useT();
  const N = Math.round(2600 * amount);
  const ref = useRef<THREE.InstancedMesh>(null);
  const seeds = useMemo(() => {
    const a = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) {
      a[i * 4] = vnoise(i * 1.31, 7.7) * 2 - 1; a[i * 4 + 1] = vnoise(i * 0.77, 3.3); a[i * 4 + 2] = vnoise(i * 2.13, 1.1) * 2 - 1; a[i * 4 + 3] = 0.8 + vnoise(i * 0.5, 9.9) * 0.6;
    }
    return a;
  }, [N]);
  useLayoutEffect(() => {
    const im = ref.current;
    if (!im) return;
    const o = new THREE.Object3D();
    const H = 60;
    for (let i = 0; i < N; i++) {
      const sx = seeds[i * 4], sy = seeds[i * 4 + 1], sz = seeds[i * 4 + 2], sp = seeds[i * 4 + 3];
      const y = H - (((sy * H + t * 28 * sp) % H) + H) % H;
      o.position.set(center[0] + sx * area + (H - y) * wind, center[1] + y, center[2] + sz * area);
      o.rotation.set(0, 0, wind * 0.9);
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
      <boxGeometry args={[0.02, 0.9, 0.02]} />
      <meshBasicMaterial color="#9fb2b8" transparent opacity={0.2} depthWrite={false} />
    </instancedMesh>
  );
};

export const Spray: React.FC<{ at: [number, number, number]; period?: number; size?: number; phase?: number }> = ({ at, period = 6, size = 1, phase = 0 }) => {
  const { t } = useT();
  const N = 150;
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const im = ref.current;
    if (!im) return;
    const o = new THREE.Object3D();
    const u = (((t + phase) % period) + period) % period / period;
    for (let i = 0; i < N; i++) {
      const a = vnoise(i * 3.1, 0.3) * Math.PI * 2, sp = 0.4 + vnoise(i * 1.7, 5.1);
      const life = Math.max(0, Math.min(1, u * 2.2 - vnoise(i, 2) * 0.4));
      const r = life * 24 * sp * size;
      const up = (Math.sin(life * Math.PI) * 13 * sp + life * 3) * size;
      o.position.set(at[0] + Math.cos(a) * r, at[1] + up, at[2] + Math.sin(a) * r * 0.6);
      const s = (1 - life) * (0.35 + sp * 0.8) * size * (life > 0 ? 1 : 0);
      o.scale.set(s, s, s);
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 4]} />
      <meshBasicMaterial color="#e8f0f0" transparent opacity={0.2} depthWrite={false} />
    </instancedMesh>
  );
};
