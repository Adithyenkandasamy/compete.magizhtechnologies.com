import apiClient from "./api-client";

export type Registration = {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export async function registerForEvent(
  eventId: string,
): Promise<Registration> {
  const response = await apiClient.post<Registration>(
    `/events/${eventId}/register`,
  );

  return response.data;
}

export async function getMyRegistrations(): Promise<Registration[]> {
  const response = await apiClient.get<{
    items: Registration[];
    total: number;
    page: number;
    size: number;
    pages: number;
  }>("/me/registrations");

  return response.data.items;
}

export async function getMyRegistration(
  registrationId: string,
): Promise<Registration> {
  const response = await apiClient.get<Registration>(
    `/me/registrations/${registrationId}`,
  );

  return response.data;
}

export async function cancelEventRegistration(
  eventId: string,
): Promise<void> {
  await apiClient.delete(`/events/${eventId}/registration`);
}

/**
 * Check if the current user is registered for a specific event.
 * Returns null if not registered (catches 404).
 */
export async function getMyEventRegistration(
  eventId: string,
): Promise<Registration | null> {
  try {
    const response = await apiClient.get<Registration>(
      `/events/${eventId}/my-registration`,
    );
    return response.data;
  } catch {
    // 404 = not registered, anything else = treat as not registered too
    return null;
  }
}