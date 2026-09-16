"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  FolderGit2,
  IdCard,
  Plus,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  ArrowRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/providers/auth-provider";
import { getMyProfile } from "@/lib/profile-api";
import { getMyRegistrations } from "@/lib/registrations-api";
import { getMyCertificates } from "@/lib/certificates-api";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { MagizhIdModal } from "@/components/student/MagizhIdModal";
import { formatMagizhStudentId } from "@/lib/student-id";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, status } = useAuth();
  const [idModalOpen, setIdModalOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?redirect=/dashboard");
    }
  }, [status, router]);

  // Queries
  const { data: profile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: getMyProfile,
    enabled: status === "authenticated",
  });

  const { data: registrations = [], isLoading: regsLoading } = useQuery({
    queryKey: ["my-registrations"],
    queryFn: getMyRegistrations,
    enabled: status === "authenticated",
  });

  const { data: certificatesData } = useQuery({
    queryKey: ["my-certificates"],
    queryFn: () => getMyCertificates(),
    enabled: status === "authenticated",
  });

  if (status === "loading" || !user) {
    return (
      <div className="min-h-screen bg-black flex flex-col text-[#F5F3ED]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-[#A1A1A1]">
            <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37]" />
            Loading dashboard...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const displayName = profile?.full_name || user.profile?.full_name || user.email.split("@")[0];
  const studentId = formatMagizhStudentId(profile?.magizh_student_id, user.id);
  const certificates = Array.isArray(certificatesData) ? certificatesData : [];

  // Greeting time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="min-h-screen bg-black text-[#F5F3ED] flex flex-col">
      <Navbar />

      <main className="flex-1 magizh-container py-12 md:py-16">
        {/* ===================================================================== */}
        {/* 1. HERO GREETING & PASSPORT SUMMARY                                   */}
        {/* ===================================================================== */}
        <section className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#252525] pb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#6FAF7B]" />
              <span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
                YOUR MAGIZH JOURNEY
              </span>
            </div>

            <h1 className="magizh-heading mt-3 text-3xl font-extrabold sm:text-4xl md:text-5xl">
              {greeting}, {displayName}.
            </h1>

            <p className="magizh-muted mt-2 text-xs">
              Verified Scholar Passport <span className="font-mono font-bold text-[#D4AF37]">{studentId}</span> • {profile?.college || "Magizh Innovation Hub"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIdModalOpen(true)}
              className="flex items-center gap-2 rounded border border-[#D4AF37]/50 bg-[#D4AF37]/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-black"
            >
              <IdCard size={15} />
              View My ID
            </button>

            <Link
              href="/events"
              className="flex items-center gap-2 rounded bg-[#D4AF37] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[#E5C04A]"
            >
              <Plus size={15} />
              Discover Events
            </Link>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* 2. PERSONAL METRICS TILES                                             */}
        {/* ===================================================================== */}
        <section className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="magizh-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-[#A1A1A1]">
                EVENTS JOINED
              </span>
              <Calendar size={14} className="text-[#D4AF37]" />
            </div>
            <p className="font-mono mt-3 text-2xl font-bold text-[#F5F3ED] md:text-3xl">
              {registrations.length}
            </p>
          </div>

          <div className="magizh-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-[#A1A1A1]">
                MY TEAMS
              </span>
              <Users size={14} className="text-[#D4AF37]" />
            </div>
            <p className="font-mono mt-3 text-2xl font-bold text-[#F5F3ED] md:text-3xl">
              {registrations.length > 0 ? registrations.length : 0}
            </p>
          </div>

          <div className="magizh-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-[#A1A1A1]">
                PROJECTS
              </span>
              <FolderGit2 size={14} className="text-[#D4AF37]" />
            </div>
            <p className="font-mono mt-3 text-2xl font-bold text-[#F5F3ED] md:text-3xl">
              {registrations.length > 0 ? 1 : 0}
            </p>
          </div>

          <div className="magizh-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-[#A1A1A1]">
                CERTIFICATES
              </span>
              <Trophy size={14} className="text-[#D4AF37]" />
            </div>
            <p className="font-mono mt-3 text-2xl font-bold text-[#D4AF37] md:text-3xl">
              {certificates.length}
            </p>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* 3. CORE ECOSYSTEM HUBS                                                */}
        {/* ===================================================================== */}
        <section className="grid gap-8 lg:grid-cols-12">
          {/* Main Workspaces (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* My Active Events Hub */}
            <div className="magizh-card p-6 md:p-8">
              <div className="flex items-center justify-between border-b border-[#252525] pb-4">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37]">
                    ACTIVE PARTICIPATION
                  </span>
                  <h3 className="text-xl font-bold text-[#F5F3ED]">
                    My Registered Events
                  </h3>
                </div>

                <Link
                  href="/dashboard/events"
                  className="text-xs uppercase tracking-wider text-[#D4AF37] hover:underline"
                >
                  View All →
                </Link>
              </div>

              {registrations.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-[#A1A1A1]">
                    You haven&apos;t registered for any active events yet.
                  </p>
                  <Link
                    href="/events"
                    className="mt-4 inline-flex items-center gap-1.5 rounded bg-[#D4AF37] px-5 py-2 text-xs font-bold uppercase tracking-wider text-black"
                  >
                    Browse Magizh Events <ArrowRight size={13} />
                  </Link>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {registrations.slice(0, 3).map((reg) => (
                    <div
                      key={reg.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-[#252525] bg-[#000000] p-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-[#6FAF7B]/10 px-2 py-0.5 text-[9px] font-bold text-[#6FAF7B]">
                            {reg.status}
                          </span>
                          <span className="text-xs font-mono text-[#A1A1A1]">
                            Reg #{reg.id.slice(0, 8)}
                          </span>
                        </div>
                        <h4 className="mt-1 font-semibold text-[#F5F3ED]">
                          Registered Event
                        </h4>
                      </div>

                      <div className="flex items-center gap-3">
                        <Link
                          href={`/events/${reg.event_id}`}
                          className="rounded border border-[#252525] bg-[#0A0A0A] px-3.5 py-1.5 text-xs text-[#F5F3ED] hover:border-[#D4AF37]"
                        >
                          Event Details
                        </Link>
                        <Link
                          href={`/events/${reg.event_id}/teams`}
                          className="rounded bg-[#D4AF37]/10 border border-[#D4AF37]/40 px-3.5 py-1.5 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black"
                        >
                          Event Teams
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Navigation Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Link
                href="/dashboard/teams"
                className="magizh-card group p-5 transition-colors hover:border-[#D4AF37]"
              >
                <Users size={18} className="text-[#D4AF37]" />
                <h4 className="mt-3 font-bold text-[#F5F3ED] group-hover:text-[#D4AF37]">
                  My Teams
                </h4>
                <p className="magizh-muted mt-1 text-xs">
                  Collaborate and manage event rosters.
                </p>
              </Link>

              <Link
                href="/dashboard/projects"
                className="magizh-card group p-5 transition-colors hover:border-[#D4AF37]"
              >
                <FolderGit2 size={18} className="text-[#D4AF37]" />
                <h4 className="mt-3 font-bold text-[#F5F3ED] group-hover:text-[#D4AF37]">
                  My Projects
                </h4>
                <p className="magizh-muted mt-1 text-xs">
                  Working repositories & demos.
                </p>
              </Link>

              <Link
                href="/certificates"
                className="magizh-card group p-5 transition-colors hover:border-[#D4AF37]"
              >
                <Trophy size={18} className="text-[#D4AF37]" />
                <h4 className="mt-3 font-bold text-[#F5F3ED] group-hover:text-[#D4AF37]">
                  Certificates
                </h4>
                <p className="magizh-muted mt-1 text-xs">
                  Verifiable cryptographic awards.
                </p>
              </Link>
            </div>
          </div>

          {/* Sidebar Telemetry & Identity (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Magizh Passport Quick Widget */}
            <div className="rounded-xl border border-[#D4AF37]/40 bg-gradient-to-b from-[#0D0D0F] to-[#050505] p-6 shadow-[0_0_20px_rgba(212,175,55,0.06)]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#D4AF37]">
                  MAGIZH PASSPORT
                </span>
                <span className="rounded-full bg-[#6FAF7B]/10 px-2 py-0.5 text-[9px] font-bold text-[#6FAF7B]">
                  VERIFIED
                </span>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#D4AF37]/40 bg-black font-bold text-[#D4AF37]">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-[#F5F3ED]">{displayName}</h4>
                  <p className="font-mono text-xs text-[#D4AF37]">{studentId}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2 border-t border-[#252525] pt-4">
                <button
                  type="button"
                  onClick={() => setIdModalOpen(true)}
                  className="w-full rounded border border-[#252525] bg-[#000000] py-2 text-xs font-semibold uppercase tracking-wider text-[#F5F3ED] hover:border-[#D4AF37]"
                >
                  Open Smart ID Card
                </button>
                <Link
                  href="/my-id"
                  className="text-center text-xs text-[#A1A1A1] hover:text-[#D4AF37]"
                >
                  Dedicated Passport Page →
                </Link>
              </div>
            </div>

            {/* Recent Notifications / Activity */}
            <div className="magizh-card p-6">
              <div className="flex items-center justify-between border-b border-[#252525] pb-3">
                <span className="text-[10px] uppercase tracking-wider text-[#A1A1A1]">
                  PLATFORM ACTIVITY
                </span>
                <Activity size={13} className="text-[#D4AF37]" />
              </div>

              <ul className="mt-4 space-y-3 text-xs">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={13} className="mt-0.5 text-[#6FAF7B]" />
                  <div>
                    <p className="font-medium text-[#F5F3ED]">
                      Identity authenticated
                    </p>
                    <span className="text-[10px] text-[#A1A1A1]">
                      Permanent student ID active
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <Sparkles size={13} className="mt-0.5 text-[#D4AF37]" />
                  <div>
                    <p className="font-medium text-[#F5F3ED]">
                      Connected to Magizh Ecosystem
                    </p>
                    <span className="text-[10px] text-[#A1A1A1]">
                      Real-time updates enabled
                    </span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* ID MODAL POPUP */}
      <MagizhIdModal isOpen={idModalOpen} onClose={() => setIdModalOpen(false)} />
    </div>
  );
}