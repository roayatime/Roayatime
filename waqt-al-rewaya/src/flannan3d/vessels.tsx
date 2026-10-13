import React, { useMemo } from "react";
import * as THREE from "three";
import { waveHeight } from "./environment";

/* ================================================================== */
/* Period steam vessel (generic c.1900 lighthouse tender / steamer),  */
/* rowing boat, and the giant wave used ONLY in the clearly-labelled   */
/* reconstruction of the investigation's hypothesis.                   */
/* ================================================================== */

const m = (c: string, r = 0.7, mt = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: mt });

const hullGeo = (L: number, B: number, D: number) => {
  // lofted hull: elliptical-ish cross sections along the length, pointed bow
  const segL = 24, segR = 12;
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= segL; i++) {
    const u = i / segL; // 0 stern .. 1 bow
    const x = (u - 0.5) * L;
    const beam = B * (u < 0.75 ? Math.pow(Math.sin(Math.min(1, (u + 0.08) / 0.4) * Math.PI / 2), 0.6) : Math.pow(Math.max(0, (1 - u) / 0.25), 0.8));
    const sheer = D + (u > 0.8 ? (u - 0.8) * 3 : 0) + (u < 0.1 ? (0.1 - u) * 2 : 0);
    for (let j = 0; j <= segR; j++) {
      const a = (j / segR) * Math.PI; // 0..pi : starboard deck -> keel -> port deck
      const y = -Math.sin(a) * D * 0.9 + sheer * 0.25;
      const z = Math.cos(a) * beam * 0.5;
      pos.push(x, a === 0 || j === segR ? sheer * 0.25 + 0.6 : y, z);
    }
  }
  for (let i = 0; i < segL; i++)
    for (let j = 0; j < segR; j++) {
      const a = i * (segR + 1) + j, b = a + segR + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
};

export type ShipStyle = { hull: string; band: string; funnel: string; funnelTop: string; house: string };
export const HESPERUS: ShipStyle = { hull: "#16181b", band: "#7a2a22", funnel: "#c9a45c", funnelTop: "#121212", house: "#d8d2c2" };
export const ARCHTOR: ShipStyle = { hull: "#26221e", band: "#3b3a36", funnel: "#2a2a2a", funnelTop: "#111", house: "#8c8478" };

export const FREEBOARD = 2.3; // lift the hull so the deck rides ~3.4 m above the mean surface

/** World position of a point given in ship-local coordinates (x = towards bow, y = up from waterline, z = to port). */
export const shipPoint = (pos: [number, number, number], heading: number, t: number, storm: number, l: [number, number, number]): [number, number, number] => {
  const h = waveHeight(pos[0], pos[2], t, storm) * 0.85 + pos[1] + FREEBOARD;
  const bx = Math.sin(heading), bz = Math.cos(heading);
  const px = -Math.cos(heading), pz = Math.sin(heading);
  return [pos[0] + bx * l[0] + px * l[2], h + l[1], pos[2] + bz * l[0] + pz * l[2]];
};

