"use client";

import { EventCard } from "@/components/events/event-card";
import { useEvents } from "@/hooks/use-events";

export default function EventsPage() {
  const { data: events, isLoading, isError } = useEvents();

  return (
    <main className="magizh-container py-16 md:py-20">
      <div className="mb-12">
        <p className="magizh-gold mb-3 text-xs font-semibold uppercase tracking-[0.25em]">
          MAGIZH TECHNOLOGIES
        </p>

        <h1 className="magizh-heading text-4xl font-bold md:text-6xl">
          Discover Events
        </h1>

        <p className="magizh-muted mt-4 max-w-2xl text-base leading-7">
          Explore hackathons, workshops, competitions, meetups, and project
          expos powered by Magizh Technologies.
        </p>
      </div>

      {isLoading && (
        <div className="py-16 text-center">
          <p className="magizh-muted">Loading events...</p>
        </div>
      )}

      {isError && (
        <div className="magizh-card p-8 text-center">
          <p className="text-[#C75C5C]">
            Unable to load events.
          </p>

          <p className="magizh-muted mt-2 text-sm">
            Please make sure the FastAPI backend is running.
          </p>
        </div>
      )}

      {!isLoading && !isError && events?.length === 0 && (
        <div className="magizh-card p-10 text-center">
          <p className="magizh-heading text-2xl">
            No events available
          </p>

          <p className="magizh-muted mt-2">
            New Magizh Technologies events will appear here.
          </p>
        </div>
      )}

      {!isLoading && !isError && events && events.length > 0 && (
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </section>
      )}
    </main>
  );
}