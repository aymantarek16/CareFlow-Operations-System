import { LucideIcon, Activity, TrendingUp } from "lucide-react";
import { cn } from "@/lib/helpers";

type ToneStyles = {
  /** Strong accent color used for icon text + accent bar + dot. */
  accent: string;
  /** Background gradient inside the icon tile (strong). */
  iconBg: string;
  /** Ambient glow behind the icon tile. */
  iconGlow: string;
  /** Top-left colored halo inside the card. */
  topGlow: string;
  /** Border color of the card itself. */
  border: string;
  /** Progress / accent bar color. */
  bar: string;
  /** Small colored label pill tint. */
  pill: string;
};

const TONE_STYLES: Record<string, ToneStyles> = {
  emerald: {
    accent: "text-emerald-300",
    iconBg: "bg-gradient-to-br from-emerald-400 to-teal-500",
    iconGlow: "bg-emerald-400/30",
    topGlow: "from-emerald-400/25 via-emerald-400/5",
    border: "border-emerald-400/25",
    bar: "from-emerald-400 to-teal-500",
    pill: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
  },
  cyan: {
    accent: "text-cyan-300",
    iconBg: "bg-gradient-to-br from-cyan-400 to-sky-500",
    iconGlow: "bg-cyan-400/30",
    topGlow: "from-cyan-400/25 via-cyan-400/5",
    border: "border-cyan-400/25",
    bar: "from-cyan-400 to-sky-500",
    pill: "bg-cyan-400/10 text-cyan-300 ring-cyan-400/20",
  },
  violet: {
    accent: "text-violet-300",
    iconBg: "bg-gradient-to-br from-violet-400 to-fuchsia-500",
    iconGlow: "bg-violet-400/30",
    topGlow: "from-violet-400/25 via-violet-400/5",
    border: "border-violet-400/25",
    bar: "from-violet-400 to-fuchsia-500",
    pill: "bg-violet-400/10 text-violet-300 ring-violet-400/20",
  },
  amber: {
    accent: "text-amber-300",
    iconBg: "bg-gradient-to-br from-amber-400 to-orange-500",
    iconGlow: "bg-amber-400/30",
    topGlow: "from-amber-400/25 via-amber-400/5",
    border: "border-amber-400/25",
    bar: "from-amber-400 to-orange-500",
    pill: "bg-amber-400/10 text-amber-300 ring-amber-400/20",
  },
  rose: {
    accent: "text-rose-300",
    iconBg: "bg-gradient-to-br from-rose-400 to-pink-500",
    iconGlow: "bg-rose-400/30",
    topGlow: "from-rose-400/25 via-rose-400/5",
    border: "border-rose-400/25",
    bar: "from-rose-400 to-pink-500",
    pill: "bg-rose-400/10 text-rose-300 ring-rose-400/20",
  },
};

export type StatTone = keyof typeof TONE_STYLES;

export function StatCard({
  title,
  value,
  hint,
  tone = "emerald",
  icon: Icon = Activity,
  badge,
}: {
  title: string;
  value: string | number;
  hint: string;
  tone?: StatTone;
  icon?: LucideIcon;
  /** Optional small pill label (e.g. "اليوم"، "زيادة"). */
  badge?: string;
}) {
  const t = TONE_STYLES[tone] ?? TONE_STYLES.emerald;

  return (
    <article
      className={cn(
        "group relative isolate overflow-hidden rounded-[24px] border p-5 lg:p-6",
        "bg-[linear-gradient(160deg,rgba(11,22,34,0.98)_0%,rgba(6,12,20,1)_100%)]",
        "shadow-[0_12px_32px_-12px_rgba(0,0,0,0.5)]",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.55)]",
        t.border,
      )}
    >
      {/* Top accent bar — strong tone color so each card is instantly identifiable */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r",
          t.bar,
        )}
      />

      {/* Soft colored glow in the corner */}
      <div
        className={cn(
          "pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full blur-3xl opacity-40",
          t.iconGlow,
        )}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Title row with small tone dot */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-block h-1.5 w-1.5 rounded-full",
                t.iconBg,
              )}
            />
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/55">
              {title}
            </p>
            {badge && (
              <span
                className={cn(
                  "ms-auto rounded-full px-2 py-0.5 text-[10px] font-bold ring-1",
                  t.pill,
                )}
              >
                {badge}
              </span>
            )}
          </div>

          {/* Value */}
          <p
            className={cn(
              "mt-3 text-4xl font-black leading-none tracking-tight text-white lg:text-[42px]",
            )}
          >
            {value}
          </p>

          {/* Hint */}
          <div className="mt-4 flex items-center gap-1.5 text-xs text-foreground/55">
            <TrendingUp size={13} className={t.accent} />
            <p className="truncate leading-5">{hint}</p>
          </div>
        </div>

        {/* Icon tile — big, colored, high-contrast */}
        <div className="relative shrink-0">
          <div
            className={cn(
              "pointer-events-none absolute inset-0 rounded-2xl blur-xl opacity-60",
              t.iconGlow,
            )}
          />
          <div
            className={cn(
              "relative flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg",
              "ring-1 ring-white/15",
              "transition-transform duration-300 group-hover:scale-105",
              t.iconBg,
            )}
          >
            <Icon size={24} strokeWidth={2.25} />
          </div>
        </div>
      </div>

      {/* Bottom animated accent line */}
      <div className="relative mt-5 h-[2px] w-full overflow-hidden rounded-full bg-white/5">
        <div
          className={cn(
            "h-full w-12 bg-gradient-to-r transition-[width] duration-500 group-hover:w-full",
            t.bar,
          )}
        />
      </div>
    </article>
  );
}
