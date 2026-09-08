import { Skeleton } from "./Skeleton";
import {
  HackerSnakeLoader,
  type HackerSnakeSize,
} from "./HackerSnakeLoader";

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

const snakeSizes: Record<
  NonNullable<PageLoaderProps["variant"]>,
  HackerSnakeSize
> = {
  page: "full",
  section: "lg",
  inline: "sm",
};

/**
 * Branded page/section loading state — renders the Magizh Hacker Snake at
 * the correct scale for the context. Used by every page-level TanStack
 * Query fetch; disappears as soon as the actual data arrives.
 *
 * This is the Hacker Snake family; never a Circular HUD (authentic‑only).
 */
export function PageLoader({
  label = "loading",
  variant = "page",
  className = "",
}: PageLoaderProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center ${wrapperClasses[variant]} ${className}`}
    >
      {variant === "page" && (
        <p className="magizh-kicker mb-6 text-xs font-semibold uppercase tracking-[0.35em] text-[#F5F3ED]">
          MAGIZH
        </p>
      )}

      <HackerSnakeLoader size={snakeSizes[variant]} message={label} />
    </div>
  );
}

type BlockLoaderProps = {
  count?: number;
  className?: string;
};

/**
 * Generic set of static reserved blocks used when loading a grid of cards,
 * so the real cards swap in without layout shift. (Static scaffold only —
 * the loading signal itself comes from the Hacker Snake family.)
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