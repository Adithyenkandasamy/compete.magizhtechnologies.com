import apiClient from "@/lib/api-client";

export type AdminJudge = {
  id: string;
  name?: string | null;
  email?: string | null;
  status?: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateAdminJudgeRequest = {
  name: string;
  email: string;
};

export type UpdateAdminJudgeRequest = {
  name?: string;
  email?: string;
  status?: string;
};

export async function getAdminJudges(): Promise<AdminJudge[]> {
  const response = await apiClient.get<AdminJudge[]>("/admin/judges");

  return response.data;
}

export async function getAdminJudge(
  judgeId: string,
): Promise<AdminJudge> {
  const response = await apiClient.get<AdminJudge>(
    `/admin/judges/${judgeId}`,
  );

  return response.data;
}

export async function createAdminJudge(
  data: CreateAdminJudgeRequest,
): Promise<AdminJudge> {
  const response = await apiClient.post<AdminJudge>(
    "/admin/judges",
    data,
  );

  return response.data;
}

export async function updateAdminJudge(
  judgeId: string,
  data: UpdateAdminJudgeRequest,
): Promise<AdminJudge> {
  const response = await apiClient.put<AdminJudge>(
    `/admin/judges/${judgeId}`,
    data,
  );

  return response.data;
}

export async function deleteAdminJudge(
  judgeId: string,
): Promise<void> {
  await apiClient.delete(`/admin/judges/${judgeId}`);
}

export async function assignJudgeToEvent(
  eventId: string,
  judgeId: string,
): Promise<void> {
  await apiClient.post(
    `/admin/events/${eventId}/judges/${judgeId}`,
  );
}