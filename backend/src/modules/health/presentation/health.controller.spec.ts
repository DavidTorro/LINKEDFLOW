import { Test, TestingModule } from '@nestjs/testing';
import {
  CheckHealthResult,
  CheckHealthUseCase,
} from '../application/check-health.use-case';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let useCase: Pick<CheckHealthUseCase, 'execute'>;

  beforeEach(async () => {
    useCase = {
      execute: jest.fn<CheckHealthResult, []>(() => ({
        status: 'ok',
        uptime: 12,
        timestamp: '2026-06-10T00:00:00.000Z',
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: CheckHealthUseCase, useValue: useCase }],
    }).compile();

    controller = module.get(HealthController);
  });

  it('delegates health checks to the use case', () => {
    expect(controller.check()).toEqual({
      status: 'ok',
      uptime: 12,
      timestamp: '2026-06-10T00:00:00.000Z',
    });
    expect(useCase.execute).toHaveBeenCalledTimes(1);
  });
});
