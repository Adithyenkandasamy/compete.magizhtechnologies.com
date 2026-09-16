"use client";

import type { User, Profile, StudentIdentity } from "@/types/auth";
import { formatMagizhStudentId, formatDateOfBirth } from "@/lib/student-id";

export interface StudentIdentitySummaryProps {
  user?: User | null;
  profile?: Profile | null;
  identity?: StudentIdentity | null;
  className?: string;
}

export function StudentIdentitySummary({
  user,
  profile,
  identity,
  className = "",
}: StudentIdentitySummaryProps) {
  const fullName = (
    identity?.full_name ||
    profile?.full_name ||
    user?.profile?.full_name ||
    "Magizh Student"
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

  const department = (
    identity?.department ||
    profile?.department ||
    user?.profile?.department ||
    "COMPUTER SCIENCE & ENGINEERING"
  ).toUpperCase();

  const yearNumber = identity?.year || profile?.year || user?.profile?.year_of_study || 1;
  const yearSuffix = yearNumber === 1 ? "1ST" : yearNumber === 2 ? "2ND" : yearNumber === 3 ? "3RD" : `${yearNumber}TH`;
  const yearText = `${yearSuffix} YEAR`;

  return (
    <div
      className={`rounded-xl border border-[#252525] bg-[#0A0A0A] p-5 text-left text-[#F5F3ED] space-y-4 ${className}`}
    >
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
          MAGIZH STUDENT
        </p>
        <h4 className="magizh-heading mt-1.5 text-lg font-bold">
          {fullName}
        </h4>
        <span className="mt-1 inline-block font-mono text-xs font-bold text-[#D4AF37]">
          {studentId}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-[#252525] pt-3 text-xs">
        <div>
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#A1A1A1]">
            DATE OF BIRTH
          </p>
          <p className="mt-0.5 font-mono text-xs text-[#F5F3ED]">
            {dateOfBirth}
          </p>
        </div>

        <div>
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#A1A1A1]">
            YEAR
          </p>
          <p className="mt-0.5 text-xs text-[#F5F3ED]">
            {yearText}
          </p>
        </div>
      </div>

      <div className="border-t border-[#252525] pt-3 text-xs space-y-2">
        <div>
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#A1A1A1]">
            COLLEGE
          </p>
          <p className="mt-0.5 text-xs text-[#F5F3ED]">
            {college}
          </p>
        </div>

        <div>
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#A1A1A1]">
            DEPARTMENT
          </p>
          <p className="mt-0.5 text-xs text-[#F5F3ED]">
            {department}
          </p>
        </div>
      </div>
    </div>
  );
}
