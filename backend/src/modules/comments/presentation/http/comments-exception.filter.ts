import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from "@nestjs/common";
import { GenerateCommentValidationError } from "../../application/generate-comment.use-case";
import { EmptyPostContentError, GenerateCommentFromUrlValidationError } from "../../application/use-cases/generate-comment-from-url.use-case";
import { CommentGenerationError } from "../../domain/errors/comment-generation.error";
import { PostScraperError } from "../../domain/ports/post-scraper.port";

// Forma mínima de la respuesta HTTP, para no depender de los tipos de express.
interface HttpResponseLike {
  status(code: number): HttpResponseLike;
  json(body: unknown): void;
}

// Catch es un decorador que indica que esta clase es un filtro de excepciones para los tipos de error especificados
// El filtro centraliza la traducción HTTP de errores de aplicación, dominio e IA del módulo comments
@Catch(
  CommentGenerationError,
  GenerateCommentValidationError,
  GenerateCommentFromUrlValidationError,
  EmptyPostContentError,
  PostScraperError,
)
export class CommentsExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(CommentsExceptionFilter.name);

  catch(
    exception:
      | CommentGenerationError
      | GenerateCommentValidationError
      | GenerateCommentFromUrlValidationError
      | EmptyPostContentError
      | PostScraperError,
    host: ArgumentsHost,
  ): void {
    const response = host.switchToHttp().getResponse<HttpResponseLike>();

    if (
      exception instanceof GenerateCommentValidationError ||
      exception instanceof GenerateCommentFromUrlValidationError
    ) {
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        error: "Bad Request",
        message: exception.message,
      });
      return;
    }

    if (exception instanceof EmptyPostContentError) {
      response.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        error: "Unprocessable Entity",
        message: exception.message,
      });
      return;
    }

    if (exception instanceof PostScraperError) {
      const status = this.statusForPostScraperError(exception);
      response.status(status).json({
        statusCode: status,
        error: this.errorLabel(status),
        message: exception.message,
      });
      return;
    }

    // CommentGenerationError: el proveedor de IA (Ollama) falló o no respondió.
    this.logger.warn(`Generación de comentario fallida: ${exception.message}`);
    response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      error: "Service Unavailable",
      message:
        "El servicio de generación de comentarios no está disponible. Inténtalo de nuevo en unos minutos.",
    });
  }

  private statusForPostScraperError(exception: PostScraperError): HttpStatus {
    if (exception.code === "timeout") {
      return HttpStatus.REQUEST_TIMEOUT;
    }

    if (exception.code === "not_found" || exception.code === "access_denied") {
      return HttpStatus.NOT_FOUND;
    }

    return HttpStatus.BAD_REQUEST;
  }

  private errorLabel(status: HttpStatus): string {
    const labels: Partial<Record<HttpStatus, string>> = {
      [HttpStatus.BAD_REQUEST]: "Bad Request",
      [HttpStatus.NOT_FOUND]: "Not Found",
      [HttpStatus.REQUEST_TIMEOUT]: "Request Timeout",
      [HttpStatus.UNPROCESSABLE_ENTITY]: "Unprocessable Entity",
      [HttpStatus.SERVICE_UNAVAILABLE]: "Service Unavailable",
    };

    return labels[status] ?? "Error";
  }
}
