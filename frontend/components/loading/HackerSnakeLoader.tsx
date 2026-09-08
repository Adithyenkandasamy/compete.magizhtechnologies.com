"use client";

/**
 * Hacker Snake — the single loader for every non-authentication loading
 * state in Magizh.
 *
 * Visual language: a dark technical track with a gold segmented data signal
 * that visibly flows left→right (never a fake progress percentage), an
 * optional tick reticle above large/full snakes, a contextual message, and a
 * decorative telemetry readout (NODE / REQUEST / STATUS) for lg/full sizes.
 *
 * Sizes:
 *   sm    — buttons & small inline actions
 *   md    — cards, sections, modals
 *   lg    — page/data loading within a section
 *   full  — page-level loading (response required to render content)
 *
 * The flowing signal is pure CSS (lightweight) and always respects
 * prefers-reduced-motion: under reduced motion the segments stay static on
 * the track and the readable label/status remain.
 */

export type HackerSnakeSize = "sm" | "md" | "lg" | "full";

type HackerSnakeLoaderProps = {
  /** Contextual message, e.g. "SCANNING EVENTS". Visual-only for "sm". */
  message?: string;
  size?: HackerSnakeSize;
  /** false → decorative (aria-hidden); the parent owns the live region. */
  announce?: boolean;
  /**
   * Show the decorative telemetry readout (NODE / REQUEST / STATUS).
   * Defaults to true for lg/full, false for sm/md.
   */
  showTelemetry?: boolean;
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

/**
 * Deterministic decorative telemetry code — derived from the label text so it
 * never carries real secrets and always renders the same value per label.
 */
function telemetryCode(label: string): string {
  let hash = 0;
  for (let i = 0; i < label.length; i += 1) {
    hash = (hash * 31 + label.charCodeAt(i)) & 0xffff;
  }
  return hash.toString(16).toUpperCase().padStart(4, "0");
}

function telemetryNode(label: string): string {
  const slug = label
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 12);
  return `MZ-${slug || "CORE"}`;
}

export function HackerSnakeLoader({
  message,
  size = "md",
  announce = true,
  showTelemetry,
  className = "",
}: HackerSnakeLoaderProps) {
  const label = message?.trim();
  const showReticle = size === "lg" || size === "full";
  const showLabel = Boolean(label) && size !== "sm";
  const hasTelemetry =
    showTelemetry ?? (size === "lg" || size === "full");

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

      <div
        className={`magizh-snake-track ${trackHeights[size]} ${trackWidths[size]}`}
      >
        <div aria-hidden className="magizh-snake-flow" />
      </div>

      {hasTelemetry && (
        <div
          aria-hidden
          className="magizh-snake-telemetry mt-2.5 flex items-center gap-3 text-[9px]"
        >
          <span>NODE: {telemetryNode(label ?? "CORE")}</span>
          <span>REQ: {telemetryCode(label ?? "CORE")}</span>
          <span>STATUS: PROCESSING</span>
        </div>
      )}

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