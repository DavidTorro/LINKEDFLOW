import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Combina clases de Tailwind de forma segura: clsx resuelve condicionales y
// tailwind-merge deduplica utilidades en conflicto (p.ej. "px-2 px-4" -> "px-4").
// Es el helper estándar de shadcn/ui, base de todos los componentes.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
