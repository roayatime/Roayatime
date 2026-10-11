import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import { Fog, Rain, Sea, Sky, Vignette, clampI } from "../components/layers";
import { Island, Lighthouse, islandTop } from "../components/scenery";
import { Camera, SceneProps, useScene } from "./common";

export const THUNDER_AT = 40.35; // narration time of the single lightning flash

/** Scene F: the dark lighthouse in the storm while the real question is asked. */
export const S09Question: React.FC<SceneProps & { flashAt?: number | null }> = ({ t0, dur, flashAt = THUNDER_AT }) => {
  const { s, c, W, H, portrait } = useScene(t0);
  const horizonY = portrait ? 0.64 : 0.7;
  const g = portrait
    ? { left: -W * 0.35, baseY: H * horizonY + 4, w: W * 1.7, h: H * 0.2 }
    : { left: W * 0.2, baseY: H * horizonY + 4, w: W * 0.6, h: H * 0.2 };
  const lh = { x: g.left + g.w * 0.6, baseY: islandTop(g, 0.6) + 3, size: portrait ? H * 0.2 : H * 0.22 };
  const pull = clampI(s, [0, dur], [1.3, 1.0], Easing.out(Easing.quad));
  const rise = clampI(s, [0, dur], [portrait ? 60 : 40, 0], Easing.out(Easing.quad));
  let flash = 0;
  if (flashAt !== null) {
    const k = c - flashAt;
    if (k >= 0 && k < 0.6) flash = (k < 0.08 ? 0.55 : k > 0.16 && k < 0.24 ? 0.35 : 0) * (1 - k / 0.6);
  }
  return (
    <AbsoluteFill style={{ background: "#020304" }}>
      <Camera scale={pull} y={rise} originX={lh.x} originY={lh.baseY}>
        <Sky top="#020305" horizon="#161d24" horizonY={horizonY} drift={30} flash={flash} />
        <Sea horizonY={horizonY} tint="#0f171e" haze="#161d24" speed={46} brightness={0.5 + flash} />
        <Island g={g} light={0.06 + flash * 0.6} seed="isl9" />
        <Lighthouse l={lh} light={0} day={flash > 0.2 ? 1 : 0} id="lh9" />
        <Fog y={H * horizonY - H * 0.1} height={H * 0.36} strength={0.38} speed={36} seed={13} />
      </Camera>
      <Rain count={portrait ? 160 : 220} opacity={0.26} angle={20} speed={3200} />
      <Vignette strength={0.9} />
    </AbsoluteFill>
  );
};
