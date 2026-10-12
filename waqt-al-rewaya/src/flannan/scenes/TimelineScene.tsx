import React from "react";
import { AbsoluteFill } from "remotion";
import { Grain, Vignette } from "../../components/layers";
import { TEXT_FONT, TITLE_FONT } from "../../fonts";
import { BRAND } from "../theme";
import { EIO, EOUT, ci, useLocal } from "../util";

/** Horizontal RTL timeline: time flows right -> left. */
export type TimelineP = { title?: string; items: { date: string; text: string; t: number; pos: number; hl?: boolean; q?: boolean }[]; cursorAt?: number };
export const TimelineScene: React.FC<{ p: TimelineP }> = ({ p }) => {
  const { s, W, H, portrait } = useLocal();
  const y = portrait ? H * 0.46 : H * 0.52;
  const x0 = portrait ? W * 0.9 : W * 0.9, x1 = portrait ? W * 0.1 : W * 0.1;
  const grow = ci(s, [0, 1.4], [0, 1], EOUT);
  const X = (pos: number) => x0 + (x1 - x0) * pos;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, #0f2529 0%, ${BRAND.ink} 80%)` }}>
      {p.title ? <div style={{ position: "absolute", right: portrait ? W * 0.08 : 90, top: portrait ? H * 0.14 : 70, direction: "rtl", fontFamily: TITLE_FONT, fontWeight: 700, fontSize: portrait ? 58 : 50, color: BRAND.cream, opacity: ci(s, [0, 0.8], [0, 1]) }}>{p.title}</div> : null}
      <div style={{ position: "absolute", left: x1, top: y - 2, width: (x0 - x1) * grow, height: 4, background: `linear-gradient(270deg, ${BRAND.teal}, rgba(20,127,139,0.3))`, transform: `translateX(${(x0 - x1) * (1 - grow)}px)` }} />
      {p.items.map((it, i) => {
        const a = ci(s, [it.t, it.t + 0.6], [0, 1], EOUT);
        const x = X(it.pos);
        const up = i % 2 === 0;
        const pulse = it.hl ? 0.5 + 0.5 * Math.sin(s * 3) : 0;
        return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: x - 13, top: y - 13, width: 26, height: 26, borderRadius: "50%", background: it.hl ? BRAND.lamp : it.q ? "transparent" : BRAND.tealBright, border: `3px solid ${it.q ? BRAND.lamp : BRAND.ink}`, opacity: a, boxShadow: it.hl ? `0 0 ${16 + 16 * pulse}px rgba(242,194,123,0.8)` : "none", transform: `scale(${0.5 + 0.5 * a})` }} />
            <div style={{ position: "absolute", left: x, top: up ? y - (portrait ? 220 : 190) : y + 34, transform: "translateX(-50%)", width: portrait ? W * 0.36 : W * 0.2, direction: "rtl", textAlign: "center", opacity: a, translate: `0 ${(1 - a) * (up ? 12 : -12)}px` }}>
              <div style={{ fontFamily: TITLE_FONT, fontWeight: 700, fontSize: portrait ? 44 : 40, color: it.hl ? BRAND.lamp : BRAND.cream }}>{it.date}</div>
              <div style={{ fontFamily: TEXT_FONT, fontWeight: 600, fontSize: portrait ? 26 : 23, color: BRAND.creamDim, lineHeight: 1.45 }}>{it.text}</div>
            </div>
          </React.Fragment>
        );
      })}
      {p.cursorAt !== undefined ? <div style={{ position: "absolute", left: X(ci(s, [p.cursorAt, p.cursorAt + 3], [0, 1], EIO)) - 1, top: y - 60, width: 2, height: 120, background: "rgba(244,236,216,0.6)" }} /> : null}
      <Vignette strength={0.8} />
      <Grain opacity={0.1} />
    </AbsoluteFill>
  );
};

/** Myths vs documented record, split screen. */
export type MythP = { myths: { text: string; t: number }[]; facts: { text: string; t: number }[]; verdictAt?: number };
export const MythFact: React.FC<{ p: MythP }> = ({ p }) => {
  const { s, H, portrait } = useLocal();
  const col = (title: string, sub: string, items: { text: string; t: number }[], myth: boolean) => (
    <div style={{ flex: 1, padding: portrait ? "0 40px" : "0 56px", direction: "rtl" }}>
      <div style={{ fontFamily: TITLE_FONT, fontWeight: 700, fontSize: portrait ? 56 : 52, color: myth ? "#e2a58f" : BRAND.tealBright }}>{title}</div>
      <div style={{ fontFamily: TEXT_FONT, fontSize: portrait ? 24 : 21, color: BRAND.creamDim, marginBottom: 20 }}>{sub}</div>
      {items.map((it, i) => {
        const a = ci(s, [it.t, it.t + 0.6], [0, 1], EOUT);
        const strike = myth && p.verdictAt !== undefined ? ci(s, [p.verdictAt + i * 0.25, p.verdictAt + i * 0.25 + 0.5], [0, 1], EIO) : 0;
        return (
          <div key={i} style={{ display: "table", position: "relative", fontFamily: TEXT_FONT, fontWeight: 600, fontSize: portrait ? 36 : 32, color: BRAND.cream, opacity: a * (1 - 0.4 * strike), margin: portrait ? "14px 0" : "12px 0", lineHeight: 1.4 }}>
            {myth ? "✕ " : "✓ "}
            {it.text}
            {myth ? <span style={{ position: "absolute", right: 0, top: "55%", height: 4, width: `${strike * 100}%`, background: BRAND.danger }} /> : null}
          </div>
        );
      })}
    </div>
  );
  return (
    <AbsoluteFill style={{ background: `linear-gradient(90deg, #0b1f22 0%, #0b1f22 50%, #22130f 50%, #22130f 100%)` }}>
      <AbsoluteFill style={{ display: "flex", flexDirection: portrait ? "column" : "row-reverse", paddingTop: portrait ? H * 0.12 : H * 0.14, gap: portrait ? 40 : 0 }}>
        {col("الحكاية المتداولة", "تفاصيل اتضافت بعد سنين", p.myths, true)}
        {col("التقارير الأصلية", "اللي اتوثّق وقت التحقيق", p.facts, false)}
      </AbsoluteFill>
      {p.verdictAt !== undefined ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: portrait ? H * 0.32 : H * 0.18, textAlign: "center", opacity: ci(s, [p.verdictAt + 0.9, p.verdictAt + 1.6], [0, 1]) }}>
          <span style={{ display: "inline-block", fontFamily: TEXT_FONT, fontWeight: 800, fontSize: portrait ? 40 : 34, color: BRAND.danger, border: `4px solid ${BRAND.danger}`, padding: "6px 24px", transform: "rotate(-4deg)", direction: "rtl" }}>غير مدعومة بالسجلات الرسمية</span>
        </div>
      ) : null}
      <Vignette strength={0.75} />
      <Grain opacity={0.1} />
    </AbsoluteFill>
  );
};
