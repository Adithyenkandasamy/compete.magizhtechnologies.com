import apiClient from "./api-client";

export type EventResult = {
  id?: string;
  rank?: number;
  position?: number;
  submission_id?: string;
  project_id?: string;
  project_name?: string;
  team_id?: string;
  project_title?: string;
  project_description?: string;
  team_name?: string;
  team_members?: string[];
  final_score?: number;
  total_score?: number;
  score?: number;
  award?: string;
  prize?: string;
  result?: string;
  status?: string;
  is_winner?: boolean;
  [key: string]: unknown;
};

export type ResultsResponse = {
  event_id: string;
  event_title: string;
  status: string;
  is_published?: boolean;
  published_at?: string | null;
  total_ranked?: number;
  results: EventResult[];
  items?: EventResult[];
};

export async function getEventResults(
  eventId: string,
): Promise<ResultsResponse> {
  const response = await apiClient.get<ResultsResponse | EventResult[]>(
    `/events/${eventId}/results`,
  );

  if (Array.isArray(response.data)) {
    return {
      event_id: eventId,
      event_title: "Event",
      status: "PUBLISHED",
      is_published: true,
      results: response.data,
      items: response.data,
    };
  }

  const data = response.data as ResultsResponse;
  data.items = data.results || [];
  data.is_published = data.status === "PUBLISHED" || data.is_published === true;
  return data;
}