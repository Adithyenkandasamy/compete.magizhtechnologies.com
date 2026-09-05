import apiClient from "@/lib/api-client";

export type AnalyticsOverview = Record<string, unknown>;

export type EventAnalytics = Record<string, unknown>;

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const response = await apiClient.get<AnalyticsOverview>(
    "/admin/analytics/overview",
  );

  return response.data;
}

export async function getEventAnalytics(
  eventId: string,
): Promise<EventAnalytics> {
  const response = await apiClient.get<EventAnalytics>(
    `/admin/analytics/events/${eventId}`,
  );

  return response.data;
}