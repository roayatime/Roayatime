import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import "../fonts";
import { TEXT_FONT, TITLE_FONT } from "../fonts";
import { Bug, EndCard, LogoReveal } from "../flannan/Brand";
import { ChapterOverlay, LowerThird } from "../flannan/scenes/Cards";
import { MapScene } from "../flannan/scenes/MapScene";
import { Cue, Subtitles } from "../flannan/Subtitles";
import { BRAND } from "../flannan/theme";
import { EOUT, ci, useLocal } from "../flannan/util";
import { SHOTS } from "./shots";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Scene3D = { kind: "3d" | "2d"; type: string; from: number; dur: number; p: any; note?: string; rec?: boolean; xf?: number };
export type Overlay3D = { type: string; from: number; dur: number; [k: string]: any };
export type Episode3DData = { width: number; height: number; fps: number; frames: number; scenes: Scene3D[]; overlays: Overlay3D[]; cues: Cue[]; scale?: number; subsBig?: boolean; bugFrom?: number; bugTo?: number };

/** One 3D shot, driven by the local Sequence clock. */
const Shot: React.FC<{ type: string; p: any; scale: number }> = ({ type, p, scale }) => {
  const f = useCurrentFrame();
  const { fps, durationInFrames, height, width } = useVideoConfig();
  const fn = SHOTS[type];
  if (!fn) throw new Error(`unknown shot ${type}`);
  return fn({ t: f / fps, D: durationInFrames / fps, p: p ?? {}, scale, portrait: height > width });
};

const Two: React.FC<{ type: string; p: any }> = ({ type, p }) => {
  if (type === "map") return <MapScene p={p} />;
  if (type === "logo") return <LogoReveal title={p?.title} sub={p?.sub} />;
  if (type === "end") return <EndCard lines={p?.lines} credits={p?.credits} cta={p?.cta} />;
  return <AbsoluteFill style={{ background: "#000" }} />;
};

const Fade: React.FC<{ inF: number; outF: number; children: React.ReactNode }> = ({ inF, outF, children }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const o = Math.min(inF > 0 ? Math.min(1, f / inF) : 1, outF > 0 ? Math.min(1, (durationInFrames - f) / outF) : 1);
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

/* ---------------- documentary overlays ---------------- */
const box = (portrait: boolean): React.CSSProperties => ({ background: "rgba(6,10,12,0.62)", border: `1px solid rgba(244,236,216,0.14)`, borderRadius: 14, padding: portrait ? "22px 30px" : "18px 26px", backdropFilter: "blur(2px)" });

const ReconTag: React.FC<{ text: string }> = ({ text }) => {
  const { W, H, portrait } = useLocal();
  return (
    <div style={{ position: "absolute", right: portrait ? W * 0.06 : 40, top: portrait ? H * 0.065 : 34, direction: "rtl", fontFamily: TEXT_FONT, fontSize: portrait ? 26 : 19, color: "rgba(244,236,216,0.78)", background: "rgba(0,0,0,0.38)", padding: "5px 14px", borderRadius: 20, letterSpacing: 0.3 }}>
      {text}
    </div>
  );
};

const DateCard: React.FC<{ title: string; sub?: string }> = ({ title, sub }) => {
  const { s, D, W, H, portrait } = useLocal();
  const a = Math.min(ci(s, [0, 0.6], [0, 1], EOUT), ci(s, [D - 0.6, D], [1, 0]));
  return (
    <div style={{ position: "absolute", right: portrait ? W * 0.08 : W * 0.06, top: portrait ? H * 0.16 : H * 0.12, direction: "rtl", opacity: a, transform: `translateX(${(1 - a) * -20}px)`, ...box(portrait) }}>
      <div style={{ fontFamily: TITLE_FONT, fontWeight: 700, fontSize: portrait ? 62 : 54, color: BRAND.lamp, textShadow: "0 3px 12px rgba(0,0,0,0.8)" }}>{title}</div>
      {sub ? <div style={{ fontFamily: TEXT_FONT, fontSize: portrait ? 32 : 26, color: BRAND.cream, marginTop: 4 }}>{sub}</div> : null}
    </div>
  );
};

const MARK: Record<string, { c: string; ch: string }> = { check: { c: "#6fbf8a", ch: "✓" }, cross: { c: BRAND.danger, ch: "✕" }, q: { c: BRAND.lamp, ch: "؟" } };
const Panel: React.FC<{ title: string; sub?: string; items: { text: string; t: number; mark?: string }[] }> = ({ title, sub, items }) => {
  const { s, D, W, H, portrait } = useLocal();
  const a = Math.min(ci(s, [0, 0.5], [0, 1], EOUT), ci(s, [D - 0.5, D], [1, 0]));
  return (
    <div style={{ position: "absolute", right: portrait ? W * 0.06 : W * 0.05, ...(portrait ? { top: H * 0.13, left: W * 0.06 } : { top: H * 0.16, width: W * 0.36 }), direction: "rtl", opacity: a, ...box(portrait) }}>
      <div style={{ fontFamily: TITLE_FONT, fontWeight: 700, fontSize: portrait ? 46 : 36, color: BRAND.cream, marginBottom: sub ? 2 : 10 }}>{title}</div>
      {sub ? <div style={{ fontFamily: TEXT_FONT, fontSize: portrait ? 24 : 18, color: BRAND.creamDim, marginBottom: 10 }}>{sub}</div> : null}
      {items.map((it, i) => {
        const b = ci(s, [it.t, it.t + 0.45], [0, 1], EOUT);
        const mk = MARK[it.mark ?? "check"];
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, opacity: b, transform: `translateX(${(1 - b) * -14}px)`, margin: portrait ? "10px 0" : "7px 0" }}>
            <span style={{ fontFamily: TEXT_FONT, fontWeight: 700, fontSize: portrait ? 36 : 28, color: mk.c, width: portrait ? 40 : 30, textAlign: "center" }}>{mk.ch}</span>
            <span style={{ fontFamily: TEXT_FONT, fontWeight: 600, fontSize: portrait ? 36 : 29, color: BRAND.cream, lineHeight: 1.35 }}>{it.text}</span>
          </div>
        );
      })}
    </div>
  );
};

