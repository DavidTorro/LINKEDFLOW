import { useState } from "react";
import { Check, Copy, Link, MessageSquareText, Pencil, Sparkles } from "lucide-react";
import { PageHead } from "../../../components/layout/PageHead";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  FieldHint,
  FieldLabel,
} from "../../../shared/ui";
import { cn } from "../../../shared/utils/cn";
import { COMMENT_TONES, type CommentTone } from "../domain/types";
import { CommentsFromUrl } from "./components/CommentsFromUrl";
import { useGenerateComment } from "./hooks/useGenerateComment";

const MAX_POST_CHARS = 2000;
type CommentsMode = "manual" | "fromUrl";

const TONE_LABELS: Record<CommentTone, string> = {
  professional: "Profesional",
  friendly: "Cercano",
  enthusiastic: "Entusiasta",
  analytical: "Analítico",
  supportive: "De apoyo",
};

const fieldControl = cn(
  "w-full rounded-sm border border-border-strong bg-surface px-3.5 py-[11px]",
  "text-sm font-medium leading-6 text-text shadow-none transition duration-150 ease-out",
  "placeholder:text-text-3 hover:border-accent",
  "focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)] focus:outline-none",
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-text-3 disabled:opacity-70",
);

export function CommentsPage() {
  const { state, generate } = useGenerateComment();

  const [mode, setMode] = useState<CommentsMode>("manual");
  const [postContent, setPostContent] = useState("");
  const [tone, setTone] = useState<CommentTone>("professional");
  const [copied, setCopied] = useState(false);

  const isLoading = state.status === "loading";
  const canSubmit = postContent.trim().length > 0 && !isLoading;

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setCopied(false);
    generate(
      { postContent, tone, language: "es" },
      {
        connection: "No se pudo conectar con el servidor. Revisa tu conexión.",
        unavailable:
          "El servicio de generación no está disponible ahora mismo. Inténtalo de nuevo en unos minutos.",
        unknown: "Ha ocurrido un error inesperado. Inténtalo de nuevo.",
      },
    );
  };

  const onCopy = async () => {
    if (state.status !== "success") return;
    await navigator.clipboard.writeText(state.data.comment);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <PageHead
        eyebrow="Generador con IA"
        title="Comentarios para LinkedIn"
        subtitle="Genera comentarios que aportan valor, a partir del texto de un post o de su URL."
      />

      <div className="grid w-full grid-cols-2 gap-1.5 rounded border border-border bg-surface-3 p-1 shadow-sm">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "manual"}
          className={cn(
            "inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-sm px-3 text-sm font-bold tracking-normal transition sm:px-4",
            mode === "manual"
              ? "border border-border bg-surface text-text shadow-sm"
              : "border border-transparent text-text-2 hover:border-border hover:bg-surface-2 hover:text-text",
          )}
          onClick={() => setMode("manual")}
        >
          <Pencil size={16} />
          Pegar texto
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "fromUrl"}
          className={cn(
            "inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-sm px-3 text-sm font-bold tracking-normal transition sm:px-4",
            mode === "fromUrl"
              ? "border border-border bg-surface text-text shadow-sm"
              : "border border-transparent text-text-2 hover:border-border hover:bg-surface-2 hover:text-text",
          )}
          onClick={() => setMode("fromUrl")}
        >
          <Link size={16} />
          Desde URL
        </button>
      </div>

      {mode === "manual" ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
          {/* Formulario */}
          <Card>
            <form onSubmit={onSubmit}>
              <CardHeader>
                <CardTitle>Contenido del post</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Field>
                  <textarea
                    className={cn(fieldControl, "min-h-[132px] resize-y sm:min-h-[146px]")}
                    placeholder="Pega aquí el texto del post sobre el que quieres comentar…"
                    value={postContent}
                    maxLength={MAX_POST_CHARS}
                    disabled={isLoading}
                    onChange={(event) => setPostContent(event.target.value)}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <FieldHint>Cuanto más contexto, mejor será el comentario.</FieldHint>
                    <span className="shrink-0 text-right font-mono text-xs font-semibold text-text-3">
                      {postContent.length} / {MAX_POST_CHARS}
                    </span>
                  </div>
                </Field>

                <Field>
                  <FieldLabel htmlFor="tone">Tono</FieldLabel>
                  <select
                    id="tone"
                    className={cn(fieldControl, "min-h-11 cursor-pointer")}
                    value={tone}
                    disabled={isLoading}
                    onChange={(event) => setTone(event.target.value as CommentTone)}
                  >
                    {COMMENT_TONES.map((value) => (
                      <option key={value} value={value}>
                        {TONE_LABELS[value]}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <Button className="w-full sm:w-auto" type="submit" disabled={!canSubmit}>
                    <Sparkles size={16} />
                    {isLoading ? "Generando…" : "Generar comentario"}
                  </Button>
                  {isLoading ? (
                    <span className="text-[13px] font-semibold text-text-3">
                      Puede tardar unos minutos con el modelo local.
                    </span>
                  ) : null}
                </div>
              </CardContent>
            </form>
          </Card>

          {/* Resultado */}
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
            <CardContent className="flex flex-1 flex-col gap-4">
              {state.status === "success" ? (
                <>
                  <p className="whitespace-pre-wrap text-[15px] font-medium leading-7 text-text">
                    {state.data.comment}
                  </p>
                  <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border pt-4">
                    <Badge tone="accent">{TONE_LABELS[state.data.tone as CommentTone] ?? state.data.tone}</Badge>
                    <Badge tone="neutral">Modelo: {state.data.model}</Badge>
                  </div>
                </>
              ) : state.status === "error" ? (
                <p className="text-[14px] font-semibold text-danger">{state.message}</p>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center text-text-3">
                  <MessageSquareText size={28} className="opacity-60" aria-hidden />
                  <p className="text-[14px] font-medium">
                    Aquí aparecerá el comentario generado.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <CommentsFromUrl />
      )}
    </div>
  );
}
