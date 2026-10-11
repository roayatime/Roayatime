#!/usr/bin/env python3
"""Reproducible narration edit: applies edit/narration_edl.json to source/test1.m4a.

Never modifies the source file. Requires ffmpeg and numpy.
Outputs:
  public/audio/narration_clean.wav  (48 kHz mono, 24-bit) - used by Remotion
  edit/narration_raw_cut.wav        (cut only, no processing) - for A/B checks
"""
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
EDL = json.loads((ROOT / "edit/narration_edl.json").read_text())
SR = EDL["sampleRate"]


def sha256(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def decode_channel(path: Path, channel: str) -> np.ndarray:
    raw = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-i", str(path), "-ar", str(SR), "-f", "f32le", "-"],
        capture_output=True, check=True,
    ).stdout
    a = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2)
    return a[:, {"left": 0, "right": 1}[channel]].astype(np.float64)


def write_f32(path: Path, x: np.ndarray) -> None:
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1",
         "-i", "-", "-c:a", "pcm_s24le", str(path)],
        input=x.astype(np.float32).tobytes(), check=True,
    )


def main() -> None:
    src = ROOT / EDL["source"]
    if sha256(src) != EDL["sourceSha256"]:
        sys.exit("Source audio hash mismatch - refusing to edit a different file.")
    x = decode_channel(src, EDL["channel"])

    pieces = [x[round(k["srcStart"] * SR): round(k["srcEnd"] * SR)].copy() for k in EDL["keep"]]

    # Equal-power crossfade at each join (both sides of every join are room tone).
    xf = round(EDL["crossfadeSec"] * SR)
    t = np.linspace(0, np.pi / 2, xf)
    out = pieces[0]
    for p in pieces[1:]:
        mixed = out[-xf:] * np.cos(t) + p[:xf] * np.sin(t)
        out = np.concatenate([out[:-xf], mixed, p[xf:]])

    fi, fo = round(EDL["fadeInSec"] * SR), round(EDL["fadeOutSec"] * SR)
    out[:fi] *= np.linspace(0, 1, fi)
    out[-fo:] *= np.cos(np.linspace(0, np.pi / 2, fo)) ** 2

    raw_cut = ROOT / "edit/narration_raw_cut.wav"
    write_f32(raw_cut, out)

    pre = "highpass=f=80:poles=2,afftdn=nr=8:nf=-56,acompressor=threshold=-24dB:ratio=2:attack=8:release=180:makeup=1"
    measure = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", str(raw_cut), "-af",
         pre + ",loudnorm=I=-17:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
        capture_output=True, text=True, check=True,
    ).stderr
    m = json.loads(re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", measure, re.S).group(0))
    ln = (
        "loudnorm=I=-17:TP=-1.5:LRA=11:linear=true"
        f":measured_I={m['input_i']}:measured_TP={m['input_tp']}"
        f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}"
    )
    dst = ROOT / "public/audio/narration_clean.wav"
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-i", str(raw_cut), "-af",
         pre + "," + ln + ",alimiter=limit=0.84:attack=2:release=50:level=false",
         "-ar", str(SR), "-c:a", "pcm_s24le", str(dst)],
        check=True,
    )
    dur = len(out) / SR
    print(json.dumps({"measured": m, "cleanDurationSec": round(dur, 4)}, indent=1))


if __name__ == "__main__":
    main()
