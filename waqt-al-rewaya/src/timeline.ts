// Single source of truth for timing.
// "Narration time" (c) = seconds inside public/audio/narration_clean.wav.
// See edit/narration_edl.json for how that file was cut from the original recording.

import transcript from "../edit/transcript.json";

export const FPS = 30;
export const NARRATION_DURATION = 49.36;

export const f = (seconds: number) => Math.round(seconds * FPS);

export type Phrase = { start: number; end: number; text: string; confidence: "high" | "medium" };

// Phrases live in edit/transcript.json (shared with scripts/export_subtitles.py).
// Phrase boundaries come from the energy envelope of the recording (25 ms resolution);
// text was transcribed locally with Whisper (small + base, several decodes) and
// reviewed by hand. "medium" = the ASR hypotheses disagreed; the wording is the
// best reconstruction and is flagged in TRANSCRIPT.md for the narrator to verify.
export const PHRASES: Phrase[] = transcript.phrases as Phrase[];

// Story beats in narration time, used by scenes and sound design.
export const BEATS = {
  lightOut: 15.75, // "النور بيختفي"
  surprise: 24.56, // "لكن المفاجأة"
  knocks: 25.95,
  noAnswer: 27.68,
  threeMen: 34.31,
  vanished: 36.16, // "اختفوا"
  question: 42.76,
  lastWord: 48.36,
};

// ---------- Full 16:9 video ----------
export const FULL_OFFSET = transcript.fullOffset; // title sequence before the narration starts

// Scene cuts in narration time (each cut sits inside a pause in the narration).
export const FULL_SCENES = {
  island: { from: -FULL_OFFSET, to: 4.25 },
  keeper: { from: 4.25, to: 8.75 },
  beam: { from: 8.75, to: 12.05 },
  lightOut: { from: 12.05, to: 17.45 },
  ship: { from: 17.45, to: 25.75 },
  door: { from: 25.75, to: 30.35 },
  standing: { from: 30.35, to: 34.15 },
  vanished: { from: 34.15, to: 37.75 },
  question: { from: 37.75, to: 49.0 },
  endCard: { from: 49.0, to: 55.5 },
} as const;

export const FULL_DURATION = f(FULL_OFFSET + FULL_SCENES.endCard.to);

// ---------- Vertical 9:16 short ----------
// Two narration excerpts. The cut drops "والسؤال هنا مش بس هما راحوا فين… السؤال الحقيقي"
// so the teaser runs ~35 s and goes straight from "اختفوا" to the closing question.
export type Excerpt = { cFrom: number; cTo: number; at: number };
export const SHORT_EXCERPTS: Excerpt[] = transcript.shortExcerpts;
export const SHORT_DURATION = f(36.0);

/** Maps a narration time to video seconds in the short, or null when that time was cut. */
export const shortTime = (c: number): number | null => {
  for (const e of SHORT_EXCERPTS) {
    if (c >= e.cFrom && c <= e.cTo) return e.at + (c - e.cFrom);
  }
  return null;
};
