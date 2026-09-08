"use client";

/**
 * Hacker Snake — the single loader for every non-authentication loading
 * state in Magizh.
 *
 * Visual language: a gold segmented signal flows through a dark technical
 * track with a subtle scanning reticle — advanced-engineering / hacker
 * terminal, not a gaming spinner. Indeterminate by design: no fake
 * progress values are ever rendered.
 *
 * Sizes:
 *   sm    — buttons & small inline actions
 *   md    — cards, sections, modals
 *   lg    — page/data loading within a section
 *   full  — page-level loading (response required to render content)
 *
 * The animation is pure CSS (lightweight). It respects
 * prefers-reduced-motion: the flow stops and a static segmented track
 * remains as a clear indication.
 */

export type HackerSnakeSize = "sm" | "md" | "lg" | "full";

type HackerSnakeLoaderProps = {
  /** Contextual message, e.g. "SCANNING EVENTS". Visual-only for "sm". */
  message?: string;
  size?: HackerSnakeSize;
  /** false → decorative (aria-hidden); the parent owns the live region. */
  announce?: boolean;
  className?: string;
};

const trackWidths: Record<HackerSnakeSize, string> = {
  sm: "w-12",
  md: "w-36",
  lg: "w-64",
  full: "w-80",
};

const trackHeights: Record<HackerSnakeSize, string> = {
  sm: "h-[5px]",
  md: "h-1.5",
  lg: "h-2",
  full: "h-2.5",
};

const containerHeights: Record<HackerSnakeSize, string> = {
  sm: "",
  md: "",
  lg: "min-h-[30vh]",
  full: "min-h-[55vh]",
};

export function HackerSnakeLoader({
  message,
  size = "md",
  announce = true,
  className = "",
}: HackerSnakeLoaderProps) {
  const label = message?.trim();
  const showReticle = size === "lg" || size === "full";
  const showLabel = Boolean(label) && size !== "sm";

  return (
    <div
      data-testid="hacker-snake"
      role={announce ? "status" : undefined}
      aria-live={announce ? "polite" : undefined}
      aria-busy={announce ? "true" : undefined}
      aria-hidden={announce ? undefined : "true"}
      className={`flex flex-col items-center justify-center ${containerHeights[size]} ${className}`}
    >
      {showReticle && (
        <div
          aria-hidden
          className={`magizh-snake-ticks mb-2 h-2 ${trackWidths[size]}`}
        />
      )}

      <div className={`magizh-snake-track ${trackHeights[size]} ${trackWidths[size]}`}>
        <div className="magizh-snake-flow" aria-hidden />
        <div className="magizh-snake-scan" aria-hidden />
      </div>

      {showLabel && (
        <div className="mt-3 max-w-full text-center">
          <p className="magizh-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-[#A1A1A1]">
            {label}
          </p>
          {size === "full" && (
            <p className="magizh-mono mt-1.5 text-[9px] uppercase tracking-[0.2em] text-[#D4AF37]/60">
              MZ-TERM // ENGINE
            </p>
          )}
        </div>
      )}
    </div>
  );
}