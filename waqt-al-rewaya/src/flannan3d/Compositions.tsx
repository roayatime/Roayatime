import React from "react";
import { Composition, Folder } from "remotion";
import { Bench3D } from "./Bench";
import FULL from "./data/full3d.json";
import TEASER from "./data/teaser3d.json";
import { Episode3D, Episode3DData } from "./Episode3D";

const F = FULL as unknown as Episode3DData;
const T = TEASER as unknown as Episode3DData;
const Teaser: React.FC<{ scale?: number }> = ({ scale }) => <Episode3D data={{ ...T, scale: scale ?? T.scale }} />;
const Full: React.FC<{ scale?: number }> = ({ scale }) => <Episode3D data={{ ...F, scale: scale ?? F.scale }} />;

export const Flannan3DCompositions: React.FC = () => (
  <Folder name="Flannan-Phase10-3D">
    <Composition id="P10-Full-3D" component={Full} width={F.width} height={F.height} fps={F.fps} durationInFrames={F.frames} defaultProps={{ scale: 1 }} />
    <Composition id="P10-Vertical-3D" component={Teaser} width={T.width} height={T.height} fps={T.fps} durationInFrames={T.frames} defaultProps={{ scale: 1 }} />
    <Composition id="P10-Bench-1080" component={Bench3D} width={1920} height={1080} fps={30} durationInFrames={300} defaultProps={{ scale: 1 }} />
    <Composition id="P10-Bench-720" component={Bench3D} width={1920} height={1080} fps={30} durationInFrames={300} defaultProps={{ scale: 0.6667 }} />
  </Folder>
);
