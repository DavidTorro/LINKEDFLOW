// Tipos de dominio de la feature Comments (frontend). Espejo del contrato del backend.
// El frontend nunca habla con Ollama: solo con el endpoint del backend (ADR-005).

export const COMMENT_TONES = [
  "professional",
  "friendly",
  "enthusiastic",
  "analytical",
  "supportive",
] as const;

export type CommentTone = (typeof COMMENT_TONES)[number];

// Datos que el usuario envía para generar un comentario.
export interface GenerateCommentRequest {
  postContent: string;
  tone: CommentTone;
  language?: string;
}

// Respuesta del backend (POST /comments/generate -> 201).
export interface GenerateCommentResult {
  comment: string;
  tone: string;
  model: string;
  createdAt: string;
}
