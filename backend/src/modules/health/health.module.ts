import { Module } from '@nestjs/common';
import { CheckHealthUseCase } from './application/check-health.use-case';
import { HealthController } from './presentation/health.controller';

@Module({
  controllers: [HealthController],
  providers: [CheckHealthUseCase],
})
export class HealthModule {}
