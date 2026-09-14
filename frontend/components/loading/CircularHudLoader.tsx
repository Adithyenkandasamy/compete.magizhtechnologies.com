"use client";

/**
 * CircularHudLoader — replaced with a clean professional auth loader.
 * Used only during login / logout / session restore.
 * 
 * Visual: M monogram + slim animated ring. No sci-fi particles or stage labels.
 */

export type CircularHudMode = "login" | "logout" | "session";

type CircularHudLoaderProps = {
  mode?: CircularHudMode;
  message?: string;
  fullScreen?: boolean;
  className?: string;
};

const modeLabels: Record<CircularHudMode, string> = {
  login: "Signing in...",
  logout: "Signing out...",
  session: "Restoring session...",
};

export function CircularHudLoader({
  mode = "login",
  message,
  fullScreen = false,
  className = "",
}: CircularHudLoaderProps) {
  const label = message || modeLabels[mode];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`flex flex-col items-center justify-center gap-6 ${
        fullScreen ? "fixed inset-0 z-[100] bg-black" : "py-10"
      } ${className}`}
    >
      {/* Monogram + spinner */}
      <div className="relative flex h-20 w-20 items-center justify-center">
        {/* Outer spinning ring */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-full border-[3px] border-[#252525] border-t-[#D4AF37] animate-spin"
        />
        {/* Static secondary ring */}
        <div
          aria-hidden
          className="absolute inset-2 rounded-full border border-[#D4AF37]/20"
        />
        {/* M monogram */}
        <span className="font-serif text-2xl font-bold text-[#F5F3ED]">M</span>
      </div>

      {/* Status text */}
      <div className="text-center">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-[#A1A1A1]">
          {label}
        </p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-[#D4AF37]/50">
          Magizh Technologies
        </p>
      </div>
    </div>
  );
}