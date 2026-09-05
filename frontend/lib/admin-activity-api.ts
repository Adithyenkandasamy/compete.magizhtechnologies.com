import apiClient from "@/lib/api-client";

export type AdminActivity = {
  id: string;
  type?: string | null;
  message?: string | null;
  created_at: string;
};

export type AdminAuditLog = {
  id: string;
  action?: string | null;
  user_id?: string | null;
  details?: string | null;
  created_at: string;
};

export async function getAdminActivity(): Promise<
  AdminActivity[]
> {
  const response = await apiClient.get<AdminActivity[]>(
    "/admin/activity",
  );

  return response.data;
}

export async function getAdminAuditLogs(): Promise<
  AdminAuditLog[]
> {
  const response = await apiClient.get<AdminAuditLog[]>(
    "/admin/audit-logs",
  );

  return response.data;
}