# Production report — Waqt Al Rewaya · Flannan Isles test episode

## 1. Source audio

| Property | Value |
|---|---|
| File | `source/test1.m4a` (SHA-256 `2db4221c…c73f758`, unchanged) |
| Format | AAC-LC in MP4, 48 kHz, stereo, 128 kb/s |
| Duration | 70.59 s |
| Loudness | −23.9 LUFS integrated, peak −0.1 dBFS (right channel) |
| Channels | L/R are **not** identical: correlation 0.68, R leads/lags L by 8 samples (0.17 ms). R SNR ≈ 28.8 dB, L ≈ 22.7 dB. No flat-top clipping (max 3 consecutive samples above −0.26 dBFS, all plosive peaks). |

**Channel decision:** summing L+R would comb-filter the voice (first notch ≈ 3 kHz) because of the
8-sample offset. The narration uses the **right channel only**, as mono.

## 2. How the content was identified

Silence detection cannot tell a retake from a dramatic pause, so the recording was transcribed.
Hugging Face and the OpenAI model CDN are blocked by this sandbox's network policy, so Whisper
small/base were installed from npm packages (Apache-2.0 ONNX builds of the MIT Whisper weights) and
run **locally on CPU**. Three steps:

1. **Whole-file pass.** It hallucinated a loop over the first 28 s, a known Whisper failure on
   long room tone, so this pass was discarded.
2. **Per-island pass.** Each speech island found by the energy envelope was transcribed on its own,
   with greedy and beam-5 decoding and four sampled decodes for the weak phrases.
3. **Verification pass.** The *cleaned* file was transcribed again to confirm the edit: it has no
   «إعادة» and only one ship sentence.

### Map of the original recording

| Source time (s) | Content | Decision |
|---|---|---|
| 0.00 – 6.60 | room tone, faint handling noise | **cut** |
| 6.60 – 8.30 | incomplete first attempt «تخيل إنك مسؤول عن منا…» (ASR: «تخيل لناك مسؤولة عن مرابب») | **cut**, false start |
| 9.50 – 25.75 | complete opening: «تخيّل إنك مسؤول عن منارة…» through «…النور بيختفي» | **keep** (pauses preserved) |
| 26.85 – 32.50 | take 1 of the ship sentence, with a stumble «…تتطمن على الرجال / على الرجالة اللي عايشين هناك» | **cut**, later take preferred |
| 34.00 – 34.40 | spoken editing marker «إعادة» | **cut** |
| 36.00 – 66.60 | take 2 of the ship sentence through the closing question | **keep** |
| 66.60 – 70.59 | trailing room tone (Whisper hallucinated text here; there is no speech) | **cut** |

### Edit (frame-accurate, `edit/narration_edl.json`)

- Keep **A** = 9.20 → 26.55 s (17.35 s). Starts on the breath before «تخيل»; ends 0.8 s after
  «النور بيختفي» to keep the dramatic pause.
- Keep **B** = 35.55 → 67.60 s (32.05 s). Starts 0.45 s before «وبعد أيام» (take 2) and keeps 1 s
  of room tone for the fade-out.
- Join: 40 ms equal-power crossfade, room tone on both sides (no consonant or breath is touched).
  The pause between «بيختفي» and «وبعد أيام» is 1.25 s, a natural-sounding dramatic beat.
- 60 ms fade-in, 600 ms fade-out.
- Clean duration: **49.36 s**.

### Processing chain (`scripts/edit_narration.py`)

1. High-pass 80 Hz, 2-pole. Justified: 15–23 dB of the total energy sat below 90 Hz (rumble).
2. `afftdn` nr=8 dB, nf=−56 dB. Conservative: the measured noise floor is −56 dBFS RMS.
3. Gentle compressor: −24 dB threshold, 2:1, 8 ms attack, 180 ms release.
4. Two-pass EBU R128 `loudnorm` to −17 LUFS, −1.5 dBTP, then a safety limiter.

Result: **−17.2 LUFS, true peak −1.5 dBFS, LRA 4.4 LU**. The voice is the narrator's real voice
throughout. Nothing was synthesized, cloned, translated or re-recorded.

### Uncertain decisions (please verify by ear)

| Clean time | Phrase used | Why uncertain |
|---|---|---|
| 9.25 – 11.75 | «علشان السفن تعرف طريقها وسط الظلام» | ASR variants: «لكي تتعرف طريقه وستزلون», «على شان سوف تتعرف طريقه وست الزلون», «وعلى شن السفن تعرف طريقه وست الزلان». «علشان» and «السفن» are consistent; the last word may be «الضلمة» rather than «الظلام». |
| 38.38 – 40.08 | «والسؤال هنا مش بس هما راحوا فين» | ASR consistently heard «مش بستهم مرحبين / مراحفين»; «مش بس هما راحوا فين» is the closest natural reading. |
| (spelling) | «تطمّن», «زي ده», «ينقذهم» | ASR wrote «تتطمن», «زيادة», «ينقظهم»; normalized to standard Egyptian spelling. |
| 6.6 – 8.3 (cut) | false start | Judged incomplete because it stops after ~1.5 s and the same sentence restarts at 9.5 s in full. |

