import apiClient from "./api-client";

export type Certificate = {
  id: string;
  certificate_code: string;
  user_id: string;
  event_id?: string | null;
  event_title?: string | null;
  title?: string | null;
  issued_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};

export async function getMyCertificates(): Promise<Certificate[]> {
  const response = await apiClient.get<
    Certificate[] | { certificates?: Certificate[] }
  >("/me/certificates");

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return response.data.certificates ?? [];
}

export async function getCertificate(
  certificateId: string,
): Promise<Certificate> {
  const response = await apiClient.get<Certificate>(
    `/certificates/${certificateId}`,
  );

  return response.data;
}

export async function downloadCertificate(
  certificateId: string,
): Promise<Blob> {
  const response = await apiClient.get<Blob>(
    `/certificates/${certificateId}/download`,
    {
      responseType: "blob",
    },
  );

  return response.data;
}

export async function verifyCertificate(
  certificateCode: string,
): Promise<Certificate> {
  const response = await apiClient.get<Certificate>(
    `/verify/${encodeURIComponent(certificateCode)}`,
  );

  return response.data;
}