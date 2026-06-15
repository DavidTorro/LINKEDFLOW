import { Logger } from "@nestjs/common";
import { CommentGenerationError } from "../../domain/errors/comment-generation.error";
import type { CommentGeneratorPort } from "../../domain/ports/comment-generator.port";
import type { PostScraper } from "../../domain/ports/post-scraper.port";
import type { VisionAnalyzer } from "../../domain/ports/vision-analyzer.port";
import {
  EmptyPostContentError,
  GenerateCommentFromUrlUseCase,
  GenerateCommentFromUrlValidationError,
} from "./generate-comment-from-url.use-case";

describe("GenerateCommentFromUrlUseCase", () => {
  it("scrapes a valid URL with content and generates a comment", async () => {
    const scraper: jest.Mocked<PostScraper> = {
      scrape: jest.fn().mockResolvedValue({
        text: "Publicación sobre automatización en LinkedIn.",
      }),
    };
    const generator: jest.Mocked<CommentGeneratorPort> = {
      generate: jest.fn().mockResolvedValue({
        comment: "Gran reflexión para seguir mejorando la conversación.",
        model: "llama3.2:3b",
      }),
    };
    const visionAnalyzer: jest.Mocked<VisionAnalyzer> = {
      analyze: jest.fn(),
    };
    const useCase = new GenerateCommentFromUrlUseCase(
      scraper,
      generator,
      visionAnalyzer,
    );

    const result = await useCase.execute({
      url: "https://www.linkedin.com/posts/example_activity-123456789/",
    });

    expect(scraper.scrape).toHaveBeenCalledWith(
      "https://www.linkedin.com/posts/example_activity-123456789/",
    );
    expect(generator.generate).toHaveBeenCalledWith({
      postContent: "Publicación sobre automatización en LinkedIn.",
      tone: "professional",
    });
    expect(visionAnalyzer.analyze).not.toHaveBeenCalled();
    expect(result).toEqual({
      text: "Publicación sobre automatización en LinkedIn.",
      comment: "Gran reflexión para seguir mejorando la conversación.",
    });
  });

  it("analyzes the post image and enriches the generated comment context", async () => {
    const scraper: jest.Mocked<PostScraper> = {
      scrape: jest.fn().mockResolvedValue({
        text: "Publicación sobre automatización en LinkedIn.",
        imageUrl: "https://cdn.example.com/post-image.jpg",
      }),
    };
    const generator: jest.Mocked<CommentGeneratorPort> = {
      generate: jest.fn().mockResolvedValue({
        comment: "Buen enfoque conectando automatización y contexto visual.",
        model: "llama3.2:3b",
      }),
    };
    const visionAnalyzer: jest.Mocked<VisionAnalyzer> = {
      analyze: jest
        .fn()
        .mockResolvedValue("La imagen muestra un panel de métricas de ventas."),
    };
    const useCase = new GenerateCommentFromUrlUseCase(
      scraper,
      generator,
      visionAnalyzer,
    );

    const result = await useCase.execute({
      url: "https://www.linkedin.com/posts/example_activity-123456789/",
    });

    expect(visionAnalyzer.analyze).toHaveBeenCalledWith(
      "https://cdn.example.com/post-image.jpg",
    );
    expect(generator.generate).toHaveBeenCalledWith({
      postContent:
        "Contenido del post: Publicación sobre automatización en LinkedIn. Imagen: La imagen muestra un panel de métricas de ventas.",
      tone: "professional",
    });
    expect(result).toEqual({
      text: "Publicación sobre automatización en LinkedIn.",
      comment: "Buen enfoque conectando automatización y contexto visual.",
    });
  });

  it("falls back to text-only generation when image analysis fails", async () => {
    const warnSpy = jest
      .spyOn(Logger.prototype, "warn")
      .mockImplementation(() => undefined);
    const scraper: jest.Mocked<PostScraper> = {
      scrape: jest.fn().mockResolvedValue({
        text: "Publicación sobre automatización en LinkedIn.",
        imageUrl: "https://cdn.example.com/post-image.jpg",
      }),
    };
    const generator: jest.Mocked<CommentGeneratorPort> = {
      generate: jest.fn().mockResolvedValue({
        comment: "Gran reflexión para seguir mejorando la conversación.",
        model: "llama3.2:3b",
      }),
    };
    const visionAnalyzer: jest.Mocked<VisionAnalyzer> = {
      analyze: jest.fn().mockRejectedValue(new Error("timeout")),
    };
    const useCase = new GenerateCommentFromUrlUseCase(
      scraper,
      generator,
      visionAnalyzer,
    );

    const result = await useCase.execute({
      url: "https://www.linkedin.com/posts/example_activity-123456789/",
    });

    expect(visionAnalyzer.analyze).toHaveBeenCalledWith(
      "https://cdn.example.com/post-image.jpg",
    );
    expect(generator.generate).toHaveBeenCalledWith({
      postContent: "Publicación sobre automatización en LinkedIn.",
      tone: "professional",
    });
    expect(warnSpy).toHaveBeenCalledWith(
      "Análisis de imagen falló, se continúa solo con texto",
      "timeout",
    );
    expect(result).toEqual({
      text: "Publicación sobre automatización en LinkedIn.",
      comment: "Gran reflexión para seguir mejorando la conversación.",
    });

    warnSpy.mockRestore();
  });

  it("rejects an invalid LinkedIn URL", async () => {
    const scraper: jest.Mocked<PostScraper> = {
      scrape: jest.fn(),
    };
    const generator: jest.Mocked<CommentGeneratorPort> = {
      generate: jest.fn(),
    };
    const visionAnalyzer: jest.Mocked<VisionAnalyzer> = {
      analyze: jest.fn(),
    };
    const useCase = new GenerateCommentFromUrlUseCase(
      scraper,
      generator,
      visionAnalyzer,
    );

    await expect(
      useCase.execute({ url: "https://example.com/posts/123" }),
    ).rejects.toBeInstanceOf(GenerateCommentFromUrlValidationError);
    expect(scraper.scrape).not.toHaveBeenCalled();
    expect(generator.generate).not.toHaveBeenCalled();
  });

  it("rejects when the scraper does not extract content", async () => {
    const scraper: jest.Mocked<PostScraper> = {
      scrape: jest.fn().mockResolvedValue({ text: "   " }),
    };
    const generator: jest.Mocked<CommentGeneratorPort> = {
      generate: jest.fn(),
    };
    const visionAnalyzer: jest.Mocked<VisionAnalyzer> = {
      analyze: jest.fn(),
    };
    const useCase = new GenerateCommentFromUrlUseCase(
      scraper,
      generator,
      visionAnalyzer,
    );

    await expect(
      useCase.execute({
        url: "https://www.linkedin.com/posts/example_activity-123456789/",
      }),
    ).rejects.toBeInstanceOf(EmptyPostContentError);
    expect(generator.generate).not.toHaveBeenCalled();
  });

  it("propagates an AI error when the generator does not respond", async () => {
    const scraper: jest.Mocked<PostScraper> = {
      scrape: jest.fn().mockResolvedValue({
        text: "Publicación sobre automatización en LinkedIn.",
      }),
    };
    const generator: jest.Mocked<CommentGeneratorPort> = {
      generate: jest
        .fn()
        .mockRejectedValue(new CommentGenerationError("Ollama no respondió")),
    };
    const visionAnalyzer: jest.Mocked<VisionAnalyzer> = {
      analyze: jest.fn(),
    };
    const useCase = new GenerateCommentFromUrlUseCase(
      scraper,
      generator,
      visionAnalyzer,
    );

    await expect(
      useCase.execute({
        url: "https://www.linkedin.com/posts/example_activity-123456789/",
      }),
    ).rejects.toBeInstanceOf(CommentGenerationError);
  });
});
