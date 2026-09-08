"use client";

import { CircularHudLoader } from "./CircularHudLoader";
import { HackerSnakeLoader } from "./HackerSnakeLoader";

/**
 * Generic blocking overlay that uses one of the two Magizh loader families:
 *
 *   <LoadingOverlay open={mutation.isPending} variant="hud" message="AUTHENTICATING" />
 *
 *   variant="hud"    → Circular HUD (authentication operations only)
 *   variant="snake"  → Hacker Snake (everything else)
 *
 * Renders nothing when closed (no layout impact).
 */

type LoadingOverlayProps = {
  open: boolean;
  variant?: "hud" | "snake";
  message?: string;
  className?: string;
};

export function LoadingOverlay({
  open,
  variant = "snake",
  message,
  className = "",
}: LoadingOverlayProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      data-testid="loading-overlay"
      aria-busy="true"
      className={`fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm ${className}`}
    >
      {variant === "hud" ? (
        <CircularHudLoader message={message} />
      ) : (
        <HackerSnakeLoader size="lg" message={message} />
      )}
    </div>
  );
}