import { ReactNode } from "react";
import { cn } from "@/lib/helpers";
import { HeaderAuroraPattern } from "@/components/layout/HeaderAuroraPattern";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
  aurora = true,
  auroraIntensity = "soft",
  auroraColor = "mixed",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  /** Render the decorative aurora background (default true). */
  aurora?: boolean;
  auroraIntensity?: "soft" | "medium";
  auroraColor?: "emerald" | "cyan" | "mixed";
}) {
  return (
    <header
      className={cn(
        "relative mb-6 overflow-hidden rounded-[32px] border border-foreground/10 bg-foreground/[0.03] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.25)] lg:p-8",
        className,
      )}
    >
      {aurora && <HeaderAuroraPattern intensity={auroraIntensity} color={auroraColor} />}
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
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
