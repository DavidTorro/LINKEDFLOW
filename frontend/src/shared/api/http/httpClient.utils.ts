import { env } from '../../config/env';
import { HttpClientOptions } from './httpClient.types';

// Función para construir la URL completa de la solicitud HTTP,
// combinando la URL base del backend con el path proporcionado.
export function buildUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${env.backendBaseUrl}${normalizedPath}`;
}

// Función para construir los encabezados de la solicitud HTTP,
// combinando los encabezados proporcionados con los valores predeterminados.
export function buildHeaders(options?: HttpClientOptions): Headers {
  const headers = new Headers(options?.headers);

  if (options?.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return headers;
}

// Función para analizar el cuerpo de la respuesta HTTP,
// devolviendo el contenido en el formato apropiado según el tipo de contenido.
export async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get('Content-Type');

  if (contentType?.includes('application/json')) {
    return response.json();
  }

  return response.text();
}