All captions are flagged in `edit/transcript.json` (`confidence: high/medium`). If a phrase is
wrong, edit that file and re-render; captions and SRT/VTT update together.

## 3. Scene timeline (full video)

Video time = narration time + 5.0 s title sequence. Every cut sits inside a narration pause.

| Video (s) | Scene | Narration | Visual | Sound |
|---|---|---|---|---|
| 0.0 – 9.25 | A · Island + title | «تخيّل إنك مسؤول عن منارة…» | Storm dusk, island and lighthouse, beam sweeping, slow push-in; brand + title, then location label | whoosh, title low hit, ocean + wind |
| 9.25 – 13.75 | B1 · Keeper | «كل ليلة / ومهمتك الوحيدة…» | Lantern-room interior: rotating lens, keeper silhouette, rain on the glazing | beds muffled (interior) |
| 13.75 – 17.05 | B2 · Beam | «علشان السفن تعرف طريقها…» | Low angle on the lantern, beam sweeping the sea, distant steamer | ocean/wind back up |
| 17.05 – 22.45 | C · Light out | «بس في ليلة من الليالي / النور بيختفي» | Wide night shot. The light stutters and dies on the word, then darkness and a fade to black. Label «ديسمبر ١٩٠٠» | drone rises, **flame-out**, beds drop |
| 22.45 – 30.75 | D · Ship | «وبعد أيام بتوصل سفينة… / لكن المفاجأة…» | Grey dawn fog, steamer approaching the island; label «٢٦ ديسمبر ١٩٠٠ · هسبيروس»; push-in on «المفاجأة» | **ship whistle**, **riser** cut dead on «لكن المفاجأة» |
| 30.75 – 35.35 | E1 · Door | «مفيش حد بيرد» | Closed door of the quarters in fog, slow push-in, camera jolt per knock | **three knocks**, near-silence |
| 35.35 – 39.15 | E2 · Standing | «المنارة موجودة / والجزيرة موجودة» | Daylight. Close on the tower, pulling back to the whole island; gulls | thin wind |
| 39.15 – 42.75 | E3 · Vanished | «لكن الرجالة التلاتة / اختفوا» | Empty quarters, three hooks, one oilskin coat. The keepers' names appear, then dissolve on «اختفوا» | drone swells, then **total silence** and a sub hit |
| 42.75 – 54.0 | F · Question | «والسؤال هنا… / …ينقذهم؟» | Dark lighthouse in the storm, slow pull-back, one lightning flash | storm returns, distant thunder, drone rising |
| 54.0 – 60.5 | End card | — | «لغز جزر فلانان / ثلاثة حرّاس… ولا أثر», brand «وقت الرواية», fade out | low hit, beds fade |

### Vertical short (`ShortVideo.tsx`, 36.0 s)

This is a new vertical edit, not a crop of the 16:9 video. Every scene re-lays out its world for
9:16: island geometry, camera anchors, text sizes and safe areas all change.

- **Hook (0–4 s):** the lit lighthouse, with «لغز منارة جزر فلانان · اسكتلندا · ديسمبر ١٩٠٠»
  and a low hit.
- **Narration excerpt 1:** clean 12.2 → 37.3 s, from «بس في ليلة من الليالي» through «اختفوا».
- **Excerpt 2:** clean 42.55 → 49.36 s, «إيه اللي ممكن يخلّي… ينقذهم؟». The cut removes
  «والسؤال هنا مش بس هما راحوا فين… السؤال الحقيقي» to keep the teaser near 35 s. The meaning is
  unchanged: the closing question is still the narrator's own words.
- **Closing card:** «تفتكر إيه اللي حصل؟» plus the brand.

## 4. Captions

- Burned in, phrase by phrase, in Noto Kufi Arabic 600 with RTL shaping. Rendered and checked:
  letters are joined and the order is right-to-left.
- Landscape: above the bottom letterbox bar. Portrait: at 76% of the height, clear of TikTok/Shorts UI.
- Separate files: `deliverables/subtitles/*.ar.srt` and `*.ar.vtt` for the full video, the short,
  and the bare cleaned narration.

## 5. Rendering report

Measured on the delivered files (ffprobe / ffmpeg ebur128 / full decode), 2026-10-11.

