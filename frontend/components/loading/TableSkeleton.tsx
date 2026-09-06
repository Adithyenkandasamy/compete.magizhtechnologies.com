import { Skeleton } from "./Skeleton";

type TableSkeletonProps = {
  rows?: number;
  /** Approximate number of columns; matches the source table's columns. */
  columns?: number;
};

/**
 * Loading placeholder for data tables (admin users, registrations, teams,
 * submissions, judges, evaluations, certificates, activity logs, ...).
 *
 * Reproduces the standard Magizh table shell — bordered container, header
 * row, then skeleton cells — so the real table swaps in without jump.
 */
export function TableSkeleton({
  rows = 6,
  columns = 5,
}: TableSkeletonProps) {
  return (
    <div
      aria-hidden
      className="overflow-hidden rounded-lg border border-[#252525] bg-[#0D0D0F]"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#252525]">
              {Array.from({ length: columns }).map((_, columnIndex) => (
                <th
                  key={columnIndex}
                  className="px-5 py-4"
                >
                  <Skeleton className="h-2.5 w-16" />
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-[#252525] last:border-b-0"
              >
                {Array.from({ length: columns }).map((_, columnIndex) => (
                  <td key={columnIndex} className="px-5 py-5">
                    <Skeleton
                      className={`h-4 ${columnIndex === 0 ? "w-24" : "w-20"}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}