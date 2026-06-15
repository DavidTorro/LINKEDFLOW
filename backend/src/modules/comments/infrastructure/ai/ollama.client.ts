import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../../../config/env.config';
import type { AiStatus, AiStatusPort } from '../../domain/ports/ai-status.port';
import { OllamaError } from './ollama.error';

// Timeout corto para el chequeo de estado: un health check debe responder rápido
// aunque el modelo de generación tarde minutos.
const HEALTH_CHECK_TIMEOUT_MS = 5000;

// Respuesta de /api/tags: lista de modelos instalados en Ollama.
interface OllamaTagsResponse {
  models?: Array<{ name?: string }>;
}

// Forma de la respuesta de Ollama (modelo y texto generado). El contrato del puerto de generación 
// de comentarios es diferente, así que el adapter se encarga de mapear esta respuesta al contrato de dominio, 
// extrayendo solo el texto generado y el modelo utilizado, y dejando la lógica de negocio libre 
// de detalles de la API de Ollama
interface OllamaGenerateResponse {
  model?: string;
  response?: string;
}

interface OllamaGenerateStreamResponse extends OllamaGenerateResponse {
  done?: boolean;
}

// Resultado de la generación de un comentario con Ollama. Contiene el comentario generado (ya recortado y normalizado) y 
// el modelo que lo produjo, lo que permite mantener trazabilidad y facilitar el debugging o análisis de resultados en la aplicación.
export interface OllamaGenerateResult {
  text: string;
  model: string;
}

// Gateway de comunicación con Ollama, que se encarga de hacer la petición HTTP a la API de Ollama para generar un comentario,
// manejando la configuración (URL, modelo, timeout, API key) y los posibles errores de conexión o respuesta, 
// y exponiendo un método `generate` que devuelve un resultado con el texto generado y el modelo utilizado.
@Injectable()
export class OllamaClient implements AiStatusPort {
  private readonly logger = new Logger(OllamaClient.name);

  constructor(private readonly config: ConfigService<EnvConfig, true>) {}

  // Punto de prueba: comprueba que Ollama responde y lista los modelos instalados.
  // No lanza si el proveedor está caído; devuelve un estado normalizado con `reachable: false`.
  async check(): Promise<AiStatus> {
    const baseUrl = this.normalizeBaseUrl(
      this.config.get('OLLAMA_BASE_URL', { infer: true }),
    );
    const model = this.config.get('OLLAMA_MODEL', { infer: true });
    const visionModel = this.config.get('OLLAMA_VISION_MODEL', { infer: true });
    const base: AiStatus = {
      reachable: false,
      baseUrl,
      model,
      visionModel,
      models: [],
    };

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      HEALTH_CHECK_TIMEOUT_MS,
    );

    try {
      const response = await fetch(`${baseUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      if (!response.ok) {
        return {
          ...base,
          error: `Ollama devolvió ${response.status} ${response.statusText}`,
        };
      }

      const payload = (await response.json()) as OllamaTagsResponse;
      const models = (payload.models ?? [])
        .map((entry) => entry.name?.trim() ?? '')
        .filter((name) => name.length > 0);

      return { ...base, reachable: true, models };
    } catch (error) {
      const message =
        error instanceof Error && error.name === 'AbortError'
          ? `Ollama no respondió en ${HEALTH_CHECK_TIMEOUT_MS}ms`
          : `No se pudo conectar con Ollama en ${baseUrl}`;
      this.logger.warn(`Health check de Ollama fallido: ${message}`);
      return { ...base, error: message };
    } finally {
      clearTimeout(timeout);
    }
  }

  async generate(prompt: string): Promise<OllamaGenerateResult> {
    const baseUrl = this.normalizeBaseUrl(
      this.config.get('OLLAMA_BASE_URL', { infer: true }),
    );
    const model = this.config.get('OLLAMA_MODEL', { infer: true });
    const timeoutMs = this.config.get('OLLAMA_TIMEOUT_MS', { infer: true });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model, prompt, stream: false }),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new OllamaError(`Ollama no respondió en ${timeoutMs}ms`, error);
      }
      throw new OllamaError(
        `No se pudo conectar con Ollama en ${baseUrl}`,
        error,
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new OllamaError(
        `Ollama devolvió ${response.status} ${response.statusText}`,
      );
    }

    let payload: OllamaGenerateResponse;
    try {
      payload = (await response.json()) as OllamaGenerateResponse;
    } catch (error) {
      throw new OllamaError('Respuesta de Ollama no es JSON válido', error);
    }

    return {
      text: payload.response?.trim() ?? '',
      model: payload.model ?? model,
    };
  }

  async *generateStream(
    prompt: string,
    options: { signal?: AbortSignal } = {},
  ): AsyncIterable<string> {
    const baseUrl = this.normalizeBaseUrl(
      this.config.get('OLLAMA_BASE_URL', { infer: true }),
    );
    const model = this.config.get('OLLAMA_MODEL', { infer: true });
    const timeoutMs = this.config.get('OLLAMA_TIMEOUT_MS', { infer: true });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const abortFromCaller = () => controller.abort();
    options.signal?.addEventListener('abort', abortFromCaller, { once: true });

    let response: Response;
    try {
      response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model, prompt, stream: true }),
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timeout);
      options.signal?.removeEventListener('abort', abortFromCaller);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new OllamaError(`Ollama no respondió en ${timeoutMs}ms`, error);
      }
      throw new OllamaError(
        `No se pudo conectar con Ollama en ${baseUrl}`,
        error,
      );
    }

    try {
      if (!response.ok) {
        throw new OllamaError(
          `Ollama devolvió ${response.status} ${response.statusText}`,
        );
      }

      if (!response.body) {
        throw new OllamaError('Ollama no devolvió un stream de respuesta');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const token = this.parseStreamLine(line);
          if (token) {
            yield token;
          }
        }

        if (done) {
          const token = this.parseStreamLine(buffer);
          if (token) {
            yield token;
          }
          break;
        }
      }
    } catch (error) {
      if (error instanceof OllamaError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new OllamaError(`Ollama no respondió en ${timeoutMs}ms`, error);
      }

      throw new OllamaError('Error leyendo el stream de Ollama', error);
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener('abort', abortFromCaller);
    }
  }

  // Método privado para normalizar la URL base de Ollama, eliminando barras finales y posibles sufijos de versión, 
  // para evitar problemas de concatenación de URLs al hacer la petición a la API de Ollama.
  private normalizeBaseUrl(baseUrl: string): string {
    return baseUrl.replace(/\/+$/, '').replace(/\/v1$/, '');
  }

  private parseStreamLine(line: string): string {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      return '';
    }

    let payload: OllamaGenerateStreamResponse;
    try {
      payload = JSON.parse(trimmedLine) as OllamaGenerateStreamResponse;
    } catch (error) {
      throw new OllamaError('Respuesta de Ollama no es JSON válido', error);
    }

    if (payload.done) {
      return '';
    }

    return payload.response ?? '';
  }
}
