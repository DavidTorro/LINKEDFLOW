#!/bin/bash
set -euo pipefail

echo "Arrancando Ollama..."

if curl -fsS http://localhost:11434/api/tags >/dev/null 2>&1; then
  echo "Ollama ya esta respondiendo en http://localhost:11434."
  exit 0
fi

open -a Ollama >/dev/null 2>&1 || true

for i in {1..30}; do
  if curl -fsS http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo "Ollama responde correctamente."
    exit 0
  fi
  sleep 2
done

echo "No se pudo abrir la app de Ollama. Intentando arrancar 'ollama serve' en segundo plano..."
mkdir -p "$HOME/Library/Logs/LinkedFlow"
nohup ollama serve > "$HOME/Library/Logs/LinkedFlow/ollama.log" 2>&1 &

for i in {1..30}; do
  if curl -fsS http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo "Ollama responde correctamente."
    exit 0
  fi
  sleep 2
done

echo "ERROR: Ollama no responde en http://localhost:11434."
echo "Abre Ollama manualmente y vuelve a ejecutar este script."
exit 1
