import apiClient from "./api-client";

export type EventResult = {
  id?: string;
  rank?: number;
  position?: number;
  project_id?: string;
  project_name?: string;
  team_id?: string;
  team_name?: string;
  score?: number;
  result?: string;
  prize?: string;
  status?: string;
};

export async function getEventResults(
  eventId: string,
): Promise<EventResult[]> {
  const response = await apiClient.get<EventResult[] | { results?: EventResult[] }>(
    `/events/${eventId}/results`,
  );

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return response.data.results ?? [];
}