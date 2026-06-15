import { Inject, Injectable } from "@nestjs/common";
import { AI_STATUS, type AiStatus, type AiStatusPort } from "../../domain/ports/ai-status.port";

// Caso de uso del "punto de prueba" de IA: delega en el puerto sin conocer Ollama.
@Injectable()
export class CheckAiStatusUseCase {
  constructor(
    @Inject(AI_STATUS)
    private readonly aiStatus: AiStatusPort,
  ) {}

  execute(): Promise<AiStatus> {
    return this.aiStatus.check();
  }
}
