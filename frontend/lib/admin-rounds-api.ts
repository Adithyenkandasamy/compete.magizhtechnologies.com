import apiClient from "@/lib/api-client";
import type { EventMode } from "@/types/events";

export type RoundType = "QUALIFIER" | "IDEA_SUBMISSION" | "HACK";

export type RoundStatus = "UPCOMING" | "OPEN" | "CLOSED";

export type EventRound = {
  id: string;
  event_id: string;
  title: string;
  round_type: RoundType;
  order: number;
  description: string | null;
  criteria_url: string | null;
  duration_hours: number | null;
  mode: EventMode | null;
  starts_at: string | null;
  ends_at: string | null;
  status: RoundStatus;
  created_at: string;
  updated_at: string;
};

export type CreateRoundRequest = {
  title: string;
  round_type: RoundType;
  order: number;
  description?: string;
  criteria_url?: string;
  duration_hours?: number;
  mode?: EventMode;
  starts_at?: string;
  ends_at?: string;
};

export type UpdateRoundRequest = Partial<CreateRoundRequest> & {
  status?: RoundStatus;
};

export async function getAdminRounds(
  eventId: string,
): Promise<EventRound[]> {
  const response = await apiClient.get<EventRound[]>(
    `/admin/events/${eventId}/rounds`,
  );

  return response.data;
}

export async function createAdminRound(
  eventId: string,
  data: CreateRoundRequest,
): Promise<EventRound> {
  const response = await apiClient.post<EventRound>(
    `/admin/events/${eventId}/rounds`,
    data,
  );

  return response.data;
}

export async function updateAdminRound(
  eventId: string,
  roundId: string,
  data: UpdateRoundRequest,
): Promise<EventRound> {
  const response = await apiClient.put<EventRound>(
    `/admin/events/${eventId}/rounds/${roundId}`,
    data,
  );

  return response.data;
}

export async function deleteAdminRound(
  eventId: string,
  roundId: string,
): Promise<void> {
  await apiClient.delete(
    `/admin/events/${eventId}/rounds/${roundId}`,
  );
}

export async function getPublicRounds(
  eventId: string,
): Promise<EventRound[]> {
  const response = await apiClient.get<EventRound[]>(
    `/events/${eventId}/rounds`,
  );

  return response.data;
}