import { ReactNode } from "react";
import { cn } from "@/lib/helpers";

export function GlassCard({ title, subtitle, children, className, action }: {
  title?: string; subtitle?: string; children: ReactNode; className?: string; action?: ReactNode;
}) {
  return (
    <section className={cn("panel rounded-[28px] p-5 lg:p-6", className)}>
      {(title || subtitle || action) && (
        <header className="mb-5 flex items-start justify-between gap-4 border-b border-foreground/8 pb-4">
          <div>
            {title && <h3 className="text-lg font-bold text-foreground lg:text-xl">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm leading-7 text-foreground/58">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
