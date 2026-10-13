import React, { useMemo } from "react";
import * as THREE from "three";
import { vnoise } from "./core";

/* ================================================================== */
/* Interiors of the station (illustrative reconstructions).           */
/* Room local origin: floor centre. +Z towards camera side.           */
/* ================================================================== */

const m = (c: string, r = 0.85, mt = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: mt });

/** Procedural canvas texture (deterministic) for plaster / boards / paper. */
const useTex = (kind: "boards" | "plaster" | "stone" | "paper", rep: [number, number] = [1, 1]) =>
  useMemo(() => {
    const W = 256, H = 256;
    const data = new Uint8Array(W * H * 4);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        let v = 0;
        if (kind === "boards") {
          const plank = Math.floor(x / 32);
          v = 0.55 + 0.25 * vnoise(plank * 7.1, y * 0.02 + plank) + 0.12 * vnoise(x * 0.5, y * 0.03 + plank * 3) - (x % 32 < 1 ? 0.35 : 0);
        } else if (kind === "plaster") {
          v = 0.82 + 0.1 * vnoise(x * 0.05, y * 0.05) + 0.05 * vnoise(x * 0.3, y * 0.3);
        } else if (kind === "stone") {
          const row = Math.floor(y / 40), off = row % 2 ? 30 : 0;
          const joint = (y % 40 < 2 || (x + off) % 60 < 2) ? 0.45 : 0;
          v = 0.6 + 0.2 * vnoise(x * 0.08 + row * 9, y * 0.08) - joint;
        } else {
          v = 0.9 + 0.06 * vnoise(x * 0.1, y * 0.1) - (y % 18 === 0 ? 0.25 : 0);
        }
        const i = (y * W + x) * 4;
        const c = Math.max(0, Math.min(255, v * 255));
        data[i] = c; data[i + 1] = c; data[i + 2] = c; data[i + 3] = 255;
      }
    const t = new THREE.DataTexture(data, W, H);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rep[0], rep[1]);
    t.needsUpdate = true;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [kind, rep[0], rep[1]]); // eslint-disable-line react-hooks/exhaustive-deps

/** Room shell: floor, three walls, ceiling, window in the back wall. `storm` brightens the window. */
export const Room: React.FC<{ w?: number; d?: number; h?: number; windowAt?: number; windowLight?: number; wallColor?: string; children?: React.ReactNode }> = ({
  w = 6, d = 5, h = 2.9, windowAt = 1.2, windowLight = 0.4, wallColor = "#c9c0aa", children,
}) => {
  const boards = useTex("boards", [w / 2, d / 2]);
  const plaster = useTex("plaster", [2, 1]);
  const floorM = useMemo(() => new THREE.MeshStandardMaterial({ map: boards, color: "#7a5a3c", roughness: 0.8 }), [boards]);
  const wallM = useMemo(() => new THREE.MeshStandardMaterial({ map: plaster, color: wallColor, roughness: 0.95 }), [plaster, wallColor]);
  const beamM = useMemo(() => m("#4a3624", 0.9), []);
  const glassM = useMemo(() => new THREE.MeshStandardMaterial({ color: "#8fa6ad", emissive: new THREE.Color("#7f9aa3"), emissiveIntensity: windowLight, roughness: 0.2 }), [windowLight]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={floorM} receiveShadow>
        <planeGeometry args={[w, d]} />
      </mesh>
      <mesh position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]} material={wallM}>
        <planeGeometry args={[w, d]} />
      </mesh>
      {/* back wall with window opening (built from 4 panels) */}
      <group position={[0, 0, -d / 2]}>
        <mesh position={[(-w / 2 + windowAt - 0.6) / 2, h / 2, 0]} material={wallM} receiveShadow>
          <planeGeometry args={[w / 2 + windowAt - 0.6, h]} />
        </mesh>
        <mesh position={[windowAt + 0.6 + (w / 2 - windowAt - 0.6) / 2, h / 2, 0]} material={wallM} receiveShadow>
          <planeGeometry args={[w / 2 - windowAt - 0.6, h]} />
        </mesh>
        <mesh position={[windowAt, 0.45, 0]} material={wallM}>
          <planeGeometry args={[1.2, 0.9]} />
        </mesh>
        <mesh position={[windowAt, h - 0.4, 0]} material={wallM}>
          <planeGeometry args={[1.2, 0.8]} />
        </mesh>
        <mesh position={[windowAt, 1.45, -0.05]} material={glassM}>
          <planeGeometry args={[1.2, 1.1]} />
        </mesh>
        {[0, 1].map((i) => (
          <mesh key={i} position={[windowAt + (i ? 0 : 0), 1.45, 0.01]} rotation={[0, 0, i ? Math.PI / 2 : 0]} material={beamM}>
            <boxGeometry args={[0.05, i ? 1.2 : 1.1, 0.06]} />
          </mesh>
        ))}
      </group>
      <mesh position={[-w / 2, h / 2, 0]} rotation={[0, Math.PI / 2, 0]} material={wallM} receiveShadow>
        <planeGeometry args={[d, h]} />
      </mesh>
      <mesh position={[w / 2, h / 2, 0]} rotation={[0, -Math.PI / 2, 0]} material={wallM} receiveShadow>
        <planeGeometry args={[d, h]} />
      </mesh>
      {[-1.5, 0, 1.5].map((z, i) => (
        <mesh key={i} position={[0, h - 0.1, z]} material={beamM}>
          <boxGeometry args={[w, 0.18, 0.16]} />
        </mesh>
      ))}
      {/* cool window light */}
      <pointLight position={[windowAt, 1.5, -d / 2 + 0.4]} color="#9fb7c4" intensity={windowLight * 8} distance={8} decay={2} />
      {children}
    </group>
  );
};

