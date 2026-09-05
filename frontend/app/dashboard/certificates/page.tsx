"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

type Certificate = {
  id: string;
  certificate_code: string;
  title?: string | null;
  event_id?: string | null;
  issued_at?: string | null;
};

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCertificates() {
      try {
        setLoading(true);
        setError("");

        const response = await apiClient.get<Certificate[]>(
          "/me/certificates",
        );

        setCertificates(response.data);
      } catch (err) {
        console.error(err);
        setError("Unable to load certificates.");
      } finally {
        setLoading(false);
      }
    }

    loadCertificates();
  }, []);

  async function handleDownload(certificateId: string) {
    try {
      const response = await apiClient.get(
        `/certificates/${certificateId}/download`,
        {
          responseType: "blob",
        },
      );

      const blob = new Blob([response.data]);

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `certificate-${certificateId}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("Unable to download certificate.");
    }
  }

  return (
    <main className="magizh-container py-12">
      <div className="mb-10">
        <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.25em]">
          ACHIEVEMENTS
        </p>

        <h1 className="magizh-heading mt-3 text-4xl font-bold md:text-5xl">
          My Certificates
        </h1>

        <p className="magizh-muted mt-3 max-w-2xl">
          View and download certificates earned through
          Magizh Technologies events.
        </p>
      </div>

      {loading && (
        <div className="magizh-card p-6">
          <p className="magizh-muted">
            Loading certificates...
          </p>
        </div>
      )}

      {error && (
        <div className="magizh-card border-[#C75C5C] p-6">
          <p className="text-[#C75C5C]">{error}</p>
        </div>
      )}

      {!loading &&
        !error &&
        certificates.length === 0 && (
          <div className="magizh-card p-8 text-center">
            <p className="magizh-gold text-xs font-semibold uppercase tracking-widest">
              CERTIFICATES
            </p>

            <h2 className="magizh-heading mt-3 text-2xl font-bold">
              No certificates yet
            </h2>

            <p className="magizh-muted mx-auto mt-3 max-w-md">
              Certificates will appear here when they are
              issued for your event participation.
            </p>

            <Link
              href="/events"
              className="magizh-button mt-6"
            >
              Explore Events
            </Link>
          </div>
        )}

      {!loading &&
        !error &&
        certificates.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2">
            {certificates.map((certificate) => (
              <div
                key={certificate.id}
                className="magizh-card p-6"
              >
                <p className="magizh-gold text-xs font-semibold uppercase tracking-widest">
                  CERTIFICATE
                </p>

                <h2 className="magizh-heading mt-3 text-2xl font-bold">
                  {certificate.title ||
                    "Magizh Innovation Certificate"}
                </h2>

                <div className="mt-6 space-y-4">
                  <div className="border border-[#252525] p-4">
                    <p className="magizh-muted text-xs uppercase tracking-widest">
                      Certificate Code
                    </p>

                    <p className="mt-2 break-all text-sm">
                      {certificate.certificate_code}
                    </p>
                  </div>

                  {certificate.issued_at && (
                    <div className="border border-[#252525] p-4">
                      <p className="magizh-muted text-xs uppercase tracking-widest">
                        Issued At
                      </p>

                      <p className="mt-2 text-sm">
                        {new Date(
                          certificate.issued_at,
                        ).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleDownload(certificate.id)
                  }
                  className="magizh-button mt-6 w-full"
                >
                  Download Certificate
                </button>

                <p className="magizh-muted mt-4 text-center text-xs">
                  Certificate ID: {certificate.id}
                </p>
              </div>
            ))}
          </div>
        )}
    </main>
  );
}