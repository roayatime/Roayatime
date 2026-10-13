import React, { useMemo } from "react";
import * as THREE from "three";
import { ISLAND, islandHeight } from "./environment";

/* ================================================================== */
/* Flannan Isles lighthouse station (1899): short stone tower on the   */
/* summit of Eilean Mor, single-storey keepers' buildings attached,    */
/* enclosure wall, east + west landings with stairs and a crane.       */
/* Stylised reconstruction, proportions approximate.                   */
/* ================================================================== */

export const LH = {
  x: ISLAND.summit[0],
  z: ISLAND.summit[1],
  get y() {
    return islandHeight(this.x, this.z);
  },
  towerH: 23,
};
export const lighthouseTop = (): [number, number, number] => [LH.x, LH.y + LH.towerH + 3.2, LH.z];

const stone = () => new THREE.MeshStandardMaterial({ color: "#d9d2c3", roughness: 0.85 });
const slate = () => new THREE.MeshStandardMaterial({ color: "#2f3436", roughness: 0.7 });
const darkMetal = () => new THREE.MeshStandardMaterial({ color: "#1c2023", roughness: 0.5, metalness: 0.6 });

/** Lathe profile of the tower (radius vs height). */
const towerGeo = () => {
  const pts: THREE.Vector2[] = [];
  const H = LH.towerH;
  for (let i = 0; i <= 12; i++) {
    const y = (i / 12) * H;
    pts.push(new THREE.Vector2(3.3 - (y / H) * 0.7, y));
  }
  pts.push(new THREE.Vector2(3.15, H), new THREE.Vector2(3.15, H + 0.5), new THREE.Vector2(0.01, H + 0.5));
  return new THREE.LatheGeometry(pts, 40);
};

/** Pitched-roof building block (local origin at ground centre). */
const House: React.FC<{ w: number; d: number; h: number; pos: [number, number, number]; rot?: number; lit?: number; chimney?: boolean }> = ({ w, d, h, pos, rot = 0, lit = 0, chimney = true }) => {
  const roof = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-d / 2 - 0.3, 0);
    s.lineTo(0, 1.9);
    s.lineTo(d / 2 + 0.3, 0);
    s.lineTo(-d / 2 - 0.3, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: w + 0.4, bevelEnabled: false });
    g.translate(0, 0, -(w + 0.4) / 2);
    g.rotateY(Math.PI / 2);
    return g;
  }, [w, d]);
  const sMat = useMemo(stone, []);
  const rMat = useMemo(slate, []);
  const winMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#11161a", emissive: new THREE.Color("#ffb860"), emissiveIntensity: 0, roughness: 0.3 }), []);
  winMat.emissiveIntensity = lit * 2.2;
  const nWin = Math.max(1, Math.floor(w / 3.2));
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      <mesh position={[0, h / 2, 0]} material={sMat} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
      </mesh>
      <mesh geometry={roof} material={rMat} position={[0, h, 0]} castShadow />
      {chimney ? (
        <mesh position={[w * 0.32, h + 1.6, 0]} material={sMat} castShadow>
          <boxGeometry args={[0.8, 2.2, 0.8]} />
        </mesh>
      ) : null}
      {Array.from({ length: nWin }).map((_, i) => (
        <mesh key={i} position={[-w / 2 + (i + 0.5) * (w / nWin), h * 0.55, d / 2 + 0.02]} material={winMat}>
          <planeGeometry args={[0.9, 1.2]} />
        </mesh>
      ))}
      {Array.from({ length: nWin }).map((_, i) => (
        <mesh key={`b${i}`} position={[-w / 2 + (i + 0.5) * (w / nWin), h * 0.55, -d / 2 - 0.02]} rotation={[0, Math.PI, 0]} material={winMat}>
          <planeGeometry args={[0.9, 1.2]} />
        </mesh>
      ))}
    </group>
  );
};