export const Chair: React.FC<{ p: [number, number, number]; r?: number; tipped?: number }> = ({ p, r = 0, tipped = 0 }) => {
  const w = useMemo(() => m("#5a3e26", 0.75), []);
  return (
    <group position={p} rotation={[tipped * -Math.PI / 2, r, 0]}>
      <group position={[0, tipped * 0.0, 0]}>
        <mesh position={[0, 0.45, 0]} material={w} castShadow>
          <boxGeometry args={[0.44, 0.04, 0.42]} />
        </mesh>
        {[[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.22, z]} material={w} castShadow>
            <boxGeometry args={[0.04, 0.45, 0.04]} />
          </mesh>
        ))}
        <mesh position={[0, 0.8, -0.19]} material={w} castShadow>
          <boxGeometry args={[0.44, 0.6, 0.04]} />
        </mesh>
      </group>
    </group>
  );
};

/** Kitchen / living room. `legend` = the later embellished version (meal left out, chair overturned). */
export const Kitchen: React.FC<{ legend?: number; fire?: number; lampOn?: number; windowLight?: number; clockHand?: number }> = ({ legend = 0, fire = 0, lampOn = 0.6, windowLight = 0.4, clockHand = 0 }) => {
  const stone = useTex("stone", [2, 1]);
  const stoneM = useMemo(() => new THREE.MeshStandardMaterial({ map: stone, color: "#8c8577", roughness: 0.95 }), [stone]);
  const wood = useMemo(() => m("#6a4a2e", 0.7), []);
  const iron = useMemo(() => m("#1b1c1d", 0.5, 0.6), []);
  const plate = useMemo(() => m("#e6e2d6", 0.3), []);
  const food = useMemo(() => m("#7d5434", 0.9), []);
  const ember = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3a2a22", emissive: new THREE.Color("#ff6a2a"), emissiveIntensity: fire * 3 }), [fire]);
  const lamp = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fff1cc", emissive: new THREE.Color("#ffc46e"), emissiveIntensity: lampOn * 3 }), [lampOn]);
  return (
    <Room w={6.4} d={5.2} windowAt={1.4} windowLight={windowLight}>
      {/* range / fireplace on the left wall */}
      <group position={[-2.85, 0, -0.6]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 1.1, -0.15]} material={stoneM} castShadow receiveShadow>
          <boxGeometry args={[1.9, 2.2, 0.5]} />
        </mesh>
        <mesh position={[0, 0.45, 0.16]} material={iron} castShadow>
          <boxGeometry args={[1.2, 0.9, 0.5]} />
        </mesh>
        <mesh position={[0, 0.38, 0.42]} material={ember}>
          <boxGeometry args={[0.5, 0.28, 0.02]} />
        </mesh>
        <mesh position={[0, 1.6, 0.14]} material={wood}>
          <boxGeometry args={[1.9, 0.08, 0.32]} />
        </mesh>
        {/* kettle */}
        <mesh position={[0.3, 0.98, 0.18]} material={iron}>
          <sphereGeometry args={[0.13, 10, 8]} />
        </mesh>
        {fire > 0.02 ? <pointLight position={[0, 0.5, 0.8]} color="#ff7a35" intensity={fire * 6} distance={5} /> : null}
      </group>
      {/* dresser with plates on the right wall */}
      <group position={[2.9, 0, -0.8]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh position={[0, 0.5, 0]} material={wood} castShadow>
          <boxGeometry args={[1.6, 1.0, 0.5]} />
        </mesh>
        <mesh position={[0, 1.55, -0.15]} material={wood} castShadow>
          <boxGeometry args={[1.6, 1.1, 0.2]} />
        </mesh>
        {[-0.55, -0.2, 0.15, 0.5].map((x, i) => (
          <mesh key={i} position={[x, 1.55, -0.03]} rotation={[0.1, 0, 0]} material={plate}>
            <cylinderGeometry args={[0.13, 0.13, 0.02, 16]} />
          </mesh>
        ))}
      </group>
      {/* wall clock (stopped) */}
      <group position={[-0.9, 2.05, -2.57]}>
        <mesh material={wood}>
          <cylinderGeometry args={[0.2, 0.2, 0.06, 20]} />
        </mesh>
        <mesh position={[0, 0, 0.032]} rotation={[Math.PI / 2, 0, 0]} material={plate}>
          <cylinderGeometry args={[0.17, 0.17, 0.005, 20]} />
        </mesh>
        <mesh position={[0, 0, 0.04]} rotation={[0, 0, clockHand]} material={iron}>
          <boxGeometry args={[0.012, 0.26, 0.004]} />
        </mesh>
        <mesh position={[0, 0, 0.042]} rotation={[0, 0, 1.2]} material={iron}>
          <boxGeometry args={[0.014, 0.18, 0.004]} />
        </mesh>
      </group>
      {/* table + chairs */}
      <group position={[0.2, 0, 0.3]}>
        <mesh position={[0, 0.76, 0]} material={wood} castShadow receiveShadow>
          <boxGeometry args={[1.8, 0.06, 0.95]} />
        </mesh>
        {[[-0.82, -0.4], [0.82, -0.4], [-0.82, 0.4], [0.82, 0.4]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.38, z]} material={wood} castShadow>
            <boxGeometry args={[0.07, 0.76, 0.07]} />
          </mesh>
        ))}
        <Chair p={[-0.45, 0, -0.75]} r={0} />
        <Chair p={[0.45, 0, -0.75]} r={0} />
        <Chair p={[-0.45, 0, 0.75]} r={Math.PI} />
        {/* the legend's overturned chair vs. the tidy truth */}
        <Chair p={[0.45 + legend * 0.5, legend * 0.22, 0.75 + legend * 0.5]} r={Math.PI + legend * 0.6} tipped={legend} />
        {/* oil lamp */}
        <group position={[0, 0.79, 0]}>
          <mesh material={iron} position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.07, 0.09, 0.1, 10]} />
          </mesh>
          <mesh material={lamp} position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.05, 0.06, 0.2, 10]} />
          </mesh>
          {lampOn > 0.02 ? <pointLight position={[0, 0.3, 0]} color="#ffbf6b" intensity={lampOn * 7} distance={7} decay={2} castShadow /> : null}
        </group>
        {/* legend version: meal left on the table */}
        {legend > 0.01
          ? [[-0.5, -0.25], [0.5, -0.25], [-0.5, 0.25]].map(([x, z], i) => (
              <group key={i} position={[x, 0.8, z]} scale={[legend, legend, legend]}>
                <mesh material={plate}>
                  <cylinderGeometry args={[0.14, 0.12, 0.02, 16]} />
                </mesh>
                <mesh material={food} position={[0, 0.03, 0]} scale={[1, 0.4, 1]}>
                  <sphereGeometry args={[0.07, 8, 6]} />
                </mesh>
              </group>
            ))
          : // tidy version: clean plates stacked
            [0, 1, 2].map((i) => (
              <mesh key={i} material={plate} position={[0.55, 0.8 + i * 0.02, 0.1]}>
                <cylinderGeometry args={[0.13, 0.12, 0.018, 16]} />
              </mesh>
            ))}
      </group>
      <ambientLight intensity={0.3} color="#8fa3ad" />
    </Room>
  );
};

