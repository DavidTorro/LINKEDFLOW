#!/bin/bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
OLLAMA_MODEL="${OLLAMA_MODEL:-qwen3:8b}"
OLLAMA_VISION_MODEL="${OLLAMA_VISION_MODEL:-gemma3:4b}"

echo "== LinkedFlow installer para macOS =="

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker no esta instalado."

  if ! command -v brew >/dev/null 2>&1; then
    echo "Homebrew no esta instalado. Instalando Homebrew..."
    NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    if [ -x "/opt/homebrew/bin/brew" ]; then
      eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [ -x "/usr/local/bin/brew" ]; then
      eval "$(/usr/local/bin/brew shellenv)"
    fi
  fi

  if command -v brew >/dev/null 2>&1; then
    echo "Instalando Docker Desktop con Homebrew..."
    brew install --cask docker || true
  fi

  if ! command -v docker >/dev/null 2>&1; then
    echo "No se pudo instalar Docker automaticamente."
    echo "Se abrira la descarga oficial. Instala Docker Desktop, abrelo una vez y vuelve a ejecutar este instalador."
    open "https://www.docker.com/products/docker-desktop/" >/dev/null 2>&1 || true
    exit 1
  fi
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker esta instalado pero no esta arrancado. Abriendo Docker Desktop..."
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
  echo "ERROR: Docker Desktop no arranco a tiempo."
  echo "Abre Docker Desktop manualmente y vuelve a ejecutar este instalador."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: Docker Compose no esta disponible."
  echo "Actualiza Docker Desktop y vuelve a ejecutar este instalador."
  exit 1
fi

if ! command -v ollama >/dev/null 2>&1; then
  if [ -x "/opt/homebrew/bin/brew" ]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  elif [ -x "/usr/local/bin/brew" ]; then
    eval "$(/usr/local/bin/brew shellenv)"
  fi
fi

if ! command -v ollama >/dev/null 2>&1; then
  echo "Ollama no esta instalado. Instalando..."
  curl -fsSL https://ollama.com/install.sh | sh
else
  echo "Ollama ya esta instalado."
fi

"$APP_DIR/scripts/mac/start-ai.command"

echo "Descargando modelo principal: $OLLAMA_MODEL"
ollama pull "$OLLAMA_MODEL"

echo "Descargando modelo de vision: $OLLAMA_VISION_MODEL"
ollama pull "$OLLAMA_VISION_MODEL"

if [ ! -f "$APP_DIR/.env" ]; then
  echo "Creando configuracion .env..."
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
fi

echo "Levantando LinkedFlow..."
cd "$APP_DIR"
docker compose up -d --build

"$APP_DIR/scripts/mac/enable-autostart.command"

echo ""
echo "Instalacion completada."
echo "Abre LinkedFlow en: http://localhost:8080"
echo "Desde otro dispositivo de la LAN o Tailscale: http://IP_DEL_MAC:8080"
