#!/usr/bin/env python3
"""Exports SRT/WebVTT subtitles from edit/transcript.json, with the same timing
rules the burned-in captions use (src/components/text.tsx captionWindows)."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
T = json.loads((ROOT / "edit/transcript.json").read_text())
OUT = ROOT / "out/subtitles"
OUT.mkdir(parents=True, exist_ok=True)


def windows(items):
    res = []
    for i, p in enumerate(items):
        start = p["start"] - 0.08
        end = max(p["end"] + 0.45, start + 0.9)
        if i + 1 < len(items):
            end = min(end, items[i + 1]["start"] - 0.1)
        res.append({"start": start, "end": end, "text": p["text"]})
    return res


def ts(t, sep):
    ms = round(max(t, 0) * 1000)
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02}{sep}{ms:03}"


def write(name, items):
    w = windows(items)
    srt = "\n".join(f"{i + 1}\n{ts(c['start'], ',')} --> {ts(c['end'], ',')}\n{c['text']}\n" for i, c in enumerate(w))
    vtt = "WEBVTT\nLanguage: ar\n\n" + "\n".join(f"{ts(c['start'], '.')} --> {ts(c['end'], '.')}\n{c['text']}\n" for c in w)
    (OUT / f"{name}.ar.srt").write_text(srt, encoding="utf-8")
    (OUT / f"{name}.ar.vtt").write_text(vtt, encoding="utf-8")
    print("wrote", name, len(w), "cues")


def short_time(c):
    for e in T["shortExcerpts"]:
        if e["cFrom"] <= c <= e["cTo"]:
            return e["at"] + (c - e["cFrom"])
    return None


phr = T["phrases"]
write("narration_clean", phr)
write("waqt-al-rewaya_flannan_full_1080p", [{**p, "start": p["start"] + T["fullOffset"], "end": p["end"] + T["fullOffset"]} for p in phr])
short = []
for p in phr:
    a, b = short_time(p["start"]), short_time(p["end"])
    if a is not None and b is not None:
        short.append({**p, "start": a, "end": b})
write("waqt-al-rewaya_flannan_short_1080x1920", short)
