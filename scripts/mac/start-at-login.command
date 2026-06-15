#!/bin/bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
LOG_DIR="$HOME/Library/Logs/LinkedFlow"
mkdir -p "$LOG_DIR"

exec >> "$LOG_DIR/start-at-login.log" 2>&1

echo ""
echo "== $(date '+%Y-%m-%d %H:%M:%S') LinkedFlow autoarranque =="

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker no esta instalado."
  exit 0
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker no responde. Abriendo Docker Desktop..."
  open -a Docker >/dev/null 2>&1 || true

  for i in {1..90}; do
    if docker info >/dev/null 2>&1; then
      echo "Docker responde."
      break
    fi
    sleep 2
  done
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker no arranco a tiempo."
  exit 0
fi

"$APP_DIR/scripts/mac/start-ai.command" || true

cd "$APP_DIR"
docker compose up -d

echo "LinkedFlow autoarrancado."
