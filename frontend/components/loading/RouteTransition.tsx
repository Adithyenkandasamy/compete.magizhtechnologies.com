"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Subtle Hacker Snake page-transition indicator for client navigation.
 *
 * On each pathname change a thin gold snake sweeps across the top for ~250ms
 * — a deliberate technical transition that never makes navigation feel slow
 * and never delays a request. Uses the same snake CSS as every other loader.
 *
 * Respects prefers-reduced-motion (no sweep; the transition stays silent).
 */
export function RouteTransition() {
  const pathname = usePathname();
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    setRunning(true);
    const id = window.setTimeout(() => setRunning(false), 260);
    return () => window.clearTimeout(id);
  }, [pathname]);

  if (!running) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      data-testid="route-transition"
      className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-[3px] overflow-hidden bg-[#0A0A0A]"
    >
      <div className="magizh-snake-flow h-full" />
    </div>
  );
}