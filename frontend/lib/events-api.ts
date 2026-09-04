import apiClient from "./api-client";
import type { Event } from "@/types/events";

export async function getEvents(): Promise<Event[]> {
  const response = await apiClient.get<Event[]>("/events");

  return response.data;
}

export async function getEvent(eventId: string): Promise<Event> {
  const response = await apiClient.get<Event>(`/events/${eventId}`);

  return response.data;
}