import { generateComment as generateCommentApi } from "../infrastructure/api/commentsApi";
import type { CommentTone, GenerateCommentResult } from "../domain/types";

export interface GenerateCommentInput {
  postContent: string;
  tone: CommentTone;
  language?: string;
}

// Caso de uso: normaliza la entrada (trim, idioma opcional) y delega en la API.
// Sin React aquí; el estado lo gestiona el hook de presentación.
export function generateComment(
  input: GenerateCommentInput,
): Promise<GenerateCommentResult> {
  return generateCommentApi({
    postContent: input.postContent.trim(),
    tone: input.tone,
    language: input.language?.trim() || undefined,
  });
}
