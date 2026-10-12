import React from "react";
import { AbsoluteFill, Img } from "remotion";
import { TEXT_FONT, TITLE_FONT } from "../fonts";
import { LOGO } from "./Brand";
import { Seascape } from "./scenes/Seascape";
import { BRAND } from "./theme";

/** YouTube thumbnail (1280x720): dark lighthouse, three fading figures, big question, channel badge. */
export const Thumbnail: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <AbsoluteFill style={{ transform: "scaleX(-1) scale(1.45)", transformOrigin: "60% 60%" }}>
      <Seascape p={{ tod: "storm", frame: "mid", light: 0, beam: false, figures: 3, rain: 0.6, fog: 0.5, push: [1, 1] }} />
    </AbsoluteFill>
    <AbsoluteFill style={{ background: "linear-gradient(270deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 38%, rgba(0,0,0,0) 62%)" }} />
    <div style={{ position: "absolute", right: 46, top: 70, width: 640, direction: "rtl", textAlign: "right" }}>
      <div style={{ fontFamily: TEXT_FONT, fontWeight: 800, fontSize: 40, color: BRAND.tealBright, letterSpacing: 1 }}>اسكتلندا · ١٩٠٠</div>
      <div style={{ fontFamily: TEXT_FONT, fontWeight: 800, fontSize: 104, lineHeight: 1.12, color: BRAND.cream, textShadow: "0 6px 22px rgba(0,0,0,0.95)", marginTop: 6 }}>
        ٣ حراس <span style={{ color: BRAND.lamp }}>اختفوا</span>
      </div>
      <div style={{ fontFamily: TEXT_FONT, fontWeight: 800, fontSize: 64, lineHeight: 1.2, color: BRAND.cream, textShadow: "0 6px 22px rgba(0,0,0,0.95)", marginTop: 6 }}>والمنارة مطفية!</div>
      <div style={{ display: "inline-block", marginTop: 22, padding: "8px 22px", background: BRAND.teal, color: BRAND.cream, fontFamily: TITLE_FONT, fontWeight: 700, fontSize: 40, borderRadius: 8 }}>لغز جزر فلانان</div>
    </div>
    <div style={{ position: "absolute", left: 26, bottom: 22, width: 190, height: 190 }}>
      <Img src={LOGO} style={{ width: 190, height: 190 }} />
    </div>
  </AbsoluteFill>
);
