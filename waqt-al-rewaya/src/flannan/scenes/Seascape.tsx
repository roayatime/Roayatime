import React from "react";
import { AbsoluteFill } from "remotion";
import { Fog, Grain, Rain, Sea, Sky, Vignette } from "../../components/layers";
import { Beam, Island, Lighthouse, Ship, islandTop, lanternCenter } from "../../components/scenery";
import { EIO, EOUT, ci, useLocal } from "../util";

type TOD = "night" | "dusk" | "dawn" | "storm" | "day";
const PAL: Record<TOD, { top: string; hor: string; sea: string; haze: string; isl: number; day: number; seaB: number; fog: number }> = {
  night: { top: "#03050a", hor: "#1c2731", sea: "#16212b", haze: "#1c2731", isl: 0.12, day: 0, seaB: 0.5, fog: 0.3 },
  dusk: { top: "#06080d", hor: "#33404a", sea: "#1b2832", haze: "#2c3943", isl: 0.2, day: 0, seaB: 0.62, fog: 0.35 },
  dawn: { top: "#2a3540", hor: "#8d969a", sea: "#4a5861", haze: "#9aa3a6", isl: 0.55, day: 1, seaB: 0.8, fog: 0.55 },
  storm: { top: "#020306", hor: "#151d25", sea: "#121b23", haze: "#151d25", isl: 0.09, day: 0, seaB: 0.45, fog: 0.4 },
  day: { top: "#4e5d66", hor: "#a9b2b4", sea: "#56656d", haze: "#a3abad", isl: 0.75, day: 1, seaB: 0.9, fog: 0.4 },
};

export type SeascapeP = {
  tod?: TOD;
  /** island framing */
  frame?: "far" | "mid" | "near" | "cliff";
  /** lantern: 1 lit, 0 dark; lightOffAt/lightOnAt (s) animate it */
  light?: number; lightOffAt?: number; lightOnAt?: number; ghostLight?: [number, number];
  beam?: boolean;
  ship?: { x0: number; x1: number; size?: number; y?: number };
  whistleAt?: number[]; flareAt?: number[];
  rain?: number; fog?: number; lightning?: number[];
  push?: [number, number]; panX?: [number, number]; fromBlack?: boolean; toBlack?: boolean;
  figures?: number; figuresOutAt?: number;
};

