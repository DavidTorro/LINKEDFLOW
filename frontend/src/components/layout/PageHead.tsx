import type { ReactNode } from "react";

type PageHeadProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHead({ eyebrow, title, subtitle, actions }: PageHeadProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex max-w-3xl flex-col gap-2">
        {eyebrow ? (
          <p className="text-[11px] font-bold uppercase tracking-normal text-text-3">{eyebrow}</p>
        ) : null}
        <h1 className="text-[1.75rem] font-extrabold leading-tight tracking-normal text-text sm:text-[2rem]">
          {title}
        </h1>
        {subtitle ? <p className="max-w-2xl text-[15px] font-medium leading-6 text-text-2">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
