import React from "react";
import { AbsoluteFill } from "remotion";
import { Fog, Grain, Vignette } from "../../components/layers";
import { TEXT_FONT, TITLE_FONT } from "../../fonts";
import { BRAND } from "../theme";
import { EIO, EOUT, ci, useLocal } from "../util";

export type Line = { text: string; t?: number; kind?: "title" | "body" | "accent" | "small" | "strike" };
const BG: Record<string, string> = {
  dark: `radial-gradient(ellipse at 50% 40%, #10262a 0%, ${BRAND.ink} 75%)`,
  teal: `radial-gradient(ellipse at 50% 40%, ${BRAND.tealDeep} 0%, ${BRAND.ink} 80%)`,
  paper: "radial-gradient(ellipse at 50% 45%, #e6dcc2 0%, #b9a77f 100%)",
  black: "#000",
};

const LineEl: React.FC<{ l: Line; s: number; portrait: boolean; paper: boolean }> = ({ l, s, portrait, paper }) => {
  const t = l.t ?? 0;
  const a = ci(s, [t, t + 0.7], [0, 1], EOUT);
  const k = l.kind ?? "body";
  const fs = { title: portrait ? 84 : 80, accent: portrait ? 70 : 62, body: portrait ? 52 : 46, small: portrait ? 34 : 28, strike: portrait ? 50 : 44 }[k];
  const color = paper ? "#2b2215" : k === "accent" ? BRAND.lamp : k === "small" ? BRAND.creamDim : BRAND.cream;
  const strike = k === "strike" ? ci(s, [t + 0.8, t + 1.4], [0, 1], EIO) : 0;
  return (
    <div style={{ position: "relative", opacity: a, transform: `translateY(${(1 - a) * 18}px)`, fontFamily: k === "title" || k === "accent" ? TITLE_FONT : TEXT_FONT, fontWeight: k === "title" || k === "accent" ? 700 : 600, fontSize: fs, color, lineHeight: 1.5, textShadow: paper ? "none" : "0 3px 16px rgba(0,0,0,0.85)", margin: "6px 0" }}>
      <span style={{ position: "relative", opacity: k === "strike" ? 1 - strike * 0.45 : 1 }}>
        {l.text}
        {k === "strike" ? <span style={{ position: "absolute", right: 0, top: "52%", height: 5, width: `${strike * 100}%`, background: BRAND.danger, borderRadius: 3 }} /> : null}
      </span>
    </div>
  );
};

export type StatementP = { bg?: keyof typeof BG; fog?: boolean; lines: Line[]; align?: "center" | "right"; tag?: string; toBlack?: boolean };
export const Statement: React.FC<{ p: StatementP }> = ({ p }) => {
  const { s, W, H, D, portrait } = useLocal();
  const paper = p.bg === "paper";
  const drift = ci(s, [0, D], [1, 1.04], EIO);
  return (
    <AbsoluteFill style={{ background: BG[p.bg ?? "dark"] }}>
      {p.fog ? <AbsoluteFill style={{ opacity: 0.6 }}><Fog y={H * 0.45} height={H * 0.6} strength={0.35} speed={10} /></AbsoluteFill> : null}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: p.align === "right" ? "flex-end" : "center", padding: portrait ? `0 ${W * 0.08}px` : `0 ${W * 0.12}px`, transform: `scale(${drift})` }}>
        <div style={{ direction: "rtl", textAlign: p.align === "right" ? "right" : "center", maxWidth: portrait ? W * 0.86 : W * 0.76 }}>
          {p.lines.map((l, i) => <LineEl key={i} l={l} s={s} portrait={portrait} paper={paper} />)}
        </div>
      </AbsoluteFill>
      {p.tag ? <div style={{ position: "absolute", left: 60, bottom: 50, fontFamily: TEXT_FONT, fontSize: 18, color: paper ? "rgba(43,34,21,0.6)" : "rgba(244,236,216,0.45)", direction: "rtl" }}>{p.tag}</div> : null}
      <Vignette strength={paper ? 0.5 : 0.85} />
      <Grain opacity={0.1} />
      {p.toBlack ? <AbsoluteFill style={{ background: "#000", opacity: ci(s, [D - 1, D], [0, 1]) }} /> : null}
    </AbsoluteFill>
  );
};

