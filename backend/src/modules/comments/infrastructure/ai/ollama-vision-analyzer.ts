import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { EnvConfig } from "../../../../config/env.config";
import type { VisionAnalyzer } from "../../domain/ports/vision-analyzer.port";

interface OllamaVisionGenerateResponse {
  response?: string;
  done?: boolean;
}

const VISION_PROMPT =
  "Describe this image in 1-2 sentences in Spanish (or English, depending on context)";

@Injectable()
export class OllamaVisionAnalyzer implements VisionAnalyzer {
  constructor(private readonly config: ConfigService<EnvConfig, true>) {}

  async analyze(
    imageUrl: string,
    options: { signal?: AbortSignal } = {},
  ): Promise<string> {
    const imageBase64 = await this.downloadImageAsBase64(imageUrl, options);
    const response = await this.generateVisionDescription(imageBase64, options);

    return response.trim();
  }

  private async downloadImageAsBase64(
    imageUrl: string,
    options: { signal?: AbortSignal } = {},
  ): Promise<string> {
    const response = await this.fetchWithTimeout(
      imageUrl,
      {
        method: "GET",
      },
      options,
    );

    if (!response.ok) {
      throw new Error(
        `No se pudo descargar la imagen: ${response.status} ${response.statusText}`,
      );
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());
    return imageBuffer.toString("base64");
  }

  private async generateVisionDescription(
    imageBase64: string,
    options: { signal?: AbortSignal } = {},
  ): Promise<string> {
    const baseUrl = this.normalizeBaseUrl(
      this.config.get("OLLAMA_BASE_URL", { infer: true }),
    );
    const model = this.config.get("OLLAMA_VISION_MODEL", { infer: true });
    const timeoutMs = this.config.get("OLLAMA_TIMEOUT_MS", { infer: true });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const abortFromCaller = () => controller.abort();

    if (options.signal?.aborted) {
      controller.abort();
    } else {
      options.signal?.addEventListener("abort", abortFromCaller, {
        once: true,
      });
    }

    try {
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          prompt: VISION_PROMPT,
          images: [imageBase64],
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `Ollama vision devolvió ${response.status} ${response.statusText}`,
        );
      }

      if (!response.body) {
        throw new Error("Ollama vision no devolvió un stream de respuesta");
      }

      return await this.readVisionStream(response.body);
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "AbortError" &&
        !options.signal?.aborted
      ) {
        throw new Error(`Ollama vision no respondió en ${timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener("abort", abortFromCaller);
    }
  }

  private async fetchWithTimeout(
    url: string,
    init: RequestInit,
    options: { signal?: AbortSignal } = {},
  ): Promise<Response> {
    const timeoutMs = this.config.get("OLLAMA_TIMEOUT_MS", { infer: true });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const abortFromCaller = () => controller.abort();

    if (options.signal?.aborted) {
      controller.abort();
    } else {
      options.signal?.addEventListener("abort", abortFromCaller, {
        once: true,
      });
    }

    try {
      return await fetch(url, {
        ...init,
        signal: controller.signal,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "AbortError" &&
        !options.signal?.aborted
      ) {
        throw new Error(`Ollama vision no respondió en ${timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener("abort", abortFromCaller);
    }
  }

  private async readVisionStream(body: ReadableStream<Uint8Array>): Promise<string> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let description = "";

    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const payload = this.parseStreamLine(line);
        description += payload.response ?? "";

        if (payload.done) {
          return description;
        }
      }

      if (done) {
        const payload = this.parseStreamLine(buffer);
        description += payload.response ?? "";
        return description;
      }
    }
  }

  private parseStreamLine(line: string): OllamaVisionGenerateResponse {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      return {};
    }

    return JSON.parse(trimmedLine) as OllamaVisionGenerateResponse;
  }

  private normalizeBaseUrl(baseUrl: string): string {
    return baseUrl.replace(/\/+$/, "").replace(/\/v1$/, "");
  }
}
