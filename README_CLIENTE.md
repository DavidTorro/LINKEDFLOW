# LinkedFlow para cliente

LinkedFlow usa:

- Docker Desktop para la app (`web` + `backend`).
- Ollama nativo para la IA.
- Puerto `8080` para acceder a la app.

## Instalacion en macOS

1. Ejecuta `scripts/mac/install-mac.command`.
2. Abre la app en `http://localhost:8080`.

El instalador intenta instalar Homebrew si falta, luego Docker Desktop con Homebrew. Si no puede, abre la descarga oficial de Docker Desktop; instala Docker, abrelo una vez y vuelve a ejecutar el instalador.

Desde otro equipo de la red local o por Tailscale, usa:

```txt
http://IP_DEL_MAC:8080
```

## Instalacion en Windows

1. Ejecuta `scripts/windows/install-windows.bat`.
2. Abre la app en `http://localhost:8080`.

El instalador intenta instalar Docker Desktop y Ollama con `winget` si faltan. Si no hay `winget`, descarga los instaladores oficiales y los ejecuta. Si Windows pide confirmacion o reinicio, acepta, abre Docker Desktop una vez y vuelve a ejecutar `install-windows.bat`.

Desde otro equipo de la red local o por Tailscale, usa:

```txt
http://IP_DEL_PC:8080
```

## Arrancar y parar en macOS

Arrancar app + IA:

```bash
scripts/mac/start-app.command
```

Parar solo la app:

```bash
scripts/mac/stop-app.command
```

Parar solo la IA para ahorrar recursos:

```bash
scripts/mac/stop-ai.command
```

Volver a arrancar la IA:

```bash
scripts/mac/start-ai.command
```

Actualizar modelos:

```bash
scripts/mac/update-models.command
```

## Arrancar y parar en Windows

Arrancar app + IA:

```txt
scripts/windows/start-app.bat
```

Parar solo la app:

```txt
scripts/windows/stop-app.bat
```

Parar solo la IA para ahorrar recursos:

```txt
scripts/windows/stop-ai.bat
```

Volver a arrancar la IA:

```txt
scripts/windows/start-ai.bat
```

Actualizar modelos:

```txt
scripts/windows/update-models.bat
```

## Modelos usados

- `qwen3:8b`: generacion de comentarios.
- `gemma3:4b`: vision para analizar contenido extraido de posts.

La configuracion queda en `.env`. Por defecto el backend en Docker usa Ollama nativo del Mac mediante:

```env
OLLAMA_BASE_URL=http://host.docker.internal:11434
```

## Tailscale

Instala Tailscale en el ordenador host y entra desde fuera con:

```txt
http://IP_TAILSCALE_DEL_ORDENADOR:8080
```

No hace falta exponer Ollama. Ollama se queda local en el ordenador y solo lo usa el backend.

## Autoarranque macOS

El instalador activa un LaunchAgent de macOS para que, al iniciar sesion, se abra Docker Desktop si hace falta, se arranque Ollama y se levante LinkedFlow.

Activar manualmente:

```bash
scripts/mac/enable-autostart.command
```

Desactivar:

```bash
scripts/mac/disable-autostart.command
```

Los logs quedan en:

```txt
~/Library/Logs/LinkedFlow/
```

## Autoarranque Windows

El instalador crea un archivo en la carpeta de Inicio del usuario. Al iniciar sesion, abre Docker Desktop si hace falta, arranca Ollama y levanta LinkedFlow.

Activar manualmente:

```txt
scripts/windows/enable-autostart.bat
```

Desactivar:

```txt
scripts/windows/disable-autostart.bat
```

Los logs quedan en:

```txt
%LOCALAPPDATA%\LinkedFlow\Logs\
```
