"use client";

/**
 * Circular HUD — the ONLY loader used for authentication flows.
 *
 *   <CircularHudLoader mode="login" fullScreen />
 *   <CircularHudLoader mode="logout" fullScreen />
 *   <CircularHudLoader mode="session" />
 *
 * Modes carry the canonical Magizh authentication lifecycle copy:
 *   login   → banner "AUTHENTICATING..."   stages CONNECTING TO CORE /
 *             VERIFYING CREDENTIALS / ESTABLISHING SECURE SESSION
 *   logout  → banner "SIGNING OUT..."      stages TERMINATING SESSION /
 *             CLOSING SECURE CHANNEL / CLEARING SESSION STATE
 *   session → banner "VERIFYING SESSION..." stages VERIFYING SESSION /
 *             RESTORING IDENTITY / CHECKING ACCESS
 *
 * A cinematic composition: layered rotating segmented rings, a counter-
 * rotating secondary ring, inner tick ring, a slow scanning sweep, drifting
 * gold particles, a central emissive "M", a status banner, and stage
 * indicators. Indeterminate by design — no fake percentages, no timers; the
 * stages march via pure CSS so reduced-motion collapses to a static label.
 *
 * Everything decorative is aria-hidden; the status announcement comes from
 * the readable banner. Rings/particles are pure CSS/SVG (lightweight).
 */

export type CircularHudMode = "login" | "logout" | "session";

type HUDStageDef = { banner: string; labels: readonly string[] };

const HUD_PRESETS: Record<CircularHudMode, HUDStageDef> = {
  login: {
    banner: "AUTHENTICATING...",
    labels: [
      "CONNECTING TO CORE",
      "VERIFYING CREDENTIALS",
      "ESTABLISHING SECURE SESSION",
    ],
  },
  logout: {
    banner: "SIGNING OUT...",
    labels: [
      "TERMINATING SESSION",
      "CLOSING SECURE CHANNEL",
      "CLEARING SESSION STATE",
    ],
  },
  session: {
    banner: "VERIFYING SESSION...",
    labels: ["VERIFYING SESSION", "RESTORING IDENTITY", "CHECKING ACCESS"],
  },
};

/** Deterministic particle field (fixed offsets, no randomness/hydration risk). */
const PARTICLES = [
  { left: "12%", top: "22%", delay: "0s", size: 3 },
  { left: "78%", top: "16%", delay: "0.8s", size: 2 },
  { left: "20%", top: "72%", delay: "1.6s", size: 2 },
  { left: "72%", top: "68%", delay: "0.4s", size: 3 },
  { left: "86%", top: "42%", delay: "2.2s", size: 2 },
  { left: "8%", top: "46%", delay: "1.2s", size: 2 },
] as const;

type CircularHudLoaderProps = {
  /** Auth-lifecycle mode; drives banner + stage labels. */
  mode?: CircularHudMode;
  /** Overrides the banner text (default from the mode preset). */
  message?: string;
  /** true → fixed full-screen black overlay; false → inline centered block. */
  fullScreen?: boolean;
  className?: string;
};

export function CircularHudLoader({
  mode = "login",
  message,
  fullScreen = false,
  className = "",
}: CircularHudLoaderProps) {
  const preset = HUD_PRESETS[mode];
  const banner = message?.trim() || preset.banner;
  const labels = preset.labels;

  return (
    <div
      data-testid="circular-hud"
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`flex flex-col items-center justify-center ${
        fullScreen ? "fixed inset-0 z-[100] overflow-hidden bg-black" : "py-10"
      } ${className}`}
    >
      {fullScreen && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {PARTICLES.map((p, index) => (
            <span
              key={index}
              className="magizh-hud-particle"
              style={{
                height: p.size,
                width: p.size,
                left: p.left,
                top: p.top,
                animationDelay: p.delay,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative h-44 w-44 md:h-56 md:w-56">
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
            r="74"
            stroke="rgba(212,175,55,0.12)"
            strokeWidth="1"
          />
          <circle
            cx="80"
            cy="80"
            r="68"
            stroke="rgba(37,37,37,0.95)"
            strokeWidth="1"
            strokeDasharray="1 4"
          />

          {/* rotating layered segmented signal ring */}
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

          {/* secondary ring, counter-rotating */}
          <g className="magizh-hud-reverse">
            <circle
              cx="80"
              cy="80"
              r="54"
              stroke="rgba(229,192,74,0.55)"
              strokeWidth="1.5"
              strokeDasharray="20 12"
              strokeLinecap="round"
            />
          </g>

          {/* inner technical tick ring */}
          <g className="magizh-hud-spin-slow">
            <circle
              cx="80"
              cy="80"
              r="46"
              stroke="rgba(212,175,55,0.8)"
              strokeWidth="1.5"
              strokeDasharray="1 5"
            />
          </g>

          {/* slow scanning sweep */}
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

        {/* central emissive monogram */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="magizh-heading magizh-hud-emissive text-4xl font-bold text-[#F5F3ED] md:text-5xl">
            M
          </span>
          <span className="magizh-kicker mt-1 text-[9px] font-semibold uppercase tracking-[0.35em] text-[#D4AF37]/80">
            MAGIZH
          </span>
        </div>
      </div>

      {/* status banner (the only thing announced) */}
      <div className="mt-8 text-center">
        <p className="magizh-mono text-xs font-semibold uppercase tracking-[0.3em] text-[#E5C04A] md:text-sm">
          {banner}
        </p>
        <p className="magizh-mono mt-2 text-[9px] uppercase tracking-[0.22em] text-[#D4AF37]/70">
          MZ-HUD // SECURE CHANNEL
        </p>
      </div>

      {/* stage indicators — pure-CSS march, never a fake percentage */}
      <ol
        aria-hidden="true"
        className="magizh-hud-stages mt-6 space-y-2 text-center"
      >
        {labels.map((label, index) => (
          <li
            key={label}
            className="magizh-hud-stage magizh-mono text-[9px] uppercase tracking-[0.22em] text-[#D4AF37]"
            style={{ animationDelay: `${index}s` }}
          >
            {label}
          </li>
        ))}
      </ol>
    </div>
  );
}