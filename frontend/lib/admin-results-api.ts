import apiClient from "@/lib/api-client";

export type AdminResult = {
  id: string;
  event_id: string;
  submission_id?: string | null;
  project_id?: string | null;
  rank?: number | null;
  score?: number | null;
  status?: string | null;
  created_at: string;
  updated_at: string;
};

export async function getAdminEventResults(
  eventId: string,
): Promise<AdminResult[]> {
  const response = await apiClient.get<AdminResult[]>(
    `/admin/events/${eventId}/results`,
  );

  return response.data;
}

export async function publishAdminEventResults(
  eventId: string,
): Promise<AdminResult[]> {
  const response = await apiClient.post<AdminResult[]>(
    `/admin/events/${eventId}/results/publish`,
  );

  return response.data;
}