// Clase de error personalizada para errores relacionados con la generación de comentarios
// Permite encapsular detalles específicos del error y mantener una estructura clara para el manejo de errores en la aplicación.
// En un futuro, se podrían agregar propiedades adicionales como un código de error específico o 
// información de contexto para facilitar la depuración y el manejo de errores en la capa de 
// aplicación o presentación.

export class CommentGenerationError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'CommentGenerationError';
  }
}
