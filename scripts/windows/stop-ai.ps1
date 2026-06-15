$ErrorActionPreference = "Stop"

Write-Host "Parando Ollama..."
Get-Process -Name "ollama" -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "Ollama parado."
