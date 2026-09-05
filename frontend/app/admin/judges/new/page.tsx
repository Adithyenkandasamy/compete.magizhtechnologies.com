"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  createAdminJudge,
  type CreateAdminJudgeRequest,
} from "@/lib/admin-judges-api";

export default function NewJudgePage() {
  const router = useRouter();

  const [form, setForm] = useState<CreateAdminJudgeRequest>({
    name: "",
    email: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(
    field: keyof CreateAdminJudgeRequest,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Judge name is required.");
      return;
    }

    if (!form.email.trim()) {
      setError("Judge email is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await createAdminJudge({
        name: form.name.trim(),
        email: form.email.trim(),
      });

      router.push("/admin/judges");
    } catch (err) {
      console.error("Unable to create judge:", err);
      setError("Unable to create judge.");
    } finally {
      setLoading(false);
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

        <div className="mt-8 max-w-3xl">
          <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.3em]">
            ADMINISTRATION
          </p>

          <h1 className="magizh-heading mt-4 text-4xl font-bold leading-tight md:text-5xl">
            Add Judge
          </h1>

          <p className="magizh-muted mt-4 leading-7">
            Add a judge who can be assigned to evaluate submissions for
            Magizh Technologies events.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="magizh-card mt-10 max-w-3xl p-6 md:p-8"
        >
          <div>
            <label
              htmlFor="judge-name"
              className="magizh-muted text-xs font-semibold uppercase tracking-[0.2em]"
            >
              Judge Name
            </label>

            <input
              id="judge-name"
              type="text"
              value={form.name}
              onChange={(event) =>
                handleChange("name", event.target.value)
              }
              placeholder="Enter judge name"
              className="mt-3 w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition-colors placeholder:text-[#666] focus:border-[#D4AF37]"
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
              value={form.email}
              onChange={(event) =>
                handleChange("email", event.target.value)
              }
              placeholder="judge@example.com"
              className="mt-3 w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition-colors placeholder:text-[#666] focus:border-[#D4AF37]"
            />
          </div>

          {error && (
            <div className="mt-6 rounded border border-[#C75C5C] bg-[#0A0A0A] p-4">
              <p className="text-sm text-[#C75C5C]">{error}</p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-4">
            <button
              type="submit"
              disabled={loading}
              className="magizh-button disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Judge"}
            </button>

            <Link
              href="/admin/judges"
              className="rounded border border-[#252525] px-5 py-3 font-semibold text-[#F5F3ED] transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37]"
            >
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}