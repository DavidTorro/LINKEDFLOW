import { CommentGenerationError } from '../../domain/errors/comment-generation.error';
import type { GenerateCommentInput } from '../../domain/ports/comment-generator.port';
import { OllamaCommentGenerator } from './ollama-comment-generator';
import { OllamaClient, type OllamaGenerateResult } from './ollama.client';
import { OllamaError } from './ollama.error';

const INPUT: GenerateCommentInput = {
  postContent: 'Acabamos de lanzar nuestra nueva plataforma de automatización.',
  tone: 'professional',
  language: 'es',
};

/** OllamaClient falso con un generate() controlable. */
function buildClient(generate: jest.Mock): OllamaClient {
  return { generate } as unknown as OllamaClient;
}

describe('OllamaCommentGenerator', () => {
  it('construye el prompt (idioma + tono + contexto) y delega en el client', async () => {
    const clientResult: OllamaGenerateResult = {
      text: 'Enhorabuena',
      model: 'llama3.2:3b',
    };
    const generate = jest.fn().mockResolvedValue(clientResult);

    const generator = new OllamaCommentGenerator(buildClient(generate));
    const output = await generator.generate(INPUT);

    expect(output).toEqual({ comment: 'Enhorabuena', model: 'llama3.2:3b' });

    const prompt = generate.mock.calls[0][0];
    expect(prompt).toContain('idioma "es"');
    expect(prompt).toContain('profesional'); // tono mapeado
    expect(prompt).toContain('nueva plataforma de automatización'); // contexto
  });

  it('lanza CommentGenerationError si el comentario viene vacío', async () => {
    const generate = jest.fn().mockResolvedValue({
      text: '',
      model: 'llama3.2:3b',
    });

    const generator = new OllamaCommentGenerator(buildClient(generate));
    await expect(generator.generate(INPUT)).rejects.toBeInstanceOf(
      CommentGenerationError,
    );
  });

  it('traduce OllamaError (infra) a CommentGenerationError (dominio)', async () => {
    const generate = jest
      .fn()
      .mockRejectedValue(new OllamaError('Ollama no respondió en 10ms'));

    const generator = new OllamaCommentGenerator(buildClient(generate));
    await expect(generator.generate(INPUT)).rejects.toBeInstanceOf(
      CommentGenerationError,
    );
  });
});
