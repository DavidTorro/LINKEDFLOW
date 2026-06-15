#!/bin/bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

cd "$APP_DIR"
docker compose stop

echo "LinkedFlow parado. Ollama sigue abierto."
echo "Para parar tambien la IA ejecuta scripts/mac/stop-ai.command"
