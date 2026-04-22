import { LucideIcon, Activity, Sparkles } from "lucide-react";
import { cn } from "@/lib/helpers";

const tones = {
  emerald: "from-emerald-400/20 via-emerald-300/5 to-transparent text-emerald-300 border-emerald-400/20",
  cyan: "from-cyan-400/20 via-cyan-300/5 to-transparent text-cyan-300 border-cyan-400/20",
  violet: "from-violet-400/20 via-violet-300/5 to-transparent text-violet-300 border-violet-400/20",
  amber: "from-amber-400/20 via-amber-300/5 to-transparent text-amber-300 border-amber-400/20",
  rose: "from-rose-400/20 via-rose-300/5 to-transparent text-rose-300 border-rose-400/20",
} as const;

export function StatCard({ title, value, hint, tone = "emerald", icon: Icon = Activity }: {
  title: string; value: string | number; hint: string; tone?: keyof typeof tones; icon?: LucideIcon;
}) {
  return (
    <article className="panel group relative overflow-hidden rounded-[28px] p-5 lg:p-6">
      <div className={cn("absolute inset-x-0 top-0 h-24 bg-gradient-to-r blur-3xl", tones[tone])} />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-foreground/58">{title}</p>
          <p className="mt-4 text-3xl font-black tracking-tight text-foreground lg:text-4xl">{value}</p>
          <p className="mt-3 text-xs leading-6 text-foreground/52">{hint}</p>
        </div>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl border bg-foreground/5", tones[tone])}>
          <Icon size={20} />
        </div>
      </div>
      <div className="relative mt-5 flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-foreground/35">
        <Sparkles size={12} />
        Live insight
      </div>
    </article>
  );
}
