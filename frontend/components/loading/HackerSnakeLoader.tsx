"use client";

/**
 * MagizhLoader — clean, professional page-level spinner.
 * Replaces HackerSnakeLoader for all non-auth loading states.
 * 
 * Visual: slim pulsing gold ring + "M" monogram, no hacker text.
 */

export type HackerSnakeSize = "sm" | "md" | "lg" | "full";

type HackerSnakeLoaderProps = {
  message?: string;
  size?: HackerSnakeSize;
  announce?: boolean;
  showTelemetry?: boolean;
  className?: string;
};

const sizeMap: Record<HackerSnakeSize, { ring: string; text: string; wrapper: string }> = {
  sm: { ring: "h-5 w-5 border-2", text: "hidden", wrapper: "" },
  md: { ring: "h-8 w-8 border-2", text: "text-[10px] mt-3", wrapper: "" },
  lg: { ring: "h-10 w-10 border-2", text: "text-[11px] mt-4", wrapper: "min-h-[30vh]" },
  full: { ring: "h-12 w-12 border-[3px]", text: "text-xs mt-5", wrapper: "min-h-[55vh]" },
};

export function HackerSnakeLoader({
  message,
  size = "md",
  announce = true,
  className = "",
}: HackerSnakeLoaderProps) {
  const { ring, text, wrapper } = sizeMap[size];

  return (
    <div
      role={announce ? "status" : undefined}
      aria-live={announce ? "polite" : undefined}
      aria-busy={announce ? "true" : undefined}
      aria-hidden={announce ? undefined : "true"}
      className={`flex flex-col items-center justify-center ${wrapper} ${className}`}
    >
      {/* Clean spinner ring */}
      <div
        aria-hidden
        className={`${ring} rounded-full border-[#252525] border-t-[#D4AF37] animate-spin`}
      />

      {/* Optional label */}
      {message && size !== "sm" && (
        <p
          className={`${text} font-mono uppercase tracking-[0.2em] text-[#A1A1A1] text-center`}
        >
          {message}
        </p>
      )}
    </div>
  );
}