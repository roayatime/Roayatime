import React from "react";
import { AbsoluteFill, random } from "remotion";
import { Grain, Rain, TiledImage, Vignette, tex } from "../../components/layers";
import { Lens } from "../../scenes/S02Keeper";
import { TEXT_FONT } from "../../fonts";
import { BRAND } from "../theme";
import { EIO, ci, useLocal } from "../util";

const Room: React.FC<{ floor: number; children: React.ReactNode; push: number; ox?: number; oy?: number; dim?: number }> = ({ floor, children, push, ox = 50, oy = 45, dim = 1 }) => {
  const { W, H } = useLocal();
  return (
    <AbsoluteFill style={{ background: "#1c1c19" }}>
      <AbsoluteFill style={{ transformOrigin: `${ox}% ${oy}%`, transform: `scale(${push})` }}>
        <TiledImage src={tex("plaster.png")} tileW={800} tileH={800} repeatY height={H * floor} />
        <TiledImage src={tex("wood.png")} tileW={900} tileH={450} top={H * floor} height={H * (1 - floor)} repeatY />
        <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(20,22,20,0.35) 0%, rgba(20,22,20,0.15) ${floor * 100 - 1}%, rgba(0,0,0,0.65) ${floor * 100}%, rgba(0,0,0,0.3) 100%)` }} />
        <AbsoluteFill style={{ background: "linear-gradient(105deg, rgba(190,205,210,0.22) 0%, rgba(190,205,210,0.05) 40%, rgba(0,0,0,0.4) 90%)", mixBlendMode: "screen" }} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>{children}</svg>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#000", opacity: 1 - dim }} />
    </AbsoluteFill>
  );
};

/** Kitchen: tidy table, clean dishes, chairs pushed in (reconstruction of the documented tidy state). */
export const Kitchen: React.FC<{ p: { push?: [number, number] } }> = ({ p }) => {
  const { s, W, H, D, portrait } = useLocal();
  const push = ci(s, [0, D], p.push ?? [1, 1.08], EIO);
  const fy = 0.72;
  const tx = portrait ? W * 0.12 : W * 0.3, tw = portrait ? W * 0.76 : W * 0.42, ty = H * 0.58;
  return (
    <AbsoluteFill>
      <Room floor={fy} push={push}>
        {/* window light patch */}
        <rect x={W * 0.06} y={H * 0.14} width={W * 0.12} height={H * 0.3} fill="rgba(170,185,190,0.35)" />
        <rect x={W * 0.06} y={H * 0.29} width={W * 0.12} height={6} fill="#2a2016" />
        <rect x={W * 0.118} y={H * 0.14} width={6} height={H * 0.3} fill="#2a2016" />
        {/* shelf with stacked plates and cups */}
        <rect x={tx} y={H * 0.26} width={tw} height={10} fill="#3b2a18" />
        {Array.from({ length: 6 }).map((_, i) => <ellipse key={i} cx={tx + tw * (0.12 + i * 0.03)} cy={H * 0.26 - 4 - i * 0} rx={tw * 0.06} ry={8} fill="#d8d3c4" stroke="#8b867a" />)}
        {Array.from({ length: 4 }).map((_, i) => <rect key={`c${i}`} x={tx + tw * (0.55 + i * 0.09)} y={H * 0.26 - 34} width={30} height={34} rx={4} fill="#cfc8b5" stroke="#7d7768" />)}
        {/* wall clock */}
        <circle cx={tx + tw * 0.9} cy={H * 0.15} r={H * 0.045} fill="#e6dfcd" stroke="#3b2a18" strokeWidth={6} />
        <line x1={tx + tw * 0.9} y1={H * 0.15} x2={tx + tw * 0.9} y2={H * 0.15 - H * 0.03} stroke="#222" strokeWidth={4} />
        <line x1={tx + tw * 0.9} y1={H * 0.15} x2={tx + tw * 0.9 + H * 0.022} y2={H * 0.15 + 4} stroke="#222" strokeWidth={4} />
        {/* table */}
        <rect x={tx} y={ty} width={tw} height={22} fill="#4a3320" />
        <rect x={tx + 14} y={ty + 22} width={16} height={H * fy - ty + H * 0.06} fill="#3a2716" />
        <rect x={tx + tw - 30} y={ty + 22} width={16} height={H * fy - ty + H * 0.06} fill="#3a2716" />
        {/* a few clean items, neatly placed */}
        <rect x={tx + tw * 0.4} y={ty - 50} width={36} height={50} rx={6} fill="#6d6f6a" />
        <ellipse cx={tx + tw * 0.62} cy={ty - 4} rx={60} ry={9} fill="#d8d3c4" stroke="#8b867a" />
        {/* chairs pushed in */}
        {[0.2, 0.75].map((k, i) => (
          <g key={i} transform={`translate(${tx + tw * k} ${H * fy + H * 0.06})`} fill="#2a1c10">
            <rect x={0} y={-H * 0.3} width={10} height={H * 0.3} />
            <rect x={60} y={-H * 0.3} width={10} height={H * 0.3} />
            <rect x={0} y={-H * 0.3} width={70} height={10} />
            <rect x={-6} y={-H * 0.15} width={82} height={12} />
          </g>
        ))}
      </Room>
      <Vignette strength={0.85} />
      <Grain opacity={0.12} />
    </AbsoluteFill>
  );
};

/** Bedroom: three made, empty beds. */
export const Beds: React.FC<{ p: { push?: [number, number] } }> = ({ p }) => {
  const { s, W, H, D, portrait } = useLocal();
  const push = ci(s, [0, D], p.push ?? [1.0, 1.1], EIO);
  const fy = 0.66;
  const n = 3;
  return (
    <AbsoluteFill>
      <Room floor={fy} push={push} oy={60}>
        {Array.from({ length: n }).map((_, i) => {
          const bw = portrait ? W * 0.28 : W * 0.22;
          const bx = W * 0.5 + (i - 1) * bw * 1.25 - bw / 2;
          const by = H * fy + H * 0.12;
          return (
            <g key={i}>
              <rect x={bx} y={by - H * 0.2} width={8} height={H * 0.2} fill="#141414" />
              <rect x={bx + bw - 8} y={by - H * 0.16} width={8} height={H * 0.16} fill="#141414" />
              <rect x={bx} y={by - H * 0.11} width={bw} height={H * 0.05} rx={6} fill="#bdb6a2" />
              <rect x={bx} y={by - H * 0.09} width={bw} height={H * 0.04} fill="#4d5345" />
              <rect x={bx + 10} y={by - H * 0.125} width={bw * 0.26} height={H * 0.03} rx={10} fill="#d8d2c0" />
              <rect x={bx} y={by - H * 0.06} width={bw} height={6} fill="#141414" />
            </g>
          );
        })}
      </Room>
      <Vignette strength={0.88} />
      <Grain opacity={0.12} />
    </AbsoluteFill>
  );
};

/** Cold hearth: grey ashes, no flame. */
export const Hearth: React.FC<{ p: { push?: [number, number] } }> = ({ p }) => {
  const { s, W, H, D } = useLocal();
  const push = ci(s, [0, D], p.push ?? [1.0, 1.12], EIO);
  const cx = W / 2, by = H * 0.74, fw = Math.min(W * 0.4, H * 0.75), fh = H * 0.42;
  return (
    <AbsoluteFill>
      <Room floor={0.74} push={push} oy={60}>
        <rect x={cx - fw * 0.65} y={by - fh - H * 0.06} width={fw * 1.3} height={H * 0.06} fill="#5b5248" />
        <rect x={cx - fw * 0.6} y={by - fh} width={fw * 1.2} height={fh} fill="#4a433a" />
        <path d={`M ${cx - fw * 0.42} ${by} L ${cx - fw * 0.42} ${by - fh * 0.62} Q ${cx} ${by - fh * 0.92} ${cx + fw * 0.42} ${by - fh * 0.62} L ${cx + fw * 0.42} ${by} Z`} fill="#0b0b0b" />
        {/* cold grey ashes and two charred logs */}
        <ellipse cx={cx} cy={by - 10} rx={fw * 0.33} ry={18} fill="#6e6c68" />
        <rect x={cx - fw * 0.25} y={by - 40} width={fw * 0.36} height={22} rx={10} fill="#1f1d1b" transform={`rotate(-8 ${cx} ${by - 30})`} />
        <rect x={cx - fw * 0.05} y={by - 36} width={fw * 0.3} height={20} rx={10} fill="#262320" transform={`rotate(10 ${cx} ${by - 30})`} />
        {Array.from({ length: 30 }).map((_, i) => <circle key={i} cx={cx + (random(`a${i}`) - 0.5) * fw * 0.6} cy={by - 12 - random(`b${i}`) * 14} r={2 + random(`c${i}`) * 3} fill="#9a9792" opacity={0.6} />)}
      </Room>
      <Vignette strength={0.9} />
      <Grain opacity={0.13} />
    </AbsoluteFill>
  );
};

/** Lantern room by day: lamp cleaned and ready, unlit. */
export const LanternReady: React.FC<{ p: { glow?: number; push?: [number, number]; flashes?: boolean } }> = ({ p }) => {
  const { s, W, H, D, portrait } = useLocal();
  const push = ci(s, [0, D], p.push ?? [1, 1.08], EIO);
  // optional "two flashes every 30 s" demonstration, compressed: flashes at 1.0 s and 2.2 s of each 6 s cycle
  let glow = p.glow ?? 0.12;
  if (p.flashes) {
    const u = s % 6;
    glow = 0.12 + 0.88 * Math.max(ci(u, [0.8, 1.0, 1.3], [0, 1, 0]), ci(u, [2.0, 2.2, 2.5], [0, 1, 0]));
  }
  const lens = portrait ? { cx: W * 0.5, cy: H * 0.42, w: W * 0.5, h: H * 0.34 } : { cx: W * 0.5, cy: H * 0.47, w: W * 0.22, h: H * 0.62 };
  return (
    <AbsoluteFill style={{ background: "#0c1014" }}>
      <AbsoluteFill style={{ transformOrigin: "50% 47%", transform: `scale(${push})` }}>
        <AbsoluteFill style={{ background: p.flashes ? "linear-gradient(180deg, #05070a 0%, #0d141a 60%, #07090b 100%)" : "linear-gradient(180deg, #5d6a72 0%, #8a959a 55%, #4a5257 100%)" }} />
        {p.flashes ? <Rain count={90} opacity={0.18} angle={18} /> : null}
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 8 }).map((_, i) => <rect key={i} x={(i * W) / 7 - 9} y={0} width={18} height={H} fill="#0b0d10" />)}
          <rect x={0} y={H * 0.12} width={W} height={14} fill="#0b0d10" />
          <rect x={0} y={H * 0.8} width={W} height={H * 0.2} fill="#0d0b08" />
          <Lens cx={lens.cx} cy={lens.cy} w={lens.w} h={lens.h} t={p.flashes ? s : 0.4} glow={glow} />
        </svg>
        <AbsoluteFill style={{ background: `radial-gradient(ellipse ${W * 0.5}px ${H * 0.6}px at ${lens.cx}px ${lens.cy}px, rgba(255,200,130,${0.3 * glow}), rgba(0,0,0,0) 70%)`, mixBlendMode: "screen" }} />
      </AbsoluteFill>
      {p.flashes ? (
        <div style={{ position: "absolute", right: portrait ? W * 0.08 : 90, bottom: portrait ? H * 0.36 : 120, direction: "rtl", fontFamily: TEXT_FONT, color: BRAND.cream, textAlign: "right" }}>
          <div style={{ display: "flex", gap: 14, justifyContent: "flex-end", marginBottom: 8 }}>
            {[0, 1].map((k) => {
              const u = s % 6;
              const on = k === 0 ? ci(u, [0.8, 1.0, 1.3], [0, 1, 0]) : ci(u, [2.0, 2.2, 2.5], [0, 1, 0]);
              return <div key={k} style={{ width: 26, height: 26, borderRadius: "50%", background: `rgba(242,194,123,${0.2 + 0.8 * on})`, boxShadow: `0 0 ${24 * on}px rgba(242,194,123,0.9)` }} />;
            })}
          </div>
          <div style={{ fontSize: portrait ? 34 : 28, fontWeight: 600 }}>ومضتين كل ٣٠ ثانية</div>
          <div style={{ fontSize: portrait ? 22 : 18, color: BRAND.creamDim }}>العرض هنا مُسرَّع للتوضيح</div>
        </div>
      ) : null}
      <Vignette strength={0.85} />
      <Grain opacity={0.12} />
    </AbsoluteFill>
  );
};
