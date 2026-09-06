"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getMyRegistrations } from "@/lib/registrations-api";
import { getEvent } from "@/lib/events-api";
import type { Registration } from "@/lib/registrations-api";
import type { Event } from "@/types/events";
import { getErrorMessage } from "@/lib/error-message";

type RegisteredEvent = {
  registration: Registration;
  event: Event;
};

export default function MyEventsPage() {
  const [registeredEvents, setRegisteredEvents] = useState<
    RegisteredEvent[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMyEvents() {
      try {
        setError("");

        const registrations = await getMyRegistrations();

        const events = await Promise.all(
          registrations.map(async (registration) => {
            const event = await getEvent(registration.event_id);

            return {
              registration,
              event,
            };
          }),
        );

        setRegisteredEvents(events);
      } catch (err: any) {
        setError(
          getErrorMessage(
            err,
            "Unable to load your registered events.",
          ),
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadMyEvents();
  }, []);

  if (isLoading) {
    return (
      <main className="magizh-container py-20">
        <p className="magizh-muted">Loading your events...</p>
      </main>
    );
  }

  return (
    <main className="magizh-container py-12 md:py-16">
      <div className="mb-10">
        <Link
          href="/dashboard"
          className="text-sm font-semibold uppercase tracking-wider text-[#D4AF37] transition-colors hover:text-[#E5C04A]"
        >
          ← Dashboard
        </Link>

        <p className="magizh-gold mt-8 text-xs font-semibold uppercase tracking-[0.25em]">
          MY EVENTS
        </p>

        <h1 className="magizh-heading mt-3 text-4xl font-bold md:text-5xl">
          Registered Events
        </h1>

        <p className="magizh-muted mt-4 max-w-2xl text-base leading-7">
          View the events you have registered for and continue managing your
          participation.
        </p>
      </div>

      {error && (
        <div className="magizh-card mb-8 p-6">
          <p className="text-sm text-[#C75C5C]">{error}</p>
        </div>
      )}

      {!error && registeredEvents.length === 0 && (
        <div className="magizh-card p-10 text-center">
          <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
            NO REGISTRATIONS
          </p>

          <h2 className="magizh-heading mt-3 text-2xl font-bold">
            You haven't registered for any events yet.
          </h2>

          <p className="magizh-muted mt-3">
            Explore upcoming Magizh Technologies events and register to
            participate.
          </p>

          <Link
            href="/events"
            className="magizh-button mt-6"
          >
            Explore Events
          </Link>
        </div>
      )}

      {!error && registeredEvents.length > 0 && (
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {registeredEvents.map(({ registration, event }) => (
            <article
              key={registration.id}
              className="magizh-card overflow-hidden transition-colors duration-200 hover:border-[#D4AF37]"
            >
              {event.banner_url ? (
                <div className="aspect-[16/8] overflow-hidden border-b border-[#252525]">
                  <img
                    src={event.banner_url}
                    alt={event.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-[16/8] items-center justify-center border-b border-[#252525] bg-[#0A0A0A]">
                  <span className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
                    MAGIZH EVENT
                  </span>
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="magizh-gold text-xs font-semibold uppercase tracking-[0.15em]">
                    {event.event_type.replace("_", " ")}
                  </span>

                  <span className="rounded border border-[#6FAF7B]/40 bg-[#6FAF7B]/10 px-2 py-1 text-xs uppercase tracking-wider text-[#6FAF7B]">
                    {registration.status}
                  </span>
                </div>

                <h2 className="magizh-heading mt-4 text-2xl font-bold">
                  {event.title}
                </h2>

                <p className="magizh-muted mt-3 line-clamp-2 text-sm leading-6">
                  {event.description}
                </p>

                <div className="mt-5 space-y-2 text-sm">
                  <p>
                    <span className="magizh-muted">Starts: </span>
                    {new Date(event.start_date).toLocaleDateString()}
                  </p>

                  <p>
                    <span className="magizh-muted">Ends: </span>
                    {new Date(event.end_date).toLocaleDateString()}
                  </p>

                  <p>
                    <span className="magizh-muted">Mode: </span>
                    {event.mode}
                  </p>
                </div>

                <Link
                  href={`/events/${event.id}`}
                  className="mt-6 inline-flex text-sm font-semibold uppercase tracking-wider text-[#D4AF37] transition-colors hover:text-[#E5C04A]"
                >
                  View Event →
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}