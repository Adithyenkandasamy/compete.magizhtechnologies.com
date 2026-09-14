"use client";

import { useMemo } from "react";
import { CheckCircle2, QrCode, ShieldCheck, Sparkles, Building2, GraduationCap, Calendar } from "lucide-react";
import type { User } from "@/types/auth";
import type { Profile } from "@/types/auth";

export function formatStudentId(userId: string | undefined): string {
  if (!userId) return "MZ-STU-000000";
  // Generate a clean deterministic 6-digit or hex code
  const clean = userId.replace(/-/g, "").toUpperCase();
  return `MZ-STU-${clean.slice(0, 6)}`;
}

interface StudentIdCardProps {
  user: User | null;
  profile?: Profile | null;
  compact?: boolean;
}

export function StudentIdCard({ user, profile, compact = false }: StudentIdCardProps) {
  const fullName = profile?.full_name || user?.profile?.full_name || user?.email?.split("@")[0] || "Student";
  const college = profile?.college || user?.profile?.college || "Magizh Innovation Academy";
  const department = profile?.department || user?.profile?.department || "Technology & Engineering";
  const year = profile?.year || user?.profile?.year_of_study || 1;
  const studentId = formatStudentId(user?.id);
  const verifyUrl = typeof window !== "undefined" ? `${window.location.origin}/student/verify/${user?.id || "demo"}` : `/student/verify/${user?.id || "demo"}`;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-[#D4AF37]/40 bg-gradient-to-br from-[#0D0D0F] via-[#0A0A0A] to-[#050505] p-6 text-[#F5F3ED] shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(212,175,55,0.1)] transition-all duration-300 ${
        compact ? "max-w-sm" : "max-w-md w-full"
      }`}
    >
      {/* Background Micro Security Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(#D4AF37 1px, transparent 1px), radial-gradient(#D4AF37 1px, #000000 1px)",
          backgroundSize: "16px 16px",
          backgroundPosition: "0 0, 8px 8px",
        }}
      />

      {/* Gold Edge Hologram Trim */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

      {/* Header */}
      <div className="relative z-10 flex items-start justify-between border-b border-[#252525]/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#D4AF37]/50 bg-[#000000] text-[#D4AF37] font-mono text-lg font-black shadow-[0_0_12px_rgba(212,175,55,0.2)]">
            M
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-[#F5F3ED]">
              MAGIZH
            </h3>
            <p className="text-[9px] uppercase tracking-[0.3em] text-[#D4AF37]">
              OFFICIAL STUDENT IDENTITY
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-[#6FAF7B]/40 bg-[#6FAF7B]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#6FAF7B]">
          <ShieldCheck size={12} />
          VERIFIED
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 my-6 flex gap-5 items-center">
        {/* Avatar */}
        <div className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl border-2 border-[#D4AF37]/40 bg-[#111114] text-xl font-bold text-[#D4AF37] shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={fullName}
              className="h-full w-full rounded-xl object-cover"
            />
          ) : (
            <span>{fullName.slice(0, 2).toUpperCase()}</span>
          )}
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#D4AF37] text-black">
            <CheckCircle2 size={14} />
          </div>
        </div>

        {/* Student Details */}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#A1A1A1]">
            STUDENT NAME
          </p>
          <h4 className="magizh-heading truncate text-xl font-bold text-[#F5F3ED]">
            {fullName}
          </h4>

          <div className="mt-2 inline-flex items-center gap-2 rounded border border-[#252525] bg-[#000000] px-2.5 py-1">
            <span className="text-[9px] uppercase tracking-widest text-[#A1A1A1]">
              ID:
            </span>
            <span className="font-mono text-xs font-bold tracking-wider text-[#D4AF37]">
              {studentId}
            </span>
          </div>
        </div>
      </div>

      {/* Academic Information */}
      <div className="relative z-10 grid grid-cols-2 gap-3 rounded-lg border border-[#252525] bg-[#08080A] p-3 text-xs">
        <div>
          <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-[#A1A1A1]">
            <Building2 size={11} className="text-[#D4AF37]" />
            COLLEGE
          </div>
          <p className="mt-1 truncate font-medium text-[#F5F3ED]">{college}</p>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-[#A1A1A1]">
            <GraduationCap size={11} className="text-[#D4AF37]" />
            DEPARTMENT
          </div>
          <p className="mt-1 truncate font-medium text-[#F5F3ED]">
            {department} {year ? `(Yr ${year})` : ""}
          </p>
        </div>
      </div>

      {/* Footer / QR Verification */}
      <div className="relative z-10 mt-5 flex items-center justify-between border-t border-[#252525]/80 pt-4">
        <div>
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#A1A1A1]">
            STATUS
          </p>
          <p className="font-mono text-xs font-semibold text-[#6FAF7B]">
            ACTIVE SCHOLAR
          </p>
          <p className="mt-1 text-[8px] text-[#A1A1A1]/60">
            PERMANENT ECOSYSTEM PASSPORT
          </p>
        </div>

        {/* QR Code Graphic */}
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded border border-[#D4AF37]/50 bg-white p-1 shadow-[0_0_10px_rgba(212,175,55,0.15)]">
            <QrCode size={40} className="text-black" />
          </div>
          <span className="mt-1 text-[8px] tracking-widest text-[#D4AF37]">
            VERIFY
          </span>
        </div>
      </div>
    </div>
  );
}
