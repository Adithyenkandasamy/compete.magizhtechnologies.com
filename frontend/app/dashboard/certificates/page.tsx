"use client";

import { useEffect, useState } from "react";
import { Award, Download, Loader2, Search } from "lucide-react";

import { getMyCertificates, downloadCertificate } from "@/lib/certificates-api";
import type { Certificate } from "@/lib/certificates-api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadCertificates() {
      try {
        setLoading(true);
        setError("");

        const data = await getMyCertificates();
        setCertificates(data);
      } catch (err: unknown) {
        const message =
          (
            err as {
              response?: { data?: { detail?: string } };
            }
          )?.response?.data?.detail || "Unable to load certificates.";

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadCertificates();
  }, []);

  async function handleDownload(certificate: Certificate) {
    try {
      setDownloadingId(certificate.id);

      const blob = await downloadCertificate(certificate.id);
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `certificate-${certificate.certificate_code}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch {
      setError("Unable to download the certificate.");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-black px-5 py-12 text-[#F5F3ED]">
      <div className="magizh-container">
        <div className="mb-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
            Student Dashboard
          </p>

          <h1 className="magizh-heading text-4xl font-bold md:text-5xl">
            Certificates
          </h1>

          <p className="mt-3 max-w-2xl text-[#A1A1A1]">
            View and download the certificates you have earned through Magizh
            Technologies events.
          </p>
        </div>

        {loading && (
          <div className="flex items-center gap-3 text-[#A1A1A1]">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading certificates...
          </div>
        )}

        {!loading && error && (
          <Card className="p-6">
            <p className="text-[#C75C5C]">{error}</p>
          </Card>
        )}

        {!loading && !error && certificates.length === 0 && (
          <Card className="p-10 text-center">
            <Award className="mx-auto mb-4 h-10 w-10 text-[#D4AF37]" />

            <h2 className="magizh-heading text-2xl font-bold">
              No certificates yet
            </h2>

            <p className="mx-auto mt-3 max-w-md text-[#A1A1A1]">
              Certificates earned from completed Magizh Technologies events
              will appear here.
            </p>
          </Card>
        )}

        {!loading && !error && certificates.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2">
            {certificates.map((certificate) => (
              <Card key={certificate.id} className="p-6">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10">
                      <Award className="h-5 w-5 text-[#D4AF37]" />
                    </div>

                    <h2 className="magizh-heading text-2xl font-bold">
                      {certificate.title || "Certificate of Participation"}
                    </h2>
                  </div>
                </div>

                {certificate.event_title && (
                  <div className="mb-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#A1A1A1]">
                      Event
                    </p>

                    <p className="mt-1 text-sm text-[#F5F3ED]">
                      {certificate.event_title}
                    </p>
                  </div>
                )}

                <div className="mb-6 border-t border-[#252525] pt-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#A1A1A1]">
                    Certificate Code
                  </p>

                  <p className="mt-1 break-all font-mono text-sm text-[#D4AF37]">
                    {certificate.certificate_code}
                  </p>
                </div>

                {certificate.issued_at && (
                  <p className="mb-6 text-sm text-[#A1A1A1]">
                    Issued{" "}
                    {new Date(certificate.issued_at).toLocaleDateString()}
                  </p>
                )}

                <Button
                  type="button"
                  onClick={() => handleDownload(certificate)}
                  disabled={downloadingId === certificate.id}
                  className="w-full gap-2"
                >
                  {downloadingId === certificate.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download Certificate
                    </>
                  )}
                </Button>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-10">
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <Search className="mt-1 h-5 w-5 text-[#D4AF37]" />

              <div>
                <h2 className="font-semibold">Verify a certificate</h2>

                <p className="mt-2 text-sm leading-6 text-[#A1A1A1]">
                  Anyone can verify a Magizh Technologies certificate using
                  its certificate code.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}