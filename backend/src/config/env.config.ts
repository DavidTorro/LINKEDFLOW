import * as Joi from "joi"; // joi es un paquete de validación de datos para JavaScript y TypeScript

export interface EnvConfig {
  NODE_ENV: "development" | "test" | "production";
  WEB_SERVER_PORT: number;
  FRONTEND_URL: string;
  LOCAL_DIR_URL: string;
  SWAGGER_ENABLED: boolean;
  OLLAMA_BASE_URL: string;
  OLLAMA_MODEL: string;
  OLLAMA_VISION_MODEL: string;
  OLLAMA_TIMEOUT_MS: number;
}

export const envValidationSchema = Joi.object<EnvConfig>({
  NODE_ENV: Joi.string()
    .valid("development", "test", "production")
    .default("development"),
  WEB_SERVER_PORT: Joi.number().port().default(3000),
  FRONTEND_URL: Joi.string().uri().default("http://localhost:5173"),
  // Opcional: si está vacío se ignora en CORS (ver main.ts).
  LOCAL_DIR_URL: Joi.string().uri().allow("").default(""),
  SWAGGER_ENABLED: Joi.boolean().truthy("true").falsy("false").default(true),
  OLLAMA_BASE_URL: Joi.string().uri().default("http://localhost:11434"),
  OLLAMA_MODEL: Joi.string().default("llama3.2:3b"),
  OLLAMA_VISION_MODEL: Joi.string().default("gemma3:4b"),
  OLLAMA_TIMEOUT_MS: Joi.number().integer().positive().default(180000),
});
