import { COMMENT_TONES, type CommentToneValue } from "../comment-tone";

// Tipo de tonos válidos que puede solicitar la aplicación
export type GenerateCommentTone = CommentToneValue;

// Lista pública de tonos usada por validación HTTP y documentación Swagger
export const GENERATE_COMMENT_TONES: readonly GenerateCommentTone[] =
  COMMENT_TONES;

// Datos que cualquier adaptador de generación de comentarios debe recibir
export interface GenerateCommentInput {
  postContent: string;
  tone: GenerateCommentTone;
  language?: string;
}

// Resultado normalizado que devuelve cualquier proveedor de generación
export interface GenerateCommentOutput {
  comment: string;
  model: string;
}

// Puerto de dominio que evita depender de Ollama desde la aplicación
export interface CommentGeneratorPort {
  // Genera un comentario a partir del contenido y el tono solicitados
  generate(input: GenerateCommentInput): Promise<GenerateCommentOutput>;
  generateStream?(
    input: GenerateCommentInput,
    options?: { signal?: AbortSignal },
  ): AsyncIterable<string>;
}

// Token de inyección para resolver la implementación concreta del puerto
export const COMMENT_GENERATOR = Symbol("CommentGeneratorPort");
