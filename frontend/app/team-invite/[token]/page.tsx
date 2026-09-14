"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  CalendarDays,
  CheckCircle,
  Building2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "@/providers/auth-provider";
import { getInviteInfo, requestToJoinTeam, type InviteInfo } from "@/lib/teams-api";
import { getErrorMessage } from "@/lib/error-message";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { HackerSnakeLoader, ErrorState } from "@/components/loading";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function TeamInviteLandingPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;
  const router = useRouter();
  const { user, status } = useAuth();

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getInviteInfo(token)
      .then(setInvite)
      .catch((err) => {
        setError(getErrorMessage(err, "This team invite is expired or invalid."));
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  async function handleRequestToJoin() {
    if (!user) {
      router.push(`/login?redirect=/team-invite/${token}`);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await requestToJoinTeam(token);
      setSuccess(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to submit join request."));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <HackerSnakeLoader size="lg" message="VERIFYING TEAM INVITATION..." />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#F5F3ED] flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center magizh-container py-16 px-4">
        <div className="w-full max-w-lg rounded-2xl border border-[#252525] bg-[#0A0A0A] p-8 shadow-2xl">
          {success ? (
            <div className="text-center py-4">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#6FAF7B]/50 bg-[#6FAF7B]/10 text-[#6FAF7B]">
                <CheckCircle size={36} />
              </div>

              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#6FAF7B]">
                REQUEST SUBMITTED
              </span>

              <h2 className="magizh-heading mt-2 text-2xl font-bold">
                Join Request Dispatched
              </h2>

              <p className="magizh-muted mt-3 text-xs leading-relaxed">
                Your request to join <strong className="text-[#F5F3ED]">{invite?.team_name}</strong> has been transmitted to the team leader for review.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/dashboard/teams"
                  className="flex-1 rounded bg-[#D4AF37] py-2.5 text-center text-xs font-bold uppercase text-black hover:bg-[#E5C04A]"
                >
                  My Teams Dashboard
                </Link>
                <Link
                  href="/events"
                  className="flex-1 rounded border border-[#252525] bg-[#000000] py-2.5 text-center text-xs font-semibold uppercase text-[#A1A1A1] hover:text-[#F5F3ED]"
                >
                  Browse Events
                </Link>
              </div>
            </div>
          ) : error && !invite ? (
            <div className="text-center py-6">
              <ErrorState title="Invalid Invitation" message={error} />
              <Link
                href="/events"
                className="mt-6 inline-flex rounded bg-[#D4AF37] px-6 py-2.5 text-xs font-bold uppercase text-black"
              >
                Browse All Events
              </Link>
            </div>
          ) : invite ? (
            <div>
              <div className="text-center border-b border-[#252525] pb-6">
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#D4AF37]">
                  OFFICIAL TEAM INVITATION
                </span>

                <h1 className="magizh-heading mt-2 text-3xl font-extrabold">
                  {invite.team_name}
                </h1>

                <p className="magizh-muted mt-2 text-xs">
                  Invited to collaborate in <strong className="text-[#F5F3ED]">{invite.event.title}</strong>
                </p>
              </div>

              <div className="my-6 rounded-xl border border-[#252525] bg-[#000000] p-4 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#A1A1A1]">Event Mode:</span>
                  <span className="font-mono text-[#D4AF37]">{invite.event.mode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A1A1A1]">Current Roster:</span>
                  <span className="font-mono text-[#F5F3ED]">
                    {invite.member_count} / {invite.max_members} Members
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A1A1A1]">Status:</span>
                  <span className={`font-semibold ${invite.is_full ? "text-[#C75C5C]" : "text-[#6FAF7B]"}`}>
                    {invite.is_full ? "Team is Full" : "Open for Join Request"}
                  </span>
                </div>
              </div>

              {error && (
                <div className="mb-4 rounded border border-[#C75C5C]/40 bg-[#C75C5C]/10 p-3 text-xs text-[#C75C5C]">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleRequestToJoin}
                disabled={isSubmitting || invite.is_full}
                className="w-full flex items-center justify-center gap-2 rounded bg-[#D4AF37] py-3.5 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[#E5C04A] disabled:opacity-50"
              >
                {!user
                  ? "Login to Request Join"
                  : isSubmitting
                    ? "Dispatching Request..."
                    : "Request to Join Team"}
              </button>

              <p className="mt-4 text-center text-[10px] text-[#A1A1A1]">
                {user
                  ? "Submitting a join request requires event registration. The leader will review your profile."
                  : "Sign in with your verified Magizh Scholar identity to submit your candidate request."}
              </p>
            </div>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
}
