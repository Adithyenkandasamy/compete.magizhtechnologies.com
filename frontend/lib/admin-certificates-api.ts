import apiClient from "@/lib/api-client";

export type AdminCertificate = {
  id: string;
  user_id: string;
  event_id: string;
  certificate_code?: string | null;
  status?: string | null;
  issued_at?: string | null;
  created_at: string;
  updated_at: string;
};

export async function getAdminCertificates(): Promise<
  AdminCertificate[]
> {
  const response = await apiClient.get<AdminCertificate[]>(
    "/admin/certificates",
  );

  return response.data;
}

export async function generateEventCertificates(
  eventId: string,
): Promise<AdminCertificate[]> {
  const response = await apiClient.post<AdminCertificate[]>(
    `/admin/events/${eventId}/certificates/generate`,
  );

  return response.data;
}

export async function issueCertificate(
  certificateId: string,
): Promise<AdminCertificate> {
  const response = await apiClient.post<AdminCertificate>(
    `/admin/certificates/${certificateId}/issue`,
  );

  return response.data;
}