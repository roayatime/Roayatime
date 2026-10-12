import React from "react";
import { AbsoluteFill } from "remotion";
import { Grain, TiledImage, Vignette, tex } from "../../components/layers";
import { TEXT_FONT, TITLE_FONT } from "../../fonts";
import MAP from "../data/scotland_map.json";
import { BRAND } from "../theme";
import { EIO, EOUT, ci, useLocal } from "../util";

type XY = [number, number];
export type MapP = {
  night?: boolean;
  /** camera keyframes: t (s), centre (km), visible width (km) */
  cam: { t: number; c: XY; w: number }[];
  labels?: { text: string; at: XY | string; t?: number; size?: number; dx?: number; dy?: number; dim?: boolean }[];
  markers?: { at: XY | string; t?: number; pulse?: boolean; dark?: boolean; dimAt?: number }[];
  routes?: { pts: (XY | string)[]; t0: number; t1: number; dashed?: boolean; color?: string }[];
  stamp?: { text: string; sub?: string; t?: number };
  scaleBar?: boolean;
  illustrativeTag?: boolean;
};

const PL = MAP.places as unknown as Record<string, XY>;
const pt = (a: XY | string): XY => (typeof a === "string" ? PL[a] : a);
// Flannan Isles are below Natural Earth's resolution: drawn as an illustrative cluster at their true position.
const FL = PL.flannan;
const FLANNAN_ISLETS: { dx: number; dy: number; rx: number; ry: number; rot: number }[] = [
  { dx: 0, dy: 0, rx: 0.42, ry: 0.22, rot: -20 },
  { dx: -1.3, dy: 0.5, rx: 0.22, ry: 0.12, rot: 10 },
  { dx: 1.1, dy: -0.6, rx: 0.2, ry: 0.11, rot: 30 },
  { dx: -0.5, dy: -1.4, rx: 0.16, ry: 0.1, rot: 0 },
  { dx: 2.2, dy: 0.9, rx: 0.14, ry: 0.08, rot: -40 },
  { dx: -2.4, dy: -0.4, rx: 0.13, ry: 0.08, rot: 15 },
  { dx: 0.8, dy: 1.6, rx: 0.12, ry: 0.07, rot: 0 },
];

