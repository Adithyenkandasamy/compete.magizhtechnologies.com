"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, Building2, GraduationCap, ArrowRight, ShieldAlert } from "lucide-react";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { formatStudentId } from "@/components/ui/student-id-card";

interface VerifyParams {
  studentId: string;
}

export default function StudentVerifyPage({
  params,
}: {
  params: Promise<VerifyParams>;
}) {
  const resolvedParams = use(params);
  const rawId = resolvedParams.studentId;
  const formattedId = formatStudentId(rawId);

  return (
    <div className="min-h-screen bg-black text-[#F5F3ED] flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center magizh-container py-16 px-4">
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#D4AF37]/40 bg-[#0A0A0A] p-8 shadow-[0_0_50px_rgba(212,175,55,0.08)]">
          {/* Official Verification Stamp */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#6FAF7B]/50 bg-[#6FAF7B]/10 text-[#6FAF7B] shadow-[0_0_20px_rgba(111,175,123,0.2)]">
              <CheckCircle2 size={32} />
            </div>

            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#6FAF7B]">
              OFFICIAL VERIFICATION
            </p>

            <h1 className="magizh-heading mt-2 text-2xl font-bold text-[#F5F3ED]">
              Verified Magizh Scholar
            </h1>

            <p className="magizh-muted mt-2 text-xs">
              This credential is authenticated against the Magizh Technologies Student Innovation Registry.
            </p>
          </div>

          {/* Safe Public Data Card */}
          <div className="mt-8 rounded-xl border border-[#252525] bg-[#000000] p-5 space-y-4">
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#A1A1A1]">
                STUDENT ID
              </span>
              <p className="font-mono text-base font-bold text-[#D4AF37]">
                {formattedId}
              </p>
            </div>

            <div className="border-t border-[#252525]/80 pt-3">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#A1A1A1]">
                ECOSYSTEM AFFILIATION
              </span>
              <p className="text-sm font-semibold text-[#F5F3ED]">
                Magizh Innovation Platform
              </p>
            </div>

            <div className="border-t border-[#252525]/80 pt-3">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#A1A1A1]">
                IDENTITY STATUS
              </span>
              <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#6FAF7B]">
                <ShieldCheck size={14} /> ACTIVE & VALID CREDENTIAL
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-[#252525] pt-6 text-center">
            <p className="text-[11px] text-[#A1A1A1]">
              Magizh Technologies guarantees student data privacy. Sensitive contact and security details are cryptographically shielded.
            </p>

            <Link
              href="/events"
              className="mt-6 inline-flex items-center gap-2 rounded bg-[#D4AF37] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[#E5C04A]"
            >
              Explore Magizh Events <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
