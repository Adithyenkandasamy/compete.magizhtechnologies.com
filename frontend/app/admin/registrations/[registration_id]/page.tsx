"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import {
  getAdminRegistration,
  updateAdminRegistration,
  type AdminRegistration,
} from "@/lib/admin-registrations-api";

export default function AdminRegistrationDetailsPage() {
  const params = useParams();
  const registrationId = params.registration_id as string;

  const [registration, setRegistration] =
    useState<AdminRegistration | null>(null);

  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadRegistration() {
      try {
        setLoading(true);
        setError("");

        const data =
          await getAdminRegistration(registrationId);

        setRegistration(data);
        setStatus(data.status);
      } catch (err) {
        console.error(
          "Unable to load registration:",
          err,
        );
        setError("Unable to load registration details.");
      } finally {
        setLoading(false);
      }
    }

    if (registrationId) {
      loadRegistration();
    }
  }, [registrationId]);

  async function handleSave() {
    if (!registration) {
      return;
    }

    if (!status.trim()) {
      setError("Registration status cannot be empty.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const updatedRegistration =
        await updateAdminRegistration(
          registration.id,
          {
            status: status.trim(),
          },
        );

      setRegistration(updatedRegistration);
      setStatus(updatedRegistration.status);

      setSuccess(
        "Registration updated successfully.",
      );
    } catch (err) {
      console.error(
        "Unable to update registration:",
        err,
      );
      setError("Unable to update registration.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-black">
      <section className="magizh-container py-12 md:py-20">
        <Link
          href="/admin/registrations"
          className="text-sm font-semibold text-[#A1A1A1] transition-colors hover:text-[#D4AF37]"
        >
          ← Back to Registrations
        </Link>

        <div className="mt-10">
          <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.3em]">
            ADMINISTRATION
          </p>

          <h1 className="magizh-heading mt-4 text-4xl font-bold leading-tight md:text-5xl">
            Registration Details
          </h1>

          <p className="magizh-muted mt-4 max-w-2xl leading-7">
            Review and update this event registration.
          </p>
        </div>

        {loading && (
          <div className="magizh-card mt-10 p-8">
            <p className="magizh-muted">
              Loading registration...
            </p>
          </div>
        )}

        {error && (
          <div className="magizh-card mt-8 border-[#C75C5C] p-4">
            <p className="text-sm text-[#C75C5C]">
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="mt-8 rounded border border-[#6FAF7B] bg-[#0A0A0A] p-4">
            <p className="text-sm text-[#6FAF7B]">
              {success}
            </p>
          </div>
        )}

        {!loading && registration && (
          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
            <section className="magizh-card p-6 md:p-8">
              <div className="border-b border-[#252525] pb-6">
                <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
                  REGISTRATION
                </p>

                <h2 className="magizh-heading mt-3 break-all text-2xl font-bold">
                  {registration.id}
                </h2>
              </div>

              <div className="mt-8 space-y-6">
                <InfoRow
                  label="Registration ID"
                  value={registration.id}
                />

                <InfoRow
                  label="Event ID"
                  value={registration.event_id}
                />

                <InfoRow
                  label="User ID"
                  value={registration.user_id}
                />

                <InfoRow
                  label="Created"
                  value={formatDateTime(
                    registration.created_at,
                  )}
                />

                <InfoRow
                  label="Last Updated"
                  value={formatDateTime(
                    registration.updated_at,
                  )}
                />
              </div>
            </section>

            <aside className="magizh-card h-fit p-6 md:p-8">
              <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
                MANAGEMENT
              </p>

              <h2 className="magizh-heading mt-3 text-2xl font-bold">
                Registration Status
              </h2>

              <p className="magizh-muted mt-3 text-sm leading-6">
                Update the registration status and save the
                change.
              </p>

              <label
                htmlFor="registration-status"
                className="magizh-muted mt-7 block text-xs font-semibold uppercase tracking-[0.15em]"
              >
                Status
              </label>

              <input
                id="registration-status"
                type="text"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
                placeholder="Enter registration status"
                className="mt-2 w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition-colors placeholder:text-[#666] focus:border-[#D4AF37]"
              />

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="magizh-button mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </aside>
          </div>
        )}

        <div className="mt-10">
          <Link
            href="/admin/registrations"
            className="text-sm font-semibold text-[#A1A1A1] transition-colors hover:text-[#D4AF37]"
          >
            ← Back to Registrations
          </Link>
        </div>
      </section>
    </main>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="magizh-muted text-xs font-semibold uppercase tracking-[0.15em]">
        {label}
      </p>

      <p className="mt-2 break-all text-sm leading-6 text-[#F5F3ED]">
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

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}