import React from "react";
import { Composition, Folder } from "remotion";
import "./fonts";
import { SELECTED_MIX } from "./audio/SoundDesign";
import { FullVideo } from "./FullVideo";
import { FlannanCompositions } from "./flannan/Compositions";
import { Flannan3DCompositions } from "./flannan3d/Compositions";
import { ShortVideo } from "./ShortVideo";
import { S01Island } from "./scenes/S01Island";
import { S02Keeper } from "./scenes/S02Keeper";
import { S03Beam } from "./scenes/S03Beam";
import { S04LightOut } from "./scenes/S04LightOut";
import { S05Ship } from "./scenes/S05Ship";
import { S06Door } from "./scenes/S06Door";
import { S07Standing } from "./scenes/S07Standing";
import { S08Vanished } from "./scenes/S08Vanished";
import { S09Question } from "./scenes/S09Question";
import { S10EndCard } from "./scenes/S10EndCard";
import { SceneProps } from "./scenes/common";
import { FPS, FULL_DURATION, FULL_OFFSET, FULL_SCENES, SHORT_DURATION } from "./timeline";

const SCENES: { id: string; key: keyof typeof FULL_SCENES; Comp: React.FC<SceneProps> }[] = [
  { id: "S01-Island", key: "island", Comp: S01Island },
  { id: "S02-Keeper", key: "keeper", Comp: S02Keeper },
  { id: "S03-Beam", key: "beam", Comp: S03Beam },
  { id: "S04-LightOut", key: "lightOut", Comp: S04LightOut },
  { id: "S05-Ship", key: "ship", Comp: S05Ship },
  { id: "S06-Door", key: "door", Comp: S06Door },
  { id: "S07-Standing", key: "standing", Comp: S07Standing },
  { id: "S08-Vanished", key: "vanished", Comp: S08Vanished },
  { id: "S09-Question", key: "question", Comp: S09Question },
  { id: "S10-EndCard", key: "endCard", Comp: S10EndCard },
];

const sceneComps = (suffix: string, width: number, height: number) =>
  SCENES.map(({ id, key, Comp }) => {
    const sc = FULL_SCENES[key];
    const dur = sc.to - sc.from;
    return (
      <Composition
        key={id + suffix}
        id={id + suffix}
        component={Comp}
        width={width}
        height={height}
        fps={FPS}
        durationInFrames={Math.round(dur * FPS)}
        defaultProps={{ t0: sc.from, dur }}
      />
    );
  });

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="WaqtAlRewaya-Flannan-Full" component={FullVideo} width={1920} height={1080} fps={FPS} durationInFrames={FULL_DURATION} defaultProps={{ mix: SELECTED_MIX }} />
    <Composition id="WaqtAlRewaya-Flannan-Short" component={ShortVideo} width={1080} height={1920} fps={FPS} durationInFrames={SHORT_DURATION} defaultProps={{ mix: SELECTED_MIX }} />
    <FlannanCompositions />
    <Flannan3DCompositions />
    <Folder name="Scenes-Landscape">{sceneComps("", 1920, 1080)}</Folder>
    <Folder name="Scenes-Portrait">{sceneComps("-V", 1080, 1920)}</Folder>
  </>
);

// Title sequence length, exported for documentation tooling.
export const TITLE_SECONDS = FULL_OFFSET;
