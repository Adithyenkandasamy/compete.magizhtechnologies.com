"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  getAdminSubmissions,
  type AdminSubmission,
} from "@/lib/admin-submissions-api";

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<AdminSubmission[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    getAdminSubmissions()
      .then((data) => {
        if (!cancelled) {
          setSubmissions(data);
          setError("");
        }
      })
      .catch((err) => {
        console.error("Unable to load admin submissions:", err);

        if (!cancelled) {
          setError("Unable to load submissions.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <main className="min-h-screen bg-black">
      <section className="magizh-container py-12 md:py-20">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.3em]">
              ADMINISTRATION
            </p>

            <h1 className="magizh-heading mt-4 text-4xl font-bold leading-tight md:text-6xl">
              Submissions
            </h1>

            <p className="magizh-muted mt-4 max-w-2xl leading-7">
              Review and manage project submissions received from
              participating teams.
            </p>
          </div>

          <div className="text-xs uppercase tracking-[0.2em] text-[#666]">
            {submissions.length}{" "}
            {submissions.length === 1 ? "Submission" : "Submissions"}
          </div>
        </div>

        {loading && (
          <div className="magizh-card mt-10 p-8">
            <p className="magizh-muted">Loading submissions...</p>
          </div>
        )}

        {error && (
          <div className="magizh-card mt-10 border-[#C75C5C] p-8">
            <p className="text-[#C75C5C]">{error}</p>

            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="mt-5 rounded border border-[#252525] px-4 py-2 text-sm font-semibold text-[#F5F3ED] transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37]"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && submissions.length === 0 && (
          <div className="magizh-card mt-10 p-10 text-center">
            <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.25em]">
              SUBMISSIONS
            </p>

            <h2 className="magizh-heading mt-3 text-2xl font-bold">
              No submissions found
            </h2>

            <p className="magizh-muted mx-auto mt-3 max-w-lg">
              Project submissions will appear here once teams submit
              their work.
            </p>
          </div>
        )}

        {!loading && !error && submissions.length > 0 && (
          <div className="mt-10 overflow-hidden rounded-lg border border-[#252525]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr className="border-b border-[#252525] bg-[#0A0A0A]">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#A1A1A1]">
                      Submission
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#A1A1A1]">
                      Project ID
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#A1A1A1]">
                      Status
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#A1A1A1]">
                      Submitted
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#A1A1A1]">
                      Updated
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.15em] text-[#A1A1A1]">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {submissions.map((submission) => (
                    <tr
                      key={submission.id}
                      className="border-b border-[#252525] last:border-b-0"
                    >
                      <td className="px-5 py-5">
                        <p className="max-w-[180px] truncate text-sm font-semibold text-[#F5F3ED]">
                          {submission.id}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <p className="max-w-[180px] truncate text-sm text-[#F5F3ED]">
                          {submission.project_id}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <StatusBadge status={submission.status} />
                      </td>

                      <td className="px-5 py-5">
                        <span className="text-sm text-[#F5F3ED]">
                          {submission.submitted_at
                            ? formatDate(submission.submitted_at)
                            : "Not submitted"}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <span className="text-sm text-[#F5F3ED]">
                          {formatDate(submission.updated_at)}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex justify-end">
                          <Link
                            href={`/admin/submissions/${submission.id}`}
                            className="rounded border border-[#252525] px-3 py-2 text-xs font-semibold text-[#F5F3ED] transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37]"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-8">
          <Link
            href="/admin"
            className="text-sm font-semibold text-[#A1A1A1] transition-colors hover:text-[#D4AF37]"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
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

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}