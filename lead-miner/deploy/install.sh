#!/usr/bin/env bash
# Install Lead Miner on a Linux home server and schedule the daily run.
# Usage: sudo deploy/install.sh   (run from the lead-miner directory)
set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUN_USER="${SUDO_USER:-$(whoami)}"

echo "Installing in $DIR for user $RUN_USER"
sudo -u "$RUN_USER" python3 -m venv "$DIR/.venv"
sudo -u "$RUN_USER" "$DIR/.venv/bin/pip" install -q -r "$DIR/requirements.txt"
# Browser for the user that runs the job, plus its system libraries.
sudo -u "$RUN_USER" "$DIR/.venv/bin/playwright" install chromium
"$DIR/.venv/bin/playwright" install-deps chromium

[ -f "$DIR/config/campaigns.yaml" ] || sudo -u "$RUN_USER" cp "$DIR/config/campaigns.example.yaml" "$DIR/config/campaigns.yaml"
if [ ! -f /etc/lead-miner.env ]; then
  install -m 600 -o "$RUN_USER" "$DIR/.env.example" /etc/lead-miner.env
  echo "Put your ANTHROPIC_API_KEY in /etc/lead-miner.env"
fi

for unit in lead-miner.service lead-miner.timer; do
  sed -e "s#__DIR__#$DIR#g" -e "s#__USER__#$RUN_USER#g" "$DIR/deploy/$unit" > "/etc/systemd/system/$unit"
done
systemctl daemon-reload
systemctl enable --now lead-miner.timer
systemctl list-timers lead-miner.timer --no-pager
echo "Done. Run now with: sudo systemctl start lead-miner.service ; logs: journalctl -u lead-miner -f"
