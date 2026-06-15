import { useCallback, useState } from "react";
import { generateComment } from "../../application/generateComment";
import type { CommentTone, GenerateCommentResult } from "../../domain/types";
import { HttpError } from "../../../../shared/api/http/httpClient";

export type GenerateCommentState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: GenerateCommentResult }
  | { status: "error"; message: string };

type GenerateInput = {
  postContent: string;
  tone: CommentTone;
  language?: string;
};

// Mensajes ya traducidos que llegan desde la vista (regla del proyecto: nada de i18n aquí).
type ErrorMessages = {
  connection: string;
  unavailable: string;
  unknown: string;
};

// Encapsula la llamada al caso de uso y su máquina de estados, fuera del componente
// (igual que useHealthCheck). La generación puede tardar 2-3 min con el modelo local.
export function useGenerateComment() {
  const [state, setState] = useState<GenerateCommentState>({ status: "idle" });

  const generate = useCallback(
    async (input: GenerateInput, messages: ErrorMessages) => {
      setState({ status: "loading" });

      try {
        const data = await generateComment(input);
        setState({ status: "success", data });
      } catch (error) {
        let message = messages.unknown;

        if (error instanceof HttpError) {
          // 503 = el proveedor de IA (Ollama) no está disponible (lo mapea el backend).
          message =
            error.response.status === 503
              ? messages.unavailable
              : `${error.response.status} ${error.response.statusText}`;
        } else if (error instanceof TypeError) {
          message = messages.connection;
        }

        setState({ status: "error", message });
      }
    },
    [],
  );

  return { state, generate };
}
