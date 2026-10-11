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

RENDER_STATS_PLACEHOLDER

## 6. Environment and limits

| Check | Result |
|---|---|
| Uploaded audio accessible | Yes |
| Remotion | 4.0.534, installed from npm |
| Renderer | Native Remotion CLI (`remotion render`) with the pre-installed Chromium headless shell. The default browser download host is unreachable. |
| MP4 export | Yes: real H.264/AAC files, verified with ffprobe |
| Network | npm and PyPI reachable. Hugging Face, the OpenAI CDN, Wikimedia and Google Fonts (from inside the headless browser) are blocked. So there is no archival imagery: every visual is an original reconstruction, and the fonts are bundled locally. |
| Paid services | None used |
