"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  QrCode,
  Share2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react";

import { useAuth } from "@/providers/auth-provider";
import { getMyProfile } from "@/lib/profile-api";
import type { Profile } from "@/types/auth";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { StudentIdCard, formatStudentId } from "@/components/ui/student-id-card";
import { CircularHudLoader, PageLoader } from "@/components/loading";

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
      <div className="min-h-screen bg-black flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <CircularHudLoader mode="session" message="INITIALIZING IDENTITY PASSPORT..." />
        </main>
        <Footer />
      </div>
    );
  }

  const studentId = formatStudentId(user?.id);
  const verifyUrl = typeof window !== "undefined" ? `${window.location.origin}/student/verify/${user?.id}` : `/student/verify/${user?.id}`;

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
            ONE IDENTITY. UNLIMITED INNOVATION.
          </div>

          <h1 className="magizh-heading mt-4 text-4xl font-bold md:text-5xl">
            Official Magizh Student ID
          </h1>

          <p className="magizh-muted mt-3 max-w-2xl text-sm leading-relaxed">
            Your permanent digital identity across the Magizh Technologies ecosystem. Use this verified passport to register for hackathons, join teams, and receive verified certificates.
          </p>
        </div>

        {/* Layout Grid */}
        <div className="grid gap-12 lg:grid-cols-12 items-start">
          {/* Digital Card Preview */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <StudentIdCard user={user} profile={profile} />

            <div className="mt-6 flex w-full max-w-md items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex flex-1 items-center justify-center gap-2 rounded border border-[#252525] bg-[#0A0A0A] py-2.5 text-xs font-semibold uppercase tracking-wider text-[#F5F3ED] transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
              >
                <Download size={14} /> Print / Save ID
              </button>

              <button
                type="button"
                onClick={copyVerifyLink}
                className="flex flex-1 items-center justify-center gap-2 rounded border border-[#D4AF37]/40 bg-[#D4AF37]/10 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-black"
              >
                <Share2 size={14} /> {copied ? "Link Copied!" : "Share Verification"}
              </button>
            </div>
          </div>

          {/* Verification & Passport Info */}
          <div className="lg:col-span-6 space-y-6">
            <div className="magizh-card p-6 md:p-8">
              <div className="flex items-center justify-between border-b border-[#252525] pb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37]">
                    IDENTITY RECORD
                  </p>
                  <h3 className="text-xl font-bold text-[#F5F3ED]">
                    Verification Status
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 rounded-full border border-[#6FAF7B]/40 bg-[#6FAF7B]/10 px-3 py-1 text-xs font-semibold text-[#6FAF7B]">
                  <CheckCircle2 size={14} /> ACTIVE & VERIFIED
                </div>
              </div>

              <div className="mt-6 space-y-4 text-sm">
                <div className="flex justify-between border-b border-[#252525]/60 pb-3">
                  <span className="text-[#A1A1A1]">Magizh Student ID</span>
                  <span className="font-mono font-bold text-[#D4AF37]">{studentId}</span>
                </div>

                <div className="flex justify-between border-b border-[#252525]/60 pb-3">
                  <span className="text-[#A1A1A1]">Primary Email</span>
                  <span className="font-mono text-[#F5F3ED]">{user?.email}</span>
                </div>

                <div className="flex justify-between border-b border-[#252525]/60 pb-3">
                  <span className="text-[#A1A1A1]">Institution</span>
                  <span className="text-[#F5F3ED]">
                    {profile?.college || user?.profile?.college || "Magizh Innovation Hub"}
                  </span>
                </div>

                <div className="flex justify-between border-b border-[#252525]/60 pb-3">
                  <span className="text-[#A1A1A1]">Department & Year</span>
                  <span className="text-[#F5F3ED]">
                    {profile?.department || "Technology"}{" "}
                    {profile?.year ? `(Year ${profile.year})` : ""}
                  </span>
                </div>

                <div className="flex justify-between pt-1">
                  <span className="text-[#A1A1A1]">Public Verification Link</span>
                  <Link
                    href={`/student/verify/${user?.id}`}
                    target="_blank"
                    className="flex items-center gap-1 text-xs text-[#D4AF37] hover:underline"
                  >
                    View Public Page <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Platform Philosophy Card */}
            <div className="rounded-xl border border-[#D4AF37]/30 bg-gradient-to-r from-[#D4AF37]/10 via-transparent to-transparent p-6">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                HOW MAGIZH IDENTITY WORKS
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-[#A1A1A1]">
                You do NOT need to create a new profile for every event. As you build teams, submit projects, and earn certificates across hackathons, your innovation portfolio grows automatically under this permanent ID.
              </p>

              <div className="mt-4 flex gap-3">
                <Link
                  href="/events"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37] hover:text-[#E5C04A]"
                >
                  Explore Current Events <ArrowRight size={13} />
                </Link>
                <span className="text-[#252525]">•</span>
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A1A1A1] hover:text-[#F5F3ED]"
                >
                  Edit Profile Information
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
