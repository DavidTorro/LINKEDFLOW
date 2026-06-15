import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { GENERATE_COMMENT_TONES } from "../../../domain/ports/comment-generator.port";
import type { GenerateCommentTone } from "../../../domain/ports/comment-generator.port";

export class GenerateCommentRequestDto {
  @ApiProperty({
    description:
      "Contenido o contexto del post sobre el que se generará el comentario. Se recomienda incluir información relevante para obtener un comentario más preciso y útil.",
    example:
      "Estamos incorporando automatización inteligente para mejorar la interacción con clientes en LinkedIn.",
    maxLength: 2000,
    minLength: 1,
  })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  postContent!: string;

  @ApiProperty({
    description: "Tono deseado para el comentario generado.",
    enum: GENERATE_COMMENT_TONES,
    example: "professional",
  })
  @IsIn(GENERATE_COMMENT_TONES)
  tone!: GenerateCommentTone;

  @ApiPropertyOptional({
    description: "Código de idioma para el comentario generado.",
    example: "es",
    maxLength: 10,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(10)
  language?: string;
}
