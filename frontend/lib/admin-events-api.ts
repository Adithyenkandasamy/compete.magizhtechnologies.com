import apiClient from "@/lib/api-client";
import type { Event, EventMode, EventType } from "@/types/events";

type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
};

export type CreateEventRequest = {
  title: string;
  description?: string;
  event_type: EventType;
  banner_url?: string;
  start_date?: string;
  end_date?: string;
  registration_deadline?: string;
  location?: string;
  mode: EventMode;
  max_participants?: number;
  team_size_min: number;
  team_size_max: number;
  prize_pool?: number;
  rules?: string;
};

export type UpdateEventRequest = Partial<CreateEventRequest>;

export async function getAdminEvents(): Promise<Event[]> {
  const response = await apiClient.get<Paginated<Event>>(
    "/admin/events",
  );

  return response.data.items;
}

export async function getAdminEvent(
  eventId: string,
): Promise<Event> {
  const response = await apiClient.get<Event>(
    `/admin/events/${eventId}`,
  );

  return response.data;
}

export async function createAdminEvent(
  data: CreateEventRequest,
): Promise<Event> {
  const response = await apiClient.post<Event>(
    "/admin/events",
    data,
  );

  return response.data;
}

export async function updateAdminEvent(
  eventId: string,
  data: UpdateEventRequest,
): Promise<Event> {
  const response = await apiClient.put<Event>(
    `/admin/events/${eventId}`,
    data,
  );

  return response.data;
}

export async function publishAdminEvent(
  eventId: string,
): Promise<Event> {
  const response = await apiClient.post<Event>(
    `/admin/events/${eventId}/publish`,
  );

  return response.data;
}

export async function unpublishAdminEvent(
  eventId: string,
): Promise<Event> {
  const response = await apiClient.post<Event>(
    `/admin/events/${eventId}/unpublish`,
  );

  return response.data;
}

export async function deleteAdminEvent(
  eventId: string,
): Promise<void> {
  await apiClient.delete(`/admin/events/${eventId}`);
}