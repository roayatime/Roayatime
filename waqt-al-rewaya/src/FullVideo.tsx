import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Bed, Cue, Mix, MixId, SELECTED_MIX, SoundDesign, shiftKeys } from "./audio/SoundDesign";
import { Grain, Letterbox } from "./components/layers";
import { Captions, ReconstructionTag } from "./components/text";
import { S01Island } from "./scenes/S01Island";
import { S02Keeper } from "./scenes/S02Keeper";
import { S03Beam } from "./scenes/S03Beam";
import { S04LightOut } from "./scenes/S04LightOut";
import { S05Ship } from "./scenes/S05Ship";
import { S06Door } from "./scenes/S06Door";
import { S07Standing } from "./scenes/S07Standing";
import { S08Vanished } from "./scenes/S08Vanished";
import { S09Question, THUNDER_AT } from "./scenes/S09Question";
import { S10EndCard } from "./scenes/S10EndCard";
import { SceneProps } from "./scenes/common";
import { BEATS, FULL_OFFSET as N, FULL_SCENES, PHRASES, f } from "./timeline";

const FadeIn: React.FC<{ frames: number; children: React.ReactNode }> = ({ frames, children }) => {
  const frame = useCurrentFrame();
  const opacity = frames > 0 ? interpolate(frame, [0, frames], [0, 1], { extrapolateRight: "clamp" }) : 1;
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

type Shot = { name: string; key: keyof typeof FULL_SCENES; Comp: React.FC<SceneProps>; fade: number };

// fade = crossfade frames into this shot (it starts `fade` frames before the cut point).
const SHOTS: Shot[] = [
  { name: "A · Island + title", key: "island", Comp: S01Island, fade: 0 },
  { name: "B1 · Keeper", key: "keeper", Comp: S02Keeper, fade: 14 },
  { name: "B2 · Beam over sea", key: "beam", Comp: S03Beam, fade: 14 },
  { name: "C · Light goes out", key: "lightOut", Comp: S04LightOut, fade: 14 },
  { name: "D · Ship arrival", key: "ship", Comp: S05Ship, fade: 20 },
  { name: "E1 · Door", key: "door", Comp: S06Door, fade: 12 },
  { name: "E2 · Still standing", key: "standing", Comp: S07Standing, fade: 12 },
  { name: "E3 · Vanished", key: "vanished", Comp: S08Vanished, fade: 12 },
  { name: "F · Question", key: "question", Comp: S09Question, fade: 18 },
  { name: "End card", key: "endCard", Comp: S10EndCard, fade: 20 },
];

// ---- V1 "cinematic" sound design, authored in narration time (c) and shifted by N ----
const CINEMATIC_BEDS: Bed[] = [
  {
    name: "ocean",
    src: "ocean_bed.wav",
    keys: [[-5, 0], [-3.5, 0.3], [4.2, 0.3], [4.6, 0.12], [8.6, 0.12], [8.9, 0.28], [15.7, 0.28], [16.6, 0.14], [17.4, 0.14], [17.6, 0.22], [25.6, 0.18], [25.9, 0.08], [30.3, 0.1], [30.5, 0.2], [34.1, 0.16], [34.3, 0.08], [36.2, 0.06], [36.7, 0], [38.0, 0], [39.0, 0.2], [49, 0.24], [54.5, 0.2], [55.5, 0]],
  },
  {
    name: "wind",
    src: "wind_bed.wav",
    keys: [[-5, 0], [-3.5, 0.35], [4.2, 0.35], [4.6, 0.22], [8.6, 0.22], [8.9, 0.32], [12.0, 0.36], [17.4, 0.36], [17.6, 0.12], [25.6, 0.12], [25.9, 0.22], [30.3, 0.22], [30.5, 0.15], [34.1, 0.15], [34.3, 0.06], [36.2, 0.04], [36.7, 0], [38.0, 0], [39.0, 0.38], [49, 0.32], [55.5, 0]],
  },
  {
    name: "drone",
    src: "drone_bed.wav",
    keys: [[-5, 0], [-2, 0.12], [11.5, 0.12], [15.6, 0.3], [16.4, 0.15], [23, 0.2], [24.45, 0.28], [24.6, 0], [25.9, 0], [26.5, 0.22], [34.0, 0.3], [36.2, 0.38], [36.6, 0], [38.0, 0], [39.5, 0.2], [48.4, 0.38], [49.5, 0.3], [55.5, 0]],
  },
].map((b) => ({ ...b, keys: shiftKeys(b.keys as [number, number][], N) }));

const CINEMATIC_CUES: Cue[] = [
  { name: "opening whoosh", src: "whoosh.wav", at: -4.8, volume: 0.25 },
  { name: "title hit", src: "low_hit.wav", at: -3.7, volume: 0.45 },
  { name: "flame out", src: "flame_out.wav", at: BEATS.lightOut - 0.03, volume: 0.75 },
  { name: "ship whistle", src: "foghorn.wav", at: 17.5, volume: 0.45 },
  { name: "riser", src: "riser.wav", at: BEATS.surprise - 4.06, volume: 0.3 },
  { name: "knocks", src: "knocks.wav", at: BEATS.knocks, volume: 0.85 },
  { name: "vanished hit", src: "low_hit.wav", at: 36.62, volume: 0.55 },
  { name: "thunder", src: "low_hit.wav", at: THUNDER_AT, volume: 0.3 },
  { name: "end hit", src: "low_hit.wav", at: FULL_SCENES.endCard.from + 0.05, volume: 0.6 },
].map((c) => ({ ...c, at: c.at + N }));

// ---- V2 "narration-first": ambience only during the title, silent before the first word ----
// Ocean fades in over 0.6 s, holds, and is at zero by 4.4 s; the soft foghorn (0.5 s) is fully
// decayed by ~3.5 s. Narration starts at N = 5.0 s; from then on only the cleaned narration plays.
const NARRATION_FIRST: Mix = {
  beds: [{ name: "ocean (title only)", src: "ocean_bed.wav", keys: [[0, 0], [0.6, 0.2], [2.8, 0.2], [4.4, 0]] }],
  cues: [{ name: "distant foghorn (title only)", src: "foghorn_soft.wav", at: 0.5, volume: 0.16 }],
};

const MIXES: Record<MixId, Mix> = {
  "narration-first": NARRATION_FIRST,
  cinematic: { beds: CINEMATIC_BEDS, cues: CINEMATIC_CUES },
};

export const FullVideo: React.FC<{ mix?: MixId }> = ({ mix = SELECTED_MIX }) => {
  const tagFrom = f(N + 0.2);
  const tagTo = f(N + FULL_SCENES.endCard.from);
  return (
    <AbsoluteFill style={{ background: "black" }}>
      {SHOTS.map(({ name, key, Comp, fade }) => {
        const sc = FULL_SCENES[key];
        const from = f(N + sc.from) - fade;
        const dur = f(sc.to - sc.from) + fade;
        return (
          <Sequence key={key} name={name} from={from} durationInFrames={dur} layout="absolute-fill">
            <FadeIn frames={fade}>
              <Comp t0={sc.from - fade / 30} dur={dur / 30} />
            </FadeIn>
          </Sequence>
        );
      })}
      <Sequence name="Reconstruction tag" from={tagFrom} durationInFrames={tagTo - tagFrom} layout="absolute-fill">
        <ReconstructionTag />
      </Sequence>
      <Letterbox />
      <Captions items={PHRASES.map((p) => ({ ...p, start: p.start + N, end: p.end + N }))} />
      <Grain opacity={0.14} />
      <Sequence name="Narration (cleaned)" from={f(N)} layout="none">
        <Audio src={staticFile("audio/narration_clean.wav")} />
      </Sequence>
      <SoundDesign {...MIXES[mix]} />
    </AbsoluteFill>
  );
};
