"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import {
  getAdminJudge,
  updateAdminJudge,
  type AdminJudge,
} from "@/lib/admin-judges-api";

export default function AdminJudgeDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const judgeId = params.judge_id as string;

  const [judge, setJudge] = useState<AdminJudge | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadJudge() {
      try {
        setLoading(true);
        setError("");

        const data = await getAdminJudge(judgeId);

        setJudge(data);
        setName(data.name ?? "");
        setEmail(data.email ?? "");
        setStatus(data.status ?? "");
      } catch (err) {
        console.error("Unable to load judge:", err);
        setError("Unable to load judge details.");
      } finally {
        setLoading(false);
      }
    }

    if (judgeId) {
      loadJudge();
    }
  }, [judgeId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Judge name is required.");
      return;
    }

    if (!email.trim()) {
      setError("Judge email is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const updated = await updateAdminJudge(judgeId, {
        name: name.trim(),
        email: email.trim(),
        ...(status.trim()
          ? { status: status.trim() }
          : {}),
      });

      setJudge(updated);
      setName(updated.name ?? "");
      setEmail(updated.email ?? "");
      setStatus(updated.status ?? "");

      setSuccess("Judge updated successfully.");
    } catch (err) {
      console.error("Unable to update judge:", err);
      setError("Unable to update judge.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-black">
      <section className="magizh-container py-12 md:py-20">
        <Link
          href="/admin/judges"
          className="text-sm font-semibold text-[#A1A1A1] transition-colors hover:text-[#D4AF37]"
        >
          ← Back to Judges
        </Link>

        <div className="mt-8">
          <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.3em]">
            ADMINISTRATION
          </p>

          <h1 className="magizh-heading mt-4 text-4xl font-bold leading-tight md:text-5xl">
            Judge Details
          </h1>
        </div>

        {loading && (
          <div className="magizh-card mt-10 max-w-3xl p-8">
            <p className="magizh-muted">Loading judge...</p>
          </div>
        )}

        {error && (
          <div className="magizh-card mt-10 max-w-3xl border-[#C75C5C] p-6">
            <p className="text-[#C75C5C]">{error}</p>
          </div>
        )}

        {!loading && !error && judge && (
          <form
            onSubmit={handleSubmit}
            className="magizh-card mt-10 max-w-3xl p-6 md:p-8"
          >
            <div>
              <p className="magizh-muted text-xs font-semibold uppercase tracking-[0.2em]">
                Judge ID
              </p>

              <p className="mt-3 break-all text-sm text-[#F5F3ED]">
                {judge.id}
              </p>
            </div>

            <div className="mt-7">
              <label
                htmlFor="judge-name"
                className="magizh-muted text-xs font-semibold uppercase tracking-[0.2em]"
              >
                Judge Name
              </label>

              <input
                id="judge-name"
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setSuccess("");
                }}
                className="mt-3 w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition-colors focus:border-[#D4AF37]"
              />
            </div>

            <div className="mt-6">
              <label
                htmlFor="judge-email"
                className="magizh-muted text-xs font-semibold uppercase tracking-[0.2em]"
              >
                Email
              </label>

              <input
                id="judge-email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setSuccess("");
                }}
                className="mt-3 w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition-colors focus:border-[#D4AF37]"
              />
            </div>

            <div className="mt-6">
              <label
                htmlFor="judge-status"
                className="magizh-muted text-xs font-semibold uppercase tracking-[0.2em]"
              >
                Status
              </label>

              <input
                id="judge-status"
                type="text"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setSuccess("");
                }}
                placeholder="Enter status"
                className="mt-3 w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition-colors placeholder:text-[#666] focus:border-[#D4AF37]"
              />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <InfoCard
                label="Created At"
                value={formatDateTime(judge.created_at)}
              />

              <InfoCard
                label="Updated At"
                value={formatDateTime(judge.updated_at)}
              />
            </div>

            {error && (
              <div className="mt-6 rounded border border-[#C75C5C] p-4">
                <p className="text-sm text-[#C75C5C]">
                  {error}
                </p>
              </div>
            )}

            {success && (
              <div className="mt-6 rounded border border-[#6FAF7B] p-4">
                <p className="text-sm text-[#6FAF7B]">
                  {success}
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="submit"
                disabled={saving}
                className="magizh-button disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/admin/judges")}
                className="rounded border border-[#252525] px-5 py-3 font-semibold text-[#F5F3ED] transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37]"
              >
                Cancel
              </button>
            </div>
          </form>
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
    <div className="rounded border border-[#252525] bg-[#0A0A0A] p-5">
      <p className="magizh-muted text-xs font-semibold uppercase tracking-[0.15em]">
        {label}
      </p>

      <p className="mt-2 text-sm text-[#F5F3ED]">
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