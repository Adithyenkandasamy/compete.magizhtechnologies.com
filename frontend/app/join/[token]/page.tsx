"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Users, CalendarDays, CheckCircle } from "lucide-react";

import { useAuth } from "@/providers/auth-provider";
import { getInviteInfo, requestToJoinTeam } from "@/lib/teams-api";
import type { InviteInfo } from "@/lib/teams-api";
import { getErrorMessage } from "@/lib/error-message";

export default function JoinTeamPage() {
  const params = useParams();
  const router = useRouter();
  const { user, status } = useAuth();

  const token = params.token as string;

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const loadInvite = useCallback(async () => {
    try {
      setError("");
      const info = await getInviteInfo(token);
      setInvite(info);
    } catch (err: unknown) {
      setError(
        getErrorMessage(err, "This invite link is invalid or has expired."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadInvite();
  }, [loadInvite]);

  async function handleJoin() {
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(`/join/${token}`)}`);
      return;
    }

    setError("");
    setIsRequesting(true);

    try {
      await requestToJoinTeam(token);
      setSuccess(true);
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "Unable to send join request.");
      setError(msg);
    } finally {
      setIsRequesting(false);
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-5 py-16">
        <p className="magizh-muted">Loading invite...</p>
      </main>
    );
  }

  if (error && !invite) {
    return (
      <main className="min-h-screen flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-md magizh-card p-10 text-center">
          <p className="text-[#C75C5C] text-sm">{error}</p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex text-sm font-semibold uppercase tracking-wider text-[#D4AF37] hover:text-[#E5C04A]"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-lg">
        {success ? (
          <div className="magizh-card p-10 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-[#6FAF7B]/40 bg-[#6FAF7B]/10">
              <CheckCircle size={28} className="text-[#6FAF7B]" />
            </div>

            <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.25em]">
              REQUEST SENT
            </p>

            <h1 className="magizh-heading mt-3 text-3xl font-bold">
              Join Request Submitted
            </h1>

            <p className="magizh-muted mt-4 text-sm leading-6">
              Your request to join <strong>{invite?.team_name}</strong> has
              been sent. The team leader will review and accept your request.
            </p>

            <Link
              href="/dashboard/teams"
              className="magizh-button mt-8 inline-flex"
            >
              Go to My Teams
            </Link>
          </div>
        ) : invite ? (
          <div className="magizh-card p-10">
            <div className="text-center">
              <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.25em]">
                TEAM INVITE
              </p>

              <h1 className="magizh-heading mt-3 text-3xl font-bold">
                {invite.team_name}
              </h1>

              <p className="magizh-muted mt-3 text-sm">
                You&apos;ve been invited to join this team.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <div className="rounded border border-[#252525] bg-[#0A0A0A] p-4">
                <div className="flex items-center gap-3">
                  <CalendarDays
                    size={16}
                    className="text-[#D4AF37]"
                  />
                  <div>
                    <p className="magizh-muted text-[10px] uppercase tracking-wider">
                      Event
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {invite.event.title}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded border border-[#252525] bg-[#0A0A0A] p-4">
                <div className="flex items-center gap-3">
                  <CalendarDays
                    size={16}
                    className="text-[#D4AF37]"
                  />
                  <div>
                    <p className="magizh-muted text-[10px] uppercase tracking-wider">
                      Mode
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {invite.event.mode}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded border border-[#252525] bg-[#0A0A0A] p-4">
                <div className="flex items-center gap-3">
                  <Users
                    size={16}
                    className="text-[#D4AF37]"
                  />
                  <div>
                    <p className="magizh-muted text-[10px] uppercase tracking-wider">
                      Team Size
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {invite.member_count} / {invite.max_members}{" "}
                      {invite.member_count === invite.max_members
                        ? "(Team Full)"
                        : "members"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-6 rounded border border-[#C75C5C]/40 bg-[#C75C5C]/10 px-4 py-3">
                <p className="text-sm text-[#C75C5C]">{error}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleJoin}
              disabled={isRequesting || invite.is_full || (!user && status === "loading")}
              className="magizh-button mt-8 w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRequesting
                ? "Sending Request..."
                : invite.is_full
                  ? "Team is Full"
                  : !user
                    ? "Login to Join This Team"
                    : "Request to Join"}
            </button>

            {!user && status === "unauthenticated" && (
              <p className="magizh-muted mt-4 text-center text-xs">
                You are not logged in. Click the button above to sign in and
                submit your join request to this team.
              </p>
            )}

            {user && (
              <p className="magizh-muted mt-4 text-center text-xs">
                You must be registered for this event to join the team.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </main>
  );
}
