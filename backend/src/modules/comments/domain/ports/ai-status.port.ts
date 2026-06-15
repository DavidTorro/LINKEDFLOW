// Puerto de dominio para comprobar el estado del proveedor de IA (Ollama).
// Permite un "punto de prueba" rápido sin lanzar una generación completa.
export const AI_STATUS = Symbol("AiStatusPort");

export interface AiStatus {
  // ¿Responde el proveedor de IA?
  reachable: boolean;
  // URL base configurada (ya normalizada).
  baseUrl: string;
  // Modelos configurados para texto y visión.
  model: string;
  visionModel: string;
  // Modelos disponibles que reporta el proveedor (si los expone).
  models: string[];
  // Mensaje de error cuando no es accesible.
  error?: string;
}

export interface AiStatusPort {
  // Comprueba la conectividad y devuelve un estado normalizado (no lanza por caída del proveedor).
  check(): Promise<AiStatus>;
}
