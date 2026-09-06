"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import {
  getAdminEvent,
  updateAdminEvent,
  type UpdateEventRequest,
} from "@/lib/admin-events-api";

import {
  assignJudgeToEvent,
  getAdminJudges,
  type AdminJudge,
} from "@/lib/admin-judges-api";

import type {
  Event,
  EventMode,
  EventType,
} from "@/types/events";

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

type EventForm = {
  title: string;
  description: string;
  event_type: EventType;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  location: string;
  mode: EventMode;
  max_participants: string;
  team_size_min: string;
  team_size_max: string;
  prize_pool: string;
  rules: string;
};

export default function AdminEventEditPage() {
  const params = useParams();

  const eventId = params.event_id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [form, setForm] = useState<EventForm | null>(null);

  const [judges, setJudges] = useState<AdminJudge[]>([]);
  const [selectedJudgeId, setSelectedJudgeId] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingJudges, setLoadingJudges] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assigningJudge, setAssigningJudge] = useState(false);

  const [error, setError] = useState("");
  const [judgeError, setJudgeError] = useState("");
  const [success, setSuccess] = useState("");
  const [judgeSuccess, setJudgeSuccess] = useState("");

  useEffect(() => {
    async function loadEvent() {
      try {
        setLoading(true);
        setError("");

        const data = await getAdminEvent(eventId);

        setEvent(data);
        setForm(createFormFromEvent(data));
      } catch (err) {
        console.error("Unable to load event:", err);
        setError("Unable to load event details.");
      } finally {
        setLoading(false);
      }
    }

    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  useEffect(() => {
    async function loadJudges() {
      try {
        setLoadingJudges(true);
        setJudgeError("");

        const data = await getAdminJudges();

        setJudges(data);
      } catch (err) {
        console.error("Unable to load judges:", err);
        setJudgeError("Unable to load judges.");
      } finally {
        setLoadingJudges(false);
      }
    }

    loadJudges();
  }, []);

  function updateField<K extends keyof EventForm>(
    field: K,
    value: EventForm[K],
  ) {
    setForm((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [field]: value,
      };
    });
  }

  async function handleSubmit(
    submitEvent: FormEvent<HTMLFormElement>,
  ) {
    submitEvent.preventDefault();

    if (!form) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const teamSizeMin = Number(form.team_size_min);
      const teamSizeMax = Number(form.team_size_max);

      if (teamSizeMin < 1) {
        setError("Minimum team size must be at least 1.");
        return;
      }

      if (teamSizeMax < teamSizeMin) {
        setError(
          "Maximum team size cannot be smaller than minimum team size.",
        );
        return;
      }

      const maxParticipants =
        form.max_participants.trim() === ""
          ? undefined
          : Number(form.max_participants);

      if (
        maxParticipants !== undefined &&
        (Number.isNaN(maxParticipants) || maxParticipants < 1)
      ) {
        setError("Maximum participants must be at least 1.");
        return;
      }

      const prizePool =
        form.prize_pool.trim() === ""
          ? undefined
          : Number(form.prize_pool);

      if (
        prizePool !== undefined &&
        (Number.isNaN(prizePool) || prizePool < 0)
      ) {
        setError("Prize pool cannot be negative.");
        return;
      }

      const payload: UpdateEventRequest = {
        title: form.title.trim(),
        description: form.description.trim(),
        event_type: form.event_type,
        start_date: form.start_date,
        end_date: form.end_date,
        registration_deadline: form.registration_deadline,
        location: form.location.trim() || undefined,
        mode: form.mode,
        max_participants: maxParticipants,
        team_size_min: teamSizeMin,
        team_size_max: teamSizeMax,
        prize_pool: prizePool,
        rules: form.rules.trim() || undefined,
      };

      const updatedEvent = await updateAdminEvent(
        eventId,
        payload,
      );

      setEvent(updatedEvent);
      setForm(createFormFromEvent(updatedEvent));
      setSuccess("Event updated successfully.");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error("Unable to update event:", err);
      setError(
        "Unable to update event. Please check the form and try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAssignJudge() {
    if (!selectedJudgeId) {
      setJudgeError("Please select a judge.");
      return;
    }

    try {
      setAssigningJudge(true);
      setJudgeError("");
      setJudgeSuccess("");

      await assignJudgeToEvent(
        eventId,
        selectedJudgeId,
      );

      const assignedJudge = judges.find(
        (judge) => judge.id === selectedJudgeId,
      );

      setJudgeSuccess(
        `${assignedJudge?.name || "Judge"} assigned to this event successfully.`,
      );

      setSelectedJudgeId("");
    } catch (err) {
      console.error("Unable to assign judge:", err);
      setJudgeError(
        "Unable to assign judge to this event.",
      );
    } finally {
      setAssigningJudge(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black">
        <section className="magizh-container py-12 md:py-20">
          <div className="magizh-card p-8">
            <p className="magizh-muted">
              Loading event details...
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (error && !form) {
    return (
      <main className="min-h-screen bg-black">
        <section className="magizh-container py-12 md:py-20">
          <Link
            href="/admin/events"
            className="text-sm font-semibold text-[#A1A1A1] transition-colors hover:text-[#D4AF37]"
          >
            ← Back to Events
          </Link>

          <div className="magizh-card mt-10 border-[#C75C5C] p-8">
            <p className="text-[#C75C5C]">{error}</p>
          </div>
        </section>
      </main>
    );
  }

  if (!form) {
    return null;
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
            Edit Event
          </h1>

          <p className="magizh-muted mt-4 max-w-2xl leading-7">
            Update the details of this MAGIZH | INNOVATION event.
          </p>

          {event && (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <StatusBadge status={event.status} />

              <span className="text-xs text-[#666]">
                ID: {event.id}
              </span>
            </div>
          )}
        </div>

        {/* Success */}
        {success && (
          <div className="mb-6 rounded border border-[#6FAF7B] bg-[#0A0A0A] p-4">
            <p className="text-sm text-[#6FAF7B]">
              {success}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded border border-[#C75C5C] bg-[#0A0A0A] p-4">
            <p className="text-sm text-[#C75C5C]">
              {error}
            </p>
          </div>
        )}

        <form
          className="max-w-4xl space-y-8"
          onSubmit={handleSubmit}
        >
          {/* Basic Information */}
          <section className="magizh-card p-6 md:p-8">
            <SectionHeading
              label="01"
              title="Basic Information"
              description="Update the event identity and category."
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
                  onChange={(e) =>
                    updateField("title", e.target.value)
                  }
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
                  onChange={(e) =>
                    updateField(
                      "description",
                      e.target.value,
                    )
                  }
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
                    onChange={(e) =>
                      updateField(
                        "event_type",
                        e.target.value as EventType,
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
                    onChange={(e) =>
                      updateField(
                        "mode",
                        e.target.value as EventMode,
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
              description="Update registration and event dates."
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
                  onChange={(e) =>
                    updateField(
                      "registration_deadline",
                      e.target.value,
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
                  onChange={(e) =>
                    updateField(
                      "start_date",
                      e.target.value,
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
                  onChange={(e) =>
                    updateField(
                      "end_date",
                      e.target.value,
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
              description="Update capacity and team requirements."
            />

            <div className="mt-8 space-y-6">
              <FormField label="Location">
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) =>
                    updateField(
                      "location",
                      e.target.value,
                    )
                  }
                  className={inputClass}
                />
              </FormField>

              <div className="grid gap-6 md:grid-cols-3">
                <FormField label="Maximum Participants">
                  <input
                    type="number"
                    min="1"
                    value={form.max_participants}
                    onChange={(e) =>
                      updateField(
                        "max_participants",
                        e.target.value,
                      )
                    }
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
                    onChange={(e) =>
                      updateField(
                        "team_size_min",
                        e.target.value,
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
                    onChange={(e) =>
                      updateField(
                        "team_size_max",
                        e.target.value,
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
              description="Update rewards and participation guidelines."
            />

            <div className="mt-8 space-y-6">
              <FormField label="Prize Pool">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.prize_pool}
                  onChange={(e) =>
                    updateField(
                      "prize_pool",
                      e.target.value,
                    )
                  }
                  placeholder="Optional"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Rules">
                <textarea
                  rows={8}
                  value={form.rules}
                  onChange={(e) =>
                    updateField(
                      "rules",
                      e.target.value,
                    )
                  }
                  placeholder="Enter event rules and guidelines..."
                  className={`${inputClass} resize-y`}
                />
              </FormField>
            </div>
          </section>

          {/* Judge Assignment */}
          <section className="magizh-card p-6 md:p-8">
            <SectionHeading
              label="05"
              title="Judge Assignment"
              description="Assign an available judge to evaluate submissions for this event."
            />

            <div className="mt-8">
              {loadingJudges ? (
                <div className="rounded border border-[#252525] bg-[#0A0A0A] p-5">
                  <p className="magizh-muted text-sm">
                    Loading judges...
                  </p>
                </div>
              ) : judgeError && judges.length === 0 ? (
                <div className="rounded border border-[#C75C5C] bg-[#0A0A0A] p-5">
                  <p className="text-sm text-[#C75C5C]">
                    {judgeError}
                  </p>
                </div>
              ) : judges.length === 0 ? (
                <div className="rounded border border-[#252525] bg-[#0A0A0A] p-5">
                  <p className="text-sm font-semibold text-[#F5F3ED]">
                    No judges available
                  </p>

                  <p className="magizh-muted mt-2 text-sm leading-6">
                    Create a judge first before assigning one to
                    this event.
                  </p>

                  <Link
                    href="/admin/judges/new"
                    className="magizh-button mt-5"
                  >
                    Add Judge
                  </Link>
                </div>
              ) : (
                <>
                  <FormField label="Select Judge">
                    <select
                      value={selectedJudgeId}
                      onChange={(e) => {
                        setSelectedJudgeId(e.target.value);
                        setJudgeError("");
                        setJudgeSuccess("");
                      }}
                      className={inputClass}
                    >
                      <option
                        value=""
                        className="bg-[#0A0A0A]"
                      >
                        Select a judge
                      </option>

                      {judges.map((judge) => (
                        <option
                          key={judge.id}
                          value={judge.id}
                          className="bg-[#0A0A0A]"
                        >
                          {judge.name || "Unnamed Judge"}
                          {judge.email
                            ? ` — ${judge.email}`
                            : ""}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  {judgeError && (
                    <div className="mt-5 rounded border border-[#C75C5C] bg-[#0A0A0A] p-4">
                      <p className="text-sm text-[#C75C5C]">
                        {judgeError}
                      </p>
                    </div>
                  )}

                  {judgeSuccess && (
                    <div className="mt-5 rounded border border-[#6FAF7B] bg-[#0A0A0A] p-4">
                      <p className="text-sm text-[#6FAF7B]">
                        {judgeSuccess}
                      </p>
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={handleAssignJudge}
                      disabled={
                        assigningJudge ||
                        !selectedJudgeId
                      }
                      className="magizh-button disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {assigningJudge
                        ? "Assigning..."
                        : "Assign Judge"}
                    </button>

                    <Link
                      href="/admin/judges"
                      className="rounded border border-[#252525] px-5 py-3 font-semibold text-[#F5F3ED] transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37]"
                    >
                      Manage Judges
                    </Link>
                  </div>
                </>
              )}
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
              disabled={saving}
              className="magizh-button disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function createFormFromEvent(event: Event): EventForm {
  return {
    title: event.title,
    description: event.description,
    event_type: event.event_type,
    start_date: toDateTimeLocal(event.start_date),
    end_date: toDateTimeLocal(event.end_date),
    registration_deadline: toDateTimeLocal(
      event.registration_deadline,
    ),
    location: event.location ?? "",
    mode: event.mode,
    max_participants:
      event.max_participants !== null &&
      event.max_participants !== undefined
        ? String(event.max_participants)
        : "",
    team_size_min: String(event.team_size_min),
    team_size_max: String(event.team_size_max),
    prize_pool:
      event.prize_pool !== null &&
      event.prize_pool !== undefined
        ? String(event.prize_pool)
        : "",
    rules: event.rules ?? "",
  };
}

function toDateTimeLocal(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 16);
  }

  const pad = (number: number) =>
    String(number).padStart(2, "0");

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1,
  )}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
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
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[#A1A1A1]">
        {label}

        {required && (
          <span className="ml-1 text-[#D4AF37]">
            *
          </span>
        )}
      </label>

      {children}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: Event["status"];
}) {
  const statusClasses: Record<Event["status"], string> = {
    DRAFT: "border-[#555] text-[#A1A1A1]",
    PUBLISHED: "border-[#6FAF7B] text-[#6FAF7B]",
    ONGOING: "border-[#D4AF37] text-[#D4AF37]",
    COMPLETED: "border-[#777] text-[#777]",
    CANCELLED: "border-[#C75C5C] text-[#C75C5C]",
  };

  return (
    <span
      className={`inline-flex rounded border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] ${statusClasses[status]}`}
    >
      {formatEnum(status)}
    </span>
  );
}

function formatEnum(value: string) {
  return value.replaceAll("_", " ");
}

const inputClass =
  "w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition-colors placeholder:text-[#666] focus:border-[#D4AF37]";