/** Steamer ~46 m. Bobs with the ocean height at its position. Origin = waterline midship. */
export const Steamer: React.FC<{ style?: ShipStyle; pos: [number, number, number]; heading?: number; t: number; storm?: number; lights?: number; smoke?: number; children?: React.ReactNode }> = ({
  style = HESPERUS, pos, heading = 0, t, storm = 1, lights = 0, smoke = 1, children,
}) => {
  const L = 46, B = 7.5, D = 4.2;
  const hull = useMemo(() => hullGeo(L, B, D), []);
  const M = useMemo(
    () => ({ hull: m(style.hull, 0.6), band: m(style.band, 0.7), funnel: m(style.funnel, 0.6), top: m(style.funnelTop, 0.6), house: m(style.house, 0.8), deck: m("#7a6448", 0.85), mast: m("#3a2e22", 0.8),
      win: new THREE.MeshStandardMaterial({ color: "#1a1a14", emissive: new THREE.Color("#ffc76b"), emissiveIntensity: 0 }), smoke: new THREE.MeshStandardMaterial({ color: "#3a3a3a", transparent: true, opacity: 0.35, depthWrite: false, roughness: 1 }) }),
    [style],
  );
  M.win.emissiveIntensity = lights * 2.5;
  const h = waveHeight(pos[0], pos[2], t, storm);
  const hb = waveHeight(pos[0] + Math.sin(heading) * 18, pos[2] + Math.cos(heading) * 18, t, storm);
  const hs = waveHeight(pos[0] + Math.cos(heading) * 3, pos[2] - Math.sin(heading) * 3, t, storm);
  const pitch = Math.atan2(hb - h, 18) * 0.8;
  const roll = Math.atan2(hs - h, 3) * 0.35;
  return (
    <group position={[pos[0], h * 0.85 + pos[1] + FREEBOARD, pos[2]]} rotation={[0, heading - Math.PI / 2, 0]}>
      <group rotation={[roll, 0, pitch]}>
        <mesh geometry={hull} material={M.hull} castShadow receiveShadow />
        <mesh position={[0, 0.25 * D + 0.05, 0]} material={M.deck} receiveShadow>
          <boxGeometry args={[L * 0.86, 0.15, B * 0.86]} />
        </mesh>
        {/* boot-top band */}
        <mesh position={[0, -0.1, 0]} scale={[1.001, 0.06, 1.001]} material={M.band}>
          <boxGeometry args={[L * 0.82, 4, B * 0.98]} />
        </mesh>
        {/* deckhouse + bridge */}
        <mesh position={[-2, 2.6, 0]} material={M.house} castShadow>
          <boxGeometry args={[11, 2.2, 4.6]} />
        </mesh>
        <mesh position={[2.5, 4.4, 0]} material={M.house} castShadow>
          <boxGeometry args={[3.2, 1.6, 5.2]} />
        </mesh>
        {[-6, -3.5, -1, 1.5].map((x, i) => (
          <mesh key={i} position={[x, 2.8, 2.31]} material={M.win}>
            <planeGeometry args={[0.6, 0.5]} />
          </mesh>
        ))}
        {/* funnel */}
        <mesh position={[-3.5, 6.0, 0]} material={M.funnel} castShadow>
          <cylinderGeometry args={[0.95, 1.05, 5.5, 16]} />
        </mesh>
        <mesh position={[-3.5, 8.9, 0]} material={M.top}>
          <cylinderGeometry args={[0.97, 0.97, 0.6, 16]} />
        </mesh>
        {/* masts + yards */}
        {[14, -15].map((x, i) => (
          <group key={i} position={[x, 1.5, 0]}>
            <mesh position={[0, 8, 0]} material={M.mast} castShadow>
              <cylinderGeometry args={[0.12, 0.2, 16, 8]} />
            </mesh>
            <mesh position={[0, 12, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.mast}>
              <cylinderGeometry args={[0.07, 0.07, 6, 6]} />
            </mesh>
          </group>
        ))}
        {/* stays */}
        {[[14, 23], [-15, -23], [14, -15]].map(([a, b], i) => {
          const len = Math.hypot(b - a, i === 2 ? 0 : 14);
          const ang = i === 2 ? 0 : Math.atan2(-14, b - a);
          return (
            <mesh key={`s${i}`} position={[(a + b) / 2, i === 2 ? 16 : 9.5, 0]} rotation={[0, 0, ang]} material={M.mast}>
              <boxGeometry args={[len, 0.04, 0.04]} />
            </mesh>
          );
        })}
        {/* lifeboat */}
        <mesh position={[-8, 3.9, 2.0]} scale={[1, 0.35, 0.4]} material={M.house}>
          <sphereGeometry args={[2, 12, 8]} />
        </mesh>
        {/* navigation lights */}
        {lights > 0 ? (
          <>
            <pointLight position={[16, 13, 0]} color="#fff3d0" intensity={lights * 40} distance={60} />
            <mesh position={[16, 13, 0]}>
              <sphereGeometry args={[0.25, 8, 6]} />
              <meshBasicMaterial color="#fff6dc" />
            </mesh>
            <mesh position={[3, 4.6, 2.7]}>
              <sphereGeometry args={[0.18, 8, 6]} />
              <meshBasicMaterial color="#3cff7a" />
            </mesh>
            <mesh position={[3, 4.6, -2.7]}>
              <sphereGeometry args={[0.18, 8, 6]} />
              <meshBasicMaterial color="#ff3b30" />
            </mesh>
          </>
        ) : null}
        {/* crew / passengers in ship-local coordinates (rotated so +Z local faces the bow) */}
        <group rotation={[0, Math.PI / 2, 0]}>{children}</group>
        {/* smoke puffs: drift back along the deck with time (deterministic) */}
        {smoke > 0
          ? Array.from({ length: 9 }).map((_, i) => {
              const u = ((t * 0.25 + i / 9) % 1 + 1) % 1;
              return (
                <mesh key={`p${i}`} position={[-3.5 - u * 22, 9.5 + u * 6, Math.sin(i * 1.7) * u * 2]} scale={[1 + u * 4, 1 + u * 3, 1 + u * 4]} material={M.smoke}>
                  <icosahedronGeometry args={[0.8, 0]} />
                </mesh>
              );
            })
          : null}
      </group>
    </group>
  );
};

/** Small rowing boat ~5 m with oars; `row` = stroke phase. */
export const RowBoat: React.FC<{ pos: [number, number, number]; heading?: number; t: number; row?: number; storm?: number; children?: React.ReactNode }> = ({ pos, heading = 0, t, row = 0, storm = 1, children }) => {
  const hull = useMemo(() => hullGeo(5, 1.6, 0.7), []);
  const wood = useMemo(() => m("#6d4c30", 0.8), []);
  const h = waveHeight(pos[0], pos[2], t, storm);
  const tilt = Math.sin(t * 1.3) * 0.06;
  const stroke = Math.sin(row);
  return (
    <group position={[pos[0], h + pos[1] + 0.75, pos[2]]} rotation={[tilt, heading - Math.PI / 2, tilt * 0.6]}>
      <mesh geometry={hull} material={wood} castShadow />
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.3 + stroke * 0.4, 0.4, sd * 1.3]} rotation={[sd * (0.35 + Math.cos(row) * 0.15), stroke * 0.5, 0]} material={wood}>
          <boxGeometry args={[0.08, 0.06, 2.6]} />
        </mesh>
      ))}
      {children}
    </group>
  );
};

