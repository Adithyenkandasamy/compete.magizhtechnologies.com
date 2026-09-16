"use client";

import { Loader2 } from "lucide-react";

export type HackerSnakeSize = "sm" | "md" | "lg" | "full";

type HackerSnakeLoaderProps = {
  message?: string;
  size?: HackerSnakeSize;
  announce?: boolean;
  showTelemetry?: boolean;
  className?: string;
};

const sizeMap: Record<HackerSnakeSize, { icon: string; text: string; wrapper: string }> = {
  sm: { icon: "h-4 w-4", text: "hidden", wrapper: "" },
  md: { icon: "h-5 w-5", text: "text-xs mt-2", wrapper: "" },
  lg: { icon: "h-6 w-6", text: "text-xs mt-2.5", wrapper: "min-h-[20vh]" },
  full: { icon: "h-7 w-7", text: "text-xs mt-3", wrapper: "min-h-[40vh]" },
};

function formatMessage(msg?: string): string | null {
  if (!msg) return null;
  // Convert any aggressive all-caps strings (e.g. "LOADING ROSTER...") to normal readable casing
  if (msg === msg.toUpperCase() && msg.length > 3) {
    const clean = msg.replace(/\.+$/, "");
    return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase() + "...";
  }
  return msg;
}

export function HackerSnakeLoader({
  message,
  size = "md",
  announce = true,
  className = "",
}: HackerSnakeLoaderProps) {
  const { icon, text, wrapper } = sizeMap[size];
  const displayMsg = formatMessage(message);

  return (
    <div
      data-testid="hacker-snake"
      role={announce ? "status" : undefined}
      aria-live={announce ? "polite" : undefined}
      aria-busy={announce ? "true" : undefined}
      aria-hidden={announce ? undefined : "true"}
      className={`flex flex-col items-center justify-center ${wrapper} ${className}`}
    >
      <Loader2 className={`${icon} animate-spin text-[#D4AF37]`} />

      {displayMsg && size !== "sm" && (
        <p className={`${text} text-[#A1A1A1] text-center font-normal`}>
          {displayMsg}
        </p>
      )}
    </div>
  );
}