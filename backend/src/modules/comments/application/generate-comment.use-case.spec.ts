import {
  type CommentGeneratorPort,
  type GenerateCommentOutput,
} from "../domain/ports/comment-generator.port";
import {
  GenerateCommentUseCase,
  GenerateCommentValidationError,
} from "./generate-comment.use-case";

describe("GenerateCommentUseCase", () => {
  it("generates a comment through the comment generator port", async () => {
    const generator: jest.Mocked<CommentGeneratorPort> = {
      generate: jest
        .fn<
          Promise<GenerateCommentOutput>,
          Parameters<CommentGeneratorPort["generate"]>
        >()
        .mockResolvedValue({
          comment: "Gran reflexión para seguir mejorando la conversación.",
          model: "llama3.2:3b",
        }),
    };
    const useCase = new GenerateCommentUseCase(generator);

    const result = await useCase.execute({
      postContent: "Publicación sobre automatización en LinkedIn.",
      tone: "professional",
      language: "es",
    });

    expect(generator.generate).toHaveBeenCalledWith({
      postContent: "Publicación sobre automatización en LinkedIn.",
      tone: "professional",
      language: "es",
    });
    expect(result).toMatchObject({
      comment: "Gran reflexión para seguir mejorando la conversación.",
      tone: "professional",
      model: "llama3.2:3b",
    });
    expect(new Date(result.createdAt).toString()).not.toBe("Invalid Date");
  });

  it("rejects an empty post content", async () => {
    const generator: jest.Mocked<CommentGeneratorPort> = {
      generate: jest.fn(),
    };
    const useCase = new GenerateCommentUseCase(generator);

    await expect(
      useCase.execute({
        postContent: "   ",
        tone: "friendly",
      }),
    ).rejects.toBeInstanceOf(GenerateCommentValidationError);
    expect(generator.generate).not.toHaveBeenCalled();
  });
});
