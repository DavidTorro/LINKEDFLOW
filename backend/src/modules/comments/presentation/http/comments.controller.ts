import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Res, UseFilters } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { GenerateCommentUseCase } from "../../application/generate-comment.use-case";
import { CheckAiStatusUseCase } from "../../application/use-cases/check-ai-status.use-case";
import { EmptyPostContentError, GenerateCommentFromUrlUseCase, GenerateCommentFromUrlValidationError } from "../../application/use-cases/generate-comment-from-url.use-case";
import { CommentGenerationError } from "../../domain/errors/comment-generation.error";
import type { AiStatus } from "../../domain/ports/ai-status.port";
import { PostScraperError } from "../../domain/ports/post-scraper.port";
import { CommentsExceptionFilter } from "./comments-exception.filter";
import { GenerateCommentFromUrlDto, GenerateCommentFromUrlResponseDto } from "./dto/generate-comment-from-url.dto";
import { GenerateCommentRequestDto } from "./dto/generate-comment.request.dto";
import { GenerateCommentResponseDto } from "./dto/generate-comment.response.dto";

@ApiTags("comments")
@Controller("comments")
@UseFilters(CommentsExceptionFilter) // Aplica el filtro de excepciones a todas las rutas de este controlador
export class CommentsController {
  constructor(
    private readonly generateCommentUseCase: GenerateCommentUseCase,
    private readonly generateCommentFromUrlUseCase: GenerateCommentFromUrlUseCase,
    private readonly checkAiStatusUseCase: CheckAiStatusUseCase,
  ) {}

  @Get("ai/health")
  @ApiOperation({
    summary: "Punto de prueba del proveedor de IA (Ollama)",
    description:
      "Comprueba rápidamente si Ollama responde y devuelve la URL, los modelos configurados y los modelos instalados, sin lanzar una generación completa.",
  })
  @ApiResponse({
    status: 200,
    description:
      "Estado del proveedor de IA. `reachable` indica si Ollama responde.",
  })
  checkAiStatus(): Promise<AiStatus> {
    return this.checkAiStatusUseCase.execute();
  }

  @Post("generate")
  @ApiOperation({
    summary: "Genera un comentario para LinkedIn",
    description:
      "Genera un comentario usando el puerto de generación de comentarios configurado en backend.",
  })
  @ApiBody({ type: GenerateCommentRequestDto })
  @ApiResponse({
    status: 201,
    description: "Comentario generado correctamente",
    type: GenerateCommentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "La solicitud no cumple las reglas de validación",
  })
  @ApiResponse({
    status: 503,
    description: "El proveedor de IA (Ollama) no está disponible o falló",
  })
  async generate(
    @Body() request: GenerateCommentRequestDto,
  ): Promise<GenerateCommentResponseDto> {
    return this.generateCommentUseCase.execute({
      postContent: request.postContent,
      tone: request.tone,
      language: request.language,
    });
  }

  @Post("from-url")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Genera un comentario desde una URL de LinkedIn",
    description:
      "Extrae el texto público del post y reutiliza el motor de generación de comentarios configurado en backend.",
  })
  @ApiBody({ type: GenerateCommentFromUrlDto })
  @ApiResponse({
    status: 200,
    description: "Texto extraído y comentario generado correctamente",
    type: GenerateCommentFromUrlResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "La URL no es válida",
  })
  @ApiResponse({
    status: 404,
    description: "Post no encontrado o acceso denegado",
  })
  @ApiResponse({
    status: 408,
    description: "Timeout al cargar la URL",
  })
  @ApiResponse({
    status: 422,
    description: "No se pudo extraer el contenido",
  })
  @ApiResponse({
    status: 503,
    description: "El proveedor de IA (Ollama) no está disponible o falló",
  })
  async generateCommentFromUrl(
    @Body() request: GenerateCommentFromUrlDto,
  ): Promise<GenerateCommentFromUrlResponseDto> {
    return await this.generateCommentFromUrlUseCase.execute({
      url: request.url,
    });
  }

  @Get("from-url/stream")
  @ApiOperation({
    summary: "Genera un comentario desde una URL de LinkedIn con streaming SSE",
    description:
      "Extrae el texto público del post y envía tokens progresivos del comentario generado.",
  })
  @ApiResponse({
    status: 200,
    description: "Stream SSE con tokens generados progresivamente",
  })
  async streamGenerateCommentFromUrl(
    @Query("url") url: string,
    @Res() response: Response,
  ): Promise<void> {
    await this.writeGenerateCommentFromUrlStream(url, response);
  }

  private async writeGenerateCommentFromUrlStream(
    url: string,
    response: Response,
  ): Promise<void> {
    const abortController = new AbortController();
    const abortStream = () => abortController.abort();

    response.on("close", abortStream);
    response.status(HttpStatus.OK);
    response.setHeader("Content-Type", "text/event-stream");
    response.setHeader("Cache-Control", "no-cache, no-transform");
    response.setHeader("Connection", "keep-alive");
    response.setHeader("X-Accel-Buffering", "no");
    response.flushHeaders?.();

    try {
      for await (const chunk of this.generateCommentFromUrlUseCase.executeStream(
        { url },
        { signal: abortController.signal },
      )) {
        this.writeSseData(response, chunk);
      }

      this.writeSseEvent(response, "done", { ok: true });
    } catch (error) {
      if (!response.writableEnded && !response.destroyed) {
        this.writeSseEvent(response, "error", {
          code: this.errorCodeFor(error),
          message:
            error instanceof Error
              ? error.message
              : "Error generando comentario",
        });
      }
    } finally {
      response.off("close", abortStream);
      if (!response.writableEnded && !response.destroyed) {
        response.end();
      }
    }
  }

  private writeSseData(response: Response, payload: unknown): void {
    response.write(`data: ${JSON.stringify(payload)}\n\n`);
  }

  private writeSseEvent(
    response: Response,
    event: string,
    payload: unknown,
  ): void {
    response.write(`event: ${event}\n`);
    this.writeSseData(response, payload);
  }

  private errorCodeFor(error: unknown): string {
    if (error instanceof GenerateCommentFromUrlValidationError) {
      return "invalid_url";
    }

    if (error instanceof PostScraperError) {
      if (error.code === "timeout") {
        return "timeout";
      }

      if (error.code === "not_found" || error.code === "access_denied") {
        return "not_found";
      }

      if (error.code === "invalid_url") {
        return "invalid_url";
      }
    }

    if (error instanceof EmptyPostContentError) {
      return "empty_content";
    }

    if (error instanceof CommentGenerationError) {
      return "ai_unavailable";
    }

    return "unknown";
  }
}
