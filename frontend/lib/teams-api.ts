import apiClient from "./api-client";

export type Team = {
  id: string;
  event_id: string;
  name: string;
  leader_id: string;
  created_at: string;
  updated_at: string;
  members?: TeamMember[];
};

export type TeamMember = {
  id: string;
  user_id?: string;
  full_name?: string;
  email?: string;
};

export type CreateTeamRequest = {
  name: string;
};

export type UpdateTeamRequest = {
  name?: string;
};

export type JoinRequest = {
  id: string;
  team_id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type TeamInvite = {
  token?: string;
  team_id?: string;
  team_name?: string;
  event_id?: string;
  event_title?: string;
  expires_at?: string | null;
  status?: string;
  [key: string]: unknown;
};

export type JoinInviteResponse = {
  message?: string;
  status?: string;
  [key: string]: unknown;
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

export async function getTeam(
  teamId: string,
): Promise<Team> {
  const response = await apiClient.get<Team>(
    `/teams/${teamId}`,
  );

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

export async function deleteTeam(
  teamId: string,
): Promise<void> {
  await apiClient.delete(`/teams/${teamId}`);
}

export async function leaveTeam(
  teamId: string,
): Promise<void> {
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

export async function getJoinRequests(
  teamId: string,
): Promise<JoinRequest[]> {
  const response = await apiClient.get<JoinRequest[]>(
    `/teams/${teamId}/join-requests`,
  );

  return response.data;
}

export async function acceptJoinRequest(
  teamId: string,
  requestId: string,
): Promise<JoinRequest> {
  const response = await apiClient.post<JoinRequest>(
    `/teams/${teamId}/join-requests/${requestId}/accept`,
  );

  return response.data;
}

export async function rejectJoinRequest(
  teamId: string,
  requestId: string,
): Promise<JoinRequest> {
  const response = await apiClient.post<JoinRequest>(
    `/teams/${teamId}/join-requests/${requestId}/reject`,
  );

  return response.data;
}

export async function cancelJoinRequest(
  teamId: string,
  requestId: string,
): Promise<JoinRequest> {
  const response = await apiClient.post<JoinRequest>(
    `/teams/${teamId}/join-requests/${requestId}/cancel`,
  );

  return response.data;
}

/*
 * Get public team invite information.
 */
export async function getTeamInvite(
  token: string,
): Promise<TeamInvite> {
  const response = await apiClient.get<TeamInvite>(
    `/team-invites/${encodeURIComponent(token)}`,
  );

  return response.data;
}

/*
 * Request to join a team using an invite.
 */
export async function requestToJoinTeam(
  token: string,
): Promise<JoinInviteResponse> {
  const response = await apiClient.post<JoinInviteResponse>(
    `/team-invites/${encodeURIComponent(token)}/request`,
  );

  return response.data;
}