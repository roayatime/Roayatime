import React from "react";
import { CamKey, V3, ci, smooth } from "./core";
import { islandHeight } from "./environment";
import { LANDINGS, LH, lighthouseTop, stairPath, stationPath } from "./lighthouse";
import { CAST, Person, walkPath } from "./characters";
import { ARCHTOR, HESPERUS, shipPoint } from "./vessels";
import { Actor, InteriorCanvas, World, WorldProps } from "./world";
import { Bedroom, CoatHall, Kitchen, LanternRoom, LogDesk, SpiralStair } from "./interiors";

/* ================================================================== */
/* Shot library. Each shot = f(local time t, duration D, params p).   */
/* Camera keys are expressed in shot time so a shot adapts to the     */
/* exact length of the narration lines it covers.                     */
/* ================================================================== */

/* eslint-disable @typescript-eslint/no-explicit-any */
export type ShotArgs = { t: number; D: number; p: any; scale: number; portrait: boolean };

const TOP = lighthouseTop();
const ST: V3 = [LH.x, LH.y, LH.z];
const E = LANDINGS.east, Wl = LANDINGS.west;
const eastStairs = stairPath("east"), westStairs = stairPath("west");
const eastWalk = stationPath("east"), westWalk = stationPath("west");
const gy = (x: number, z: number) => islandHeight(x, z);
const at = (x: number, z: number, dy = 0): V3 => [x, gy(x, z) + dy, z];
const off = (base: [number, number], n: [number, number], t: [number, number], a: number, b: number): [number, number] => [base[0] + n[0] * a + t[0] * b, base[1] + n[1] * a + t[1] * b];

/** Portrait framing: wider FOV and camera pulled back so the subject stays central in 9:16. */
const fit = (keys: CamKey[], portrait: boolean): CamKey[] =>
  portrait ? keys.map((k) => ({ ...k, fov: Math.min(75, (k.fov ?? 40) * 1.55) })) : keys;

const beamAngle = (t: number) => t * ((2 * Math.PI) / 30) * 2; // two beams, group-flash feel ~ every 30 s

type ShotFn = (a: ShotArgs) => React.ReactElement;

const W = (a: ShotArgs, props: Omit<WorldProps, "t" | "scale"> & { cam: CamKey[] }) => <World {...props} cam={fit(props.cam, a.portrait)} t={a.t} scale={a.scale} />;

