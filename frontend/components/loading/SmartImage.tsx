"use client";

import { useState } from "react";

import { Skeleton } from "@/components/loading/Skeleton";

type SmartImageProps = {
  src: string;
  alt: string;
  className?: string;
  /** Reserves space and prevents layout shift while the image loads. */
  skeletonClassName?: string;
  /** Applied to the inner <img> (e.g. "object-contain"). */
  imgClassName?: string;
};

/**
 * Remote-image wrapper with a Magizh loading story:
 *
 *   before load -> dark skeleton placeholder (space reserved)
 *   on load     -> image fades in over the skeleton
 *   on error    -> clean monochrome fallback block
 *
 * Uses a plain <img> so it works with arbitrary remote hosts without
 * adding next/image remotePatterns config. Because onLoad/onError are
 * client-side, this is a client component.
 */
export function SmartImage({
  src,
  alt,
  className = "",
  skeletonClassName = "",
  imgClassName = "",
}: SmartImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        aria-label={alt}
        className={`flex items-center justify-center bg-[#0A0A0A] ${className}`}
      >
        <span className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
          MAGIZH
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Skeleton behind the image — keeps space, fades out once loaded */}
      {!loaded && <Skeleton className={`absolute inset-0 ${skeletonClassName}`} />}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        } ${imgClassName}`}
      />
    </div>
  );
}