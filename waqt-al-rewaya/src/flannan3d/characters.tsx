import React, { useMemo } from "react";
import * as THREE from "three";

/* ================================================================== */
/* Stylised, semi-realistic period characters built from primitives.  */
/* Faces are deliberately generic: these are illustrative figures,    */
/* NOT likenesses of the real keepers (no photographs are reproduced). */
/* Every pose value is computed from the Remotion clock by the caller. */
/* ================================================================== */

export type Look = {
  height?: number; // metres
  build?: number; // 0.9 slim .. 1.15 heavy
  skin?: string;
  hair?: string;
  beard?: "full" | "moustache" | "none" | "grey";
  hat?: "peaked" | "flat" | "bowler" | "captain" | "none";
  coat?: "uniform" | "oilskin" | "tweed" | "shirt" | "frock" | "sailor";
  coatColor?: string;
  trousers?: string;
};

export const CAST: Record<string, Look> = {
  // Principal keeper: full dark beard, keeper's uniform + peaked cap
  ducat: { height: 1.8, build: 1.06, skin: "#c99a7c", hair: "#2b2018", beard: "full", hat: "peaked", coat: "uniform", coatColor: "#1d2433", trousers: "#1a1e28" },
  // Assistant keeper: younger, moustache, uniform
  marshall: { height: 1.76, build: 0.96, skin: "#d4a688", hair: "#5a3b22", beard: "moustache", hat: "peaked", coat: "uniform", coatColor: "#222a3a", trousers: "#1c2130" },
  // Occasional keeper from Lewis: tweed jacket + flat cap, beard
  macarthur: { height: 1.78, build: 1.1, skin: "#c79579", hair: "#3c2a1c", beard: "full", hat: "flat", coat: "tweed", coatColor: "#5b5240", trousers: "#2e2a24" },
  // Same man, without his outdoor coat (shirt sleeves + waistcoat)
  macarthurShirt: { height: 1.78, build: 1.1, skin: "#c79579", hair: "#3c2a1c", beard: "full", hat: "flat", coat: "shirt", coatColor: "#d8d2c2", trousers: "#2e2a24" },
  ducatOilskin: { height: 1.8, build: 1.06, skin: "#c99a7c", hair: "#2b2018", beard: "full", hat: "peaked", coat: "oilskin", coatColor: "#2a2a22", trousers: "#1a1e28" },
  marshallOilskin: { height: 1.76, build: 0.96, skin: "#d4a688", hair: "#5a3b22", beard: "moustache", hat: "peaked", coat: "oilskin", coatColor: "#2d2c24", trousers: "#1c2130" },
  // Relief keeper
  moore: { height: 1.74, build: 1.0, skin: "#d1a184", hair: "#4a3424", beard: "none", hat: "peaked", coat: "uniform", coatColor: "#1f2738", trousers: "#1b2030" },
  // Superintendent
  muirhead: { height: 1.77, build: 1.08, skin: "#d2a58a", hair: "#9a958c", beard: "grey", hat: "bowler", coat: "frock", coatColor: "#26262a", trousers: "#29292d" },
  harvie: { height: 1.79, build: 1.08, skin: "#c5977a", hair: "#5b4a3a", beard: "full", hat: "captain", coat: "uniform", coatColor: "#151b29", trousers: "#151a24" },
  sailor: { height: 1.75, build: 1.0, skin: "#c99c80", hair: "#3a2a1e", beard: "moustache", hat: "flat", coat: "sailor", coatColor: "#25303f", trousers: "#2a2f38" },
  sailor2: { height: 1.72, build: 1.04, skin: "#bd8f72", hair: "#2a1e14", beard: "full", hat: "none", coat: "sailor", coatColor: "#3a3f45", trousers: "#2b2b2b" },
  shorewatch: { height: 1.74, build: 1.0, skin: "#c9a084", hair: "#4a3a2a", beard: "moustache", hat: "flat", coat: "tweed", coatColor: "#4a4537", trousers: "#2e2a24" },
};

/** Joint angles in radians. Unspecified = rest pose. */
export type Pose = {
  walk?: number; // walk-cycle phase (radians); amplitude via stride
  stride?: number; // 0 = standing .. 1 = full stride
  armL?: [number, number, number]; // shoulder pitch, shoulder roll, elbow bend
  armR?: [number, number, number];
  head?: [number, number]; // yaw, pitch
  lean?: number; // torso pitch forward
  crouch?: number; // knee bend 0..1
  sit?: number; // 0..1
};

const mat = (c: string, r = 0.85) => new THREE.MeshStandardMaterial({ color: c, roughness: r });

