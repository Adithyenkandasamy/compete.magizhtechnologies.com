"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/providers/auth-provider";
import { getMyRegistrations } from "@/lib/registrations-api";
import { getEvent } from "@/lib/events-api";
import { createTeam, getEventTeams } from "@/lib/teams-api";
import type { Registration } from "@/lib/registrations-api";
import type { Event } from "@/types/events";
import type { Team } from "@/lib/teams-api";
import { getErrorMessage } from "@/lib/error-message";
import { PageLoader } from "@/components/loading";
import { BackButton } from "@/components/ui/BackButton";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { Calendar, Users, Sparkles, ArrowUpRight, Loader2 } from "lucide-react";

type RegisteredEvent = {
  registration: Registration;
  event: Event;
  teams: Team[];
};

/**
 * Fetches all registrations, then enriches each with its event + user's teams.
 */
async function fetchRegisteredEvents(): Promise<RegisteredEvent[]> {
  const registrations = await getMyRegistrations();

  const results = await Promise.all(
    registrations.map(async (registration) => {
      let event: Event | null = null;

      try {
        event = await getEvent(registration.event_id);
      } catch (err: unknown) {
        console.error("Unable to load event for registration:", err);
      }

      if (!event) return null;

      let teams: Team[] = [];
      try {
        teams = await getEventTeams(registration.event_id, {
          myTeamsOnly: true,
        });
      } catch {
        teams = [];
      }

      return { registration, event, teams };
    }),
  );

  return results.filter((item) => item !== null);
}

