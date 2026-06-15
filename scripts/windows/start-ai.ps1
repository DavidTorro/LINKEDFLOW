$ErrorActionPreference = "Stop"

Write-Host "Arrancando Ollama..."

try {
  Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 2 *> $null
  Write-Host "Ollama ya esta respondiendo en http://localhost:11434."
  exit 0
} catch {
}

if (Get-Command "ollama" -ErrorAction SilentlyContinue) {
  Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
} else {
  Write-Error "Ollama no esta instalado."
}

for ($i = 1; $i -le 60; $i++) {
  try {
    Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 2 *> $null
    Write-Host "Ollama responde correctamente."
    exit 0
  } catch {
    Start-Sleep -Seconds 2
  }
}

Write-Error "Ollama no responde en http://localhost:11434. Abre Ollama manualmente y vuelve a ejecutar este script."
