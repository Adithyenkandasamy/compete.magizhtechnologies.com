"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Award,
  Download,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import {
  getMyCertificates,
  type Certificate,
  downloadMyCertificate,
} from "@/lib/certificates-api";
import { useAuth } from "@/providers/auth-provider";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { HackerSnakeLoader, ErrorState, EmptyState } from "@/components/loading";

export default function CertificatesPage() {
  const router = useRouter();
  const { user, status } = useAuth();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?redirect=/certificates");
    }
  }, [status, router]);

  const {
    data: certsResponse,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["my-certificates"],
    queryFn: () => getMyCertificates(1, 50),
    enabled: status === "authenticated",
  });

  const certificates = certsResponse?.items || [];

  async function handleDownload(certId: string) {
    setDownloadingId(certId);
    try {
      const data = await downloadMyCertificate(certId);
      if (data.download_url) {
        window.open(data.download_url, "_blank");
      }
    } catch {
      // Best-effort
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-black text-[#F5F3ED] flex flex-col">
      <Navbar />

      <main className="flex-1 magizh-container py-12 md:py-16">
        {/* Header */}
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-[#252525] pb-8">
          <div>
            <div className="flex items-center gap-2">
              <Trophy size={14} className="text-[#D4AF37]" />
              <span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
                ACADEMIC HONORS & CREDENTIALS
              </span>
            </div>

            <h1 className="magizh-heading mt-3 text-4xl font-extrabold md:text-5xl">
              My Magizh Certificates
            </h1>

            <p className="magizh-muted mt-2 text-xs leading-relaxed md:text-sm">
              Cryptographically verified merit awards and completion credentials issued permanently to your Magizh Student ID.
            </p>
          </div>

          <div className="text-xs font-mono text-[#D4AF37]">
            <span className="font-bold text-lg">{certificates.length}</span> Official Awards
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="py-20">
            <HackerSnakeLoader size="lg" message="FETCHING ISSUED CREDENTIALS..." />
          </div>
        ) : isError ? (
          <div className="py-12">
            <ErrorState
              title="Unable to load certificates"
              message="Please verify your connection to the Magizh platform."
              onRetry={() => refetch()}
            />
          </div>
        ) : certificates.length === 0 ? (
          <div className="py-16">
            <EmptyState
              kicker="MAGIZH CREDENTIALS"
              title="No certificates issued yet."
              description="Participate in Magizh hackathons, submit projects, and earn verifiable cryptographic honors."
            />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="magizh-card p-6 flex flex-col justify-between border-[#252525] hover:border-[#D4AF37] transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-[#252525] pb-3">
                    <span className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#D4AF37]">
                      {cert.certificate_type}
                    </span>

                    <span className="flex items-center gap-1 text-[10px] font-semibold text-[#6FAF7B]">
                      <ShieldCheck size={12} /> VERIFIED
                    </span>
                  </div>

                  <h3 className="magizh-heading mt-4 text-xl font-bold text-[#F5F3ED] group-hover:text-[#D4AF37] transition-colors">
                    {cert.event_title || "Magizh Innovation Event"}
                  </h3>

                  <div className="mt-4 space-y-2 text-xs text-[#A1A1A1]">
                    <div className="flex justify-between">
                      <span>Awarded To:</span>
                      <span className="text-[#F5F3ED] font-medium">{cert.student_name || user?.email}</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Issued:</span>
                      <span className="font-mono">{new Date(cert.issued_at).toLocaleDateString()}</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Code:</span>
                      <span className="font-mono text-[#D4AF37]">{cert.verification_code}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-[#252525] pt-4 flex items-center justify-between gap-3">
                  <Link
                    href={`/certificate/verify/${cert.verification_code}`}
                    target="_blank"
                    className="flex items-center gap-1 text-xs text-[#A1A1A1] hover:text-[#D4AF37]"
                  >
                    Verify Credential <ExternalLink size={12} />
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDownload(cert.id)}
                    disabled={downloadingId === cert.id}
                    className="flex items-center gap-1.5 rounded bg-[#D4AF37] px-3.5 py-1.5 text-xs font-bold uppercase text-black hover:bg-[#E5C04A]"
                  >
                    <Download size={13} /> {downloadingId === cert.id ? "Fetching..." : "Download"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
