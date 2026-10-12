import React from "react";
import { AbsoluteFill } from "remotion";
import { Fog, Grain, Vignette } from "../../components/layers";
import { TEXT_FONT, TITLE_FONT } from "../../fonts";
import { BRAND } from "../theme";
import { EOUT, ci, useLocal } from "../util";

/** Respectful silhouette portrait (no photographs of the keepers are used). */
const Bust: React.FC<{ w: number; h: number; cap?: boolean; light: number }> = ({ w, h, cap = true, light }) => (
  <svg width={w} height={h} viewBox="0 0 200 240">
    <defs>
      <radialGradient id="bust-bg" cx="50%" cy="38%" r="65%">
        <stop offset="0" stopColor={`rgba(31,163,176,${0.35 + 0.25 * light})`} />
        <stop offset="1" stopColor="rgba(7,9,11,0)" />
      </radialGradient>
      <linearGradient id="bust-rim" x1="0" x2="1">
        <stop offset="0" stopColor="#050607" />
        <stop offset="0.8" stopColor="#0b0d0f" />
        <stop offset="1" stopColor={`rgba(${120 + 100 * light},${150 + 60 * light},${150 + 40 * light},1)`} />
      </linearGradient>
    </defs>
    <rect width="200" height="240" fill="url(#bust-bg)" />
    <path d="M30 240 C 34 190 60 172 100 170 C 140 172 166 190 170 240 Z" fill="url(#bust-rim)" />
    <rect x="88" y="140" width="24" height="34" fill="url(#bust-rim)" />
    <ellipse cx="100" cy="112" rx="34" ry="40" fill="url(#bust-rim)" />
    {cap ? (
      <>
        <path d="M62 92 Q 100 58 138 92 L 136 98 L 64 98 Z" fill="#060708" />
        <rect x="58" y="94" width="84" height="9" rx="4" fill="#060708" />
        <circle cx="100" cy="86" r="5" fill={`rgba(242,194,123,${0.5 + 0.4 * light})`} />
      </>
    ) : null}
  </svg>
);

export type KeepersP = { people: { name: string; role: string; t: number; cap?: boolean; note?: string; dimAt?: number }[]; title?: string; outAt?: number };
export const Keepers: React.FC<{ p: KeepersP }> = ({ p }) => {
  const { s, W, H, D, portrait } = useLocal();
  const cw = portrait ? W * 0.62 : Math.min(W * 0.26, 470);
  const ch = cw * 1.2;
  const out = p.outAt !== undefined ? ci(s, [p.outAt, p.outAt + 1.5], [1, 0]) : 1;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 30%, #0d2226 0%, ${BRAND.ink} 75%)` }}>
      <AbsoluteFill style={{ opacity: 0.5 }}><Fog y={H * 0.55} height={H * 0.5} strength={0.3} speed={8} /></AbsoluteFill>
      {p.title ? <div style={{ position: "absolute", top: portrait ? H * 0.07 : H * 0.07, left: 0, right: 0, textAlign: "center", direction: "rtl", fontFamily: TEXT_FONT, fontSize: portrait ? 30 : 26, color: BRAND.creamDim, opacity: ci(s, [0, 1], [0, 1]) }}>{p.title}</div> : null}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: portrait ? "column" : "row-reverse", justifyContent: "center", alignItems: "center", gap: portrait ? 18 : W * 0.03 }}>
        {p.people.map((k, i) => {
          const a = ci(s, [k.t, k.t + 0.9], [0, 1], EOUT) * out;
          const dim = k.dimAt !== undefined ? ci(s, [k.dimAt, k.dimAt + 0.6], [1, 0.35]) : 1;
          const focus = p.people.reduce((acc, q, j) => (s >= q.t ? j : acc), -1) === i ? 1 : 0.6;
          const lit = ci(s, [k.t, k.t + 1.2], [0, 1]) * focus;
          const pw = portrait ? cw * 0.42 : cw;
          return (
            <div key={i} style={{ width: portrait ? W * 0.84 : cw, display: "flex", flexDirection: portrait ? "row-reverse" : "column", alignItems: "center", gap: portrait ? 26 : 10, opacity: a * dim, transform: `translateY(${(1 - a) * 24}px)` }}>
              <div style={{ borderRadius: 14, overflow: "hidden", border: `2px solid rgba(31,163,176,${0.25 + 0.5 * lit})`, boxShadow: "0 18px 40px rgba(0,0,0,0.6)" }}>
                <Bust w={pw} h={portrait ? pw * 1.2 : ch * 0.8} cap={k.cap} light={lit} />
              </div>
              <div style={{ direction: "rtl", textAlign: portrait ? "right" : "center", flex: portrait ? 1 : undefined }}>
                <div style={{ fontFamily: TITLE_FONT, fontWeight: 700, fontSize: portrait ? 54 : 46, color: BRAND.cream }}>{k.name}</div>
                <div style={{ fontFamily: TEXT_FONT, fontWeight: 600, fontSize: portrait ? 28 : 24, color: BRAND.tealBright }}>{k.role}</div>
                {k.note ? <div style={{ fontFamily: TEXT_FONT, fontSize: portrait ? 24 : 20, color: BRAND.creamDim, marginTop: 4 }}>{k.note}</div> : null}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 60, bottom: 46, fontFamily: TEXT_FONT, fontSize: 17, color: "rgba(244,236,216,0.45)", direction: "rtl" }}>صور ظلّية توضيحية · لا تمثّل ملامح حقيقية</div>
      <Vignette strength={0.8} />
      <Grain opacity={0.1} />
      <AbsoluteFill style={{ background: "#000", opacity: ci(s, [D - 0.4, D], [0, 0]) }} />
    </AbsoluteFill>
  );
};

