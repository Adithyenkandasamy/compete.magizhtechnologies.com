import apiClient from "./api-client";

export type PublicStudentProfile = {
  user_id: string;
  full_name?: string | null;
  avatar_url?: string | null;
  college?: string | null;
  department?: string | null;
  year?: number | null;
  skills?: string[] | null;
  bio?: string | null;
  created_at: string;
};

export async function getPublicStudentProfile(
  studentId: string,
): Promise<PublicStudentProfile> {
  const response = await apiClient.get<PublicStudentProfile>(
    `/public/students/${studentId}/verify`,
  );
  return response.data;
}
