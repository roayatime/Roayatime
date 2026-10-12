import React from "react";
import { AbsoluteFill, random } from "remotion";
import { Grain, Rain, Vignette } from "../../components/layers";
import { TEXT_FONT, TITLE_FONT } from "../../fonts";
import { BRAND } from "../theme";
import { EIO, EOUT, ci, useLocal } from "../util";

/** Illustrative top-down chart of Eilean Mor: lighthouse, east and west landings, paths. Not to scale. */
export type ChartP = { highlight?: "east" | "west" | "both"; hlAt?: number; walkAt?: number; waveAt?: number; labelsAt?: number; tag?: string };
export const IslandChart: React.FC<{ p: ChartP }> = ({ p }) => {
  const { s, W, H, D, portrait } = useLocal();
  const sc = portrait ? W / 1000 : H / 760;
  const ox = W / 2 - 500 * sc, oy = portrait ? H * 0.28 : H / 2 - 380 * sc;
  const push = ci(s, [0, D], [1, 1.06], EIO);
  const isl = "M120 400 C 130 300 230 220 360 200 C 470 180 560 150 660 175 C 780 205 880 270 900 360 C 915 440 860 520 760 560 C 650 605 520 600 400 585 C 270 570 140 520 120 400 Z";
  const LH: [number, number] = [520, 330];
  const EAST: [number, number] = [885, 420];
  const WEST: [number, number] = [135, 430];
  const hl = p.hlAt !== undefined ? ci(s, [p.hlAt, p.hlAt + 0.7], [0, 1], EOUT) : 0;
  const lab = ci(s, [p.labelsAt ?? 0.4, (p.labelsAt ?? 0.4) + 0.8], [0, 1]);
  const walk = p.walkAt !== undefined ? ci(s, [p.walkAt, p.walkAt + 4], [0, 1], EIO) : 0;
  const wave = p.waveAt !== undefined ? ci(s, [p.waveAt, p.waveAt + 1.6, p.waveAt + 4], [0, 1, 0.2], EIO) : 0;
  const westPath: [number, number][] = [LH, [420, 360], [300, 390], [200, 420], WEST];
  const at = (u: number): [number, number] => {
    const seg = Math.min(westPath.length - 2, Math.floor(u * (westPath.length - 1)));
    const k = u * (westPath.length - 1) - seg;
    return [westPath[seg][0] + (westPath[seg + 1][0] - westPath[seg][0]) * k, westPath[seg][1] + (westPath[seg + 1][1] - westPath[seg][1]) * k];
  };
  const L = (txt: string, x: number, y: number, sub?: string, col = BRAND.cream) => (
    <div style={{ position: "absolute", left: ox + x * sc, top: oy + y * sc, transform: "translate(-50%, 0)", direction: "rtl", textAlign: "center", opacity: lab, whiteSpace: "nowrap" }}>
      <div style={{ fontFamily: TEXT_FONT, fontWeight: 700, fontSize: portrait ? 34 : 30, color: col, textShadow: "0 2px 8px rgba(0,0,0,0.9)" }}>{txt}</div>
      {sub ? <div style={{ fontFamily: TEXT_FONT, fontSize: portrait ? 22 : 19, color: BRAND.creamDim }}>{sub}</div> : null}
    </div>
  );
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #0e2a30 0%, #050a0c 80%)" }}>
      <AbsoluteFill style={{ background: "repeating-radial-gradient(circle at 50% 50%, rgba(31,163,176,0.05) 0 2px, rgba(0,0,0,0) 2px 40px)" }} />
      <AbsoluteFill style={{ transformOrigin: "50% 50%", transform: `scale(${push})` }}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <g transform={`translate(${ox} ${oy}) scale(${sc})`}>
            {[60, 36, 16].map((sw, i) => <path key={i} d={isl} fill="none" stroke={`rgba(31,163,176,${0.06 + i * 0.05})`} strokeWidth={sw} />)}
            <path d={isl} fill="#2e3a33" stroke="rgba(200,220,215,0.6)" strokeWidth={2.5} />
            <path d={isl} fill="url(#hatch)" opacity={0.5} />
            <defs>
              <pattern id="hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
                <line x1="0" y1="0" x2="0" y2="14" stroke="rgba(0,0,0,0.35)" strokeWidth="2" />
              </pattern>
            </defs>
            {/* paths from landings to the lighthouse */}
            <path d={`M ${LH[0]} ${LH[1]} L 650 360 L 780 395 L ${EAST[0]} ${EAST[1]}`} fill="none" stroke="rgba(244,236,216,0.55)" strokeWidth={4} strokeDasharray="10 8" />
            <path d={`M ${westPath.map((q) => q.join(" ")).join(" L ")}`} fill="none" stroke="rgba(244,236,216,0.55)" strokeWidth={4} strokeDasharray="10 8" />
            {/* landings */}
            {([[EAST, "east"], [WEST, "west"]] as const).map(([q, k]) => {
              const on = p.highlight === k || p.highlight === "both" ? hl : 0;
              return (
                <g key={k}>
                  <circle cx={q[0]} cy={q[1]} r={18 + 30 * on * (0.5 + 0.5 * Math.sin(s * 4))} fill="none" stroke={k === "west" ? BRAND.danger : BRAND.tealBright} strokeWidth={3} opacity={on} />
                  <rect x={q[0] - 12} y={q[1] - 12} width={24} height={24} fill={k === "west" ? BRAND.danger : BRAND.tealBright} />
                </g>
              );
            })}
            {/* lighthouse */}
            <circle cx={LH[0]} cy={LH[1]} r={26} fill={BRAND.lamp} opacity={0.25} />
            <circle cx={LH[0]} cy={LH[1]} r={12} fill={BRAND.lamp} stroke="#1a1a1a" strokeWidth={3} />
            {/* three figures walking toward the west landing (hypothesis illustration) */}
            {p.walkAt !== undefined
              ? [0, 0.06, 0.12].map((d, i) => {
                  const q = at(Math.max(0, walk - d));
                  return <circle key={i} cx={q[0]} cy={q[1] + (i - 1) * 10} r={9} fill={BRAND.cream} opacity={ci(s, [p.walkAt!, p.walkAt! + 0.5], [0, 0.95]) * (1 - ci(wave, [0.6, 1], [0, 1]))} />;
                })
              : null}
            {/* wave surge over the west landing */}
            {wave > 0 ? <ellipse cx={WEST[0] - 40 + 90 * wave} cy={WEST[1]} rx={180 * wave} ry={120 * wave} fill="rgba(220,235,240,0.55)" /> : null}
          </g>
        </svg>
      </AbsoluteFill>
      {L("المنارة", LH[0], LH[1] - 82)}
      {L("مرسى الشرق", EAST[0] - 10, EAST[1] + 30)}
      {L("مرسى الغرب", WEST[0] + 30, WEST[1] + 30, undefined, p.highlight === "west" && hl > 0.5 ? "#f0a18f" : BRAND.cream)}
      <div style={{ position: "absolute", right: portrait ? W * 0.07 : 70, top: portrait ? H * 0.12 : 50, direction: "rtl", textAlign: "right" }}>
        <div style={{ fontFamily: TITLE_FONT, fontWeight: 700, fontSize: portrait ? 56 : 48, color: BRAND.cream, opacity: ci(s, [0, 0.8], [0, 1]) }}>إيلن مور</div>
        <div style={{ fontFamily: TEXT_FONT, fontSize: portrait ? 24 : 20, color: BRAND.creamDim, opacity: ci(s, [0.3, 1.1], [0, 1]) }}>أكبر جزر فلانان</div>
      </div>
      <div style={{ position: "absolute", left: 60, bottom: portrait ? H * 0.3 : 46, fontFamily: TEXT_FONT, fontSize: portrait ? 22 : 17, color: "rgba(244,236,216,0.5)", direction: "rtl" }}>{p.tag ?? "رسم توضيحي · ليس بمقياس رسم"}</div>
      <Vignette strength={0.8} />
      <Grain opacity={0.1} />
    </AbsoluteFill>
  );
};