const Stamp: React.FC<{ text: string; small?: boolean; danger?: boolean }> = ({ text, small, danger }) => {
  const { s, D, W, H, portrait } = useLocal();
  const a = Math.min(ci(s, [0, 0.35], [0, 1], EOUT), ci(s, [D - 0.5, D], [1, 0]));
  const sc = 1.25 - 0.25 * a;
  const col = danger ? BRAND.danger : BRAND.lamp;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: small ? (portrait ? H * 0.11 : H * 0.075) : portrait ? H * 0.35 : H * 0.36, display: "flex", justifyContent: "center", opacity: a }}>
      <div style={{ direction: "rtl", transform: `scale(${sc}) rotate(${small ? 0 : -3}deg)`, border: `${small ? 2 : 4}px solid ${col}`, color: col, fontFamily: TITLE_FONT, fontWeight: 700, fontSize: small ? (portrait ? 30 : 24) : portrait ? 64 : 56, padding: small ? "4px 16px" : "8px 28px", borderRadius: 10, background: "rgba(0,0,0,0.35)", textShadow: "0 2px 8px rgba(0,0,0,0.8)", maxWidth: W * 0.86, textAlign: "center" }}>
        {text}
      </div>
    </div>
  );
};

const Big: React.FC<{ lines: { text: string; t: number; kind?: string }[] }> = ({ lines }) => {
  const { s, D, H, portrait } = useLocal();
  const out = ci(s, [D - 0.5, D], [1, 0]);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", direction: "rtl", opacity: out, paddingBottom: portrait ? H * 0.22 : H * 0.12 }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 65%)" }} />
      {lines.map((l, i) => {
        const a = ci(s, [l.t, l.t + 0.6], [0, 1], EOUT);
        const fs = l.kind === "title" ? (portrait ? 92 : 84) : l.kind === "accent" ? (portrait ? 72 : 64) : l.kind === "small" ? (portrait ? 34 : 28) : portrait ? 54 : 48;
        return (
          <div key={i} style={{ position: "relative", opacity: a, transform: `translateY(${(1 - a) * 16}px)`, fontFamily: l.kind === "title" || l.kind === "accent" ? TITLE_FONT : TEXT_FONT, fontWeight: 700, fontSize: fs, color: l.kind === "accent" ? BRAND.lamp : BRAND.cream, textShadow: "0 4px 18px rgba(0,0,0,0.95)", margin: "6px 40px", textAlign: "center" }}>
            {l.text}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Names: React.FC<{ names: { text: string; t: number }[] }> = ({ names }) => {
  const { s, D, H, portrait } = useLocal();
  const out = ci(s, [D - 0.8, D], [1, 0]);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", direction: "rtl", opacity: out, paddingBottom: portrait ? H * 0.2 : H * 0.05 }}>
      {names.map((n, i) => {
        const a = ci(s, [n.t, n.t + 0.8], [0, 1], EOUT);
        return (
          <div key={i} style={{ opacity: a, fontFamily: TITLE_FONT, fontWeight: 700, fontSize: portrait ? 70 : 64, color: BRAND.cream, textShadow: "0 4px 18px rgba(0,0,0,0.95)", margin: "4px 0", letterSpacing: 1 }}>
            {n.text}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Measure: React.FC<{ title: string; sub?: string }> = ({ title, sub }) => {
  const { s, D, W, H, portrait } = useLocal();
  const a = Math.min(ci(s, [0, 0.6], [0, 1], EOUT), ci(s, [D - 0.6, D], [1, 0]));
  const x = portrait ? W * 0.14 : W * 0.2;
  const y0 = portrait ? H * 0.62 : H * 0.8, y1 = portrait ? H * 0.3 : H * 0.28;
  const yy = y0 + (y1 - y0) * a;
  return (
    <AbsoluteFill style={{ opacity: a }}>
      <div style={{ position: "absolute", left: x, top: yy, width: 4, height: y0 - yy, background: BRAND.lamp, boxShadow: "0 0 10px rgba(0,0,0,0.8)" }} />
      <div style={{ position: "absolute", left: x - 18, top: yy - 2, width: 40, height: 4, background: BRAND.lamp }} />
      <div style={{ position: "absolute", left: x - 18, top: y0 - 2, width: 40, height: 4, background: BRAND.lamp }} />
      <div style={{ position: "absolute", left: x + 30, top: yy - 10, direction: "rtl", ...box(portrait) }}>
        <div style={{ fontFamily: TITLE_FONT, fontWeight: 700, fontSize: portrait ? 56 : 48, color: BRAND.lamp }}>{title}</div>
        {sub ? <div style={{ fontFamily: TEXT_FONT, fontSize: portrait ? 30 : 24, color: BRAND.cream }}>{sub}</div> : null}
      </div>
    </AbsoluteFill>
  );
};

const OverlayEl: React.FC<{ o: Overlay3D }> = ({ o }) => {
  switch (o.type) {
    case "chapter": return <ChapterOverlay num={o.num} title={o.title} />;
    case "lower": return <LowerThird title={o.title} sub={o.sub} />;
    case "date": return <DateCard title={o.title} sub={o.sub} />;
    case "panel": return <Panel title={o.title} sub={o.sub} items={o.items} />;
    case "stamp": return <Stamp text={o.text} small={o.small} danger={o.danger} />;
    case "big": return <Big lines={o.lines} />;
    case "names": return <Names names={o.names} />;
    case "measure": return <Measure title={o.title} sub={o.sub} />;
    default: return null;
  }
};

export const Episode3D: React.FC<{ data: Episode3DData }> = ({ data }) => {
  const scale = data.scale ?? 1;
  const XF = 12;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {data.scenes.map((sc, i) => {
        const next = data.scenes[i + 1];
        const tail = next ? XF : 0;
        return (
          <Sequence key={i} from={sc.from} durationInFrames={sc.dur + tail} name={`${i}:${sc.type} ${sc.note ?? ""}`}>
            <Fade inF={i === 0 ? 0 : XF} outF={0}>
              {sc.kind === "3d" ? <Shot type={sc.type} p={sc.p} scale={scale} /> : <Two type={sc.type} p={sc.p} />}
              {sc.rec ? <ReconTag text="مشاهد تمثيلية توضيحية" /> : null}
            </Fade>
          </Sequence>
        );
      })}
      {data.overlays.map((o, i) => (
        <Sequence key={`o${i}`} from={o.from} durationInFrames={Math.max(1, o.dur)} name={`ov:${o.type}`}>
          <OverlayEl o={o} />
        </Sequence>
      ))}
      <Sequence from={data.bugFrom ?? 0} durationInFrames={Math.max(1, (data.bugTo ?? data.frames) - (data.bugFrom ?? 0))} name="bug">
        <Bug opacity={0.4} />
      </Sequence>
      <SubLayer cues={data.cues} big={data.subsBig} />
    </AbsoluteFill>
  );
};

const SubLayer: React.FC<{ cues: Cue[]; big?: boolean }> = ({ cues, big }) => {
  useLocal();
  return <Subtitles cues={cues} big={big} />;
};
