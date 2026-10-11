#!/usr/bin/env bash
# Replace the audio of an existing master with a new Remotion audio-only mix, without touching the picture.
#   scripts/remix_audio.sh <video_master.mp4> <mix.wav> <gain_dB> <out.mp4>
# The video stream is copied bit-for-bit. The only audio processing is ONE static gain (no compressor,
# no limiter), used to land the stereo programme on the target loudness (-17 LUFS, see PRODUCTION_REPORT.md).
set -euo pipefail
video="$1"; mix="$2"; gain="$3"; out="$4"
mkdir -p "$(dirname "$out")"
ffmpeg -hide_banner -loglevel error -y -i "$video" -i "$mix" \
  -map 0:v:0 -map 1:a:0 -c:v copy \
  -af "volume=${gain}dB" -c:a aac -b:a 256k -ar 48000 \
  -shortest -movflags +faststart "$out"
