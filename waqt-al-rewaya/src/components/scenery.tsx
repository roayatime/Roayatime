import React from "react";
import { random, useVideoConfig } from "remotion";
import { TexturedShape, tex } from "./layers";

// ----- Island (stylized reconstruction of a steep, flat-topped Atlantic islet) -----

const PROFILE: [number, number][] = [
  [0, 0], [0.008, 0.22], [0.02, 0.48], [0.035, 0.6], [0.06, 0.66], [0.1, 0.69], [0.16, 0.74], [0.24, 0.79],
  [0.32, 0.83], [0.4, 0.88], [0.48, 0.93], [0.56, 0.97], [0.62, 1.0], [0.69, 0.98], [0.76, 0.93], [0.83, 0.88],
  [0.89, 0.83], [0.93, 0.76], [0.955, 0.6], [0.972, 0.38], [0.986, 0.16], [1, 0],
];

const profileY = (u: number) => {
  for (let i = 1; i < PROFILE.length; i++) {
    const [x0, y0] = PROFILE[i - 1];
    const [x1, y1] = PROFILE[i];
    if (u <= x1) return y0 + ((u - x0) / (x1 - x0)) * (y1 - y0);
  }
  return 0;
};

export type IslandGeom = { left: number; baseY: number; w: number; h: number };

export const islandTop = (g: IslandGeom, u: number) => g.baseY - profileY(u) * g.h;

const islandPath = (g: IslandGeom, seed: string, inset = 0) => {
  const pts: string[] = [];
  const n = 160;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const steep = Math.abs(profileY(Math.min(1, u + 0.01)) - profileY(Math.max(0, u - 0.01))) * 50;
    const jag = (random(`${seed}${i}`) - 0.5) * g.h * (0.02 + 0.07 * Math.min(1, steep));
    pts.push(`${(g.left + u * g.w).toFixed(1)} ${(islandTop(g, u) + jag + inset).toFixed(1)}`);
  }
  return `M ${g.left} ${g.baseY + 4} L ${pts.join(" L ")} L ${g.left + g.w} ${g.baseY + 4} Z`;
};

const turfPath = (g: IslandGeom, seed: string) => {
  const top: string[] = [];
  const bottom: string[] = [];
  const n = 60;
  for (let i = 0; i <= n; i++) {
    const u = 0.1 + (i / n) * 0.78;
    const y = islandTop(g, u) - 1;
    top.push(`${(g.left + u * g.w).toFixed(1)} ${y.toFixed(1)}`);
    const d = g.h * (0.06 + 0.05 * random(`${seed}t${i}`));
    bottom.unshift(`${(g.left + u * g.w).toFixed(1)} ${(y + d).toFixed(1)}`);
  }
  return `M ${top.join(" L ")} L ${bottom.join(" L ")} Z`;
};

