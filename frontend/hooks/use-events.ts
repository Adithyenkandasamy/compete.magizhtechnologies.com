"use client";

import { useQuery } from "@tanstack/react-query";
import { getEvent, getEvents } from "@/lib/events-api";
import type { Event } from "@/types/events";

const EVENTS_CACHE_KEY = "magizh_events_cache";

function getCachedEvents(): Event[] | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(EVENTS_CACHE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as Event[];
    }
  } catch {
    // Ignore JSON/localStorage errors
  }
  return undefined;
}

function setCachedEvents(data: Event[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota/access errors
  }
}

export function useEvents() {
  return useQuery<Event[]>({
    queryKey: ["events"],
    queryFn: async () => {
      const events = await getEvents();
      setCachedEvents(events);
      return events;
    },
    initialData: getCachedEvents,
    staleTime: 5 * 60 * 1000, // Fresh for 5 minutes
    gcTime: 30 * 60 * 1000,    // Cache retained for 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useEvent(eventId: string) {
  return useQuery<Event>({
    queryKey: ["event", eventId],
    queryFn: () => getEvent(eventId),
    enabled: Boolean(eventId),
    initialData: () => {
      const cachedList = getCachedEvents();
      return cachedList?.find((e) => e.id === eventId);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}