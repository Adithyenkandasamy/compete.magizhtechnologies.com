import apiClient from "@/lib/api-client";

export type JudgeSubmission = {
  id: string;
  project_id: string;
  status: string;
  submitted_at?: string | null;
  created_at: string;
  updated_at: string;
};

export async function getJudgeSubmissions(): Promise<
  JudgeSubmission[]
> {
  const response = await apiClient.get<JudgeSubmission[]>(
    "/judge/submissions",
  );

  return response.data;
}

export async function getJudgeSubmission(
  submissionId: string,
): Promise<JudgeSubmission> {
  const response = await apiClient.get<JudgeSubmission>(
    `/judge/submissions/${submissionId}`,
  );

  return response.data;
}