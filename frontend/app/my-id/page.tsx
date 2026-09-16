"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Download,
  Share2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react";

import { useAuth } from "@/providers/auth-provider";
import { getMyProfile } from "@/lib/profile-api";
import type { Profile } from "@/types/auth";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { MagizhIdCard } from "@/components/student/MagizhIdCard";
import { formatMagizhStudentId } from "@/lib/student-id";

export default function MyIdPage() {
  const router = useRouter();
  const { user, status } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?redirect=/my-id");
      return;
    }

    if (status === "authenticated" && user) {
      getMyProfile()
        .then((p) => setProfile(p))
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [status, user, router]);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col text-[#F5F3ED]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-[#A1A1A1]">
            <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37]" />
            Loading your Magizh ID...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const studentId = formatMagizhStudentId(profile?.magizh_student_id, user?.id);
  const verifyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/student/verify/${encodeURIComponent(studentId)}`
      : `/student/verify/${encodeURIComponent(studentId)}`;

  function copyVerifyLink() {
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="min-h-screen bg-black text-[#F5F3ED] flex flex-col">
      <Navbar />

      <main className="flex-1 magizh-container py-12 md:py-16">
        {/* Header */}
        <div className="mb-12 text-center md:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
            <Sparkles size={13} />
            ONE STUDENT. ONE PERMANENT IDENTITY.
          </div>

          <h1 className="magizh-heading mt-4 text-4xl font-bold md:text-5xl">
            Official Magizh Student ID
          </h1>

          <p className="magizh-muted mt-3 max-w-2xl text-sm leading-relaxed">
            Your permanent digital identity across the Magizh Technologies platform. Reused across all Magizh events, team formations, and verified certificate credentials.
          </p>
        </div>

        {/* Layout Grid */}
        <div className="grid gap-12 lg:grid-cols-12 items-start">
          {/* Digital Card Preview */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <MagizhIdCard user={user} profile={profile} />

            <div className="mt-6 flex w-full max-w-[380px] items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex flex-1 items-center justify-center gap-2 rounded border border-[#252525] bg-[#0A0A0A] py-2.5 text-xs font-semibold uppercase tracking-wider text-[#F5F3ED] transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
              >
                <Download size={14} /> Print ID
              </button>

              <button
                type="button"
                onClick={copyVerifyLink}
                className="flex flex-1 items-center justify-center gap-2 rounded border border-[#D4AF37]/40 bg-[#D4AF37]/10 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-black"
              >
                <Share2 size={14} /> {copied ? "Copied!" : "Share QR Link"}
              </button>
            </div>
          </div>

          {/* Verification & Passport Info */}
          <div className="lg:col-span-6 space-y-6">
            <div className="rounded-xl border border-[#252525] bg-[#0A0A0A] p-6 md:p-8">
              <div className="flex items-center justify-between border-b border-[#252525] pb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37]">
                    IDENTITY RECORD
                  </p>
                  <h3 className="magizh-heading mt-1 text-xl font-bold">
                    Registry Details
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 rounded-full border border-[#6FAF7B]/40 bg-[#6FAF7B]/10 px-3 py-1 text-xs font-semibold text-[#6FAF7B]">
                  <ShieldCheck size={14} />
                  ACTIVE
                </div>
              </div>

              <div className="mt-6 space-y-4 text-xs">
                <div>
                  <span className="text-[#A1A1A1] uppercase tracking-wider">Assigned Magizh ID</span>
                  <p className="font-mono text-base font-bold text-[#D4AF37] mt-0.5">
                    {studentId}
                  </p>
                </div>

                <div className="border-t border-[#252525] pt-4">
                  <span className="text-[#A1A1A1] uppercase tracking-wider">Credential Holder</span>
                  <p className="font-semibold text-sm text-[#F5F3ED] mt-0.5">
                    {profile?.full_name || user?.email}
                  </p>
                </div>

                <div className="border-t border-[#252525] pt-4">
                  <span className="text-[#A1A1A1] uppercase tracking-wider">Institution</span>
                  <p className="text-[#F5F3ED] mt-0.5">
                    {profile?.college || "Magizh Innovation Academy"}
                  </p>
                </div>

                <div className="border-t border-[#252525] pt-4">
                  <span className="text-[#A1A1A1] uppercase tracking-wider">Public Verification URL</span>
                  <p className="font-mono text-[11px] text-[#A1A1A1] break-all mt-1">
                    {verifyUrl}
                  </p>
                </div>
              </div>

              <div className="mt-8 border-t border-[#252525] pt-6 flex items-center justify-between">
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D4AF37] hover:underline"
                >
                  Edit Profile Info <ArrowRight size={13} />
                </Link>

                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#A1A1A1] hover:text-[#F5F3ED]"
                >
                  Browse Events
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
