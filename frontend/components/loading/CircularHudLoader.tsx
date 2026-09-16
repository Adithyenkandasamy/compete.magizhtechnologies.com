"use client";

import { Loader2 } from "lucide-react";

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
  session: "Loading...",
};

function formatMessage(msg?: string): string | null {
  if (!msg) return null;
  if (msg === msg.toUpperCase() && msg.length > 3) {
    const clean = msg.replace(/\.+$/, "");
    return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase() + "...";
  }
  return msg;
}

export function CircularHudLoader({
  mode = "login",
  message,
  fullScreen = false,
  className = "",
}: CircularHudLoaderProps) {
  const label = formatMessage(message) || modeLabels[mode];

  return (
    <div
      data-testid="circular-hud"
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`flex flex-col items-center justify-center gap-3 ${
        fullScreen
          ? "fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
          : "min-h-[40vh] py-10"
      } ${className}`}
    >
      <Loader2 className="h-7 w-7 animate-spin text-[#D4AF37]" />

      {label && (
        <p className="text-xs font-normal text-[#A1A1A1]">
          {label}
        </p>
      )}
    </div>
  );
}