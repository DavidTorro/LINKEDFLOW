import { ArgumentsHost, Logger } from "@nestjs/common";
import { GenerateCommentValidationError } from "../../application/generate-comment.use-case";
import {
  EmptyPostContentError,
  GenerateCommentFromUrlValidationError,
} from "../../application/use-cases/generate-comment-from-url.use-case";
import { CommentGenerationError } from "../../domain/errors/comment-generation.error";
import { PostScraperError } from "../../domain/ports/post-scraper.port";
import { CommentsExceptionFilter } from "./comments-exception.filter";

// Construye un ArgumentsHost falso que captura status() y json().
function buildHost() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status, json }) }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe("CommentsExceptionFilter", () => {
  const filter = new CommentsExceptionFilter();
  let loggerWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    loggerWarnSpy = jest.spyOn(Logger.prototype, "warn").mockImplementation();
  });

  afterEach(() => {
    loggerWarnSpy.mockRestore();
  });

  it("mapea CommentGenerationError a 503", () => {
    const { host, status, json } = buildHost();

    filter.catch(new CommentGenerationError("Ollama no respondió"), host);

    expect(loggerWarnSpy).toHaveBeenCalledWith(
      "Generación de comentario fallida: Ollama no respondió",
    );
    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 503, error: "Service Unavailable" }),
    );
  });

  it("mapea GenerateCommentValidationError a 400", () => {
    const { host, status, json } = buildHost();

    filter.catch(new GenerateCommentValidationError("tone is invalid"), host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, message: "tone is invalid" }),
    );
  });

  it("mapea GenerateCommentFromUrlValidationError a 400", () => {
    const { host, status, json } = buildHost();

    filter.catch(new GenerateCommentFromUrlValidationError("URL no es de LinkedIn"), host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        error: "Bad Request",
        message: "URL no es de LinkedIn",
      }),
    );
  });

  it("mapea PostScraperError invalid_url a 400", () => {
    const { host, status, json } = buildHost();

    filter.catch(new PostScraperError("invalid_url", "URL no es de LinkedIn"), host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        error: "Bad Request",
        message: "URL no es de LinkedIn",
      }),
    );
  });

  it("mapea PostScraperError not_found a 404", () => {
    const { host, status, json } = buildHost();

    filter.catch(new PostScraperError("not_found", "Post no encontrado"), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        error: "Not Found",
        message: "Post no encontrado",
      }),
    );
  });

  it("mapea PostScraperError access_denied a 404", () => {
    const { host, status, json } = buildHost();

    filter.catch(new PostScraperError("access_denied", "Acceso denegado"), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        error: "Not Found",
        message: "Acceso denegado",
      }),
    );
  });

  it("mapea PostScraperError timeout a 408", () => {
    const { host, status, json } = buildHost();

    filter.catch(new PostScraperError("timeout", "Timeout al cargar la URL"), host);

    expect(status).toHaveBeenCalledWith(408);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 408,
        error: "Request Timeout",
        message: "Timeout al cargar la URL",
      }),
    );
  });

  it("mapea EmptyPostContentError a 422", () => {
    const { host, status, json } = buildHost();

    filter.catch(new EmptyPostContentError(), host);

    expect(status).toHaveBeenCalledWith(422);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 422,
        error: "Unprocessable Entity",
        message: "No se pudo extraer el contenido",
      }),
    );
  });
});
