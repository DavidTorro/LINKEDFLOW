// Resultado que el caso de uso expone a la capa de presentación
export interface GenerateCommentResult {
  comment: string;
  tone: string;
  model: string;
  createdAt: string;
}