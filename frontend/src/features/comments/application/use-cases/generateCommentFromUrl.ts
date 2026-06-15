import { generateCommentFromUrl as generateCommentFromUrlApi, type GenerateCommentFromUrlResult } from "../../infrastructure/api/commentsApi";

export interface GenerateCommentFromUrlInput {
  url: string;
  signal?: AbortSignal;
}

// Caso de uso: normaliza la URL y delega en la API de la feature
export function generateCommentFromUrl(
  input: GenerateCommentFromUrlInput,
): Promise<GenerateCommentFromUrlResult> {
  return generateCommentFromUrlApi(input.url.trim(), {
    signal: input.signal,
  });
}

export type { GenerateCommentFromUrlResult };
