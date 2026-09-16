"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Clock,
  MapPin,
  Trophy,
  Users,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Radio,
  FileCode2,
  CheckCircle2,
  HelpCircle,
  Award,
} from "lucide-react";

import { useEvent } from "@/hooks/use-events";
import { useEventWebSocket } from "@/hooks/use-event-websocket";
import { getAccessToken } from "@/lib/auth";
import { getEventSponsors, type Sponsor } from "@/lib/sponsors-api";
import { getPublicRounds, type EventRound } from "@/lib/admin-rounds-api";
import { getRealtimeEventType, getRealtimeMessage } from "@/lib/realtime";
import type { WebSocketMessage } from "@/hooks/use-websocket";
import {
  getMyEventRegistration,
  type Registration,
} from "@/lib/registrations-api";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { EventRegistrationModal } from "@/components/events/event-registration-modal";
import { useAuth } from "@/providers/auth-provider";
import { HackerSnakeLoader, ErrorState } from "@/components/loading";

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, status } = useAuth();

  const eventId = params.event_id as string;

  const { data: event, isLoading, isError, refetch } = useEvent(eventId);

  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [rounds, setRounds] = useState<EventRound[]>([]);

  const [regModalOpen, setRegModalOpen] = useState(false);
  const [realtimeMessage, setRealtimeMessage] = useState("");
  const [myRegistration, setMyRegistration] = useState<Registration | null | undefined>(undefined);

  const handleRealtimeMessage = useCallback(
    (message: WebSocketMessage) => {
      const eventType = getRealtimeEventType(message);
      const messageText = getRealtimeMessage(message);

      setRealtimeMessage(messageText);

      if (
        eventType === "created" ||
        eventType === "updated" ||
        eventType === "deleted" ||
        eventType === "published" ||
        eventType === "status_changed"
      ) {
        queryClient.invalidateQueries({ queryKey: ["event", eventId] });
        queryClient.invalidateQueries({ queryKey: ["events"] });
      }
    },
    [eventId, queryClient],
  );

  const { connected: realtimeConnected } = useEventWebSocket(eventId, {
    enabled: Boolean(eventId && getAccessToken()),
    reconnect: true,
    reconnectDelay: 3000,
    onMessage: handleRealtimeMessage,
  });

  useEffect(() => {
    if (eventId) {
      getEventSponsors(eventId).then(setSponsors).catch(() => {});
      getPublicRounds(eventId).then(setRounds).catch(() => {});
    }
  }, [eventId]);

  // Check if user is already registered for this event
  useEffect(() => {
    if (eventId && status === "authenticated") {
      getMyEventRegistration(eventId)
        .then(setMyRegistration)
        .catch(() => setMyRegistration(null));
    } else if (status === "unauthenticated") {
      setMyRegistration(null);
    }
  }, [eventId, status]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <HackerSnakeLoader size="lg" message="SYNCHRONIZING EVENT TELEMETRY..." />
        </main>
        <Footer />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <Navbar />
        <main className="flex-1 magizh-container py-16">
          <ErrorState
            title="Event Not Found"
            message="This Magizh event may not exist or is currently restricted."
            onRetry={() => refetch()}
          />
        </main>
        <Footer />
      </div>
    );
  }

  function handleRegisterClick() {
    if (status !== "authenticated") {
      router.push(`/login?redirect=/events/${eventId}`);
      return;
    }
    setRegModalOpen(true);
  }

  return (
    <div className="min-h-screen bg-black text-[#F5F3ED] flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* ===================================================================== */}
        {/* EVENT HERO                                                            */}
        {/* ===================================================================== */}
        <section className="relative border-b border-[#252525] bg-[#070709] py-16 md:py-20">
          <div className="magizh-container">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-[#D4AF37]/50 bg-[#D4AF37]/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                  {event.event_type}
                </span>

                <span className="flex items-center gap-1.5 rounded-full border border-[#252525] bg-[#000000] px-3 py-1 text-[10px] font-mono text-[#A1A1A1]">
                  <span className={`h-1.5 w-1.5 rounded-full ${event.status === "ONGOING" ? "bg-[#6FAF7B] animate-pulse" : "bg-[#D4AF37]"}`} />
                  {event.status}
                </span>

                {realtimeConnected && (
                  <span className="flex items-center gap-1 text-[10px] font-mono text-[#6FAF7B]">
                    <Radio size={12} className="animate-pulse" /> LIVE SYNC
                  </span>
                )}
              </div>

              {/* Action Links */}
              <div className="flex items-center gap-3">
                <Link
                  href={`/events/${eventId}/teams`}
                  className="rounded border border-[#252525] bg-[#0A0A0A] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#F5F3ED] hover:border-[#D4AF37] hover:text-[#D4AF37]"
                >
                  Browse Event Teams
                </Link>
                <Link
                  href={`/events/${eventId}/results`}
                  className="rounded border border-[#252525] bg-[#0A0A0A] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#F5F3ED] hover:border-[#D4AF37] hover:text-[#D4AF37]"
                >
                  Leaderboard
                </Link>
              </div>
            </div>

            <h1 className="magizh-heading mt-6 text-4xl font-extrabold sm:text-5xl md:text-6xl text-[#F5F3ED]">
              {event.title}
            </h1>

            <p className="magizh-muted mt-4 max-w-3xl text-sm leading-relaxed md:text-base">
              {event.description}
            </p>


            {/* Quick Param Strip */}
            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-[#252525] pt-6 sm:grid-cols-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#A1A1A1]">DATES</span>
                <p className="mt-1 font-mono text-xs font-semibold text-[#F5F3ED]">
                  {event.start_date ? new Date(event.start_date).toLocaleDateString() : "TBA"} -{" "}
                  {event.end_date ? new Date(event.end_date).toLocaleDateString() : "TBA"}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#A1A1A1]">MODE</span>
                <p className="mt-1 font-mono text-xs font-semibold text-[#D4AF37]">
                  {event.mode} {event.location ? `(${event.location})` : ""}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#A1A1A1]">TEAM REQ</span>
                <p className="mt-1 font-mono text-xs font-semibold text-[#F5F3ED]">
                  {event.team_size_min} to {event.team_size_max} Members
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#A1A1A1]">PRIZE POOL</span>
                <p className="mt-1 font-mono text-xs font-bold text-[#D4AF37]">
                  {event.prize_pool || "Official Magizh Certificates"}
                </p>
              </div>
            </div>

            {/* Registration CTA Bar */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#D4AF37]/40 bg-[#0D0D0F] p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                  MAGIZH OFFICIAL CHALLENGE
                </p>
                <p className="text-xs text-[#A1A1A1]">
                  {myRegistration
                    ? "You are officially registered for this challenge."
                    : "Register using your permanent Magizh Student ID."}
                </p>
              </div>

              {myRegistration ? (
                <div className="flex items-center gap-2 rounded border border-[#6FAF7B]/50 bg-[#6FAF7B]/10 px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#6FAF7B]">
                  <CheckCircle2 size={16} />
                  {myRegistration.status === "WAITLISTED" ? "On Waitlist" : "Registered"}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleRegisterClick}
                  disabled={myRegistration === undefined}
                  className="rounded bg-[#D4AF37] px-8 py-3 text-xs font-bold uppercase tracking-[0.18em] text-black transition hover:bg-[#E5C04A] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {myRegistration === undefined ? "Checking..." : "Register for Challenge"}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* EVENT CONTENT (VERTICAL FLOW)                                         */}
        {/* ===================================================================== */}
        <div className="magizh-container py-12 md:py-16 space-y-12">
          {/* Section 1: Overview & Dates */}
          <section className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-8">
              <div className="magizh-card p-6 md:p-8">
                <h3 className="magizh-heading text-2xl font-bold text-[#F5F3ED]">
                  About the Event
                </h3>
                <div className="prose prose-invert mt-4 max-w-none text-xs leading-relaxed text-[#A1A1A1] space-y-4">
                  <p>{event.description || "Official challenge by Magizh Technologies."}</p>
                </div>
              </div>

              {/* Team & Collaboration */}
              <div className="magizh-card p-6 md:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37]">
                      COLLABORATION
                    </span>
                    <h3 className="text-xl font-bold text-[#F5F3ED]">
                      Event Teams
                    </h3>
                  </div>
                  <Link
                    href={`/events/${eventId}/teams`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#D4AF37] hover:underline"
                  >
                    Browse All Teams <ArrowRight size={13} />
                  </Link>
                </div>
                <p className="mt-2 text-xs text-[#A1A1A1]">
                  Teams are event-specific. You can join an existing open roster or create your own team as leader.
                </p>
              </div>
            </div>

            {/* Sidebar / Important Dates */}
            <div className="lg:col-span-4 space-y-6">
              <div className="magizh-card p-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                  IMPORTANT DATES
                </h4>
                <div className="mt-4 space-y-3 text-xs">
                  <div className="flex justify-between border-b border-[#252525] pb-2">
                    <span className="text-[#A1A1A1]">Registration Opens:</span>
                    <span className="font-mono">{event.created_at ? new Date(event.created_at).toLocaleDateString() : "Open"}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#252525] pb-2">
                    <span className="text-[#A1A1A1]">Event Starts:</span>
                    <span className="font-mono text-[#D4AF37]">{event.start_date ? new Date(event.start_date).toLocaleDateString() : "TBA"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A1A1A1]">Final Submissions:</span>
                    <span className="font-mono">{event.end_date ? new Date(event.end_date).toLocaleDateString() : "TBA"}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Problem Statements & Themes */}
          <section className="magizh-card p-6 md:p-8 space-y-6">
            <h3 className="magizh-heading text-2xl font-bold">
              Problem Statements & Themes
            </h3>
            <p className="text-xs text-[#A1A1A1] leading-relaxed">
              Build real-world solutions that demonstrate creativity, technical depth, and scalability. Participants are encouraged to submit working code, demo links, and architectural documentation.
            </p>
            <div className="rounded-xl border border-[#252525] bg-[#000000] p-6 space-y-3">
              <span className="font-mono text-xs font-bold text-[#D4AF37]">CHALLENGE THEMES:</span>
              <p className="text-xs text-[#F5F3ED]">
                Artificial Intelligence • Cloud & Distributed Systems • Web Innovation • Embedded & IoT
              </p>
            </div>
          </section>

          {/* Section 3: Timeline & Rounds */}
          <section className="magizh-card p-6 md:p-8">
            <h3 className="magizh-heading text-2xl font-bold mb-6">
              Event Rounds & Timeline
            </h3>
            {rounds.length === 0 ? (
              <p className="text-xs text-[#A1A1A1]">Official rounds will be published shortly before kickoff.</p>
            ) : (
              <div className="space-y-4">
                {rounds.map((r, idx) => (
                  <div key={r.id} className="rounded-lg border border-[#252525] bg-[#000000] p-4 flex justify-between items-center">
                    <div>
                      <span className="font-mono text-[10px] text-[#D4AF37]">ROUND {idx + 1}</span>
                      <h4 className="font-bold text-sm text-[#F5F3ED]">{r.title}</h4>
                    </div>
                    <span className="text-xs font-mono text-[#A1A1A1]">{r.status}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section 4: Prizes & Recognition */}
          <section className="magizh-card p-6 md:p-8">
            <h3 className="magizh-heading text-2xl font-bold">Prizes & Recognition</h3>
            <p className="mt-2 text-xs text-[#D4AF37] font-mono font-bold">
              {event.prize_pool || "Official Cash Awards & Verified Magizh Merit Certificates"}
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-[#D4AF37]/50 bg-[#000000] p-5 text-center">
                <Trophy size={28} className="mx-auto text-[#D4AF37]" />
                <h4 className="mt-3 font-bold text-sm">1st Place Winner</h4>
                <p className="text-xs text-[#A1A1A1] mt-1">Cash Award + Winner Badge</p>
              </div>
              <div className="rounded-xl border border-[#252525] bg-[#000000] p-5 text-center">
                <Award size={28} className="mx-auto text-[#A1A1A1]" />
                <h4 className="mt-3 font-bold text-sm">2nd Place Runner Up</h4>
                <p className="text-xs text-[#A1A1A1] mt-1">Certificate of Excellence</p>
              </div>
              <div className="rounded-xl border border-[#252525] bg-[#000000] p-5 text-center">
                <ShieldCheck size={28} className="mx-auto text-[#6FAF7B]" />
                <h4 className="mt-3 font-bold text-sm">All Finalists</h4>
                <p className="text-xs text-[#A1A1A1] mt-1">Official Magizh Certificate</p>
              </div>
            </div>
          </section>

          {/* Section 5: Rules & Eligibility */}
          <section className="magizh-card p-6 md:p-8 space-y-4">
            <h3 className="magizh-heading text-2xl font-bold">Rules & Eligibility</h3>
            <ul className="space-y-3 text-xs text-[#A1A1A1] list-disc pl-5 leading-relaxed">
              <li>All team members must hold an active, verified Magizh Student ID.</li>
              <li>Projects must be original work developed during the specified hackathon window.</li>
              <li>All submissions require a publicly accessible Git repository and working demo URL.</li>
              <li>Leadership changes and team rosters freeze upon final project submission.</li>
            </ul>
          </section>

          {/* Section 6: Ecosystem Partners & Sponsors */}
          <section className="magizh-card p-6 md:p-8">
            <h3 className="magizh-heading text-2xl font-bold mb-6">Ecosystem Partners & Sponsors</h3>
            {sponsors.length === 0 ? (
              <p className="text-xs text-[#A1A1A1]">Organized exclusively by Magizh Technologies.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                {sponsors.map((sp) => (
                  <div key={sp.id} className="rounded-lg border border-[#252525] bg-[#000000] p-4 text-center">
                    <p className="font-bold text-sm text-[#F5F3ED]">{sp.name}</p>
                    <span className="text-[10px] text-[#D4AF37] uppercase">Official Partner</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section 7: FAQ */}
          <section className="magizh-card p-6 md:p-8 space-y-6">
            <h3 className="magizh-heading text-2xl font-bold">Frequently Asked Questions</h3>
            <div className="space-y-4 text-xs">
              <div className="rounded-lg border border-[#252525] p-4">
                <h4 className="font-bold text-[#F5F3ED]">Can I participate as a solo developer?</h4>
                <p className="mt-1 text-[#A1A1A1]">
                  If minimum team size is 1, solo participation is allowed. Otherwise, browse the Event Teams page to find or invite teammates.
                </p>
              </div>
              <div className="rounded-lg border border-[#252525] p-4">
                <h4 className="font-bold text-[#F5F3ED]">How are certificates issued?</h4>
                <p className="mt-1 text-[#A1A1A1]">
                  Certificates are cryptographically issued to your Magizh Student ID immediately after official results are published.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />

      {/* REGISTRATION MODAL */}
      <EventRegistrationModal
        event={event}
        isOpen={regModalOpen}
        onClose={() => setRegModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["my-registrations"] });
          // Refresh local registration status so CTA updates immediately
          getMyEventRegistration(eventId)
            .then(setMyRegistration)
            .catch(() => setMyRegistration(null));
        }}
      />
    </div>
  );
}