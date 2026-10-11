# Voice feasibility test — Egyptian Arabic male narrator (phase 1)

Status: **BLOCKED in this cloud sandbox by network policy. No synthetic audio has been generated.**
Nothing below is a listening result. No sample exists yet, so naturalness has not been judged.

## Environment

| Resource | Value |
|---|---|
| CPU / RAM / GPU | 4 vCPU, 15 GB RAM, **no GPU** |
| Free disk | ~27 GB |
| Reachable | PyPI, npm |
| Blocked by the environment's egress policy | `huggingface.co`, `hf-mirror.com`, `modelscope.cn`, `download.pytorch.org`, GitHub release pages and API |

## Selected candidate: VoiceTut-TTS

| | |
|---|---|
| What | Egyptian Arabic TTS, OmniVoice (k2-fsa) fine-tuned on ~380 h of Egyptian podcast speech. Arabic/English code-switching, Egyptian text normalizer, zero-shot cloning |
| Code | `pip install voicetut-tts==0.1.1` (PyPI, 26 KB wheel), source github.com/MohammedAly22/voicetut-tts |
| Weights | Hugging Face `mohammedaly22/VoiceTut-TTS`, plus OmniVoice runtime (`pip install omnivoice==0.2.1`) |
| License | VoiceTut code and model card: **Apache-2.0** (commercial use allowed). OmniVoice code: Apache-2.0; its weight license is not stated on the repo page, so confirm on the model card before monetizing. The provenance and consent of VoiceTut's podcast training data are not documented. |
| Built-in male voices (package style tags) | **Omar** «حكواتي، بطئ» (storyteller, slow): first choice for suspense. **Mohamed** «هادي، عميق» (calm, deep). **Zaki** «رزين، موثوق». Also Abdelrahman, Aly, Abdullah, Kamal, Hossam, Sayed |
| Dependencies | Python ≥3.10, torch ≥2.4, torchaudio, transformers ≥5.3, accelerate, librosa, soundfile, huggingface_hub |
| Published speed | GPU only: NVIDIA T4 fp16, 32 steps, mean real-time factor (RTF) 1.13, peak VRAM 2.93 GB. **No CPU figures are published.** CPU must run float32 (the loader defaults to float16). |
| Responsible use (model card) | Get consent before cloning a voice; disclose synthetic audio |

Why this candidate: it is the only one found that is **Egyptian-dialect specific, permissively licensed,
and ships male storyteller voices**. Rejected options:

| Candidate | Reason |
|---|---|
| EGTTS V0.1, NileTTS | XTTS-v2 fine-tunes, so they inherit the Coqui Public Model License (**non-commercial**). Unsuitable for a monetized channel. |
| Temsah-TTS | Spark-TTS base (CC BY-NC-SA, non-commercial) |
| Piper `ar_JO-kareem` | Jordanian, not Egyptian, and also hosted on Hugging Face |
| Microsoft Edge "ar-EG-Shakir" via `edge-tts` | Not open source; it is an unofficial use of a commercial cloud service, so terms of use are unclear |
| espeak-ng Arabic | Free and local, but robotic. Unacceptable for storytelling. |

## What was verified here

1. **The dependency install works from PyPI alone.** In a fresh venv on Python 3.13,
   `pip install voicetut-tts==0.1.1 omnivoice==0.2.1` installed torch 2.14.1 (+cu130 build, runs on
   CPU), torchaudio 2.11.0 and transformers 5.19.0, in about 45 min (≈5 GB of PyPI downloads, 6.2 GB venv).
   All modules import. Resampling through torchaudio works, and the OmniVoice model class loads.
2. The package source was inspected. It downloads the checkpoint and `reference_speakers/` with
   `huggingface_hub` from `mohammedaly22/VoiceTut-TTS`.
3. **Blocker (reproduced with the real loader):**
   `VoiceTutTTS.from_pretrained('mohammedaly22/VoiceTut-TTS', device='cpu', dtype='float32')`
   fails with `ProxyError 403 Forbidden`: the egress proxy refuses `CONNECT huggingface.co:443`
   (organization network policy). The weights cannot be fetched, so the model cannot run here.

## How to unblock (pick one)

- **A. Allow Hugging Face in this cloud environment:** environment settings → Network access → add
  `huggingface.co` (and `*.hf.co`, which serves the large files), keeping package managers allowed. Then run
  the command below. Expected CPU speed is unknown; a guess is several minutes per 25 s of audio,
  to be measured.
- **B. Run it on your own PC.** No upload is involved; an NVIDIA GPU makes it near real-time.
  ```bash
  python -m venv .venv && .venv\Scripts\activate          # Windows
  pip install torch torchaudio                             # add --index-url .../cu121 if you have an NVIDIA GPU
  pip install omnivoice==0.2.1 voicetut-tts==0.1.1 soundfile numpy
  ```

## Reproducible sample command (ready, not yet run)

```bash
python pipeline/voice/synthesize.py episodes/flannan-isles/script/voice_sample.json \
    --speaker Omar --speed 0.92 --num-step 32 --device cpu \
    --out episodes/flannan-isles/audio/tts_sample_omar
```

- **Input:** `voice_sample.json` holds the first 10 lines of the lighthouse narration (~25 s): your exact
  recorded wording and **your own measured pauses** (0.44–1.55 s). The AI read can then be compared
  line by line against your take.
- **Output:** one WAV per line in `lines/` (regenerate one with `--only p04`), `narration.wav`
  (−17 LUFS, −1.5 dBTP, same target as your narration), and `manifest.json` (per-line start/end
  for Remotion).
- **Guards:**
  - Stops after 40 s of speech unless `episodes/<ep>/script/VOICE_APPROVED` exists.
  - Cloning requires `episodes/<ep>/audio/CLONE_CONSENT.json` naming the reference file.

## Planned comparison (once a sample exists)

For each line, compared with your recording of the same text:
- duration and speech rate
- pause fidelity
- pronunciation of Egyptian forms («علشان»، «بيختفي»، «تطمّن»، «إيه اللي»)
- intonation on suspense lines («النور بيختفي»، «لكن المفاجأة…»)
- an ASR round-trip check (Whisper word error rate)
- a listening note

## Text-side check that did run (VoiceTut's Egyptian normalizer, no weights needed)

The package's `ArabicNormalizer` was run on all 10 sample lines:

| Input | Normalizer output | Note |
|---|---|---|
| تخيّل… / شغّال / تطمّن | تخيل… / شغال / تطمن | shadda is stripped; pronunciation is left to the model |
| علشان / عشان | عَلَشَان / عَشَان | Egyptian forms recognized and diacritized |
| `1900` | ألف وتُسْعُمِية | correct Egyptian reading |
| `26 ديسمبر` | سِتَّه وعِشْرين ديسمبر | correct |
| `١٩٠٠` (Arabic-Indic digits) | تِسَعْتَاشَر، زيرو زيرو | **wrong for a year** |

**Script rule from this test:** in narration scripts sent to TTS, write years and numbers in Western
digits (`1900`) or spelled out (`ألف وتسعمية`), never Arabic-Indic digits. On-screen titles can keep
Arabic-Indic digits.
