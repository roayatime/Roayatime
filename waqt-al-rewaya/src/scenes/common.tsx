import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

export type SceneProps = {
  /** Narration time (s) at which this scene starts; lets scenes sync story beats. */
  t0: number;
  /** Scene length in seconds (excluding the crossfade into the next scene). */
  dur: number;
};

export const useScene = (t0: number) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const s = frame / fps;
  return { s, c: t0 + s, W: width, H: height, portrait: height > width, fps, frame };
};

/** Camera move: scales/translates the world around an anchor point. */
export const Camera: React.FC<{
  scale: number;
  x?: number;
  y?: number;
  originX: number;
  originY: number;
  children: React.ReactNode;
}> = ({ scale, x = 0, y = 0, originX, originY, children }) => (
  <AbsoluteFill style={{ transformOrigin: `${originX}px ${originY}px`, scale: String(scale), translate: `${x}px ${y}px` }}>{children}</AbsoluteFill>
);
