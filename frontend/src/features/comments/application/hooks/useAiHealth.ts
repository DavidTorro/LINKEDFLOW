import { useCallback, useEffect, useState } from "react";
import { getAiHealth, type AiHealth } from "../../infrastructure/api/commentsApi";

export type AiHealthState =
  | { status: "loading" }
  | { status: "ready"; data: AiHealth }
  | { status: "error" };

// Consulta el punto de prueba de Ollama (GET /comments/ai/health) al montar,
// y expone un `refresh` para reintentar manualmente.
export function useAiHealth() {
  const [state, setState] = useState<AiHealthState>({ status: "loading" });

  const refresh = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const data = await getAiHealth();
      setState({ status: "ready", data });
    } catch {
      setState({ status: "error" });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { state, refresh };
}
