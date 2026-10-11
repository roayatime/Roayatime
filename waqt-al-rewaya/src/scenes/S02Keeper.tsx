import React from "react";
import { AbsoluteFill, Easing, random } from "remotion";
import { Rain, Vignette, clampI } from "../components/layers";
import { KeeperSilhouette } from "../components/scenery";
import { Camera, SceneProps, useScene } from "./common";

/** Rotating dioptric lens (stylized), drawn as a cylinder with prism rings and bullseye panels. */
const Lens: React.FC<{ cx: number; cy: number; w: number; h: number; t: number; glow: number }> = ({ cx, cy, w, h, t, glow }) => {
  const rot = t * 0.55;
  const top = cy - h / 2;
  const belt = h * 0.3;
  const rings = 9;
  const ringEls = [];
  for (let side = 0; side < 2; side++) {
    for (let i = 0; i < rings; i++) {
      const y = side === 0 ? top + h * 0.06 + (i * (h / 2 - belt / 2 - h * 0.06)) / rings : cy + belt / 2 + ((i + 1) * (h / 2 - belt / 2 - h * 0.06)) / rings;
      const sheen = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(rot * 3 + i * 0.9 + side * 2));
      ringEls.push(
        <path
          key={`${side}-${i}`}
          d={`M ${cx - w / 2} ${y} Q ${cx} ${y + h * 0.025} ${cx + w / 2} ${y}`}
          stroke={`rgba(255,${200 + i * 4},${140 + i * 6},${sheen})`}
          strokeWidth={h * 0.012}
          fill="none"
        />,
      );
    }
  }
  const panels = [];
  for (let k = 0; k < 4; k++) {
    const phi = rot + (k * Math.PI) / 2;
    const facing = Math.cos(phi);
    if (facing <= 0) continue;
    const px = cx + (w / 2) * Math.sin(phi) * 0.92;
    const r = belt * 0.42;
    panels.push(
      <g key={k} opacity={facing}>
        {[1, 0.75, 0.5, 0.28].map((m, j) => (
          <ellipse key={j} cx={px} cy={cy} rx={r * m * facing} ry={r * m} fill="none" stroke={`rgba(255,226,170,${0.35 + j * 0.12})`} strokeWidth={2} />
        ))}
        <ellipse cx={px} cy={cy} rx={r * 0.3 * facing} ry={r * 0.3} fill="url(#lens-core)" opacity={0.5 + facing * 0.5} />
      </g>,
    );
    // panel seam
    const sx = cx + (w / 2) * Math.sin(phi + Math.PI / 4);
    if (Math.cos(phi + Math.PI / 4) > 0) {
      panels.push(<line key={`s${k}`} x1={sx} y1={top} x2={sx} y2={top + h} stroke="rgba(40,28,12,0.8)" strokeWidth={3} />);
    }
  }
  return (
    <g>
      <defs>
        <linearGradient id="lens-body" x1="0" x2="1">
          <stop offset="0" stopColor="#120c06" />
          <stop offset="0.5" stopColor={`rgba(${150 + 80 * glow},${100 + 60 * glow},${40 + 30 * glow},1)`} />
          <stop offset="1" stopColor="#120c06" />
        </linearGradient>
        <radialGradient id="lens-core">
          <stop offset="0" stopColor="#fff8e6" />
          <stop offset="1" stopColor="rgba(255,210,140,0)" />
        </radialGradient>
        <radialGradient id="lens-bloom">
          <stop offset="0" stopColor="rgba(255,220,160,0.55)" />
          <stop offset="1" stopColor="rgba(255,200,130,0)" />
        </radialGradient>
      </defs>
      <ellipse cx={cx} cy={cy} rx={w * 1.6} ry={h * 0.9} fill="url(#lens-bloom)" opacity={glow} />
      <rect x={cx - w / 2} y={top} width={w} height={h} fill="url(#lens-body)" opacity={0.9} />
      {ringEls}
      <rect x={cx - w / 2} y={cy - belt / 2} width={w} height={belt} fill="rgba(255,210,140,0.12)" />
      {panels}
      <rect x={cx - w * 0.56} y={top - h * 0.04} width={w * 1.12} height={h * 0.05} fill="#24190c" />
      <rect x={cx - w * 0.56} y={top + h - h * 0.01} width={w * 1.12} height={h * 0.06} fill="#24190c" />
      <rect x={cx - w * 0.3} y={top + h + h * 0.05} width={w * 0.6} height={h * 0.5} fill="#120d07" />
    </g>
  );
};

/** Scene B1: a keeper's night watch inside the lantern room (reconstruction). */
export const S02Keeper: React.FC<SceneProps> = ({ t0, dur }) => {
  const { s, W, H, portrait } = useScene(t0);
  const flicker = 0.9 + 0.1 * Math.sin(s * 11) * random(`fl${Math.floor(s * 8)}`);
  const lens = portrait ? { cx: W * 0.6, cy: H * 0.42, w: W * 0.42, h: H * 0.36 } : { cx: W * 0.6, cy: H * 0.47, w: W * 0.2, h: H * 0.58 };
  const keeper = portrait ? { x: W * 0.02, y: H * 0.36, scale: (H * 0.6) / 590 } : { x: W * 0.24, y: H * 0.2, scale: (H * 0.86) / 590 };
  const push = clampI(s, [0, dur], [1.0, 1.08], Easing.inOut(Easing.sin));
  const truck = clampI(s, [0, dur], [portrait ? 20 : 40, 0], Easing.inOut(Easing.sin));
  const mullions = portrait ? 4 : 7;

  return (
    <AbsoluteFill style={{ background: "#040507" }}>
      <Camera scale={push} x={truck} originX={lens.cx} originY={lens.cy}>
        {/* storm through the glazing */}
        <AbsoluteFill style={{ background: "linear-gradient(180deg, #06090d 0%, #0e151c 60%, #080a0c 100%)" }} />
        <Rain count={portrait ? 90 : 120} opacity={0.22} angle={18} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: mullions + 1 }).map((_, i) => (
            <rect key={i} x={(i * W) / mullions - 9} y={0} width={18} height={H} fill="#07080a" />
          ))}
          <rect x={0} y={H * 0.12} width={W} height={14} fill="#07080a" />
          {Array.from({ length: mullions }).map((_, i) => (
            <line key={`d${i}`} x1={(i * W) / mullions} y1={H * 0.12} x2={((i + 1) * W) / mullions} y2={H * 0.78} stroke="#07080a" strokeWidth={6} opacity={0.8} />
          ))}
          {/* reflections of the flame on the glass */}
          <rect x={0} y={0} width={W} height={H} fill="rgba(255,190,110,0.05)" />
          {/* floor / pedestal area */}
          <rect x={0} y={H * 0.78} width={W} height={H * 0.22} fill="#0a0806" />
          <rect x={0} y={H * 0.78} width={W} height={6} fill="#1d150c" />
          <Lens cx={lens.cx} cy={lens.cy} w={lens.w} h={lens.h} t={s} glow={flicker} />
          <KeeperSilhouette x={keeper.x} y={keeper.y} scale={keeper.scale} rim={flicker} />
        </svg>
        {/* warm spill */}
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse ${W * 0.5}px ${H * 0.6}px at ${lens.cx}px ${lens.cy}px, rgba(255,190,110,${0.16 * flicker}), rgba(0,0,0,0) 70%)`,
            mixBlendMode: "screen",
          }}
        />
      </Camera>
      <Vignette strength={0.85} />
    </AbsoluteFill>
  );
};
