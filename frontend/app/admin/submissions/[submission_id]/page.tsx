"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import {
  getAdminSubmission,
  updateAdminSubmissionStatus,
  type AdminSubmission,
} from "@/lib/admin-submissions-api";

export default function AdminSubmissionDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const submissionId = params.submission_id as string;

  const [submission, setSubmission] =
    useState<AdminSubmission | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadSubmission() {
      try {
        setLoading(true);
        setError("");

        const data = await getAdminSubmission(submissionId);

        setSubmission(data);
        setStatus(data.status);
      } catch (err) {
        console.error("Unable to load submission:", err);
        setError("Unable to load submission details.");
      } finally {
        setLoading(false);
      }
    }

    if (submissionId) {
      loadSubmission();
    }
  }, [submissionId]);

  async function handleSave() {
    if (!status.trim()) {
      setError("Status is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const updated = await updateAdminSubmissionStatus(
        submissionId,
        {
          status: status.trim(),
        },
      );

      setSubmission(updated);
      setStatus(updated.status);
      setSuccess("Submission status updated successfully.");
    } catch (err) {
      console.error("Unable to update submission:", err);
      setError("Unable to update submission status.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-black">
      <section className="magizh-container py-12 md:py-20">
        <Link
          href="/admin/submissions"
          className="text-sm font-semibold text-[#A1A1A1] transition-colors hover:text-[#D4AF37]"
        >
          ← Back to Submissions
        </Link>

        <div className="mt-8">
          <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.3em]">
            ADMINISTRATION
          </p>

          <h1 className="magizh-heading mt-4 text-4xl font-bold leading-tight md:text-5xl">
            Submission Details
          </h1>
        </div>

        {loading && (
          <div className="magizh-card mt-10 p-8">
            <p className="magizh-muted">
              Loading submission...
            </p>
          </div>
        )}

        {error && (
          <div className="magizh-card mt-10 border-[#C75C5C] p-6">
            <p className="text-[#C75C5C]">{error}</p>
          </div>
        )}

        {!loading && !error && submission && (
          <div className="mt-10 max-w-4xl">
            <div className="grid gap-5 md:grid-cols-2">
              <InfoCard
                label="Submission ID"
                value={submission.id}
              />

              <InfoCard
                label="Project ID"
                value={submission.project_id}
              />

              <InfoCard
                label="Submitted At"
                value={
                  submission.submitted_at
                    ? formatDateTime(submission.submitted_at)
                    : "Not submitted"
                }
              />

              <InfoCard
                label="Created At"
                value={formatDateTime(submission.created_at)}
              />

              <InfoCard
                label="Updated At"
                value={formatDateTime(submission.updated_at)}
              />
            </div>

            <div className="magizh-card mt-8 p-6">
              <p className="magizh-muted text-xs font-semibold uppercase tracking-[0.2em]">
                Submission Status
              </p>

              <input
                type="text"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setSuccess("");
                }}
                placeholder="Enter submission status"
                className="mt-4 w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition-colors placeholder:text-[#666] focus:border-[#D4AF37]"
              />

              <div className="mt-5 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="magizh-button disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Status"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/admin/projects/${submission.project_id}`,
                    )
                  }
                  className="rounded border border-[#252525] px-5 py-3 font-semibold text-[#F5F3ED] transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37]"
                >
                  View Project
                </button>
              </div>

              {success && (
                <p className="mt-4 text-sm text-[#6FAF7B]">
                  {success}
                </p>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="magizh-card p-6">
      <p className="magizh-muted text-xs font-semibold uppercase tracking-[0.2em]">
        {label}
      </p>

      <p className="mt-3 break-all text-sm leading-6 text-[#F5F3ED]">
        {value}
      </p>
    </div>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN");
}