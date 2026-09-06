import { Skeleton } from "./Skeleton";

type DashboardSkeletonProps = {
  /** Toggles between the student and admin-ish dashboard shapes. */
  variant?: "student" | "admin";
  /** Number of stat cards to render. */
  statItems?: number;
};

const getStatItems = (variant: "student" | "admin") =>
  variant === "admin" ? 6 : 3;

/**
 * Loading layout for dashboards.
 *
 * Represents the header, a row of stat cards, and block placeholders for
 * the main content sections that are loading, so the dashboard never shows
 * a blank screen while the API request is pending.
 */
export function DashboardSkeleton({
  variant = "student",
  statItems,
}: DashboardSkeletonProps) {
  const stats = statItems ?? getStatItems(variant);

  return (
    <div aria-hidden>
      {/* Header */}
      <div className="mb-12 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-lg">
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="mt-4 h-9 w-72" />
          <Skeleton className="mt-3 h-4 w-96 max-w-full" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>

        <Skeleton className="h-12 w-32" />
      </div>

      {/* Stats */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: stats }).map((_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>

      {/* Content blocks */}
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}