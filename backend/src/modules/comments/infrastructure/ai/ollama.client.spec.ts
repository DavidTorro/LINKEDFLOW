import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../../../config/env.config';
import { OllamaClient } from './ollama.client';
import { OllamaError } from './ollama.error';

/** ConfigService falso que devuelve valores fijos de Ollama. */
function buildConfig(
  overrides: Record<string, unknown> = {},
): ConfigService<EnvConfig, true> {
  const values: Record<string, unknown> = {
    OLLAMA_BASE_URL: 'http://localhost:11434',
    OLLAMA_MODEL: 'llama3.2:3b',
    OLLAMA_VISION_MODEL: 'gemma3:4b',
    OLLAMA_TIMEOUT_MS: 30000,
    ...overrides,
  };
  return {
    get: (key: string) => values[key],
  } as unknown as ConfigService<EnvConfig, true>;
}

describe('OllamaClient', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('llama a /api/generate con stream:false y devuelve texto recortado + modelo', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ model: 'llama3.2:3b', response: '  hola  ' }),
    });

    const client = new OllamaClient(buildConfig());
    const result = await client.generate('un prompt');

    expect(result).toEqual({ text: 'hola', model: 'llama3.2:3b' });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:11434/api/generate');
    const body = JSON.parse((options as RequestInit).body as string);
    expect(body).toMatchObject({
      model: 'llama3.2:3b',
      prompt: 'un prompt',
      stream: false,
    });
    // Sin API key -> sin cabecera Authorization.
    const headers = (options as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it('normaliza la base URL quitando /v1 y barras finales (API nativa)', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ model: 'llama3.2:3b', response: 'ok' }),
    });

    const client = new OllamaClient(
      buildConfig({ OLLAMA_BASE_URL: 'http://192.168.1.50:11434/v1/' }),
    );
    await client.generate('p');

    expect(fetchMock.mock.calls[0][0]).toBe(
      'http://192.168.1.50:11434/api/generate',
    );
  });

  it('lanza OllamaError ante estado no-2xx', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const client = new OllamaClient(buildConfig());
    await expect(client.generate('p')).rejects.toBeInstanceOf(OllamaError);
  });

  it('lanza OllamaError si no se puede conectar', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const client = new OllamaClient(buildConfig());
    await expect(client.generate('p')).rejects.toBeInstanceOf(OllamaError);
  });

  it('traduce un AbortError (timeout) a OllamaError', async () => {
    const abortError = new Error('aborted');
    abortError.name = 'AbortError';
    fetchMock.mockRejectedValue(abortError);

    const client = new OllamaClient(buildConfig({ OLLAMA_TIMEOUT_MS: 10 }));
    await expect(client.generate('p')).rejects.toThrow(/no respondió/);
  });

  describe('check (punto de prueba)', () => {
    it('devuelve reachable:true con los modelos instalados desde /api/tags', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          models: [{ name: 'llama3.2:3b' }, { name: 'gemma3:4b' }],
        }),
      });

      const client = new OllamaClient(buildConfig());
      const status = await client.check();

      expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:11434/api/tags');
      expect(status).toEqual({
        reachable: true,
        baseUrl: 'http://localhost:11434',
        model: 'llama3.2:3b',
        visionModel: 'gemma3:4b',
        models: ['llama3.2:3b', 'gemma3:4b'],
      });
    });

    it('devuelve reachable:false con error si no se puede conectar (sin lanzar)', async () => {
      fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

      const client = new OllamaClient(buildConfig());
      const status = await client.check();

      expect(status.reachable).toBe(false);
      expect(status.models).toEqual([]);
      expect(status.error).toMatch(/No se pudo conectar/);
    });

    it('devuelve reachable:false ante un estado no-2xx', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const client = new OllamaClient(buildConfig());
      const status = await client.check();

      expect(status.reachable).toBe(false);
      expect(status.error).toMatch(/500/);
    });
  });
});
