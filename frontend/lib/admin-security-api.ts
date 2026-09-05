import apiClient from "@/lib/api-client";

export type SecurityAlert = {
  id: string;
  type?: string | null;
  message?: string | null;
  severity?: string | null;
  status?: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type LoginAttempt = {
  id: string;
  user_id?: string | null;
  email?: string | null;
  status?: string | null;
  ip_address?: string | null;
  created_at: string;
};

export type SecuritySession = {
  id: string;
  user_id?: string | null;
  email?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  expires_at?: string | null;
};

export async function getSecurityAlerts(): Promise<
  SecurityAlert[]
> {
  const response = await apiClient.get<SecurityAlert[]>(
    "/admin/security/alerts",
  );

  return response.data;
}

export async function resolveSecurityAlert(
  alertId: string,
): Promise<SecurityAlert> {
  const response = await apiClient.post<SecurityAlert>(
    `/admin/security/alerts/${alertId}/resolve`,
  );

  return response.data;
}

export async function getLoginAttempts(): Promise<
  LoginAttempt[]
> {
  const response = await apiClient.get<LoginAttempt[]>(
    "/admin/security/login-attempts",
  );

  return response.data;
}

export async function getSecuritySessions(): Promise<
  SecuritySession[]
> {
  const response = await apiClient.get<SecuritySession[]>(
    "/admin/security/sessions",
  );

  return response.data;
}