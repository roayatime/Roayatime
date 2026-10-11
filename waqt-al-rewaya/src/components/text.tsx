import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { TEXT_FONT, TITLE_FONT } from "../fonts";

export type TimedText = { start: number; end: number; text: string };

const isPortrait = (w: number, h: number) => h > w;

/** Turns phrase timings into on-screen windows (lead-in, hold, no overlap). */
export const captionWindows = (items: TimedText[]): TimedText[] =>
  items.map((p, i) => {
    const next = items[i + 1];
    const start = p.start - 0.08;
    let end = Math.max(p.end + 0.45, start + 0.9);
    if (next) end = Math.min(end, next.start - 0.1);
    return { ...p, start, end };
  });

const CaptionLine: React.FC<{ text: string; dur: number }> = ({ text, dur }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const portrait = isPortrait(width, height);
  const opacity = interpolate(frame, [0, 4, dur - 6, dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bar = portrait ? 0 : Math.round((height - width / 2.2) / 2);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", pointerEvents: "none" }}>
      <div
        style={{
          marginBottom: portrait ? height * 0.24 : bar + height * 0.035,
          maxWidth: portrait ? width * 0.84 : width * 0.72,
          textAlign: "center",
          direction: "rtl",
          fontFamily: TEXT_FONT,
          fontWeight: 600,
          fontSize: portrait ? 58 : 46,
          lineHeight: 1.65,
          color: "#f3efe6",
          textShadow: "0 2px 6px rgba(0,0,0,0.95), 0 0 24px rgba(0,0,0,0.8)",
          opacity,
          translate: `0 ${interpolate(frame, [0, 6], [6, 0], { extrapolateRight: "clamp" })}px`,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

export const Captions: React.FC<{ items: TimedText[] }> = ({ items }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {captionWindows(items).map((c, i) => {
        const from = Math.round(c.start * fps);
        const dur = Math.max(1, Math.round(c.end * fps) - from);
        return (
          <Sequence key={i} from={from} durationInFrames={dur} name={`Caption ${i + 1}`} layout="absolute-fill">
            <CaptionLine text={c.text} dur={dur} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

/** Persistent disclosure that the imagery is a reconstruction, not archival footage. */
export const ReconstructionTag: React.FC = () => {
  const { width, height } = useVideoConfig();
  const portrait = isPortrait(width, height);
  const bar = portrait ? 0 : Math.round((height - width / 2.2) / 2);
  return (
    <div
      style={{
        position: "absolute",
        top: portrait ? height * 0.07 : bar + 24,
        left: portrait ? 64 : 40,
        fontFamily: TEXT_FONT,
        fontWeight: 400,
        fontSize: portrait ? 26 : 20,
        color: "rgba(235,230,220,0.62)",
        direction: "rtl",
        letterSpacing: 0.5,
        textShadow: "0 1px 4px rgba(0,0,0,0.9)",
      }}
    >
      مشاهد تمثيلية · إعادة بناء بصري
    </div>
  );
};

/** Small documentary label (place / date), fades in and out within its sequence. */
export const InfoLabel: React.FC<{ lines: string[]; dur: number }> = ({ lines, dur }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const portrait = isPortrait(width, height);
  const bar = portrait ? 0 : Math.round((height - width / 2.2) / 2);
  const opacity = interpolate(frame, [0, 20, dur - 20, dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        top: portrait ? height * 0.12 : bar + 60,
        right: portrait ? 64 : 80,
        direction: "rtl",
        textAlign: "right",
        opacity,
        borderRight: "2px solid rgba(201,168,106,0.85)",
        paddingRight: 18,
      }}
    >
      {lines.map((l, i) => (
        <div
          key={i}
          style={{
            fontFamily: i === 0 ? TITLE_FONT : TEXT_FONT,
            fontWeight: i === 0 ? 700 : 400,
            fontSize: (portrait ? 1.25 : 1) * (i === 0 ? 44 : 24),
            color: i === 0 ? "#efe7d6" : "rgba(225,220,210,0.8)",
            lineHeight: 1.5,
            textShadow: "0 2px 8px rgba(0,0,0,0.9)",
          }}
        >
          {l}
        </div>
      ))}
    </div>
  );
};

/** Word-by-word reveal for Arabic titles (whole words, so letter joining is never broken). */
export const RevealWords: React.FC<{ text: string; startFrame: number; perWord: number; style: React.CSSProperties }> = ({
  text,
  startFrame,
  perWord,
  style,
}) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  return (
    <div style={{ direction: "rtl", ...style }}>
      {words.map((w, i) => {
        const s = startFrame + i * perWord;
        const p = interpolate(frame, [s, s + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <span key={i} style={{ display: "inline-block", opacity: p, filter: `blur(${(1 - p) * 8}px)`, translate: `0 ${(1 - p) * 14}px` }}>
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </div>
  );
};
