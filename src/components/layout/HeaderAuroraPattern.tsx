import { motion } from "framer-motion";
import { cn } from "@/lib/helpers";

/**
 * HeaderAuroraPattern
 * -------------------
 * A minimal, elegant decorative background for page headers. Designed to
 * suggest "modern medical tech" without competing with the content.
 *
 * Layers (from back to front):
 *   1. A single soft corner glow that slowly breathes.
 *   2. Two thin flowing light waves (smooth sine curves) that drift.
 *   3. A few tiny twinkling specks — optional, only on ≥ md screens.
 *
 * Everything is confined to the start-edge of the container (left in LTR,
 * right in RTL) via a horizontal mask that fades to transparent by the
 * middle, so the heading text on the opposite side always stays crisp.
 *
 * Usage:
 *   <header className="relative overflow-hidden">
 *     <HeaderAuroraPattern />
 *     <div className="relative z-10">…header content…</div>
 *   </header>
 */
type Intensity = "soft" | "medium";
type ColorScheme = "emerald" | "cyan" | "mixed";

export interface HeaderAuroraPatternProps {
  className?: string;
  intensity?: Intensity;
  color?: ColorScheme;
}

const PALETTE: Record<ColorScheme, { glow: string; line1: string; line2: string; spark: string }> = {
  emerald: {
    glow:  "rgba(52,211,153,0.35)",
    line1: "#34d399",
    line2: "#6ee7b7",
    spark: "#6ee7b7",
  },
  cyan: {
    glow:  "rgba(34,211,238,0.32)",
    line1: "#22d3ee",
    line2: "#67e8f9",
    spark: "#67e8f9",
  },
  mixed: {
    glow:  "rgba(52,211,153,0.32)",
    line1: "#34d399",
    line2: "#22d3ee",
    spark: "#6ee7b7",
  },
};

const MULT: Record<Intensity, number> = { soft: 0.75, medium: 1 };

// Deterministic tiny specks — stable between renders, no layout jitter.
const SPARKS = [
  { x: 8,  y: 28, delay: 0.0, duration: 4.5 },
  { x: 16, y: 68, delay: 1.2, duration: 5.2 },
  { x: 24, y: 20, delay: 2.0, duration: 4.0 },
  { x: 32, y: 58, delay: 0.6, duration: 5.8 },
  { x: 13, y: 85, delay: 2.8, duration: 4.8 },
];

export function HeaderAuroraPattern({
  className,
  intensity = "soft",
  color = "mixed",
}: HeaderAuroraPatternProps) {
  const p = PALETTE[color];
  const k = MULT[intensity];

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 select-none overflow-hidden",
        className,
      )}
      style={{
        // Confine the whole pattern to the start-edge ~42% and fade it out.
        // `mask-image` is inherited by every child, so each layer below
        // respects the fade without having to redeclare it.
        WebkitMaskImage:
          "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 28%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0) 100%)",
        maskImage:
          "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 28%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0) 100%)",
      }}
    >
      {/* 1 — breathing corner glow -------------------------------------- */}
      <motion.div
        className="absolute -top-20 -left-24 h-[420px] w-[420px] rounded-full blur-[80px]"
        style={{
          background: `radial-gradient(circle at 35% 35%, ${p.glow}, transparent 65%)`,
          opacity: 0.5 * k,
          willChange: "opacity, transform",
        }}
        animate={{
          opacity: [0.35 * k, 0.55 * k, 0.35 * k],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 9,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />

      {/* 2 — flowing light waves (two thin smooth lines) ---------------- */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 800 240"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="auroraLine1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={p.line1} stopOpacity="0" />
            <stop offset="30%"  stopColor={p.line1} stopOpacity={0.9 * k} />
            <stop offset="70%"  stopColor={p.line2} stopOpacity={0.4 * k} />
            <stop offset="100%" stopColor={p.line2} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="auroraLine2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={p.line2} stopOpacity="0" />
            <stop offset="35%"  stopColor={p.line2} stopOpacity={0.7 * k} />
            <stop offset="75%"  stopColor={p.line1} stopOpacity={0.28 * k} />
            <stop offset="100%" stopColor={p.line1} stopOpacity="0" />
          </linearGradient>
          <filter id="auroraSoftBlur" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
        </defs>

        {/* Front line — travels top→bottom slowly */}
        <motion.path
          d="M0,110 C120,70 240,150 360,110 C480,70 580,130 700,100"
          fill="none"
          stroke="url(#auroraLine1)"
          strokeWidth="1.8"
          strokeLinecap="round"
          filter="url(#auroraSoftBlur)"
          animate={{
            d: [
              "M0,110 C120,70 240,150 360,110 C480,70 580,130 700,100",
              "M0,120 C120,90 240,130 360,100 C480,80 580,145 700,110",
              "M0,110 C120,70 240,150 360,110 C480,70 580,130 700,100",
            ],
          }}
          transition={{
            duration: 16,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />

        {/* Back line — wider arc, slower */}
        <motion.path
          d="M0,160 C140,120 280,200 420,150 C540,110 620,170 760,140"
          fill="none"
          stroke="url(#auroraLine2)"
          strokeWidth="1.2"
          strokeLinecap="round"
          filter="url(#auroraSoftBlur)"
          animate={{
            d: [
              "M0,160 C140,120 280,200 420,150 C540,110 620,170 760,140",
              "M0,155 C140,135 280,180 420,160 C540,130 620,180 760,150",
              "M0,160 C140,120 280,200 420,150 C540,110 620,170 760,140",
            ],
          }}
          transition={{
            duration: 20,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />
      </svg>

      {/* 3 — a handful of tiny specks ----------------------------------- */}
      <div className="absolute inset-0 hidden md:block">
        {SPARKS.map((s, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: 2,
              height: 2,
              backgroundColor: p.spark,
              boxShadow: `0 0 6px ${p.spark}`,
            }}
            animate={{ opacity: [0, 0.6 * k, 0], scale: [0.7, 1.1, 0.7] }}
            transition={{
              duration: s.duration,
              delay: s.delay,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default HeaderAuroraPattern;
