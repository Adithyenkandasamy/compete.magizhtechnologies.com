"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  deleteAdminJudge,
  getAdminJudges,
  type AdminJudge,
} from "@/lib/admin-judges-api";

export default function AdminJudgesPage() {
  const [judges, setJudges] = useState<AdminJudge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadJudges() {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminJudges();
      setJudges(data);
    } catch (err) {
      console.error("Unable to load judges:", err);
      setError("Unable to load judges.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJudges();
  }, []);

  async function handleDelete(judgeId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this judge?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(judgeId);
      setError("");

      await deleteAdminJudge(judgeId);

      setJudges((current) =>
        current.filter((judge) => judge.id !== judgeId),
      );
    } catch (err) {
      console.error("Unable to delete judge:", err);
      setError("Unable to delete judge.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-black">
      <section className="magizh-container py-12 md:py-20">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.3em]">
              ADMINISTRATION
            </p>

            <h1 className="magizh-heading mt-4 text-4xl font-bold leading-tight md:text-6xl">
              Judges
            </h1>

            <p className="magizh-muted mt-4 max-w-2xl leading-7">
              Create, review, update, and manage judges for Magizh
              Technologies events.
            </p>
          </div>

          <Link
            href="/admin/judges/new"
            className="magizh-button"
          >
            Add Judge
          </Link>
        </div>

        {loading && (
          <div className="magizh-card mt-10 p-8">
            <p className="magizh-muted">Loading judges...</p>
          </div>
        )}

        {error && (
          <div className="magizh-card mt-10 border-[#C75C5C] p-6">
            <p className="text-[#C75C5C]">{error}</p>
          </div>
        )}

        {!loading && !error && judges.length === 0 && (
          <div className="magizh-card mt-10 p-10 text-center">
            <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.25em]">
              JUDGES
            </p>

            <h2 className="magizh-heading mt-3 text-2xl font-bold">
              No judges found
            </h2>

            <p className="magizh-muted mx-auto mt-3 max-w-lg">
              Add a judge to start managing event evaluations.
            </p>

            <Link
              href="/admin/judges/new"
              className="magizh-button mt-6"
            >
              Add First Judge
            </Link>
          </div>
        )}

        {!loading && !error && judges.length > 0 && (
          <div className="mt-10 overflow-hidden rounded-lg border border-[#252525]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] border-collapse">
                <thead>
                  <tr className="border-b border-[#252525] bg-[#0A0A0A]">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#A1A1A1]">
                      Judge
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#A1A1A1]">
                      Email
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#A1A1A1]">
                      Status
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#A1A1A1]">
                      Created
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.15em] text-[#A1A1A1]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {judges.map((judge) => (
                    <tr
                      key={judge.id}
                      className="border-b border-[#252525] last:border-b-0"
                    >
                      <td className="px-5 py-5">
                        <div>
                          <p className="font-semibold text-[#F5F3ED]">
                            {judge.name || "Unnamed Judge"}
                          </p>

                          <p className="mt-1 max-w-[180px] truncate text-xs text-[#666]">
                            {judge.id}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-5 text-sm text-[#F5F3ED]">
                        {judge.email || "—"}
                      </td>

                      <td className="px-5 py-5">
                        <StatusBadge status={judge.status} />
                      </td>

                      <td className="px-5 py-5 text-sm text-[#F5F3ED]">
                        {formatDate(judge.created_at)}
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex justify-end gap-3">
                          <Link
                            href={`/admin/judges/${judge.id}`}
                            className="rounded border border-[#252525] px-3 py-2 text-xs font-semibold text-[#F5F3ED] transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37]"
                          >
                            View
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDelete(judge.id)}
                            disabled={deletingId === judge.id}
                            className="rounded border border-[#252525] px-3 py-2 text-xs font-semibold text-[#C75C5C] transition-colors hover:border-[#C75C5C] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId === judge.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
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

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}