export const Seascape: React.FC<{ p: SeascapeP }> = ({ p }) => {
  const { s, W, H, D, portrait } = useLocal();
  const tod = p.tod ?? "night";
  const P = PAL[tod];
  const horizonY = portrait ? 0.58 : 0.62;
  const fr = p.frame ?? "mid";
  const gL = {
    far: portrait ? { l: 0.3, w: 0.5, h: 0.035 } : { l: 0.56, w: 0.2, h: 0.06 },
    mid: portrait ? { l: 0.06, w: 0.88, h: 0.085 } : { l: 0.47, w: 0.4, h: 0.15 },
    near: portrait ? { l: -0.3, w: 1.6, h: 0.14 } : { l: 0.2, w: 0.66, h: 0.24 },
    cliff: portrait ? { l: -0.5, w: 2.0, h: 0.22 } : { l: -0.05, w: 1.0, h: 0.34 },
  }[fr];
  const g = { left: W * gL.l, baseY: H * horizonY + 4, w: W * gL.w, h: H * gL.h };
  const lh = { x: g.left + g.w * 0.6, baseY: islandTop(g, 0.6) + 3, size: g.h * (fr === "far" ? 0.75 : 0.72) };
  const lc = lanternCenter(lh);
  let light = p.light ?? 1;
  if (p.lightOffAt !== undefined) light = ci(s, [p.lightOffAt, p.lightOffAt + 0.5], [1, 0]) * (1 - 0.6 * (s > p.lightOffAt - 0.6 && s < p.lightOffAt ? Math.abs(Math.sin(s * 47)) : 0));
  if (p.lightOnAt !== undefined) light = ci(s, [p.lightOnAt, p.lightOnAt + 1.2], [0, 1]);
  if (p.ghostLight) light = Math.max(light, ci(s, [p.ghostLight[0], p.ghostLight[0] + 0.8, p.ghostLight[1] - 0.8, p.ghostLight[1]], [0, 0.85, 0.85, 0]));
  const push = ci(s, [0, D], p.push ?? [1, 1.12], EIO);
  const pan = ci(s, [0, D], p.panX ?? [0, 0], EIO);
  let flash = 0;
  for (const t of p.lightning ?? []) flash = Math.max(flash, ci(s, [t, t + 0.05, t + 0.12, t + 0.2, t + 0.5], [0, 0.9, 0.2, 0.6, 0]));
  const ship = p.ship;
  const sx = ship ? W * ci(s, [0, D], [ship.x0, ship.x1], EIO) : 0;
  const L = ship ? W * (ship.size ?? 0.16) : 0;
  const sy = H * horizonY + (ship?.y ?? 0.02) * H;
  const fadeIn = p.fromBlack ? ci(s, [0, 1.5], [1, 0]) : 0;
  const fadeOut = p.toBlack ? ci(s, [D - 1.2, D], [0, 1]) : 0;

  return (
    <AbsoluteFill style={{ background: P.top }}>
      <AbsoluteFill style={{ transformOrigin: `${(lc.x / W) * 100}% ${(lc.y / H) * 100}%`, transform: `translateX(${pan * 0.3}px) scale(${1 + (push - 1) * 0.3})` }}>
        <Sky top={P.top} horizon={P.hor} horizonY={horizonY} drift={tod === "storm" ? 26 : 12} flash={flash} cloudOpacity={tod === "day" || tod === "dawn" ? 0.75 : 1} />
      </AbsoluteFill>
      <AbsoluteFill style={{ transformOrigin: `${(lc.x / W) * 100}% ${(lc.y / H) * 100}%`, transform: `translateX(${pan}px) scale(${push})` }}>
        <Sea horizonY={horizonY} tint={P.sea} haze={P.haze} speed={tod === "storm" ? 44 : 26} brightness={P.seaB} glintX={lc.x} glint={0.3 * light} />
        <Fog y={H * horizonY - H * 0.16} height={H * 0.28} strength={(p.fog ?? P.fog) * 0.9} speed={14} />
        <Island g={g} light={P.isl + 0.06 * light} haze={tod === "dawn" || tod === "day" ? "rgba(150,160,165,0.35)" : "rgba(30,38,46,0.35)"} seed={fr} />
        <Lighthouse l={lh} light={light} day={P.day} id={`lh-${fr}`} />
        {p.beam !== false && light > 0.02 ? (
          <Beam cx={lc.x} cy={lc.y} azimuth={(s / 12) * Math.PI * 2 + 1.1} intensity={0.85 * light} length={portrait ? W * 0.7 : W * 0.42} id={`bm-${fr}`} />
        ) : null}
        {p.figures ? (
          <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
            {Array.from({ length: p.figures }).map((_, i) => {
              const fx = lh.x + (i - 1) * lh.size * 0.18 - lh.size * 0.55;
              const fy = islandTop(g, (fx - g.left) / g.w) + 1;
              const op = p.figuresOutAt !== undefined ? ci(s, [p.figuresOutAt + i * 0.25, p.figuresOutAt + i * 0.25 + 1.2], [1, 0]) : 1;
              const hh = lh.size * 0.16;
              return (
                <g key={i} opacity={op} fill="#050608">
                  <circle cx={fx} cy={fy - hh * 0.86} r={hh * 0.12} />
                  <path d={`M ${fx - hh * 0.16} ${fy - hh * 0.72} L ${fx + hh * 0.16} ${fy - hh * 0.72} L ${fx + hh * 0.13} ${fy} L ${fx - hh * 0.13} ${fy} Z`} />
                </g>
              );
            })}
          </svg>
        ) : null}
        {ship ? <Ship x={sx} y={sy} L={L} t={s} color={P.day ? "#2a3035" : "#0c0f12"} smoke={P.day ? "rgba(120,124,128,0.5)" : "rgba(50,54,58,0.55)"} /> : null}
        {ship
          ? (p.whistleAt ?? []).map((t, i) => {
              const a = ci(s, [t, t + 0.3, t + 2.4], [0, 1, 0]);
              const grow = ci(s, [t, t + 2.4], [0.3, 1.4], EOUT);
              return a > 0 ? (
                <div key={i} style={{ position: "absolute", left: sx + L * 0.48 - L * 0.05 * grow, top: sy - L * 0.075 - L * 0.24 - L * 0.08 * grow, width: L * 0.1 * grow, height: L * 0.08 * grow, borderRadius: "50%", background: "radial-gradient(circle, rgba(235,238,240,0.9), rgba(235,238,240,0) 70%)", opacity: a }} />
              ) : null;
            })
          : null}
        {(p.flareAt ?? []).map((t, i) => {
          const u = ci(s, [t, t + 2.2], [0, 1], EOUT);
          if (s < t || s > t + 6) return null;
          const fx0 = ship ? sx + L * 0.6 : W * 0.3;
          const fx = fx0 + u * W * 0.05;
          const fy = sy - L * 0.2 - u * H * 0.42;
          const glow = ci(s, [t + 1.8, t + 2.4, t + 4.5, t + 6], [0.4, 1, 0.8, 0]);
          return (
            <React.Fragment key={i}>
              <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
                <path d={`M ${fx0} ${sy - L * 0.2} Q ${fx0 + W * 0.01} ${(fy + sy) / 2} ${fx} ${fy}`} stroke="rgba(255,200,170,0.35)" strokeWidth={3} fill="none" opacity={ci(s, [t, t + 1, t + 4], [0, 1, 0])} />
                <circle cx={fx} cy={fy} r={6 + 6 * glow} fill="#ffd2b0" opacity={glow} />
              </svg>
              <AbsoluteFill style={{ background: `radial-gradient(circle ${H * 0.45}px at ${fx}px ${fy}px, rgba(255,90,60,${0.32 * glow}), rgba(0,0,0,0) 70%)`, mixBlendMode: "screen" }} />
            </React.Fragment>
          );
        })}
        <Fog y={H * horizonY - H * 0.04} height={H * 0.3} strength={(p.fog ?? P.fog) * 1.1} speed={24} seed={2} />
      </AbsoluteFill>
      {p.rain ? <Rain count={portrait ? 90 : 130} opacity={0.2 * p.rain} /> : null}
      <Vignette strength={0.8} />
      <Grain opacity={0.12} />
      {fadeIn + fadeOut > 0 ? <AbsoluteFill style={{ background: "black", opacity: Math.max(fadeIn, fadeOut) }} /> : null}
    </AbsoluteFill>
  );
};
