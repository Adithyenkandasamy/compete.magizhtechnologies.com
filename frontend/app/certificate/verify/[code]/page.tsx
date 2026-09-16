"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ShieldCheck,
  Trophy,
  Calendar,
  Building2,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

import { verifyCertificatePublic, type CertificateVerification } from "@/lib/certificates-api";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { HackerSnakeLoader, ErrorState } from "@/components/loading";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default function PublicCertificateVerifyPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const code = resolvedParams.code;

  const [cert, setCert] = useState<CertificateVerification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    verifyCertificatePublic(code)
      .then(setCert)
      .catch(() => {
        setError("Invalid or unverified certificate verification code.");
      })
      .finally(() => setIsLoading(false));
  }, [code]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <HackerSnakeLoader size="lg" message="CRYPTOGRAPHICALLY VERIFYING CREDENTIAL..." />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#F5F3ED] flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center magizh-container py-16 px-4">
        <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#D4AF37]/50 bg-[#0A0A0A] p-8 shadow-[0_0_50px_rgba(212,175,55,0.08)]">
          {error || !cert ? (
            <div className="text-center py-6">
              <ErrorState
                title="Certificate Not Found"
                message="The provided verification cryptographic key does not match any official Magizh issued records."
              />
              <Link
                href="/events"
                className="mt-6 inline-flex rounded bg-[#D4AF37] px-6 py-2.5 text-xs font-bold uppercase text-black"
              >
                Browse Magizh Events
              </Link>
            </div>
          ) : (
            <div>
              {/* Verification Header */}
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#6FAF7B]/50 bg-[#6FAF7B]/10 text-[#6FAF7B]">
                  <CheckCircle2 size={32} />
                </div>

                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#6FAF7B]">
                  CRYPTOGRAPHICALLY AUTHENTICATED
                </span>

                <h1 className="magizh-heading mt-2 text-2xl font-bold md:text-3xl">
                  Verified Magizh Certificate
                </h1>

                <p className="magizh-muted mt-2 text-xs">
                  Issued under the authority of Magizh Technologies Innovation Board.
                </p>
              </div>

              {/* Certificate Details */}
              <div className="mt-8 rounded-xl border border-[#252525] bg-[#000000] p-5 space-y-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#A1A1A1]">
                    RECIPIENT SCHOLAR
                  </span>
                  <p className="font-bold text-base text-[#F5F3ED] mt-0.5">
                    {cert.student_name || "Magizh Scholar"}
                  </p>
                </div>

                <div className="border-t border-[#252525]/80 pt-3 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#A1A1A1]">
                      EVENT CHALLENGE
                    </span>
                    <p className="font-semibold text-sm text-[#D4AF37]">
                      {cert.event_title || "Magizh Innovation Event"}
                    </p>
                  </div>
                </div>

                <div className="border-t border-[#252525]/80 pt-3 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#A1A1A1]">
                      AWARD TYPE
                    </span>
                    <p className="font-mono text-xs font-semibold text-[#F5F3ED]">
                      {cert.certificate_type || "Certificate of Excellence"}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#A1A1A1]">
                      DATE ISSUED
                    </span>
                    <p className="font-mono text-xs text-[#F5F3ED]">
                      {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : "Verified"}
                    </p>
                  </div>
                </div>

                <div className="border-t border-[#252525]/80 pt-3">
                  <span className="text-[10px] uppercase tracking-wider text-[#A1A1A1]">
                    VERIFICATION CODE
                  </span>
                  <p className="font-mono text-xs font-bold text-[#D4AF37]">
                    {cert.verification_code || cert.certificate_code}
                  </p>
                </div>
              </div>


              <div className="mt-8 border-t border-[#252525] pt-6 text-center">
                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 rounded bg-[#D4AF37] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[#E5C04A]"
                >
                  Explore Magizh Platform <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
