import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { useVideoConfig } from "remotion";
import { Atmosphere, CamKey, CameraRig } from "./core";
import { Island, Islets, Lights, MOODS, Mood, Ocean, Rain, Sky, Spray, islandHeight, waveHeight } from "./environment";
import { Flagstaff, Landing, LighthouseStation } from "./lighthouse";
import { Look, Person, Pose } from "./characters";
import { GiantWave, RowBoat, ShipStyle, Steamer } from "./vessels";

/* ================================================================== */
/* One parameterised exterior world for every outdoor shot.            */
/* ================================================================== */

export type Actor = { look: Look; pos: [number, number, number]; rotY?: number; pose?: Pose; lantern?: number; prop?: "book" | "cloth" | "rope" | "telescope" | "oilcan" | null; opacity?: number };
export type ShipSpec = { style: ShipStyle; pos: [number, number, number]; heading: number; lights?: number; smoke?: number; crew?: Actor[] };
export type BoatSpec = { pos: [number, number, number]; heading: number; row: number; crew?: Actor[] };

export type WorldProps = {
  mood: Mood;
  t: number;
  cam: CamKey[];
  storm?: number;
  rain?: number;
  rainAt?: [number, number, number];
  lampOn?: number;
  beam?: number | null;
  lit?: number;
  flag?: number;
  damageWest?: number;
  ships?: ShipSpec[];
  boats?: BoatSpec[];
  actors?: Actor[];
  wave?: { u: number; at: [number, number, number]; dir: number } | null;
  spray?: { at: [number, number, number]; period?: number; size?: number; phase?: number }[];
  flare?: { t0: number; from: [number, number, number] } | null;
  flash?: number; // lightning 0..1
  shadows?: boolean;
  drift?: number;
  shake?: number;
  scale?: number; // internal render scale
  oceanSeg?: number;
  fogScale?: number;
  hideIsland?: boolean;
  mainland?: boolean;
  children?: React.ReactNode;
};

/** Distress rocket: rises, bursts into a hanging light (frame-driven). */
const Flare: React.FC<{ t: number; t0: number; from: [number, number, number] }> = ({ t, t0, from }) => {
  const u = t - t0;
  if (u < 0 || u > 9) return null;
  const rise = Math.min(1, u / 1.6);
  const y = from[1] + rise * 120 - Math.max(0, u - 1.6) * 6;
  const burst = u > 1.6 ? Math.max(0, 1 - (u - 1.6) / 7) : 0;
  const trail = u < 1.8;
  return (
    <group>
      {trail ? (
        <mesh position={[from[0], from[1] + rise * 60, from[2]]} scale={[0.4, rise * 120, 0.4]}>
          <cylinderGeometry args={[0.5, 0.2, 1, 6]} />
          <meshBasicMaterial color="#ffcc88" transparent opacity={0.45} />
        </mesh>
      ) : null}
      <mesh position={[from[0], y, from[2]]}>
        <sphereGeometry args={[0.8 + burst * 2.5, 10, 8]} />
        <meshBasicMaterial color={burst > 0 ? "#ffd2d0" : "#ffe0a0"} />
      </mesh>
      {burst > 0 ? <pointLight position={[from[0], y, from[2]]} color="#ff9a8a" intensity={burst * 9000} distance={900} decay={1.6} /> : null}
    </group>
  );
};

/** Mainland shore (Isle of Lewis, Breasclete shore station) — low rolling coast + small station building. */
const Mainland: React.FC = () => (
  <group position={[0, 0, 0]}>
    <mesh position={[0, -18, 40]} scale={[400, 26, 60]} receiveShadow castShadow>
      <sphereGeometry args={[1, 32, 12]} />
      <meshStandardMaterial color="#4b5240" roughness={1} />
    </mesh>
    <mesh position={[-12, 9.8, 16]} castShadow>
      <boxGeometry args={[8, 4, 5]} />
      <meshStandardMaterial color="#cfc7b6" roughness={0.9} />
    </mesh>
    <mesh position={[-12, 12.6, 16]} rotation={[0, 0, Math.PI / 4]} castShadow>
      <boxGeometry args={[3.6, 3.6, 5.2]} />
      <meshStandardMaterial color="#2f3436" roughness={0.8} />
    </mesh>
    {/* little jetty */}
    <mesh position={[10, 0.6, -6]} castShadow>
      <boxGeometry args={[3, 1.2, 26]} />
      <meshStandardMaterial color="#6a5a46" roughness={0.9} />
    </mesh>
  </group>
);

