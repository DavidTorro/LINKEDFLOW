import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils/cn";

// Variantes del botón al estilo shadcn (class-variance-authority), tematizadas con los tokens
// del proyecto. Se conservan los nombres de variante previos (default/secondary/ghost/destructive)
// para no romper los usos existentes, y se añaden `outline` y el tamaño `icon`.
export const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2 rounded-pill font-bold tracking-normal transition duration-150 ease-out",
    "whitespace-nowrap",
    "focus-visible:shadow-[0_0_0_3px_var(--accent-soft)]",
    "active:translate-y-px disabled:pointer-events-none disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50",
  ),
  {
    variants: {
      variant: {
        default: "bg-accent text-accent-fg shadow-sm hover:bg-accent-2 active:bg-accent-2",
        secondary:
          "border border-border bg-surface-2 text-text hover:border-border-strong hover:bg-surface-3 active:bg-surface-3",
        outline:
          "border border-border-strong bg-transparent text-text hover:bg-surface-2 active:bg-surface-3",
        ghost: "bg-transparent text-text-2 hover:bg-surface-2 hover:text-text active:bg-surface-3",
        destructive:
          "bg-danger-soft text-danger hover:bg-danger hover:text-accent-fg active:bg-danger",
      },
      size: {
        default: "min-h-11 px-[18px] py-2.5 text-sm",
        sm: "min-h-8 px-[13px] py-[7px] text-[13px]",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} type={type} {...props} />
  );
}
