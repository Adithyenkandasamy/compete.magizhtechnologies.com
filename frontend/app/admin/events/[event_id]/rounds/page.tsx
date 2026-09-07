"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronLeft, Plus, Trash2 } from "lucide-react";

import {
  createAdminRound,
  deleteAdminRound,
  getAdminRounds,
  updateAdminRound,
  type CreateRoundRequest,
  type EventRound,
  type RoundStatus,
  type RoundType,
} from "@/lib/admin-rounds-api";

const roundTypes: RoundType[] = [
  "QUALIFIER",
  "IDEA_SUBMISSION",
  "HACK",
];

const roundStatuses: RoundStatus[] = [
  "UPCOMING",
  "OPEN",
  "CLOSED",
];

const roundTypeLabels: Record<RoundType, string> = {
  QUALIFIER: "Qualifier",
  IDEA_SUBMISSION: "Idea Submission",
  HACK: "Hack",
};

type RoundForm = {
  title: string;
  round_type: RoundType;
  description: string;
  criteria_url: string;
  duration_hours: string;
  mode: string;
  starts_at: string;
  ends_at: string;
};

const emptyForm: RoundForm = {
  title: "",
  round_type: "QUALIFIER",
  description: "",
  criteria_url: "",
  duration_hours: "",
  mode: "",
  starts_at: "",
  ends_at: "",
};

