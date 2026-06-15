import { httpClient } from "../../../../shared/api/http/httpClient";
import type { HttpClientOptions } from "../../../../shared/api/http/httpClient";
import { env } from "../../../../shared/config/env";
import type {
  GenerateCommentRequest,
  GenerateCommentResult,
} from "../../domain/types";

export interface GenerateCommentFromUrlResult {
  text: string;
  comment: string;
}

export interface GenerateCommentStreamEvent extends GenerateCommentFromUrlResult {
  token: string;
}

// Estado del proveedor de IA (Ollama). Espejo de GET /comments/ai/health.
export interface AiHealth {
  reachable: boolean;
  baseUrl: string;
  model: string;
  visionModel: string;
  models: string[];
  error?: string;
}

export function getAiHealth(options?: HttpClientOptions): Promise<AiHealth> {
  return httpClient.get<AiHealth>("/comments/ai/health", options);
}

// Única puerta al backend para esta feature. Reutiliza el http client compartido.
export function generateComment(
  request: GenerateCommentRequest,
): Promise<GenerateCommentResult> {
  return httpClient.post<GenerateCommentResult>(
    "/comments/generate",
    request,
  );
}

export function generateCommentFromUrl(
  url: string,
  options?: HttpClientOptions,
): Promise<GenerateCommentFromUrlResult> {
  return httpClient.post<GenerateCommentFromUrlResult>(
    "/comments/from-url",
    { url },
    options,
  );
}

export function streamGenerateCommentFromUrl(url: string): EventSource {
  const params = new URLSearchParams({ url });
  return new EventSource(
    `${env.backendBaseUrl}/comments/from-url/stream?${params.toString()}`,
  );
}