/** Textured island silhouette. `light` 0 (night) .. 1 (overcast day). */
export const Island: React.FC<{ g: IslandGeom; light: number; seed?: string; haze?: string }> = ({ g, light, seed = "isl", haze }) => {
  const { width, height } = useVideoConfig();
  const brightness = 0.25 + light * 0.75;
  return (
    <>
      <TexturedShape path={islandPath(g, seed)} src={tex("rock.png")} tile={700}>
        <div style={{ position: "absolute", inset: 0, background: "#000", opacity: 1 - brightness }} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(180deg, rgba(0,0,0,0) ${((g.baseY - g.h) / height) * 100}%, rgba(0,0,0,0.65) ${(g.baseY / height) * 100}%)`,
          }}
        />
      </TexturedShape>
      <TexturedShape path={turfPath(g, seed)} src={tex("turf.png")} tile={600}>
        <div style={{ position: "absolute", inset: 0, background: "#000", opacity: 1 - brightness * 0.9 }} />
      </TexturedShape>
      {haze ? (
        <div style={{ position: "absolute", inset: 0, clipPath: `path('${islandPath(g, seed)}')`, background: haze }} />
      ) : null}
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        {/* surf line where the cliffs meet the sea */}
        <path d={`M ${g.left - 10} ${g.baseY} L ${g.left + g.w + 10} ${g.baseY}`} stroke="rgba(210,220,225,0.35)" strokeWidth={g.h * 0.02} filter="blur(4px)" />
      </svg>
    </>
  );
};

// ----- Lighthouse -----

export type LighthouseGeom = { x: number; baseY: number; size: number };

export const lanternCenter = (l: LighthouseGeom) => ({ x: l.x, y: l.baseY - l.size * 0.86 });

/** Stylized short stone tower with attached keepers' building. Not a depiction of a specific photograph. */
export const Lighthouse: React.FC<{ l: LighthouseGeom; light: number; day: number; id?: string }> = ({ l, light, day, id = "lh" }) => {
  const { width, height } = useVideoConfig();
  const s = l.size;
  const tw = s * 0.26; // tower width at base
  const tt = s * 0.2; // tower width at top
  const towerTop = l.baseY - s * 0.74;
  const wall = day > 0.5 ? ["#9a9c98", "#cfd0ca"] : ["#1c1f22", "#3a3d40"];
  const lc = lanternCenter(l);
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id={`${id}-wall`} x1="0" x2="1">
          <stop offset="0" stopColor={wall[0]} />
          <stop offset="0.65" stopColor={wall[1]} />
          <stop offset="1" stopColor={wall[0]} />
        </linearGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor="rgba(255,236,190,1)" />
          <stop offset="0.25" stopColor="rgba(255,214,150,0.55)" />
          <stop offset="1" stopColor="rgba(255,200,120,0)" />
        </radialGradient>
      </defs>
      {/* keepers' building around the tower base */}
      <path
        d={`M ${l.x - s * 0.55} ${l.baseY} L ${l.x - s * 0.55} ${l.baseY - s * 0.16} L ${l.x - s * 0.5} ${l.baseY - s * 0.2} L ${l.x + s * 0.42} ${l.baseY - s * 0.2} L ${l.x + s * 0.47} ${l.baseY - s * 0.16} L ${l.x + s * 0.47} ${l.baseY} Z`}
        fill={`url(#${id}-wall)`}
        opacity={0.92}
      />
      <rect x={l.x - s * 0.45} y={l.baseY - s * 0.235} width={s * 0.04} height={s * 0.05} fill={wall[0]} />
      <rect x={l.x + s * 0.3} y={l.baseY - s * 0.235} width={s * 0.04} height={s * 0.05} fill={wall[0]} />
      {[-0.42, -0.3, 0.22, 0.34].map((k) => (
        <rect key={k} x={l.x + s * k} y={l.baseY - s * 0.13} width={s * 0.05} height={s * 0.07} fill={day > 0.5 ? "#2b2e30" : "#0c0d0f"} />
      ))}
      {/* tower */}
      <path d={`M ${l.x - tw / 2} ${l.baseY - s * 0.15} L ${l.x - tt / 2} ${towerTop} L ${l.x + tt / 2} ${towerTop} L ${l.x + tw / 2} ${l.baseY - s * 0.15} Z`} fill={`url(#${id}-wall)`} />
      {/* gallery */}
      <rect x={l.x - tt * 0.72} y={towerTop - s * 0.025} width={tt * 1.44} height={s * 0.03} fill={day > 0.5 ? "#2a2c2e" : "#0d0e10"} />
      <path
        d={Array.from({ length: 9 })
          .map((_, i) => `M ${l.x - tt * 0.68 + (i * tt * 1.36) / 8} ${towerTop - s * 0.025} l 0 ${-s * 0.035}`)
          .join(" ")}
        stroke={day > 0.5 ? "#2a2c2e" : "#0d0e10"}
        strokeWidth={Math.max(1, s * 0.004)}
      />
      <rect x={l.x - tt * 0.68} y={towerTop - s * 0.062} width={tt * 1.36} height={Math.max(1, s * 0.005)} fill={day > 0.5 ? "#2a2c2e" : "#0d0e10"} />
      {/* lantern glazing */}
      <rect
        x={l.x - tt * 0.42}
        y={towerTop - s * 0.13}
        width={tt * 0.84}
        height={s * 0.105}
        fill={light > 0.02 ? `rgba(255,${200 + 30 * light},${130 + 60 * light},${0.25 + 0.75 * light})` : day > 0.5 ? "#3d4447" : "#0b0d10"}
      />
      {[0.25, 0.5, 0.75].map((k) => (
        <rect key={k} x={l.x - tt * 0.42 + tt * 0.84 * k} y={towerTop - s * 0.13} width={Math.max(1, s * 0.004)} height={s * 0.105} fill="#111" />
      ))}
      {/* dome + ventilator */}
      <path d={`M ${l.x - tt * 0.5} ${towerTop - s * 0.128} Q ${l.x} ${towerTop - s * 0.2} ${l.x + tt * 0.5} ${towerTop - s * 0.128} Z`} fill={day > 0.5 ? "#2b2f31" : "#0a0b0d"} />
      <circle cx={l.x} cy={towerTop - s * 0.19} r={s * 0.012} fill={day > 0.5 ? "#2b2f31" : "#0a0b0d"} />
      {/* lantern glow */}
      {light > 0.01 ? (
        <circle cx={lc.x} cy={lc.y} r={s * 0.5} fill={`url(#${id}-glow)`} opacity={light} style={{ mixBlendMode: "screen" }} />
      ) : null}
    </svg>
  );
};

/** Rotating optic: two opposed beams, azimuth in radians (0 = pointing at camera). */
export const Beam: React.FC<{ cx: number; cy: number; azimuth: number; intensity: number; length: number; id?: string }> = ({
  cx,
  cy,
  azimuth,
  intensity,
  length,
  id = "beam",
}) => {
  const { width, height } = useVideoConfig();
  if (intensity <= 0.001) return null;
  const beams = [azimuth, azimuth + Math.PI].map((a, i) => {
    const side = Math.sin(a);
    const toward = Math.cos(a);
    const len = length * (0.15 + 0.85 * Math.abs(side)) ;
    const spread = 14 + len * 0.07 + Math.max(0, toward) * length * 0.05;
    const ex = cx + Math.sign(side || 1) * len;
    const ey = cy + len * 0.02;
    const op = intensity * (0.35 + 0.65 * (1 - Math.abs(toward) * 0.6));
    return (
      <g key={i}>
        <defs>
          <linearGradient id={`${id}-g${i}`} gradientUnits="userSpaceOnUse" x1={cx} y1={cy} x2={ex} y2={ey}>
            <stop offset="0" stopColor="rgba(255,240,205,0.95)" />
            <stop offset="0.35" stopColor="rgba(240,232,210,0.4)" />
            <stop offset="1" stopColor="rgba(220,225,230,0)" />
          </linearGradient>
        </defs>
        <path d={`M ${cx} ${cy - 3} L ${ex} ${ey - spread} L ${ex} ${ey + spread} L ${cx} ${cy + 3} Z`} fill={`url(#${id}-g${i})`} opacity={op} filter={`url(#${id}-blur)`} />
      </g>
    );
  });
  const flare = Math.max(0, Math.cos(azimuth), Math.cos(azimuth + Math.PI)) ** 10;
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, mixBlendMode: "screen" }}>
      <defs>
        <filter id={`${id}-blur`} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation={6} />
        </filter>
        <radialGradient id={`${id}-flare`}>
          <stop offset="0" stopColor="rgba(255,245,220,1)" />
          <stop offset="0.2" stopColor="rgba(255,225,170,0.5)" />
          <stop offset="1" stopColor="rgba(255,210,150,0)" />
        </radialGradient>
      </defs>
      {beams}
      <circle cx={cx} cy={cy} r={length * 0.22} fill={`url(#${id}-flare)`} opacity={intensity * (0.3 + flare * 0.7)} />
      <ellipse cx={cx} cy={cy} rx={length * 0.35} ry={length * 0.012} fill={`url(#${id}-flare)`} opacity={intensity * flare * 0.8} />
    </svg>
  );
};

