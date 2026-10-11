import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import { Fog, Sea, Sky, Vignette, clampI } from "../components/layers";
import { Lighthouse } from "../components/scenery";
import { RevealWords } from "../components/text";
import { TEXT_FONT, TITLE_FONT } from "../fonts";
import { SceneProps, useScene } from "./common";

/** Closing frame: the dark lighthouse and the mystery title. `variant="short"` ends on a question to the viewer. */
export const S10EndCard: React.FC<SceneProps & { variant?: "full" | "short" }> = ({ t0, dur, variant = "full" }) => {
  const { s, W, H, portrait, fps } = useScene(t0);
  const horizonY = portrait ? 0.64 : 0.66;
  const lh = { x: W / 2, baseY: H * horizonY + 2, size: portrait ? H * 0.12 : H * 0.15 };
  const out = clampI(s, [dur - 1.1, dur], [1, 0], Easing.in(Easing.quad));
  const brandIn = clampI(s, [1.6, 2.4], [0, 1]);
  return (
    <AbsoluteFill style={{ background: "#020304" }}>
      <AbsoluteFill style={{ opacity: out }}>
        <Sky top="#020305" horizon="#121920" horizonY={horizonY} drift={12} cloudOpacity={0.8} />
        <Sea horizonY={horizonY} tint="#0d141a" haze="#121920" speed={20} brightness={0.45} />
        <Lighthouse l={lh} light={0} day={0} id="lh10" />
        <Fog y={H * horizonY - H * 0.12} height={H * 0.3} strength={0.45} speed={14} seed={15} />
        <AbsoluteFill style={{ background: "rgba(0,0,0,0.45)" }} />
        <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: portrait ? H * 0.17 : H * 0.14 }}>
          {variant === "full" ? (
            <>
              <RevealWords
                text="لغز جزر فلانان"
                startFrame={Math.round(0.2 * fps)}
                perWord={6}
                style={{ fontFamily: TITLE_FONT, fontWeight: 700, fontSize: portrait ? 110 : 120, color: "#f1ebdf", textShadow: "0 4px 30px rgba(0,0,0,0.9)" }}
              />
              <div
                style={{
                  fontFamily: TITLE_FONT,
                  fontSize: portrait ? 50 : 46,
                  color: "rgba(230,222,205,0.85)",
                  direction: "rtl",
                  marginTop: 10,
                  opacity: clampI(s, [0.9, 1.7], [0, 1]),
                }}
              >
                ثلاثة حرّاس… ولا أثر
              </div>
            </>
          ) : (
            <>
              <RevealWords
                text="تفتكر إيه اللي حصل؟"
                startFrame={Math.round(0.1 * fps)}
                perWord={4}
                style={{ fontFamily: TITLE_FONT, fontWeight: 700, fontSize: 104, color: "#f1ebdf", textAlign: "center", maxWidth: W * 0.86, lineHeight: 1.4, textShadow: "0 4px 30px rgba(0,0,0,0.9)" }}
              />
              <div style={{ fontFamily: TEXT_FONT, fontSize: 36, color: "rgba(230,222,205,0.8)", direction: "rtl", marginTop: 24, opacity: clampI(s, [0.6, 1.2], [0, 1]) }}>
                لغز منارة جزر فلانان · ١٩٠٠
              </div>
            </>
          )}
        </AbsoluteFill>
        <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: portrait ? H * 0.1 : H * 0.12 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, opacity: brandIn }}>
            <div style={{ width: portrait ? 260 : 300, height: 1, background: "rgba(201,168,106,0.7)" }} />
            <div style={{ fontFamily: TITLE_FONT, fontWeight: 700, fontSize: portrait ? 56 : 46, color: "#c9a86a", direction: "rtl", letterSpacing: 2 }}>وقت الرواية</div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
      <Vignette strength={0.8} />
    </AbsoluteFill>
  );
};