export default function AdminEventRoundsPage() {
  const params = useParams();
  const eventId = params.event_id as string;

  const [rounds, setRounds] = useState<EventRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<RoundForm>(emptyForm);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<RoundForm | null>(null);
  const [editStatus, setEditStatus] = useState<RoundStatus>("UPCOMING");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      return;
    }

    let cancelled = false;

    getAdminRounds(eventId)
      .then((data) => {
        if (!cancelled) {
          setRounds(data);
        }
      })
      .catch((err) => {
        console.error("Unable to load rounds:", err);
        if (!cancelled) {
          setError("Unable to load rounds for this event.");
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
  }, [eventId]);

  function updateField<K extends keyof RoundForm>(
    field: K,
    value: RoundForm[K],
    source: "form" | "edit",
  ) {
    if (source === "form") {
      setForm((current) => ({ ...current, [field]: value }));
    } else {
      setEditForm((current) =>
        current ? { ...current, [field]: value } : current,
      );
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setCreating(true);
      setError("");
      setNotice("");

      const payload: CreateRoundRequest = {
        title: form.title.trim(),
        round_type: form.round_type,
        order: rounds.length + 1,
        description:
          form.description.trim() || undefined,
        criteria_url: form.criteria_url.trim() || undefined,
        duration_hours:
          form.duration_hours.trim() === ""
            ? undefined
            : Number(form.duration_hours),
        mode: (form.mode.trim() || undefined) as
          | CreateRoundRequest["mode"]
          | undefined,
        starts_at: form.starts_at || undefined,
        ends_at: form.ends_at || undefined,
      };

      const created = await createAdminRound(eventId, payload);
      setRounds((current) => [...current, created]);
      setForm(emptyForm);
      setShowCreate(false);
      setNotice("Round created successfully.");
    } catch (err) {
      console.error("Unable to create round:", err);
      setError("Unable to create round. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(round: EventRound) {
    setEditingId(round.id);
    setEditStatus(round.status);
    setEditForm({
      title: round.title,
      round_type: round.round_type,
      description: round.description ?? "",
      criteria_url: round.criteria_url ?? "",
      duration_hours:
        round.duration_hours === null
          ? ""
          : String(round.duration_hours),
      mode: round.mode ?? "",
      starts_at: toDateTimeLocal(round.starts_at),
      ends_at: toDateTimeLocal(round.ends_at),
    });
  }

  async function handleSaveEdit(roundId: string) {
    if (!editForm) {
      return;
    }

    try {
      setSavingId(roundId);
      setError("");
      setNotice("");

      const updated = await updateAdminRound(eventId, roundId, {
        title: editForm.title.trim(),
        round_type: editForm.round_type,
        description:
          editForm.description.trim() || undefined,
        criteria_url:
          editForm.criteria_url.trim() || undefined,
        duration_hours:
          editForm.duration_hours.trim() === ""
            ? undefined
            : Number(editForm.duration_hours),
        mode: (editForm.mode.trim() || undefined) as
          CreateRoundRequest["mode"],
        starts_at: editForm.starts_at || undefined,
        ends_at: editForm.ends_at || undefined,
        status: editStatus,
      });

      setRounds((current) =>
        current.map((round) =>
          round.id === roundId ? updated : round,
        ),
      );
      setEditingId(null);
      setEditForm(null);
      setNotice("Round updated successfully.");
    } catch (err) {
      console.error("Unable to update round:", err);
      setError("Unable to update round. Please try again.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(roundId: string) {
    try {
      setDeletingId(roundId);
      setError("");
      setNotice("");

      await deleteAdminRound(eventId, roundId);
      setRounds((current) =>
        current.filter((round) => round.id !== roundId),
      );
      setNotice("Round deleted successfully.");
    } catch (err) {
      console.error("Unable to delete round:", err);
      setError("Unable to delete round. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= rounds.length) {
      return;
    }

    const current = rounds[index];
    const target = rounds[targetIndex];

    try {
      setError("");
      setNotice("");

      const [updatedTarget, updatedCurrent] = await Promise.all([
        updateAdminRound(eventId, target.id, { order: current.order }),
        updateAdminRound(eventId, current.id, { order: target.order }),
      ]);

      setRounds((existing) =>
        existing
          .map((round) => {
            if (round.id === updatedCurrent.id) {
              return { ...round, order: updatedCurrent.order };
            }
            if (round.id === updatedTarget.id) {
              return { ...round, order: updatedTarget.order };
            }
            return round;
          })
          .sort((a, b) => a.order - b.order),
      );
      setNotice("Rounds reordered.");
    } catch (err) {
      console.error("Unable to reorder rounds:", err);
      setError("Unable to reorder rounds. Please try again.");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black">
        <section className="magizh-container py-12 md:py-20">
          <div className="magizh-card p-8">
            <p className="magizh-muted">
              Loading rounds...
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black">
      <section className="magizh-container py-12 md:py-20">
        {/* Header */}
        <div className="mb-10">
          <Link
            href={`/admin/events/${eventId}`}
            className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[#A1A1A1] transition-colors hover:text-[#D4AF37]"
          >
            <ChevronLeft size={16} />
            Back to Event
          </Link>

          <p className="magizh-gold mt-8 text-xs font-semibold uppercase tracking-[0.3em]">
            ADMINISTRATION
          </p>

          <h1 className="magizh-heading mt-4 text-4xl font-bold leading-tight md:text-5xl">
            Edit Rounds
          </h1>

          <p className="magizh-muted mt-4 max-w-2xl leading-7">
            Build the hackathon pipeline: a qualifier, an idea
            submission stage, and the main hack round.
          </p>
        </div>

        {/* Notices */}
        {notice && (
          <div className="mb-6 rounded border border-[#6FAF7B] bg-[#0A0A0A] p-4">
            <p className="text-sm text-[#6FAF7B]">{notice}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded border border-[#C75C5C] bg-[#0A0A0A] p-4">
            <p className="text-sm text-[#C75C5C]">{error}</p>
          </div>
        )}

        {/* Add round */}
        <div className="mb-10">
          {!showCreate ? (
            <button
              type="button"
              onClick={() => {
                setShowCreate(true);
                setError("");
                setNotice("");
              }}
              className="magizh-button inline-flex items-center gap-2"
            >
              <Plus size={16} />
              Add Round
            </button>
          ) : (
            <form
              onSubmit={handleCreate}
              className="magizh-card p-6 md:p-8"
            >
              <h2 className="magizh-heading text-xl font-bold">
                New Round
              </h2>

              <div className="mt-6 space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField label="Round Title" required>
                    <input
                      required
                      type="text"
                      value={form.title}
                      onChange={(e) =>
                        updateField("title", e.target.value, "form")
                      }
                      placeholder="e.g. Qualifier Round"
                      className={inputClass}
                    />
                  </FormField>

                  <FormField label="Round Type" required>
                    <select
                      required
                      value={form.round_type}
                      onChange={(e) =>
                        updateField(
                          "round_type",
                          e.target.value as RoundType,
                          "form",
                        )
                      }
                      className={inputClass}
                    >
                      {roundTypes.map((type) => (
                        <option
                          key={type}
                          value={type}
                          className="bg-[#0A0A0A]"
                        >
                          {roundTypeLabels[type]}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>

                <FormField label="Description">
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) =>
                      updateField(
                        "description",
                        e.target.value,
                        "form",
                      )
                    }
                    placeholder="Describe what participants need to do in this round..."
                    className={`${inputClass} resize-y`}
                  />
                </FormField>

                <div className="grid gap-6 md:grid-cols-3">
                  <FormField label="Criteria URL">
                    <input
                      type="text"
                      value={form.criteria_url}
                      onChange={(e) =>
                        updateField(
                          "criteria_url",
                          e.target.value,
                          "form",
                        )
                      }
                      placeholder="GitHub / LinkedIn / portfolio"
                      className={inputClass}
                    />
                  </FormField>

                  <FormField label="Duration (hours)">
                    <input
                      type="number"
                      min="1"
                      value={form.duration_hours}
                      onChange={(e) =>
                        updateField(
                          "duration_hours",
                          e.target.value,
                          "form",
                        )
                      }
                      placeholder="e.g. 48"
                      className={inputClass}
                    />
                  </FormField>

                  <FormField label="Mode">
                    <select
                      value={form.mode}
                      onChange={(e) =>
                        updateField("mode", e.target.value, "form")
                      }
                      className={inputClass}
                    >
                      <option value="" className="bg-[#0A0A0A]">
                        Not set
                      </option>
                      <option value="ONLINE" className="bg-[#0A0A0A]">
                        Online
                      </option>
                      <option value="OFFLINE" className="bg-[#0A0A0A]">
                        Offline
                      </option>
                      <option value="HYBRID" className="bg-[#0A0A0A]">
                        Hybrid
                      </option>
                    </select>
                  </FormField>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField label="Starts At">
                    <input
                      type="datetime-local"
                      value={form.starts_at}
                      onChange={(e) =>
                        updateField("starts_at", e.target.value, "form")
                      }
                      className={inputClass}
                    />
                  </FormField>

                  <FormField label="Ends At">
                    <input
                      type="datetime-local"
                      value={form.ends_at}
                      onChange={(e) =>
                        updateField("ends_at", e.target.value, "form")
                      }
                      className={inputClass}
                    />
                  </FormField>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="magizh-button disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Round"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false);
                    setForm(emptyForm);
                  }}
                  className="rounded border border-[#252525] px-5 py-3 font-semibold text-[#F5F3ED] transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37]"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Rounds list */}
        {rounds.length === 0 ? (
          <div className="magizh-card p-8">
            <p className="text-sm font-semibold text-[#F5F3ED]">
              No rounds yet
            </p>

            <p className="magizh-muted mt-2 text-sm leading-6">
              Add the first round for this hackathon to define
              its pipeline.
            </p>
          </div>
        ) : (
          <ol className="space-y-6">
            {rounds.map((round, index) => (
              <li
                key={round.id}
                className="magizh-card p-6 md:p-8"
              >
                {editingId === round.id && editForm ? (
                  <>
                    <div className="flex items-center justify-between">
                      <h2 className="magizh-heading text-xl font-bold">
                        Edit Round #{round.order}
                      </h2>

                      <span className="rounded border border-[#252525] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#A1A1A1]">
                        {roundTypeLabels[round.round_type]}
                      </span>
                    </div>

                    <div className="mt-6 space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <FormField label="Round Title" required>
                          <input
                            required
                            type="text"
                            value={editForm.title}
                            onChange={(e) =>
                              updateField(
                                "title",
                                e.target.value,
                                "edit",
                              )
                            }
                            className={inputClass}
                          />
                        </FormField>

                        <FormField label="Round Type" required>
                          <select
                            required
                            value={editForm.round_type}
                            onChange={(e) =>
                              updateField(
                                "round_type",
                                e.target.value as RoundType,
                                "edit",
                              )
                            }
                            className={inputClass}
                          >
                            {roundTypes.map((type) => (
                              <option
                                key={type}
                                value={type}
                                className="bg-[#0A0A0A]"
                              >
                                {roundTypeLabels[type]}
                              </option>
                            ))}
                          </select>
                        </FormField>
                      </div>

                      <FormField label="Status">
                        <select
                          value={editStatus}
                          onChange={(e) =>
                            setEditStatus(
                              e.target.value as RoundStatus,
                            )
                          }
                          className={inputClass}
                        >
                          {roundStatuses.map((status) => (
                            <option
                              key={status}
                              value={status}
                              className="bg-[#0A0A0A]"
                            >
                              {status.replaceAll("_", " ")}
                            </option>
                          ))}
                        </select>
                      </FormField>

                      <FormField label="Description">
                        <textarea
                          rows={4}
                          value={editForm.description}
                          onChange={(e) =>
                            updateField(
                              "description",
                              e.target.value,
                              "edit",
                            )
                          }
                          className={`${inputClass} resize-y`}
                        />
                      </FormField>

                      <div className="grid gap-6 md:grid-cols-3">
                        <FormField label="Criteria URL">
                          <input
                            type="text"
                            value={editForm.criteria_url}
                            onChange={(e) =>
                              updateField(
                                "criteria_url",
                                e.target.value,
                                "edit",
                              )
                            }
                            className={inputClass}
                          />
                        </FormField>

                        <FormField label="Duration (hours)">
                          <input
                            type="number"
                            min="1"
                            value={editForm.duration_hours}
                            onChange={(e) =>
                              updateField(
                                "duration_hours",
                                e.target.value,
                                "edit",
                              )
                            }
                            className={inputClass}
                          />
                        </FormField>

                        <FormField label="Mode">
                          <select
                            value={editForm.mode}
                            onChange={(e) =>
                              updateField(
                                "mode",
                                e.target.value,
                                "edit",
                              )
                            }
                            className={inputClass}
                          >
                            <option value="" className="bg-[#0A0A0A]">
                              Not set
                            </option>
                            <option value="ONLINE" className="bg-[#0A0A0A]">
                              Online
                            </option>
                            <option value="OFFLINE" className="bg-[#0A0A0A]">
                              Offline
                            </option>
                            <option value="HYBRID" className="bg-[#0A0A0A]">
                              Hybrid
                            </option>
                          </select>
                        </FormField>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <FormField label="Starts At">
                          <input
                            type="datetime-local"
                            value={editForm.starts_at}
                            onChange={(e) =>
                              updateField(
                                "starts_at",
                                e.target.value,
                                "edit",
                              )
                            }
                            className={inputClass}
                          />
                        </FormField>

                        <FormField label="Ends At">
                          <input
                            type="datetime-local"
                            value={editForm.ends_at}
                            onChange={(e) =>
                              updateField(
                                "ends_at",
                                e.target.value,
                                "edit",
                              )
                            }
                            className={inputClass}
                          />
                        </FormField>
                      </div>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-4">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(round.id)}
                        disabled={savingId === round.id}
                        className="magizh-button disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingId === round.id
                          ? "Saving..."
                          : "Save Round"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditForm(null);
                        }}
                        className="rounded border border-[#252525] px-5 py-3 font-semibold text-[#F5F3ED] transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37]"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="magizh-gold text-sm font-bold">
                            Round {round.order}
                          </span>

                          <span className="rounded border border-[#252525] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#A1A1A1]">
                            {roundTypeLabels[round.round_type]}
                          </span>

                          <span
                            className={`rounded border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] ${
                              round.status === "OPEN"
                                ? "border-[#6FAF7B] text-[#6FAF7B]"
                                : round.status === "CLOSED"
                                  ? "border-[#777] text-[#777]"
                                  : "border-[#252525] text-[#A1A1A1]"
                            }`}
                          >
                            {round.status.replaceAll("_", " ")}
                          </span>
                        </div>

                        <h2 className="magizh-heading mt-3 text-2xl font-bold">
                          {round.title}
                        </h2>

                        {round.description && (
                          <p className="magizh-muted mt-3 text-sm leading-6">
                            {round.description}
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#A1A1A1]">
                          {round.duration_hours !== null && (
                            <span>
                              {round.duration_hours} hours
                            </span>
                          )}

                          {round.mode && (
                            <span>
                              {round.mode.replaceAll("_", " ")}
                            </span>
                          )}

                          {round.starts_at && (
                            <span>
                              Starts{" "}
                              {toDateString(round.starts_at)}
                            </span>
                          )}

                          {round.ends_at && (
                            <span>
                              Ends{" "}
                              {toDateString(round.ends_at)}
                            </span>
                          )}

                          {round.criteria_url && (
                            <a
                              href={round.criteria_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="break-all text-[#D4AF37] hover:underline"
                            >
                              {round.criteria_url}
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleMove(index, -1)}
                          disabled={index === 0}
                          aria-label="Move round up"
                          className="rounded border border-[#252525] p-2 text-[#A1A1A1] transition hover:border-[#D4AF37] hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ArrowUp size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMove(index, 1)}
                          disabled={index === rounds.length - 1}
                          aria-label="Move round down"
                          className="rounded border border-[#252525] p-2 text-[#A1A1A1] transition hover:border-[#D4AF37] hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ArrowDown size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setError("");
                            setNotice("");
                            startEdit(round);
                          }}
                          className="rounded border border-[#252525] px-4 py-2 text-xs font-semibold text-[#F5F3ED] transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37]"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete the round "${round.title}"?`,
                              )
                            ) {
                              handleDelete(round.id);
                            }
                          }}
                          disabled={deletingId === round.id}
                          aria-label="Delete round"
                          className="rounded border border-[#252525] p-2 text-[#C75C5C] transition hover:border-[#C75C5C] hover:text-[#C75C5C] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}

function toDateTimeLocal(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (number: number) =>
    String(number).padStart(2, "0");

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1,
  )}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function toDateString(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
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
        {required && <span className="ml-1 text-[#D4AF37]">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition-colors placeholder:text-[#666] focus:border-[#D4AF37]";