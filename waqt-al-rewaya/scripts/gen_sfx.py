#!/usr/bin/env python3
"""Original procedural sound design (public/sfx). No samples, no third-party audio.

Every sound is synthesized from seeded noise/oscillators, so the files are
deterministic and free of any licensing restriction. Requires numpy + ffmpeg.
"""
import subprocess
from pathlib import Path

import numpy as np

SR = 48000
OUT = Path(__file__).resolve().parent.parent / "public/sfx"
OUT.mkdir(parents=True, exist_ok=True)


def rng(seed):
    return np.random.default_rng(seed)


def fft_filter(x, lo=None, hi=None, slope=None):
    """Zero-phase spectral filter: band [lo,hi] with soft edges, optional 1/f^slope tilt."""
    n = len(x)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    g = np.ones_like(f)
    if lo:
        g *= 1 / (1 + (lo / np.maximum(f, 1e-3)) ** 4)
    if hi:
        g *= 1 / (1 + (f / hi) ** 4)
    if slope:
        g *= 1 / np.maximum(f, 20) ** (slope / 2)
    return np.fft.irfft(X * g, n)


def norm(x, peak_db=-3.0):
    return x / (np.abs(x).max() + 1e-12) * 10 ** (peak_db / 20)


def fft_convolve(x, k):
    m = len(x) + len(k) - 1
    y = np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(k, m), m)
    off = (len(k) - 1) // 2
    return y[off: off + len(x)]


def smooth_env(n, points, seed, lo=0.0, hi=1.0):
    """Random smooth envelope through `points` control values."""
    r = rng(seed)
    ctrl = lo + (hi - lo) * r.random(points)
    xs = np.linspace(0, n, points)
    t = np.arange(n)
    e = np.interp(t, xs, ctrl)
    k = max(1, n // points)
    return fft_convolve(e, np.hanning(k) / np.hanning(k).sum())


def reverb(x, seconds=2.5, seed=99, mix=0.35, damp=3000):
    n = int(seconds * SR)
    ir = rng(seed).standard_normal(n) * np.exp(-np.linspace(0, 7, n))
    ir = fft_filter(ir, hi=damp)
    ir /= np.sqrt((ir**2).sum())
    m = len(x) + n
    wet = np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(ir, m), m)
    dry = np.concatenate([x, np.zeros(n)])
    return (1 - mix) * dry + mix * wet


def stereo(left, right=None):
    right = left if right is None else right
    return np.stack([left, right], 1)


def write(name, x):
    if x.ndim == 1:
        x = stereo(x)
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
         "-c:a", "pcm_s16le", str(OUT / name)],
        input=x.astype(np.float32).tobytes(), check=True,
    )
    print("wrote", name, f"{len(x) / SR:.1f}s")


def ocean(seconds=75):
    n = seconds * SR
    chans = []
    for c in range(2):
        r = rng(10 + c)
        dark = fft_filter(r.standard_normal(n), lo=40, hi=500, slope=1.0)
        bright = fft_filter(r.standard_normal(n), lo=300, hi=5000, slope=0.6)
        swell = np.zeros(n)
        t = 0.0
        while t < seconds:
            period = r.uniform(5.5, 10.5)
            i0, i1 = int(t * SR), int(min(seconds, t + period) * SR)
            ph = np.linspace(0, 1, i1 - i0)
            swell[i0:i1] = np.sin(np.pi * ph) ** 2 * np.exp(-2.2 * ph) * r.uniform(0.6, 1.0)
            t += period * r.uniform(0.55, 0.8)
        swell = fft_convolve(swell, np.hanning(4000) / 2000)
        x = dark / dark.std() * (0.45 + 0.55 * swell) + bright / bright.std() * 0.35 * swell**2
        chans.append(x)
    return norm(stereo(*chans), -6)