/** Lantern room + gallery + lamp; `beam` = rotation angle (rad) or null when the light is out. */
export const Lantern: React.FC<{ y: number; beam: number | null; lampOn: number; beamLen?: number }> = ({ y, beam, lampOn, beamLen = 900 }) => {
  const dm = useMemo(darkMetal, []);
  const glass = useMemo(() => new THREE.MeshStandardMaterial({ color: "#a9c4c9", transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.2, depthWrite: false }), []);
  const lamp = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fff2d0", emissive: new THREE.Color("#ffd58a"), emissiveIntensity: 0 }), []);
  lamp.emissiveIntensity = 0.05 + lampOn * 5;
  const beamMat = useMemo(() => {
    // soft cone: additive, fades along length and at the edge (shader, deterministic)
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: { uI: { value: 1 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `uniform float uI; varying vec2 vUv; void main(){ float along = 1.0 - vUv.y; float edge = sin(vUv.x*3.14159*2.0)*0.5+0.5; float a = pow(along, 2.4) * (0.45+0.55*edge) * uI; gl_FragColor = vec4(vec3(1.0,0.9,0.7)*a*0.32, a*0.32); }`,
    });
  }, []);
  beamMat.uniforms.uI.value = lampOn;
  const posts = useMemo(() => Array.from({ length: 24 }).map((_, i) => (i / 24) * Math.PI * 2), []);
  return (
    <group position={[0, y, 0]}>
      {/* gallery deck */}
      <mesh material={dm} position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[3.6, 3.6, 0.3, 40]} />
      </mesh>
      {posts.map((a, i) => (
        <mesh key={i} material={dm} position={[Math.cos(a) * 3.5, 0.75, Math.sin(a) * 3.5]}>
          <cylinderGeometry args={[0.04, 0.04, 1.2, 4]} />
        </mesh>
      ))}
      <mesh material={dm} position={[0, 1.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.5, 0.05, 4, 48]} />
      </mesh>
      {/* lantern base + glazing + dome */}
      <mesh material={dm} position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[2.1, 2.2, 1.0, 24]} />
      </mesh>
      <mesh material={glass} position={[0, 2.6, 0]}>
        <cylinderGeometry args={[2.0, 2.0, 2.6, 16, 1, true]} />
      </mesh>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`m${i}`} material={dm} position={[Math.cos((i / 8) * Math.PI * 2) * 2.0, 2.6, Math.sin((i / 8) * Math.PI * 2) * 2.0]}>
          <boxGeometry args={[0.08, 2.6, 0.08]} />
        </mesh>
      ))}
      <mesh material={dm} position={[0, 3.9, 0]} castShadow>
        <sphereGeometry args={[2.15, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh material={dm} position={[0, 6.2, 0]}>
        <sphereGeometry args={[0.35, 12, 8]} />
      </mesh>
      {/* lamp + lens */}
      <mesh material={lamp} position={[0, 2.5, 0]}>
        <sphereGeometry args={[0.55, 16, 12]} />
      </mesh>
      {lampOn > 0.01 ? <pointLight position={[0, 2.5, 0]} color="#ffd58a" intensity={lampOn * 120} distance={70} decay={2} /> : null}
      {beam !== null && lampOn > 0.01 ? (
        <group rotation={[0, beam, 0]} position={[0, 2.5, 0]}>
          {[0, Math.PI].map((r, i) => (
            <mesh key={i} material={beamMat} rotation={[0, r, -Math.PI / 2]} position={[i === 0 ? beamLen / 2 : -beamLen / 2, 0, 0]}>
              <cylinderGeometry args={[22, 0.4, beamLen, 24, 1, true]} />
            </mesh>
          ))}
        </group>
      ) : null}
    </group>
  );
};

