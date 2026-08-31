#!/usr/bin/env bash
set -Eeuo pipefail

if ! command -v node >/dev/null 2>&1; then
  echo "Error: instala Node.js 24 LTS antes de continuar." >&2
  exit 1
fi

node_major="$(node -p "process.versions.node.split('.')[0]")"
if [ "$node_major" != "24" ]; then
  echo "Error: se requiere Node.js 24 LTS; version actual: $(node --version)." >&2
  exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "Error: instala FFmpeg antes de continuar." >&2
  exit 1
fi

npm ci --no-audit --no-fund
npm run verify
exec npm start
