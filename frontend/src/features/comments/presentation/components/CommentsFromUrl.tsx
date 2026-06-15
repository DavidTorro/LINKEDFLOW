import { useState } from "react";
import { Check, Copy, Link, Sparkles, X } from "lucide-react";
import { useCommentStreaming } from "../../application/hooks/useCommentStreaming";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  FieldHint,
  FieldLabel,
} from "../../../../shared/ui";
import { cn } from "../../../../shared/utils/cn";

const LINKEDIN_HOST_PATTERN = /(^|\.)linkedin\.com$/i;

const ERROR_MESSAGES = {
  invalidUrl: "La URL no es un post válido de LinkedIn.",
  notFound: "No se encontró el post o el acceso está restringido.",
  timeout: "La URL tardó demasiado en responder. Inténtalo de nuevo.",
  noContent: "No se pudo extraer contenido del post.",
  unavailable:
    "El servicio de generación no está disponible ahora mismo. Inténtalo de nuevo en unos minutos.",
  connection: "Se perdió la conexión con el servidor.",
  unknown: "Ha ocurrido un error inesperado. Inténtalo de nuevo.",
};

const fieldControl = cn(
  "w-full rounded-sm border border-border-strong bg-surface px-3.5 py-[11px]",
  "text-sm font-medium leading-6 text-text shadow-none transition duration-150 ease-out",
  "placeholder:text-text-3 hover:border-accent",
  "focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)] focus:outline-none",
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-text-3 disabled:opacity-70",
);

export function CommentsFromUrl() {
  const { state, start, cancel, fail } = useCommentStreaming();
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const isLoading = state.status === "streaming";
  const canSubmit = url.trim().length > 0 && !isLoading;
  const result =
    state.status === "streaming"
      ? { text: state.text, comment: state.comment }
      : state.status === "success"
        ? state.data
        : null;

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedUrl = url.trim();

    if (!canSubmit) return;

    if (!isLinkedInPostUrl(trimmedUrl)) {
      fail(ERROR_MESSAGES.invalidUrl);
      return;
    }

    setCopied(false);
    start(trimmedUrl, ERROR_MESSAGES);
  };

  const onCancel = () => {
    cancel();
  };

  const onCopy = async () => {
    if (state.status !== "success") return;
    await navigator.clipboard.writeText(state.data.comment);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
      <Card>
        <form onSubmit={onSubmit}>
          <CardHeader>
            <CardTitle>URL del post de LinkedIn</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="linkedin-post-url">Enlace del post</FieldLabel>
              <div className="relative">
                <Link
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3"
                  aria-hidden
                />
                <input
                  id="linkedin-post-url"
                  className={cn(fieldControl, "pl-10")}
                  placeholder="https://www.linkedin.com/posts/…"
                  value={url}
                  disabled={isLoading}
                  onChange={(event) => setUrl(event.target.value)}
                />
              </div>
              <FieldHint>Pega la URL pública de un post de LinkedIn.</FieldHint>
            </Field>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button className="w-full sm:w-auto" type="submit" disabled={!canSubmit}>
                <Sparkles size={16} />
                {isLoading ? "Generando…" : "Generar comentario"}
              </Button>
              {isLoading ? (
                <Button className="w-full sm:w-auto" type="button" variant="secondary" onClick={onCancel}>
                  <X size={16} />
                  Cancelar
                </Button>
              ) : null}
            </div>
          </CardContent>
        </form>
      </Card>

      <Card className="flex min-h-[220px] flex-col">
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle>Comentario generado</CardTitle>
          {state.status === "success" ? (
            <Button className="shrink-0" variant="ghost" size="sm" onClick={onCopy}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-5">
          {result ? (
            <Field>
              <FieldLabel>Comentario</FieldLabel>
              <p className="whitespace-pre-wrap text-[15px] font-medium leading-7 text-text">
                {result.comment || "Generando comentario…"}
                {state.status === "streaming" ? (
                  <span
                    className="ml-1 inline-block h-4 w-px animate-pulse bg-accent align-middle"
                    aria-hidden
                  />
                ) : null}
              </p>
            </Field>
          ) : state.status === "error" ? (
            <p className="text-[14px] font-semibold text-danger">{state.message}</p>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center text-text-3">
              <Link size={28} className="opacity-60" aria-hidden />
              <p className="text-[14px] font-medium">
                Pega una URL y genera un comentario en tiempo real.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function isLinkedInPostUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return (
      LINKEDIN_HOST_PATTERN.test(parsedUrl.hostname) &&
      parsedUrl.pathname.includes("/posts/")
    );
  } catch {
    return false;
  }
}
