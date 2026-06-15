import { Inject, Injectable } from "@nestjs/common";
import { Comment } from "../domain/comment";
import { CommentTone } from "../domain/comment-tone";
import { COMMENT_GENERATOR, type CommentGeneratorPort } from "../domain/ports/comment-generator.port";
import type { GenerateCommentCommand } from "./generate-comment.command";
import type { GenerateCommentResult } from "./interfaces/generate-comment-result.interface";

// Error de validación propio del caso de uso
export class GenerateCommentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GenerateCommentValidationError";
  }
}

@Injectable()
export class GenerateCommentUseCase {
  constructor(
    @Inject(COMMENT_GENERATOR)
    // Dependencia contra el puerto, no contra Ollama ni infraestructura
    private readonly commentGenerator: CommentGeneratorPort,
  ) {}

  async execute(
    command: GenerateCommentCommand,
  ): Promise<GenerateCommentResult> {
    const postContent = command.postContent?.trim();
    const language = command.language?.trim();

    if (!postContent) {
      throw new GenerateCommentValidationError("postContent is required");
    }

    if (!CommentTone.isValid(command.tone)) {
      throw new GenerateCommentValidationError("tone is invalid");
    }

    // Normaliza el tono y delega la generación al puerto configurado
    const tone = CommentTone.create(command.tone);
    const generated = await this.commentGenerator.generate({
      postContent,
      tone: tone.toString(),
      language: language || undefined,
    });

    const comment = Comment.create({
      content: generated.comment,
      tone,
      model: generated.model,
    });

    // Devuelve una respuesta plana para evitar filtrar detalles de dominio
    return {
      comment: comment.getContent(),
      tone: comment.getTone().toString(),
      model: comment.getModel(),
      createdAt: comment.getCreatedAt().toISOString(),
    };
  }
}
