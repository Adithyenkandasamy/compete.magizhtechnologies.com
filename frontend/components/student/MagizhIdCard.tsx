"use client";

import { useMemo } from "react";
import { ShieldCheck } from "lucide-react";
import type { User, Profile, StudentIdentity } from "@/types/auth";
import { formatMagizhStudentId, formatDateOfBirth } from "@/lib/student-id";
import { QRCode } from "@/components/ui/qr-code";

export interface MagizhIdCardProps {
  user?: User | null;
  profile?: Profile | null;
  identity?: StudentIdentity | null;
  className?: string;
}

export function MagizhIdCard({
  user,
  profile,
  identity,
  className = "",
}: MagizhIdCardProps) {
  const fullName = (
    identity?.full_name ||
    profile?.full_name ||
    user?.profile?.full_name ||
    "ADITHYEN KANDASAMY"
  ).toUpperCase();

  const studentId = (
    identity?.magizh_student_id ||
    profile?.magizh_student_id ||
    user?.profile?.magizh_student_id ||
    formatMagizhStudentId(null, user?.id)
  ).toUpperCase();

  const dateOfBirth = formatDateOfBirth(
    identity?.date_of_birth || profile?.date_of_birth || user?.profile?.date_of_birth,
  );

  const college = (
    identity?.college ||
    profile?.college ||
    user?.profile?.college ||
    "SNS COLLEGE OF ENGINEERING"
  ).toUpperCase();

  const status = identity?.status || "ACTIVE STUDENT";

  // Verification URL for QR code (points to /student/verify/[magizhStudentId])
  const verifyUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/student/verify/${encodeURIComponent(studentId)}`;
    }
    return `/student/verify/${encodeURIComponent(studentId)}`;
  }, [studentId]);

  return (
    <div
      className={`relative w-full max-w-[380px] overflow-hidden rounded-2xl border border-[#252525] bg-[#0D0D0F] p-7 text-[#F5F3ED] shadow-2xl transition-all ${className}`}
    >
      {/* Top subtle Gold Identity Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-80" />

      {/* Security background watermark */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(#D4AF37 1px, transparent 1px), radial-gradient(#D4AF37 1px, #000000 1px)",
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 10px 10px",
        }}
      />

      {/* HEADER */}
      <div className="relative z-10 border-b border-[#252525] pb-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">
              MAGIZH TECHNOLOGIES
            </p>
            <p className="mt-1 text-[9px] uppercase tracking-[0.32em] text-[#A1A1A1]">
              STUDENT IDENTITY
            </p>
          </div>

          <div className="flex items-center gap-1 rounded border border-[#6FAF7B]/30 bg-[#6FAF7B]/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#6FAF7B]">
            <ShieldCheck size={11} />
            <span>OFFICIAL</span>
          </div>
        </div>
      </div>

      {/* STUDENT CREDENTIAL DETAILS */}
      <div className="relative z-10 my-6 space-y-4">
        {/* Full Name & Student ID */}
        <div>
          <h2 className="magizh-heading text-2xl font-bold tracking-tight text-[#F5F3ED] leading-tight">
            {fullName}
          </h2>
          <div className="mt-2 inline-flex items-center gap-2 rounded border border-[#D4AF37]/30 bg-[#000000] px-3 py-1 font-mono text-sm font-bold tracking-[0.16em] text-[#D4AF37]">
            {studentId}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 border-t border-[#252525] pt-4 text-left">
          <div>
            <p className="text-[9px] uppercase tracking-[0.22em] text-[#A1A1A1]">
              DATE OF BIRTH
            </p>
            <p className="mt-1 font-mono text-xs font-semibold text-[#F5F3ED]">
              {dateOfBirth}
            </p>
          </div>

          <div>
            <p className="text-[9px] uppercase tracking-[0.22em] text-[#A1A1A1]">
              STATUS
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#6FAF7B]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#6FAF7B] animate-pulse" />
              {status}
            </p>
          </div>
        </div>

        <div>
          <p className="text-[9px] uppercase tracking-[0.22em] text-[#A1A1A1]">
            COLLEGE
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#F5F3ED] leading-snug">
            {college}
          </p>
        </div>
      </div>

      {/* LARGE QR CODE (occupying approx 35-45% of card visual area) */}
      <div className="relative z-10 border-t border-[#252525] pt-5">
        <div className="flex flex-col items-center justify-center">
          <div className="rounded-xl border border-[#252525] bg-white p-3.5 shadow-md">
            <QRCode
              value={verifyUrl}
              size={160}
              className="rounded"
            />
          </div>

          <p className="mt-3 text-[9px] uppercase tracking-[0.2em] text-[#A1A1A1]">
            SCAN TO VERIFY CREDENTIAL
          </p>
        </div>
      </div>
    </div>
  );
}
