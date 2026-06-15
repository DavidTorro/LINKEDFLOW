// Error de transporte del gateway de Ollama (capa de infraestructura).
// Representa fallos al hablar con Ollama (conexión, timeout, estado no-2xx, respuesta inválida). 
// El adapter de la feature lo traduce a su error de dominio
// (p. ej. `CommentGenerationError`) para no filtrar detalles de infra hacia arriba.
export class OllamaError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'OllamaError';
  }
}
