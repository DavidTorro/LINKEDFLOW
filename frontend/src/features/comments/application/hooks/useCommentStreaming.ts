import { useCallback, useEffect, useRef, useState } from "react";
import {
  streamGenerateCommentFromUrl,
  type GenerateCommentFromUrlResult,
  type GenerateCommentStreamEvent,
} from "../../infrastructure/api/commentsApi";

export type CommentStreamingState =
  | { status: "idle" }
  | { status: "streaming"; text: string; comment: string }
  | { status: "success"; data: GenerateCommentFromUrlResult }
  | { status: "error"; message: string };

type ErrorMessages = {
  invalidUrl: string;
  notFound: string;
  timeout: string;
  noContent: string;
  connection: string;
  unavailable: string;
  unknown: string;
};

export function useCommentStreaming() {
  const eventSourceRef = useRef<EventSource | null>(null);
  const [state, setState] = useState<CommentStreamingState>({
    status: "idle",
  });

  const closeStream = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
  }, []);

  const cancel = useCallback(() => {
    closeStream();
    setState({ status: "idle" });
  }, [closeStream]);

  const fail = useCallback(
    (message: string) => {
      closeStream();
      setState({ status: "error", message });
    },
    [closeStream],
  );

  const start = useCallback(
    (url: string, messages: ErrorMessages) => {
      closeStream();
      setState({ status: "streaming", text: "", comment: "" });

      const eventSource = streamGenerateCommentFromUrl(url);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const chunk = JSON.parse(event.data) as GenerateCommentStreamEvent;
          setState((currentState) => {
            const currentText =
              currentState.status === "streaming" ? currentState.text : "";
            const currentComment =
              currentState.status === "streaming"
                ? currentState.comment
                : "";

            return {
              status: "streaming",
              text: chunk.text || currentText,
              comment: chunk.comment ?? `${currentComment}${chunk.token ?? ""}`,
            };
          });
        } catch {
          closeStream();
          setState({ status: "error", message: messages.unknown });
        }
      };

      eventSource.addEventListener("done", () => {
        setState((currentState) => {
          if (currentState.status !== "streaming") {
            return currentState;
          }

          return {
            status: "success",
            data: {
              text: currentState.text,
              comment: currentState.comment,
            },
          };
        });
        closeStream();
      });

      eventSource.addEventListener("error", (event) => {
        const message = resolveStreamingErrorMessage(event, messages);
        closeStream();
        setState({ status: "error", message });
      });
    },
    [closeStream],
  );

  useEffect(() => closeStream, [closeStream]);

  return { state, start, cancel, fail };
}

function resolveStreamingErrorMessage(
  event: Event,
  messages: ErrorMessages,
): string {
  const data = (event as MessageEvent<string>).data;

  if (typeof data !== "string" || !data) {
    return messages.connection;
  }

  try {
    const payload = JSON.parse(data) as { code?: string; message?: string };

    if (payload.code === "invalid_url") {
      return messages.invalidUrl;
    }

    if (payload.code === "not_found") {
      return messages.notFound;
    }

    if (payload.code === "timeout") {
      return messages.timeout;
    }

    if (payload.code === "empty_content") {
      return messages.noContent;
    }

    if (payload.code === "ai_unavailable") {
      return messages.unavailable;
    }

    return messages.unknown;
  } catch {
    return messages.unknown;
  }
}
