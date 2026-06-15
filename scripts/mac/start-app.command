#!/bin/bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

"$APP_DIR/scripts/mac/start-ai.command"

cd "$APP_DIR"
docker compose up -d

echo "LinkedFlow arrancado en http://localhost:8080"