export const World: React.FC<WorldProps> = (P) => {
  const { width, height } = useVideoConfig();
  const sc = P.scale ?? 1;
  const W = Math.round(width * sc), H = Math.round(height * sc);
  const m = MOODS[P.mood];
  const storm = P.storm ?? 1;
  const lookAt = P.cam[0].look;
  return (
    <div style={{ width, height, background: "#000", overflow: "hidden" }}>
      <div style={{ width: W, height: H, transform: `scale(${1 / sc})`, transformOrigin: "0 0" }}>
        <ThreeCanvas width={W} height={H} shadows={P.shadows ?? false} dpr={1}>
          <Atmosphere color={m.fog} density={m.fogD * (P.fogScale ?? 1)} />
          <CameraRig keys={P.cam} drift={P.drift ?? 0.25} shake={P.shake ?? 0} ground={(x, z) => Math.max(P.hideIsland ? -50 : islandHeight(x, z), waveHeight(x, z, P.t, storm) + 0.6)} />
          <Sky mood={P.mood} flash={P.flash ?? 0} />
          <Lights mood={P.mood} shadows={P.shadows ?? false} target={lookAt} flash={P.flash ?? 0} />
          <Ocean mood={P.mood} storm={storm} seg={P.oceanSeg ?? 180} center={[lookAt[0], lookAt[2]]} />
          {P.hideIsland ? null : (
            <>
              <Island wet={storm > 1.2 ? 0.6 : 0.2} />
              <LighthouseStation lampOn={P.lampOn ?? 0} beam={P.beam ?? null} lit={P.lit ?? 0} />
              <Flagstaff flag={P.flag ?? 0} t={P.t} />
              <Landing side="east" />
              <Landing side="west" damage={P.damageWest ?? 0} />
            </>
          )}
          <Islets />
          {P.mainland ? <Mainland /> : null}
          {(P.ships ?? []).map((s, i) => (
            <Steamer key={i} style={s.style} pos={s.pos} heading={s.heading} t={P.t} storm={storm} lights={s.lights ?? 0} smoke={s.smoke ?? 1}>
              {(s.crew ?? []).map((a, j) => (
                <Person key={j} look={a.look} pose={a.pose} position={a.pos} rotY={a.rotY} lantern={a.lantern} prop={a.prop} />
              ))}
            </Steamer>
          ))}
          {(P.boats ?? []).map((b, i) => (
            <RowBoat key={i} pos={b.pos} heading={b.heading} t={P.t} row={b.row} storm={storm}>
              {(b.crew ?? []).map((a, j) => (
                <Person key={j} look={a.look} pose={a.pose} position={a.pos} rotY={a.rotY} />
              ))}
            </RowBoat>
          ))}
          {(P.actors ?? []).map((a, i) => (
            <Person key={i} look={a.look} pose={a.pose} position={a.pos} rotY={a.rotY} lantern={a.lantern} prop={a.prop} />
          ))}
          {P.wave ? <GiantWave u={P.wave.u} at={P.wave.at} dir={P.wave.dir} /> : null}
          {(P.spray ?? []).map((s, i) => (
            <Spray key={i} at={s.at} period={s.period} size={s.size} phase={s.phase} />
          ))}
          {P.flare ? <Flare t={P.t} t0={P.flare.t0} from={P.flare.from} /> : null}
          {P.rain ? <Rain amount={P.rain} center={P.rainAt ?? [P.cam[0].pos[0], 0, P.cam[0].pos[2]]} area={70} /> : null}
          {P.children}
        </ThreeCanvas>
      </div>
    </div>
  );
};

/** Interior wrapper: canvas + fog-free dark background + camera. */
export const InteriorCanvas: React.FC<{ cam: CamKey[]; children: React.ReactNode; bg?: string; scale?: number; drift?: number; shadows?: boolean }> = ({ cam, children, bg = "#07090b", scale = 1, drift = 0.03, shadows = true }) => {
  const { width, height } = useVideoConfig();
  const W = Math.round(width * scale), H = Math.round(height * scale);
  return (
    <div style={{ width, height, background: "#000", overflow: "hidden" }}>
      <div style={{ width: W, height: H, transform: `scale(${1 / scale})`, transformOrigin: "0 0" }}>
        <ThreeCanvas width={W} height={H} shadows={shadows} dpr={1}>
          <Atmosphere color={bg} density={0.035} />
          <CameraRig keys={cam} drift={drift} near={0.05} far={200} />
          {children}
        </ThreeCanvas>
      </div>
    </div>
  );
};
