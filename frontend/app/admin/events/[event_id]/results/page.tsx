"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import {
  getAdminEventResults,
  publishAdminEventResults,
  type AdminResult,
} from "@/lib/admin-results-api";

export default function AdminEventResultsPage() {
  const params = useParams();
  const eventId = params.event_id as string;

  const [results, setResults] = useState<AdminResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadResults() {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminEventResults(eventId);
      setResults(data);
    } catch (err) {
      console.error("Unable to load results:", err);
      setError("Unable to load event results.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (eventId) {
      loadResults();
    }
  }, [eventId]);

  async function handlePublish() {
    const confirmed = window.confirm(
      "Are you sure you want to publish these results?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setPublishing(true);
      setError("");
      setSuccess("");

      const data = await publishAdminEventResults(eventId);

      setResults(data);
      setSuccess("Event results published successfully.");
    } catch (err) {
      console.error("Unable to publish results:", err);
      setError("Unable to publish event results.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <main className="min-h-screen bg-black">
      <section className="magizh-container py-12 md:py-20">
        <Link
          href={`/admin/events/${eventId}`}
          className="text-sm font-semibold text-[#A1A1A1] transition-colors hover:text-[#D4AF37]"
        >
          ← Back to Event
        </Link>

        <div className="mt-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.3em]">
              ADMINISTRATION
            </p>

            <h1 className="magizh-heading mt-4 text-4xl font-bold leading-tight md:text-6xl">
              Event Results
            </h1>

            <p className="magizh-muted mt-4 max-w-2xl leading-7">
              Review the results for this event and publish them when
              they are ready.
            </p>
          </div>

          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing || loading}
            className="magizh-button disabled:cursor-not-allowed disabled:opacity-50"
          >
            {publishing ? "Publishing..." : "Publish Results"}
          </button>
        </div>

        <div className="mt-8 rounded border border-[#252525] bg-[#0A0A0A] p-5">
          <p className="magizh-muted text-xs font-semibold uppercase tracking-[0.2em]">
            Event ID
          </p>

          <p className="mt-2 break-all text-sm text-[#F5F3ED]">
            {eventId}
          </p>
        </div>

        {error && (
          <div className="magizh-card mt-6 border-[#C75C5C] p-6">
            <p className="text-[#C75C5C]">{error}</p>
          </div>
        )}

        {success && (
          <div className="magizh-card mt-6 border-[#6FAF7B] p-6">
            <p className="text-[#6FAF7B]">{success}</p>
          </div>
        )}

        {loading && (
          <div className="magizh-card mt-8 p-8">
            <p className="magizh-muted">Loading results...</p>
          </div>
        )}

        {!loading && !error && results.length === 0 && (
          <div className="magizh-card mt-8 p-10 text-center">
            <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.25em]">
              RESULTS
            </p>

            <h2 className="magizh-heading mt-3 text-2xl font-bold">
              No results found
            </h2>

            <p className="magizh-muted mx-auto mt-3 max-w-lg leading-7">
              Results will appear here once submissions have been
              evaluated and results are available.
            </p>
          </div>
        )}

        {!loading && !error && results.length > 0 && (
          <div className="mt-8 overflow-hidden rounded-lg border border-[#252525]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr className="border-b border-[#252525] bg-[#0A0A0A]">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#A1A1A1]">
                      Rank
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#A1A1A1]">
                      Project
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#A1A1A1]">
                      Submission
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#A1A1A1]">
                      Score
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#A1A1A1]">
                      Status
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#A1A1A1]">
                      Updated
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {results.map((result) => (
                    <tr
                      key={result.id}
                      className="border-b border-[#252525] last:border-b-0"
                    >
                      <td className="px-5 py-5 text-sm font-semibold text-[#D4AF37]">
                        {result.rank ?? "—"}
                      </td>

                      <td className="px-5 py-5">
                        <p className="max-w-[220px] truncate text-sm text-[#F5F3ED]">
                          {result.project_id || "—"}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <p className="max-w-[220px] truncate text-sm text-[#F5F3ED]">
                          {result.submission_id || "—"}
                        </p>
                      </td>

                      <td className="px-5 py-5 text-sm text-[#F5F3ED]">
                        {result.score ?? "—"}
                      </td>

                      <td className="px-5 py-5">
                        <StatusBadge status={result.status} />
                      </td>

                      <td className="px-5 py-5 text-sm text-[#F5F3ED]">
                        {formatDate(result.updated_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-5">
          <Link
            href="/admin/events"
            className="text-sm font-semibold text-[#A1A1A1] transition-colors hover:text-[#D4AF37]"
          >
            ← All Events
          </Link>

          <Link
            href="/admin/submissions"
            className="text-sm font-semibold text-[#A1A1A1] transition-colors hover:text-[#D4AF37]"
          >
            All Submissions →
          </Link>
        </div>
      </section>
    </main>
  );
}

function StatusBadge({
  status,
}: {
  status?: string | null;
}) {
  return (
    <span className="inline-flex rounded border border-[#252525] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D4AF37]">
      {status || "UNKNOWN"}
    </span>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN");
}