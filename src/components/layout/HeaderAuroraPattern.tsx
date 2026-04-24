import { motion } from "framer-motion";
import { cn } from "@/lib/helpers";

/**
 * HeaderAuroraPattern
 * -------------------
 * A minimal "medical grid" decorative layer for page headers. Designed
 * for professional medical / SaaS dashboards — organized, clean, almost
 * static. Never competes with the heading text.
 *
 * Composition (back → front):
 *   1. A single soft radial glow in the corner (very low opacity, slow pulse).
 *   2. A precise line grid (2 orthogonal line sets) in the same tone.
 *   3. A sparse dot lattice over the grid intersections to add depth.
 *   4. A subtle highlight stripe that drifts horizontally very slowly
 *      across the grid, suggesting a "scan" without being distracting.
 *
 * Confined to the start-edge of the container via a horizontal mask so
 * the grid fades to transparent by the middle of the header.
 *
 * Props
 * -----
 * - className    extra classes for the wrapper
 * - intensity    "soft" (default) | "medium" — overall opacity scaler
 * - color        "emerald" | "cyan" | "mixed" (default)
 *
 * Usage
 * -----
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

const PALETTE: Record<ColorScheme, { line: string; dot: string; glow: string; scan: string }> = {
  emerald: {
    line: "rgba(52,211,153,1)",
    dot:  "rgba(110,231,183,1)",
    glow: "rgba(52,211,153,0.22)",
    scan: "rgba(110,231,183,0.12)",
  },
  cyan: {
    line: "rgba(34,211,238,1)",
    dot:  "rgba(103,232,249,1)",
    glow: "rgba(34,211,238,0.22)",
    scan: "rgba(103,232,249,0.12)",
  },
  mixed: {
    line: "rgba(52,211,153,1)",
    dot:  "rgba(103,232,249,1)",
    glow: "rgba(52,211,153,0.2)",
    scan: "rgba(103,232,249,0.12)",
  },
};

// Overall opacity ceiling per intensity — keep everything very subtle.
const MULT: Record<Intensity, number> = { soft: 1, medium: 1.45 };

export function HeaderAuroraPattern({
  className,
  intensity = "soft",
  color = "mixed",
}: HeaderAuroraPatternProps) {
  const p = PALETTE[color];
  const k = MULT[intensity];

  // Per-layer opacities — stay inside 0.03–0.1 range the brief asks for.
  const op = {
    grid: 0.07 * k, // 0.07 soft / 0.10 medium
    dots: 0.12 * k, // tiny dots, slightly more visible but still faint
    glow: 0.55 * k, // only the radial gradient inside — the fill is already 0.22 alpha
    scan: 0.7  * k,
  };

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 select-none overflow-hidden",
        className,
      )}
      style={{
        // Fade the whole pattern out by ~60% width so text on the other
        // side stays perfectly readable.
        WebkitMaskImage:
          "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 25%, rgba(0,0,0,0.45) 58%, rgba(0,0,0,0) 100%)",
        maskImage:
          "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 25%, rgba(0,0,0,0.45) 58%, rgba(0,0,0,0) 100%)",
      }}
    >
      {/* 1 — breathing corner glow -------------------------------------- */}
      <motion.div
        className="absolute -top-24 -left-28 h-[460px] w-[460px] rounded-full blur-[90px]"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${p.glow}, transparent 65%)`,
          willChange: "opacity, transform",
        }}
        initial={{ opacity: 0.35 * k, scale: 1 }}
        animate={{
          opacity: [0.3 * k, op.glow * 0.75, 0.3 * k],
          scale: [1, 1.03, 1],
        }}
        transition={{ duration: 12, ease: "easeInOut", repeat: Infinity }}
      />

      {/* 2 — line grid --------------------------------------------------- */}
      <div
        className="absolute inset-0"
        style={{
          opacity: op.grid,
          backgroundImage: `
            linear-gradient(to right, ${p.line} 1px, transparent 1px),
            linear-gradient(to bottom, ${p.line} 1px, transparent 1px)
          `,
          backgroundSize: "44px 44px, 44px 44px",
          backgroundPosition: "0 0, 0 0",
        }}
      />

      {/* 3 — dot lattice over the grid intersections --------------------- */}
      <div
        className="absolute inset-0"
        style={{
          opacity: op.dots,
          backgroundImage: `radial-gradient(${p.dot} 1px, transparent 1.4px)`,
          backgroundSize: "44px 44px",
          backgroundPosition: "0 0",
        }}
      />

      {/* 4 — slow horizontal scan sheen --------------------------------- */}
      <motion.div
        className="absolute inset-y-0 -left-1/4 w-1/2"
        style={{
          background: `linear-gradient(100deg, transparent 0%, ${p.scan} 50%, transparent 100%)`,
          filter: "blur(18px)",
          willChange: "transform, opacity",
        }}
        initial={{ x: "-20%", opacity: 0 }}
        animate={{
          x: ["-20%", "85%", "-20%"],
          opacity: [0, op.scan, 0],
        }}
        transition={{ duration: 22, ease: "easeInOut", repeat: Infinity }}
      />
    </div>
  );
}

export default HeaderAuroraPattern;
