"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  getJudgeSubmissions,
  type JudgeSubmission,
} from "@/lib/judge-api";

export default function AdminEvaluationsPage() {
  const [submissions, setSubmissions] = useState<
    JudgeSubmission[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSubmissions() {
      try {
        setLoading(true);
        setError("");

        const data = await getJudgeSubmissions();

        setSubmissions(data);
      } catch (err) {
        console.error(
          "Unable to load judge submissions:",
          err,
        );

        setError(
          "Unable to load submissions for evaluation.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadSubmissions();
  }, []);

  return (
    <main className="min-h-screen bg-black">
      <section className="magizh-container py-12 md:py-20">
        <div className="mb-10">
          <Link
            href="/admin"
            className="text-sm font-semibold text-[#A1A1A1] transition-colors hover:text-[#D4AF37]"
          >
            ← Back to Dashboard
          </Link>

          <p className="magizh-gold mt-8 text-xs font-semibold uppercase tracking-[0.3em]">
            ADMINISTRATION
          </p>

          <h1 className="magizh-heading mt-4 text-4xl font-bold leading-tight md:text-6xl">
            Evaluations
          </h1>

          <p className="magizh-muted mt-4 max-w-2xl leading-7">
            Review submitted projects that are available for
            judging and evaluation.
          </p>
        </div>

        {loading && (
          <div className="magizh-card p-8">
            <p className="magizh-muted">
              Loading submissions...
            </p>
          </div>
        )}

        {error && (
          <div className="magizh-card border-[#C75C5C] p-6">
            <p className="text-[#C75C5C]">{error}</p>
          </div>
        )}

        {!loading &&
          !error &&
          submissions.length === 0 && (
            <div className="magizh-card p-10 text-center">
              <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.25em]">
                EVALUATIONS
              </p>

              <h2 className="magizh-heading mt-3 text-2xl font-bold">
                No submissions available
              </h2>

              <p className="magizh-muted mx-auto mt-3 max-w-lg leading-7">
                Submitted projects will appear here when they are
                available for evaluation.
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          submissions.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-[#252525]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] border-collapse">
                  <thead>
                    <tr className="border-b border-[#252525] bg-[#0A0A0A]">
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#A1A1A1]">
                        Submission
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#A1A1A1]">
                        Project
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#A1A1A1]">
                        Status
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#A1A1A1]">
                        Submitted
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
                          <p className="font-semibold text-[#F5F3ED]">
                            {submission.id}
                          </p>
                        </td>

                        <td className="px-5 py-5">
                          <p className="text-sm text-[#F5F3ED]">
                            {submission.project_id}
                          </p>
                        </td>

                        <td className="px-5 py-5">
                          <StatusBadge
                            status={submission.status}
                          />
                        </td>

                        <td className="px-5 py-5 text-sm text-[#F5F3ED]">
                          {submission.submitted_at
                            ? formatDate(
                                submission.submitted_at,
                              )
                            : "Not submitted"}
                        </td>

                        <td className="px-5 py-5 text-right">
                          <Link
                            href={`/admin/evaluations/${submission.id}`}
                            className="inline-flex rounded border border-[#252525] px-3 py-2 text-xs font-semibold text-[#F5F3ED] transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37]"
                          >
                            Evaluate
                          </Link>
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
            href="/admin/judges"
            className="text-sm font-semibold text-[#A1A1A1] transition-colors hover:text-[#D4AF37]"
          >
            Manage Judges →
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
  status: string;
}) {
  return (
    <span className="inline-flex rounded border border-[#252525] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D4AF37]">
      {formatEnum(status)}
    </span>
  );
}

function formatEnum(value: string) {
  return value.replaceAll("_", " ");
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN");
}