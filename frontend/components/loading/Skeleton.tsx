type SkeletonProps = {
  className?: string;
};

/**
 * Base skeletal placeholder.
 *
 * Renders a dark block that pulses subtly until real content replaces it.
 * Use along with width/height classes at the call site so the reserved
 * space approximately matches the final content (prevents layout shift).
 */
export function Skeleton({ className = "" }: SkeletonProps) {
  return <div aria-hidden className={`magizh-skeleton ${className}`} />;
}

type SkeletonTextProps = {
  lines?: number;
  className?: string;
};

/**
 * Convenience wrapper: a stack of text-height skeleton lines.
 * Approximates a paragraph so content doesn't jump when it loads.
 */
export function SkeletonText({
  lines = 3,
  className = "",
}: SkeletonTextProps) {
  return (
    <div aria-hidden className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={index === lines - 1 ? "h-3.5 w-3/5" : "h-3.5 w-full"}
        />
      ))}
    </div>
  );
}

type SkeletonCircleProps = {
  size?: number;
  className?: string;
};

export function SkeletonCircle({
  size = 56,
  className = "",
}: SkeletonCircleProps) {
  return (
    <div
      aria-hidden
      style={{ width: size, height: size }}
      className={`magizh-skeleton rounded-full ${className}`}
    />
  );
}