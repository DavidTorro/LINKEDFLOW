$ErrorActionPreference = "Stop"

$StartupDir = [Environment]::GetFolderPath("Startup")
$CmdPath = Join-Path $StartupDir "LinkedFlow-start.cmd"

if (Test-Path $CmdPath) {
  Remove-Item $CmdPath -Force
}

Write-Host "Autoarranque desactivado."
