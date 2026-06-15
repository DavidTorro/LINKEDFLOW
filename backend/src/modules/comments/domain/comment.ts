import { CommentTone } from "./comment-tone";

// Propiedades necesarias para construir un comentario de dominio
export interface CommentProps {
  content: string;
  tone: CommentTone;
  model: string;
  createdAt?: Date;
}

// Entidad de dominio que representa un comentario generado
export class Comment {
  private constructor(
    private readonly content: string,
    private readonly tone: CommentTone,
    private readonly model: string,
    private readonly createdAt: Date,
  ) {}

  // Crea un comentario garantizando contenido y modelo válidos
  static create(props: CommentProps): Comment {
    const content = props.content.trim();
    const model = props.model.trim();

    if (!content) {
      throw new Error("Comment content cannot be empty");
    }

    if (!model) {
      throw new Error("Comment model cannot be empty");
    }

    return new Comment(
      content,
      props.tone,
      model,
      props.createdAt ?? new Date(),
    );
  }

  getContent(): string {
    return this.content;
  }

  getTone(): CommentTone {
    return this.tone;
  }

  getModel(): string {
    return this.model;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}
