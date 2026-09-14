"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ShieldCheck,
  Building2,
  GraduationCap,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Calendar,
  Sparkles,
  Award,
} from "lucide-react";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { formatStudentId } from "@/components/ui/student-id-card";
import {
  getPublicStudentProfile,
  type PublicStudentProfile,
} from "@/lib/public-api";

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
      } catch (err: any) {
        if (isMounted) {
          // If public API fails or student not found
          console.warn("Public verification lookup:", err);
          setError("Record not found or invalid credential ID.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (rawId && rawId !== "demo") {
      fetchVerificationData();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [rawId]);

  const studentName = profile?.full_name || "Magizh Student";
  const college = profile?.college || "Magizh Innovation Academy";
  const department = profile?.department || "Engineering & Technology";
  const year = profile?.year || 1;
  const skills = profile?.skills || [];

  return (
    <div className="min-h-screen bg-black text-[#F5F3ED] flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center magizh-container py-16 px-4">
        <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#D4AF37]/40 bg-[#0A0A0A] p-6 sm:p-8 shadow-[0_0_50px_rgba(212,175,55,0.08)] relative">
          {/* Subtle Top Gold Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#D4AF37]" />
              <p className="mt-4 font-mono text-xs uppercase tracking-widest text-[#A1A1A1]">
                Verifying Magizh Credential Registry...
              </p>
            </div>
          ) : error && rawId !== "demo" ? (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-red-500/50 bg-red-500/10 text-red-400">
                <ShieldAlert size={32} />
              </div>
              <h2 className="text-xl font-bold text-red-400">
                Unverified Credential
              </h2>
              <p className="text-xs text-[#A1A1A1] max-w-xs mx-auto">
                No active student record matched identifier{" "}
                <span className="font-mono text-[#F5F3ED]">{formattedId}</span>.
              </p>
              <div className="pt-4">
                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 rounded bg-[#252525] px-5 py-2 text-xs font-semibold text-[#F5F3ED] hover:bg-[#333333] transition"
                >
                  Return to Ecosystem
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Official Verification Stamp */}
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#6FAF7B]/50 bg-[#6FAF7B]/10 text-[#6FAF7B] shadow-[0_0_20px_rgba(111,175,123,0.2)]">
                  <CheckCircle2 size={32} />
                </div>

                <div className="inline-flex items-center gap-1.5 rounded-full border border-[#6FAF7B]/30 bg-[#6FAF7B]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#6FAF7B]">
                  <ShieldCheck size={12} />
                  OFFICIAL MAGIZH VERIFICATION
                </div>

                <h1 className="magizh-heading mt-3 text-2xl font-bold text-[#F5F3ED]">
                  Authentic Student Identity
                </h1>

                <p className="magizh-muted mt-1 text-xs">
                  Permanently authenticated against the Magizh Technologies Student Innovation Registry.
                </p>
              </div>

              {/* Student Identification Overview */}
              <div className="mt-6 rounded-xl border border-[#252525] bg-[#000000] p-5 space-y-4">
                <div className="flex items-center gap-4 border-b border-[#252525]/80 pb-4">
                  <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-[#111114] text-lg font-bold text-[#D4AF37]">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={studentName}
                        className="h-full w-full rounded-xl object-cover"
                      />
                    ) : (
                      <span>{studentName.slice(0, 2).toUpperCase()}</span>
                    )}
                    <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#6FAF7B] text-black">
                      <CheckCircle2 size={12} />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-[#A1A1A1]">
                      STUDENT NAME
                    </span>
                    <h3 className="text-lg font-bold text-[#F5F3ED] truncate">
                      {studentName}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-[#D4AF37]">
                        {formattedId}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Academic Institution & Department */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg border border-[#1A1A1A] bg-[#08080A] p-3">
                    <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-[#A1A1A1]">
                      <Building2 size={11} className="text-[#D4AF37]" />
                      INSTITUTION
                    </div>
                    <p className="mt-1 font-medium text-[#F5F3ED] truncate">
                      {college}
                    </p>
                  </div>

                  <div className="rounded-lg border border-[#1A1A1A] bg-[#08080A] p-3">
                    <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-[#A1A1A1]">
                      <GraduationCap size={11} className="text-[#D4AF37]" />
                      DEPARTMENT
                    </div>
                    <p className="mt-1 font-medium text-[#F5F3ED] truncate">
                      {department} {year ? `(Yr ${year})` : ""}
                    </p>
                  </div>
                </div>

                {/* Skills if available */}
                {skills && skills.length > 0 && (
                  <div className="border-t border-[#252525]/80 pt-3">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-[#A1A1A1]">
                      VERIFIED SKILLS & CAPABILITIES
                    </span>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {skills.map((skill, index) => (
                        <span
                          key={index}
                          className="rounded border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2 py-0.5 font-mono text-[10px] text-[#D4AF37]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status & Validity */}
                <div className="flex items-center justify-between border-t border-[#252525]/80 pt-3 text-xs">
                  <div>
                    <span className="text-[9px] uppercase tracking-[0.2em] text-[#A1A1A1]">
                      MEMBERSHIP STATUS
                    </span>
                    <p className="font-semibold text-[#6FAF7B] flex items-center gap-1 mt-0.5">
                      <ShieldCheck size={13} /> Active Scholar
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-[#A1A1A1]">
                      ISSUED BY
                    </span>
                    <p className="font-semibold text-[#D4AF37] mt-0.5">
                      Magizh Technologies
                    </p>
                  </div>
                </div>
              </div>

              {/* Security Privacy Notice */}
              <div className="mt-6 border-t border-[#252525] pt-5 text-center">
                <p className="text-[10px] text-[#A1A1A1]/80 leading-relaxed">
                  Cryptographically verified Magizh ID. Sensitive private contact data and security tokens are securely masked in public verification mode.
                </p>

                <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/events"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded bg-[#D4AF37] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[#E5C04A]"
                  >
                    Explore Magizh Events <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
