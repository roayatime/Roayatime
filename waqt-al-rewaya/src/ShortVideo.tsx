import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Bed, Cue, SoundDesign } from "./audio/SoundDesign";
import { Grain } from "./components/layers";
import { Captions, ReconstructionTag, TimedText } from "./components/text";
import { TEXT_FONT, TITLE_FONT } from "./fonts";
import { S04LightOut } from "./scenes/S04LightOut";
import { S05Ship } from "./scenes/S05Ship";
import { S06Door } from "./scenes/S06Door";
import { S07Standing } from "./scenes/S07Standing";
import { S08Vanished } from "./scenes/S08Vanished";
import { S09Question } from "./scenes/S09Question";
import { S10EndCard } from "./scenes/S10EndCard";
import { BEATS, PHRASES, SHORT_DURATION, SHORT_EXCERPTS, f, shortTime } from "./timeline";

const FadeIn: React.FC<{ frames: number; children: React.ReactNode }> = ({ frames, children }) => {
  const frame = useCurrentFrame();
  const opacity = frames > 0 ? interpolate(frame, [0, frames], [0, 1], { extrapolateRight: "clamp" }) : 1;
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

const v = (c: number) => {
  const t = shortTime(c);
  if (t === null) throw new Error(`narration time ${c} is not in the short`);
  return t;
};

// Shots in short-video time (s). t0 = narration time at the shot's first frame.
const END = SHORT_DURATION / 30;
const SHOTS = [
  { name: "C · Light goes out", from: 0, to: v(17.45), t0: 12.2 - SHORT_EXCERPTS[0].at, Comp: S04LightOut, fade: 0, extra: { label: false } },
  { name: "D · Ship arrival", from: v(17.45), to: v(25.75), t0: 17.45, Comp: S05Ship, fade: 18, extra: {} },
  { name: "E1 · Door", from: v(25.75), to: v(30.35), t0: 25.75, Comp: S06Door, fade: 12, extra: {} },
  { name: "E2 · Still standing", from: v(30.35), to: v(34.15), t0: 30.35, Comp: S07Standing, fade: 12, extra: {} },
  { name: "E3 · Vanished", from: v(34.15), to: 26.0, t0: 34.15, Comp: S08Vanished, fade: 12, extra: {} },
  { name: "F · Question", from: 26.0, to: 32.5, t0: SHORT_EXCERPTS[1].cFrom - (SHORT_EXCERPTS[1].at - 26.0), Comp: S09Question, fade: 14, extra: { flashAt: null } },
  { name: "End card", from: 32.5, to: END, t0: 0, Comp: S10EndCard, fade: 16, extra: { variant: "short" as const } },
];

const BEDS: Bed[] = [
  { name: "ocean", src: "ocean_bed.wav", keys: [[0, 0.2], [5.7, 0.14], [5.9, 0.2], [14.0, 0.15], [14.2, 0.08], [18.6, 0.1], [18.8, 0.2], [22.4, 0.15], [22.6, 0.08], [24.5, 0.05], [25.1, 0], [26.0, 0], [26.6, 0.2], [35, 0.2], [36, 0]] },
  { name: "wind", src: "wind_bed.wav", keys: [[0, 0.36], [5.7, 0.36], [5.9, 0.12], [14.0, 0.12], [14.2, 0.22], [18.6, 0.22], [18.8, 0.15], [22.4, 0.15], [22.6, 0.06], [25.1, 0], [26.0, 0], [26.6, 0.38], [35, 0.3], [36, 0]] },
  { name: "drone", src: "drone_bed.wav", keys: [[0, 0.15], [v(15.6), 0.3], [v(16.4), 0.15], [v(23), 0.2], [v(24.45), 0.28], [v(24.6), 0], [v(25.9), 0], [v(26.5), 0.22], [v(34.0), 0.3], [v(36.2), 0.38], [v(36.6), 0], [26.0, 0], [26.6, 0.25], [32.0, 0.38], [33.0, 0.3], [36, 0]] },
];

const CUES: Cue[] = [
  { name: "hook hit", src: "low_hit.wav", at: 0.0, volume: 0.5 },
  { name: "flame out", src: "flame_out.wav", at: v(BEATS.lightOut - 0.03), volume: 0.75 },
  { name: "ship whistle", src: "foghorn.wav", at: v(17.5), volume: 0.45 },
  { name: "riser", src: "riser.wav", at: v(BEATS.surprise - 4.06), volume: 0.3 },
  { name: "knocks", src: "knocks.wav", at: v(BEATS.knocks), volume: 0.85 },
  { name: "vanished hit", src: "low_hit.wav", at: v(36.62), volume: 0.55 },
  { name: "end hit", src: "low_hit.wav", at: 32.55, volume: 0.55 },
];

// Captions: only phrases fully inside an excerpt.
const CAPTIONS: TimedText[] = PHRASES.flatMap((p) => {
  const a = shortTime(p.start);
  const b = shortTime(p.end);
  return a === null || b === null ? [] : [{ text: p.text, start: a, end: b }];
});

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const o = interpolate(frame, [0, 0.4 * fps, 3.2 * fps, 3.9 * fps], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: height * 0.13, opacity: o }}>
      <div style={{ fontFamily: TITLE_FONT, fontWeight: 700, fontSize: 96, color: "#f1ebdf", direction: "rtl", textAlign: "center", lineHeight: 1.35, maxWidth: width * 0.86, textShadow: "0 4px 26px rgba(0,0,0,0.95)" }}>
        لغز منارة جزر فلانان
      </div>
      <div style={{ fontFamily: TEXT_FONT, fontWeight: 600, fontSize: 40, color: "#c9a86a", direction: "rtl", marginTop: 16, textShadow: "0 2px 12px rgba(0,0,0,0.95)" }}>
        اسكتلندا · ديسمبر ١٩٠٠
      </div>
    </AbsoluteFill>
  );
};

export const ShortVideo: React.FC = () => (
  <AbsoluteFill style={{ background: "black" }}>
    {SHOTS.map(({ name, from, to, t0, Comp, fade, extra }) => {
      const start = f(from) - fade;
      const dur = f(to) - f(from) + fade;
      return (
        <Sequence key={name} name={name} from={Math.max(0, start)} durationInFrames={dur} layout="absolute-fill">
          <FadeIn frames={fade}>
            <Comp t0={t0 - fade / 30} dur={dur / 30} {...extra} />
          </FadeIn>
        </Sequence>
      );
    })}
    <Sequence name="Reconstruction tag" from={f(4.0)} durationInFrames={f(32.5) - f(4.0)} layout="absolute-fill">
      <ReconstructionTag />
    </Sequence>
    <Sequence name="Hook" durationInFrames={f(4.0)} layout="absolute-fill">
      <Hook />
    </Sequence>
    <Captions items={CAPTIONS} />
    <Grain opacity={0.14} />
    {SHORT_EXCERPTS.map((e, i) => {
      const len = f(e.cTo) - f(e.cFrom);
      return (
        <Sequence key={i} name={`Narration excerpt ${i + 1}`} from={f(e.at)} durationInFrames={len} layout="none">
          <Audio
            src={staticFile("audio/narration_clean.wav")}
            trimBefore={f(e.cFrom)}
            trimAfter={f(e.cTo)}
            volume={(fr) => interpolate(fr, [0, 3, len - 4, len], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
          />
        </Sequence>
      );
    })}
    <SoundDesign beds={BEDS} cues={CUES} />
  </AbsoluteFill>
);
