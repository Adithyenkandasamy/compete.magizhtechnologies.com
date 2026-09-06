"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  getTeamInvite,
  requestToJoinTeam,
  type TeamInvite,
} from "@/lib/teams-api";

import { getAccessToken } from "@/lib/auth";

export default function TeamInvitePage() {
  const params = useParams();
  const router = useRouter();

  const token = params.token as string;

  const [invite, setInvite] = useState<TeamInvite | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadInvite = useCallback(async () => {
    if (!token) {
      setError("Invalid invite link.");
      setIsLoading(false);
      return;
    }

    try {
      setError("");

      const data = await getTeamInvite(token);

      setInvite(data);
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        "This invite link is invalid or no longer available.";

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadInvite();
  }, [loadInvite]);

  async function handleJoinRequest() {
    setError("");
    setSuccess("");

    /*
     * The invite itself is public.
     * Requesting to join requires authentication.
     */
    if (!getAccessToken()) {
      const redirectPath = `/team-invites/${encodeURIComponent(
        token,
      )}`;

      router.push(
        `/login?redirect=${encodeURIComponent(redirectPath)}`,
      );

      return;
    }

    setIsJoining(true);

    try {
      const response = await requestToJoinTeam(token);

      setSuccess(
        response?.message ||
          "Your request to join the team has been sent successfully.",
      );
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        "Unable to send the join request.";

      setError(message);
    } finally {
      setIsJoining(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black px-5 py-20 text-[#F5F3ED]">
        <div className="magizh-container">
          <div className="magizh-card mx-auto max-w-xl p-8">
            <p className="magizh-muted text-sm">
              Loading invite...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-5 py-16 text-[#F5F3ED] md:py-24">
      <div className="magizh-container">
        <div className="mx-auto max-w-2xl">
          {/* Brand */}
          <div className="mb-12 text-center">
            <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.3em]">
              MAGIZH | INNOVATION
            </p>

            <h1 className="magizh-heading mt-5 text-4xl font-bold md:text-5xl">
              Team Invitation
            </h1>

            <p className="magizh-muted mx-auto mt-4 max-w-lg leading-7">
              You have been invited to join an innovation team.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded border border-[#C75C5C]/40 bg-[#C75C5C]/10 p-5">
              <p className="text-sm text-[#C75C5C]">
                {error}
              </p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-6 rounded border border-[#6FAF7B]/40 bg-[#6FAF7B]/10 p-5">
              <p className="text-sm leading-6 text-[#6FAF7B]">
                {success}
              </p>
            </div>
          )}

          {/* Invite Card */}
          {invite && (
            <div className="magizh-card overflow-hidden">
              {/* Card Header */}
              <div className="border-b border-[#252525] p-7 md:p-9">
                <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
                  YOU ARE INVITED
                </p>

                <h2 className="magizh-heading mt-4 text-3xl font-bold md:text-4xl">
                  {invite.team_name || "Innovation Team"}
                </h2>

                {invite.event_title && (
                  <div className="mt-5">
                    <p className="magizh-muted text-xs uppercase tracking-wider">
                      Event
                    </p>

                    <p className="mt-2 text-base">
                      {invite.event_title}
                    </p>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-4 p-7 md:p-9">
                {invite.status && (
                  <div className="flex items-center justify-between border-b border-[#252525] pb-4">
                    <span className="magizh-muted text-sm">
                      Invite Status
                    </span>

                    <span className="rounded border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
                      {invite.status}
                    </span>
                  </div>
                )}

                {invite.expires_at && (
                  <div className="flex items-center justify-between border-b border-[#252525] pb-4">
                    <span className="magizh-muted text-sm">
                      Expires
                    </span>

                    <span className="text-sm">
                      {new Date(
                        invite.expires_at,
                      ).toLocaleString()}
                    </span>
                  </div>
                )}

                {invite.team_id && (
                  <div className="border-b border-[#252525] pb-4">
                    <p className="magizh-muted text-xs uppercase tracking-wider">
                      Team ID
                    </p>

                    <p className="mt-2 break-all text-sm">
                      {invite.team_id}
                    </p>
                  </div>
                )}

                {invite.event_id && (
                  <div>
                    <p className="magizh-muted text-xs uppercase tracking-wider">
                      Event ID
                    </p>

                    <p className="mt-2 break-all text-sm">
                      {invite.event_id}
                    </p>
                  </div>
                )}

                {/* Join Button */}
                <div className="pt-5">
                  {!success ? (
                    <button
                      type="button"
                      onClick={handleJoinRequest}
                      disabled={isJoining}
                      className="magizh-button w-full py-4"
                    >
                      {isJoining
                        ? "Sending Request..."
                        : "Request to Join Team"}
                    </button>
                  ) : (
                    <Link
                      href="/dashboard/teams"
                      className="magizh-button w-full py-4"
                    >
                      Go to My Teams
                    </Link>
                  )}
                </div>

                {/* Login note */}
                {!getAccessToken() && (
                  <p className="magizh-muted text-center text-xs leading-5">
                    You will be asked to log in before your join
                    request is submitted.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Back */}
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-sm font-semibold uppercase tracking-wider text-[#D4AF37] transition-colors hover:text-[#E5C04A]"
            >
              ← Back to MAGIZH
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}