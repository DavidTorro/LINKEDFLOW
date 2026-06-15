// Archivo de configuración para variables de entorno en el frontend.
// Se usa para centralizar la gestión de las URLs y otras configuraciones que puedan variar entre entornos (desarrollo, producción, etc.).

const backendBaseUrlFromEnv = import.meta.env.VITE_BACKEND_BASE_URL;

// Por defecto, el backend está en el MISMO host que sirve el frontend, en el puerto 3000.
// Así funciona tanto en localhost como desde otro dispositivo de la LAN (p. ej. el móvil),
// donde "localhost" apuntaría al propio teléfono y no al PC.
function defaultBackendBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:3000`;
  }
  return 'http://localhost:3000';
}

// Funcion para asegurar que la URL base del backend no termine con una barra,
// lo que podría causar problemas al construir las URLs para las solicitudes HTTP.
function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

// Constante que contiene la configuración de entorno para el frontend, incluyendo la URL base del backend.
// Se exporta como un objeto inmutable para evitar modificaciones accidentales en otras partes del código.
// VITE_BACKEND_BASE_URL solo es necesaria si el backend NO está en el mismo host:3000.
export const env = {
  backendBaseUrl: normalizeBaseUrl(
    backendBaseUrlFromEnv?.trim() ? backendBaseUrlFromEnv : defaultBackendBaseUrl(),
  ),
} as const;
