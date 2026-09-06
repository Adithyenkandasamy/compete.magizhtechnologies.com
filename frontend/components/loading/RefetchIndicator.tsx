type RefetchIndicatorProps = {
  active: boolean;
  label?: string;
  className?: string;
};

/**
 * Subtle background-refresh indicator.
 *
 * Used on TanStack Query pages where a background refetch is running: the
 * existing content stays visible and this small pill shows "Updating…"
 * instead of replacing content with a full-page loader.
 */
export function RefetchIndicator({
  active,
  label = "Updating",
  className = "",
}: RefetchIndicatorProps) {
  if (!active) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className={`inline-flex items-center gap-2 rounded border border-[#252525] bg-[#0D0D0F] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.15em] text-[#A1A1A1] ${className}`}
    >
      <span className="magizh-pulse-dot text-[#D4AF37]" aria-hidden />
      {label}
    </div>
  );
}