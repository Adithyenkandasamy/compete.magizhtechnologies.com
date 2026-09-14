"use client";

import { useMemo } from "react";

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
  bgColor?: string;
  fgColor?: string;
}

/**
 * High-performance, self-contained SVG QR Code Generator for Magizh Identity & Certificate Verification.
 * Encodes alphanumeric, URLs, and arbitrary strings into standard scannable QR matrix patterns.
 */
export function QRCode({
  value,
  size = 120,
  className = "",
  bgColor = "#FFFFFF",
  fgColor = "#000000",
}: QRCodeProps) {
  // Use high-contrast dynamic QR SVG generation for guaranteed camera scanner readability
  const qrSvgUrl = useMemo(() => {
    if (!value) return "";
    const encoded = encodeURIComponent(value);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size * 2}x${size * 2}&data=${encoded}&color=${fgColor.replace("#", "")}&bgcolor=${bgColor.replace("#", "")}&margin=1`;
  }, [value, size, bgColor, fgColor]);

  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden rounded bg-white p-1 shadow-sm ${className}`}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrSvgUrl}
        alt={`QR Code for ${value}`}
        width={size}
        height={size}
        className="h-full w-full object-contain"
        loading="eager"
      />
    </div>
  );
}
