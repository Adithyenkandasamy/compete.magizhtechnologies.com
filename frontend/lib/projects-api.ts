import apiClient from "@/lib/api-client";
import type { Project, ProjectPayload } from "@/types/project";

export type { Project, ProjectPayload };

/* =========================
   Submission Types
========================= */

export type SubmissionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ACCEPTED"
  | "REJECTED";

export type Submission = {
  id: string;
  project_id: string;
  status: SubmissionStatus | string;
  submitted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type SubmissionPayload = {
  [key: string]: unknown;
};

/* =========================
   Project APIs
========================= */

export async function createProject(
  teamId: string,
  data: ProjectPayload,
): Promise<Project> {
  const response = await apiClient.post<Project>(
    `/teams/${teamId}/projects`,
    data,
  );

  return response.data;
}

export async function createTeamProject(
  teamId: string,
  data: ProjectPayload,
): Promise<Project> {
  return createProject(teamId, data);
}

export async function getTeamProjects(
  teamId: string,
): Promise<Project[]> {
  const response = await apiClient.get<Project[]>(
    `/teams/${teamId}/projects`,
  );

  return response.data;
}

export async function getTeamProject(
  teamId: string,
): Promise<Project | null> {
  try {
    const projects = await getTeamProjects(teamId);

    return projects.length > 0 ? projects[0] : null;
  } catch (err: unknown) {
    const status = (
      err as {
        response?: {
          status?: number;
        };
      }
    )?.response?.status;

    if (status === 404) {
      return null;
    }

    throw err;
  }
}

export async function getProjects(): Promise<Project[]> {
  const response = await apiClient.get<{
    items: Project[];
    total: number;
    page: number;
    size: number;
    pages: number;
  }>("/projects");

  return response.data.items;
}

export async function getProject(
  projectId: string,
): Promise<Project> {
  const response = await apiClient.get<Project>(
    `/projects/${projectId}`,
  );

  return response.data;
}

export async function updateProject(
  projectId: string,
  data: ProjectPayload,
): Promise<Project> {
  const response = await apiClient.put<Project>(
    `/projects/${projectId}`,
    data,
  );

  return response.data;
}

export async function deleteProject(
  projectId: string,
): Promise<void> {
  await apiClient.delete(`/projects/${projectId}`);
}

/* =========================
   Submission APIs
========================= */

export async function createSubmission(
  projectId: string,
  data: SubmissionPayload = {},
): Promise<Submission> {
  const response = await apiClient.post<Submission>(
    `/projects/${projectId}/submission`,
    data,
  );

  return response.data;
}

export async function getProjectSubmission(
  projectId: string,
): Promise<Submission | null> {
  try {
    const response = await apiClient.get<Submission>(
      `/projects/${projectId}/submission`,
    );

    return response.data;
  } catch (err: unknown) {
    const status = (
      err as {
        response?: {
          status?: number;
        };
      }
    )?.response?.status;

    if (status === 404) {
      return null;
    }

    throw err;
  }
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
  data: SubmissionPayload,
): Promise<Submission> {
  const response = await apiClient.put<Submission>(
    `/submissions/${submissionId}`,
    data,
  );

  return response.data;
}