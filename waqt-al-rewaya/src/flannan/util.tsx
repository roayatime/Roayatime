import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export const ci = (x: number, i: number[], o: number[], easing?: (t: number) => number) =>
  interpolate(x, i, o, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });
export const EIO = Easing.inOut(Easing.sin);
export const EOUT = Easing.out(Easing.cubic);

/** Local scene clock in seconds plus frame geometry. */
export const useLocal = () => {
  const f = useCurrentFrame();
  const { fps, width: W, height: H, durationInFrames } = useVideoConfig();
  return { s: f / fps, f, W, H, fps, portrait: H > W, D: durationInFrames / fps };
};

/** Beat helper: 0 before t, ramps to 1 over `len` seconds. */
export const beat = (s: number, t: number | undefined, len = 0.6, easing = EOUT) => (t === undefined ? 0 : ci(s, [t, t + len], [0, 1], easing));

/** Generic "camera" wrapper: scale/translate/rotate around an origin. */
export const Cam: React.FC<{ scale?: number; x?: number; y?: number; rot?: number; ox?: number; oy?: number; children: React.ReactNode }> = ({
  scale = 1, x = 0, y = 0, rot = 0, ox = 50, oy = 50, children,
}) => (
  <AbsoluteFill style={{ transformOrigin: `${ox}% ${oy}%`, transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${rot}deg)` }}>{children}</AbsoluteFill>
);

/** Cheap colour grade: teal shadows + warm highlights via two blended gradients (no CSS filters). */
export const Grade: React.FC<{ strength?: number; warm?: number }> = ({ strength = 1, warm = 0.5 }) => (
  <>
    <AbsoluteFill style={{ background: "rgba(10,59,66,1)", mixBlendMode: "soft-light", opacity: 0.35 * strength, pointerEvents: "none" }} />
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, rgba(242,194,123,${0.10 * warm}) 0%, rgba(0,0,0,0) 60%)`, mixBlendMode: "screen", pointerEvents: "none" }} />
  </>
);

export const arabicDigits = (n: number | string) => String(n).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
