"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
  acceptJoinRequest,
  getJoinRequests,
  rejectJoinRequest,
} from "@/lib/team-invites-api";
import type { JoinRequest } from "@/lib/team-invites-api";

export default function TeamJoinRequestsPage() {
  const params = useParams();

  const teamId = params.team_id as string;

  const [requests, setRequests] = useState<JoinRequest[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [processingRequestId, setProcessingRequestId] = useState<
    string | null
  >(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadRequests() {
    try {
      setError("");

      const data = await getJoinRequests(teamId);

      setRequests(data);
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        "Unable to load join requests.";

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (teamId) {
      loadRequests();
    }
  }, [teamId]);

  async function handleAccept(requestId: string) {
    setError("");
    setSuccess("");
    setProcessingRequestId(requestId);

    try {
      await acceptJoinRequest(teamId, requestId);

      setSuccess("Join request accepted successfully.");

      await loadRequests();
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        "Unable to accept this join request.";

      setError(message);
    } finally {
      setProcessingRequestId(null);
    }
  }

  async function handleReject(requestId: string) {
    setError("");
    setSuccess("");
    setProcessingRequestId(requestId);

    try {
      await rejectJoinRequest(teamId, requestId);

      setSuccess("Join request rejected successfully.");

      await loadRequests();
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        "Unable to reject this join request.";

      setError(message);
    } finally {
      setProcessingRequestId(null);
    }
  }

  return (
    <main className="magizh-container py-12 md:py-16">
      <div className="mb-10">
        <Link
          href={`/dashboard/teams/${teamId}`}
          className="text-sm font-semibold uppercase tracking-wider text-[#D4AF37] transition-colors hover:text-[#E5C04A]"
        >
          ← Back to Team
        </Link>

        <p className="magizh-gold mt-8 text-xs font-semibold uppercase tracking-[0.25em]">
          TEAM MANAGEMENT
        </p>

        <h1 className="magizh-heading mt-3 text-4xl font-bold md:text-5xl">
          Join Requests
        </h1>

        <p className="magizh-muted mt-4 max-w-2xl">
          Review students who have requested to join your team.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded border border-[#C75C5C]/40 bg-[#C75C5C]/10 px-4 py-3">
          <p className="text-sm text-[#C75C5C]">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 rounded border border-[#6FAF7B]/40 bg-[#6FAF7B]/10 px-4 py-3">
          <p className="text-sm text-[#6FAF7B]">{success}</p>
        </div>
      )}

      {isLoading ? (
        <div className="magizh-card p-10 text-center">
          <p className="magizh-muted">Loading join requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="magizh-card p-10 text-center">
          <p className="magizh-heading text-2xl font-bold">
            No join requests
          </p>

          <p className="magizh-muted mt-3">
            There are currently no requests waiting for your review.
          </p>
        </div>
      ) : (
        <section className="space-y-4">
          {requests.map((request) => {
            const isProcessing =
              processingRequestId === request.id;

            const status = request.status.toUpperCase();

            return (
              <article
                key={request.id}
                className="magizh-card p-6"
              >
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
                      JOIN REQUEST
                    </p>

                    <h2 className="magizh-heading mt-2 text-xl font-bold">
                      User Request
                    </h2>

                    <div className="mt-4 space-y-2 text-sm">
                      <p>
                        <span className="magizh-muted">
                          User ID:{" "}
                        </span>

                        <span className="break-all">
                          {request.user_id}
                        </span>
                      </p>

                      <p>
                        <span className="magizh-muted">
                          Request ID:{" "}
                        </span>

                        <span className="break-all">
                          {request.id}
                        </span>
                      </p>

                      <p>
                        <span className="magizh-muted">
                          Created:{" "}
                        </span>

                        {new Date(
                          request.created_at,
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-4 md:items-end">
                    <span
                      className={`rounded border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                        status === "PENDING"
                          ? "border-[#D4AF37]/40 text-[#D4AF37]"
                          : status === "ACCEPTED"
                            ? "border-[#6FAF7B]/40 text-[#6FAF7B]"
                            : "border-[#C75C5C]/40 text-[#C75C5C]"
                      }`}
                    >
                      {status}
                    </span>

                    {status === "PENDING" && (
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            handleAccept(request.id)
                          }
                          disabled={isProcessing}
                          className="magizh-button disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isProcessing
                            ? "Processing..."
                            : "Accept"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleReject(request.id)
                          }
                          disabled={isProcessing}
                          className="rounded border border-[#C75C5C]/50 px-5 py-3 text-sm font-semibold text-[#C75C5C] transition-colors hover:bg-[#C75C5C]/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isProcessing
                            ? "Processing..."
                            : "Reject"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}