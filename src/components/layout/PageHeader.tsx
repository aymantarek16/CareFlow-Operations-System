import { ReactNode } from "react";
import { cn } from "@/lib/helpers";

export function PageHeader({ eyebrow, title, description, actions, className }: {
  eyebrow?: string; title: string; description?: string; actions?: ReactNode; className?: string;
}) {
  return (
    <header className={cn("mb-6 overflow-hidden rounded-[32px] border border-foreground/10 bg-foreground/[0.03] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.25)] lg:p-8", className)}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary/70">{eyebrow}</p>}
          <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground lg:text-5xl">{title}</h1>
          {description && <p className="mt-4 text-sm leading-8 text-foreground/65 lg:text-base">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </header>
  );
}