/** Memorial: names appear one by one over a dark sea horizon with a passing beam. */
export const Memorial: React.FC<{ p: { names: { text: string; t: number }[]; lines?: { text: string; t: number }[] } }> = ({ p }) => {
  const { s, H, D, portrait } = useLocal();
  const sweep = (s / 9) % 1;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, #020406 0%, #0b1a1e 62%, #050809 63%, #020304 100%)` }}>
      <AbsoluteFill style={{ background: `linear-gradient(90deg, rgba(0,0,0,0) ${sweep * 140 - 30}%, rgba(255,236,200,0.08) ${sweep * 140 - 10}%, rgba(0,0,0,0) ${sweep * 140 + 10}%)` }} />
      <AbsoluteFill style={{ opacity: 0.6 }}><Fog y={H * 0.5} height={H * 0.3} strength={0.3} speed={6} /></AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", direction: "rtl", flexDirection: "column", gap: portrait ? 26 : 18 }}>
        {p.names.map((nm, i) => {
          const a = ci(s, [nm.t, nm.t + 1.1], [0, 1], EOUT);
          return <div key={i} style={{ fontFamily: TITLE_FONT, fontWeight: 700, fontSize: portrait ? 84 : 78, color: BRAND.cream, opacity: a, letterSpacing: 1, textShadow: "0 4px 22px rgba(0,0,0,0.9)", transform: `translateY(${(1 - a) * 12}px)` }}>{nm.text}</div>;
        })}
        {(p.lines ?? []).map((l, i) => (
          <div key={`l${i}`} style={{ fontFamily: TEXT_FONT, fontSize: portrait ? 34 : 30, color: BRAND.creamDim, opacity: ci(s, [l.t, l.t + 1], [0, 1]), marginTop: 10 }}>{l.text}</div>
        ))}
        <div style={{ fontFamily: TEXT_FONT, fontSize: portrait ? 28 : 24, color: BRAND.tealBright, opacity: ci(s, [p.names[0]?.t ?? 0, (p.names[0]?.t ?? 0) + 1.5], [0, 0.9]), marginTop: 18 }}>منارة جزر فلانان · ديسمبر ١٩٠٠</div>
      </AbsoluteFill>
      <Vignette strength={0.85} />
      <Grain opacity={0.1} />
      <AbsoluteFill style={{ background: "#000", opacity: ci(s, [D - 0.8, D], [0, 0.4]) }} />
    </AbsoluteFill>
  );
};
