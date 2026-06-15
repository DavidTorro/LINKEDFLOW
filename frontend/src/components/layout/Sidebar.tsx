import { NavLink } from "react-router";
import { MessageSquareText, Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "../../shared/utils/cn";

type NavEntry = { label: string; icon: LucideIcon; to: string };

const FEATURES: NavEntry[] = [
  { label: "Comentarios", icon: MessageSquareText, to: "/" },
];

const itemBase =
  "flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-[14.5px] font-semibold transition";

export function Sidebar({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  return (
    <aside
      className={cn(
        "flex h-full w-[280px] flex-col gap-8 border-r border-border bg-surface px-4 py-6",
        className,
      )}
    >
      <div className="flex items-center gap-2.5 px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-accent text-accent-fg shadow-sm">
          <Sparkles size={18} />
        </span>
        <span className="text-[19px] font-extrabold tracking-[-0.02em] text-text">
          Linked<span className="text-accent">Flow</span>
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-text-3">
          Herramientas
        </p>
        {FEATURES.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={label}
            to={to}
            end
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                itemBase,
                isActive
                  ? "bg-accent-soft text-accent"
                  : "text-text-2 hover:bg-surface-2 hover:text-text",
              )
            }
          >
            <Icon size={18} className="shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      <p className="px-3 text-[12px] font-medium leading-5 text-text-3">
        Comentarios para LinkedIn con IA local.
      </p>
    </aside>
  );
}
