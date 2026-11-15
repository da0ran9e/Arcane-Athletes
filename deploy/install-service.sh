#!/usr/bin/env sh
# Ubuntu/Debian: run the game as a systemd service so it starts on boot and restarts if it stops.
# Usage:  sudo sh deploy/install-service.sh        (if node came from nvm: sudo env "PATH=$PATH" sh deploy/install-service.sh)
# Remove: sudo systemctl disable --now aetheria && sudo rm /etc/systemd/system/aetheria.service
set -e
DIR=$(cd "$(dirname "$0")/.." && pwd)
NODE=$(command -v node) || { echo "node was not found in PATH (see the usage note at the top of this file)"; exit 1; }
RUN_AS=${SUDO_USER:-$(id -un)}
[ -f "$DIR/.env" ] || echo "Note: $DIR/.env does not exist yet - it is created on first start; paste your tunnel token there."
sed -e "s|__DIR__|$DIR|g" -e "s|__NODE__|$NODE|g" -e "s|__USER__|$RUN_AS|g" "$DIR/deploy/aetheria.service" > /etc/systemd/system/aetheria.service
systemctl daemon-reload
systemctl enable --now aetheria
systemctl --no-pager --lines=8 status aetheria || true
echo "Installed. Follow the log with: journalctl -u aetheria -f    Restart after editing .env: sudo systemctl restart aetheria"
