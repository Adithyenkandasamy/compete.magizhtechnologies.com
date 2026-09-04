"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  getTeamInvite,
  requestToJoinTeam,
} from "@/lib/team-invites-api";
import { getAccessToken } from "@/lib/auth";
import type { TeamInvite } from "@/lib/team-invites-api";

export default function TeamInvitePage() {
  const params = useParams();
  const router = useRouter();

  const token = params.token as string;

  const [invite, setInvite] = useState<TeamInvite | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadInvite() {
      try {
        setError("");

        const data = await getTeamInvite(token);
        setInvite(data);
      } catch (err: any) {
        const message =
          err?.response?.data?.detail ||
          "This team invitation is invalid or has expired.";

        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    if (token) {
      loadInvite();
    }
  }, [token]);

  async function handleJoinRequest() {
    setError("");
    setSuccess("");

    const accessToken = getAccessToken();

    if (!accessToken) {
      router.push(
        `/login?redirect=/team-invites/${encodeURIComponent(token)}`,
      );
      return;
    }

    setIsRequesting(true);

    try {
      await requestToJoinTeam(token);

      setSuccess(
        "Your request to join the team has been sent successfully.",
      );
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        "Unable to send your join request.";

      setError(message);
    } finally {
      setIsRequesting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-5 py-16">
        <p className="magizh-muted">
          Loading invitation...
        </p>
      </main>
    );
  }

  if (!invite) {
    return (
      <main className="min-h-screen flex items-center justify-center px-5 py-16">
        <div className="magizh-card w-full max-w-lg p-8 text-center">
          <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.25em]">
            TEAM INVITATION
          </p>

          <h1 className="magizh-heading mt-4 text-3xl font-bold">
            Invitation unavailable
          </h1>

          <p className="mt-4 text-sm text-[#C75C5C]">
            {error ||
              "This invitation could not be loaded."}
          </p>

          <Link
            href="/events"
            className="magizh-button mt-7"
          >
            Explore Events
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.3em]">
            MAGIZH TECHNOLOGIES
          </p>

          <h1 className="magizh-heading mt-4 text-4xl font-bold">
            Team Invitation
          </h1>

          <p className="magizh-muted mt-3">
            You have been invited to join a Magizh Technologies team.
          </p>
        </div>

        <div className="magizh-card p-7 md:p-8">
          <p className="magizh-muted text-xs uppercase tracking-[0.2em]">
            TEAM
          </p>

          <h2 className="magizh-heading mt-2 text-3xl font-bold">
            {invite.team_name || "Innovation Team"}
          </h2>

          {invite.event_id && (
            <div className="mt-6 rounded border border-[#252525] bg-[#0A0A0A] p-4">
              <p className="magizh-muted text-xs uppercase tracking-wider">
                Event ID
              </p>

              <p className="mt-2 break-all text-sm">
                {invite.event_id}
              </p>
            </div>
          )}

          {invite.expires_at && (
            <div className="mt-4 rounded border border-[#252525] bg-[#0A0A0A] p-4">
              <p className="magizh-muted text-xs uppercase tracking-wider">
                Invitation Expires
              </p>

              <p className="mt-2 text-sm">
                {new Date(
                  invite.expires_at,
                ).toLocaleString()}
              </p>
            </div>
          )}

          {error && (
            <div className="mt-6 rounded border border-[#C75C5C]/40 bg-[#C75C5C]/10 px-4 py-3">
              <p className="text-sm text-[#C75C5C]">
                {error}
              </p>
            </div>
          )}

          {success && (
            <div className="mt-6 rounded border border-[#6FAF7B]/40 bg-[#6FAF7B]/10 px-4 py-3">
              <p className="text-sm text-[#6FAF7B]">
                {success}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleJoinRequest}
            disabled={isRequesting || Boolean(success)}
            className="magizh-button mt-7 w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRequesting
              ? "Sending Request..."
              : success
                ? "Request Sent"
                : "Request to Join Team"}
          </button>

          <p className="magizh-muted mt-4 text-center text-xs leading-5">
            You may need to sign in before sending a join request.
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/events"
            className="text-sm font-semibold uppercase tracking-wider text-[#D4AF37] transition-colors hover:text-[#E5C04A]"
          >
            ← Explore Events
          </Link>
        </div>
      </div>
    </main>
  );
}