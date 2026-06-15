import type { HTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";

export type FieldProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  invalid?: boolean;
};

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export function Field({ children, className, disabled, invalid }: FieldProps) {
  return (
    <div
      className={cn("flex flex-col gap-[7px]", className)}
      data-disabled={disabled || undefined}
      data-invalid={invalid || undefined}
    >
      {children}
    </div>
  );
}

export function FieldLabel({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-[13px] font-bold leading-none text-text-2", className)} {...props} />;
}

export function FieldHint({
  className,
  invalid,
  ...props
}: HTMLAttributes<HTMLParagraphElement> & { invalid?: boolean }) {
  return (
    <p
      className={cn("m-0 text-xs font-semibold leading-5 text-text-3", invalid && "text-danger", className)}
      {...props}
    />
  );
}

export function Input({ className, disabled, invalid, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        "min-h-11 w-full rounded-sm border border-border-strong bg-surface px-3.5 py-[11px]",
        "text-sm font-medium leading-5 text-text shadow-none transition duration-150 ease-out",
        "placeholder:text-text-3 hover:border-accent",
        "focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)] focus:outline-none",
        "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-text-3 disabled:opacity-70",
        invalid && "border-danger focus:border-danger focus:shadow-[0_0_0_3px_var(--danger-soft)]",
        className,
      )}
      disabled={disabled}
      {...props}
    />
  );
}
