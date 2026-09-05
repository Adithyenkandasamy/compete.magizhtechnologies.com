import apiClient from "@/lib/api-client";
import type { User } from "@/types/auth";

export type UpdateUserStatusRequest = {
  status: string;
};

export type UpdateUserRoleRequest = {
  role: string;
};

export async function getAdminUsers(): Promise<User[]> {
  const response = await apiClient.get<User[]>("/admin/users");

  return response.data;
}

export async function getAdminUser(
  userId: string,
): Promise<User> {
  const response = await apiClient.get<User>(
    `/admin/users/${userId}`,
  );

  return response.data;
}

export async function updateAdminUserStatus(
  userId: string,
  data: UpdateUserStatusRequest,
): Promise<User> {
  const response = await apiClient.put<User>(
    `/admin/users/${userId}/status`,
    data,
  );

  return response.data;
}

export async function updateAdminUserRole(
  userId: string,
  data: UpdateUserRoleRequest,
): Promise<User> {
  const response = await apiClient.put<User>(
    `/admin/users/${userId}/role`,
    data,
  );

  return response.data;
}