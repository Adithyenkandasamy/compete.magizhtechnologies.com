import apiClient from "@/lib/api-client";
import type { Project, ProjectPayload } from "@/types/project";

export type { Project, ProjectPayload };

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
  const response = await apiClient.get<Project[]>("/projects");

  return response.data;
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