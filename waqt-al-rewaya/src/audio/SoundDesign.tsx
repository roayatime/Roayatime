import React from "react";
import { Audio } from "@remotion/media";
import { Sequence, interpolate, staticFile, useVideoConfig } from "remotion";

export type Bed = { name: string; src: string; keys: [number, number][] };
export type Cue = { name: string; src: string; at: number; volume: number };

/** Volume automation from [seconds, gain] keyframes (composition time). */
const automation = (keys: [number, number][], fps: number) => (f: number) =>
  interpolate(
    f / fps,
    keys.map((k) => k[0]),
    keys.map((k) => k[1]),
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

export const SoundDesign: React.FC<{ beds: Bed[]; cues: Cue[] }> = ({ beds, cues }) => {
  const { fps } = useVideoConfig();
  return (
    <>
      {beds.map((b) => (
        <Sequence key={b.name} name={`Bed: ${b.name}`} layout="none">
          <Audio src={staticFile(`sfx/${b.src}`)} volume={automation(b.keys, fps)} />
        </Sequence>
      ))}
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
