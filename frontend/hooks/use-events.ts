"use client";

import { useQuery } from "@tanstack/react-query";
import { getEvent, getEvents } from "@/lib/events-api";

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: getEvents,
  });
}

export function useEvent(eventId: string) {
  return useQuery({
    queryKey: ["event", eventId],
    queryFn: () => getEvent(eventId),
    enabled: Boolean(eventId),
  });
}