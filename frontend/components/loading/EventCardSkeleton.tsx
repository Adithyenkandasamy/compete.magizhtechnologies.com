import { Skeleton } from "./Skeleton";

type EventCardSkeletonProps = {
  count?: number;
  className?: string;
};

/**
 * Loading placeholder that mirrors the EventCard layout so real cards
 * swap in without layout shift:
 *   [ banner             ]
 *   EVENT TYPE   mode
 *   [ title       ]
 *   [ description ]
 *   [ dates       ]
 *   [ button       ]
 */
export function EventCardSkeleton({
  count = 3,
  className = "",
}: EventCardSkeletonProps) {
  return (
    <div
      aria-hidden
      className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${className}`}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-lg border border-[#252525] bg-[#0D0D0F]"
        >
          <Skeleton className="aspect-[16/8] rounded-none border-0 border-b border-[#252525]" />

          <div className="p-6">
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3.5 w-16" />
            </div>

            <Skeleton className="mt-4 h-6 w-4/5" />

            <div className="mt-4 space-y-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-11/12" />
            </div>

            <div className="mt-5 space-y-2">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-3.5 w-1/2" />
            </div>

            <Skeleton className="mt-6 h-4 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}