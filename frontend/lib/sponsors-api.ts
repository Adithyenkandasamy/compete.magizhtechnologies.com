import apiClient from "@/lib/api-client";

export type Sponsor = {
  id: string;
  event_id: string;
  name: string;
  logo_url?: string | null;
  website_url?: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateSponsorRequest = {
  name: string;
  logo_url?: string;
  website_url?: string;
};

export type UpdateSponsorRequest = {
  name?: string;
  logo_url?: string;
  website_url?: string;
};

export async function getEventSponsors(
  eventId: string,
): Promise<Sponsor[]> {
  const response = await apiClient.get<Sponsor[]>(
    `/events/${eventId}/sponsors`,
  );

  return response.data;
}

export async function createEventSponsor(
  eventId: string,
  data: CreateSponsorRequest,
): Promise<Sponsor> {
  const response = await apiClient.post<Sponsor>(
    `/admin/events/${eventId}/sponsors`,
    data,
  );

  return response.data;
}

export async function updateEventSponsor(
  eventId: string,
  sponsorId: string,
  data: UpdateSponsorRequest,
): Promise<Sponsor> {
  const response = await apiClient.put<Sponsor>(
    `/admin/events/${eventId}/sponsors/${sponsorId}`,
    data,
  );

  return response.data;
}

export async function deleteEventSponsor(
  eventId: string,
  sponsorId: string,
): Promise<void> {
  await apiClient.delete(
    `/admin/events/${eventId}/sponsors/${sponsorId}`,
  );
}