export const SHOTS: Record<string, ShotFn> = {
  /* ---------------- COLD OPEN ---------------- */
  // Night sea, storm: camera skims the waves toward a distant dark island.
  sea_night_approach: (a) =>
    W(a, {
      mood: "night", storm: 1.7, rain: 0.8, lampOn: a.p.lamp ?? 0, beam: a.p.lamp ? beamAngle(a.t) : null,
      cam: [
        { t: 0, pos: [900, 9, 700], look: [ST[0], 40, ST[2]], fov: 38 },
        { t: a.D, pos: [700, 7, 560], look: [ST[0], 50, ST[2]], fov: 34 },
      ],
      drift: 0.9, shake: 0.25, oceanSeg: 200,
    }),
  // Lighthouse working normally at night: beam sweeping over the sea.
  lighthouse_beam: (a) =>
    W(a, {
      mood: a.p.mood ?? "night", storm: 1.2, lampOn: a.p.offAt !== undefined ? 1 - smooth(a.p.offAt, a.p.offAt + 1.2, a.t) : ci(a.t, [a.p.onAt ?? -1, (a.p.onAt ?? -1) + 1.5], [0, 1]), beam: beamAngle(a.t + 3), lit: a.p.offAt !== undefined ? 1 - smooth(a.p.offAt, a.p.offAt + 1.2, a.t) : 1,
      cam: a.p.vertical
        ? [
            { t: 0, pos: [ST[0] + 20, ST[1] + 1.2, ST[2] + 26], look: [TOP[0], TOP[1] - 1, TOP[2]], fov: 34 },
            { t: a.D, pos: [ST[0] + 15, ST[1] + 1.0, ST[2] + 21], look: [TOP[0], TOP[1] + 1, TOP[2]], fov: 34 },
          ]
        : a.p.close
        ? [
            { t: 0, pos: [ST[0] + 70, ST[1] + 6, ST[2] + 95], look: [TOP[0], TOP[1] - 6, TOP[2]], fov: 30 },
            { t: a.D, pos: [ST[0] + 48, ST[1] + 3, ST[2] + 72], look: [TOP[0], TOP[1] - 3, TOP[2]], fov: 30 },
          ]
        : [
            { t: 0, pos: [ST[0] + 380, 38, ST[2] + 360], look: [TOP[0], TOP[1] - 18, TOP[2]], fov: 30 },
            { t: a.D, pos: [ST[0] + 300, 48, ST[2] + 280], look: [TOP[0], TOP[1] - 12, TOP[2]], fov: 28 },
          ],
      drift: 0.4,
    }),
  // From the ship's deck: sailors look toward the island; whistle steam + distress rocket.
  ship_deck_signal: (a) => {
    const shipPos: V3 = a.p.archtor ? [ST[0] + 260, 0, ST[2] + 520] : [ST[0] + 330, 0, ST[2] + 300];
    const head = Math.atan2(ST[0] - shipPos[0], ST[2] - shipPos[2]) + (a.p.archtor ? 1.2 : 0);
    const storm = a.p.storm ?? 1.3;
    const crew: Actor[] = [
      { look: CAST.sailor, pos: [1.2, 1.2, 15], rotY: a.p.archtor ? -1.1 : 0, pose: { head: [0.1, -0.05], armR: [-1.4, 0, 0.3] } },
      { look: a.p.captain ? CAST.harvie : CAST.sailor2, pos: [-1.0, 1.2, 12.5], rotY: a.p.archtor ? -1.3 : 0.2, pose: { head: [-0.1, -0.08] } },
    ];
    const camL = shipPoint(shipPos, head, a.t, storm, [5 + a.t * 0.15, 4.4, -1.6]);
    const lookAtIsland: V3 = [ST[0], ST[1] + 12, ST[2]];
    return W(a, {
      mood: a.p.mood ?? "night", storm, rain: a.p.rain ?? 0.4, lampOn: 0,
      ships: [{ style: a.p.archtor ? ARCHTOR : HESPERUS, pos: shipPos, heading: head, lights: a.p.mood === "grey" ? 0 : 1, smoke: 1, crew }],
      flare: a.p.flareAt !== undefined ? { t0: a.p.flareAt, from: shipPoint(shipPos, head, a.t, storm, [14, 3, 0]) } : null,
      cam: [{ t: 0, pos: camL, look: a.p.archtor ? shipPoint(shipPos, head, a.t, storm, [30, 2, -60]) : lookAtIsland, fov: 46 }],
      drift: 0.25, shake: 0.08,
    });
  },
  // A sailor with a lantern climbs from the landing to the station at night.
  night_climb: (a) => {
    const path = [...eastStairs.slice(18), ...eastWalk];
    const w = walkPath(path, a.t, 1.9);
    return W(a, {
      mood: "night", storm: 1.3, rain: 0.5, lampOn: 0,
      actors: [{ look: CAST.sailor, pos: w.pos, rotY: w.heading, pose: { walk: w.phase, stride: w.stride, armR: [-0.5, 0, 0.9] }, lantern: 1 }],
      cam: (() => {
        const bk = walkPath(path, a.t - 1.5, 1.9).pos;
        return [{ t: 0, pos: [bk[0] + 12, w.pos[1] + 5, bk[2] + 12] as V3, look: [w.pos[0], w.pos[1] + 1, w.pos[2]] as V3, fov: 40 }];
      })(),
      drift: 0.3, shadows: false,
    });
  },

  /* ---------------- ISLAND / SETTING ---------------- */
  island_aerial: (a) => {
    const r0 = a.p.r ?? 520, ang0 = a.p.a0 ?? 0.6, ang1 = a.p.a1 ?? 1.1;
    const key = (t: number, ang: number, r: number, h: number): CamKey => ({ t, pos: [ST[0] + Math.cos(ang) * r, h, ST[2] + Math.sin(ang) * r], look: [ST[0] + 40, 30, ST[2]], fov: 36 });
    return W(a, { mood: a.p.mood ?? "grey", storm: a.p.storm ?? 1.0, lampOn: 0, cam: [key(0, ang0, r0, a.p.h ?? 210), key(a.D, ang1, r0 * 0.85, (a.p.h ?? 210) * 0.8)], drift: 0.5, oceanSeg: 160 });
  },
  storm_cliffs: (a) => {
    const c = off([Wl.cx, Wl.cz], Wl.n, Wl.t, -10, 40);
    return W(a, {
      mood: "storm", storm: 2.3, rain: 0.9, lampOn: 0,
      spray: [{ at: [Wl.cx - Wl.n[0] * 4, 0, Wl.cz - Wl.n[1] * 4], period: 5, size: 1.6 }, { at: [c[0], 0, c[1]], period: 6.5, size: 1.3, phase: 2.1 }],
      cam: [
        { t: 0, pos: [Wl.cx - Wl.n[0] * 120 + Wl.t[0] * 60, 14, Wl.cz - Wl.n[1] * 120 + Wl.t[1] * 60], look: [Wl.cx, 25, Wl.cz], fov: 38 },
        { t: a.D, pos: [Wl.cx - Wl.n[0] * 95 + Wl.t[0] * 30, 18, Wl.cz - Wl.n[1] * 95 + Wl.t[1] * 30], look: [Wl.cx, 28, Wl.cz], fov: 34 },
      ],
      drift: 0.9, shake: 0.2, oceanSeg: 200,
    });
  },
  tower_low: (a) =>
    W(a, {
      mood: a.p.mood ?? "grey", storm: 1.0, lampOn: a.p.lamp ?? 0, beam: a.p.lamp ? beamAngle(a.t) : null, lit: a.p.lit ?? 0,
      cam: [
        { t: 0, pos: [ST[0] + 26, ST[1] + 1.5, ST[2] + 30], look: [TOP[0], TOP[1], TOP[2]], fov: 46 },
        { t: a.D, pos: [ST[0] + 34, ST[1] + 2.5, ST[2] + 14], look: [TOP[0], TOP[1] - 2, TOP[2]], fov: 44 },
      ],
      drift: 0.15, shadows: true,
    }),
  keeper_gallery: (a) => {
    const g: V3 = [LH.x + 2.75, LH.y + LH.towerH + 0.82, LH.z + 1.1];
    return W(a, {
      mood: a.p.mood ?? "dusk", storm: 1.0, lampOn: a.p.lamp ?? 0.6, beam: null, lit: 0.6,
      actors: [{ look: CAST.ducat, pos: g, rotY: 1.2, pose: { armL: [-0.3, 0.1, 0.3], armR: [-0.3, -0.1, 0.3], head: [0.2, 0.05] } }],
      cam: [
        { t: 0, pos: [g[0] + 9, g[1] + 2.5, g[2] + 9], look: [g[0], g[1] + 1.4, g[2]], fov: 34 },
        { t: a.D, pos: [g[0] + 4, g[1] + 3.2, g[2] + 12], look: [g[0] + 8, g[1], g[2] + 2], fov: 34 },
      ],
      drift: 0.12, shadows: true,
    });
  },
  isolation_wide: (a) =>
    W(a, {
      mood: a.p.mood ?? "dusk", storm: 1.1, lampOn: a.p.lamp ?? 0, beam: a.p.lamp ? beamAngle(a.t) : null, lit: a.p.lamp ?? 0,
      cam: [
        { t: 0, pos: [ST[0] + 420, 140, ST[2] - 470], look: [ST[0], 30, ST[2]], fov: 30 },
        { t: a.D, pos: [ST[0] + 640, 250, ST[2] - 740], look: [ST[0], 20, ST[2]], fov: 28 },
      ],
      drift: 0.6, oceanSeg: 150, fogScale: 0.45,
    }),
  /* ---------------- KEEPERS ---------------- */
  keepers_intro: (a) => {
    // three keepers stand in the yard; the camera tracks from one to the next as each is named
    const base = at(ST[0] + 2, ST[2] + 22);
    const pos = [at(base[0] - 3.2, base[2] - 0.5), at(base[0], base[2] + 0.4), at(base[0] + 3.2, base[2] - 0.2)];
    const focus = a.p.focus as number[] | undefined; // seconds at which to move to keeper 0,1,2
    const f = focus ?? [0, a.D / 3, (2 * a.D) / 3];
    const k = (i: number, t: number): CamKey => ({ t, pos: [pos[i][0] + 1.0, pos[i][1] + 1.7, pos[i][2] + 4.2], look: [pos[i][0], pos[i][1] + 1.6, pos[i][2]], fov: 30 });
    const cam: CamKey[] = [{ t: 0, pos: [base[0], base[1] + 3, base[2] + 13], look: [base[0], base[1] + 1.4, base[2]], fov: 34 }, k(0, f[0] + 1.2), k(0, f[1] - 0.2), k(1, f[1] + 1.0), k(1, f[2] - 0.2), k(2, f[2] + 1.0), { ...k(2, a.D), pos: [pos[2][0] + 1.6, pos[2][1] + 1.8, pos[2][2] + 5.4] }];
    const breathe = (i: number) => ({ head: [Math.sin(a.t * 0.5 + i) * 0.15, 0] as [number, number] });
    return W(a, {
      mood: "grey", storm: 1, lampOn: 0, lit: 0.2,
      actors: [
        { look: CAST.ducat, pos: pos[0], rotY: 0.15, pose: breathe(0) },
        { look: CAST.marshall, pos: pos[1], rotY: 0, pose: breathe(1) },
        { look: CAST.macarthur, pos: pos[2], rotY: -0.15, pose: breathe(2) },
      ],
      cam: cam.filter((c, i, arr) => i === 0 || c.t > arr[i - 1].t),
      drift: 0.06, shadows: true,
    });
  },
  keepers_work: (a) => {
    const p0 = eastWalk[eastWalk.length - 1];
    const w1 = walkPath([...eastWalk].reverse(), a.t, 1.1);
    return W(a, {
      mood: a.p.mood ?? "grey", storm: 1, lampOn: 0, lit: 0.2,
      actors: [
        { look: CAST.ducat, pos: w1.pos, rotY: w1.heading, pose: { walk: w1.phase, stride: w1.stride }, prop: "oilcan" },
        { look: CAST.marshall, pos: at(p0[0] - 6, p0[2] - 3), rotY: 2.2, pose: { lean: 0.5, armL: [-1.2, 0, 0.4], armR: [-1.2, 0, 0.4], crouch: 0.3 }, prop: "rope" },
        { look: CAST.macarthur, pos: at(p0[0] + 5, p0[2] - 6), rotY: -0.6, pose: { armR: [-0.6, 0, 1.2] }, prop: "cloth" },
      ],
      cam: [
        { t: 0, pos: [p0[0] + 8, p0[1] + 3, p0[2] + 7], look: [p0[0], p0[1] + 1.3, p0[2] - 3], fov: 40 },
        { t: a.D, pos: [p0[0] + 4, p0[1] + 2.6, p0[2] + 8], look: [p0[0] - 2, p0[1] + 1.3, p0[2] - 4], fov: 38 },
      ],
      drift: 0.1, shadows: true,
    });
  },
  mainland_moore: (a) =>
    W(a, {
      mood: "grey", storm: 0.8, hideIsland: true, mainland: true, lampOn: 0,
      actors: [{ look: CAST.moore, pos: [10, 1.2, -16], rotY: Math.PI, pose: { head: [Math.sin(a.t * 0.3) * 0.2, 0.05] } }],
      cam: [
        { t: 0, pos: [16, 3.2, -4], look: [8, 1.8, -24], fov: 34 },
        { t: a.D, pos: [13, 2.6, -8], look: [6, 2.2, -40], fov: 32 },
      ],
      drift: 0.1,
    }),
  muirhead_visit: (a) => {
    // 7 December: Hesperus off the east landing, the superintendent says goodbye to the keepers
    const plat = off([E.cx, E.cz], E.n, E.t, -2, 0);
    const y = 2.15;
    const pp = (dn: number, dt: number): V3 => {
      const q = off(plat, E.n, E.t, dn, dt);
      return [q[0], y, q[1]];
    };
    const face = Math.atan2(-E.n[0], -E.n[1]);
    const shake = Math.sin(a.t * 6) * 0.08 * smooth(a.p.shakeAt ?? 1, (a.p.shakeAt ?? 1) + 0.4, a.t) * (1 - smooth((a.p.shakeAt ?? 1) + 2.5, (a.p.shakeAt ?? 1) + 3, a.t));
    return W(a, {
      mood: a.p.mood ?? "grey", storm: 0.8, lampOn: 0,
      ships: [{ style: HESPERUS, pos: [E.cx - E.n[0] * 140 + E.t[0] * 30, 0, E.cz - E.n[1] * 140 + E.t[1] * 30], heading: Math.atan2(E.t[0], E.t[1]), smoke: 1 }],
      actors: [
        { look: CAST.muirhead, pos: pp(-0.5, 0), rotY: face + Math.PI, pose: { armR: [-0.9 + shake, -0.1, 0.4] } },
        { look: CAST.ducat, pos: pp(1.1, 0.2), rotY: face, pose: { armR: [-0.9 - shake, 0.1, 0.4] } },
        { look: CAST.marshall, pos: pp(1.8, 1.6), rotY: face + 0.2 },
        { look: CAST.macarthur, pos: pp(1.9, -1.4), rotY: face - 0.2 },
      ],
      cam: [
        { t: 0, pos: [pp(5.5, 6)[0], y + 2.2, pp(5.5, 6)[2]], look: [pp(0.4, 0)[0], y + 1.4, pp(0.4, 0)[2]], fov: 40 },
        { t: a.D, pos: [pp(4.5, 4.6)[0], y + 1.9, pp(4.5, 4.6)[2]], look: [pp(0.2, 0)[0], y + 1.4, pp(0.2, 0)[2]], fov: 38 },
      ],
      drift: 0.08, shadows: true,
    });
  },
  station_dusk_empty: (a) => {
    const v = a.p.v ?? 0;
    const K: CamKey[][] = [
      [{ t: 0, pos: [ST[0] + 10, ST[1] + 3, ST[2] + 46], look: [ST[0] - 4, ST[1] + 3, ST[2] + 8], fov: 38 }, { t: a.D, pos: [ST[0] + 4, ST[1] + 2.4, ST[2] + 34], look: [ST[0] - 4, ST[1] + 4, ST[2] + 8], fov: 36 }],
      [{ t: 0, pos: [ST[0] - 60, ST[1] + 6, ST[2] + 30], look: [ST[0], ST[1] + 8, ST[2]], fov: 34 }, { t: a.D, pos: [ST[0] - 48, ST[1] + 4, ST[2] + 40], look: [ST[0], ST[1] + 10, ST[2]], fov: 32 }],
      [{ t: 0, pos: [ST[0] + 40, ST[1] + 40, ST[2] - 50], look: [ST[0] - 5, ST[1], ST[2] + 10], fov: 36 }, { t: a.D, pos: [ST[0] + 50, ST[1] + 34, ST[2] - 30], look: [ST[0] - 5, ST[1], ST[2] + 10], fov: 34 }],
    ];
    return W(a, { mood: a.p.mood ?? "dusk", storm: 1.4, rain: 0.3, lampOn: a.p.lamp ?? 0, lit: a.p.lit ?? 0, cam: K[v % 3], drift: 0.15, shadows: true });
  },
  /* ---------------- FIRST SIGN ---------------- */
  archtor_pass: (a) => {
    const sx = ci(a.t, [0, a.D], [-260, 160]);
    const shipPos: V3 = [ST[0] + sx, 0, ST[2] + 560];
    const camP = shipPoint(shipPos, Math.PI / 2, a.t, 1.8, [-60, 9, 48]);
    const mid = shipPoint(shipPos, Math.PI / 2, a.t, 1.8, [0, 3, 0]);
    return W(a, {
      mood: "night", storm: 1.8, rain: 0.7, lampOn: 0,
      ships: [{ style: ARCHTOR, pos: shipPos, heading: Math.PI / 2, lights: 1, smoke: 1 }],
      cam: [{ t: 0, pos: [camP[0], 10, camP[2]], look: [mid[0] * 0.8 + ST[0] * 0.2, 8, mid[2] * 0.8 + ST[2] * 0.2], fov: 46 }],
      drift: 0.8, shake: 0.2, oceanSeg: 200,
    });
  },
  shore_watch: (a) =>
    W(a, {
      mood: a.p.mood ?? "grey", storm: 1.0, hideIsland: true, mainland: true, lampOn: 0, rain: 0.2,
      actors: [{ look: CAST.shorewatch, pos: [-6, 9.6, 8], rotY: Math.PI, pose: { armR: [-1.45, 0, 1.0], armL: [-1.3, 0.2, 1.3], head: [0, 0.05] }, prop: "telescope" }],
      cam: [
        { t: 0, pos: [-2, 11.5, 14], look: [-8, 11, -40], fov: 34 },
        { t: a.D, pos: [-4, 11.2, 12], look: [-10, 11, -60], fov: 30 },
      ],
      drift: 0.08,
    }),
  /* ---------------- HESPERUS ---------------- */
  hesperus_arrival: (a) => {
    const d = ci(a.t, [0, a.D], [a.p.d0 ?? 520, a.p.d1 ?? 330]);
    const pos: V3 = [E.cx - E.n[0] * d, 0, E.cz - E.n[1] * d];
    const head = Math.atan2(E.n[0], E.n[1]);
    const camP = shipPoint(pos, head, a.t, 1.1, [-70, 6, 52]);
    const tgt = shipPoint(pos, head, a.t, 1.1, [6, 3, 0]);
    return W(a, {
      mood: a.p.mood ?? "grey", storm: 1.1, lampOn: 0,
      ships: [{ style: HESPERUS, pos, heading: head, smoke: 1 }],
      cam: [{ t: 0, pos: [camP[0], 7, camP[2]], look: [tgt[0] * 0.8 + ST[0] * 0.2, 7, tgt[2] * 0.8 + ST[2] * 0.2], fov: 46 }],
      drift: 0.4,
    });
  },
  station_no_flag: (a) =>
    W(a, {
      mood: "grey", storm: 1.0, lampOn: 0, flag: 0,
      cam: [
        { t: 0, pos: [ST[0] + 60, ST[1] + 14, ST[2] + 70], look: [ST[0] + 14, ST[1] + 6, ST[2] + 9], fov: 30 },
        { t: a.D, pos: [ST[0] + 40, ST[1] + 9, ST[2] + 46], look: [ST[0] + 14, ST[1] + 6, ST[2] + 9], fov: 30 },
      ],
      drift: 0.2, shadows: true,
    }),
  boat_landing: (a) => {
    const d = ci(a.t, [0, a.D], [110, 14]);
    const pos: V3 = [E.cx - E.n[0] * d, 0, E.cz - E.n[1] * d];
    const head = Math.atan2(E.n[0], E.n[1]);
    return W(a, {
      mood: "grey", storm: 1.0, lampOn: 0,
      ships: [{ style: HESPERUS, pos: [E.cx - E.n[0] * 260 + E.t[0] * 40, 0, E.cz - E.n[1] * 260 + E.t[1] * 40], heading: Math.atan2(E.t[0], E.t[1]), smoke: 1 }],
      boats: [{ pos, heading: head, row: a.t * 2.6, crew: [
        { look: CAST.sailor, pos: [0.4, 0.2, 0.5], rotY: -Math.PI / 2, pose: { sit: 1, armL: [-1.2 + Math.sin(a.t * 2.6) * 0.5, 0, 0.6], armR: [-1.2 + Math.sin(a.t * 2.6) * 0.5, 0, 0.6] } },
        { look: CAST.sailor2, pos: [-0.6, 0.2, -0.5], rotY: -Math.PI / 2, pose: { sit: 1, armL: [-1.2 + Math.sin(a.t * 2.6) * 0.5, 0, 0.6], armR: [-1.2 + Math.sin(a.t * 2.6) * 0.5, 0, 0.6] } },
        { look: CAST.moore, pos: [1.7, 0.2, 0], rotY: Math.PI / 2, pose: { sit: 0.8, head: [0, -0.1] } },
      ] }],
      cam: [
        { t: 0, pos: [pos[0] - E.n[0] * 7 + E.t[0] * 5, 3.2, pos[2] - E.n[1] * 7 + E.t[1] * 5], look: [pos[0] + E.n[0] * 22, 4, pos[2] + E.n[1] * 22], fov: 46 },
        { t: a.D, pos: [pos[0] - E.n[0] * 6 + E.t[0] * 3.5, 2.8, pos[2] - E.n[1] * 6 + E.t[1] * 3.5], look: [pos[0] + E.n[0] * 22, 6, pos[2] + E.n[1] * 22], fov: 44 },
      ],
      drift: 0.4, shake: 0.1,
    });
  },
  moore_climb: (a) => {
    const path = a.p.toStation ? eastWalk : eastStairs;
    const w = walkPath(path, a.t + (a.p.t0 ?? 0), a.p.speed ?? 1.6);
    const back = walkPath(path, a.t + (a.p.t0 ?? 0) - 3, a.p.speed ?? 1.6).pos;
    return W(a, {
      mood: "grey", storm: 1.0, lampOn: 0,
      actors: [{ look: CAST.moore, pos: w.pos, rotY: w.heading, pose: { walk: w.phase, stride: w.stride, lean: 0.12 } }],
      cam: [{ t: 0, pos: [back[0] - E.n[0] * 9 + E.t[0] * 3, back[1] + 2.5, back[2] - E.n[1] * 9 + E.t[1] * 3], look: [w.pos[0], w.pos[1] + 1.4, w.pos[2]], fov: 44 }],
      drift: 0.15, shadows: true,
    });
  },
  gate_closed: (a) => {
    const g: V3 = [LH.x + 4, gy(LH.x + 4, LH.z + 13.5), LH.z + 13.5];
    const w = walkPath([[g[0] + 6, g[1], g[2] + 9], [g[0], g[1], g[2] + 1.0]], a.t, 1.0);
    return W(a, {
      mood: "grey", storm: 1.2, rain: 0.2, lampOn: 0,
      actors: [{ look: CAST.moore, pos: w.pos, rotY: w.heading, pose: { walk: w.phase, stride: w.stride, armR: a.t > (a.p.reachAt ?? 6) ? [-1.2, 0, 0.3] : undefined } }],
      cam: [
        { t: 0, pos: [g[0], g[1] + 1.7, g[2] - 6.5], look: [g[0] + 2, g[1] + 1.4, g[2] + 8], fov: 44 },
        { t: a.D, pos: [g[0], g[1] + 1.6, g[2] - 5.0], look: [g[0] + 0.5, g[1] + 1.5, g[2] + 3], fov: 42 },
      ],
      drift: 0.05, shadows: true,
    });
  },
  moore_runs_back: (a) => {
    const path = [...eastWalk].reverse().concat([...eastStairs].reverse());
    const w = walkPath(path, a.t + 4, 3.2);
    const back = walkPath(path, a.t + 1.5, 3.2).pos;
    return W(a, {
      mood: "grey", storm: 1.3, lampOn: 0,
      actors: [{ look: CAST.moore, pos: w.pos, rotY: w.heading, pose: { walk: w.phase * 1.4, stride: w.stride, lean: 0.25 } }],
      cam: [{ t: 0, pos: [back[0] + 5, back[1] + 3.5, back[2] + 5], look: [w.pos[0], w.pos[1] + 1.2, w.pos[2]], fov: 44 }],
      drift: 0.35, shake: 0.15, shadows: true,
    });
  },
  /* ---------------- EVIDENCE ---------------- */
  landings_compare: (a) => {
    const side = a.p.side === "west" ? Wl : E;
    const dmg = a.p.side === "west" ? 1 : 0;
    const c = off([side.cx, side.cz], side.n, side.t, -3, 0);
    return W(a, {
      mood: a.p.mood ?? "grey", storm: a.p.side === "west" ? 1.8 : 1.0, lampOn: 0, damageWest: a.p.side === "west" ? dmg : a.p.dmg ?? 1,
      spray: [],
      cam: [
        { t: 0, pos: [c[0] - side.n[0] * 30 + side.t[0] * 22, 16, c[1] - side.n[1] * 30 + side.t[1] * 22], look: [c[0], 3, c[1]], fov: 38 },
        { t: a.D, pos: [c[0] - side.n[0] * 18 + side.t[0] * 12, 9, c[1] - side.n[1] * 18 + side.t[1] * 12], look: [c[0], 3, c[1]], fov: 36 },
      ],
      drift: 0.3, shadows: true,
    });
  },
  west_height: (a) => {
    const c = off([Wl.cx, Wl.cz], Wl.n, Wl.t, -3, 0);
    const h = ci(a.t, [0, a.D * 0.8], [3, 36], (x) => x * x * (3 - 2 * x));
    return W(a, {
      mood: "storm", storm: 1.6, rain: 0.4, lampOn: 0, damageWest: 1,
      cam: [
        { t: 0, pos: [c[0] - Wl.n[0] * 40 + Wl.t[0] * 25, 4, c[1] - Wl.n[1] * 40 + Wl.t[1] * 25], look: [c[0] + Wl.n[0] * 10, 4, c[1] + Wl.n[1] * 10], fov: 40 },
        { t: a.D, pos: [c[0] - Wl.n[0] * 46 + Wl.t[0] * 25, 36, c[1] - Wl.n[1] * 46 + Wl.t[1] * 25], look: [c[0] + Wl.n[0] * 18, h, c[1] + Wl.n[1] * 18], fov: 40 },
      ],
      drift: 0.3, shadows: true,
      children: (
        // a semi-transparent level plane marking ~33 m above the sea (measurement aid, documentary graphic in 3D)
        <mesh position={[c[0] + Wl.n[0] * 12, 33, c[1] + Wl.n[1] * 12]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[60, 60]} />
          <meshBasicMaterial color="#f2c27b" transparent opacity={0.16 * smooth(a.D * 0.5, a.D * 0.8, a.t)} depthWrite={false} />
        </mesh>
      ),
    });
  },
  sea_power: (a) => {
    const c = off([Wl.cx, Wl.cz], Wl.n, Wl.t, -6, 0);
    return W(a, {
      mood: "storm", storm: 2.6, rain: 0.9, lampOn: 0, damageWest: 1, flash: a.p.flashAt !== undefined ? Math.max(0, 1 - Math.abs(a.t - a.p.flashAt) * 4) : 0,
      spray: [0, 1, 2].map((i) => ({ at: [c[0] + Wl.t[0] * (i - 1) * 25, 0, c[1] + Wl.t[1] * (i - 1) * 25] as V3, period: 4.5 + i, size: 1.8, phase: i * 1.7 })),
      cam: [
        { t: 0, pos: [c[0] - Wl.n[0] * 70 + Wl.t[0] * 40, 6, c[1] - Wl.n[1] * 70 + Wl.t[1] * 40], look: [c[0], 14, c[1]], fov: 42 },
        { t: a.D, pos: [c[0] - Wl.n[0] * 55 + Wl.t[0] * 20, 9, c[1] - Wl.n[1] * 55 + Wl.t[1] * 20], look: [c[0], 18, c[1]], fov: 38 },
      ],
      drift: 1.0, shake: 0.35, oceanSeg: 220,
    });
  },
  keepers_to_west: (a) => {
    const path = [...westWalk].reverse().concat([...westStairs].reverse().slice(0, 30));
    const ws = [0, 1, 2].map((i) => walkPath(path, a.t + (a.p.t0 ?? 20) - i * 1.4, 1.5));
    const looks = [CAST.ducatOilskin, CAST.marshallOilskin, CAST.macarthurShirt];
    const lead = ws[0].pos;
    return W(a, {
      mood: "storm", storm: 1.6, rain: 0.5, lampOn: 0,
      actors: ws.map((w, i) => ({ look: looks[i], pos: w.pos, rotY: w.heading, pose: { walk: w.phase, stride: w.stride, lean: 0.15 } })),
      cam: (() => { const bk = walkPath(path, a.t + (a.p.t0 ?? 20) - 6, 1.5).pos; return [{ t: 0, pos: [bk[0] + 2, bk[1] + 3.2, bk[2] + 2] as V3, look: [lead[0], lead[1] + 1.2, lead[2]] as V3, fov: 46 }]; })(),
      drift: 0.3, shake: 0.1, shadows: true,
    });
  },
  hypothesis_wave: (a) => {
    const plat = off([Wl.cx, Wl.cz], Wl.n, Wl.t, -2, 0);
    const pp = (dn: number, dt: number): V3 => {
      const q = off(plat, Wl.n, Wl.t, dn, dt);
      return [q[0], 2.15, q[1]];
    };
    const u = ci(a.t, [a.p.waveFrom ?? 1, a.p.waveTo ?? a.D - 1], [0, 1]);
    const gone = u > 0.72;
    const face = Math.atan2(-Wl.n[0], -Wl.n[1]);
    const actors: Actor[] = gone
      ? []
      : [
          { look: CAST.ducatOilskin, pos: pp(0, -1.5), rotY: face + 1.2, pose: { lean: 0.4, crouch: 0.3, armL: [-1.1, 0, 0.3], armR: [-1.1, 0, 0.3] } },
          { look: CAST.marshallOilskin, pos: pp(0.6, 1.2), rotY: face + 1.0, pose: { lean: 0.4, crouch: 0.3, armL: [-1.0, 0, 0.4], armR: [-1.0, 0, 0.4] } },
          { look: CAST.macarthurShirt, pos: pp(4.5, 0), rotY: face + Math.PI, pose: { armR: [-1.6 * smooth(0.3, 0.5, u), 0, 0.2], head: [0, -0.2] } },
        ];
    return W(a, {
      mood: "storm", storm: 2.0, rain: 0.8, lampOn: 0,
      actors,
      wave: { u, at: [plat[0] - Wl.n[0] * 6, 0, plat[1] - Wl.n[1] * 6], dir: Math.atan2(-Wl.n[0], -Wl.n[1]) + Math.PI },
      spray: u > 0.6 ? [{ at: [plat[0], 2, plat[1]], period: 3, size: 2.2, phase: -((a.p.waveFrom ?? 1) + (a.p.waveTo ?? a.D - 1)) * 0.62 }] : [],
      cam: [
        { t: 0, pos: [pp(14, 16)[0], 20, pp(14, 16)[2]], look: pp(-4, 0), fov: 46 },
        { t: a.D, pos: [pp(18, 20)[0], 26, pp(18, 20)[2]], look: pp(-6, 0), fov: 48 },
      ],
      drift: 0.5, shake: 0.4 * u, shadows: false,
    });
  },
  west_empty: (a) => {
    const c = off([Wl.cx, Wl.cz], Wl.n, Wl.t, -2, 0);
    return W(a, {
      mood: a.p.mood ?? "storm", storm: a.p.storm ?? 1.5, rain: a.p.rain ?? 0.4, lampOn: 0, damageWest: a.p.dmg ?? 1,
      cam: [
        { t: 0, pos: [c[0] - Wl.n[0] * 38 + Wl.t[0] * 16, 11, c[1] - Wl.n[1] * 38 + Wl.t[1] * 16], look: [c[0] + Wl.n[0] * 6, 9, c[1] + Wl.n[1] * 6], fov: 40 },
        { t: a.D, pos: [c[0] - Wl.n[0] * 30 + Wl.t[0] * 9, 9, c[1] - Wl.n[1] * 30 + Wl.t[1] * 9], look: [c[0] + Wl.n[0] * 6, 10, c[1] + Wl.n[1] * 6], fov: 38 },
      ],
      drift: 0.25, shadows: true,
    });
  },
  macarthur_out: (a) => {
    const door: V3 = at(LH.x - 6, LH.z + 5.2);
    const path: [number, number, number][] = [door, at(LH.x - 2, LH.z + 13), at(LH.x - 20, LH.z + 30), at(LH.x - 60, LH.z + 30)];
    const w = walkPath(path, a.t, 2.6);
    return W(a, {
      mood: "grey", storm: 1.6, rain: 0.5, lampOn: 0,
      actors: [{ look: CAST.macarthurShirt, pos: w.pos, rotY: w.heading, pose: { walk: w.phase * 1.3, stride: w.stride, lean: 0.3 } }],
      cam: [
        { t: 0, pos: [door[0] + 6, door[1] + 2.0, door[2] + 13], look: [door[0], door[1] + 1.4, door[2] + 4], fov: 40 },
        { t: a.D, pos: [door[0] - 6, door[1] + 2.2, door[2] + 22], look: [door[0] - 22, door[1] + 1.2, door[2] + 28], fov: 42 },
      ],
      drift: 0.2, shake: 0.08, shadows: true,
    });
  },
  morning_work: (a) =>
    W(a, {
      mood: "dawn", storm: 1.3, lampOn: 0, lit: 0.4,
      actors: [
        { look: CAST.ducat, pos: at(ST[0] + 6, ST[2] + 16), rotY: 0.6, pose: { armR: [-1.0, 0, 1.2], armL: [-0.8, 0, 1.4], head: [0, 0.4] }, prop: "book" },
        { look: CAST.marshall, pos: at(ST[0] - 4, ST[2] + 18), rotY: -0.9, pose: { lean: 0.35, armR: [-1.0 + Math.sin(a.t * 2) * 0.2, 0, 0.6] }, prop: "rope" },
        { look: CAST.macarthur, pos: at(ST[0] + 2, ST[2] + 21), rotY: 2.6, pose: { head: [0.6, -0.1] } },
      ],
      cam: [
        { t: 0, pos: [ST[0] + 9, ST[1] + 2.6, ST[2] + 27], look: [ST[0] + 1, ST[1] + 1.2, ST[2] + 18], fov: 40 },
        { t: a.D, pos: [ST[0] + 6, ST[1] + 2.4, ST[2] + 26], look: [ST[0], ST[1] + 1.3, ST[2] + 18], fov: 38 },
      ],
      drift: 0.1, shadows: true,
    }),
  memorial_walk: (a) => {
    // closing: three figures walk away into the mist toward the sea (impressionistic, labelled)
    const path = [...westWalk].reverse();
    const ws = [0, 1, 2].map((i) => walkPath(path, a.t + 3 - i * 1.3, 1.0));
    const looks = [CAST.ducatOilskin, CAST.marshallOilskin, CAST.macarthurShirt];
    const c = ws[1].pos;
    const back = walkPath(path, a.t - 2.5, 1.0).pos;
    return W(a, {
      mood: a.p.mood ?? "dusk", storm: 1.0, lampOn: a.p.lamp ?? 0.8, beam: a.p.lamp ? beamAngle(a.t) : null, lit: 0.3,
      actors: ws.map((w, i) => ({ look: looks[i], pos: w.pos, rotY: w.heading, pose: { walk: w.phase, stride: w.stride } })),
      cam: [{ t: 0, pos: [back[0] + 2, back[1] + 2.6, back[2] + 3], look: [c[0], c[1] + 1.3, c[2]], fov: 44 }],
      drift: 0.12, shadows: true,
    });
  },

  /* ---------------- INTERIORS ---------------- */
  kitchen: (a) => {
    const legend = a.p.legendFrom !== undefined ? ci(a.t, [a.p.legendFrom, a.p.legendFrom + 1.5], [1, 0]) : a.p.legend ?? 0;
    const visitor = a.p.visitor;
    const w = visitor ? walkPath([[2.6, 0, 2.6], [0.9, 0, 1.6]], a.t, 0.9) : null;
    return (
      <InteriorCanvas
        scale={a.scale}
        cam={fit(
          a.p.close
            ? [{ t: 0, pos: [1.6, 1.35, 2.0], look: [0.2, 0.85, 0.2], fov: 38 }, { t: a.D, pos: [1.2, 1.2, 1.6], look: [0.2, 0.8, 0.2], fov: 36 }]
            : [{ t: 0, pos: [2.4, 1.7, 2.4], look: [-0.4, 0.9, -0.6], fov: 50 }, { t: a.D, pos: [1.6, 1.55, 2.2], look: [-1.0, 0.9, -0.8], fov: 46 }],
          a.portrait,
        )}
      >
        <Kitchen legend={legend} fire={0} lampOn={a.p.lampOn ?? 0} windowLight={a.p.windowLight ?? 0.5} clockHand={2.1} />
        {w ? <Person look={CAST.moore} position={w.pos} rotY={w.heading} pose={{ walk: w.phase, stride: w.stride, armR: [-0.5, 0, 0.9] }} lantern={1} /> : null}
        {legend > 0.05 ? <ambientLight intensity={0.25 * legend} color="#ff6a50" /> : null}
      </InteriorCanvas>
    );
  },
  bedroom: (a) => (
    <InteriorCanvas scale={a.scale} cam={fit([{ t: 0, pos: [0.6, 1.6, 2.2], look: [-0.4, 0.6, -1.4], fov: 52 }, { t: a.D, pos: [-0.3, 1.5, 2.0], look: [0.6, 0.6, -1.4], fov: 50 }], a.portrait)}>
      <Bedroom lantern={1} windowLight={0.35} />
    </InteriorCanvas>
  ),
  coat_hall: (a) => (
    <InteriorCanvas scale={a.scale} cam={fit([{ t: 0, pos: [0.2, 1.6, 2.8], look: [0.6, 1.2, -1.9], fov: 50 }, { t: a.D, pos: [1.2, 1.5, 1.2], look: [1.6, 1.15, -1.9], fov: 42 }], a.portrait)}>
      <CoatHall coats={[false, false, true]} highlight={a.t > (a.p.highlightAt ?? 9999) ? 2 : -1} />
    </InteriorCanvas>
  ),
  log_desk: (a) => (
    <InteriorCanvas scale={a.scale} cam={fit([{ t: 0, pos: [0.3, 1.5, 0.9], look: [0.0, 0.78, 0.0], fov: 40 }, { t: a.D, pos: [0.1, 1.25, 0.55], look: [0.15, 0.78, 0.0], fov: 36 }], a.portrait)}>
      <LogDesk write={a.p.write ? ci(a.t, [0, a.D], [0.2, 1]) : 1} lampOn={1} />
      <ambientLight intensity={0.12} />
    </InteriorCanvas>
  ),
  stairs: (a) => {
    const climb = ci(a.t, [0, a.D], [0, 3.2]);
    const ang = climb / 0.19 * 0.36;
    const pos: V3 = [Math.cos(-ang) * 1.1, climb + 0.05, Math.sin(-ang) * 1.1];
    return (
      <InteriorCanvas scale={a.scale} drift={0.02} cam={fit([{ t: 0, pos: [0.0, 4.2, 0.0], look: [1.0, 0.6, 0.4], fov: 70 }, { t: a.D, pos: [0, 6.0, 0], look: [1.0, 2.5, -0.6], fov: 70 }], a.portrait)}>
        <SpiralStair height={10} />
        <Person look={CAST.moore} position={pos} rotY={-ang - Math.PI / 2} pose={{ walk: a.t * 5, stride: 0.7, armR: [-0.5, 0, 0.9] }} lantern={1} />
        <ambientLight intensity={0.08} />
      </InteriorCanvas>
    );
  },
  lantern_room: (a) => (
    <InteriorCanvas
      scale={a.scale}
      cam={fit([{ t: 0, pos: [2.6, 2.1, -1.4], look: [0.2, 1.4, 0.4], fov: 54 }, { t: a.D, pos: [2.2, 1.8, -2.0], look: [0.4, 1.4, 0.5], fov: 50 }], a.portrait)}
    >
      <LanternRoom lampOn={a.p.lampOn ?? 0} rot={a.p.lampOn ? a.t * 0.2 : 0} outside={a.p.outside ?? "#22323a"} />
      {a.p.keeper ? <Person look={CAST.ducat} position={[0.9, 0, 0.9]} rotY={-2.4} pose={{ armR: [-1.4, 0, 0.6 + Math.sin(a.t * 3) * 0.3], armL: [-0.4, 0, 0.5], head: [0, 0.1] }} prop={a.p.prop ?? "cloth"} /> : null}
      <ambientLight intensity={0.1} />
    </InteriorCanvas>
  ),
};

export const SHOT_IDS = Object.keys(SHOTS);
