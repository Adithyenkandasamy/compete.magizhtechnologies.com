import apiClient from "@/lib/api-client";

export type AdminSubmission = {
  id: string;
  project_id: string;
  status: string;
  submitted_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type UpdateAdminSubmissionStatusRequest = {
  status: string;
};

export async function getAdminSubmissions(): Promise<
  AdminSubmission[]
> {
  const response = await apiClient.get<AdminSubmission[]>(
    "/admin/submissions",
  );

  return response.data;
}

export async function getAdminSubmission(
  submissionId: string,
): Promise<AdminSubmission> {
  const response = await apiClient.get<AdminSubmission>(
    `/admin/submissions/${submissionId}`,
  );

  return response.data;
}

export async function updateAdminSubmissionStatus(
  submissionId: string,
  data: UpdateAdminSubmissionStatusRequest,
): Promise<AdminSubmission> {
  const response = await apiClient.put<AdminSubmission>(
    `/admin/submissions/${submissionId}/status`,
    data,
  );

  return response.data;
}