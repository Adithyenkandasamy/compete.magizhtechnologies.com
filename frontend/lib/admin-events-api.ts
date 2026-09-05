import apiClient from "@/lib/api-client";
import type { Event } from "@/types/events";

export async function getAdminEvents(): Promise<Event[]> {
  const response = await apiClient.get<Event[]>("/admin/events");

  return response.data;
}

export async function getAdminEvent(
  eventId: string,
): Promise<Event> {
  const response = await apiClient.get<Event>(
    `/admin/events/${eventId}`,
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