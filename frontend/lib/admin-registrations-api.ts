import apiClient from "@/lib/api-client";

export type AdminRegistration = {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type UpdateAdminRegistrationRequest = {
  status?: string;
};

export async function getAdminRegistrations(): Promise<
  AdminRegistration[]
> {
  const response = await apiClient.get<AdminRegistration[]>(
    "/admin/registrations",
  );

  return response.data;
}

export async function getAdminRegistration(
  registrationId: string,
): Promise<AdminRegistration> {
  const response = await apiClient.get<AdminRegistration>(
    `/admin/registrations/${registrationId}`,
  );

  return response.data;
}

export async function updateAdminRegistration(
  registrationId: string,
  data: UpdateAdminRegistrationRequest,
): Promise<AdminRegistration> {
  const response = await apiClient.put<AdminRegistration>(
    `/admin/registrations/${registrationId}`,
    data,
  );

  return response.data;
}