/** Bedroom with three empty, unmade-free beds (made beds = keepers had gone out normally). */
export const Bedroom: React.FC<{ lantern?: number; windowLight?: number }> = ({ lantern = 0, windowLight = 0.35 }) => {
  const wood = useMemo(() => m("#5f4329", 0.7), []);
  const linen = useMemo(() => m("#cfc8b5", 0.95), []);
  const blanket = useMemo(() => m("#5b2f2a", 0.95), []);
  return (
    <Room w={6.6} d={5} windowAt={0.2} windowLight={windowLight}>
      {[-2.2, 0, 2.2].map((x, i) => (
        <group key={i} position={[x, 0, -1.4]}>
          <mesh position={[0, 0.3, 0]} material={wood} castShadow>
            <boxGeometry args={[1.0, 0.25, 2.0]} />
          </mesh>
          <mesh position={[0, 0.48, 0.05]} material={blanket} castShadow>
            <boxGeometry args={[0.96, 0.12, 1.75]} />
          </mesh>
          <mesh position={[0, 0.58, -0.8]} material={linen}>
            <boxGeometry args={[0.7, 0.12, 0.3]} />
          </mesh>
          <mesh position={[0, 0.7, -1.0]} material={wood}>
            <boxGeometry args={[1.0, 0.9, 0.06]} />
          </mesh>
        </group>
      ))}
      {lantern > 0 ? <pointLight position={[0, 1.4, 1.3]} color="#ffb35a" intensity={lantern * 6} distance={7} decay={2} /> : null}
      <ambientLight intensity={0.1} color="#8fa3ad" />
    </Room>
  );
};

