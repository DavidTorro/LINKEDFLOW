// Tonos válidos soportados por la generación de comentarios
export const COMMENT_TONES = [
  "professional",
  "friendly",
  "enthusiastic",
  "analytical",
  "supportive",
] as const;

export type CommentToneValue = (typeof COMMENT_TONES)[number];

// Value object que valida y encapsula el tono solicitado
export class CommentTone {
  private constructor(private readonly value: CommentToneValue) {}

  // Crea un tono válido desde una cadena externa
  static create(value: string): CommentTone {
    if (!CommentTone.isValid(value)) {
      throw new Error(`Invalid comment tone: ${value}`);
    }

    return new CommentTone(value);
  }

  // Comprueba si una cadena pertenece a los tonos permitidos
  static isValid(value: string): value is CommentToneValue {
    return COMMENT_TONES.includes(value as CommentToneValue);
  }

  toString(): CommentToneValue {
    return this.value;
  }
}
