import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import "../fonts";
import { S02Keeper } from "../scenes/S02Keeper";
import { S05Ship } from "../scenes/S05Ship";
import { S06Door } from "../scenes/S06Door";
import { S08Vanished } from "../scenes/S08Vanished";
import { Bug, EndCard, LogoReveal } from "./Brand";
import { Checklist, ChapterOverlay, HookOverlay, LowerThird, Statement } from "./scenes/Cards";
import { Beds, Hearth, Kitchen, LanternReady } from "./scenes/Interiors";
import { Keepers, Memorial } from "./scenes/Keepers";
import { IslandChart, Landing } from "./scenes/Landing";
import { MapScene } from "./scenes/MapScene";
import { Seascape } from "./scenes/Seascape";
import { MythFact, TimelineScene } from "./scenes/TimelineScene";
import { Cue, Subtitles } from "./Subtitles";
import { useLocal } from "./util";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type SceneSpec = { type: string; from: number; dur: number; xf?: number; p?: any; note?: string };
export type OverlaySpec = { type: "chapter" | "lower" | "bug" | "hook"; from: number; dur: number; p?: any };
export type EpisodeData = { width: number; height: number; fps: number; frames: number; scenes: SceneSpec[]; overlays: OverlaySpec[]; cues: Cue[]; subsBig?: boolean };

const Old = (C: React.FC<{ t0: number; dur: number }>) => {
  const W: React.FC<{ p: any; dur: number }> = ({ dur }) => <C t0={9999} dur={dur} />;
  return W;
};
const REG: Record<string, React.FC<{ p: any; dur: number }>> = {
  sea: ({ p }) => <Seascape p={p} />,
  map: ({ p }) => <MapScene p={p} />,
  statement: ({ p }) => <Statement p={p} />,
  checklist: ({ p }) => <Checklist p={p} />,
  keepers: ({ p }) => <Keepers p={p} />,
  memorial: ({ p }) => <Memorial p={p} />,
  kitchen: ({ p }) => <Kitchen p={p ?? {}} />,
  beds: ({ p }) => <Beds p={p ?? {}} />,
  hearth: ({ p }) => <Hearth p={p ?? {}} />,
  lantern: ({ p }) => <LanternReady p={p ?? {}} />,
  keeper: Old(S02Keeper),
  door: Old(S06Door),
  hooks: Old(S08Vanished),
  ship: ({ dur }) => <S05Ship t0={9999} dur={dur} label={false} />,
  chart: ({ p }) => <IslandChart p={p ?? {}} />,
  landing: ({ p }) => <Landing p={p ?? {}} />,
  timeline: ({ p }) => <TimelineScene p={p} />,
  myth: ({ p }) => <MythFact p={p} />,
  logo: ({ p }) => <LogoReveal title={p?.title} sub={p?.sub} />,
  end: ({ p }) => <EndCard lines={p?.lines} credits={p?.credits} cta={p?.cta} />,
  black: () => <AbsoluteFill style={{ background: "#000" }} />,
};

const FadeIn: React.FC<{ frames: number; children: React.ReactNode }> = ({ frames, children }) => {
  const f = useCurrentFrame();
  const o = frames > 0 ? Math.min(1, f / frames) : 1;
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

const SubsLayer: React.FC<{ cues: Cue[]; big?: boolean }> = ({ cues, big }) => {
  useLocal();
  return <Subtitles cues={cues} big={big} />;
};

export const Episode: React.FC<{ data: EpisodeData }> = ({ data }) => (
  <AbsoluteFill style={{ background: "#000" }}>
    {data.scenes.map((sc, i) => {
      const C = REG[sc.type];
      const xf = sc.xf ?? 12;
      const next = data.scenes[i + 1];
      const tail = next ? (next.xf ?? 12) : 0;
      if (!C) throw new Error(`unknown scene type ${sc.type}`);
      return (
        <Sequence key={i} from={sc.from} durationInFrames={sc.dur + tail} name={`${i}:${sc.type}${sc.note ? " " + sc.note : ""}`}>
          <FadeIn frames={i === 0 ? 0 : xf}>
            <C p={sc.p} dur={(sc.dur + tail) / data.fps} />
          </FadeIn>
        </Sequence>
      );
    })}
    {data.overlays.map((o, i) => (
      <Sequence key={`o${i}`} from={o.from} durationInFrames={o.dur} name={`overlay:${o.type}`}>
        {o.type === "hook" ? <HookOverlay title={o.p.title} sub={o.p.sub} /> : o.type === "chapter" ? <ChapterOverlay num={o.p.num} title={o.p.title} /> : o.type === "lower" ? <LowerThird title={o.p.title} sub={o.p.sub} /> : <Bug opacity={o.p?.opacity} />}
      </Sequence>
    ))}
    <SubsLayer cues={data.cues} big={data.subsBig} />
  </AbsoluteFill>
);
