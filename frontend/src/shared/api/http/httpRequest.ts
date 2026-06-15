import { HttpError } from './httpError';
import { buildHeaders, buildUrl, parseResponseBody } from './httpClient.utils';
import { HttpClientOptions, HttpMethod } from './httpClient.types';

// La función request es la función principal que realiza las solicitudes HTTP utilizando la API Fetch de JavaScript.
// Toma el método HTTP, el path de la solicitud y las opciones de configuración, construye la URL completa, 
// realiza la solicitud y maneja la respuesta, incluyendo el manejo de errores a través de la clase HttpError.
export async function request<TResponse>(
  method: HttpMethod,
  path: string,
  options?: HttpClientOptions,
): Promise<TResponse> {
  const url = buildUrl(path);
  const response = await fetch(url, {
    ...options,
    method,
    headers: buildHeaders(options),
    body: options?.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const body = await parseResponseBody(response);

  if (!response.ok) {
    throw new HttpError({
      status: response.status,
      statusText: response.statusText,
      url,
      body,
    });
  }

  return body as TResponse;
}
