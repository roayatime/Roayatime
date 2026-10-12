import React from "react";
import { AbsoluteFill } from "remotion";
import { TEXT_FONT } from "../fonts";
import { BRAND } from "./theme";
import { ci, useLocal } from "./util";

export type Cue = { s: number; e: number; t: string };

/** Burned-in Arabic subtitles (RTL, max two lines). Cues are in composition seconds. */
export const Subtitles: React.FC<{ cues: Cue[]; offset?: number; big?: boolean }> = ({ cues, offset = 0, big }) => {
  const { s, W, H, portrait } = useLocal();
  const t = s + offset;
  const cue = cues.find((c) => t >= c.s && t < c.e);
  if (!cue) return null;
  const op = Math.min(ci(t, [cue.s, cue.s + 0.12], [0, 1]), ci(t, [cue.e - 0.1, cue.e], [1, 0]));
  const fs = portrait ? (big ? 66 : 58) : 46;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: portrait ? W * 0.08 : W * 0.12,
          right: portrait ? W * 0.08 : W * 0.12,
          ...(portrait ? { top: H * 0.66 } : { bottom: H * 0.075 }),
          display: "flex",
          justifyContent: "center",
          opacity: op,
        }}
      >
        <div
          style={{
            direction: "rtl",
            textAlign: "center",
            fontFamily: TEXT_FONT,
            fontWeight: 600,
            fontSize: fs,
            lineHeight: 1.45,
            color: BRAND.cream,
            padding: portrait ? "10px 26px 16px" : "6px 22px 12px",
            borderRadius: 10,
            background: "rgba(5,8,10,0.46)",
            textShadow: "0 2px 6px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,1)",
            maxWidth: portrait ? W * 0.84 : W * 0.72,
          }}
        >
          {cue.t}
        </div>
      </div>
    </AbsoluteFill>
  );
};
