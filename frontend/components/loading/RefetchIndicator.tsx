import { HackerSnakeLoader } from "./HackerSnakeLoader";

type RefetchIndicatorProps = {
  active: boolean;
  label?: string;
  className?: string;
};

/**
 * Background-refresh indicator (Hacker Snake, small).
 *
 * Used on TanStack Query pages where a background refetch is running: the
 * existing content stays visible and this small pill shows a flowing snake
 * with "Updating…" instead of replacing content with a full-page loader.
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
      className={`inline-flex items-center gap-2 rounded border border-[#252525] bg-[#0D0D0F] px-3 py-1.5 ${className}`}
    >
      <HackerSnakeLoader size="sm" announce={false} />
      <span className="text-xs font-medium uppercase tracking-[0.15em] text-[#A1A1A1]">
        {label}
      </span>
    </div>
  );
}