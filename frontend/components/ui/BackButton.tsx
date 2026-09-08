"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

type BackButtonProps = {
  /** Accessible label / fallback text. Defaults to "Back". */
  label?: string;
  /** Optional target href matched against the current history entry. */
  href?: string;
  className?: string;
};

/**
 * Branded back-navigation button.
 *
 * Goes back to the previous page in the browser history using
 * `router.back()`. If there is no history (e.g. the page was opened
 * directly), it falls back to `href` when provided; otherwise it renders
 * as a disabled button so the user knows there's nowhere to go back to.
 */
export function BackButton({
  label = "Back",
  href,
  className = "",
}: BackButtonProps) {
  const router = useRouter();

  const hasHistory =
    typeof window !== "undefined" && window.history.length > 1;

  function handleClick() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    if (href) {
      router.push(href);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Go back - ${label}`}
      disabled={!hasHistory && !href}
      className={`group inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[#A1A1A1] transition-colors hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      <ArrowLeft
        size={16}
        className="transition-transform group-hover:-translate-x-0.5"
      />
      {label}
    </button>
  );
}