| | Full video | Vertical short |
|---|---|---|
| Path | `deliverables/waqt-al-rewaya_flannan_full_1080p.mp4` | `deliverables/waqt-al-rewaya_flannan_short_1080x1920.mp4` |
| Resolution / aspect | 1920×1080, 16:9 (SAR 1:1) | 1080×1920, 9:16 (SAR 1:1) |
| Duration / frames | 60.501 s / 1815 frames | 36.010 s / 1080 frames |
| Frame rate | 30 fps (constant) | 30 fps (constant) |
| Video | H.264 High, yuv420p, BT.709, ~7.7 Mb/s | H.264 High, yuv420p, BT.709, ~11.0 Mb/s |
| Audio | AAC-LC, 48 kHz stereo, ~200 kb/s | AAC-LC, 48 kHz stereo, ~200 kb/s |
| File size | 59,940,514 bytes (57.2 MiB) | 50,417,336 bytes (48.1 MiB) |
| Loudness | −15.0 LUFS integrated, −1.3 dBFS peak | −14.9 LUFS integrated, −1.2 dBFS peak |
| Full decode (`ffmpeg -v error -f null`) | no errors | no errors |

**Pipeline.** `remotion render` (Remotion 4.0.534, Chromium headless shell 1194, concurrency 4,
JPEG q92 frames, x264 CRF 18) followed by `scripts/master.sh` (alimiter at −1.5 dBFS, x264 CRF 20
slow, `+faststart`). The raw Remotion renders peaked at +0.02 dBFS and were 103.8 MB / 87.4 MB.
The mastering pass removes the overs and keeps each file under GitHub's 100 MB limit.

**Render time on this 4-vCPU container:** full video ≈ 35 min, short ≈ 22 min, mastering ≈ 5 min each.

**Review copies** (`deliverables/review/`) are a second x264 pass at 3.4 Mb/s (full) and 4.8 Mb/s
(short), at the same resolution. They exist only to fit the 30 MiB chat attachment limit. Use
the masters for publishing.

**A/V sync (measured).** The cleaned narration was cross-correlated against the final mixed audio.
- Full video: narration found at 5.003 s, against 5.000 s expected. The same +3 ms holds 30 s later
  (35.003 s), so there is no drift. The 3 ms is the AAC encoder delay, about 0.1 frame.
- Short: excerpt 1 is off by +3 ms. Excerpt 2 is off by −13.7 ms because its trim point is rounded
  to a whole frame (under half a frame).
- Captions, scene cuts and sound cues are all derived from the same `edit/transcript.json` times.

**Arabic text (visually verified on frames decoded from the final MP4s).** The title, brand,
captions, labels and keeper names all render with joined letters and right-to-left order, inside
the safe margins, in both orientations.

**Mix.** Speech sections measure about −14.3 LUFS short-term. The ambience alone (title section)
measures −23.4 LUFS, so the narrator sits about 9 dB above the beds. Beds are ducked further
inside the interiors, and the mix drops to silence after «اختفوا».

## 6. Environment and limits

| Check | Result |
|---|---|
| Uploaded audio accessible | Yes |
| Remotion | 4.0.534, installed from npm |
| Renderer | Native Remotion CLI (`remotion render`) with the pre-installed Chromium headless shell. The default browser download host is unreachable. |
| MP4 export | Yes: real H.264/AAC files, verified with ffprobe |
| Network | npm and PyPI reachable. Hugging Face, the OpenAI CDN, Wikimedia and Google Fonts (from inside the headless browser) are blocked. So there is no archival imagery: every visual is an original reconstruction, and the fonts are bundled locally. |
| Paid services | None used |

## 7. Privacy: the original recording is in a public repository

`waqt-al-rewaya/source/test1.m4a` (the unedited take, including the false start, the discarded take and
the spoken «إعادة»), `public/audio/narration_clean.wav`, `edit/narration_raw_cut.wav` and both MP4s
contain the narrator's real voice. If `roayatime/Roayatime` is public, anyone can download them, and
they stay in Git history even if the files are deleted later. **No destructive Git action was taken.**

Options, from least to most invasive. The repository owner decides.
1. **Make the repository private** (GitHub → Settings → General → Danger Zone → Change visibility).
   Nothing is rewritten, and this takes effect immediately for new visitors.
2. **Keep the repository public but stop tracking the audio from now on.** Remove the files in a new
   commit and add them to `.gitignore`. Note that they **remain in history** on this branch.
3. **Purge the files from history** with `git filter-repo --path waqt-al-rewaya/source/test1.m4a --invert-paths`
   (repeat for the other audio files), then force-push. This rewrites the branch, so anyone with a clone
   must re-clone. Forks, caches and existing clones keep the old data, and GitHub Support can be asked to
   purge cached views. If a recording has already been exposed and matters, treat it as published.

