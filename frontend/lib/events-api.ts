import apiClient from "./api-client";
import type { Event } from "@/types/events";

type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
};

export async function getEvents(): Promise<Event[]> {
  const response = await apiClient.get<Paginated<Event>>("/events");

  return response.data.items;
}

export async function getEvent(eventId: string): Promise<Event> {
  const response = await apiClient.get<Event>(`/events/${eventId}`);

  return response.data;
}