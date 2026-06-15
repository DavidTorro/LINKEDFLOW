$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$AppDir = Resolve-Path (Join-Path $ScriptDir "../..")

& (Join-Path $ScriptDir "start-ai.ps1")

Push-Location $AppDir
docker compose up -d
Pop-Location

Write-Host "LinkedFlow arrancado en http://localhost:8080"
