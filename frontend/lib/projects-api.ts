import apiClient from "./api-client";
import type { Project, ProjectPayload } from "@/types/project";

export async function createTeamProject(
  teamId: string,
  data: ProjectPayload,
): Promise<Project> {
  const response = await apiClient.post<Project>(
    `/teams/${teamId}/projects`,
    data,
  );

  return response.data;
}

export async function getTeamProject(teamId: string): Promise<Project | null> {
  try {
    const response = await apiClient.get<Project>(
      `/teams/${teamId}/projects`,
    );

    return response.data;
  } catch (err: unknown) {
    if ((err as { response?: { status?: number } })?.response?.status === 404) {
      return null;
    }

    throw err;
  }
}

export async function getProject(projectId: string): Promise<Project> {
  const response = await apiClient.get<Project>(`/projects/${projectId}`);

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

export async function deleteProject(projectId: string): Promise<void> {
  await apiClient.delete(`/projects/${projectId}`);
}