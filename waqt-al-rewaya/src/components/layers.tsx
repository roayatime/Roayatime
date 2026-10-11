import React from "react";
import { AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

export const tex = (name: string) => staticFile(`textures/${name}`);

const mod = (a: number, n: number) => ((a % n) + n) % n;

/** Horizontally (and optionally vertically) tiled <Img>, scrolled by offsetX/offsetY. */
export const TiledImage: React.FC<{
  src: string;
  tileW: number;
  tileH: number;
  offsetX?: number;
  offsetY?: number;
  top?: number;
  height?: number;
  opacity?: number;
  blend?: React.CSSProperties["mixBlendMode"];
  filter?: string;
  repeatY?: boolean;
  /** Fade the layer's top/bottom edges (fraction of its height) so tiles never show a hard edge. */
  fadeEdges?: [number, number];
}> = ({ src, tileW, tileH, offsetX = 0, offsetY = 0, top = 0, height, opacity = 1, blend, filter, repeatY, fadeEdges }) => {
  const { width, height: H } = useVideoConfig();
  const h = height ?? H;
  const cols = Math.ceil(width / tileW) + 1;
  const rows = repeatY ? Math.ceil(h / tileH) + 1 : 1;
  const ox = -mod(offsetX, tileW);
  const oy = repeatY ? -mod(offsetY, tileH) : offsetY;
  const tiles: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      tiles.push(
        <Img
          key={`${r}-${c}`}
          src={src}
          style={{ position: "absolute", left: ox + c * tileW, top: oy + r * tileH, width: tileW + 1, height: tileH + 1 }}
        />,
      );
    }
  }
  const mask = fadeEdges
    ? `linear-gradient(180deg, transparent 0%, black ${fadeEdges[0] * 100}%, black ${100 - fadeEdges[1] * 100}%, transparent 100%)`
    : undefined;
  return (
    <div style={{ position: "absolute", left: 0, top, width, height: h, overflow: "hidden", opacity, mixBlendMode: blend, filter, maskImage: mask, WebkitMaskImage: mask }}>
      {tiles}
    </div>
  );
};

/** Animated film grain + gentle exposure flicker. */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.16 }) => {
  const frame = useCurrentFrame();
  const flicker = 1 + (random(`flick-${frame}`) - 0.5) * 0.03;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <TiledImage
        src={tex("grain.png")}
        tileW={512}
        tileH={512}
        repeatY
        offsetX={random(`gx-${frame}`) * 512}
        offsetY={random(`gy-${frame}`) * 512}
        opacity={opacity}
        blend="overlay"
      />
      <AbsoluteFill style={{ backgroundColor: "black", opacity: Math.max(0, 1 - flicker) * 2 }} />
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.75 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,${strength}) 100%)`,
      pointerEvents: "none",
    }}
  />
);

/** Cinematic letterbox, landscape only. */
export const Letterbox: React.FC = () => {
  const { width, height } = useVideoConfig();
  if (height > width) return null;
  const bar = Math.round((height - width / 2.2) / 2);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: bar, background: "#000" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: bar, background: "#000" }} />
    </AbsoluteFill>
  );
};

/** Wind-driven rain streaks (deterministic). */
export const Rain: React.FC<{ count?: number; opacity?: number; angle?: number; speed?: number }> = ({
  count = 140,
  opacity = 0.25,
  angle = 12,
  speed = 2600,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame / fps;
  const drops = [];
  for (let i = 0; i < count; i++) {
    const len = 30 + random(`rl${i}`) * 60;
    const span = height + len * 2;
    const y = mod(random(`ry${i}`) * span + t * speed * (0.7 + random(`rs${i}`) * 0.6), span) - len;
    const x = random(`rx${i}`) * (width + 300) - 150 + y * Math.tan((angle * Math.PI) / 180);
    drops.push(
      <line
        key={i}
        x1={x}
        y1={y}
        x2={x - len * Math.sin((angle * Math.PI) / 180)}
        y2={y - len}
        stroke="rgba(200,215,230,1)"
        strokeWidth={1 + random(`rw${i}`) * 1.2}
        opacity={0.3 + random(`ro${i}`) * 0.7}
      />,
    );
  }
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, opacity }}>
      {drops}
    </svg>
  );
};

/** Sky gradient + two parallax cloud decks. */
export const Sky: React.FC<{
  top: string;
  horizon: string;
  horizonY: number;
  clouds?: string;
  clouds2?: string;
  drift?: number;
  cloudOpacity?: number;
  flash?: number;
}> = ({ top, horizon, horizonY, clouds = "clouds_storm.png", clouds2 = "clouds_low.png", drift = 14, cloudOpacity = 1, flash = 0 }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const skyH = height * horizonY;
  // Deck 1 covers the whole sky; deck 2 is a lower, faster band near the horizon.
  const h1 = skyH * 1.15;
  const w1 = Math.max(h1 * 2.5, width * 1.2);
  const h2 = skyH * 0.6;
  const w2 = Math.max(h2 * 2.5, width * 1.2);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${top} 0%, ${horizon} ${horizonY * 100}%, ${horizon} 100%)` }} />
      <TiledImage src={tex(clouds)} tileW={w1} tileH={h1} height={h1} top={-skyH * 0.1} offsetX={t * drift} opacity={cloudOpacity} fadeEdges={[0, 0.3]} />
      <TiledImage src={tex(clouds2)} tileW={w2} tileH={h2} height={h2} top={skyH - h2 * 0.85} offsetX={t * drift * 2.2 + 600} opacity={cloudOpacity * 0.75} fadeEdges={[0.35, 0.35]} />
      {flash > 0 ? <AbsoluteFill style={{ background: "rgba(190,205,230,1)", mixBlendMode: "screen", opacity: flash }} /> : null}
    </AbsoluteFill>
  );
};

