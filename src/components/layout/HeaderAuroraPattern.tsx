import { motion, type Variants } from "framer-motion";
import { useMemo } from "react";
import { cn } from "@/lib/helpers";

/**
 * HeaderAuroraPattern
 * -------------------
 * A reusable decorative background layer for page headers.
 *
 * Renders soft aurora-like light waves, a handful of twinkling particles,
 * and a subtle perspective grid on the **left-most ~40%** of the header.
 * The layer fades gracefully to transparent by the middle so it never
 * competes with the header text.
 *
 * Usage
 * -----
 * <header className="relative overflow-hidden">
 *   <HeaderAuroraPattern />
 *   <div className="relative z-10">...</div>
 * </header>
 *
 * Props
 * -----
 * - className  additional classes for the wrapper
 * - intensity  "soft" (default) | "medium" — global opacity scaling
 * - color      "emerald" | "cyan" | "mixed" (default)
 *
 * Notes
 * -----
 * - Pointer-events are disabled; the pattern never intercepts clicks.
 * - Fine details (particles, grid) are hidden on small screens for perf.
 * - All animations are infinite, slow, and easing-driven. `prefers-reduced-motion`
 *   is respected by framer-motion automatically when the user enables it.
 */
type Intensity = "soft" | "medium";
type ColorScheme = "emerald" | "cyan" | "mixed";

export interface HeaderAuroraPatternProps {
  className?: string;
  intensity?: Intensity;
  color?: ColorScheme;
}

const PALETTES: Record<ColorScheme, { a: string; b: string; c: string }> = {
  emerald: { a: "#34d399", b: "#10b981", c: "#6ee7b7" },
  cyan:    { a: "#22d3ee", b: "#0891b2", c: "#67e8f9" },
  mixed:   { a: "#34d399", b: "#22d3ee", c: "#6ee7b7" },
};

const INTENSITY_MULT: Record<Intensity, number> = {
  soft: 0.7,
  medium: 1,
};

// Stable particle layout (computed once per color/intensity) ------------------
function useParticles(seed: number, count: number) {
  return useMemo(() => {
    // Simple deterministic pseudo-random so SSR & client match.
    let s = seed;
    const rnd = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      // confine horizontally to the left 40% of the header
      x: rnd() * 40,
      y: rnd() * 100,
      size: 1 + rnd() * 1.8,
      delay: rnd() * 4,
      duration: 2.6 + rnd() * 2.8,
    }));
  }, [seed, count]);
}

const waveVariants: Variants = {
  animate: {
    // slow, gentle floating loop
    transform: [
      "translate3d(0px, 0px, 0)",
      "translate3d(8px, -6px, 0)",
      "translate3d(-4px, 4px, 0)",
      "translate3d(0px, 0px, 0)",
    ],
    transition: {
      duration: 14,
      ease: "easeInOut",
      repeat: Infinity,
    },
  },
};

const glowVariants: Variants = {
  animate: {
    opacity: [0.32, 0.46, 0.32],
    scale: [1, 1.04, 1],
    transition: {
      duration: 8,
      ease: "easeInOut",
      repeat: Infinity,
    },
  },
};

export function HeaderAuroraPattern({
  className,
  intensity = "soft",
  color = "mixed",
}: HeaderAuroraPatternProps) {
  const palette = PALETTES[color];
  const mult = INTENSITY_MULT[intensity];
  const particles = useParticles(42, 14);

  // Scaled opacity constants — keep every layer subtle.
  const op = {
    glow: 0.32 * mult,
    wave1: 0.28 * mult,
    wave2: 0.22 * mult,
    wave3: 0.18 * mult,
    grid: 0.14 * mult,
    particle: 0.55 * mult,
  };

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 select-none",
        className,
      )}
      style={{
        // Limit the pattern to the left ~42% of the header and fade it out
        // toward the middle so text/content on the right stays readable.
        WebkitMaskImage:
          "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 30%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0) 100%)",
        maskImage:
          "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 30%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0) 100%)",
      }}
    >
      {/* Ambient corner glow -------------------------------------------- */}
      <motion.div
        className="absolute -top-16 -left-16 h-[360px] w-[360px] rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${palette.a}55, ${palette.b}22 45%, transparent 70%)`,
          opacity: op.glow,
        }}
        variants={glowVariants}
        animate="animate"
      />

      {/* Aurora waves (SVG) --------------------------------------------- */}
      <motion.svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 800 240"
        preserveAspectRatio="none"
        variants={waveVariants}
        animate="animate"
      >
        <defs>
          <linearGradient id="auroraGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={palette.a} stopOpacity="0.85" />
            <stop offset="55%"  stopColor={palette.b} stopOpacity="0.55" />
            <stop offset="100%" stopColor={palette.c} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="auroraGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={palette.c} stopOpacity="0.7" />
            <stop offset="60%"  stopColor={palette.a} stopOpacity="0.35" />
            <stop offset="100%" stopColor={palette.b} stopOpacity="0" />
          </linearGradient>
          <filter id="auroraBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        <g filter="url(#auroraBlur)">
          <path
            d="M0,80 C90,40 180,110 270,70 C360,30 430,90 520,60 L520,100 C430,140 360,80 270,120 C180,160 90,100 0,140 Z"
            fill="url(#auroraGrad1)"
            opacity={op.wave1}
          />
          <path
            d="M0,140 C70,100 160,170 240,130 C320,90 390,150 470,120 L470,160 C390,200 320,140 240,180 C160,220 70,160 0,200 Z"
            fill="url(#auroraGrad2)"
            opacity={op.wave2}
          />
          <path
            d="M0,40 C80,10 160,70 240,30 L240,70 C160,110 80,50 0,80 Z"
            fill="url(#auroraGrad1)"
            opacity={op.wave3}
          />
        </g>
      </motion.svg>

      {/* Grid perspective (bottom) -------------------------------------- */}
      <div
        className="absolute inset-x-0 bottom-0 hidden h-28 sm:block"
        style={{
          opacity: op.grid,
          backgroundImage: `
            linear-gradient(${palette.a}80 1px, transparent 1px),
            linear-gradient(90deg, ${palette.a}80 1px, transparent 1px)
          `,
          backgroundSize: "40px 24px, 40px 24px",
          transform: "perspective(360px) rotateX(58deg)",
          transformOrigin: "bottom center",
          WebkitMaskImage:
            "radial-gradient(ellipse at 15% 100%, #000 0%, transparent 65%)",
          maskImage:
            "radial-gradient(ellipse at 15% 100%, #000 0%, transparent 65%)",
        }}
      />

      {/* Particles ------------------------------------------------------ */}
      <div className="absolute inset-0 hidden sm:block">
        {particles.map((p) => (
          <motion.span
            key={p.id}
            className="absolute rounded-full"
            style={{
              left:  `${p.x}%`,
              top:   `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: palette.c,
              boxShadow: `0 0 ${p.size * 3}px ${palette.a}`,
            }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{
              opacity: [0, op.particle, 0],
              scale: [0.6, 1, 0.6],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
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
