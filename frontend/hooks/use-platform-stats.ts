"use client";

import { useQuery } from "@tanstack/react-query";
import { getPlatformStats, type PlatformStats } from "@/lib/stats-api";

export function usePlatformStats() {
  return useQuery<PlatformStats>({
    queryKey: ["platform-stats"],
    queryFn: getPlatformStats,
    refetchInterval: 15000, // Refresh automatically every 15 seconds
    staleTime: 10000,
  });
}
