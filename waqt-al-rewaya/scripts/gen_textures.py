#!/usr/bin/env python3
"""Generates the original procedural textures used by the scenes (public/textures).

Everything is synthesized from seeded spectral (1/f) noise - no third-party imagery.
Deterministic: same seeds -> same files. Requires numpy + Pillow.
"""
from pathlib import Path

import numpy as np
from PIL import Image

OUT = Path(__file__).resolve().parent.parent / "public/textures"
OUT.mkdir(parents=True, exist_ok=True)


def fractal(h, w, beta, seed, sx=1.0, sy=1.0):
    """Tileable fractal noise in [0,1]. sx/sy < 1 stretch features along that axis."""
    rng = np.random.default_rng(seed)
    fy = np.fft.fftfreq(h)[:, None] / sy
    fx = np.fft.rfftfreq(w)[None, :] / sx
    f = np.sqrt(fx**2 + fy**2)
    f[0, 0] = 1
    spec = np.fft.rfft2(rng.standard_normal((h, w))) / f ** (beta / 2)
    spec[0, 0] = 0
    n = np.fft.irfft2(spec, s=(h, w))
    n = (n - n.mean()) / (n.std() + 1e-9)
    return np.clip(0.5 + n * 0.18, 0, 1)


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def lerp(a, b, t):
    return np.asarray(a)[None, None, :] * (1 - t[..., None]) + np.asarray(b)[None, None, :] * t[..., None]


def save_rgba(name, rgb, alpha=None):
    rgb = np.clip(rgb, 0, 255).astype(np.uint8)
    if alpha is None:
        Image.fromarray(rgb, "RGB").save(OUT / name, optimize=True)
    else:
        a = np.clip(alpha * 255, 0, 255).astype(np.uint8)[..., None]
        Image.fromarray(np.concatenate([rgb, a], -1), "RGBA").save(OUT / name, optimize=True)
    print("wrote", name)


def clouds(name, seed, dark, lit, cover):
    h, w = 1024, 2560
    d = fractal(h, w, 3.4, seed, sx=0.55)
    detail = fractal(h, w, 2.2, seed + 7)
    dens = smooth(cover, cover + 0.32, d * 0.82 + detail * 0.18)
    light = smooth(0.35, 0.8, fractal(h, w, 3.0, seed + 3, sx=0.6)) * (0.35 + 0.65 * (1 - dens))
    rgb = lerp(dark, lit, light)
    save_rgba(name, rgb, dens * 0.96)


def fog(name, seed, color, strength):
    h, w = 768, 2048
    n = fractal(h, w, 3.1, seed, sx=0.3)
    env = np.sin(np.linspace(0, np.pi, h))[:, None] ** 1.6
    a = smooth(0.32, 0.85, n) * env * strength
    rgb = np.broadcast_to(np.asarray(color, float), (h, w, 3))
    save_rgba(name, rgb, a)


def sea():
    h, w = 1024, 2048
    n = 0.55 * fractal(h, w, 2.2, 21, sx=0.12) + 0.45 * fractal(h, w, 2.8, 22, sx=0.2)
    gy = np.roll(n, -1, 0) - n
    gy = gy / (gy.std() + 1e-9)
    shade = np.clip(0.45 + gy * 0.28 + (n - 0.5) * 0.5, 0, 1)
    base = lerp([10, 18, 24], [58, 74, 84], shade)
    foam = smooth(0.74, 0.86, n) * smooth(0.45, 0.7, fractal(h, w, 2.0, 23))
    rgb = base * (1 - foam[..., None] * 0.6) + np.asarray([170, 182, 188])[None, None, :] * foam[..., None] * 0.6
    save_rgba("sea.png", rgb)


def grain():
    rng = np.random.default_rng(5)
    g = np.clip(128 + rng.standard_normal((512, 512)) * 42, 0, 255)
    save_rgba("grain.png", np.repeat(g[..., None], 3, -1))


def rock():
    h = w = 1024
    n = fractal(h, w, 2.6, 31)
    ridged = 1 - np.abs(2 * fractal(h, w, 2.2, 32, sy=0.5) - 1)
    strata = 0.5 + 0.5 * np.sin(np.linspace(0, 70, h)[:, None] + n * 9)
    v = 0.45 * n + 0.35 * ridged ** 2 + 0.2 * strata
    rgb = lerp([16, 17, 19], [92, 90, 86], smooth(0.2, 0.95, v))
    save_rgba("rock.png", rgb)


def turf():
    h, w = 512, 1024
    n = fractal(h, w, 2.4, 41, sx=0.5)
    rgb = lerp([22, 30, 22], [70, 82, 56], smooth(0.3, 0.8, n))
    save_rgba("turf.png", rgb)


def plaster():
    h = w = 1024
    n = fractal(h, w, 2.8, 51)
    stain = smooth(0.55, 0.9, fractal(h, w, 3.4, 52, sy=0.4))
    rgb = lerp([168, 166, 156], [126, 122, 110], n * 0.6 + stain * 0.5)
    save_rgba("plaster.png", rgb)


def wood():
    h, w = 512, 1024
    n = fractal(h, w, 2.5, 61, sx=0.04)
    rings = 0.5 + 0.5 * np.sin(n * 40)
    rgb = lerp([34, 22, 14], [96, 66, 40], 0.6 * n + 0.4 * rings)
    plank = (np.arange(h) % 128) < 3
    rgb[plank] *= 0.35
    save_rgba("wood.png", rgb)


if __name__ == "__main__":
    clouds("clouds_storm.png", 1, [8, 11, 16], [74, 86, 98], 0.26)
    clouds("clouds_low.png", 2, [14, 18, 24], [96, 106, 114], 0.36)
    clouds("clouds_dawn.png", 3, [62, 68, 74], [176, 178, 172], 0.30)
    fog("fog_a.png", 11, [196, 206, 214], 0.85)
    fog("fog_b.png", 12, [170, 182, 192], 0.7)
    sea()
    grain()
    rock()
    turf()
    plaster()
    wood()
