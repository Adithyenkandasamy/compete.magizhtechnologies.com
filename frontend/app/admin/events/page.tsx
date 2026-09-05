"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  deleteAdminEvent,
  getAdminEvents,
  publishAdminEvent,
  unpublishAdminEvent,
} from "@/lib/admin-events-api";

import type { Event } from "@/types/events";

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState("");

  async function loadEvents() {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminEvents();
      setEvents(data);
    } catch (err) {
      console.error("Unable to load admin events:", err);
      setError("Unable to load events.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function handlePublish(eventId: string) {
    try {
      setActionLoading(eventId);
      setError("");
      setSuccess("");

      const updatedEvent = await publishAdminEvent(eventId);

      setEvents((currentEvents) =>
        currentEvents.map((event) =>
          event.id === eventId ? updatedEvent : event,
        ),
      );

      setSuccess("Event published successfully.");
    } catch (err) {
      console.error("Unable to publish event:", err);
      setError("Unable to publish event.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUnpublish(eventId: string) {
    try {
      setActionLoading(eventId);
      setError("");
      setSuccess("");

      const updatedEvent = await unpublishAdminEvent(eventId);

      setEvents((currentEvents) =>
        currentEvents.map((event) =>
          event.id === eventId ? updatedEvent : event,
        ),
      );

      setSuccess("Event unpublished successfully.");
    } catch (err) {
      console.error("Unable to unpublish event:", err);
      setError("Unable to unpublish event.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(eventId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete or cancel this event?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(eventId);
      setError("");
      setSuccess("");

      await deleteAdminEvent(eventId);

      setEvents((currentEvents) =>
        currentEvents.filter((event) => event.id !== eventId),
      );

      setSuccess("Event deleted successfully.");
    } catch (err) {
      console.error("Unable to delete event:", err);
      setError("Unable to delete event.");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-black">
      <section className="magizh-container py-12 md:py-20">
        {/* Header */}
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.3em]">
              ADMINISTRATION
            </p>

            <h1 className="magizh-heading mt-4 text-4xl font-bold leading-tight md:text-6xl">
              Events
            </h1>

            <p className="magizh-muted mt-4 max-w-2xl leading-7">
              Create, publish, update, and manage MAGIZH | INNOVATION events.
            </p>
          </div>

          <Link href="/admin/events/new" className="magizh-button">
            Create Event
          </Link>
        </div>

        {/* Success */}
        {success && (
          <div className="mt-8 rounded border border-[#6FAF7B] bg-[#0A0A0A] p-4">
            <p className="text-sm text-[#6FAF7B]">{success}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-8 rounded border border-[#C75C5C] bg-[#0A0A0A] p-4">
            <p className="text-sm text-[#C75C5C]">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="magizh-card mt-10 p-8">
            <p className="magizh-muted">Loading events...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && events.length === 0 && (
          <div className="magizh-card mt-10 p-10 text-center">
            <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.25em]">
              EVENTS
            </p>

            <h2 className="magizh-heading mt-3 text-2xl font-bold">
              No events found
            </h2>

            <p className="magizh-muted mx-auto mt-3 max-w-lg">
              Create your first MAGIZH | INNOVATION event to get started.
            </p>

            <Link href="/admin/events/new" className="magizh-button mt-6">
              Create Event
            </Link>
          </div>
        )}

        {/* Events */}
        {!loading && events.length > 0 && (
          <div className="mt-10 overflow-hidden rounded-lg border border-[#252525]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] border-collapse">
                <thead>
                  <tr className="border-b border-[#252525] bg-[#0A0A0A]">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#A1A1A1]">
                      Event
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#A1A1A1]">
                      Type
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#A1A1A1]">
                      Mode
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#A1A1A1]">
                      Start Date
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#A1A1A1]">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.15em] text-[#A1A1A1]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {events.map((event) => {
                    const isActionLoading = actionLoading === event.id;

                    return (
                      <tr
                        key={event.id}
                        className="border-b border-[#252525] last:border-b-0"
                      >
                        {/* Event */}
                        <td className="px-5 py-5">
                          <div>
                            <p className="font-semibold text-[#F5F3ED]">
                              {event.title}
                            </p>

                            <p className="mt-1 max-w-xs truncate text-xs text-[#666]">
                              {event.slug}
                            </p>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-5 py-5">
                          <span className="text-sm text-[#F5F3ED]">
                            {formatEnum(event.event_type)}
                          </span>
                        </td>

                        {/* Mode */}
                        <td className="px-5 py-5">
                          <span className="text-sm text-[#F5F3ED]">
                            {formatEnum(event.mode)}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-5 py-5">
                          <span className="text-sm text-[#F5F3ED]">
                            {formatDate(event.start_date)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-5">
                          <StatusBadge status={event.status} />
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-5">
                          <div className="flex justify-end gap-2">
                            {/* Analytics */}
                            <Link
                              href={`/admin/analytics/events/${event.id}`}
                              className="rounded border border-[#252525] px-3 py-2 text-xs font-semibold text-[#D4AF37] transition-colors hover:border-[#D4AF37] hover:bg-[#D4AF37] hover:text-black"
                            >
                              Analytics
                            </Link>

                            {/* Edit */}
                            <Link
                              href={`/admin/events/${event.id}`}
                              className="rounded border border-[#252525] px-3 py-2 text-xs font-semibold text-[#F5F3ED] transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37]"
                            >
                              Edit
                            </Link>

                            {/* Publish / Unpublish */}
                            {event.status === "PUBLISHED" ? (
                              <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => handleUnpublish(event.id)}
                                className="rounded border border-[#252525] px-3 py-2 text-xs font-semibold text-[#F5F3ED] transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isActionLoading ? "..." : "Unpublish"}
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => handlePublish(event.id)}
                                className="rounded border border-[#D4AF37] px-3 py-2 text-xs font-semibold text-[#D4AF37] transition-colors hover:bg-[#D4AF37] hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isActionLoading ? "..." : "Publish"}
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              type="button"
                              disabled={isActionLoading}
                              onClick={() => handleDelete(event.id)}
                              className="rounded border border-[#252525] px-3 py-2 text-xs font-semibold text-[#C75C5C] transition-colors hover:border-[#C75C5C] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Back */}
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