/** Entrance hall: row of pegs. `coats` = which pegs still hold an oilskin. */
export const CoatHall: React.FC<{ coats?: boolean[]; highlight?: number; windowLight?: number }> = ({ coats = [false, false, true], highlight = -1, windowLight = 0.35 }) => {
  const wood = useMemo(() => m("#5b3f27", 0.7), []);
  const oil = useMemo(() => m("#2c2b21", 0.3), []);
  const boot = useMemo(() => m("#151311", 0.5), []);
  return (
    <Room w={5} d={4} windowAt={-1.2} windowLight={windowLight}>
      <mesh position={[0.6, 1.75, -1.97]} material={wood}>
        <boxGeometry args={[2.6, 0.12, 0.04]} />
      </mesh>
      {coats.map((has, i) => {
        const x = -0.4 + i * 1.0;
        return (
          <group key={i} position={[x, 0, -1.93]}>
            <mesh position={[0, 1.72, 0.06]} rotation={[Math.PI / 2, 0, 0]} material={wood}>
              <cylinderGeometry args={[0.035, 0.03, 0.2, 8]} />
            </mesh>
            {has ? (
              <group position={[0, 1.7, 0.16]}>
                <mesh position={[0, -0.55, 0]} material={oil} castShadow>
                  <cylinderGeometry args={[0.16, 0.3, 1.1, 14, 1, true]} />
                </mesh>
                <mesh position={[0, -0.05, 0]} material={oil}>
                  <sphereGeometry args={[0.17, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                </mesh>
              </group>
            ) : null}
            {has ? (
              <mesh position={[0, 0.15, 0.3]} material={boot} castShadow>
                <boxGeometry args={[0.3, 0.3, 0.28]} />
              </mesh>
            ) : null}
            {highlight === i ? <spotLight position={[0, 2.8, 1.6]} angle={0.35} penumbra={0.7} intensity={18} distance={6} color="#ffd9a0" target-position={[x, 1.2, -1.9]} /> : null}
          </group>
        );
      })}
      <ambientLight intensity={0.3} color="#8fa3ad" />
      <pointLight position={[0.6, 2.4, 1.2]} color="#ffd2a0" intensity={4} distance={7} decay={2} />
    </Room>
  );
};

/** Desk with the station log book and the weather slate. `write` animates a pen line count (0..1). */
export const LogDesk: React.FC<{ write?: number; lampOn?: number }> = ({ write = 0, lampOn = 1 }) => {
  const wood = useMemo(() => m("#5a3d24", 0.6), []);
  const paper = useTex("paper", [1, 1]);
  const pM = useMemo(() => new THREE.MeshStandardMaterial({ map: paper, color: "#e2d6b8", roughness: 0.9 }), [paper]);
  const ink = useMemo(() => m("#1b1a20", 0.6), []);
  const slate = useMemo(() => m("#2a2d30", 0.5), []);
  const chalk = useMemo(() => m("#d7d7d0", 0.9), []);
  const lamp = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fff1cc", emissive: new THREE.Color("#ffc46e"), emissiveIntensity: lampOn * 3 }), [lampOn]);
  const lines = Math.floor(write * 12);
  return (
    <group>
      <mesh position={[0, 0.74, 0]} material={wood} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.06, 0.85]} />
      </mesh>
      <mesh position={[0, 0.36, 0]} material={wood}>
        <boxGeometry args={[1.5, 0.7, 0.75]} />
      </mesh>
      {/* open log book */}
      <group position={[-0.15, 0.78, 0.05]}>
        <mesh position={[-0.17, 0, 0]} rotation={[-Math.PI / 2, 0, 0.04]} material={pM}>
          <planeGeometry args={[0.33, 0.45]} />
        </mesh>
        <mesh position={[0.17, 0, 0]} rotation={[-Math.PI / 2, 0, -0.04]} material={pM}>
          <planeGeometry args={[0.33, 0.45]} />
        </mesh>
        {Array.from({ length: lines }).map((_, i) => (
          <mesh key={i} position={[0.17, 0.002, -0.18 + i * 0.03]} rotation={[-Math.PI / 2, 0, 0]} material={ink}>
            <planeGeometry args={[0.24 - (i % 3) * 0.04, 0.004]} />
          </mesh>
        ))}
      </group>
      {/* slate */}
      <group position={[0.55, 0.79, -0.05]} rotation={[-Math.PI / 2, 0, 0.2]}>
        <mesh material={slate}>
          <boxGeometry args={[0.32, 0.24, 0.015]} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[-0.02, 0.07 - i * 0.045, 0.009]} material={chalk}>
            <planeGeometry args={[0.22 - i * 0.03, 0.005]} />
          </mesh>
        ))}
      </group>
      <group position={[-0.62, 0.77, -0.25]}>
        <mesh material={lamp} position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.05, 0.06, 0.2, 10]} />
        </mesh>
        {lampOn > 0 ? <pointLight position={[0, 0.3, 0.1]} color="#ffbf6b" intensity={lampOn * 5} distance={5} decay={2} castShadow /> : null}
      </group>
    </group>
  );
};