/** Complete station; `lit` = window glow, `lampOn` = 0..1, `beam` = angle or null. */
export const LighthouseStation: React.FC<{ lampOn?: number; beam?: number | null; lit?: number }> = ({ lampOn = 0, beam = null, lit = 0 }) => {
  const g = useMemo(towerGeo, []);
  const sMat = useMemo(stone, []);
  const y0 = LH.y;
  return (
    <group position={[LH.x, y0, LH.z]}>
      {/* plinth to seat the tower into uneven terrain */}
      <mesh material={sMat} position={[0, -1.5, 0]} receiveShadow>
        <cylinderGeometry args={[4.2, 4.6, 3.2, 32]} />
      </mesh>
      <mesh geometry={g} material={sMat} castShadow receiveShadow />
      {/* tower windows */}
      {[6, 12, 18].map((h, i) => (
        <mesh key={i} position={[Math.cos(i * 1.7) * (3.3 - (h / LH.towerH) * 0.7 + 0.01), h, Math.sin(i * 1.7) * (3.3 - (h / LH.towerH) * 0.7 + 0.01)]} rotation={[0, -i * 1.7 + Math.PI / 2, 0]}>
          <planeGeometry args={[0.6, 1.0]} />
          <meshStandardMaterial color="#141a1d" emissive="#ffb860" emissiveIntensity={lit * 1.5} />
        </mesh>
      ))}
      <Lantern y={LH.towerH + 0.5} beam={beam} lampOn={lampOn} />
      {/* keepers' accommodation: two wings around a small yard */}
      <House w={16} d={6} h={4.2} pos={[-12, -1.2, 2]} lit={lit} />
      <House w={10} d={6} h={4.2} pos={[-19, -1.2, -7]} rot={Math.PI / 2} lit={lit} />
      <House w={7} d={5} h={3.4} pos={[8, -0.8, 6]} rot={0.2} lit={lit * 0.4} chimney={false} />
      {/* enclosure wall */}
      <mesh material={sMat} position={[-6, -0.6, 11]} castShadow receiveShadow>
        <boxGeometry args={[34, 1.4, 0.5]} />
      </mesh>
      <mesh material={sMat} position={[-23, -0.6, -2]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[26, 1.4, 0.5]} />
      </mesh>
      <mesh material={sMat} position={[11, -0.6, -2]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[26, 1.4, 0.5]} />
      </mesh>
      {/* gate posts in the south wall (the gate the relief keeper found shut) */}
      {[-1.6, 1.6].map((x, i) => (
        <mesh key={i} material={sMat} position={[x + 4, 0.2, 11]} castShadow>
          <boxGeometry args={[0.7, 2.6, 0.7]} />
        </mesh>
      ))}
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Landings: stone steps climbing the cliff from a sea-level platform, */
/* a crane, rails and the rope/tool box. Positions snap to the coast.  */
/* ------------------------------------------------------------------ */
export const coastPoint = (deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  let last: [number, number] = [0, 0];
  for (let r = 0; r < 420; r += 0.5) {
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (islandHeight(x, z) < 1.5) return last;
    last = [x, z];
  }
  return last;
};
const landingFrame = (deg: number) => {
  const [cx, cz] = coastPoint(deg);
  const l = Math.hypot(cx, cz);
  const n: [number, number] = [-cx / l, -cz / l]; // inland
  const t: [number, number] = [-n[1], n[0]]; // along the coast
  return { cx, cz, n, t };
};
export const LANDINGS = { east: landingFrame(8), west: landingFrame(186) };

/** Points of the stair: a stepped ledge cut diagonally into the cliff face (sea-level platform -> cliff top). */
export const stairPath = (side: "east" | "west", n = 46): [number, number, number][] => {
  const F = LANDINGS[side];
  const at = (d: number, sl: number): [number, number] => [F.cx + F.n[0] * d + F.t[0] * sl, F.cz + F.n[1] * d + F.t[1] * sl];
  const topH = Math.min(islandHeight(...at(70, 0)), islandHeight(...at(70, 20))) - 0.8;
  const out: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const yT = 2.2 + u * (topH - 2.2);
    const sl = (u - 0.15) * 46 * (side === "east" ? 1 : -1);
    let d = 0;
    while (d < 90 && islandHeight(...at(d, sl)) < yT) d += 0.25;
    const q = at(Math.max(0, d - 0.9), sl);
    out.push([q[0], yT, q[1]]);
  }
  // final steps onto the plateau
  for (let k = 1; k <= 4; k++) {
    const last = out[out.length - 1];
    const q: [number, number] = [last[0] + F.n[0] * 2.2, last[2] + F.n[1] * 2.2];
    out.push([q[0], Math.max(last[1], islandHeight(q[0], q[1]) + 0.1), q[1]]);
  }
  return out;
};
/** Path from the top of a landing stair to the station gate. */
export const stationPath = (side: "east" | "west", n = 30): [number, number, number][] => {
  const sp = stairPath(side); const top = sp[sp.length - 1];
  const gate: [number, number] = [LH.x + 4, LH.z + 13];
  const out: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const x = top[0] + (gate[0] - top[0]) * u + Math.sin(u * Math.PI) * 12;
    const z = top[2] + (gate[1] - top[2]) * u;
    out.push([x, islandHeight(x, z) + 0.05, z]);
  }
  return out;
};