/** West landing: storm damage reconstruction (box displaced, ropes, bent railings, ~33 m height, ~1 t block). */
export type LandingP = { boxAt?: number; ropesAt?: number; railAt?: number; heightAt?: number; blockAt?: number; surgeAt?: number; storm?: boolean };
export const Landing: React.FC<{ p: LandingP }> = ({ p }) => {
  const { s, W, H, D, portrait } = useLocal();
  const sea = H * (portrait ? 0.78 : 0.8);
  const top = H * (portrait ? 0.3 : 0.22);
  const cl = (x: number) => W * x;
  const push = ci(s, [0, D], [1, 1.06], EIO);
  const surge = p.surgeAt !== undefined ? ci(s, [p.surgeAt, p.surgeAt + 1.4, p.surgeAt + 3.6], [0, 1, 0], EIO) : 0;
  const swell = Math.sin(s * 1.3) * H * 0.008;
  const A = (t?: number) => (t === undefined ? 0 : ci(s, [t, t + 0.8], [0, 1], EOUT));
  const hA = A(p.heightAt), bA = A(p.boxAt), rA = A(p.ropesAt), railA = A(p.railAt), blA = A(p.blockAt);
  const cliff = `M 0 ${H} L 0 ${top} L ${cl(0.18)} ${top + H * 0.02} L ${cl(0.3)} ${top + H * 0.08} L ${cl(0.42)} ${top + H * 0.2} L ${cl(0.5)} ${top + H * 0.32} L ${cl(0.56)} ${sea - H * 0.12} L ${cl(0.62)} ${sea} L ${cl(0.62)} ${H} Z`;
  return (
    <AbsoluteFill style={{ background: p.storm === false ? "#5a666d" : "linear-gradient(180deg, #0b1116 0%, #1d2a33 60%, #0d1418 100%)" }}>
      <AbsoluteFill style={{ transformOrigin: "35% 55%", transform: `scale(${push})` }}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <linearGradient id="rock" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#2c2f2e" />
              <stop offset="1" stopColor="#141617" />
            </linearGradient>
          </defs>
          <path d={cliff} fill="url(#rock)" />
          {/* landing steps cut into the cliff */}
          {Array.from({ length: 9 }).map((_, i) => (
            <rect key={i} x={cl(0.3) + i * cl(0.028)} y={top + H * 0.08 + i * ((sea - top - H * 0.14) / 9)} width={cl(0.04)} height={8} fill="#6b6f6c" />
          ))}
          {/* railings: straight in the upper part, twisted where the sea reached */}
          <path d={`M ${cl(0.2)} ${top - 20} L ${cl(0.32)} ${top + H * 0.04}`} stroke="#9aa0a0" strokeWidth={5} fill="none" />
          <path d={`M ${cl(0.32)} ${top + H * 0.04} Q ${cl(0.36)} ${top + H * 0.02 - 40 * railA} ${cl(0.39)} ${top + H * 0.16} T ${cl(0.44)} ${top + H * 0.2 + 30 * railA}`} stroke={railA > 0.3 ? "#c8553d" : "#9aa0a0"} strokeWidth={5} fill="none" />
          {/* crane on the upper platform */}
          <g stroke="#3b3f40" strokeWidth={6} fill="none">
            <line x1={cl(0.12)} y1={top} x2={cl(0.12)} y2={top - H * 0.12} />
            <line x1={cl(0.12)} y1={top - H * 0.12} x2={cl(0.26)} y2={top - H * 0.05} />
          </g>
          {/* rope box: original position (dashed) and displaced position */}
          <rect x={cl(0.2)} y={top - 50} width={90} height={50} fill="none" stroke="rgba(244,236,216,0.7)" strokeWidth={3} strokeDasharray="8 6" opacity={bA} />
          <g transform={`translate(${cl(0.2) + bA * cl(0.16)} ${top - 50 + bA * H * 0.12}) rotate(${bA * 28})`}>
            <rect width={90} height={50} fill="#6b4a2a" stroke="#2a1a0c" strokeWidth={3} />
          </g>
          {/* scattered ropes */}
          {Array.from({ length: 5 }).map((_, i) => (
            <path key={i} d={`M ${cl(0.33 + i * 0.03)} ${top + H * (0.1 + i * 0.04)} q ${30 + random(`r${i}`) * 40} ${-20} ${60} ${10} t ${50} ${-6}`} stroke="#b59a6a" strokeWidth={4} fill="none" opacity={rA} />
          ))}
          {/* the ~1 tonne block */}
          <rect x={cl(0.44) - blA * 20} y={top + H * 0.22} width={70} height={52} fill="#55595a" stroke="#222" strokeWidth={3} opacity={blA > 0 ? 1 : 0.85} />
          {/* sea */}
          <path d={`M ${cl(0.5)} ${sea + swell} Q ${cl(0.75)} ${sea - 10 + swell} ${W} ${sea + swell} L ${W} ${H} L ${cl(0.5)} ${H} Z`} fill="#0f1a20" />
          {/* surge climbing the cliff */}
          
          {/* height marker */}
          <g opacity={hA}>
            <line x1={cl(0.66)} y1={sea} x2={cl(0.66)} y2={sea - (sea - top - H * 0.04) * hA} stroke={BRAND.lamp} strokeWidth={3} />
            <line x1={cl(0.64)} y1={sea} x2={cl(0.68)} y2={sea} stroke={BRAND.lamp} strokeWidth={3} />
            <line x1={cl(0.64)} y1={top + H * 0.04} x2={cl(0.68)} y2={top + H * 0.04} stroke={BRAND.lamp} strokeWidth={3} opacity={ci(hA, [0.9, 1], [0, 1])} />
          </g>
        </svg>
      </AbsoluteFill>
      {surge > 0 ? (
        <AbsoluteFill style={{ background: `radial-gradient(ellipse ${W * 0.32}px ${(sea - top) * 0.7 * surge + 40}px at ${cl(0.5)}px ${sea}px, rgba(225,236,240,${0.6 * surge}) 0%, rgba(200,215,222,${0.3 * surge}) 45%, rgba(0,0,0,0) 75%)` }} />
      ) : null}
      {p.storm !== false ? <Rain count={110} opacity={0.18} angle={20} /> : null}
      <div style={{ position: "absolute", left: cl(0.7), top: (top + sea) / 2 - 40, direction: "rtl", opacity: hA, fontFamily: TEXT_FONT, color: BRAND.cream, textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}>
        <div style={{ fontFamily: TITLE_FONT, fontWeight: 700, fontSize: portrait ? 64 : 58, color: BRAND.lamp }}>≈ ٣٣ متر</div>
        <div style={{ fontSize: portrait ? 26 : 22 }}>فوق مستوى سطح البحر</div>
      </div>
      {blA > 0 ? <div style={{ position: "absolute", left: cl(0.44) - 40, top: top + H * 0.3 + 4, direction: "rtl", opacity: blA, fontFamily: TEXT_FONT, fontWeight: 600, fontSize: portrait ? 28 : 24, color: BRAND.cream, textShadow: "0 2px 8px rgba(0,0,0,0.9)" }}>كتلة حجرية ≈ طن</div> : null}
      <div style={{ position: "absolute", right: portrait ? W * 0.07 : 70, top: portrait ? H * 0.12 : 50, direction: "rtl", textAlign: "right" }}>
        <div style={{ fontFamily: TITLE_FONT, fontWeight: 700, fontSize: portrait ? 52 : 44, color: BRAND.cream }}>مرسى الغرب</div>
        <div style={{ fontFamily: TEXT_FONT, fontSize: portrait ? 22 : 19, color: BRAND.creamDim }}>إعادة بناء توضيحية للأضرار الموصوفة في التقرير</div>
      </div>
      <Vignette strength={0.82} />
      <Grain opacity={0.12} />
    </AbsoluteFill>
  );
};
