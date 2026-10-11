import React from "react";
import { AbsoluteFill, Easing, Sequence } from "remotion";
import { Fog, Sea, Sky, Vignette, clampI } from "../components/layers";
import { Island, Lighthouse, Ship, islandTop } from "../components/scenery";
import { InfoLabel } from "../components/text";
import { BEATS } from "../timeline";
import { Camera, SceneProps, useScene } from "./common";

/** Scene D: days later, the relief vessel approaches through the fog (grey winter daylight). */
export const S05Ship: React.FC<SceneProps & { label?: boolean }> = ({ t0, dur, label = true }) => {
  const { s, c, W, H, portrait, fps } = useScene(t0);
  const horizonY = portrait ? 0.56 : 0.6;
  const g = portrait
    ? { left: W * 0.35, baseY: H * horizonY + 4, w: W * 0.95, h: H * 0.1 }
    : { left: W * 0.58, baseY: H * horizonY + 4, w: W * 0.5, h: H * 0.2 };
  const lh = { x: g.left + g.w * 0.6, baseY: islandTop(g, 0.6) + 3, size: portrait ? H * 0.09 : H * 0.15 };
  const L = portrait ? W * 0.55 : W * 0.34;
  const shipX = clampI(s, [0, dur], portrait ? [-W * 0.16, W * 0.06] : [W * 0.02, W * 0.2]);
  const pan = clampI(s, [0, dur], [0, portrait ? -W * 0.06 : -W * 0.03], Easing.inOut(Easing.sin));
  // On "لكن المفاجأة" the camera eases in toward the island.
  const push = clampI(c, [BEATS.surprise - 0.4, BEATS.surprise + 1.4], [1, 1.07], Easing.inOut(Easing.cubic));
  const fogLift = clampI(s, [0, dur], [0.75, 0.55]);
  return (
    <AbsoluteFill style={{ background: "#5a6166" }}>
      <Camera scale={push} x={pan} originX={lh.x} originY={lh.baseY}>
        <Sky top="#4a5257" horizon="#8b9295" horizonY={horizonY} clouds="clouds_dawn.png" clouds2="clouds_dawn.png" drift={8} cloudOpacity={0.8} />
        <Sea horizonY={horizonY} tint="#5d686d" haze="#8b9295" speed={18} brightness={0.95} />
        <Fog y={H * horizonY - H * 0.22} height={H * 0.36} strength={fogLift} speed={10} seed={7} />
        <Island g={g} light={0.75} seed="isl5" haze="rgba(139,146,149,0.55)" />
        <Lighthouse l={lh} light={0} day={1} id="lh5" />
        <Fog y={H * horizonY - H * 0.1} height={H * 0.3} strength={fogLift * 0.8} speed={16} seed={8} />
        <Ship x={shipX} y={H * horizonY + H * 0.03} L={L} t={s} color="#23292d" smoke="rgba(70,74,78,0.5)" />
        <Fog y={H * horizonY - H * 0.02} height={H * 0.4} strength={0.5} speed={26} seed={9} />
      </Camera>
      <AbsoluteFill style={{ background: "rgba(150,158,162,0.12)" }} />
      <Vignette strength={0.55} />
      {label ? (
        <Sequence from={Math.round(0.5 * fps)} durationInFrames={Math.round(4.2 * fps)} layout="absolute-fill">
          <InfoLabel lines={["٢٦ ديسمبر ١٩٠٠", "سفينة الإمداد «هسبيروس» تصل إلى الجزيرة"]} dur={Math.round(4.2 * fps)} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
