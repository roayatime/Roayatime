import React from "react";
import { AbsoluteFill, Easing, Sequence, random } from "remotion";
import { Fog, Rain, Sea, Sky, Vignette, clampI } from "../components/layers";
import { Beam, Island, Lighthouse, islandTop, lanternCenter } from "../components/scenery";
import { InfoLabel } from "../components/text";
import { BEATS } from "../timeline";
import { Camera, SceneProps, useScene } from "./common";

/** Scene C: one night, the light goes out. */
export const S04LightOut: React.FC<SceneProps & { label?: boolean }> = ({ t0, dur, label = true }) => {
  const { s, c, W, H, portrait, fps } = useScene(t0);
  const horizonY = portrait ? 0.58 : 0.6;
  const g = portrait
    ? { left: -W * 0.25, baseY: H * horizonY + 4, w: W * 1.3, h: H * 0.13 }
    : { left: W * 0.12, baseY: H * horizonY + 4, w: W * 0.62, h: H * 0.22 };
  const lh = { x: g.left + g.w * 0.62, baseY: islandTop(g, 0.62) + 3, size: portrait ? H * 0.13 : H * 0.18 };
  const lc = lanternCenter(lh);

  // Light dies on "النور بيختفي": three stutters, then nothing.
  const k = c - BEATS.lightOut;
  let light = 1;
  if (k > 0) {
    const stutter = k < 0.55 ? (random(`st${Math.floor(k * 18)}`) > 0.45 ? 1 : 0.15) : 0;
    light = Math.min(stutter, clampI(k, [0, 0.9], [1, 0]));
  }
  // Darkness after the light dies; the last 0.7 s fade fully to black so the next scene rises out of it.
  const exposure = clampI(k, [0, 1.2], [1, 0.72]) * clampI(s, [dur - 0.7, dur - 0.05], [1, 0]);
  const push = clampI(s, [0, dur], [1.04, 1.16], Easing.inOut(Easing.sin));

  return (
    <AbsoluteFill style={{ background: "#030406" }}>
      <AbsoluteFill style={{ filter: `brightness(${exposure})` }}>
        <Camera scale={push} originX={lc.x} originY={lc.y}>
          <Sky top="#030407" horizon="#1d252d" horizonY={horizonY} drift={26} />
          <Sea horizonY={horizonY} tint="#141d26" haze="#1d252d" speed={40} brightness={0.5} glintX={lc.x} glint={0.3 * light} />
          <Island g={g} light={0.1 + 0.08 * light} seed="isl4" haze="rgba(20,26,32,0.3)" />
          <Lighthouse l={lh} light={light} day={0} id="lh4" />
          <Beam cx={lc.x} cy={lc.y} azimuth={(c / 6) * Math.PI * 2 + 2.2} intensity={light} length={portrait ? W * 0.9 : W * 0.55} id="b4" />
          <Fog y={H * horizonY - H * 0.05} height={H * 0.3} strength={0.4} speed={30} seed={5} />
        </Camera>
        <Rain count={portrait ? 140 : 190} opacity={0.24} angle={16} speed={3000} />
      </AbsoluteFill>
      <Vignette strength={0.85} />
      {label ? (
        <Sequence from={Math.round(0.3 * fps)} durationInFrames={Math.round(3.2 * fps)} layout="absolute-fill">
          <InfoLabel lines={["ديسمبر ١٩٠٠"]} dur={Math.round(3.2 * fps)} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
