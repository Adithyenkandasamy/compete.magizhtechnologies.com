"use client";

import { useQuery } from "@tanstack/react-query";
import { getPlatformStats, type PlatformStats } from "@/lib/stats-api";

const STATS_CACHE_KEY = "magizh_platform_stats_cache";

function getCachedStats(): PlatformStats | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(STATS_CACHE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.events === "number") {
      return parsed as PlatformStats;
    }
  } catch {
    // Ignore JSON/localStorage errors
  }
  return undefined;
}

function setCachedStats(data: PlatformStats): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STATS_CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota/access errors
  }
}

export function usePlatformStats() {
  return useQuery<PlatformStats>({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      const stats = await getPlatformStats();
      setCachedStats(stats);
      return stats;
    },
    initialData: getCachedStats,
    staleTime: 5 * 60 * 1000, // Keep fresh in cache for 5 minutes
    gcTime: 30 * 60 * 1000,    // Retain in memory for 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
