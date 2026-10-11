import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import { Fog, TexturedShape, TiledImage, Vignette, clampI, tex } from "../components/layers";
import { BEATS } from "../timeline";
import { Camera, SceneProps, useScene } from "./common";

const KNOCKS = [0, 0.42, 0.84];

/** Scene E1: the closed door of the keepers' quarters. Nobody answers. */
export const S06Door: React.FC<SceneProps> = ({ t0, dur }) => {
  const { s, c, W, H, portrait } = useScene(t0);
  const doorW = portrait ? W * 0.46 : W * 0.17;
  const doorH = portrait ? H * 0.42 : H * 0.6;
  const dx = W / 2 - doorW / 2;
  const groundY = portrait ? H * 0.74 : H * 0.84;
  const dy = groundY - doorH;
  const push = clampI(s, [0, dur], [1.0, 1.14], Easing.inOut(Easing.sin));
  // Tiny camera jolt on each knock.
  let jolt = 0;
  for (const k of KNOCKS) {
    const d = c - (BEATS.knocks + k);
    if (d >= 0 && d < 0.18) jolt += Math.sin(d * 90) * (1 - d / 0.18) * 2.5;
  }
  const doorPath = `M ${dx} ${groundY} L ${dx} ${dy + doorW * 0.18} Q ${dx + doorW / 2} ${dy - doorW * 0.08} ${dx + doorW} ${dy + doorW * 0.18} L ${dx + doorW} ${groundY} Z`;
  const frame = 0.09 * doorW;
  const framePath = `M ${dx - frame} ${groundY} L ${dx - frame} ${dy + doorW * 0.16} Q ${dx + doorW / 2} ${dy - doorW * 0.2} ${dx + doorW + frame} ${dy + doorW * 0.16} L ${dx + doorW + frame} ${groundY} Z`;
  const winX = portrait ? W * 0.8 : W * 0.72;
  const winW = portrait ? W * 0.16 : W * 0.08;
  return (
    <AbsoluteFill style={{ background: "#6b7174" }}>
      <Camera scale={push} y={jolt} originX={W / 2} originY={dy + doorH * 0.45}>
        <TiledImage src={tex("plaster.png")} tileW={900} tileH={900} repeatY filter="brightness(0.78) contrast(1.05)" />
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(70,78,84,0.35), rgba(30,34,36,0.5))" }} />
        <TexturedShape path={framePath} src={tex("rock.png")} tile={400} filter="brightness(1.3) grayscale(0.4)" />
        <TexturedShape path={doorPath} src={tex("wood.png")} tile={500} filter="brightness(0.65) saturate(0.7)">
          <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
            {[0.25, 0.5, 0.75].map((k) => (
              <line key={k} x1={dx + doorW * k} y1={dy} x2={dx + doorW * k} y2={groundY} stroke="rgba(10,6,3,0.55)" strokeWidth={3} />
            ))}
            <rect x={dx} y={dy + doorH * 0.3} width={doorW} height={doorH * 0.03} fill="rgba(10,6,3,0.5)" />
            <rect x={dx} y={dy + doorH * 0.72} width={doorW} height={doorH * 0.03} fill="rgba(10,6,3,0.5)" />
            <circle cx={dx + doorW * 0.86} cy={dy + doorH * 0.55} r={doorW * 0.025} fill="#1b1a17" />
            <rect x={dx} y={dy} width={doorW} height={doorH} fill="url(#door-shade)" />
            <defs>
              <linearGradient id="door-shade" x1="0" x2="1">
                <stop offset="0" stopColor="rgba(0,0,0,0.5)" />
                <stop offset="0.5" stopColor="rgba(0,0,0,0.1)" />
                <stop offset="1" stopColor="rgba(0,0,0,0.45)" />
              </linearGradient>
            </defs>
          </svg>
        </TexturedShape>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {/* dark, unlit window */}
          <rect x={winX - 8} y={dy + doorH * 0.12 - 8} width={winW + 16} height={winW * 1.4 + 16} fill="#8d8f88" />
          <rect x={winX} y={dy + doorH * 0.12} width={winW} height={winW * 1.4} fill="#16191b" />
          <line x1={winX + winW / 2} y1={dy + doorH * 0.12} x2={winX + winW / 2} y2={dy + doorH * 0.12 + winW * 1.4} stroke="#8d8f88" strokeWidth={5} />
          <line x1={winX} y1={dy + doorH * 0.12 + winW * 0.7} x2={winX + winW} y2={dy + doorH * 0.12 + winW * 0.7} stroke="#8d8f88" strokeWidth={5} />
          {/* stone step */}
          <rect x={dx - doorW * 0.25} y={groundY} width={doorW * 1.5} height={H * 0.03} fill="#4b4d4c" />
        </svg>
        <TiledImage src={tex("turf.png")} tileW={700} tileH={350} top={groundY + H * 0.03} height={H - groundY} repeatY filter="brightness(0.7)" />
      </Camera>
      <Fog y={H * 0.25} height={H * 0.5} strength={0.35} speed={24} seed={4} />
      <Fog y={H * 0.55} height={H * 0.5} strength={0.45} speed={34} seed={6} />
      <AbsoluteFill style={{ background: "rgba(120,130,136,0.18)" }} />
      <Vignette strength={0.7} />
    </AbsoluteFill>
  );
};
