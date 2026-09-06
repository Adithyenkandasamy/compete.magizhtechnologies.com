"use client";

import { EventCard } from "@/components/events/event-card";
import { useEvents } from "@/hooks/use-events";
import {
  EmptyState,
  ErrorState,
  EventCardSkeleton,
  RefetchIndicator,
} from "@/components/loading";

export default function EventsPage() {
  const {
    data: events,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useEvents();

  return (
    <main className="magizh-container py-16 md:py-20">
      <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
        <div>
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

        {/* Background refetch: keep existing content, show subtle update */}
        {!isLoading && isFetching && (
          <RefetchIndicator active label="Updating" />
        )}
      </div>

      {isLoading && <EventCardSkeleton count={3} />}

      {isError && !isLoading && (
        <div className="mt-8">
          <ErrorState
            title="Unable to load events."
            message="Please make sure the FastAPI backend is running."
            onRetry={() => refetch()}
            retryLabel="Try Again"
          />
        </div>
      )}

      {!isLoading && !isError && events?.length === 0 && (
        <EmptyState
          kicker="MAGIZH TECHNOLOGIES"
          title="No events available"
          description="New Magizh Technologies events will appear here."
        />
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