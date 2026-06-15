import { HttpErrorResponse } from './httpClient.types';

// La clase HttpError extiende la clase base Error de JavaScript para representar errores específicos de HTTP.
// Contiene una propiedad response que almacena los detalles de la respuesta HTTP que causó el error, 
// lo que facilita el manejo de errores en las solicitudes HTTP realizadas a través del cliente HTTP.
export class HttpError extends Error {
  readonly response: HttpErrorResponse;

  constructor(response: HttpErrorResponse) {
    super(`HTTP ${response.status} ${response.statusText}`);
    this.name = 'HttpError';
    this.response = response;
  }
}
