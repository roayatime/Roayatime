import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { useVideoConfig } from "remotion";
import { Atmosphere, CameraRig, useT } from "./core";
import { Island, Islets, MOODS, Mood, Lights, Ocean, Rain, Sky, Spray } from "./environment";
import { Landing, LighthouseStation, lighthouseTop } from "./lighthouse";

/** Engineering benchmark: one representative exterior (night storm establishing shot). */
export const Bench3D: React.FC<{ scale?: number; mood?: Mood }> = ({ scale = 1, mood = "night" }) => {
  const { width, height } = useVideoConfig();
  const { t } = useT();
  const top = lighthouseTop();
  const m = MOODS[mood];
  return (
    <div style={{ width, height, background: "#000" }}>
      <div style={{ width: Math.round(width * scale), height: Math.round(height * scale), transform: `scale(${1 / scale})`, transformOrigin: "0 0" }}>
        <ThreeCanvas width={Math.round(width * scale)} height={Math.round(height * scale)} shadows dpr={1}>
          <Atmosphere color={m.fog} density={m.fogD} />
          <CameraRig keys={[{ t: 0, pos: [330, 70, 300], look: [top[0], top[1] - 20, top[2]], fov: 34 }, { t: 10, pos: [260, 55, 240], look: [top[0], top[1] - 14, top[2]], fov: 30 }]} />
          <Sky mood={mood} />
          <Lights mood={mood} target={[top[0], 40, top[2]]} />
          <Ocean mood={mood} storm={1.4} />
          <Island wet={0.6} />
          <Islets />
          <LighthouseStation lampOn={1} beam={t * 1.2} lit={1} />
          <Landing side="east" />
          <Landing side="west" />
          <Spray at={[290, 0, 40]} />
          <Rain center={[420, 0, 360]} area={90} />
        </ThreeCanvas>
      </div>
    </div>
  );
};
