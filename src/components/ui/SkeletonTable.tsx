import { cn } from "@/lib/helpers";

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonTable({ rows = 5, columns = 4, className }: SkeletonTableProps) {
  return (
    <div className={cn("overflow-hidden rounded-[24px] border border-foreground/10 bg-background/50", className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-foreground/10 bg-foreground/[0.04]">
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-4 py-4">
                  <div className="h-4 w-20 animate-pulse rounded bg-foreground/10" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <tr key={rowIdx} className="border-b border-foreground/6">
                {Array.from({ length: columns }).map((_, colIdx) => (
                  <td key={colIdx} className="px-4 py-4">
                    <div
                      className="h-4 animate-pulse rounded bg-foreground/5"
                      style={{
                        width: colIdx === 0 ? "60%" : colIdx === columns - 1 ? "40%" : "80%",
                        animationDelay: `${rowIdx * 100 + colIdx * 50}ms`,
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("panel rounded-[28px] p-5 lg:p-6", className)}>
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-foreground/8 pb-4">
        <div className="space-y-2">
          <div className="h-6 w-32 animate-pulse rounded-xl bg-foreground/10" />
          <div className="h-4 w-48 animate-pulse rounded-lg bg-foreground/5" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[20px] border border-foreground/10 bg-foreground/[0.03] p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 animate-pulse rounded-lg bg-foreground/10" />
                <div className="h-3 w-24 animate-pulse rounded bg-foreground/5" />
              </div>
              <div className="h-8 w-16 animate-pulse rounded-full bg-foreground/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div className={cn("panel relative overflow-hidden rounded-[28px] p-5 lg:p-6", className)}>
      <div className="relative flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="h-4 w-24 animate-pulse rounded-lg bg-foreground/10" />
          <div className="h-10 w-16 animate-pulse rounded-xl bg-foreground/20" />
          <div className="h-3 w-32 animate-pulse rounded bg-foreground/5" />
        </div>
        <div className="h-12 w-12 animate-pulse rounded-2xl bg-foreground/10" />
      </div>
    </div>
  );
}

export function SkeletonForm({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-20 animate-pulse rounded bg-foreground/10" />
          <div className="h-12 w-full animate-pulse rounded-2xl bg-foreground/5" />
        </div>
      ))}
      <div className="h-11 w-full animate-pulse rounded-2xl bg-primary/20" />
    </div>
  );
}
