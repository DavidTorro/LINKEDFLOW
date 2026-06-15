import { Inject, Injectable, Logger } from "@nestjs/common";
import { CommentGenerationError } from "../../domain/errors/comment-generation.error";
import { COMMENT_GENERATOR, type CommentGeneratorPort } from "../../domain/ports/comment-generator.port";
import { POST_SCRAPER, type PostScraper } from "../../domain/ports/post-scraper.port";
import { VISION_ANALYZER, type VisionAnalyzer } from "../../domain/ports/vision-analyzer.port";
import type { GenerateCommentFromUrlCommand, GenerateCommentFromUrlResult } from "../dto/generate-comment-from-url.dto";

// Patron para validar URLs de LinkedIn, incluyendo subdominios y el dominio principal.
const LINKEDIN_HOST_PATTERN = /(^|\.)linkedin\.com$/i;

export class GenerateCommentFromUrlValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GenerateCommentFromUrlValidationError";
  }
}

export class EmptyPostContentError extends Error {
  constructor(message = "No se pudo extraer el contenido") {
    super(message);
    this.name = "EmptyPostContentError";
  }
}

export interface GenerateCommentFromUrlStreamChunk {
  text: string;
  token: string;
  comment: string;
}

@Injectable()
export class GenerateCommentFromUrlUseCase {
  private readonly logger = new Logger(GenerateCommentFromUrlUseCase.name);

  constructor(
    @Inject(POST_SCRAPER)
    private readonly postScraper: PostScraper,
    @Inject(COMMENT_GENERATOR)
    private readonly commentGenerator: CommentGeneratorPort,
    @Inject(VISION_ANALYZER)
    private readonly visionAnalyzer: VisionAnalyzer,
  ) {}

  async execute(
    command: GenerateCommentFromUrlCommand,
  ): Promise<GenerateCommentFromUrlResult> {
    const { text, postContent } = await this.preparePostContent(command);
    const generated = await this.commentGenerator.generate({
      postContent,
      tone: "professional",
    });

    return {
      text,
      comment: generated.comment,
    };
  }

  async *executeStream(
    command: GenerateCommentFromUrlCommand,
    options: { signal?: AbortSignal } = {},
  ): AsyncIterable<GenerateCommentFromUrlStreamChunk> {
    const { text, postContent } = await this.preparePostContent(
      command,
      options,
    );

    if (!this.commentGenerator.generateStream) {
      throw new CommentGenerationError(
        "El generador de comentarios no soporta streaming",
      );
    }

    let comment = "";
    for await (const token of this.commentGenerator.generateStream(
      {
        postContent,
        tone: "professional",
      },
      options,
    )) {
      comment += token;
      yield {
        text,
        token,
        comment,
      };
    }
  }

  private async preparePostContent(
    command: GenerateCommentFromUrlCommand,
    options?: { signal?: AbortSignal },
  ): Promise<{ text: string; postContent: string }> {
    const url = command.url?.trim();

    if (!url || !isLinkedInPostUrl(url)) {
      throw new GenerateCommentFromUrlValidationError("URL no es de LinkedIn");
    }

    const post = await this.postScraper.scrape(url);
    const text = post.text.trim();

    if (!text) {
      throw new EmptyPostContentError();
    }

    const postContent = post.imageUrl
      ? await this.buildVisionContext(text, post.imageUrl, options)
      : text;

    return { text, postContent };
  }

  private async buildVisionContext(
    text: string,
    imageUrl: string,
    options?: { signal?: AbortSignal },
  ): Promise<string> {
    let imageDescription: string;
    try {
      imageDescription = (
        options
          ? await this.visionAnalyzer.analyze(imageUrl, options)
          : await this.visionAnalyzer.analyze(imageUrl)
      ).trim();
    } catch (error) {
      if (options?.signal?.aborted) {
        throw error;
      }

      this.logger.warn(
        "Análisis de imagen falló, se continúa solo con texto",
        error instanceof Error ? error.message : undefined,
      );
      return text;
    }

    if (!imageDescription) {
      return text;
    }

    return `Contenido del post: ${stripTrailingPunctuation(text)}. Imagen: ${stripTrailingPunctuation(imageDescription)}.`;
  }
}

function stripTrailingPunctuation(value: string): string {
  return value.replace(/[.!?¡¿]+$/u, "").trim();
}

function isLinkedInPostUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return (
      LINKEDIN_HOST_PATTERN.test(parsedUrl.hostname) &&
      parsedUrl.pathname.includes("/posts/")
    );
  } catch {
    return false;
  }
}