// ----- Steamer (stylized 1900s lighthouse tender silhouette) -----

export const Ship: React.FC<{ x: number; y: number; L: number; t: number; color?: string; smoke?: string }> = ({ x, y, L, t, color = "#15191d", smoke = "rgba(60,64,68,0.55)" }) => {
  const { width, height } = useVideoConfig();
  const h = L * 0.075;
  const roll = Math.sin(t * 0.9) * 0.6;
  const bob = Math.sin(t * 1.3) * L * 0.004;
  const puffs = Array.from({ length: 9 }).map((_, i) => {
    const age = ((t * 0.35 + i / 9) % 1);
    return (
      <circle
        key={i}
        cx={L * 0.47 - age * L * 0.45}
        cy={-h - L * 0.2 - age * L * 0.09}
        r={L * (0.018 + age * 0.05)}
        fill={smoke}
        opacity={(1 - age) * 0.8}
      />
    );
  });
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <filter id="smokeblur">
          <feGaussianBlur stdDeviation={L * 0.012} />
        </filter>
      </defs>
      <g transform={`translate(${x} ${y + bob}) rotate(${roll})`}>
        <g filter="url(#smokeblur)">{puffs}</g>
        {/* masts and stays */}
        <g stroke={color} strokeWidth={Math.max(1, L * 0.004)}>
          <line x1={L * 0.24} y1={-h} x2={L * 0.23} y2={-h - L * 0.36} />
          <line x1={L * 0.78} y1={-h} x2={L * 0.79} y2={-h - L * 0.34} />
          <line x1={L * 0.23} y1={-h - L * 0.36} x2={L * 0.08} y2={-h} strokeWidth={Math.max(0.5, L * 0.001)} opacity={0.6} />
          <line x1={L * 0.79} y1={-h - L * 0.34} x2={L * 0.96} y2={-h * 1.25} strokeWidth={Math.max(0.5, L * 0.001)} opacity={0.6} />
          <line x1={L * 0.23} y1={-h - L * 0.12} x2={L * 0.36} y2={-h - L * 0.06} />
        </g>
        {/* funnel */}
        <path d={`M ${L * 0.45} ${-h - L * 0.05} L ${L * 0.462} ${-h - L * 0.2} L ${L * 0.5} ${-h - L * 0.2} L ${L * 0.49} ${-h - L * 0.05} Z`} fill={color} />
        {/* deckhouse + bridge */}
        <rect x={L * 0.36} y={-h - L * 0.05} width={L * 0.26} height={L * 0.05} fill={color} />
        <rect x={L * 0.58} y={-h - L * 0.09} width={L * 0.08} height={L * 0.09} fill={color} />
        <rect x={L * 0.565} y={-h - L * 0.094} width={L * 0.11} height={L * 0.008} fill={color} />
        {/* hull */}
        <path d={`M 0 ${-h} L ${L * 0.97} ${-h * 1.3} L ${L} ${-h * 1.3} L ${L * 0.94} 0 L ${L * 0.06} 0 Q ${L * 0.005} ${-h * 0.2} 0 ${-h} Z`} fill={color} />
        {/* portholes, faintly lit */}
        {[0.3, 0.38, 0.46, 0.54, 0.62, 0.7].map((k) => (
          <circle key={k} cx={L * k} cy={-h * 0.6} r={L * 0.0045} fill="rgba(255,220,160,0.35)" />
        ))}
        {/* bow wave */}
        <path d={`M ${L * 0.9} 0 Q ${L * 1.0} ${-h * 0.2} ${L * 1.05} ${h * 0.25}`} stroke="rgba(200,210,215,0.35)" strokeWidth={L * 0.006} fill="none" />
      </g>
    </svg>
  );
};

