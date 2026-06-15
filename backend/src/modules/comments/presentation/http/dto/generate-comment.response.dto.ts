import { ApiProperty } from "@nestjs/swagger";

export class GenerateCommentResponseDto {
  @ApiProperty({
    example:
      "Muy buena reflexión. La automatización aporta más valor cuando mantiene el contexto humano.",
  })
  comment!: string;

  @ApiProperty({
    example: "professional",
  })
  tone!: string;

  @ApiProperty({
    example: "llama3.2:3b",
  })
  model!: string;

  @ApiProperty({
    example: "2026-06-12T10:30:00.000Z",
  })
  createdAt!: string;
}
