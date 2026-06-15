import { Injectable } from '@nestjs/common';
import { CommentGenerationError } from '../../domain/errors/comment-generation.error';
import type { CommentGeneratorPort, GenerateCommentInput, GenerateCommentOutput, GenerateCommentTone } from '../../domain/ports/comment-generator.port';
import { OllamaClient } from './ollama.client';
import { OllamaError } from './ollama.error';

// Definimos un límite de caracteres para el contenido del post que se enviará a Ollama, 
// para evitar problemas de rendimiento. Este límite puede ajustarse según las necesidades 
// y las capacidades del modelo de IA utilizado y Infraestructura.
const MAX_POST_CONTENT_CHARS = 2000;

// El adaptador concreto que implementa el puerto de generación de comentarios utilizando Ollama.
// Esta clase se encarga de construir el prompt adecuado para Ollama, manejar la respuesta y mapear 
// cualquier error específico de Ollama a un error de dominio que la aplicación pueda manejar de 
// forma consistente.
@Injectable()
export class OllamaCommentGenerator implements CommentGeneratorPort {
  constructor(private readonly ollama: OllamaClient) {}

  async generate(input: GenerateCommentInput): Promise<GenerateCommentOutput> {
    const prompt = this.buildPrompt(input);

    let result;
    try {
      result = await this.ollama.generate(prompt);
    } catch (error) {
      if (error instanceof OllamaError) {
        throw new CommentGenerationError(error.message, error);
      }
      throw error;
    }

    if (!result.text) {
      throw new CommentGenerationError('Ollama devolvió un comentario vacío');
    }

    return { comment: result.text, model: result.model };
  }

  async *generateStream(
    input: GenerateCommentInput,
    options: { signal?: AbortSignal } = {},
  ): AsyncIterable<string> {
    const prompt = this.buildPrompt(input);

    try {
      for await (const token of this.ollama.generateStream(prompt, options)) {
        yield token;
      }
    } catch (error) {
      if (error instanceof OllamaError) {
        throw new CommentGenerationError(error.message, error);
      }
      throw error;
    }
  }

  // Método privado para construir el prompt que se enviará a Ollama, basado en el contenido del 
  // post, el tono deseado y el idioma
  private buildPrompt(input: GenerateCommentInput): string {
    const context = input.postContent.slice(0, MAX_POST_CONTENT_CHARS).trim();
    const language = input.language ?? 'es';

    return [
      'Eres un asistente que redacta comentarios para publicaciones de LinkedIn.',
      `Escribe UN solo comentario en idioma "${language}", con tono ${this.toneLabel(input.tone)}.`,
      'El comentario debe ser breve (2-4 frases), aportar valor y sonar humano.',
      'No uses hashtags ni emojis salvo que el tono lo pida. Responde solo con el comentario, sin explicaciones.',
      '',
      'Publicación:',
      context,
    ].join('\n');
  }

  // Método privado para mapear el tono del comentario a una etiqueta que se utilizará en el prompt de Ollama, 
  // facilitando la generación de comentarios con el tono deseado
  private toneLabel(tone: GenerateCommentTone): string {
    const labels: Record<GenerateCommentTone, string> = {
      professional: 'profesional',
      friendly: 'cercano',
      enthusiastic: 'entusiasta',
      analytical: 'analítico',
      supportive: 'de apoyo',
    };
    return labels[tone];
  }
}