export default function MyEventsPage() {
  const router = useRouter();
  const { status } = useAuth();
  const queryClient = useQueryClient();

  const [creatingForEvent, setCreatingForEvent] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamError, setTeamError] = useState("");
  const [teamSuccess, setTeamSuccess] = useState("");

  // Redirect unauthenticated users
  if (status === "unauthenticated") {
    router.replace("/login?redirect=/dashboard/events");
  }

  const {
    data: registeredEvents = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["my-registered-events"],
    queryFn: fetchRegisteredEvents,
    enabled: status === "authenticated",
    staleTime: 60 * 1000,     // 60s – avoid refetch on tab switch
    gcTime: 5 * 60 * 1000,
  });

  async function handleCreateTeam(eventId: string) {
    if (!teamName.trim()) {
      setTeamError("Please enter a team name.");
      return;
    }

    setTeamError("");
    setTeamSuccess("");
    setIsCreating(true);

    try {
      await createTeam(eventId, { name: teamName.trim() });
      setTeamName("");
      setTeamSuccess("Team created successfully.");

      // Refetch registered events so the new team shows up
      queryClient.invalidateQueries({ queryKey: ["my-registered-events"] });
    } catch (err: unknown) {
      setTeamError(getErrorMessage(err, "Unable to create the team."));
    } finally {
      setCreatingForEvent("");
      setIsCreating(false);
    }
  }

  // Loading / auth states
  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return (
      <div className="min-h-screen bg-black flex flex-col text-[#F5F3ED]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-[#A1A1A1]">
            <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37]" />
            Loading your events...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const errorMessage = error
    ? getErrorMessage(error, "Unable to load your registered events.")
    : "";

  return (
    <div className="min-h-screen bg-black flex flex-col text-[#F5F3ED]">
      <Navbar />

      <main className="flex-1 magizh-container py-12 md:py-16">
        <BackButton label="Back" href="/dashboard" className="mb-6" />

        <div className="mb-10">
          <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.25em]">
            MY EVENTS
          </p>

          <h1 className="magizh-heading mt-3 text-4xl font-bold md:text-5xl">
            Registered Events
          </h1>

          <p className="magizh-muted mt-4 max-w-2xl text-base leading-7">
            View the events you have registered for, build your team, and
            continue managing your participation.
          </p>
        </div>

        {errorMessage && (
          <div className="magizh-card mb-8 p-6">
            <p className="text-sm text-[#C75C5C]">{errorMessage}</p>
          </div>
        )}

        {!errorMessage && registeredEvents.length === 0 && (
          <div className="magizh-card p-10 text-center">
            <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
              NO REGISTRATIONS
            </p>

            <h2 className="magizh-heading mt-3 text-2xl font-bold">
              You haven&apos;t registered for any events yet.
            </h2>

            <p className="magizh-muted mt-3">
              Explore upcoming Magizh Technologies events and register to
              participate.
            </p>

            <Link href="/events" className="magizh-button mt-6">
              Explore Events
            </Link>
          </div>
        )}

        {!errorMessage && registeredEvents.length > 0 && (
          <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {registeredEvents.map(({ registration, event, teams }) => {
              const myTeam = teams[0] ?? null;

              const hasRealBanner =
                Boolean(event.banner_url) &&
                !event.banner_url?.includes("placehold.co");

              return (
                <article
                  key={registration.id}
                  className="magizh-card group flex flex-col overflow-hidden transition-all duration-300 hover:border-[#D4AF37]/80 hover:shadow-[0_0_30px_rgba(212,175,55,0.08)]"
                >
                  {/* Visual Header */}
                  {hasRealBanner ? (
                    <div className="relative aspect-[16/8] overflow-hidden border-b border-[#252525]">
                      <Image
                        fill
                        unoptimized
                        src={event.banner_url!}
                        alt={event.title}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0F] via-black/20 to-black/60" />
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="rounded border border-[#D4AF37]/40 bg-black/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] backdrop-blur-md">
                          {event.event_type.replace("_", " ")}
                        </span>
                        <span className="rounded border border-[#252525] bg-black/80 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#A1A1A1] backdrop-blur-md">
                          {event.mode}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className="rounded border border-[#6FAF7B]/40 bg-black/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#6FAF7B] backdrop-blur-md">
                          {registration.status}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative aspect-[16/8] overflow-hidden border-b border-[#252525] bg-gradient-to-br from-[#121217] via-[#0D0D10] to-[#070709] p-5 flex flex-col justify-between">
                      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-[#D4AF37]/10 blur-xl pointer-events-none" />
                      <div className="absolute inset-0 bg-[radial-gradient(#252525_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

                      <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="rounded border border-[#D4AF37]/40 bg-[#0A0A0A]/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                            {event.event_type.replace("_", " ")}
                          </span>
                          <span className="rounded border border-[#252525] bg-[#0A0A0A]/90 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#A1A1A1]">
                            {event.mode}
                          </span>
                        </div>
                        <span className="rounded border border-[#6FAF7B]/40 bg-[#6FAF7B]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#6FAF7B]">
                          {registration.status}
                        </span>
                      </div>

                      <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-mono text-[#D4AF37]">
                          <Sparkles size={13} />
                          <span className="font-bold tracking-widest text-[10px] uppercase">
                            MAGIZH INNOVATION
                          </span>
                        </div>
                        {event.prize_pool ? (
                          <span className="font-mono text-[10px] font-semibold text-[#D4AF37]/90">
                            ₹{Number(event.prize_pool).toLocaleString("en-IN")} PRIZE
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] text-[#A1A1A1]/60 uppercase tracking-wider">
                            VERIFIED
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Card Content */}
                  <div className="flex flex-1 flex-col p-6">
                    <Link href={`/events/${event.id}`}>
                      <h3 className="magizh-heading text-xl font-bold text-[#F5F3ED] transition-colors group-hover:text-[#D4AF37]">
                        {event.title}
                      </h3>
                    </Link>

                    <p className="magizh-muted mt-2.5 line-clamp-2 text-xs leading-relaxed">
                      {event.description}
                    </p>

                    {/* Metadata Chips */}
                    <div className="mt-5 space-y-2.5 rounded-lg border border-[#252525]/70 bg-[#0A0A0C] p-3.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-[#A1A1A1]">
                          <Calendar size={13} className="text-[#D4AF37]" />
                          Dates:
                        </span>
                        <span className="font-mono text-[#F5F3ED]">
                          {new Date(event.start_date).toLocaleDateString()} –{" "}
                          {new Date(event.end_date).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-t border-[#252525]/60 pt-2.5">
                        <span className="flex items-center gap-1.5 text-[#A1A1A1]">
                          <Users size={13} className="text-[#D4AF37]" />
                          Your Team:
                        </span>
                        {myTeam ? (
                          <span className="font-semibold text-[#F5F3ED]">
                            {myTeam.name}
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-[#D4AF37]">
                            Not formed yet
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="mt-6 flex flex-col gap-3 border-t border-[#252525] pt-5">
                      {myTeam ? (
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/teams/${myTeam.id}`}
                            className="flex-1 rounded border border-[#D4AF37]/50 bg-[#D4AF37]/10 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-black"
                          >
                            Manage Team
                          </Link>
                          <Link
                            href={`/events/${event.id}`}
                            className="flex items-center justify-center rounded border border-[#252525] bg-[#0A0A0A] px-3.5 py-2.5 text-xs text-[#A1A1A1] transition hover:border-[#D4AF37] hover:text-[#F5F3ED]"
                            title="View Event Details"
                          >
                            <ArrowUpRight size={15} />
                          </Link>
                        </div>
                      ) : creatingForEvent === event.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            placeholder="Enter team name"
                            className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-3.5 py-2 text-xs text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
                          />

                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={isCreating}
                              onClick={() => handleCreateTeam(event.id)}
                              className="flex-1 rounded bg-[#D4AF37] py-2 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[#E5C04A] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isCreating ? "Creating..." : "Save Team"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setCreatingForEvent("")}
                              className="rounded border border-[#252525] px-3 py-2 text-xs text-[#A1A1A1] hover:text-[#F5F3ED]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setTeamName("");
                              setTeamError("");
                              setTeamSuccess("");
                              setCreatingForEvent(event.id);
                            }}
                            className="flex-1 rounded bg-[#D4AF37] py-2.5 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[#E5C04A]"
                          >
                            Create Team
                          </button>
                          <Link
                            href={`/events/${event.id}`}
                            className="flex items-center justify-center rounded border border-[#252525] bg-[#0A0A0A] px-3.5 py-2.5 text-xs text-[#A1A1A1] transition hover:border-[#D4AF37] hover:text-[#F5F3ED]"
                            title="View Event Details"
                          >
                            <ArrowUpRight size={15} />
                          </Link>
                        </div>
                      )}

                      {teamError && creatingForEvent === event.id && (
                        <p className="text-xs text-[#C75C5C]">{teamError}</p>
                      )}

                      {teamSuccess && creatingForEvent === event.id && (
                        <p className="text-xs text-[#6FAF7B]">{teamSuccess}</p>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}