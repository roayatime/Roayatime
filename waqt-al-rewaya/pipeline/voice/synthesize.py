#!/usr/bin/env python3
"""Line-by-line Egyptian Arabic voiceover with VoiceTut-TTS, plus a Remotion timing manifest.

Each line of a script JSON is synthesized to its own WAV, so one line can be regenerated
(--only p04) without touching the rest. Lines are joined with the script's explicit pauses
(`pause_after`), never with model-chosen silence, so dramatic pauses are authored, not guessed.

Safety rails (production rules for this channel):
  * --max-seconds caps total speech (default 40 s) unless the episode has an approval file
    (<episode>/script/VOICE_APPROVED) - no full episode before a short sample is approved.
  * Voice cloning (--ref-audio) requires <episode>/audio/CLONE_CONSENT.json, written by the
    owner of the voice, naming the reference file. Never clone a voice you do not own.

Example (CPU):
  python pipeline/voice/synthesize.py episodes/flannan-isles/script/voice_sample.json \
      --speaker Omar --out episodes/flannan-isles/audio/tts_sample_omar
"""
import argparse
import hashlib
import json
import subprocess
import sys
import time
from pathlib import Path

import numpy as np
import soundfile as sf

SR_OUT = 48000


def load_engine(model: str, device: str):
    from voicetut_tts import VoiceTutTTS

    # float16 is GPU-only in practice; CPU must run float32.
    dtype = "float32" if device == "cpu" else "float16"
    return VoiceTutTTS.from_pretrained(model, device=device, dtype=dtype)


def to_48k_mono(path: Path) -> np.ndarray:
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(SR_OUT), "-f", "f32le", "-"],
        capture_output=True, check=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def trim_edges(x: np.ndarray, thresh_db: float = -50, pad: float = 0.04) -> np.ndarray:
    """Remove model-generated leading/trailing silence so authored pauses are exact."""
    win = int(0.01 * SR_OUT)
    env = np.sqrt(np.convolve(x**2, np.ones(win) / win, "same"))
    idx = np.where(20 * np.log10(env + 1e-9) > thresh_db)[0]
    if len(idx) == 0:
        return x
    a = max(0, idx[0] - int(pad * SR_OUT))
    b = min(len(x), idx[-1] + int(pad * SR_OUT))
    return x[a:b]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("script", type=Path)
    ap.add_argument("--out", type=Path, required=True)
    ap.add_argument("--speaker", default="Omar")
    ap.add_argument("--ref-audio", type=Path)
    ap.add_argument("--ref-text")
    ap.add_argument("--model", default="mohammedaly22/VoiceTut-TTS")
    ap.add_argument("--device", default="cpu")
    ap.add_argument("--num-step", type=int, default=32)
    ap.add_argument("--guidance-scale", type=float, default=2.5)
    ap.add_argument("--speed", type=float, default=0.92, help="<1 = slower, more suspenseful delivery")
    ap.add_argument("--only", nargs="*", help="regenerate only these line ids")
    ap.add_argument("--max-seconds", type=float, default=40.0)
    args = ap.parse_args()

    doc = json.loads(args.script.read_text(encoding="utf-8"))
    episode_dir = args.script.parent.parent
    approved = (episode_dir / "script" / "VOICE_APPROVED").exists()

    if args.ref_audio:
        consent = episode_dir / "audio" / "CLONE_CONSENT.json"
        if not consent.exists() or args.ref_audio.name not in consent.read_text(encoding="utf-8"):
            sys.exit(f"Refusing to clone: {consent} must exist and name {args.ref_audio.name} (owner's written consent).")
        if not args.ref_text:
            sys.exit("--ref-text (exact transcript of the reference clip) is required for cloning.")

    args.out.mkdir(parents=True, exist_ok=True)
    lines_dir = args.out / "lines"
    lines_dir.mkdir(exist_ok=True)

    tts = load_engine(args.model, args.device)
    voice = {"ref_audio": str(args.ref_audio), "ref_text": args.ref_text} if args.ref_audio else {"speaker": args.speaker}

    timings = []
    total_speech = 0.0
    for line in doc["lines"]:
        wav = lines_dir / f"{line['id']}.wav"
        if args.only is None or line["id"] in args.only or not wav.exists():
            t0 = time.time()
            raw = lines_dir / f"{line['id']}_raw.wav"
            tts.synthesize(line["text"], output=str(raw), num_step=args.num_step,
                           guidance_scale=args.guidance_scale, speed=args.speed, **voice)
            x = trim_edges(to_48k_mono(raw))
            sf.write(wav, x, SR_OUT, subtype="PCM_24")
            print(f"{line['id']}: {len(x) / SR_OUT:.2f}s audio in {time.time() - t0:.1f}s", flush=True)
        x, _ = sf.read(wav, dtype="float32")
        total_speech += len(x) / SR_OUT
        if total_speech > args.max_seconds and not approved:
            sys.exit(f"Stopped at {line['id']}: {total_speech:.1f}s exceeds --max-seconds {args.max_seconds} "
                     f"and {episode_dir}/script/VOICE_APPROVED does not exist.")
        timings.append((line, x))

    # Assemble with authored pauses and write the Remotion manifest (times in seconds).
    parts, manifest, t = [], [], 0.0
    for line, x in timings:
        manifest.append({"id": line["id"], "paragraph": line.get("paragraph"), "text": line["text"],
                         "start": round(t, 3), "end": round(t + len(x) / SR_OUT, 3),
                         "file": f"lines/{line['id']}.wav"})
        parts += [x, np.zeros(int(round(line.get("pause_after", 0.6) * SR_OUT)), np.float32)]
        t += len(x) / SR_OUT + line.get("pause_after", 0.6)
    full = np.concatenate(parts)
    assembled = args.out / "narration_raw.wav"
    sf.write(assembled, full, SR_OUT, subtype="PCM_24")

    # Loudness: two-pass linear EBU R128 to -17 LUFS / -1.5 dBTP (no compressor; same target as human narration).
    final = args.out / "narration.wav"
    meas = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(assembled), "-af",
                           "loudnorm=I=-17:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
                          capture_output=True, text=True).stderr
    m = json.loads(meas[meas.rindex("{"):meas.rindex("}") + 1])
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(assembled), "-af",
                    f"loudnorm=I=-17:TP=-1.5:LRA=11:linear=true:measured_I={m['input_i']}:measured_TP={m['input_tp']}"
                    f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}",
                    "-ar", str(SR_OUT), "-c:a", "pcm_s24le", str(final)], check=True)

    (args.out / "manifest.json").write_text(json.dumps({
        "engine": "VoiceTut-TTS (OmniVoice fine-tune)", "model": args.model, "voice": voice,
        "params": {"num_step": args.num_step, "guidance_scale": args.guidance_scale, "speed": args.speed},
        "script": str(args.script), "script_sha256": hashlib.sha256(args.script.read_bytes()).hexdigest(),
        "sample_rate": SR_OUT, "duration": round(len(full) / SR_OUT, 3), "synthetic": True,
        "lines": manifest,
    }, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"wrote {final} ({len(full) / SR_OUT:.1f}s) and manifest.json")


if __name__ == "__main__":
    main()
