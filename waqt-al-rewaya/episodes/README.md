# Episodes

One folder per episode. Each folder separates the stages of production:

```
episodes/<slug>/
  research/   sources, citations, a facts / disputed / legend / dramatization ledger
  script/     narration script JSON (lines + authored pauses), approvals (VOICE_APPROVED)
  audio/      recorded or generated narration, CLONE_CONSENT.json  (git-ignored)
  assets/     licensed historical media + license records         (git-ignored)
  timeline/   Remotion timing manifests
  renders/    review and master renders                            (git-ignored)
```

`flannan-isles` is the pilot. Its completed V1/V2 videos are unchanged and still built from `src/`.
