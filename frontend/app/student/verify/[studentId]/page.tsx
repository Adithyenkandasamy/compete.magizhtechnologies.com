"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import {
  getPublicStudentProfile,
  type PublicStudentProfile,
} from "@/lib/public-api";
import { MagizhIdCard } from "@/components/student/MagizhIdCard";

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

  const department = profile?.department || "Engineering & Technology";
  const year = profile?.year || 1;

  return (
    <div className="min-h-screen bg-black text-[#F5F3ED] flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center magizh-container py-16 px-4">
        {loading ? (
          <div className="w-full max-w-md rounded-2xl border border-[#252525] bg-[#0A0A0A] p-12 text-center shadow-2xl">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#D4AF37]" />
            <p className="mt-4 text-xs uppercase tracking-widest text-[#A1A1A1]">
              Verifying Magizh Student Credential...
            </p>
          </div>
        ) : error || !profile ? (
          <div className="w-full max-w-md rounded-2xl border border-[#252525] bg-[#0A0A0A] p-8 text-center space-y-4 shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#C75C5C]/40 bg-[#C75C5C]/10 text-[#C75C5C]">
              <ShieldAlert size={28} />
            </div>

            <h2 className="magizh-heading text-2xl font-bold text-[#F5F3ED]">
              Verification Failed
            </h2>

            <p className="text-xs text-[#A1A1A1] max-w-sm mx-auto">
              {error || "Student credential could not be verified."}
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
          <div className="w-full max-w-md flex flex-col items-center">
            {/* Top Verification Status Badge */}
            <div className="w-full text-center mb-6 space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#6FAF7B]/40 bg-[#6FAF7B]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#6FAF7B] shadow-[0_0_20px_rgba(111,175,123,0.2)]">
                <ShieldCheck size={16} />
                <span>Verified Student Credential</span>
              </div>
              <h1 className="magizh-heading text-2xl sm:text-3xl font-bold text-[#F5F3ED]">
                Official Magizh Identity
              </h1>
              <p className="text-xs text-[#A1A1A1]">
                Authenticated against Magizh Technologies Credential Registry
              </p>
            </div>

            {/* The Official Magizh ID Card */}
            <MagizhIdCard
              publicProfile={profile}
              isVerifiedScan={true}
              className="border-[#D4AF37]/50 shadow-[0_0_40px_rgba(212,175,55,0.12)]"
            />

            {/* Additional Verified Registry Metadata */}
            <div className="w-full mt-6 rounded-xl border border-[#252525] bg-[#0A0A0A] p-5 text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#252525] pb-2.5">
                <span className="text-[#A1A1A1]">Department:</span>
                <span className="font-semibold text-[#F5F3ED]">{department}</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#252525] pb-2.5">
                <span className="text-[#A1A1A1]">Academic Year:</span>
                <span className="font-mono text-[#D4AF37]">
                  {year === 1 ? "1st Year" : year === 2 ? "2nd Year" : year === 3 ? "3rd Year" : `${year}th Year`}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[#252525] pb-2.5">
                <span className="text-[#A1A1A1]">Identity Registry:</span>
                <span className="font-mono text-[#6FAF7B] font-semibold">AUTHENTIC & ACTIVE</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[#A1A1A1]">Registered Since:</span>
                <span className="font-mono text-[#A1A1A1]">
                  {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "Active Member"}
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#D4AF37] hover:underline"
              >
                Explore Magizh Platform <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
