#!/usr/bin/env sh
# Ubuntu / macOS: start the game server and the Cloudflare tunnel.  Usage: ./start.sh
cd "$(dirname "$0")" || exit 1
command -v node >/dev/null 2>&1 || { echo "Node.js 20.11+ is required: https://nodejs.org"; exit 1; }
exec node run.mjs "$@"
