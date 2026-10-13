import React, { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

/* ------------------------------------------------------------------ */
/* Deterministic helpers (no Math.random, no wall clock: every frame   */
/* must render identically in any order / any render worker).          */
/* ------------------------------------------------------------------ */

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const ci = (x: number, i: number[], o: number[], easing?: (t: number) => number) =>
  interpolate(x, i, o, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });
export const EIO = Easing.inOut(Easing.sin);
export const EOUT = Easing.out(Easing.cubic);

/** Seeded PRNG (mulberry32). */
export const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const hash2 = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
};
/** 2D value noise in [0,1]. */
export const vnoise = (x: number, y: number) => {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
};
export const fbm = (x: number, y: number, oct = 5) => {
  let s = 0, amp = 0.5, f = 1, n = 0;
  for (let i = 0; i < oct; i++) {
    s += amp * vnoise(x * f, y * f);
    n += amp;
    amp *= 0.5;
    f *= 2.03;
  }
  return s / n;
};

/** Scene clock in seconds (local to the enclosing <Sequence>). */
export const useT = () => {
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  return { t: f / fps, f, fps, D: durationInFrames / fps };
};

/* ------------------------------------------------------------------ */
/* Camera rig: keyframed position / target / fov, eased per segment.  */
/* ------------------------------------------------------------------ */
export type V3 = [number, number, number];
export type CamKey = { t: number; pos: V3; look: V3; fov?: number; roll?: number };

const easeSeg = (k0: CamKey, k1: CamKey, t: number) => {
  const u = clamp01((t - k0.t) / Math.max(1e-6, k1.t - k0.t));
  return EIO(u);
};

export const sampleCam = (keys: CamKey[], t: number) => {
  if (t <= keys[0].t) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t <= b.t) {
      const u = easeSeg(a, b, t);
      return {
        t,
        pos: a.pos.map((v, j) => lerp(v, b.pos[j], u)) as V3,
        look: a.look.map((v, j) => lerp(v, b.look[j], u)) as V3,
        fov: lerp(a.fov ?? 40, b.fov ?? a.fov ?? 40, u),
        roll: lerp(a.roll ?? 0, b.roll ?? 0, u),
      };
    }
  }
  return keys[keys.length - 1];
};

/** Drives the default R3F camera from keyframes; optional handheld drift + shake. */
export const CameraRig: React.FC<{ keys: CamKey[]; drift?: number; shake?: number; near?: number; far?: number; ground?: (x: number, z: number) => number }> = ({
  keys, drift = 0.15, shake = 0, near = 0.1, far = 6000, ground,
}) => {
  const { camera, size } = useThree();
  const { t } = useT();
  useLayoutEffect(() => {
    const c = sampleCam(keys, t);
    const cam = camera as THREE.PerspectiveCamera;
    const dx = drift * (Math.sin(t * 0.37) * 0.6 + Math.sin(t * 0.83 + 1.3) * 0.4) + shake * Math.sin(t * 13.1) * 0.6;
    const dy = drift * (Math.sin(t * 0.29 + 0.7) * 0.6 + Math.sin(t * 0.61 + 2.1) * 0.4) + shake * Math.sin(t * 11.7 + 1) * 0.6;
    const px = c.pos[0] + dx, pz = c.pos[2];
    const minY = ground ? ground(px, pz) + 1.4 : -1e9; // never inside terrain / below the sea surface
    cam.position.set(px, Math.max(c.pos[1] + dy, minY), pz);
    cam.up.set(Math.sin(((c.roll ?? 0) * Math.PI) / 180), Math.cos(((c.roll ?? 0) * Math.PI) / 180), 0);
    cam.lookAt(c.look[0], c.look[1], c.look[2]);
    cam.fov = c.fov ?? 40;
    cam.near = near;
    cam.far = far;
    cam.aspect = size.width / size.height;
    cam.updateProjectionMatrix();
  });
  return null;
};

/** Scene-wide fog + background colour + tone mapping. */
export const Atmosphere: React.FC<{ color: string; density: number }> = ({ color, density }) => {
  const { scene, gl } = useThree();
  useLayoutEffect(() => {
    scene.fog = new THREE.FogExp2(new THREE.Color(color), density);
    scene.background = new THREE.Color(color);
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.25;
    gl.outputColorSpace = THREE.SRGBColorSpace;
  }, [scene, gl, color, density]);
  return null;
};

/** Memo-cached materials so every frame re-uses GPU programs. */
export const useMat = <T,>(make: () => T, deps: unknown[]) => React.useMemo(make, deps); // eslint-disable-line react-hooks/exhaustive-deps
