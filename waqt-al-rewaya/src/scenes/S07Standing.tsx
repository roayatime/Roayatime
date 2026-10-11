import React from "react";
import { AbsoluteFill, Easing, random } from "remotion";
import { Fog, Sea, Sky, Vignette, clampI } from "../components/layers";
import { Island, Lighthouse, islandTop } from "../components/scenery";
import { Camera, SceneProps, useScene } from "./common";

const Gulls: React.FC<{ t: number; W: number; H: number; n?: number }> = ({ t, W, H, n = 4 }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
    {Array.from({ length: n }).map((_, i) => {
      const x = (random(`gx${i}`) * W + t * (30 + random(`gv${i}`) * 40)) % (W * 1.1);
      const y = H * (0.18 + random(`gy${i}`) * 0.2) + Math.sin(t * 0.8 + i) * 12;
      const size = 10 + random(`gs${i}`) * 10;
      const flap = Math.sin(t * (5 + i) + i) * size * 0.45;
      return (
        <path
          key={i}
          d={`M ${x - size} ${y - flap} Q ${x - size * 0.4} ${y - size * 0.15} ${x} ${y} Q ${x + size * 0.4} ${y - size * 0.15} ${x + size} ${y - flap}`}
          stroke="rgba(40,44,46,0.75)"
          strokeWidth={2}
          fill="none"
        />
      );
    })}
  </svg>
);

/** Scene E2: in grey daylight the lighthouse and the island are exactly as they were. */
export const S07Standing: React.FC<SceneProps> = ({ t0, dur }) => {
  const { s, W, H, portrait } = useScene(t0);
  const horizonY = portrait ? 0.62 : 0.64;
  const g = portrait
    ? { left: -W * 0.3, baseY: H * horizonY + 4, w: W * 1.6, h: H * 0.16 }
    : { left: W * 0.08, baseY: H * horizonY + 4, w: W * 0.84, h: H * 0.26 };
  const lh = { x: g.left + g.w * 0.6, baseY: islandTop(g, 0.6) + 3, size: portrait ? H * 0.17 : H * 0.24 };
  // Starts close on the tower ("المنارة موجودة"), then pulls back to the whole island ("والجزيرة موجودة").
  const zoom = clampI(s, [0, 1.6, dur], [1.6, 1.5, 1.0], Easing.inOut(Easing.cubic));
  return (
    <AbsoluteFill style={{ background: "#7e8689" }}>
      <Camera scale={zoom} originX={lh.x} originY={lh.baseY - lh.size * 0.4}>
        <Sky top="#5d6569" horizon="#a0a6a7" horizonY={horizonY} clouds="clouds_dawn.png" clouds2="clouds_dawn.png" drift={6} cloudOpacity={0.7} />
        <Sea horizonY={horizonY} tint="#6b767a" haze="#a0a6a7" speed={14} brightness={1.0} />
        <Fog y={H * horizonY - H * 0.12} height={H * 0.24} strength={0.45} speed={8} seed={11} />
        <Island g={g} light={0.85} seed="isl7" haze="rgba(160,166,167,0.3)" />
        <Lighthouse l={lh} light={0} day={1} id="lh7" />
      </Camera>
      <Gulls t={s} W={W} H={H} n={portrait ? 3 : 5} />
      <Fog y={H * 0.45} height={H * 0.45} strength={0.35} speed={18} seed={12} />
      <Vignette strength={0.5} />
    </AbsoluteFill>
  );
};