To keep the project reproducible without committing the voice, store `source/test1.m4a` outside Git and
copy it in before running `npm run assets`. `scripts/edit_narration.py` checks its SHA-256 before every edit.

## 8. V2 — narration-first mix (audience feedback)

Viewers found the continuous sound design distracting. V2 makes the narrator's voice the only sound
under the narration. The V1 masters are kept unchanged; V2 files have new names:

- `deliverables/v2/waqt-al-rewaya_flannan_full_1080p_v2_narration-first.mp4`
- `deliverables/v2/waqt-al-rewaya_flannan_short_1080x1920_v2_narration-first.mp4`
- `deliverables/v2/review/*_review.mp4`: bitrate-reduced copies for chat review (under 30 MiB)

### What changed

| Element | V1 (cinematic) | V2 (narration-first) |
|---|---|---|
| Ocean bed | entire video, automated | **full only, 0–4.4 s**: fades in 0–0.6 s, out 2.8–4.4 s, then removed from the timeline |
| Foghorn | 7 s ship whistle during the ship scene | **full only**: one new soft, distant 3.8 s foghorn at 0.5 s; its tail fully decays by ~3.5 s |
| Wind bed, drone bed | entire video | removed |
| Title whoosh, title/vanished/end hits, thunder | yes | removed |
| Flame-out, riser, door knocks | yes | removed |
| Short: hook hit, all beds and cues | yes | removed: the voice starts at 0.6 s, too soon for a natural fade |
| Narration | cleaned narration, unchanged | **same cleaned narration, unchanged**: same edit, timing and pauses |
| Rain, music | none in V1 either (rain is visual only, no music was ever used) | none |

Mix selection lives in `src/audio/SoundDesign.tsx` (`SELECTED_MIX = "narration-first"`). The V1
design is still in `FullVideo.tsx` / `ShortVideo.tsx` as the `cinematic` mix, and can be rendered with
`--props='{"mix":"cinematic"}'`.

### How V2 was produced

1. `npm run render:full:mix` / `render:short:mix`: Remotion audio-only renders of the same compositions
   (same timeline, so it is frame-accurate with the picture).
2. `scripts/remix_audio.sh`: the **video stream is copied bit-for-bit** from the V1 masters (MD5 of the
   V1 and V2 video streams are identical, so visuals, captions and titles are unchanged), plus the new
   audio with one static gain of −2.8 dB, encoded as AAC 256 kb/s. No compressor and no limiter are used.

### Loudness note

The cleaned narration file is mono and measures −17.2 LUFS. In a stereo video the same mono voice is
played on both channels, and EBU R128 measures that 3 dB louder (−14.2 LUFS). To land the delivered
stereo programme on the requested −17 LUFS, one static −2.8 dB gain was applied. This does not change
the voice's dynamics, pitch or pacing.

### Measured results (final V2 files)

| | Full V2 | Short V2 |
|---|---|---|
| Video | 1920×1080 16:9, 30 fps, H.264 (copied from V1) | 1080×1920 9:16, 30 fps, H.264 (copied from V1) |
| Duration | 60.500 s | 36.000 s |
| Audio | AAC-LC 48 kHz stereo, ~223 kb/s | AAC-LC 48 kHz stereo, ~221 kb/s |
| Size | 60,100,213 bytes | 50,509,316 bytes |
| Integrated loudness | **−17.0 LUFS** | **−17.1 LUFS** |
| True peak | **−4.3 dBTP** | **−4.2 dBTP** |
| LRA | 5.2 LU | 4.5 LU |
| Full decode | no errors | no errors |

**No residual effects under the voice.** The cleaned narration was subtracted from the rendered mix,
aligned to the sample:
- Full video, 5.0–54.4 s: residual **−96.1 dBFS**, worst 0.5 s window −95.2 dBFS, against narration at −18.5 dBFS.
- Short, both excerpts: residual −95.9 / −96.6 dBFS.

This is numerical silence: nothing but the narration is present.

**Fades.** The full intro rises from −53 dBFS to about −28 dBFS by 1.25 s, decays smoothly to −64 dBFS at
4.25 s, and is digital silence from 4.5 s until the voice at 5.0 s. After the narration's own 0.6 s
room-tone fade-out (about 54.4 s), the end card is silent. The short is digital silence before 0.6 s,
between the excerpts and over the end card. The excerpt edges keep their 3–4 frame fades, so there are no clicks.

**Sync.** The narration sits at 5.0000 s in the full V2, with 0.0 ms error at both 1 s and 30 s into it.
In the short, excerpt 1 is at +0.00 ms and excerpt 2 is at −16.7 ms. That is the same frame-rounded
trim as in V1; it was preserved deliberately.
