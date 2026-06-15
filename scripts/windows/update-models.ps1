$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$OllamaModel = if ($env:OLLAMA_MODEL) { $env:OLLAMA_MODEL } else { "qwen3:8b" }
$OllamaVisionModel = if ($env:OLLAMA_VISION_MODEL) { $env:OLLAMA_VISION_MODEL } else { "gemma3:4b" }

& (Join-Path $ScriptDir "start-ai.ps1")

Write-Host "Actualizando modelo principal: $OllamaModel"
ollama pull $OllamaModel

Write-Host "Actualizando modelo de vision: $OllamaVisionModel"
ollama pull $OllamaVisionModel

Write-Host "Modelos actualizados."
