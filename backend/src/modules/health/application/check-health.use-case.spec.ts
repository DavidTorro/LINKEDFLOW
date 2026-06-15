import { CheckHealthUseCase } from './check-health.use-case';

describe('CheckHealthUseCase', () => {
  it('returns the current health status', () => {
    const useCase = new CheckHealthUseCase();

    const result = useCase.execute();

    expect(result.status).toBe('ok');
    expect(typeof result.uptime).toBe('number');
    expect(result.uptime).toBeGreaterThanOrEqual(0);
    expect(new Date(result.timestamp).toString()).not.toBe('Invalid Date');
  });
});
