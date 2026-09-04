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
  const response = await apiClient.get<Registration[]>(
    "/me/registrations",
  );

  return response.data;
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