export const Landing: React.FC<{ side: "east" | "west"; damage?: number }> = ({ side, damage = 0 }) => {
  const F = LANDINGS[side];
  const sMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#9a958a", roughness: 0.9 }), []);
  const wood = useMemo(() => new THREE.MeshStandardMaterial({ color: "#5a4632", roughness: 0.8 }), []);
  const rail = useMemo(darkMetal, []);
  const steps = useMemo(() => stairPath(side), [side]);
  const yaw = Math.atan2(F.n[0], F.n[1]);
  const px = F.cx - F.n[0] * 3, pz = F.cz - F.n[1] * 3;
  return (
    <group>
      {/* sea-level platform */}
      <mesh material={sMat} position={[px, 1.0, pz]} rotation={[0, yaw, 0]} castShadow receiveShadow>
        <boxGeometry args={[12, 2.2, 9]} />
      </mesh>
      {steps.map((s, i) => {
        const nx = steps[Math.min(i + 1, steps.length - 1)], pv = steps[Math.max(i - 1, 0)];
        const r = Math.atan2(nx[0] - pv[0], nx[2] - pv[2]);
        return (
          <mesh key={i} material={sMat} position={[s[0], s[1] - 0.35, s[2]]} rotation={[0, r, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.4, 0.9, 2.2]} />
          </mesh>
        );
      })}
      {/* iron railing posts (bent / missing where damaged) */}
      {steps.filter((_, i) => i % 3 === 0).map((s, i) => {
        const broken = damage > 0 && i < 7;
        return (
          <mesh key={`r${i}`} material={rail} position={[s[0] + F.t[0] * 1.1, s[1] + 0.6, s[2] + F.t[1] * 1.1]} rotation={[broken ? 0.9 * damage * ((i % 3) - 1) : 0, 0, broken ? 0.7 * damage : 0]}>
            <cylinderGeometry args={[0.04, 0.04, 1.3, 4]} />
          </mesh>
        );
      })}
      {/* crane: mast + jib */}
      <group position={[px + F.t[0] * 3.5, 2.1, pz + F.t[1] * 3.5]} rotation={[damage * 0.25, yaw + 1.2 + damage * 0.9, damage * 0.3]}>
        <mesh material={rail} position={[0, 3, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.25, 6, 8]} />
        </mesh>
        <mesh material={rail} position={[2.6, 5.4, 0]} rotation={[0, 0, -Math.PI / 2.6]} castShadow>
          <cylinderGeometry args={[0.1, 0.12, 7.0, 6]} />
        </mesh>
      </group>
      {/* the wooden box for ropes and tackle (west: torn away in the storm) */}
      <mesh material={wood} position={[px - F.t[0] * 3 - F.n[0] * damage * 6, 2.6 - damage * 1.8, pz - F.t[1] * 3 - F.n[1] * damage * 6]} rotation={[damage * 0.7, yaw + damage * 1.1, damage * 0.4]} castShadow>
        <boxGeometry args={[1.8, 1.1, 1.1]} />
      </mesh>
      {/* ropes strewn over the rocks when damaged */}
      {damage > 0.3
        ? [0, 1, 2, 3].map((i) => (
            <mesh key={`rope${i}`} material={wood} position={[px + F.t[0] * (i * 2 - 3) - F.n[0] * 5, 1.2, pz + F.t[1] * (i * 2 - 3) - F.n[1] * 5]} rotation={[Math.PI / 2, 0, i]}>
              <torusGeometry args={[0.6 + i * 0.15, 0.05, 5, 20, 4.5]} />
            </mesh>
          ))
        : null}
    </group>
  );
};

/** Flagstaff by the station; `flag` 0..1 hoisted (no flag was flying when Hesperus arrived). */
export const Flagstaff: React.FC<{ flag?: number; t?: number }> = ({ flag = 0, t = 0 }) => {
  const rail = useMemo(darkMetal, []);
  const cloth = useMemo(() => new THREE.MeshStandardMaterial({ color: "#a33a30", roughness: 0.9, side: THREE.DoubleSide }), []);
  const y0 = islandHeight(LH.x + 14, LH.z + 9);
  return (
    <group position={[LH.x + 14, y0, LH.z + 9]}>
      <mesh material={rail} position={[0, 5, 0]}>
        <cylinderGeometry args={[0.06, 0.1, 10, 6]} />
      </mesh>
      {flag > 0 ? (
        <mesh material={cloth} position={[0.9, 3 + flag * 6, 0]} rotation={[0, Math.sin(t * 3) * 0.3, 0]}>
          <planeGeometry args={[1.8, 1.1]} />
        </mesh>
      ) : null}
    </group>
  );
};
