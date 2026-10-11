import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import { TiledImage, Vignette, clampI, tex } from "../components/layers";
import { TEXT_FONT, TITLE_FONT } from "../fonts";
import { BEATS } from "../timeline";
import { Camera, SceneProps, useScene } from "./common";

// The three keepers on duty in December 1900 (Northern Lighthouse Board records).
const KEEPERS = ["جيمس دوكات", "توماس مارشال", "دونالد ماك آرثر"];

/**
 * Scene E3: the empty quarters. Three hooks, one coat still hanging.
 * (One set of oilskins was found left behind - a documented detail; the room itself is a reconstruction.)
 */
export const S08Vanished: React.FC<SceneProps> = ({ t0, dur }) => {
  const { s, c, W, H, portrait } = useScene(t0);
  const floorY = portrait ? H * 0.74 : H * 0.8;
  const hookY = portrait ? H * 0.4 : H * 0.36;
  const spacing = portrait ? W * 0.28 : W * 0.15;
  const hooksX = [W / 2 - spacing, W / 2, W / 2 + spacing];
  const push = clampI(s, [0, dur], [1.0, 1.1], Easing.inOut(Easing.sin));
  const namesIn = clampI(c, [BEATS.threeMen - 0.1, BEATS.threeMen + 0.6], [0, 1]);
  const namesOut = clampI(c, [BEATS.vanished + 0.05, BEATS.vanished + 0.9], [1, 0], Easing.in(Easing.quad));
  const names = namesIn * namesOut;
  const lightDim = clampI(c, [BEATS.vanished, BEATS.vanished + 1.5], [1, 0.8]);
  const coatX = hooksX[2];
  const coatW = portrait ? W * 0.17 : W * 0.075;
  const coatH = portrait ? H * 0.28 : H * 0.36;

  return (
    <AbsoluteFill style={{ background: "#2a2b28" }}>
      <AbsoluteFill style={{ filter: `brightness(${lightDim})` }}>
        <Camera scale={push} originX={W / 2} originY={hookY + coatH * 0.3}>
          <TiledImage src={tex("plaster.png")} tileW={800} tileH={800} repeatY height={floorY} filter="brightness(0.62) sepia(0.15)" />
          <TiledImage src={tex("wood.png")} tileW={900} tileH={450} top={floorY} height={H - floorY} repeatY filter="brightness(0.55)" />
          <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(0,0,0,0) ${(floorY / H) * 100 - 1}%, rgba(0,0,0,0.6) ${(floorY / H) * 100}%, rgba(0,0,0,0.2) 100%)` }} />
          {/* daylight from a window off-frame left */}
          <AbsoluteFill
            style={{
              background: `linear-gradient(105deg, rgba(200,210,215,0.28) 0%, rgba(200,210,215,0.08) 35%, rgba(0,0,0,0.35) 85%)`,
              mixBlendMode: "screen",
            }}
          />
          <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
            <defs>
              <linearGradient id="coat" x1="0" x2="1">
                <stop offset="0" stopColor="#1d1f16" />
                <stop offset="0.45" stopColor="#3b3a26" />
                <stop offset="1" stopColor="#15160f" />
              </linearGradient>
            </defs>
            {/* peg rail */}
            <rect x={hooksX[0] - spacing * 0.6} y={hookY - 22} width={spacing * 3.2} height={30} fill="#3a2a1a" />
            <rect x={hooksX[0] - spacing * 0.6} y={hookY + 8} width={spacing * 3.2} height={6} fill="rgba(0,0,0,0.35)" />
            {hooksX.map((x, i) => (
              <g key={i}>
                <path d={`M ${x} ${hookY - 8} l 0 22 q 0 14 14 14`} stroke="#141414" strokeWidth={7} fill="none" strokeLinecap="round" />
              </g>
            ))}
            {/* the one oilskin coat left behind */}
            <path
              d={`M ${coatX} ${hookY + 18} C ${coatX - coatW * 0.35} ${hookY + 22} ${coatX - coatW * 0.55} ${hookY + coatH * 0.12} ${coatX - coatW * 0.6} ${hookY + coatH * 0.3}
                 L ${coatX - coatW * 0.7} ${hookY + coatH} L ${coatX + coatW * 0.7} ${hookY + coatH} L ${coatX + coatW * 0.6} ${hookY + coatH * 0.3}
                 C ${coatX + coatW * 0.55} ${hookY + coatH * 0.12} ${coatX + coatW * 0.35} ${hookY + 22} ${coatX} ${hookY + 18} Z`}
              fill="url(#coat)"
            />
            <path d={`M ${coatX} ${hookY + 30} L ${coatX + coatW * 0.05} ${hookY + coatH}`} stroke="rgba(0,0,0,0.5)" strokeWidth={3} />
            {/* shadows on the wall */}
            <ellipse cx={coatX + coatW * 0.5} cy={hookY + coatH * 0.55} rx={coatW * 0.6} ry={coatH * 0.5} fill="rgba(0,0,0,0.25)" filter="blur(10px)" />
            {/* chair, pushed in, by the wall */}
            {(() => {
              const ch = portrait ? H * 0.22 : H * 0.36;
              const cw = portrait ? W * 0.12 : W * 0.06;
              return (
                <g transform={`translate(${portrait ? W * 0.08 : W * 0.2} ${floorY})`} fill="#24180e">
                  <rect x={0} y={-ch} width={10} height={ch} />
                  <rect x={cw} y={-ch} width={10} height={ch} />
                  <rect x={0} y={-ch} width={cw + 10} height={12} />
                  <rect x={0} y={-ch * 0.75} width={cw + 10} height={8} />
                  <rect x={-6} y={-ch * 0.47} width={cw + 22} height={14} />
                </g>
              );
            })()}
          </svg>
        </Camera>
      </AbsoluteFill>
      {/* names over the hooks, which dissolve on "اختفوا" */}
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        {hooksX.map((x, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - spacing / 2,
              width: spacing,
              top: hookY - (portrait ? H * 0.11 : H * 0.13),
              textAlign: "center",
              direction: "rtl",
              fontFamily: i === 0 ? TITLE_FONT : TITLE_FONT,
              fontWeight: 700,
              fontSize: portrait ? 44 : 36,
              color: "#efe6d2",
              textShadow: "0 2px 10px rgba(0,0,0,0.9)",
              opacity: names * clampI(c, [BEATS.threeMen + i * 0.25, BEATS.threeMen + i * 0.25 + 0.5], [0, 1]),
              filter: `blur(${(1 - namesOut) * 10}px)`,
              translate: `0 ${(1 - namesOut) * -16}px`,
            }}
          >
            {KEEPERS[i]}
          </div>
        ))}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: hookY - (portrait ? H * 0.16 : H * 0.2),
            textAlign: "center",
            fontFamily: TEXT_FONT,
            fontSize: portrait ? 26 : 20,
            color: "rgba(225,220,205,0.75)",
            direction: "rtl",
            opacity: names,
          }}
        >
          حرّاس المنارة · ديسمبر ١٩٠٠
        </div>
      </AbsoluteFill>
      <Vignette strength={0.85} />
    </AbsoluteFill>
  );
};
