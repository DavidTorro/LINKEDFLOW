#!/bin/bash
set -euo pipefail

echo "Parando Ollama..."
osascript -e 'quit app "Ollama"' >/dev/null 2>&1 || true
pkill -f "ollama serve" >/dev/null 2>&1 || true
echo "Ollama parado."