const Limb: React.FC<{ len: number; r0: number; r1: number; m: THREE.Material }> = ({ len, r0, r1, m }) => (
  <mesh position={[0, -len / 2, 0]} material={m} castShadow>
    <cylinderGeometry args={[r0, r1, len, 10]} />
  </mesh>
);

/** A keeper / sailor figure. Origin at the feet, facing +Z. */
export const Person: React.FC<{ look: Look; pose?: Pose; position?: [number, number, number]; rotY?: number; lantern?: number; prop?: "book" | "cloth" | "rope" | "telescope" | "oilcan" | null }> = ({
  look, pose = {}, position = [0, 0, 0], rotY = 0, lantern = -1, prop = null,
}) => {
  const L = { height: 1.78, build: 1, skin: "#c99a7c", hair: "#2b2018", beard: "none", hat: "none", coat: "uniform", coatColor: "#1d2433", trousers: "#1a1e28", ...look } as Required<Look>;
  const k = L.height / 1.78;
  const b = L.build;
  const M = useMemo(
    () => ({
      skin: mat(L.skin, 0.7),
      hair: mat(L.hair, 0.95),
      coat: mat(L.coatColor, L.coat === "oilskin" ? 0.35 : 0.9),
      trousers: mat(L.trousers, 0.9),
      boots: mat("#141210", 0.6),
      shirt: mat("#d9d3c4", 0.9),
      brass: new THREE.MeshStandardMaterial({ color: "#b8913e", roughness: 0.35, metalness: 0.8 }),
      hat: mat(L.hat === "flat" ? "#4b4436" : "#141720", 0.8),
      eye: mat("#0d0c0b", 0.4),
      beard: mat(L.beard === "grey" ? "#a8a39a" : L.hair, 1),
      lamp: new THREE.MeshStandardMaterial({ color: "#ffe2a8", emissive: new THREE.Color("#ffbf63"), emissiveIntensity: 3 }),
      metal: new THREE.MeshStandardMaterial({ color: "#2a2c2e", roughness: 0.4, metalness: 0.7 }),
      paper: mat("#d8ccb0", 0.9),
      rope: mat("#8c7651", 1),
    }),
    [L.skin, L.hair, L.coatColor, L.trousers, L.hat, L.beard, L.coat],
  );
  const st = pose.stride ?? 0;
  const ph = pose.walk ?? 0;
  const swing = Math.sin(ph) * 0.55 * st;
  const knee = (Math.max(0, Math.sin(ph + Math.PI / 2)) * 0.7 * st);
  const knee2 = (Math.max(0, Math.sin(ph - Math.PI / 2)) * 0.7 * st);
  const bob = Math.abs(Math.cos(ph)) * 0.035 * st;
  const crouch = pose.crouch ?? 0;
  const sit = pose.sit ?? 0;
  const hipY = (0.95 - crouch * 0.25 - sit * 0.45) * k + bob;
  const armL = pose.armL ?? [-swing * 0.8, 0.08, 0.25 + 0.2 * st];
  const armR = pose.armR ?? [swing * 0.8, -0.08, 0.25 + 0.2 * st];
  const coatLong = L.coat === "oilskin" || L.coat === "frock";
  const torsoC = L.coat === "shirt" ? M.shirt : M.coat;
  return (
    <group position={position} rotation={[0, rotY, 0]} scale={[k, k, k]}>
      <group position={[0, hipY / k, 0]}>
        {/* legs */}
        {[-1, 1].map((sd) => {
          const th = sd < 0 ? swing - sit * 1.5 - crouch * 0.6 : -swing - sit * 1.5 - crouch * 0.6;
          const kn = (sd < 0 ? knee : knee2) + sit * 1.5 + crouch * 1.2;
          return (
            <group key={sd} position={[sd * 0.1 * b, 0, 0]} rotation={[th, 0, 0]}>
              <Limb len={0.46} r0={0.075 * b} r1={0.06 * b} m={M.trousers} />
              <group position={[0, -0.46, 0]} rotation={[kn, 0, 0]}>
                <Limb len={0.45} r0={0.058 * b} r1={0.05} m={M.trousers} />
                <mesh position={[0, -0.47, 0.06]} material={M.boots} castShadow>
                  <boxGeometry args={[0.11, 0.08, 0.27]} />
                </mesh>
              </group>
            </group>
          );
        })}
        {/* torso */}
        <group rotation={[pose.lean ?? 0, 0, 0]}>
          <mesh position={[0, 0.3, 0]} material={torsoC} castShadow>
            <cylinderGeometry args={[0.19 * b, 0.17 * b, 0.62, 14]} />
          </mesh>
          {/* coat skirt */}
          <mesh position={[0, coatLong ? -0.18 : 0.0, 0]} material={L.coat === "shirt" ? M.trousers : M.coat} castShadow>
            <cylinderGeometry args={[0.18 * b, coatLong ? 0.27 * b : 0.2 * b, coatLong ? 0.62 : 0.2, 14, 1, true]} />
          </mesh>
          {L.coat === "uniform" ? (
            <>
              {[0.42, 0.3, 0.18, 0.06].map((y, i) => (
                <mesh key={i} position={[0.07, y, 0.17 * b]} material={M.brass}>
                  <sphereGeometry args={[0.014, 6, 4]} />
                </mesh>
              ))}
              {[0.42, 0.3, 0.18, 0.06].map((y, i) => (
                <mesh key={`r${i}`} position={[-0.07, y, 0.17 * b]} material={M.brass}>
                  <sphereGeometry args={[0.014, 6, 4]} />
                </mesh>
              ))}
            </>
          ) : null}
          {L.coat === "shirt" ? (
            <mesh position={[0, 0.3, 0.005]} material={mat("#3a3328", 0.9)}>
              <cylinderGeometry args={[0.195 * b, 0.175 * b, 0.5, 14, 1, true, -0.9, 1.8]} />
            </mesh>
          ) : null}
          {/* arms */}
          {[-1, 1].map((sd) => {
            const a = sd < 0 ? armL : armR;
            return (
              <group key={`a${sd}`} position={[sd * 0.22 * b, 0.56, 0]} rotation={[a[0], 0, sd * (0.08 + a[1] * sd)]}>
                <Limb len={0.32} r0={0.06 * b} r1={0.05 * b} m={torsoC} />
                <group position={[0, -0.32, 0]} rotation={[-a[2], 0, 0]}>
                  <Limb len={0.29} r0={0.05 * b} r1={0.04} m={torsoC} />
                  <mesh position={[0, -0.32, 0]} material={M.skin} castShadow>
                    <sphereGeometry args={[0.045, 8, 6]} />
                  </mesh>
                  {sd > 0 && lantern >= 0 ? (
                    <group position={[0, -0.45, 0]}>
                      <mesh material={M.metal} position={[0, 0.1, 0]}>
                        <cylinderGeometry args={[0.07, 0.08, 0.04, 8]} />
                      </mesh>
                      <mesh material={M.lamp} position={[0, 0, 0]}>
                        <cylinderGeometry args={[0.055, 0.055, 0.14, 8]} />
                      </mesh>
                      {lantern > 0 ? <pointLight color="#ffb35a" intensity={lantern * 6} distance={9} decay={2} /> : null}
                    </group>
                  ) : null}
                  {sd < 0 && prop === "book" ? (
                    <mesh position={[0.05, -0.38, 0.06]} rotation={[0.4, 0, 0]} material={M.paper}>
                      <boxGeometry args={[0.2, 0.03, 0.27]} />
                    </mesh>
                  ) : null}
                  {sd > 0 && prop === "cloth" ? (
                    <mesh position={[0, -0.36, 0.03]} material={M.shirt}>
                      <boxGeometry args={[0.1, 0.12, 0.04]} />
                    </mesh>
                  ) : null}
                  {sd > 0 && prop === "oilcan" ? (
                    <mesh position={[0, -0.4, 0.04]} material={M.metal}>
                      <cylinderGeometry args={[0.06, 0.07, 0.16, 8]} />
                    </mesh>
                  ) : null}
                  {sd > 0 && prop === "telescope" ? (
                    <mesh position={[0, -0.33, 0.25]} rotation={[Math.PI / 2, 0, 0]} material={M.brass}>
                      <cylinderGeometry args={[0.025, 0.035, 0.6, 8]} />
                    </mesh>
                  ) : null}
                  {sd > 0 && prop === "rope" ? (
                    <mesh position={[0, -0.36, 0.08]} rotation={[Math.PI / 2, 0, 0]} material={M.rope}>
                      <torusGeometry args={[0.12, 0.025, 6, 16]} />
                    </mesh>
                  ) : null}
                </group>
              </group>
            );
          })}
          {/* neck + head */}
          <group position={[0, 0.66, 0]} rotation={[pose.head?.[1] ?? 0, pose.head?.[0] ?? 0, 0]}>
            <mesh position={[0, 0.04, 0]} material={M.skin}>
              <cylinderGeometry args={[0.05, 0.055, 0.1, 8]} />
            </mesh>
            {/* collar */}
            <mesh position={[0, 0.0, 0]} material={L.coat === "shirt" ? M.shirt : M.coat}>
              <cylinderGeometry args={[0.08, 0.12, 0.08, 12]} />
            </mesh>
            <group position={[0, 0.2, 0]}>
              <mesh material={M.skin} scale={[0.92, 1.1, 0.98]} castShadow>
                <sphereGeometry args={[0.105, 18, 14]} />
              </mesh>
              {/* nose, brow, eyes, ears */}
              <mesh material={M.skin} position={[0, -0.005, 0.1]} rotation={[Math.PI / 2.4, 0, 0]}>
                <coneGeometry args={[0.018, 0.05, 6]} />
              </mesh>
              {[-1, 1].map((sd) => (
                <mesh key={`e${sd}`} material={M.eye} position={[sd * 0.035, 0.022, 0.088]}>
                  <sphereGeometry args={[0.011, 6, 4]} />
                </mesh>
              ))}
              {[-1, 1].map((sd) => (
                <mesh key={`er${sd}`} material={M.skin} position={[sd * 0.098, 0.0, 0.0]} scale={[0.4, 1, 0.7]}>
                  <sphereGeometry args={[0.028, 6, 5]} />
                </mesh>
              ))}
              {/* hair cap */}
              <mesh material={M.hair} position={[0, 0.03, -0.012]} scale={[0.96, 0.9, 1.0]}>
                <sphereGeometry args={[0.108, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2.1]} />
              </mesh>
              {L.beard === "full" || L.beard === "grey" ? (
                <mesh material={M.beard} position={[0, -0.07, 0.035]} scale={[0.9, 0.85, 0.8]}>
                  <sphereGeometry args={[0.095, 14, 10, 0, Math.PI * 2, Math.PI / 2.3, Math.PI / 1.8]} />
                </mesh>
              ) : null}
              {L.beard !== "none" ? (
                <mesh material={M.beard} position={[0, -0.035, 0.095]} rotation={[0, 0, Math.PI / 2]}>
                  <capsuleGeometry args={[0.012, 0.06, 3, 6]} />
                </mesh>
              ) : null}
              {/* hats */}
              {L.hat === "peaked" || L.hat === "captain" ? (
                <group position={[0, 0.085, 0]}>
                  <mesh material={M.hat}>
                    <cylinderGeometry args={[0.115, 0.108, 0.07, 18]} />
                  </mesh>
                  <mesh material={M.hat} position={[0, 0.04, 0]}>
                    <cylinderGeometry args={[0.13, 0.115, 0.02, 18]} />
                  </mesh>
                  <mesh material={mat("#0b0b0b", 0.3)} position={[0, -0.02, 0.1]} rotation={[0.25, 0, 0]}>
                    <boxGeometry args={[0.16, 0.012, 0.08]} />
                  </mesh>
                  <mesh material={M.brass} position={[0, 0.0, 0.112]}>
                    <boxGeometry args={[0.04, 0.03, 0.01]} />
                  </mesh>
                </group>
              ) : null}
              {L.hat === "flat" ? (
                <group position={[0, 0.075, 0.01]} rotation={[0.12, 0, 0]}>
                  <mesh material={M.hat} scale={[1, 0.38, 1.12]}>
                    <sphereGeometry args={[0.122, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                  </mesh>
                  <mesh material={M.hat} position={[0, 0.0, 0.1]} rotation={[0.1, 0, 0]}>
                    <boxGeometry args={[0.15, 0.012, 0.07]} />
                  </mesh>
                </group>
              ) : null}
              {L.hat === "bowler" ? (
                <group position={[0, 0.08, 0]}>
                  <mesh material={M.hat}>
                    <sphereGeometry args={[0.112, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
                  </mesh>
                  <mesh material={M.hat} position={[0, 0.0, 0]}>
                    <cylinderGeometry args={[0.16, 0.16, 0.012, 20]} />
                  </mesh>
                </group>
              ) : null}
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};

/** Walking along a polyline: returns position, heading and gait phase for time t. */
export const walkPath = (pts: [number, number, number][], t: number, speed = 1.2, t0 = 0) => {
  const seg: number[] = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][2] - pts[i][2]);
    seg.push(d);
    total += d;
  }
  let s = Math.max(0, Math.min(total, (t - t0) * speed));
  const moving = (t - t0) * speed > 0 && (t - t0) * speed < total;
  let i = 0;
  while (i < seg.length - 1 && s > seg[i]) {
    s -= seg[i];
    i++;
  }
  const u = seg[i] > 0 ? Math.min(1, s / seg[i]) : 0;
  const a = pts[i], b = pts[i + 1] ?? pts[i];
  const pos: [number, number, number] = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
  const heading = Math.atan2(b[0] - a[0], b[2] - a[2]);
  return { pos, heading, phase: ((t - t0) * speed * Math.PI) / 0.75, stride: moving ? 1 : 0 };
};
