"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  createAdminEvent,
  type CreateEventRequest,
} from "@/lib/admin-events-api";

import type { EventMode, EventType } from "@/types/events";

const eventTypes: EventType[] = [
  "HACKATHON",
  "WORKSHOP",
  "MEETUP",
  "COMPETITION",
  "PROJECT_EXPO",
];

const eventModes: EventMode[] = [
  "ONLINE",
  "OFFLINE",
  "HYBRID",
];

export default function CreateAdminEventPage() {
  const router = useRouter();

  const [form, setForm] = useState<CreateEventRequest>({
    title: "",
    description: "",
    event_type: "HACKATHON",
    start_date: "",
    end_date: "",
    registration_deadline: "",
    location: "",
    mode: "OFFLINE",
    max_participants: undefined,
    team_size_min: 1,
    team_size_max: 4,
    prize_pool: undefined,
    rules: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField<K extends keyof CreateEventRequest>(
    field: K,
    value: CreateEventRequest[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      if (form.team_size_min < 1) {
        setError("Minimum team size must be at least 1.");
        return;
      }

      if (form.team_size_max < form.team_size_min) {
        setError(
          "Maximum team size cannot be smaller than minimum team size.",
        );
        return;
      }

      if (
        form.max_participants !== undefined &&
        form.max_participants < 1
      ) {
        setError("Maximum participants must be at least 1.");
        return;
      }

      if (
        form.prize_pool !== undefined &&
        form.prize_pool < 0
      ) {
        setError("Prize pool cannot be negative.");
        return;
      }

      const payload: CreateEventRequest = {
        ...form,
        location: form.location?.trim() || undefined,
        rules: form.rules?.trim() || undefined,
        max_participants:
          form.max_participants === undefined ||
          Number.isNaN(form.max_participants)
            ? undefined
            : form.max_participants,
        prize_pool:
          form.prize_pool === undefined ||
          Number.isNaN(form.prize_pool)
            ? undefined
            : form.prize_pool,
      };

      await createAdminEvent(payload);

      router.push("/admin/events");
    } catch (err) {
      console.error("Unable to create event:", err);

      setError(
        "Unable to create event. Please check the form and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black">
      <section className="magizh-container py-12 md:py-20">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/admin/events"
            className="text-sm font-semibold text-[#A1A1A1] transition-colors hover:text-[#D4AF37]"
          >
            ← Back to Events
          </Link>

          <p className="magizh-gold mt-8 text-xs font-semibold uppercase tracking-[0.3em]">
            ADMINISTRATION
          </p>

          <h1 className="magizh-heading mt-4 text-4xl font-bold leading-tight md:text-5xl">
            Create Event
          </h1>

          <p className="magizh-muted mt-4 max-w-2xl leading-7">
            Create a new MAGIZH | INNOVATION event.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 rounded border border-[#C75C5C] bg-[#0A0A0A] p-4">
            <p className="text-sm text-[#C75C5C]">{error}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="max-w-4xl space-y-8"
        >
          {/* Basic Information */}
          <section className="magizh-card p-6 md:p-8">
            <SectionHeading
              label="01"
              title="Basic Information"
              description="Define the identity and type of the event."
            />

            <div className="mt-8 space-y-6">
              <FormField
                label="Event Title"
                required
              >
                <input
                  required
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    updateField("title", event.target.value)
                  }
                  placeholder="Enter event title"
                  className={inputClass}
                />
              </FormField>

              <FormField
                label="Description"
                required
              >
                <textarea
                  required
                  rows={6}
                  value={form.description}
                  onChange={(event) =>
                    updateField(
                      "description",
                      event.target.value,
                    )
                  }
                  placeholder="Describe the event..."
                  className={`${inputClass} resize-y`}
                />
              </FormField>

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  label="Event Type"
                  required
                >
                  <select
                    required
                    value={form.event_type}
                    onChange={(event) =>
                      updateField(
                        "event_type",
                        event.target.value as EventType,
                      )
                    }
                    className={inputClass}
                  >
                    {eventTypes.map((type) => (
                      <option
                        key={type}
                        value={type}
                        className="bg-[#0A0A0A]"
                      >
                        {formatEnum(type)}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  label="Event Mode"
                  required
                >
                  <select
                    required
                    value={form.mode}
                    onChange={(event) =>
                      updateField(
                        "mode",
                        event.target.value as EventMode,
                      )
                    }
                    className={inputClass}
                  >
                    {eventModes.map((mode) => (
                      <option
                        key={mode}
                        value={mode}
                        className="bg-[#0A0A0A]"
                      >
                        {formatEnum(mode)}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
            </div>
          </section>

          {/* Schedule */}
          <section className="magizh-card p-6 md:p-8">
            <SectionHeading
              label="02"
              title="Schedule"
              description="Set the registration deadline and event dates."
            />

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <FormField
                label="Registration Deadline"
                required
              >
                <input
                  required
                  type="datetime-local"
                  value={form.registration_deadline}
                  onChange={(event) =>
                    updateField(
                      "registration_deadline",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                />
              </FormField>

              <FormField
                label="Start Date"
                required
              >
                <input
                  required
                  type="datetime-local"
                  value={form.start_date}
                  onChange={(event) =>
                    updateField(
                      "start_date",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                />
              </FormField>

              <FormField
                label="End Date"
                required
              >
                <input
                  required
                  type="datetime-local"
                  value={form.end_date}
                  onChange={(event) =>
                    updateField(
                      "end_date",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                />
              </FormField>
            </div>
          </section>

          {/* Participation */}
          <section className="magizh-card p-6 md:p-8">
            <SectionHeading
              label="03"
              title="Participation"
              description="Configure capacity and team requirements."
            />

            <div className="mt-8 space-y-6">
              <FormField
                label="Location"
                hint="Required for offline or hybrid events."
              >
                <input
                  type="text"
                  value={form.location ?? ""}
                  onChange={(event) =>
                    updateField(
                      "location",
                      event.target.value,
                    )
                  }
                  placeholder="Example: Magizh Technologies Campus"
                  className={inputClass}
                />
              </FormField>

              <div className="grid gap-6 md:grid-cols-3">
                <FormField label="Maximum Participants">
                  <input
                    type="number"
                    min="1"
                    value={
                      form.max_participants ?? ""
                    }
                    onChange={(event) => {
                      const value = event.target.value;

                      updateField(
                        "max_participants",
                        value === ""
                          ? undefined
                          : Number(value),
                      );
                    }}
                    placeholder="Optional"
                    className={inputClass}
                  />
                </FormField>

                <FormField
                  label="Minimum Team Size"
                  required
                >
                  <input
                    required
                    type="number"
                    min="1"
                    value={form.team_size_min}
                    onChange={(event) =>
                      updateField(
                        "team_size_min",
                        Number(event.target.value),
                      )
                    }
                    className={inputClass}
                  />
                </FormField>

                <FormField
                  label="Maximum Team Size"
                  required
                >
                  <input
                    required
                    type="number"
                    min="1"
                    value={form.team_size_max}
                    onChange={(event) =>
                      updateField(
                        "team_size_max",
                        Number(event.target.value),
                      )
                    }
                    className={inputClass}
                  />
                </FormField>
              </div>
            </div>
          </section>

          {/* Prize & Rules */}
          <section className="magizh-card p-6 md:p-8">
            <SectionHeading
              label="04"
              title="Prize & Rules"
              description="Add event rewards and participation guidelines."
            />

            <div className="mt-8 space-y-6">
              <FormField
                label="Prize Pool"
                hint="Enter the total prize amount."
              >
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.prize_pool ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;

                    updateField(
                      "prize_pool",
                      value === ""
                        ? undefined
                        : Number(value),
                    );
                  }}
                  placeholder="Optional"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Rules">
                <textarea
                  rows={8}
                  value={form.rules ?? ""}
                  onChange={(event) =>
                    updateField(
                      "rules",
                      event.target.value,
                    )
                  }
                  placeholder="Enter event rules and guidelines..."
                  className={`${inputClass} resize-y`}
                />
              </FormField>
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-4 border-t border-[#252525] pt-8 sm:flex-row sm:justify-end">
            <Link
              href="/admin/events"
              className="inline-flex items-center justify-center rounded border border-[#252525] px-6 py-3 font-semibold text-[#F5F3ED] transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="magizh-button disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Creating Event..." : "Create Event"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function SectionHeading({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
        {label}
      </p>

      <h2 className="magizh-heading mt-2 text-2xl font-bold">
        {title}
      </h2>

      <p className="magizh-muted mt-2 text-sm leading-6">
        {description}
      </p>
    </div>
  );
}

function FormField({
  label,
  required = false,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[#A1A1A1]">
        {label}
        {required && (
          <span className="ml-1 text-[#D4AF37]">*</span>
        )}
      </label>

      {children}

      {hint && (
        <p className="mt-2 text-xs text-[#666]">
          {hint}
        </p>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition-colors placeholder:text-[#666] focus:border-[#D4AF37]";

function formatEnum(value: string) {
  return value.replaceAll("_", " ");
}