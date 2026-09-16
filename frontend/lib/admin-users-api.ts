import apiClient from "@/lib/api-client";
import type { User } from "@/types/auth";

export type UpdateUserStatusRequest = {
  status: string;
};

export type UpdateUserRoleRequest = {
  role: string;
};

export type AdminUsersResponse = {
  items: User[];
  total: number;
  page: number;
  size: number;
  pages: number;
};

export async function getAdminUsers(
  page = 1,
  size = 20,
): Promise<AdminUsersResponse> {
  const response = await apiClient.get<AdminUsersResponse>(
    `/admin/users?page=${page}&size=${size}`,
  );

  // Handle both paginated { items, total, ... } and legacy plain array
  const data = response.data;
  if (Array.isArray(data)) {
    return { items: data, total: (data as User[]).length, page: 1, size: (data as User[]).length, pages: 1 };
  }

  return data;
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

export type DeleteUserResponse = {
  status: string;
  message: string;
  user_id: string;
  hard_deleted: boolean;
};

export async function deleteAdminUser(
  userId: string,
  hard = false,
): Promise<DeleteUserResponse> {
  const response = await apiClient.delete<DeleteUserResponse>(
    `/admin/users/${userId}?hard=${hard}`,
  );

  return response.data;
}