/** Spiral stair inside the tower; `steps` instanced around a central newel. */
export const SpiralStair: React.FC<{ height?: number }> = ({ height = 18 }) => {
  const stoneM = useMemo(() => m("#a49c8c", 0.9), []);
  const iron = useMemo(() => m("#222426", 0.5, 0.6), []);
  const wallTex = useTex("stone", [6, 8]);
  const wallM = useMemo(() => new THREE.MeshStandardMaterial({ map: wallTex, color: "#b9b2a2", roughness: 0.95, side: THREE.BackSide }), [wallTex]);
  const n = Math.round(height / 0.19);
  return (
    <group>
      <mesh position={[0, height / 2, 0]} material={wallM}>
        <cylinderGeometry args={[2.3, 2.3, height + 2, 32, 1, true]} />
      </mesh>
      <mesh position={[0, height / 2, 0]} material={stoneM}>
        <cylinderGeometry args={[0.18, 0.18, height + 2, 12]} />
      </mesh>
      {Array.from({ length: n }).map((_, i) => {
        const a = i * 0.36;
        return (
          <group key={i} position={[0, i * 0.19, 0]} rotation={[0, -a, 0]}>
            <mesh position={[1.15, 0, 0]} material={stoneM} castShadow receiveShadow>
              <boxGeometry args={[2.05, 0.08, 0.5]} />
            </mesh>
            {i % 2 === 0 ? (
              <mesh position={[2.1, 0.45, 0]} material={iron}>
                <cylinderGeometry args={[0.015, 0.015, 0.9, 4]} />
              </mesh>
            ) : null}
          </group>
        );
      })}
    </group>
  );
};

