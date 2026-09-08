import type { ButtonHTMLAttributes } from "react";
import { HackerSnakeLoader } from "./HackerSnakeLoader";

type LoadingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingText?: string;
  variant?: "gold" | "danger" | "outline" | "secondary";
  /** "sm" for table rows / inline actions, "md" (default) for primary buttons. */
  size?: "sm" | "md";
};

const base =
  "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50";

const sizes: Record<NonNullable<LoadingButtonProps["size"]>, string> = {
  sm: "rounded px-3 py-2 text-sm",
  md: "rounded px-5 py-3",
};

const variants: Record<NonNullable<LoadingButtonProps["variant"]>, string> = {
  gold: "bg-[#D4AF37] text-black hover:bg-[#E5C04A]",
  outline:
    "border border-[#252525] text-[#F5F3ED] hover:border-[#D4AF37] hover:text-[#D4AF37]",
  danger:
    "border border-[#C75C5C]/50 text-[#C75C5C] hover:bg-[#C75C5C]/10",
  secondary:
    "border border-[#252525] bg-[#0A0A0A] text-[#F5F3ED] hover:border-[#D4AF37] hover:text-[#D4AF37]",
};

/**
 * Button that communicates an async mutation is pending using the Magizh
 * Hacker Snake inside the button (never a full-page cover):
 *
 *   [ Register ]          → idle
 *   [ <snake> Registering... ] → pending
 *
 * - Disables itself while `loading` (prevents duplicate clicks).
 * - Sets `aria-busy` and keeps a visible text label so the pending state is
 *   not conveyed by motion alone.
 * - Retains the exact button dimensions while loading (mini snake + label).
 *
 * Authentication operations should NOT use this — use CircularHudLoader.
 */
export function LoadingButton({
  loading = false,
  loadingText = "Loading...",
  variant = "gold",
  size = "md",
  className = "",
  children,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && <HackerSnakeLoader size="sm" announce={false} />}
      <span>{loading ? loadingText : children}</span>
    </button>
  );
}