def wind(seconds=75):
    n = seconds * SR
    chans = []
    for c in range(2):
        r = rng(20 + c)
        x = np.zeros(n)
        for i, (lo, hi) in enumerate([(150, 400), (350, 900), (800, 2000), (1800, 4200)]):
            band = fft_filter(r.standard_normal(n), lo=lo, hi=hi)
            env = smooth_env(n, seconds // 2, 30 + 7 * c + i, 0.05, 1.0) ** 2
            x += band / band.std() * env * (1.0, 0.8, 0.45, 0.2)[i]
        gust = smooth_env(n, seconds // 3, 40 + c, 0.3, 1.0)
        chans.append(x * gust)
    return norm(stereo(*chans), -6)


def drone(seconds=75):
    n = seconds * SR
    t = np.arange(n) / SR
    left = np.zeros(n)
    right = np.zeros(n)
    for f, a in [(41.2, 1.0), (55.0, 0.7), (61.74, 0.35), (82.4, 0.3), (110.0, 0.12), (164.8, 0.06)]:
        lfo = 0.6 + 0.4 * np.sin(2 * np.pi * t / rng(int(f)).uniform(7, 15) + f)
        left += a * lfo * np.sin(2 * np.pi * f * t)
        right += a * lfo * np.sin(2 * np.pi * (f * 1.004) * t + 0.7)
    air = fft_filter(rng(50).standard_normal(n), lo=200, hi=1200)
    air = air / air.std() * 0.05 * smooth_env(n, seconds // 4, 51, 0.2, 1.0)
    return norm(stereo(left + air, right + air), -6)


def riser(seconds=4.0):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    p = t / seconds
    noise = fft_filter(rng(60).standard_normal(n), lo=300, hi=6000)
    noise = noise / noise.std() * p**3
    freq = 110 * 2 ** (p * 1.5)
    tone = np.sin(2 * np.pi * np.cumsum(freq) / SR) * 0.4 * p**2
    tone2 = np.sin(2 * np.pi * np.cumsum(freq * 1.5) / SR) * 0.2 * p**2
    x = noise * 0.5 + tone + tone2
    x[-int(0.02 * SR):] *= np.linspace(1, 0, int(0.02 * SR))
    return norm(reverb(x, 1.5, mix=0.25)[: n + SR], -4)


def low_hit(seconds=5.0):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    freq = 34 + 30 * np.exp(-t * 6)
    body = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t * 1.1)
    click = fft_filter(rng(70).standard_normal(n), hi=900) * np.exp(-t * 30) * 0.4
    x = body + click / (np.abs(click).max() + 1e-9) * 0.5
    return norm(reverb(x, 3.0, mix=0.3, damp=1500)[:n], -2)


def flame_out(seconds=2.5):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    puff = fft_filter(rng(80).standard_normal(n), lo=250, hi=2500)
    puff = puff / puff.std() * np.exp(-t * 5) * (1 - np.exp(-t * 80))
    thump = np.sin(2 * np.pi * (60 * np.exp(-t * 3)) * t) * np.exp(-t * 4) * 0.6
    return norm(reverb(puff * 0.6 + thump, 1.8, mix=0.3)[:n], -6)


def foghorn(seconds=7.0):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    env = np.clip(t / 0.6, 0, 1) * np.clip((4.2 - t) / 0.9, 0, 1)
    f0 = 92 * (1 + 0.004 * np.sin(2 * np.pi * 4.5 * t))
    ph = 2 * np.pi * np.cumsum(f0) / SR
    x = sum(np.sin(k * ph) / k**1.2 for k in range(1, 12))
    x = fft_filter(x * env, hi=700)
    return norm(reverb(x, 4.0, mix=0.55, damp=900)[:n], -6)


def foghorn_soft(seconds=3.8):
    """Short, distant foghorn whose reverb tail is fully decayed inside the file (narration-first intro)."""
    n = int(seconds * SR)
    t = np.arange(n) / SR
    env = np.clip(t / 0.5, 0, 1) * np.clip((2.0 - t) / 0.8, 0, 1)
    f0 = 88 * (1 + 0.003 * np.sin(2 * np.pi * 4.0 * t))
    ph = 2 * np.pi * np.cumsum(f0) / SR
    x = sum(np.sin(k * ph) / k**1.4 for k in range(1, 9))
    x = fft_filter(x * env, hi=450)
    y = reverb(x, 1.6, mix=0.5, damp=700)[:n]
    fo = int(0.6 * SR)
    y[-fo:] *= np.cos(np.linspace(0, np.pi / 2, fo)) ** 2
    return norm(y, -6)


def knocks(seconds=3.0, times=(0.0, 0.42, 0.84)):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for i, k in enumerate(times):
        i0 = int(k * SR)
        tt = t[: n - i0]
        burst = fft_filter(rng(90 + i).standard_normal(n - i0), lo=80, hi=2500) * np.exp(-tt * 90)
        modes = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) * a
                    for f, d, a in [(170, 28, 1.0), (395, 40, 0.5), (760, 60, 0.25)])
        x[i0:] += burst / (np.abs(burst).max() + 1e-9) * 0.3 + modes * (1 - 0.15 * i)
    return norm(reverb(x, 2.2, mix=0.35, damp=2200)[:n], -4)


def whoosh(seconds=2.2):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    env = np.sin(np.pi * np.clip(t / 1.6, 0, 1)) ** 3
    x = fft_filter(rng(100).standard_normal(n), lo=200, hi=3000) * env
    return norm(reverb(x, 1.2, mix=0.2)[:n], -6)


if __name__ == "__main__":
    write("ocean_bed.wav", ocean())
    write("wind_bed.wav", wind())
    write("drone_bed.wav", drone())
    write("riser.wav", riser())
    write("low_hit.wav", low_hit())
    write("flame_out.wav", flame_out())
    write("foghorn.wav", foghorn())
    write("foghorn_soft.wav", foghorn_soft())
    write("knocks.wav", knocks())
    write("whoosh.wav", whoosh())
