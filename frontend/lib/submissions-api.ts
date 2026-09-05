import apiClient from "./api-client";

export type Submission = {
  id: string;
  project_id: string;
  status: string;
  submitted_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateSubmissionRequest = {
  [key: string]: unknown;
};

export type UpdateSubmissionRequest = {
  [key: string]: unknown;
};

export async function createSubmission(
  projectId: string,
  data: CreateSubmissionRequest,
): Promise<Submission> {
  const response = await apiClient.post<Submission>(
    `/projects/${projectId}/submission`,
    data,
  );

  return response.data;
}

export async function getProjectSubmission(
  projectId: string,
): Promise<Submission> {
  const response = await apiClient.get<Submission>(
    `/projects/${projectId}/submission`,
  );

  return response.data;
}

export async function submitSubmission(
  submissionId: string,
): Promise<Submission> {
  const response = await apiClient.post<Submission>(
    `/submissions/${submissionId}/submit`,
  );

  return response.data;
}

export async function updateSubmission(
  submissionId: string,
  data: UpdateSubmissionRequest,
): Promise<Submission> {
  const response = await apiClient.put<Submission>(
    `/submissions/${submissionId}`,
    data,
  );

  return response.data;
}