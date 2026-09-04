"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEvent } from "@/hooks/use-events";

export default function EventDetailsPage() {
  const params = useParams();
  const eventId = params.event_id as string;

  const { data: event, isLoading, isError } = useEvent(eventId);

  if (isLoading) {
    return (
      <main className="magizh-container py-20">
        <p className="magizh-muted">Loading event...</p>
      </main>
    );
  }

  if (isError || !event) {
    return (
      <main className="magizh-container py-20">
        <div className="magizh-card p-8">
          <p className="text-[#C75C5C]">
            Unable to load this event.
          </p>

          <Link
            href="/events"
            className="mt-5 inline-flex text-sm font-semibold uppercase tracking-wider text-[#D4AF37] hover:text-[#E5C04A]"
          >
            ← Back to Events
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="magizh-container py-12 md:py-16">
      <Link
        href="/events"
        className="mb-8 inline-flex text-sm font-semibold uppercase tracking-wider text-[#D4AF37] hover:text-[#E5C04A]"
      >
        ← Back to Events
      </Link>

      {event.banner_url && (
        <div className="mb-10 aspect-[16/6] overflow-hidden rounded-lg border border-[#252525]">
          <img
            src={event.banner_url}
            alt={event.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <section>
          <div className="flex flex-wrap items-center gap-4">
            <span className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
              {event.event_type.replace("_", " ")}
            </span>

            <span className="magizh-muted text-xs uppercase tracking-[0.15em]">
              {event.mode}
            </span>
          </div>

          <h1 className="magizh-heading mt-4 text-4xl font-bold leading-tight md:text-6xl">
            {event.title}
          </h1>

          <p className="magizh-muted mt-6 max-w-3xl text-base leading-8">
            {event.description}
          </p>

          {event.rules && (
            <div className="mt-12">
              <h2 className="magizh-heading text-2xl font-bold">
                Rules & Guidelines
              </h2>

              <p className="magizh-muted mt-4 whitespace-pre-line leading-7">
                {event.rules}
              </p>
            </div>
          )}
        </section>

        <aside className="magizh-card h-fit p-6">
          <h2 className="magizh-heading text-xl font-bold">
            Event Information
          </h2>

          <div className="mt-6 space-y-5 text-sm">
            <div>
              <p className="magizh-muted uppercase tracking-wider">
                Starts
              </p>
              <p className="mt-1">
                {new Date(event.start_date).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="magizh-muted uppercase tracking-wider">
                Ends
              </p>
              <p className="mt-1">
                {new Date(event.end_date).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="magizh-muted uppercase tracking-wider">
                Registration Deadline
              </p>
              <p className="mt-1">
                {new Date(
                  event.registration_deadline,
                ).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="magizh-muted uppercase tracking-wider">
                Location
              </p>
              <p className="mt-1">
                {event.location || "To be announced"}
              </p>
            </div>

            <div>
              <p className="magizh-muted uppercase tracking-wider">
                Team Size
              </p>
              <p className="mt-1">
                {event.team_size_min} - {event.team_size_max} members
              </p>
            </div>

            {event.prize_pool !== null &&
              event.prize_pool !== undefined && (
                <div>
                  <p className="magizh-muted uppercase tracking-wider">
                    Prize Pool
                  </p>
                  <p className="magizh-gold mt-1 text-lg font-semibold">
                    ₹{event.prize_pool.toLocaleString("en-IN")}
                  </p>
                </div>
              )}
          </div>

          <button
            type="button"
            className="magizh-button mt-8 w-full"
          >
            Register for Event
          </button>
        </aside>
      </div>
    </main>
  );
}