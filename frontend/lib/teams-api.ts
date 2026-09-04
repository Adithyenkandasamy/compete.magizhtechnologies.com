import apiClient from "./api-client";

export type Team = {
  id: string;
  event_id: string;
  name: string;
  leader_id: string;
  created_at: string;
  updated_at: string;
};

export type CreateTeamRequest = {
  name: string;
};

export type UpdateTeamRequest = {
  name?: string;
};

export async function createTeam(
  eventId: string,
  data: CreateTeamRequest,
): Promise<Team> {
  const response = await apiClient.post<Team>(
    `/events/${eventId}/teams`,
    data,
  );

  return response.data;
}

export async function getEventTeams(
  eventId: string,
): Promise<Team[]> {
  const response = await apiClient.get<Team[]>(
    `/events/${eventId}/teams`,
  );

  return response.data;
}

export async function getTeam(teamId: string): Promise<Team> {
  const response = await apiClient.get<Team>(`/teams/${teamId}`);

  return response.data;
}

export async function updateTeam(
  teamId: string,
  data: UpdateTeamRequest,
): Promise<Team> {
  const response = await apiClient.put<Team>(
    `/teams/${teamId}`,
    data,
  );

  return response.data;
}

export async function deleteTeam(teamId: string): Promise<void> {
  await apiClient.delete(`/teams/${teamId}`);
}

export async function leaveTeam(teamId: string): Promise<void> {
  await apiClient.post(`/teams/${teamId}/leave`);
}

export async function removeTeamMember(
  teamId: string,
  userId: string,
): Promise<void> {
  await apiClient.delete(
    `/teams/${teamId}/members/${userId}`,
  );
}

export async function transferTeamLeadership(
  teamId: string,
  userId: string,
): Promise<void> {
  await apiClient.post(
    `/teams/${teamId}/transfer-leadership/${userId}`,
  );
}