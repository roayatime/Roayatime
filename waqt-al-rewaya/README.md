# وقت الرواية — لغز اختفاء حراس منارة جزر فلانان

Remotion project that turns the narrator's original recording (`source/test1.m4a`) into:

| Output | Composition | Format |
|---|---|---|
| Full YouTube video | `WaqtAlRewaya-Flannan-Full` | 1920×1080, 30 fps, H.264 + AAC |
| Vertical teaser | `WaqtAlRewaya-Flannan-Short` | 1080×1920, 30 fps, H.264 + AAC |

Rendered files, subtitles, thumbnails and the cleaned narration are in [`deliverables/`](deliverables/).
How the edit was made is in [PRODUCTION_REPORT.md](PRODUCTION_REPORT.md). Asset rights are in [ATTRIBUTION.md](ATTRIBUTION.md).

## Layout

```
source/test1.m4a            original recording (never modified; SHA-256 is checked before every edit)
edit/narration_edl.json     audio edit decision list (what was kept/cut and why)
edit/transcript.json        phrase timings + text (drives captions, SRT/VTT, scene sync)
scripts/edit_narration.py   applies the EDL -> public/audio/narration_clean.wav
scripts/gen_textures.py     procedural textures -> public/textures
scripts/gen_sfx.py          procedural sound design -> public/sfx
scripts/export_subtitles.py SRT/VTT export
scripts/asr/                offline Whisper tooling used to transcribe the recording
src/timeline.ts             single source of timing (narration time -> frames, scene cuts)
src/scenes/S01..S10         one file per scene, each laid out for 16:9 and 9:16
src/components/             reusable layers (sky, sea, fog, rain, grain, island, lighthouse, ship, captions)
src/audio/SoundDesign.tsx   keyframed ambience beds + one-shot cues
src/FullVideo.tsx           full 16:9 master
src/ShortVideo.tsx          9:16 teaser master
```

## Reproduce

Requirements: Node 18+, Python 3 with numpy + Pillow, ffmpeg, and a Chromium/headless shell.
`remotion.config.ts` points at `/opt/pw-browsers/...headless_shell`. Set `REMOTION_BROWSER` to use
another browser, or delete that line to let Remotion download its own.

```bash
npm install
npm run assets          # cleaned narration + textures + sound design (deterministic, ~2 min)
npm run render:full     # out/waqt-al-rewaya_flannan_full_1080p.mp4
npm run render:short    # out/waqt-al-rewaya_flannan_short_1080x1920.mp4
npm run render:thumbs
python3 scripts/export_subtitles.py
npm run dev             # Remotion Studio, every scene is also its own composition
```
