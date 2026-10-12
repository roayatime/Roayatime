import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { TEXT_FONT, TITLE_FONT } from "../fonts";
import { BRAND } from "./theme";
import { EIO, EOUT, ci, useLocal } from "./util";

export const LOGO = staticFile("private/logo.png");

/** Opening logo reveal: darkness -> teal ink bloom -> logo with a lighthouse-beam light sweep. */
export const LogoReveal: React.FC<{ title?: string; sub?: string }> = ({ title, sub }) => {
  const { s, W, H, D, portrait } = useLocal();
  const size = portrait ? W * 0.78 : H * 0.5;
  const bloom = ci(s, [0, 1.4], [0, 1], EOUT);
  const logoIn = ci(s, [0.35, 1.6], [0, 1], EOUT);
  const scale = ci(s, [0.35, D], [0.9, 1.04], EIO);
  const sweep = ci(s, [1.2, 2.6], [-0.6, 1.6], EIO);
  const out = ci(s, [D - 0.8, D], [1, 0]);
  const tIn = ci(s, [1.8, 2.6], [0, 1], EOUT);
  const cx = W / 2, cy = portrait ? H * 0.42 : H * (title ? 0.36 : 0.5);
  const beamRot = -30 + s * 22;
  return (
    <AbsoluteFill style={{ background: BRAND.ink, opacity: out }}>
      {/* soft teal glow, echoing the logo's ink circle */}
      <AbsoluteFill style={{ background: `radial-gradient(circle ${size * 0.75 * bloom}px at ${cx}px ${cy}px, rgba(20,127,139,0.55), rgba(10,59,66,0.25) 55%, rgba(0,0,0,0) 100%)` }} />
      {/* a slow lighthouse beam behind the badge */}
      <AbsoluteFill style={{ transformOrigin: `${cx}px ${cy}px`, transform: `rotate(${beamRot}deg)`, opacity: 0 }}>
        <div style={{ position: "absolute", left: cx, top: cy - size * 0.06, width: W * 1.2, height: size * 0.12, background: "linear-gradient(90deg, rgba(255,236,200,0.7), rgba(255,236,200,0) 75%)", clipPath: "polygon(0 42%, 100% 0, 100% 100%, 0 58%)", WebkitMaskImage: "linear-gradient(0deg, transparent 0%, black 35%, black 65%, transparent 100%)", maskImage: "linear-gradient(0deg, transparent 0%, black 35%, black 65%, transparent 100%)" }} />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: cx - size / 2, top: cy - size / 2, width: size, height: size, opacity: logoIn, transform: `scale(${scale})` }}>
        <Img src={LOGO} style={{ width: size, height: size }} />
        {/* light sweep masked by the logo's own alpha */}
        <div
          style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(105deg, rgba(255,255,255,0) ${(sweep - 0.15) * 100}%, rgba(255,246,225,0.55) ${sweep * 100}%, rgba(255,255,255,0) ${(sweep + 0.15) * 100}%)`,
            WebkitMaskImage: `url(${LOGO})`, maskImage: `url(${LOGO})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%",
            mixBlendMode: "screen",
          }}
        />
      </div>
      {title ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: cy + size * 0.52, textAlign: "center", direction: "rtl", opacity: tIn, transform: `translateY(${(1 - tIn) * 14}px)` }}>
          <div style={{ fontFamily: TITLE_FONT, fontWeight: 700, fontSize: portrait ? 64 : 58, color: BRAND.cream, textShadow: "0 3px 14px rgba(0,0,0,0.9)" }}>{title}</div>
          {sub ? <div style={{ fontFamily: TEXT_FONT, fontSize: portrait ? 30 : 26, color: BRAND.creamDim, marginTop: 6, letterSpacing: 0.5 }}>{sub}</div> : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Small, restrained channel signature in the corner. */
export const Bug: React.FC<{ opacity?: number }> = ({ opacity = 0.5 }) => {
  const { W, H, portrait } = useLocal();
  const sz = portrait ? 120 : 96;
  return (
    <div style={{ position: "absolute", left: portrait ? W * 0.06 : 44, top: portrait ? H * 0.06 : 36, width: sz, height: sz, opacity, pointerEvents: "none" }}>
      <Img src={LOGO} style={{ width: sz, height: sz }} />
    </div>
  );
};

/** End card: logo, closing line and compact credits. */
export const EndCard: React.FC<{ lines?: string[]; credits?: string[]; cta?: string }> = ({ lines = [], credits = [], cta }) => {
  const { s, W, H, D, portrait } = useLocal();
  const a = ci(s, [0, 1.2], [0, 1], EOUT);
  const out = ci(s, [D - 1.2, D], [1, 0]);
  const size = portrait ? W * 0.62 : H * 0.42;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 38%, ${BRAND.tealDeep} 0%, ${BRAND.ink} 70%)`, opacity: out }}>
      <div style={{ position: "absolute", left: W / 2 - size / 2, top: portrait ? H * 0.16 : H * 0.1, width: size, height: size, opacity: a, transform: `scale(${0.95 + 0.05 * a})` }}>
        <Img src={LOGO} style={{ width: size, height: size }} />
      </div>
      <div style={{ position: "absolute", left: W * 0.08, right: W * 0.08, top: portrait ? H * 0.16 + size + 40 : H * 0.1 + size + 24, textAlign: "center", direction: "rtl", opacity: ci(s, [0.8, 1.8], [0, 1]) }}>
        {lines.map((l, i) => (
          <div key={i} style={{ fontFamily: i === 0 ? TITLE_FONT : TEXT_FONT, fontWeight: i === 0 ? 700 : 400, fontSize: (portrait ? 54 : 44) * (i === 0 ? 1 : 0.62), color: i === 0 ? BRAND.cream : BRAND.creamDim, marginBottom: 8 }}>{l}</div>
        ))}
        {cta ? (
          <div style={{ display: "inline-block", marginTop: 14, padding: portrait ? "16px 34px" : "10px 26px", borderRadius: 40, border: `2px solid ${BRAND.tealBright}`, color: BRAND.cream, fontFamily: TEXT_FONT, fontWeight: 600, fontSize: portrait ? 40 : 28, background: "rgba(20,127,139,0.25)" }}>{cta}</div>
        ) : null}
      </div>
      {credits.length ? (
        <div style={{ position: "absolute", left: W * 0.08, right: W * 0.08, bottom: portrait ? H * 0.08 : H * 0.05, textAlign: "center", direction: "rtl", fontFamily: TEXT_FONT, fontSize: portrait ? 22 : 17, lineHeight: 1.7, color: "rgba(244,236,216,0.55)", opacity: ci(s, [1.5, 2.5], [0, 1]) }}>
          {credits.map((c, i) => <div key={i}>{c}</div>)}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
