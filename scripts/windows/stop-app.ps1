$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$AppDir = Resolve-Path (Join-Path $ScriptDir "../..")

Push-Location $AppDir
docker compose stop
Pop-Location

Write-Host "LinkedFlow parado. Ollama sigue abierto."
Write-Host "Para parar tambien la IA ejecuta scripts/windows/stop-ai.bat"
