"use client";

import {
  CircularHudLoader,
  type CircularHudMode,
} from "./CircularHudLoader";
import { HackerSnakeLoader } from "./HackerSnakeLoader";

/**
 * Generic blocking overlay that uses one of the two Magizh loader families:
 *
 *   <LoadingOverlay open={mutation.isPending} variant="hud" mode="logout" />
 *   <LoadingOverlay open={query.isPending} variant="snake" message="SYNCING" />
 *
 *   variant="hud"    → Circular HUD (authentication operations only)
 *   variant="snake"  → Hacker Snake (everything else)
 *
 * Renders nothing when closed (no layout impact).
 */

type LoadingOverlayProps = {
  open: boolean;
  variant?: "hud" | "snake";
  /** HUD auth-lifecycle mode (used when variant is "hud"). */
  mode?: CircularHudMode;
  message?: string;
  className?: string;
};

export function LoadingOverlay({
  open,
  variant = "snake",
  mode = "login",
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
        <CircularHudLoader mode={mode} message={message} />
      ) : (
        <HackerSnakeLoader size="lg" message={message} />
      )}
    </div>
  );
}