import apiClient from "./api-client";
import type { Profile, StudentIdentity } from "@/types/auth";

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

export async function getMyIdentity(): Promise<StudentIdentity> {
  const response = await apiClient.get<StudentIdentity>("/me/identity");
  return response.data;
}

/**
 * Determine whether all required student information exists:
 * - Full Name
 * - Date of Birth
 * - Phone Number
 * - College
 * - Department
 * - Year
 */
export function isProfileComplete(profile?: Profile | null): boolean {
  if (!profile) return false;
  return Boolean(
    profile.full_name?.trim() &&
    profile.date_of_birth?.trim() &&
    profile.phone?.trim() &&
    profile.college?.trim() &&
    profile.department?.trim() &&
    profile.year
  );
}