/** Giant wave for the HYPOTHESIS reconstruction: a curling sheet that rises and sweeps the landing. */
export const GiantWave: React.FC<{ u: number; at: [number, number, number]; dir?: number; width?: number; height?: number }> = ({ u, at, dir = 0, width = 70, height = 34 }) => {
  const geo = useMemo(() => new THREE.PlaneGeometry(width, 1, 40, 24), [width]);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2b4a50", roughness: 0.25, metalness: 0.05, side: THREE.DoubleSide, transparent: true, opacity: 0.95 }), []);
  const foam = useMemo(() => new THREE.MeshStandardMaterial({ color: "#e4ecec", roughness: 0.9, transparent: true, opacity: 0.85, depthWrite: false }), []);
  // build the curl profile for progress u (0 = flat sea far out, 0.6 = towering crest at the cliff, 1 = collapsed surge)
  const p = geo.attributes.position as THREE.BufferAttribute;
  const rise = Math.sin(Math.min(1, u / 0.62) * Math.PI / 2);
  const crash = Math.max(0, (u - 0.62) / 0.38);
  const H = height * rise * (1 - crash * 0.55);
  const dist = 90 * (1 - Math.min(1, u / 0.62)) - crash * 18;
  for (let iy = 0; iy <= 24; iy++)
    for (let ix = 0; ix <= 40; ix++) {
      const i = iy * 41 + ix;
      const v = iy / 24; // 0 base .. 1 lip
      const xw = (ix / 40 - 0.5) * width;
      const ang = v * (Math.PI * 0.55 + crash * 0.9);
      const R = H * 0.55;
      const y = Math.sin(ang) * R + v * H * 0.5;
      const z = dist - (1 - Math.cos(ang)) * R * 0.8 + Math.sin(xw * 0.08) * 2;
      p.setXYZ(i, xw, y, z);
    }
  p.needsUpdate = true;
  geo.computeVertexNormals();
  return (
    <group position={at} rotation={[0, dir, 0]}>
      <mesh geometry={geo} material={mat} castShadow />
      {Array.from({ length: 60 }).map((_, i) => {
        const x = ((i * 37) % 60) / 60 - 0.5;
        const k = (i % 7) / 7;
        const s = 1.5 + k * 3 + crash * 6;
        return (
          <mesh key={i} position={[x * width, H * (0.85 + k * 0.2) + crash * 8 * k, dist - H * 0.4 - crash * 10 * k]} scale={[s, s * 0.6, s]} material={foam}>
            <icosahedronGeometry args={[1, 0]} />
          </mesh>
        );
      })}
    </group>
  );
};
