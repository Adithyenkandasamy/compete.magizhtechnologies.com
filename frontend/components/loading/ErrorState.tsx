type ErrorStateProps = {
  title?: string;
  message?: string;
  /** Optional action (e.g. call the query's refetch / loader again). */
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

/**
 * Branded error panel.
 *
 * Loading always needs an error counterpart so the UI never stays stuck on
 * "Loading...". This renders a clear failure state with an optional retry
 * that wires back into the existing fetch/query mechanism.
 */
export function ErrorState({
  title = "Unable to load this content.",
  message,
  onRetry,
  retryLabel = "Try Again",
  className = "",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`rounded border border-[#C75C5C]/40 bg-[#C75C5C]/10 px-6 py-8 text-center ${className}`}
    >
      <p className="magizh-kicker text-[10px] font-semibold uppercase tracking-[0.3em] text-[#C75C5C]">
        Error
      </p>

      <p className="magizh-heading mt-3 text-xl font-bold text-[#F5F3ED]">
        {title}
      </p>

      {message && (
        <p className="magizh-muted mx-auto mt-2 max-w-md text-sm leading-6">
          {message}
        </p>
      )}

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center justify-center rounded border border-[#252525] px-4 py-2 text-sm font-semibold text-[#D4AF37] transition-colors hover:border-[#D4AF37]"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}