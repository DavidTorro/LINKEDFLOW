import type { CommentToneValue } from "../domain/comment-tone";

export interface GenerateCommentCommand {
  postContent: string;
  tone: CommentToneValue;
  language?: string;
}
