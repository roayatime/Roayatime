import React from "react";
import { AbsoluteFill, Easing, Sequence, interpolate } from "remotion";
import { Fog, Rain, Sea, Sky, Vignette, clampI } from "../components/layers";
import { Beam, Island, Lighthouse, islandTop, lanternCenter } from "../components/scenery";
import { InfoLabel, RevealWords } from "../components/text";
import { TEXT_FONT, TITLE_FONT } from "../fonts";
import { Camera, SceneProps, useScene } from "./common";

/** Scene A: remote island at dusk, slow approach. Carries the opening title when `withTitle`. */
export const S01Island: React.FC<SceneProps & { withTitle?: boolean; titleSec?: number }> = ({ t0, dur, withTitle = true, titleSec = 5 }) => {
  const { s, c, W, H, portrait, fps } = useScene(t0);
  const horizonY = portrait ? 0.6 : 0.62;
  const g = portrait
    ? { left: W * 0.06, baseY: H * horizonY + 4, w: W * 0.88, h: H * 0.085 }
    : { left: W * 0.47, baseY: H * horizonY + 4, w: W * 0.4, h: H * 0.15 };
  const lh = { x: g.left + g.w * 0.6, baseY: islandTop(g, 0.6) + 3, size: portrait ? H * 0.075 : H * 0.11 };
  const lc = lanternCenter(lh);
  const push = clampI(s, [0, dur], [1, portrait ? 1.22 : 1.2], Easing.inOut(Easing.sin));
  const fromBlack = clampI(s, [0, 1.6], [1, 0]);
  const titleDim = withTitle ? clampI(s, [0, 0.5, titleSec - 0.8, titleSec + 0.4], [0.55, 0.55, 0.55, 0]) : 0;

  return (
    <AbsoluteFill style={{ background: "#05070a" }}>
      <Camera scale={1 + (push - 1) * 0.3} originX={lc.x} originY={lc.y}>
        <Sky top="#04060a" horizon="#2a333c" horizonY={horizonY} drift={10} />
      </Camera>
      <Camera scale={push} originX={lc.x} originY={lc.y}>
        <Sea horizonY={horizonY} tint="#1b2630" haze="#2a333c" speed={28} brightness={0.6} glintX={lc.x} glint={0.25} />
        <Fog y={H * horizonY - H * 0.16} height={H * 0.28} strength={0.35} speed={14} />
        <Island g={g} light={0.15} haze="rgba(40,50,58,0.35)" />
        <Lighthouse l={lh} light={0.9} day={0} />
        <Beam cx={lc.x} cy={lc.y} azimuth={(c / 9) * Math.PI * 2 + 1.1} intensity={0.85} length={portrait ? W * 0.7 : W * 0.42} id="b1" />
        <Fog y={H * horizonY - H * 0.04} height={H * 0.3} strength={0.45} speed={24} seed={2} />
      </Camera>
      <Rain count={portrait ? 110 : 150} opacity={0.18} />
      <Vignette strength={0.8} />
      <AbsoluteFill style={{ background: "black", opacity: Math.max(titleDim, 0) }} />

      {withTitle ? (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: portrait ? 36 : 22 }}>
          <div
            style={{
              fontFamily: TITLE_FONT,
              fontWeight: 700,
              fontSize: portrait ? 54 : 40,
              color: "#c9a86a",
              letterSpacing: 2,
              direction: "rtl",
              opacity: clampI(s, [0.5, 1.3, titleSec - 0.6, titleSec + 0.2], [0, 1, 1, 0]),
            }}
          >
            وقت الرواية
          </div>
          <div style={{ width: clampI(s, [0.8, 2.0], [0, portrait ? 360 : 520], Easing.out(Easing.cubic)), height: 1, background: "rgba(201,168,106,0.7)", opacity: clampI(s, [titleSec - 0.6, titleSec + 0.2], [1, 0]) }} />
          <div style={{ opacity: clampI(s, [titleSec - 0.6, titleSec + 0.3], [1, 0]) }}>
            <RevealWords
              text="لغز اختفاء حراس منارة جزر فلانان"
              startFrame={Math.round(1.3 * fps)}
              perWord={5}
              style={{
                fontFamily: TITLE_FONT,
                fontWeight: 700,
                fontSize: portrait ? 92 : 96,
                color: "#f1ebdf",
                textAlign: "center",
                maxWidth: portrait ? W * 0.84 : W * 0.8,
                lineHeight: 1.45,
                textShadow: "0 4px 24px rgba(0,0,0,0.9)",
              }}
            />
          </div>
          <div
            style={{
              fontFamily: TEXT_FONT,
              fontSize: portrait ? 32 : 26,
              color: "rgba(230,225,215,0.75)",
              direction: "rtl",
              opacity: clampI(s, [2.6, 3.4, titleSec - 0.6, titleSec + 0.2], [0, 1, 1, 0]),
            }}
          >
            اسكتلندا · ديسمبر ١٩٠٠
          </div>
        </AbsoluteFill>
      ) : null}

      {withTitle ? (
        <Sequence from={Math.round((titleSec + 0.6) * fps)} durationInFrames={Math.round((dur - titleSec - 0.8) * fps)} layout="absolute-fill">
          <InfoLabel lines={["جزر فلانان", "المحيط الأطلسي · غرب اسكتلندا"]} dur={Math.round((dur - titleSec - 0.8) * fps)} />
        </Sequence>
      ) : null}
      <AbsoluteFill style={{ background: "black", opacity: interpolate(fromBlack, [0, 1], [0, 1]) }} />
    </AbsoluteFill>
  );
};
