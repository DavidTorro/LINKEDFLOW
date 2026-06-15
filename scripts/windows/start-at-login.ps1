$ErrorActionPreference = "Continue"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$AppDir = Resolve-Path (Join-Path $ScriptDir "../..")
$LogDir = Join-Path $env:LOCALAPPDATA "LinkedFlow\Logs"
New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
$LogPath = Join-Path $LogDir "start-at-login.log"

Start-Transcript -Path $LogPath -Append | Out-Null
Write-Host "== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') LinkedFlow autoarranque =="

try {
  docker info *> $null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker no responde. Abriendo Docker Desktop..."
    Start-Process "Docker Desktop" -ErrorAction SilentlyContinue

    for ($i = 1; $i -le 90; $i++) {
      docker info *> $null
      if ($LASTEXITCODE -eq 0) {
        Write-Host "Docker responde."
        break
      }
      Start-Sleep -Seconds 2
    }
  }

  & (Join-Path $ScriptDir "start-ai.ps1")

  Push-Location $AppDir
  docker compose up -d
  Pop-Location

  Write-Host "LinkedFlow autoarrancado."
} finally {
  Stop-Transcript | Out-Null
}