/** Lantern-room interior: lamp burner, rings of a dioptric lens, glazing bars. */
export const LanternRoom: React.FC<{ lampOn?: number; rot?: number; outside?: string }> = ({ lampOn = 0, rot = 0, outside = "#203440" }) => {
  const brass = useMemo(() => new THREE.MeshStandardMaterial({ color: "#a8853c", roughness: 0.3, metalness: 0.85 }), []);
  const glass = useMemo(() => new THREE.MeshStandardMaterial({ color: "#cfe3e6", roughness: 0.02, metalness: 0.1, transparent: true, opacity: 0.35 }), []);
  const flame = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fff3d6", emissive: new THREE.Color("#ffcf80"), emissiveIntensity: 0.05 + lampOn * 6 }), [lampOn]);
  const iron = useMemo(() => m("#1f2224", 0.5, 0.6), []);
  const sky = useMemo(() => new THREE.MeshBasicMaterial({ color: outside, side: THREE.BackSide, fog: false }), [outside]);
  return (
    <group>
      <mesh material={sky}>
        <cylinderGeometry args={[3.2, 3.2, 4, 24, 1, true]} />
      </mesh>
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} material={iron} receiveShadow>
        <circleGeometry args={[3.2, 32]} />
      </mesh>
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 3.0, 1.6, Math.sin(a) * 3.0]} material={iron}>
            <boxGeometry args={[0.07, 3.2, 0.07]} />
          </mesh>
        );
      })}
      {/* pedestal + rotating lens assembly */}
      <mesh position={[0, 0.5, 0]} material={iron} castShadow>
        <cylinderGeometry args={[0.45, 0.6, 1.0, 16]} />
      </mesh>
      <group position={[0, 1.6, 0]} rotation={[0, rot, 0]}>
        {Array.from({ length: 9 }).map((_, i) => {
          const y = (i - 4) * 0.13;
          const r = 0.75 - Math.abs(i - 4) * 0.05;
          return (
            <mesh key={i} position={[0, y, 0]} material={glass}>
              <torusGeometry args={[r, 0.05, 6, 32]} />
            </mesh>
          );
        })}
        {[0, 1, 2, 3].map((i) => (
          <mesh key={`f${i}`} position={[0, 0, 0]} rotation={[0, (i * Math.PI) / 2, 0]} material={brass}>
            <boxGeometry args={[0.04, 1.3, 1.6]} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 1.6, 0]} material={flame}>
        <cylinderGeometry args={[0.08, 0.1, 0.25, 10]} />
      </mesh>
      {lampOn > 0.02 ? <pointLight position={[0, 1.6, 0]} color="#ffd18a" intensity={lampOn * 25} distance={12} decay={2} castShadow /> : null}
      <ambientLight intensity={0.38} color="#9db3bd" />
      <pointLight position={[1.6, 2.2, 1.8]} color="#ffcf90" intensity={6} distance={9} decay={2} />
    </group>
  );
};
