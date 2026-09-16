"use client";

import React, { useRef, useState } from "react";
import { Camera, Image as ImageIcon, Loader2, Sparkles, Trash2, UploadCloud } from "lucide-react";
import { uploadEventBanner } from "@/lib/uploads-api";

interface BannerUploaderProps {
  bannerUrl?: string | null;
  onChange: (url: string | null) => void;
  eventId?: string;
  disabled?: boolean;
}

export function BannerUploader({
  bannerUrl,
  onChange,
  eventId,
  disabled = false,
}: BannerUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelected(file: File) {
    if (!file) return;

    // Validate type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPEG, PNG, WebP).");
      return;
    }

    // Validate size (< 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setError("Image size exceeds 15MB limit.");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      const res = await uploadEventBanner(file, eventId);
      onChange(res.banner_url);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to upload banner to Cloudinary.";
      setError(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (disabled || isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelected(file);
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-[#A1A1A1]">
          Event Banner Image
        </label>
        <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-[#D4AF37]">
          <Sparkles size={11} />
          Auto-Compressed via Cloudinary
        </span>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="relative overflow-hidden rounded-xl border border-[#252525] bg-[#0A0A0A] transition hover:border-[#D4AF37]/50"
      >
        {bannerUrl ? (
          <div className="relative aspect-video w-full overflow-hidden bg-black/40">
            <img
              src={bannerUrl}
              alt="Event Banner"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <span className="rounded bg-black/70 px-2.5 py-1 text-[11px] font-mono text-[#D4AF37] border border-[#D4AF37]/30 backdrop-blur-sm">
                Cloudinary CDN Active
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || isUploading}
                  className="inline-flex items-center gap-1.5 rounded border border-[#D4AF37]/40 bg-black/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#D4AF37] backdrop-blur-sm transition hover:bg-[#D4AF37] hover:text-black disabled:opacity-50"
                >
                  <Camera size={13} />
                  Change Banner
                </button>

                <button
                  type="button"
                  onClick={() => onChange(null)}
                  disabled={disabled || isUploading}
                  className="inline-flex items-center gap-1.5 rounded border border-[#C75C5C]/40 bg-black/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#C75C5C] backdrop-blur-sm transition hover:bg-[#C75C5C] hover:text-white disabled:opacity-50"
                >
                  <Trash2 size={13} />
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center py-12 px-6 text-center transition hover:bg-[#121212]"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#252525] bg-[#151515] text-[#D4AF37] shadow-inner mb-4">
              {isUploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
              ) : (
                <UploadCloud className="h-6 w-6 text-[#D4AF37]" />
              )}
            </div>

            <p className="text-sm font-semibold text-[#F5F3ED]">
              {isUploading ? "Compressing & Uploading Banner..." : "Click or Drag & Drop to Upload Banner"}
            </p>
            <p className="mt-1 text-xs text-[#A1A1A1]">
              Recommended 1600×900 or 1920×1080 (Max 15MB). Automatically compressed & converted to WebP/AVIF.
            </p>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xs">
            <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37] mb-2" />
            <p className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
              Optimizing & Uploading to Cloudinary...
            </p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={disabled || isUploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelected(file);
        }}
      />

      {error && (
        <p className="text-xs text-[#C75C5C] mt-1">{error}</p>
      )}
    </div>
  );
}
