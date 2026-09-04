import apiClient from "./api-client";
import type { Profile } from "@/types/auth";

export async function getMyProfile(): Promise<Profile> {
  const response = await apiClient.get<Profile>("/me/profile");

  return response.data;
}

export async function updateMyProfile(
  data: Partial<
    Omit<Profile, "user_id" | "created_at" | "updated_at">
  >,
): Promise<Profile> {
  const response = await apiClient.put<Profile>("/me/profile", data);

  return response.data;
}