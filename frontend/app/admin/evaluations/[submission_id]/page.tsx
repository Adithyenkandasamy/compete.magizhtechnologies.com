"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import {
  getJudgeSubmission,
  type JudgeSubmission,
} from "@/lib/judge-api";

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminEvaluationDetailPage() {
  const params = useParams();

  const submissionId = params.submission_id as string;

  const [submission, setSubmission] =
    useState<JudgeSubmission | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSubmission() {
      try {
        setLoading(true);
        setError("");

        const data = await getJudgeSubmission(submissionId);

        setSubmission(data);
      } catch (err) {
        console.error(
          "Unable to load submission:",
          err,
        );

        setError("Unable to load submission details.");
      } finally {
        setLoading(false);
      }
    }

    if (submissionId) {
      loadSubmission();
    }
  }, [submissionId]);

  return (
    <main className="min-h-screen bg-black text-[#F5F3ED]">
      <div className="magizh-container py-10 md:py-14">
        <div className="mb-10">
          <Link
            href="/admin/evaluations"
            className="text-sm font-semibold text-[#A1A1A1] transition-colors hover:text-[#D4AF37]"
          >
            ← Back to Evaluations
          </Link>

          <p className="magizh-gold mt-8 text-xs font-semibold uppercase tracking-[0.3em]">
            ADMINISTRATION
          </p>

          <h1 className="magizh-heading mt-4 text-4xl font-bold leading-tight md:text-5xl">
            Submission Details
          </h1>
        </div>

        {loading && (
          <div className="magizh-card p-8">
            <p className="magizh-muted">
              Loading submission details...
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-[#C75C5C]/40 bg-[#0D0D0F] p-8">
            <p className="text-[#C75C5C]">{error}</p>
          </div>
        )}

        {!loading && !error && submission && (
          <div className="max-w-3xl">
            <section className="rounded-lg border border-[#252525] bg-[#0D0D0F]">
              <div className="border-b border-[#252525] px-6 py-5">
                <h2 className="text-lg font-semibold">
                  Submission
                </h2>
              </div>

              <div className="grid gap-6 p-6 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.15em] text-[#A1A1A1]">
                    Submission ID
                  </p>

                  <p className="font-mono text-sm text-[#F5F3ED]">
                    {submission.id}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.15em] text-[#A1A1A1]">
                    Project ID
                  </p>

                  <p className="font-mono text-sm text-[#F5F3ED]">
                    {submission.project_id}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.15em] text-[#A1A1A1]">
                    Status
                  </p>

                  <span className="inline-flex rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-1 text-xs font-medium text-[#D4AF37]">
                    {submission.status}
                  </span>
                </div>

                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.15em] text-[#A1A1A1]">
                    Submitted At
                  </p>

                  <p className="text-sm text-[#F5F3ED]">
                    {formatDate(submission.submitted_at)}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.15em] text-[#A1A1A1]">
                    Created
                  </p>

                  <p className="text-sm text-[#F5F3ED]">
                    {formatDate(submission.created_at)}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.15em] text-[#A1A1A1]">
                    Updated
                  </p>

                  <p className="text-sm text-[#F5F3ED]">
                    {formatDate(submission.updated_at)}
                  </p>
                </div>
              </div>
            </section>

            <div className="mt-8">
              <Link
                href="/admin/evaluations"
                className="inline-flex items-center justify-center rounded border border-[#252525] px-6 py-3 font-semibold text-[#F5F3ED] transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37]"
              >
                Back to Evaluations
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}