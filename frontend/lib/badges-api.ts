import apiClient from "./api-client";

export type Badge = {
  id: string;
  name: string;
  description?: string | null;
  icon_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};

export async function getMyBadges(): Promise<Badge[]> {
  const response = await apiClient.get<Badge[] | { badges?: Badge[] }>(
    "/me/badges",
  );

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return response.data.badges ?? [];
}

export async function getBadges(): Promise<Badge[]> {
  const response = await apiClient.get<Badge[] | { badges?: Badge[] }>(
    "/badges",
  );

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return response.data.badges ?? [];
}