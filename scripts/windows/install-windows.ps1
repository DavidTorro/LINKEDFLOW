$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$AppDir = Resolve-Path (Join-Path $ScriptDir "../..")
$OllamaModel = if ($env:OLLAMA_MODEL) { $env:OLLAMA_MODEL } else { "qwen3:8b" }
$OllamaVisionModel = if ($env:OLLAMA_VISION_MODEL) { $env:OLLAMA_VISION_MODEL } else { "gemma3:4b" }

Write-Host "== LinkedFlow installer para Windows =="

function Test-Command($Name) {
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Add-KnownProgramPaths {
  $KnownPaths = @(
    "$env:ProgramFiles\Docker\Docker\resources\bin",
    "$env:LOCALAPPDATA\Programs\Ollama"
  )

  foreach ($Path in $KnownPaths) {
    if ((Test-Path $Path) -and ($env:Path -notlike "*$Path*")) {
      $env:Path = "$Path;$env:Path"
    }
  }
}

function Install-FromUrl($Url, $FileName, $ArgumentList) {
  $InstallerPath = Join-Path $env:TEMP $FileName

  Write-Host "Descargando $FileName..."
  Invoke-WebRequest -Uri $Url -OutFile $InstallerPath

  Write-Host "Ejecutando instalador..."
  $Process = Start-Process -FilePath $InstallerPath -ArgumentList $ArgumentList -Wait -PassThru

  if ($Process.ExitCode -ne 0) {
    Write-Host "El instalador termino con codigo $($Process.ExitCode). Puede que necesite confirmacion manual."
  }
}

Add-KnownProgramPaths

if (-not (Test-Command "docker")) {
  Write-Host "Docker no esta instalado."

  if (Test-Command "winget") {
    Write-Host "Instalando Docker Desktop con winget..."
    winget install -e --id Docker.DockerDesktop --accept-package-agreements --accept-source-agreements
  } else {
    Install-FromUrl `
      -Url "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe" `
      -FileName "DockerDesktopInstaller.exe" `
      -ArgumentList @("install", "--quiet")
  }

  Add-KnownProgramPaths

  if (-not (Test-Command "docker")) {
    Write-Host "No se pudo instalar Docker automaticamente."
    Write-Host "Se abrira la descarga oficial. Instala Docker Desktop, abrelo una vez y vuelve a ejecutar este instalador."
    Start-Process "https://www.docker.com/products/docker-desktop/"
    exit 1
  }
}

docker info *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Docker esta instalado pero no esta arrancado. Abriendo Docker Desktop..."
  $DockerDesktopPath = "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
  if (Test-Path $DockerDesktopPath) {
    Start-Process $DockerDesktopPath -ErrorAction SilentlyContinue
  } else {
    Start-Process "Docker Desktop" -ErrorAction SilentlyContinue
  }

  for ($i = 1; $i -le 90; $i++) {
    docker info *> $null
    if ($LASTEXITCODE -eq 0) {
      Write-Host "Docker responde."
      break
    }
    Start-Sleep -Seconds 2
  }
}

docker info *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Error "Docker Desktop no arranco a tiempo. Abre Docker Desktop manualmente y vuelve a ejecutar este instalador."
}

docker compose version *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Error "Docker Compose no esta disponible. Actualiza Docker Desktop y vuelve a ejecutar este instalador."
}

if (-not (Test-Command "ollama")) {
  Write-Host "Ollama no esta instalado."

  if (Test-Command "winget") {
    Write-Host "Instalando Ollama con winget..."
    winget install -e --id Ollama.Ollama --accept-package-agreements --accept-source-agreements
  } else {
    Install-FromUrl `
      -Url "https://ollama.com/download/OllamaSetup.exe" `
      -FileName "OllamaSetup.exe" `
      -ArgumentList @()
  }

  Add-KnownProgramPaths

  if (-not (Test-Command "ollama")) {
    Write-Host "No se pudo instalar Ollama automaticamente."
    Write-Host "Se abrira la descarga oficial. Instala Ollama y vuelve a ejecutar este instalador."
    Start-Process "https://ollama.com/download/windows"
    exit 1
  }
} else {
  Write-Host "Ollama ya esta instalado."
}

& (Join-Path $ScriptDir "start-ai.ps1")

Write-Host "Descargando modelo principal: $OllamaModel"
ollama pull $OllamaModel

Write-Host "Descargando modelo de vision: $OllamaVisionModel"
ollama pull $OllamaVisionModel

$EnvPath = Join-Path $AppDir ".env"
$EnvExamplePath = Join-Path $AppDir ".env.example"
if (-not (Test-Path $EnvPath)) {
  Write-Host "Creando configuracion .env..."
  Copy-Item $EnvExamplePath $EnvPath
}

Write-Host "Levantando LinkedFlow..."
Push-Location $AppDir
docker compose up -d --build
Pop-Location

& (Join-Path $ScriptDir "enable-autostart.ps1")

Write-Host ""
Write-Host "Instalacion completada."
Write-Host "Abre LinkedFlow en: http://localhost:8080"
Write-Host "Desde otro dispositivo de la LAN o Tailscale: http://IP_DEL_PC:8080"
