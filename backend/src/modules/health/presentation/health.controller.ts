import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CheckHealthResult, CheckHealthUseCase } from "../application/check-health.use-case";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly checkHealthUseCase: CheckHealthUseCase) {}

  @Get()
  @ApiOperation({
    summary: "Verifica el estado del sistema",
    description:
      "Verifica si la aplicación está funcionando correctamente y devuelve información básica sobre su estado.",
  })
  @ApiResponse({
    status: 200,
    description: "La aplicación está en funcionamiento",
  })
  @ApiResponse({
    status: 503,
    description: "La aplicación no está disponible",
  })
  check(): CheckHealthResult {
    return this.checkHealthUseCase.execute();
  }
}