export type ChecklistP = { bg?: keyof typeof BG; title: string; sub?: string; items: { text: string; t: number; mark?: "check" | "cross" | "q" | "dot" }[]; tag?: string };
export const Checklist: React.FC<{ p: ChecklistP }> = ({ p }) => {
  const { s, W, H, portrait } = useLocal();
  const paper = p.bg === "paper";
  const ink = paper ? "#2b2215" : BRAND.cream;
  return (
    <AbsoluteFill style={{ background: BG[p.bg ?? "dark"] }}>
      {paper ? <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(60,45,25,0.06) 0 1px, rgba(0,0,0,0) 1px 46px)" }} /> : null}
      <div style={{ position: "absolute", right: portrait ? W * 0.08 : W * 0.14, left: portrait ? W * 0.08 : W * 0.14, top: portrait ? H * 0.16 : H * 0.14, direction: "rtl" }}>
        <div style={{ fontFamily: TITLE_FONT, fontWeight: 700, fontSize: portrait ? 64 : 58, color: paper ? "#2b2215" : BRAND.cream, opacity: ci(s, [0, 0.8], [0, 1]) }}>{p.title}</div>
        {p.sub ? <div style={{ fontFamily: TEXT_FONT, fontSize: portrait ? 28 : 24, color: paper ? "#5a4a30" : BRAND.creamDim, marginTop: 4, opacity: ci(s, [0.3, 1.1], [0, 1]) }}>{p.sub}</div> : null}
        <div style={{ height: 2, background: paper ? "rgba(43,34,21,0.4)" : BRAND.teal, width: `${ci(s, [0.2, 1.2], [0, 100], EOUT)}%`, margin: "18px 0 26px" }} />
        {p.items.map((it, i) => {
          const a = ci(s, [it.t, it.t + 0.5], [0, 1], EOUT);
          const m = it.mark ?? "check";
          const mc = m === "cross" ? BRAND.danger : m === "q" ? BRAND.lamp : paper ? "#355a4f" : BRAND.tealBright;
          const sym = m === "check" ? "✓" : m === "cross" ? "✕" : m === "q" ? "؟" : "•";
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 22, opacity: a, transform: `translateX(${(1 - a) * -24}px)`, margin: portrait ? "22px 0" : "14px 0" }}>
              <div style={{ width: portrait ? 58 : 50, height: portrait ? 58 : 50, borderRadius: 10, border: `2px solid ${mc}`, color: mc, display: "flex", alignItems: "center", justifyContent: "center", fontSize: portrait ? 36 : 30, fontFamily: TEXT_FONT, fontWeight: 800, flexShrink: 0, transform: `scale(${ci(s, [it.t + 0.2, it.t + 0.5], [0.6, 1], EOUT)})` }}>{sym}</div>
              <div style={{ fontFamily: TEXT_FONT, fontWeight: 600, fontSize: portrait ? 44 : 40, color: ink, lineHeight: 1.4 }}>{it.text}</div>
            </div>
          );
        })}
      </div>
      {p.tag ? <div style={{ position: "absolute", left: 60, bottom: 50, fontFamily: TEXT_FONT, fontSize: 18, color: paper ? "rgba(43,34,21,0.6)" : "rgba(244,236,216,0.45)", direction: "rtl" }}>{p.tag}</div> : null}
      <Vignette strength={paper ? 0.55 : 0.85} />
      <Grain opacity={0.1} />
    </AbsoluteFill>
  );
};

