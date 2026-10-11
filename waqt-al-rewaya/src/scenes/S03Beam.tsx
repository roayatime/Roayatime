import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import { Fog, Rain, Sea, Sky, Vignette, clampI } from "../components/layers";
import { Beam, Lighthouse, Ship, lanternCenter } from "../components/scenery";
import { Camera, SceneProps, useScene } from "./common";

/** Scene B2: the beam sweeps the sea so passing ships can find their way. */
export const S03Beam: React.FC<SceneProps> = ({ t0, dur }) => {
  const { s, c, W, H, portrait } = useScene(t0);
  const horizonY = portrait ? 0.5 : 0.56;
  // Low angle on the tower top, filling one side of the frame.
  const lh = portrait ? { x: W * 0.2, baseY: H * 0.98, size: H * 0.62 } : { x: W * 0.16, baseY: H * 1.42, size: H * 1.25 };
  const lc = lanternCenter(lh);
  const shipX = clampI(s, [0, dur], portrait ? [W * 0.52, W * 0.62] : [W * 0.6, W * 0.68]);
  const tilt = clampI(s, [0, dur], [18, -10], Easing.inOut(Easing.sin));
  return (
    <AbsoluteFill style={{ background: "#05070a" }}>
      <Camera scale={1.04} y={tilt} originX={W / 2} originY={H / 2}>
        <Sky top="#030507" horizon="#1f2830" horizonY={horizonY} drift={22} />
        <Sea horizonY={horizonY} tint="#16212b" haze="#1f2830" speed={34} brightness={0.55} glintX={W * 0.6} glint={0.15} />
        <Ship x={shipX} y={H * horizonY + 6} L={portrait ? W * 0.18 : W * 0.075} t={s} color="#0b0e11" smoke="rgba(40,44,48,0.4)" />
        <Fog y={H * horizonY - H * 0.08} height={H * 0.2} strength={0.3} speed={20} seed={3} />
        <Lighthouse l={lh} light={1} day={0} id="lh3" />
        <Beam cx={lc.x} cy={lc.y} azimuth={(c / 6) * Math.PI * 2 + 0.6} intensity={1} length={portrait ? W * 1.1 : W * 0.95} id="b3" />
      </Camera>
      <Rain count={portrait ? 120 : 160} opacity={0.22} angle={14} />
      <Vignette strength={0.8} />
    </AbsoluteFill>
  );
};
