#!/usr/bin/env bash
# Final mastering of a Remotion render: true-peak-safe audio limiter (-1.5 dBTP)
# and an efficient x264 encode (CRF 20, yuv420p, BT.709, faststart) for upload.
# Usage: scripts/master.sh out/render.mp4 deliverables/final.mp4
set -euo pipefail
in="$1"; out="$2"
mkdir -p "$(dirname "$out")"
ffmpeg -hide_banner -loglevel error -y -i "$in" \
  -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  -af "alimiter=limit=0.84:attack=3:release=60:level=false,aresample=48000" \
  -c:a aac -b:a 192k -movflags +faststart "$out"
