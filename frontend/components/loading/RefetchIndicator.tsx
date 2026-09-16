import { Loader2 } from "lucide-react";

type RefetchIndicatorProps = {
  active: boolean;
  label?: string;
  className?: string;
};

export function RefetchIndicator({
  active,
  label = "Updating...",
  className = "",
}: RefetchIndicatorProps) {
  if (!active) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className={`inline-flex items-center gap-2 rounded border border-[#252525] bg-[#0D0D0F] px-3 py-1.5 ${className}`}
    >
      <Loader2 data-testid="hacker-snake" className="h-3.5 w-3.5 animate-spin text-[#D4AF37]" />
      <span className="text-xs font-normal text-[#A1A1A1]">
        {label}
      </span>
    </div>
  );
}