/** Chapter title integrated as an elegant overlay (used on top of the scene beneath). */
export const ChapterOverlay: React.FC<{ num: string; title: string }> = ({ num, title }) => {
  const { s, W, H, D, portrait } = useLocal();
  const a = Math.min(ci(s, [0, 0.9], [0, 1], EOUT), ci(s, [D - 0.9, D], [1, 0]));
  const lw = ci(s, [0.3, 1.4], [0, 1], EOUT);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: a }}>
      <AbsoluteFill style={{ background: "linear-gradient(270deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0) 70%)" }} />
      <div style={{ position: "absolute", right: portrait ? W * 0.08 : W * 0.07, top: portrait ? H * 0.2 : H * 0.36, direction: "rtl", textAlign: "right" }}>
        <div style={{ fontFamily: TEXT_FONT, fontWeight: 600, fontSize: portrait ? 30 : 26, color: BRAND.tealBright, letterSpacing: 1 }}>{num}</div>
        <div style={{ height: 3, width: (portrait ? 220 : 300) * lw, background: BRAND.teal, margin: "10px 0 14px auto" }} />
        <div style={{ fontFamily: TITLE_FONT, fontWeight: 700, fontSize: portrait ? 72 : 76, color: BRAND.cream, textShadow: "0 4px 18px rgba(0,0,0,0.9)", transform: `translateX(${(1 - a) * 20}px)` }}>{title}</div>
      </div>
    </AbsoluteFill>
  );
};

/** Lower-third label (dates, names, places). */
export const LowerThird: React.FC<{ title: string; sub?: string }> = ({ title, sub }) => {
  const { s, W, H, D, portrait } = useLocal();
  const a = Math.min(ci(s, [0, 0.6], [0, 1], EOUT), ci(s, [D - 0.6, D], [1, 0]));
  return (
    <div style={{ position: "absolute", right: portrait ? W * 0.07 : 80, top: portrait ? H * 0.14 : 70, direction: "rtl", textAlign: "right", opacity: a, transform: `translateY(${(1 - a) * -10}px)`, pointerEvents: "none" }}>
      <div style={{ display: "flex", alignItems: "stretch", gap: 16, flexDirection: "row" }}>
        <div style={{ width: 4, background: BRAND.tealBright, borderRadius: 2 }} />
        <div>
          <div style={{ fontFamily: TITLE_FONT, fontWeight: 700, fontSize: portrait ? 50 : 42, color: BRAND.cream, textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}>{title}</div>
          {sub ? <div style={{ fontFamily: TEXT_FONT, fontSize: portrait ? 26 : 22, color: BRAND.creamDim, textShadow: "0 2px 8px rgba(0,0,0,0.9)" }}>{sub}</div> : null}
        </div>
      </div>
    </div>
  );
};

/** Big hook title over the running scene (teaser opening). */
export const HookOverlay: React.FC<{ title: string; sub?: string }> = ({ title, sub }) => {
  const { s, W, H, D, portrait } = useLocal();
  const a = Math.min(ci(s, [0, 0.25], [0, 1], EOUT), ci(s, [D - 0.5, D], [1, 0]));
  const sc = ci(s, [0, D], [1.06, 1.0], EIO);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: a }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.75) 80%)" }} />
      <div style={{ position: "absolute", left: W * 0.06, right: W * 0.06, top: portrait ? H * 0.2 : H * 0.3, textAlign: "center", direction: "rtl", transform: `scale(${sc})` }}>
        <div style={{ fontFamily: TEXT_FONT, fontWeight: 800, fontSize: portrait ? 104 : 90, lineHeight: 1.2, color: BRAND.cream, textShadow: "0 6px 24px rgba(0,0,0,0.95)" }}>{title}</div>
        {sub ? <div style={{ fontFamily: TEXT_FONT, fontWeight: 600, fontSize: portrait ? 44 : 36, color: BRAND.lamp, marginTop: 16, textShadow: "0 4px 14px rgba(0,0,0,0.9)" }}>{sub}</div> : null}
      </div>
    </AbsoluteFill>
  );
};