/** Ocean surface as a perspective plane scrolling toward camera. */
export const Sea: React.FC<{ horizonY: number; tint: string; haze?: string; speed?: number; brightness?: number; glintX?: number; glint?: number }> = ({
  horizonY,
  tint,
  haze,
  speed = 40,
  brightness = 0.8,
  glintX,
  glint = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const top = Math.round(height * horizonY);
  const h = height - top;
  const planeW = width * 3;
  const planeH = h * 4;
  const tileW = 900;
  const tileH = 450;
  const ox = t * 8;
  const oy = t * speed;
  const cols = Math.ceil(planeW / tileW) + 1;
  const rows = Math.ceil(planeH / tileH) + 1;
  const tiles = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      tiles.push(
        <Img
          key={`${r}-${c}`}
          src={tex("sea.png")}
          style={{
            position: "absolute",
            left: -mod(ox, tileW) + c * tileW,
            top: mod(oy, tileH) - tileH + r * tileH,
            width: tileW + 1,
            height: tileH + 1,
          }}
        />,
      );
    }
  }
  return (
    <div style={{ position: "absolute", left: 0, top, width, height: h, overflow: "hidden", perspective: h * 0.9, perspectiveOrigin: "50% 0%" }}>
      <div
        style={{
          position: "absolute",
          left: (width - planeW) / 2,
          top: 0,
          width: planeW,
          height: planeH,
          transformOrigin: "50% 0%",
          transform: "rotateX(72deg)",
          filter: `brightness(${brightness})`,
          overflow: "hidden",
        }}
      >
        {tiles}
      </div>
      <AbsoluteFill style={{ background: tint, mixBlendMode: "multiply" }} />
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${haze ?? tint} 0%, rgba(0,0,0,0) 22%)`, opacity: 0.9 }} />
      {glint > 0 && glintX !== undefined ? (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse ${width * 0.08}px ${h * 0.9}px at ${glintX}px 0px, rgba(220,230,240,0.55), rgba(0,0,0,0) 70%)`,
            mixBlendMode: "screen",
            opacity: glint,
          }}
        />
      ) : null}
    </div>
  );
};

/** Drifting fog band. y/height in px; strength 0..1. */
export const Fog: React.FC<{ y: number; height: number; strength: number; speed?: number; seed?: number; tint?: string }> = ({
  y,
  height,
  strength,
  speed = 18,
  seed = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const tileW = height * (2048 / 768);
  return (
    <>
      <TiledImage src={tex("fog_a.png")} tileW={tileW} tileH={height} top={y} height={height} offsetX={t * speed + seed * 700} opacity={strength} blend="screen" fadeEdges={[0.2, 0.2]} />
      <TiledImage
        src={tex("fog_b.png")}
        tileW={tileW * 1.3}
        tileH={height * 0.8}
        top={y + height * 0.25}
        height={height}
        offsetX={-t * speed * 0.6 + seed * 300}
        opacity={strength * 0.8}
        blend="screen"
        fadeEdges={[0.2, 0.2]}
      />
    </>
  );
};

/** A shape filled with a tiled texture, clipped to an SVG path (px coords). */
export const TexturedShape: React.FC<{
  path: string;
  src: string;
  tile: number;
  children?: React.ReactNode;
  filter?: string;
}> = ({ path, src, tile, children, filter }) => {
  const { width, height } = useVideoConfig();
  return (
    <div style={{ position: "absolute", inset: 0, clipPath: `path('${path}')`, filter }}>
      <TiledImage src={src} tileW={tile} tileH={tile} repeatY height={height} />
      {children}
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }} />
    </div>
  );
};

/** Ease helper: clamp-interpolate in seconds of the current sequence. */
export const useSec = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

export const clampI = (x: number, inR: number[], outR: number[], easing?: (t: number) => number) =>
  interpolate(x, inR, outR, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });
