import apiClient from "./api-client";

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type?: string | null;
  is_read?: boolean;
  read_at?: string | null;
  created_at: string;
  updated_at?: string | null;
  [key: string]: unknown;
};

export async function getMyNotifications(): Promise<Notification[]> {
  const response = await apiClient.get<
    Notification[] | { notifications?: Notification[] }
  >("/me/notifications");

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return response.data.notifications ?? [];
}

export async function markNotificationAsRead(
  notificationId: string,
): Promise<Notification> {
  const response = await apiClient.post<Notification>(
    `/me/notifications/${notificationId}/read`,
  );

  return response.data;
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await apiClient.post("/me/notifications/read-all");
}