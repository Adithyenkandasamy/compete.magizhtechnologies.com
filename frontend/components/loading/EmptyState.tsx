import { APP_NAME } from "@/lib/constants";

type EmptyStateProps = {
  kicker?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
};

/**
 * Branded empty state, visually distinct from Loading, Error, and data.
 *
 * Empty is NOT "no events while the API is still loading" — this component
 * should only render once the request has resolved with zero results.
 */
export function EmptyState({
  kicker = APP_NAME,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`rounded border border-[#252525] bg-[#0D0D0F] p-10 text-center ${className}`}
    >
      <p className="magizh-kicker magizh-gold text-[10px] font-semibold uppercase tracking-[0.3em]">
        {kicker}
      </p>

      <h3 className="magizh-heading mt-3 text-2xl font-bold text-[#F5F3ED]">
        {title}
      </h3>

      {description && (
        <p className="magizh-muted mx-auto mt-3 max-w-lg leading-7">
          {description}
        </p>
      )}

      {(actionLabel || actionHref) && (
        <div className="mt-6">
          {actionHref ? (
            <a
              href={actionHref}
              className="magizh-button"
            >
              {actionLabel}
            </a>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="magizh-button"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}