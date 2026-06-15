import { Cpu } from "lucide-react";
import { useAiHealth } from "../../application/hooks/useAiHealth";
import { cn } from "../../../../shared/utils/cn";

// Indicador del estado de Ollama en la barra superior.
// Móvil: icono de IA con un punto de estado encima (compacto).
// Escritorio: además el nombre del modelo. Al pulsar, reintenta.
export function AiStatusBadge() {
  const { state, refresh } = useAiHealth();

  const reachable = state.status === "ready" && state.data.reachable;
  const loading = state.status === "loading";

  const dotClass = loading
    ? "bg-text-3 animate-pulse"
    : reachable
      ? "bg-success"
      : "bg-danger";

  const label = loading
    ? "Comprobando…"
    : reachable
      ? state.data.model
      : "Sin conexión";

  const title =
    state.status === "ready"
      ? state.data.reachable
        ? `Ollama conectado en ${state.data.baseUrl}\nModelo: ${state.data.model}\nVisión: ${state.data.visionModel}\nInstalados: ${state.data.models.join(", ") || "—"}`
        : `Ollama no responde${state.data.error ? `: ${state.data.error}` : ""}`
      : state.status === "error"
        ? "No se pudo consultar el estado de la IA"
        : "Comprobando el estado de Ollama…";

  return (
    <button
      type="button"
      onClick={() => void refresh()}
      title={title}
      aria-label={`Estado de Ollama: ${label}. Pulsa para reintentar.`}
      className={cn(
        "inline-flex items-center gap-2 rounded-pill border border-border bg-surface-2 transition",
        "h-9 px-2.5 text-[12.5px] font-semibold text-text-2",
        "hover:border-border-strong hover:bg-surface-3 sm:px-3",
      )}
    >
      <span className="relative inline-flex shrink-0">
        <Cpu size={16} className="text-text-3" aria-hidden />
        <span
          className={cn(
            "absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full ring-2 ring-surface-2",
            dotClass,
          )}
          aria-hidden
        />
      </span>
      <span className="hidden max-w-[140px] truncate sm:inline">{label}</span>
    </button>
  );
}
