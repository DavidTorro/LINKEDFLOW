#!/bin/bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
OLLAMA_MODEL="${OLLAMA_MODEL:-qwen3:8b}"
OLLAMA_VISION_MODEL="${OLLAMA_VISION_MODEL:-gemma3:4b}"

"$APP_DIR/scripts/mac/start-ai.command"

echo "Actualizando modelo principal: $OLLAMA_MODEL"
ollama pull "$OLLAMA_MODEL"

echo "Actualizando modelo de vision: $OLLAMA_VISION_MODEL"
ollama pull "$OLLAMA_VISION_MODEL"

echo "Modelos actualizados."