export const MapScene: React.FC<{ p: MapP }> = ({ p }) => {
  const { s, W, H, portrait } = useLocal();
  const cams = p.cam;
  let c: XY = cams[0].c, w = cams[0].w;
  for (let i = 0; i < cams.length - 1; i++) {
    const a = cams[i], b = cams[i + 1];
    if (s >= a.t) {
      const u = ci(s, [a.t, b.t], [0, 1], EIO);
      // zoom in log space for a natural feel
      w = Math.exp(Math.log(a.w) + (Math.log(b.w) - Math.log(a.w)) * u);
      c = [a.c[0] + (b.c[0] - a.c[0]) * u, a.c[1] + (b.c[1] - a.c[1]) * u];
    }
  }
  const h = (w * H) / W;
  const vb = `${c[0] - w / 2} ${c[1] - h / 2} ${w} ${h}`;
  const toScr = (q: XY): XY => [((q[0] - (c[0] - w / 2)) / w) * W, ((q[1] - (c[1] - h / 2)) / h) * H];
  const night = !!p.night;
  const land = night ? "#1d2a2e" : "#cbb98f";
  const landEdge = night ? "rgba(140,190,195,0.55)" : "rgba(70,52,30,0.85)";
  const sea = night ? "#071419" : "#9fb3ad";
  const kmPerPx = w / W;
  // graticule every 1 degree (lon) / 0.5 degree (lat), in projected km
  const grat: React.ReactNode[] = [];
  for (let lon = -14; lon <= 2; lon += 1) {
    const x = (lon + 6) * 111.32 * Math.cos((58 * Math.PI) / 180);
    grat.push(<line key={`lo${lon}`} x1={x} y1={-800} x2={x} y2={800} />);
  }
  for (let lat = 53; lat <= 62; lat += 0.5) {
    const y = -(lat - 58) * 110.57;
    grat.push(<line key={`la${lat}`} x1={-800} y1={y} x2={800} y2={y} />);
  }
  return (
    <AbsoluteFill style={{ background: sea }}>
      {/* paper / deep-sea tone */}
      <AbsoluteFill style={{ background: night ? "radial-gradient(ellipse at 50% 45%, rgba(20,127,139,0.18), rgba(0,0,0,0.6) 85%)" : "radial-gradient(ellipse at 50% 45%, rgba(255,250,235,0.35), rgba(80,60,30,0.45) 95%)" }} />
      {!night ? <TiledImage src={tex("plaster.png")} tileW={900} tileH={900} repeatY opacity={0.35} blend="multiply" /> : null}
      <svg width={W} height={H} viewBox={vb} style={{ position: "absolute", inset: 0 }}>
        <g stroke={night ? "rgba(120,180,190,0.12)" : "rgba(60,50,35,0.18)"} strokeWidth={1} vectorEffect="non-scaling-stroke" style={{ vectorEffect: "non-scaling-stroke" }}>
          {grat.map((g, i) => React.cloneElement(g as React.ReactElement<React.SVGProps<SVGLineElement>>, { key: i, vectorEffect: "non-scaling-stroke" }))}
        </g>
        {/* depth halo: coast drawn wide and faint, like the shaded shallows of an old chart */}
        {[22, 12, 5].map((sw, i) => (
          <g key={i} fill="none" stroke={night ? `rgba(31,163,176,${0.05 + i * 0.03})` : `rgba(60,90,85,${0.06 + i * 0.04})`} strokeWidth={sw} style={{ vectorEffect: "non-scaling-stroke" }} strokeLinejoin="round">
            {MAP.paths.map((d, k) => <path key={k} d={d} vectorEffect="non-scaling-stroke" />)}
          </g>
        ))}
        <g fill={land} stroke={landEdge} strokeWidth={1.4} strokeLinejoin="round">
          {MAP.paths.map((d, k) => <path key={k} d={d} vectorEffect="non-scaling-stroke" />)}
        </g>
        <g fill={land} stroke={landEdge} strokeWidth={1.2}>
          {FLANNAN_ISLETS.map((q, i) => (
            <ellipse key={i} cx={FL[0] + q.dx} cy={FL[1] + q.dy} rx={Math.max(q.rx, kmPerPx * 2.2)} ry={Math.max(q.ry, kmPerPx * 1.6)} transform={`rotate(${q.rot} ${FL[0] + q.dx} ${FL[1] + q.dy})`} vectorEffect="non-scaling-stroke" />
          ))}
        </g>
        {(p.routes ?? []).map((r, i) => {
          const pts = r.pts.map(pt);
          const d = "M" + pts.map((q) => `${q[0]} ${q[1]}`).join(" L");
          let len = 0;
          for (let k = 1; k < pts.length; k++) len += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
          const u = ci(s, [r.t0, r.t1], [0, 1], EIO);
          return (
            <path key={i} d={d} fill="none" stroke={r.color ?? (night ? BRAND.lamp : BRAND.danger)} strokeWidth={3} strokeLinecap="round"
              strokeDasharray={r.dashed ? `${len * 0.012} ${len * 0.012}` : `${len} ${len}`} strokeDashoffset={r.dashed ? 0 : len * (1 - u)}
              opacity={r.dashed ? u : 1} vectorEffect="non-scaling-stroke" />
          );
        })}
      </svg>
      {/* markers + labels in screen space */}
      {(p.markers ?? []).map((m, i) => {
        const [x, y] = toScr(pt(m.at));
        const a = ci(s, [m.t ?? 0, (m.t ?? 0) + 0.5], [0, 1]);
        const dim = m.dimAt !== undefined ? ci(s, [m.dimAt, m.dimAt + 0.4], [1, 0.15]) : 1;
        const pulse = m.pulse ? (s * 0.8) % 1 : 0;
        const col = m.dark ? "#3a3f44" : BRAND.lamp;
        return (
          <React.Fragment key={i}>
            {m.pulse ? <div style={{ position: "absolute", left: x - 40 * pulse, top: y - 40 * pulse, width: 80 * pulse, height: 80 * pulse, borderRadius: "50%", border: `2px solid ${col}`, opacity: a * (1 - pulse) * dim }} /> : null}
            <div style={{ position: "absolute", left: x - 9, top: y - 9, width: 18, height: 18, borderRadius: "50%", background: col, boxShadow: m.dark ? "none" : `0 0 18px 6px rgba(242,194,123,${0.55 * dim})`, opacity: a * Math.max(dim, m.dark ? 1 : 0.15), border: "2px solid rgba(0,0,0,0.6)" }} />
          </React.Fragment>
        );
      })}
      {(p.labels ?? []).map((l, i) => {
        const [x, y] = toScr(pt(l.at));
        const a = ci(s, [l.t ?? 0, (l.t ?? 0) + 0.6], [0, 1], EOUT);
        const fs = (l.size ?? 1) * (portrait ? 40 : 34);
        return (
          <div key={i} style={{ position: "absolute", left: x + (l.dx ?? 22), top: y + (l.dy ?? -fs * 0.8), direction: "rtl", whiteSpace: "nowrap", transform: "translateX(0)", fontFamily: TEXT_FONT, fontWeight: 600, fontSize: fs, color: night ? BRAND.cream : "#2b2215", opacity: a * (l.dim ? 0.7 : 1), textShadow: night ? "0 2px 8px rgba(0,0,0,0.9)" : "0 1px 0 rgba(255,250,235,0.6)" }}>
            {l.text}
          </div>
        );
      })}
      {p.scaleBar ? (() => {
        const km = [1, 2, 5, 10, 20, 50, 100, 200].find((k) => k / kmPerPx > W * 0.08) ?? 200;
        const px = km / kmPerPx;
        return (
          <div style={{ position: "absolute", left: 60, bottom: portrait ? H * 0.3 : 70, direction: "rtl", fontFamily: TEXT_FONT, fontSize: 20, color: night ? BRAND.creamDim : "#2b2215" }}>
            <div style={{ width: px, height: 6, borderLeft: "2px solid", borderRight: "2px solid", borderBottom: "2px solid" }} />
            <div style={{ marginTop: 4, textAlign: "left" }}>{`${km.toLocaleString("ar-EG")} كم`}</div>
          </div>
        );
      })() : null}
      {p.stamp ? (
        <div style={{ position: "absolute", right: portrait ? W * 0.07 : 70, top: portrait ? H * 0.12 : 60, direction: "rtl", textAlign: "right", opacity: ci(s, [p.stamp.t ?? 0.3, (p.stamp.t ?? 0.3) + 0.8], [0, 1]) }}>
          <div style={{ fontFamily: TITLE_FONT, fontWeight: 700, fontSize: portrait ? 56 : 46, color: night ? BRAND.cream : "#2b2215" }}>{p.stamp.text}</div>
          {p.stamp.sub ? <div style={{ fontFamily: TEXT_FONT, fontSize: portrait ? 28 : 22, color: night ? BRAND.creamDim : "#4b3d28" }}>{p.stamp.sub}</div> : null}
        </div>
      ) : null}
      {/* compass rose */}
      <svg width={120} height={120} viewBox="-60 -60 120 120" style={{ position: "absolute", right: portrait ? W * 0.07 : 70, bottom: portrait ? H * 0.3 : 70, opacity: 0.6 }}>
        <g fill={night ? BRAND.cream : "#2b2215"} stroke="none">
          <path d="M0 -52 L8 0 L0 52 L-8 0 Z" opacity={0.9} />
          <path d="M-52 0 L0 -8 L52 0 L0 8 Z" opacity={0.5} />
          <circle r={20} fill="none" stroke={night ? BRAND.cream : "#2b2215"} strokeWidth={1.5} />
        </g>
        <text y={-56} textAnchor="middle" fontSize={16} fill={night ? BRAND.cream : "#2b2215"} fontFamily={TEXT_FONT}>N</text>
      </svg>
      {p.illustrativeTag !== false ? (
        <div style={{ position: "absolute", left: portrait ? W * 0.07 : 60, top: portrait ? H * 0.13 : 46, fontFamily: TEXT_FONT, fontSize: portrait ? 22 : 17, color: night ? "rgba(244,236,216,0.5)" : "rgba(43,34,21,0.6)", direction: "rtl" }}>
          خريطة توضيحية · بيانات السواحل: Natural Earth
        </div>
      ) : null}
      <Vignette strength={night ? 0.8 : 0.55} />
      <Grain opacity={0.1} />
    </AbsoluteFill>
  );
};
