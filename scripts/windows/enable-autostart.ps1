$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$StartupDir = [Environment]::GetFolderPath("Startup")
$CmdPath = Join-Path $StartupDir "LinkedFlow-start.cmd"
$TargetScript = Join-Path $ScriptDir "start-at-login.ps1"

@"
@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "$TargetScript"
"@ | Set-Content -Path $CmdPath -Encoding ASCII

Write-Host "Autoarranque activado."
