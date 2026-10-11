import React from "react";
import { Audio } from "@remotion/media";
import { Sequence, interpolate, staticFile, useVideoConfig } from "remotion";

export type Bed = { name: string; src: string; keys: [number, number][] };
/** A complete sound-design layer for one composition: ambience beds + one-shot cues (never the narration). */
export type Mix = { beds: Bed[]; cues: Cue[] };

/**
 * Available mixes. "narration-first" (default since V2): the voice alone under the narration, with
 * at most a brief ambience intro that has fully faded out before the first word. "cinematic" is the
 * V1 continuous sound design, kept so it can be re-enabled later with --props='{"mix":"cinematic"}'.
 */
export const MIX_IDS = ["narration-first", "cinematic"] as const;
export type MixId = (typeof MIX_IDS)[number];
export const SELECTED_MIX: MixId = "narration-first";
export type Cue = { name: string; src: string; at: number; volume: number };

/** Volume automation from [seconds, gain] keyframes (composition time). */
const automation = (keys: [number, number][], fps: number) => (f: number) =>
  interpolate(
    f / fps,
    keys.map((k) => k[0]),
    keys.map((k) => k[1]),
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

export const SoundDesign: React.FC<Mix> = ({ beds, cues }) => {
  const { fps } = useVideoConfig();
  return (
    <>
      {beds.map((b) => {
        // A bed whose last keyframe is silent is removed from the timeline there (not just muted).
        const [lastT, lastV] = b.keys[b.keys.length - 1];
        const dur = lastV === 0 ? Math.ceil(lastT * fps) + 1 : undefined;
        return (
          <Sequence key={b.name} name={`Bed: ${b.name}`} durationInFrames={dur} layout="none">
            <Audio src={staticFile(`sfx/${b.src}`)} volume={automation(b.keys, fps)} />
          </Sequence>
        );
      })}
      {cues.map((c, i) => (
        <Sequence key={`${c.name}-${i}`} name={`SFX: ${c.name}`} from={Math.round(c.at * fps)} layout="none">
          <Audio src={staticFile(`sfx/${c.src}`)} volume={c.volume} />
        </Sequence>
      ))}
    </>
  );
};

/** Shift keyframes/cues authored in narration time into composition time. */
export const shiftKeys = (keys: [number, number][], by: number): [number, number][] => keys.map(([t, v]) => [t + by, v]);
