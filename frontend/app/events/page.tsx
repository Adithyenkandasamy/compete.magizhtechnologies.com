"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Sparkles, Filter, CalendarDays, Radio } from "lucide-react";

import { EventCard } from "@/components/events/event-card";
import { useEvents } from "@/hooks/use-events";
import {
  EmptyState,
  ErrorState,
  HackerSnakeLoader,
  RefetchIndicator,
} from "@/components/loading";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import type { Event } from "@/types/events";

const EVENT_FILTERS = [
  { id: "ALL", label: "All Events" },
  { id: "LIVE", label: "Live Now", live: true },
  { id: "HACKATHON", label: "Hackathons" },
  { id: "WORKSHOP", label: "Workshops" },
  { id: "COMPETITION", label: "Competitions" },
  { id: "EXPO", label: "Project Expos" },
  { id: "UPCOMING", label: "Upcoming" },
  { id: "COMPLETED", label: "Completed" },
];

export default function EventsPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "ALL";

  const [activeFilter, setActiveFilter] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: events = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useEvents();

  // Filter & Search Logic
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      // Search match
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        e.title.toLowerCase().includes(query) ||
        (e.description && e.description.toLowerCase().includes(query)) ||
        (e.event_type && e.event_type.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      // Filter match
      if (activeFilter === "ALL") return true;
      if (activeFilter === "LIVE") return e.status === "LIVE" || (e.is_registration_open && new Date(e.end_date || "") > new Date());
      if (activeFilter === "UPCOMING") return e.status === "DRAFT" || e.status === "PUBLISHED" || !e.is_completed;
      if (activeFilter === "COMPLETED") return e.status === "COMPLETED" || e.is_completed;
      return e.event_type?.toUpperCase() === activeFilter;
    });
  }, [events, activeFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-black text-[#F5F3ED] flex flex-col">
      <Navbar />

      <main className="flex-1 magizh-container py-12 md:py-16">
        {/* Header */}
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-[#252525] pb-8">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={13} className="text-[#D4AF37]" />
              <span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
                MAGIZH INNOVATION ECOSYSTEM
              </span>
            </div>

            <h1 className="magizh-heading mt-3 text-4xl font-extrabold md:text-5xl lg:text-6xl">
              Discover Events
            </h1>

            <p className="magizh-muted mt-3 max-w-2xl text-xs leading-relaxed md:text-sm">
              Explore hackathons, innovation challenges, workshops, and student project expos organized year-round by Magizh Technologies.
            </p>
          </div>

          {!isLoading && isFetching && <RefetchIndicator active label="Syncing" />}
        </div>

        {/* Search & Filter Bar */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-md">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A1A1A1]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search challenges, themes, or event names..."
                className="w-full rounded border border-[#252525] bg-[#0A0A0A] py-2.5 pl-10 pr-4 text-xs text-[#F5F3ED] placeholder-[#A1A1A1]/60 outline-none transition focus:border-[#D4AF37]"
              />
            </div>

            <div className="text-xs font-mono text-[#A1A1A1]">
              Showing <span className="font-bold text-[#D4AF37]">{filteredEvents.length}</span> of {events.length} Events
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            {EVENT_FILTERS.map((f) => {
              const active = activeFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveFilter(f.id)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider transition-all ${
                    active
                      ? "border border-[#D4AF37] bg-[#D4AF37] text-black font-bold shadow-[0_0_12px_rgba(212,175,55,0.2)]"
                      : "border border-[#252525] bg-[#0A0A0A] text-[#A1A1A1] hover:border-[#D4AF37]/50 hover:text-[#F5F3ED]"
                  }`}
                >
                  {f.live && (
                    <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-black" : "bg-[#6FAF7B] animate-pulse"}`} />
                  )}
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading / Error / Content */}
        {isLoading ? (
          <div className="py-20">
            <HackerSnakeLoader size="lg" message="SCANNING EVENT REGISTRY..." />
          </div>
        ) : isError ? (
          <div className="py-12">
            <ErrorState
              title="Unable to load events"
              message="Please verify backend connection."
              onRetry={() => refetch()}
            />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-16">
            <EmptyState
              kicker="MAGIZH EVENTS"
              title="No events matched your search criteria."
              description="Try adjusting your filters or search keywords."
            />
          </div>
        ) : (
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}