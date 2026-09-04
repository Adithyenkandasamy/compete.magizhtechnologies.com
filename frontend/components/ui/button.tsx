import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "gold" | "outline";
};

export function Button({
  variant = "gold",
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded px-5 py-3 font-semibold transition-all duration-200";

  const variants = {
    gold: "bg-[#D4AF37] text-black hover:bg-[#E5C04A]",
    outline:
      "border border-[#252525] text-[#F5F3ED] hover:border-[#D4AF37] hover:text-[#D4AF37]",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}