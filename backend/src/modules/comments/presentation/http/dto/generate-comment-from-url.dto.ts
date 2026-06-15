import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsString, Matches, MaxLength, MinLength } from "class-validator";

export class GenerateCommentFromUrlDto {
  @ApiProperty({
    description: "URL pública de un post de LinkedIn.",
    example: "https://www.linkedin.com/posts/example_activity-123456789/",
    maxLength: 500,
    minLength: 1,
  })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  @Matches(/^https?:\/\/([^/?#]+\.)?linkedin\.com\/posts\//i, {
    message: "URL no es de LinkedIn",
  })
  url!: string;
}

export class GenerateCommentFromUrlResponseDto {
  @ApiProperty({
    example:
      "Estamos incorporando automatización inteligente para mejorar la interacción con clientes en LinkedIn.",
  })
  text!: string;

  @ApiProperty({
    example:
      "Muy buena reflexión. La automatización aporta más valor cuando mantiene el contexto humano.",
  })
  comment!: string;
}
