import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../shared/hooks/useTheme";
import { Button } from "../../shared/ui";
import { AiStatusBadge } from "../../features/comments/presentation/components/AiStatusBadge";

export function Topbar() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-[color-mix(in_oklch,var(--surface)_88%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex min-h-[64px] w-full max-w-[1100px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <span className="min-w-0 text-[15px] font-extrabold tracking-normal text-text sm:text-base">
          Linked<span className="text-accent">Flow</span>
        </span>

        <div className="ml-auto flex min-w-0 items-center gap-2">
          <AiStatusBadge />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={isLight ? "Activar modo oscuro" : "Activar modo claro"}
          >
            {isLight ? <Moon size={18} /> : <Sun size={18} />}
          </Button>
        </div>
      </div>
    </header>
  );
}
