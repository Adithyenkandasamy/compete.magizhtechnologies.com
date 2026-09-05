import apiClient from "@/lib/api-client";

export type Project = {
  id: string;
  team_id: string;
  title: string;
  description?: string | null;
  repository_url?: string | null;
  demo_url?: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateProjectRequest = {
  title: string;
  description?: string;
  repository_url?: string;
  demo_url?: string;
};

export type UpdateProjectRequest = {
  title?: string;
  description?: string;
  repository_url?: string;
  demo_url?: string;
};

export async function createProject(
  teamId: string,
  data: CreateProjectRequest,
): Promise<Project> {
  const response = await apiClient.post<Project>(
    `/teams/${teamId}/projects`,
    data,
  );

  return response.data;
}

export async function getTeamProjects(
  teamId: string,
): Promise<Project[]> {
  const response = await apiClient.get<Project[]>(
    `/teams/${teamId}/projects`,
  );

  return response.data;
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
  data: UpdateProjectRequest,
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