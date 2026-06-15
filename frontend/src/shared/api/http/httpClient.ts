import { request } from './httpRequest';
import { HttpClientOptions } from './httpClient.types';

// Exporto HttpError para que los consumidores puedan manejar errores específicos de HTTP 
// sin necesidad de importar directamente desde httpError.ts, esto sirve para centralizar la API del cliente HTTP y facilitar su uso.
export { HttpError } from './httpError';

// Exporto los tipos relacionados con el cliente HTTP para que los consumidores puedan utilizarlos 
// en sus propias definiciones de tipos, como al definir las opciones de una solicitud o al manejar errores.
export type { HttpClientOptions, HttpErrorResponse } from './httpClient.types';

// Exporto un objeto httpClient que proporciona métodos convenientes para realizar solicitudes HTTP GET y POST.
// Esto permite a los consumidores realizar solicitudes HTTP de manera sencilla sin preocuparse por los detalles 
// de construcción de la solicitud o manejo de errores, ya que todo eso se maneja internamente en el método request.
export const httpClient = {
  get<TResponse>(path: string, options?: HttpClientOptions): Promise<TResponse> {
    return request<TResponse>('GET', path, options);
  },

  post<TResponse>(
    path: string,
    body?: unknown,
    options?: HttpClientOptions,
  ): Promise<TResponse> {
    return request<TResponse>('POST', path, {
      ...options,
      body,
    });
  },
};
