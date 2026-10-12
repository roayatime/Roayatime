import React from "react";
import { Composition, Folder } from "remotion";
import FULL from "./data/full.json";
import TEASER from "./data/teaser.json";
import { Episode, EpisodeData } from "./Episode";
import { Thumbnail } from "./Thumbnail";

const F = FULL as unknown as EpisodeData;
const T = TEASER as unknown as EpisodeData;
const Full: React.FC = () => <Episode data={F} />;
const Teaser: React.FC = () => <Episode data={T} />;

export const FlannanCompositions: React.FC = () => (
  <Folder name="Flannan-Phase7">
    <Composition id="Flannan-Full-YouTube" component={Full} width={F.width} height={F.height} fps={F.fps} durationInFrames={F.frames} />
    <Composition id="Flannan-Vertical-Teaser" component={Teaser} width={T.width} height={T.height} fps={T.fps} durationInFrames={T.frames} />
    <Composition id="Flannan-Thumbnail" component={Thumbnail} width={1280} height={720} fps={30} durationInFrames={1} />
  </Folder>
);
