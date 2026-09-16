"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  Loader2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import {
  getPublicStudentProfile,
  type PublicStudentProfile,
} from "@/lib/public-api";
import { formatMagizhStudentId } from "@/lib/student-id";

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

  const [profile, setProfile] = useState<PublicStudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchVerificationData() {
      try {
        setLoading(true);
        setError(null);
        const data = await getPublicStudentProfile(rawId);
        if (isMounted) {
          setProfile(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError("Student record not found in Magizh Credential Registry.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (rawId) {
      fetchVerificationData();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [rawId]);

  const studentName = profile?.full_name || "Magizh Student";
  const studentId = formatMagizhStudentId(profile?.magizh_student_id, rawId);
  const college = profile?.college || "Magizh Innovation Academy";
  const department = profile?.department || "Engineering & Technology";
  const year = profile?.year || 1;
  const status = profile?.status || "ACTIVE STUDENT";
  const isSuspended = status.toUpperCase().includes("SUSPEND");

  return (
    <div className="min-h-screen bg-black text-[#F5F3ED] flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center magizh-container py-16 px-4">
        <div className="w-full max-w-lg rounded-2xl border border-[#252525] bg-[#0A0A0A] p-7 sm:p-10 shadow-2xl relative">
          {/* Top Gold Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-80" />

          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#D4AF37]" />
              <p className="mt-4 text-xs uppercase tracking-widest text-[#A1A1A1]">
                Verifying Magizh Student Credential...
              </p>
            </div>
          ) : error ? (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#C75C5C]/40 bg-[#C75C5C]/10 text-[#C75C5C]">
                <ShieldAlert size={28} />
              </div>

              <h2 className="magizh-heading text-2xl font-bold text-[#F5F3ED]">
                Verification Failed
              </h2>

              <p className="text-xs text-[#A1A1A1] max-w-sm mx-auto">
                {error}
              </p>

              <div className="pt-4">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded border border-[#252525] bg-[#000000] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#A1A1A1] hover:text-[#F5F3ED] hover:border-[#D4AF37]"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="border-b border-[#252525] pb-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">
                    MAGIZH STUDENT VERIFICATION
                  </span>

                  <div
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      isSuspended
                        ? "border-[#C75C5C]/40 bg-[#C75C5C]/10 text-[#C75C5C]"
                        : "border-[#6FAF7B]/40 bg-[#6FAF7B]/10 text-[#6FAF7B]"
                    }`}
                  >
                    <ShieldCheck size={12} />
                    <span>{status}</span>
                  </div>
                </div>

                <h1 className="magizh-heading mt-4 text-3xl font-bold text-[#F5F3ED]">
                  {studentName}
                </h1>

                <div className="mt-2 inline-flex items-center gap-2 rounded border border-[#D4AF37]/30 bg-[#000000] px-3 py-1 font-mono text-xs font-bold tracking-[0.16em] text-[#D4AF37]">
                  {studentId}
                </div>
              </div>

              {/* Verified Details */}
              <div className="space-y-4 text-xs">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#A1A1A1]">
                    COLLEGE
                  </p>
                  <p className="mt-1 font-semibold text-sm text-[#F5F3ED]">
                    {college}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-[#252525] pt-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#A1A1A1]">
                      DEPARTMENT
                    </p>
                    <p className="mt-1 font-semibold text-[#F5F3ED]">
                      {department}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#A1A1A1]">
                      YEAR
                    </p>
                    <p className="mt-1 font-semibold text-[#F5F3ED]">
                      {year === 1 ? "1st Year" : year === 2 ? "2nd Year" : year === 3 ? "3rd Year" : `${year}th Year`}
                    </p>
                  </div>
                </div>

                {profile?.skills && profile.skills.length > 0 && (
                  <div className="border-t border-[#252525] pt-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#A1A1A1]">
                      SKILLS
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {profile.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded border border-[#252525] bg-[#000000] px-2.5 py-1 text-[11px] text-[#A1A1A1]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Registry Note */}
              <div className="border-t border-[#252525] pt-6 flex items-center justify-between text-[10px] text-[#A1A1A1]">
                <span>Official Magizh Credential Registry</span>
                <span className="font-mono text-[#D4AF37]">VERIFIED</span>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
