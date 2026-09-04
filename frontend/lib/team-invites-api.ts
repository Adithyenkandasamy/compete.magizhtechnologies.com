import apiClient from "./api-client";

export type TeamInvite = {
  token: string;
  team_id: string;
  team_name?: string;
  event_id?: string;
  expires_at?: string | null;
};

export type JoinRequest = {
  id: string;
  team_id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export async function getTeamInvite(
  token: string,
): Promise<TeamInvite> {
  const response = await apiClient.get<TeamInvite>(
    `/team-invites/${token}`,
  );

  return response.data;
}

export async function requestToJoinTeam(
  token: string,
): Promise<JoinRequest> {
  const response = await apiClient.post<JoinRequest>(
    `/team-invites/${token}/request`,
  );

  return response.data;
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
): Promise<void> {
  await apiClient.post(
    `/teams/${teamId}/join-requests/${requestId}/accept`,
  );
}

export async function rejectJoinRequest(
  teamId: string,
  requestId: string,
): Promise<void> {
  await apiClient.post(
    `/teams/${teamId}/join-requests/${requestId}/reject`,
  );
}

export async function cancelJoinRequest(
  teamId: string,
  requestId: string,
): Promise<void> {
  await apiClient.post(
    `/teams/${teamId}/join-requests/${requestId}/cancel`,
  );
}