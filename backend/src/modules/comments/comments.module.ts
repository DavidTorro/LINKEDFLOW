import { Module } from "@nestjs/common";
import { GenerateCommentUseCase } from "./application/generate-comment.use-case";
import { CheckAiStatusUseCase } from "./application/use-cases/check-ai-status.use-case";
import { GenerateCommentFromUrlUseCase } from "./application/use-cases/generate-comment-from-url.use-case";
import { AI_STATUS } from "./domain/ports/ai-status.port";
import { COMMENT_GENERATOR } from "./domain/ports/comment-generator.port";
import { POST_SCRAPER } from "./domain/ports/post-scraper.port";
import { VISION_ANALYZER } from "./domain/ports/vision-analyzer.port";
import { OllamaClient } from "./infrastructure/ai/ollama.client";
import { OllamaCommentGenerator } from "./infrastructure/ai/ollama-comment-generator";
import { OllamaVisionAnalyzer } from "./infrastructure/ai/ollama-vision-analyzer";
import { LinkedInPostScraper } from "./infrastructure/scrapers/linkedin-post-scraper";
import { CommentsController } from "./presentation/http/comments.controller";

// Módulo de comentarios que conecta HTTP, caso de uso y puerto de generación
@Module({
  controllers: [CommentsController],
  providers: [
    OllamaClient,
    GenerateCommentUseCase,
    GenerateCommentFromUrlUseCase,
    CheckAiStatusUseCase,
    {
      // El propio OllamaClient implementa el puerto de estado: reutilizamos la instancia.
      provide: AI_STATUS,
      useExisting: OllamaClient,
    },
    {
      // Resuelve el puerto de aplicación con el adapter de Ollama del Paso 1
      provide: COMMENT_GENERATOR,
      useClass: OllamaCommentGenerator,
    },
    {
      // Resuelve el puerto de scraping con el adapter HTTP/HTML para LinkedIn
      provide: POST_SCRAPER,
      useClass: LinkedInPostScraper,
    },
    {
      provide: VISION_ANALYZER,
      useClass: OllamaVisionAnalyzer,
    },
  ],
  exports: [COMMENT_GENERATOR, POST_SCRAPER, VISION_ANALYZER],
})
export class CommentsModule {}
