import { LucideIcon, Activity, TrendingUp } from "lucide-react";
import { cn } from "@/lib/helpers";

const tones = {
  emerald:
    "text-emerald-300 border-emerald-400/20 from-emerald-400/20 via-emerald-300/8 to-transparent",
  cyan:
    "text-cyan-300 border-cyan-400/20 from-cyan-400/20 via-cyan-300/8 to-transparent",
  violet:
    "text-violet-300 border-violet-400/20 from-violet-400/20 via-violet-300/8 to-transparent",
  amber:
    "text-amber-300 border-amber-400/20 from-amber-400/20 via-amber-300/8 to-transparent",
  rose:
    "text-rose-300 border-rose-400/20 from-rose-400/20 via-rose-300/8 to-transparent",
} as const;

export function StatCard({
  title,
  value,
  hint,
  tone = "emerald",
  icon: Icon = Activity,
}: {
  title: string;
  value: string | number;
  hint: string;
  tone?: keyof typeof tones;
  icon?: LucideIcon;
}) {
  return (
    <article
      className="
        group relative overflow-hidden rounded-[28px] border border-white/10
        bg-[linear-gradient(180deg,rgba(14,23,36,0.94)_0%,rgba(7,14,24,0.98)_100%)]
        p-5 lg:p-6
        shadow-[0_10px_40px_rgba(0,0,0,0.28)]
        transition-all duration-300 ease-out
        hover:-translate-y-1.5
        hover:border-white/15
        hover:shadow-[0_18px_60px_rgba(0,0,0,0.42)]
      "
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-24 bg-gradient-to-r opacity-80 blur-3xl transition-opacity duration-300 group-hover:opacity-100",
          tones[tone]
        )}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_32%)] opacity-60" />
      <div className="absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/5" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-4 flex items-center gap-2">
            <span
              className={cn(
                "h-2 w-2 rounded-full shadow-[0_0_18px_currentColor]",
                tones[tone].split(" ")[0]
              )}
            />
            <p className="text-sm font-medium tracking-wide text-foreground/60">
              {title}
            </p>
          </div>

          <p className="text-3xl font-black tracking-tight text-white lg:text-4xl">
            {value}
          </p>

          <div className="mt-4 flex items-center gap-2 text-xs text-foreground/50">
            <TrendingUp size={14} className="opacity-70" />
            <p className="leading-6">{hint}</p>
          </div>
        </div>

        <div
          className={cn(
            "relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border bg-white/[0.03] backdrop-blur-md transition-all duration-300",
            "group-hover:scale-105 group-hover:-translate-y-0.5",
            tones[tone]
          )}
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent opacity-70" />
          <Icon size={22} className="relative" />
        </div>
      </div>

      <div className="relative mt-5 h-px w-full bg-white/8">
        <div
          className={cn(
            "h-full w-24 bg-gradient-to-r transition-all duration-300 group-hover:w-32",
            tones[tone]
          )}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-[28px] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute -left-10 top-10 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -right-8 bottom-6 h-20 w-20 rounded-full bg-white/5 blur-2xl" />
      </div>
    </article>
  );
}