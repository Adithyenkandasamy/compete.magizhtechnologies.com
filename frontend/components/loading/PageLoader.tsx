import { Skeleton } from "./Skeleton";

type PageLoaderProps = {
  label?: string;
  /** Layout context — controls vertical spacing and sizing. */
  variant?: "page" | "section" | "inline";
  className?: string;
};

const wrapperClasses: Record<
  NonNullable<PageLoaderProps["variant"]>,
  string
> = {
  page: "min-h-[60vh]",
  section: "min-h-[30vh]",
  inline: "",
};

/**
 * Branded Magizh loading indicator.
 *
 * Lightweight: "MAGIZH" wordmark, a thin gold line that travels across,
 * and a small muted label. No infinite flashy spinner. The loading state
 * disappears on its own as soon as the actual data arrives.
 *
 * Pass `aria-busy` is intentionally set here so assistive tech announces
 * pending state; keep the visible label for clarity.
 */
export function PageLoader({
  label = "loading",
  variant = "page",
  className = "",
}: PageLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`flex flex-col items-center justify-center ${wrapperClasses[variant]} ${className}`}
    >
      <div className="text-center">
        <p className="magizh-accent text-xs font-semibold uppercase tracking-[0.35em] text-[#F5F3ED]">
          MAGIZH
        </p>

        <div className="magizh-loader-line mx-auto mt-4 w-28 max-w-full" />

        <p className="magizh-muted magizh-accent mt-3 text-[10px] font-medium uppercase tracking-[0.3em]">
          {label}
        </p>
      </div>
    </div>
  );
}

type BlockLoaderProps = {
  count?: number;
  className?: string;
};

/**
 * Generic set of skeleton blocks used when loading a grid of cards.
 */
export function BlockLoader({ count = 3, className = "" }: BlockLoaderProps) {
  return (
    <div aria-hidden className={`grid gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-lg border border-[#252525] bg-[#0D0D0F]"
        >
          <Skeleton className="aspect-[16/8] rounded-none border-0 border-b border-[#252525]" />
          <div className="space-y-3 p-6">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="mt-3 h-3.5 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}