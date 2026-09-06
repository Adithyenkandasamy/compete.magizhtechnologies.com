import apiClient from "./api-client";
import type { Event } from "@/types/events";

<<<<<<< HEAD
type EventsResponse = {
  items: Event[];
=======
type Paginated<T> = {
  items: T[];
>>>>>>> e9267dfe5ddf938a4d6ac2efd5e1b0ac0921637d
  total: number;
  page: number;
  size: number;
  pages: number;
};

export async function getEvents(): Promise<Event[]> {
<<<<<<< HEAD
  const response = await apiClient.get<EventsResponse>("/events");
=======
  const response = await apiClient.get<Paginated<Event>>("/events");

>>>>>>> e9267dfe5ddf938a4d6ac2efd5e1b0ac0921637d
  return response.data.items;
}

export async function getEvent(eventId: string): Promise<Event> {
  const response = await apiClient.get<Event>(`/events/${eventId}`);
  return response.data;
}