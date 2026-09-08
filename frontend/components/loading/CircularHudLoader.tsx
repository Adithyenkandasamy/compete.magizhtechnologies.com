"use client";

/**
 * Circular HUD — the ONLY loader used for authentication flows.
 *
 *   <CircularHudLoader message="AUTHENTICATING" fullScreen />
 *
 * Premium HUD treatment: rotating segmented gold rings, technical tick
 * marks, and a slow scanning segment around a central readout. Indeterminate
 * by design — no fake percentages.
 *
 * The rings are pure CSS/SVG (lightweight). Respects prefers-reduced-motion:
 * rotation stops, the static rings and the message remain as a clear
 * indication that authentication is pending.
 */

type CircularHudLoaderProps = {
  /** Contextual auth message, e.g. "AUTHENTICATING", "VERIFYING IDENTITY". */
  message?: string;
  /** true → fixed full-screen black overlay; false → inline centered block. */
  fullScreen?: boolean;
  className?: string;
};

export function CircularHudLoader({
  message = "AUTHENTICATING",
  fullScreen = false,
  className = "",
}: CircularHudLoaderProps) {
  const label = message.trim() || "AUTHENTICATING";

  return (
    <div
      data-testid="circular-hud"
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`flex flex-col items-center justify-center ${
        fullScreen ? "fixed inset-0 z-[100] bg-black" : "py-10"
      } ${className}`}
    >
      <div className="relative h-40 w-40 md:h-48 md:w-48">
        <svg
          viewBox="0 0 160 160"
          fill="none"
          aria-hidden="true"
          className="magizh-hud-glow h-full w-full"
        >
          {/* static anchor rings */}
          <circle
            cx="80"
            cy="80"
            r="72"
            stroke="rgba(212,175,55,0.14)"
            strokeWidth="1"
          />
          <circle
            cx="80"
            cy="80"
            r="66"
            stroke="rgba(37,37,37,0.9)"
            strokeWidth="1"
            strokeDasharray="1 4"
          />

          {/* rotating segmented signal ring */}
          <g className="magizh-hud-spin">
            <circle
              cx="80"
              cy="80"
              r="62"
              stroke="#D4AF37"
              strokeWidth="2"
              strokeDasharray="10 16"
              strokeLinecap="round"
            />
          </g>

          {/* technical tick marks */}
          <g className="magizh-hud-spin-slow">
            <circle
              cx="80"
              cy="80"
              r="54"
              stroke="rgba(229,192,74,0.65)"
              strokeWidth="1.5"
              strokeDasharray="1 5"
            />
          </g>

          {/* inner dashed ring, counter-rotating */}
          <g className="magizh-hud-reverse">
            <circle
              cx="80"
              cy="80"
              r="46"
              stroke="rgba(212,175,55,0.85)"
              strokeWidth="1.5"
              strokeDasharray="26 10"
              strokeLinecap="round"
            />
          </g>

          {/* scanning sweep */}
          <g className="magizh-hud-sweep">
            <circle
              cx="80"
              cy="80"
              r="62"
              stroke="#E5C04A"
              strokeWidth="2"
              strokeDasharray="110 302"
              strokeLinecap="round"
            />
          </g>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#F5F3ED] md:text-xs">
            {label}
          </p>
          <p className="magizh-mono mt-2 text-[9px] uppercase tracking-[0.22em] text-[#D4AF37]/70">
            MZ-HUD // SECURE CHANNEL
          </p>
        </div>
      </div>
    </div>
  );
}