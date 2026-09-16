import apiClient from "./api-client";

export type PlatformStats = {
  events: number;
  participants: number;
  teams: number;
  winning_projects: number;
};

export async function getPlatformStats(): Promise<PlatformStats> {
  const response = await apiClient.get<PlatformStats>("/stats");
  return response.data;
}