/** Back-view silhouette of a keeper in a peaked cap and long coat (drawn in a 200x600 box). */
export const KeeperSilhouette: React.FC<{ x: number; y: number; scale: number; rim: number }> = ({ x, y, scale, rim }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <defs>
      <linearGradient id="keeper-rim" x1="0" x2="1">
        <stop offset="0" stopColor="#060708" />
        <stop offset="0.78" stopColor="#0d0d0f" />
        <stop offset="1" stopColor={`rgba(${120 + 80 * rim},${80 + 50 * rim},${40 + 20 * rim},1)`} />
      </linearGradient>
    </defs>
    <path
      d="M 86 98 C 84 110 60 112 44 122 C 32 132 30 170 32 210 L 34 330 Q 36 342 46 340 L 44 470 L 70 472 L 70 586 L 96 588 L 98 474 L 104 474 L 106 588 L 132 586 L 132 472 L 156 470 L 154 340 Q 164 342 166 330 L 168 210 C 170 170 168 132 156 122 C 140 112 116 110 114 98 Z"
      fill="url(#keeper-rim)"
    />
    <circle cx={100} cy={74} r={25} fill="url(#keeper-rim)" />
    <path d="M 72 60 L 75 38 Q 100 28 125 38 L 128 60 Z" fill="url(#keeper-rim)" />
    <ellipse cx={100} cy={60} rx={33} ry={6} fill="#060708" />
  </g>
);
