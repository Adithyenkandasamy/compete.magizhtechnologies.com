"use client";

import { ShieldCheck } from "lucide-react";

export interface StudentVerificationBadgeProps {
  status?: string;
  className?: string;
}

export function StudentVerificationBadge({
  status = "ACTIVE STUDENT",
  className = "",
}: StudentVerificationBadgeProps) {
  const isSuspended = status.toUpperCase().includes("SUSPEND");
  const isInactive = status.toUpperCase().includes("INACTIVE");

  if (isSuspended || isInactive) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-full border border-[#C75C5C]/40 bg-[#C75C5C]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#C75C5C] ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#C75C5C]" />
        <span>{status}</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border border-[#6FAF7B]/40 bg-[#6FAF7B]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#6FAF7B] ${className}`}
    >
      <ShieldCheck size={14} />
      <span>{status}</span>
    </div>
  );
}
