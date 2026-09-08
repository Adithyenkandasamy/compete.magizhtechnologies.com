"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

import { getMyRegistrations } from "@/lib/registrations-api";
import { getEvent } from "@/lib/events-api";
import { createTeam, getEventTeams } from "@/lib/teams-api";
import type { Registration } from "@/lib/registrations-api";
import type { Event } from "@/types/events";
import type { Team } from "@/lib/teams-api";
import { getErrorMessage } from "@/lib/error-message";
import { PageLoader } from "@/components/loading";
import { BackButton } from "@/components/ui/BackButton";

type RegisteredEvent = {
  registration: Registration;
  event: Event;
  teams: Team[];
};

export default function MyEventsPage() {
  const [registeredEvents, setRegisteredEvents] = useState<
    RegisteredEvent[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [creatingForEvent, setCreatingForEvent] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamError, setTeamError] = useState("");
  const [teamSuccess, setTeamSuccess] = useState("");

  useEffect(() => {
    async function loadMyEvents() {
      try {
        setError("");

        const registrations = await getMyRegistrations();

        const results = await Promise.all(
          registrations.map(async (registration) => {
            let event: Event | null = null;

            try {
              event = await getEvent(registration.event_id);
            } catch (err: unknown) {
              console.error(
                "Unable to load event for registration:",
                err,
              );
            }

            if (!event) {
              return null;
            }

            let teams: Team[] = [];

            try {
              teams = await getEventTeams(registration.event_id);
            } catch {
              teams = [];
            }

            return {
              registration,
              event,
              teams,
            };
          }),
        );

        setRegisteredEvents(results.filter((item) => item !== null));
      } catch (err: unknown) {
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

  async function handleCreateTeam(eventId: string) {
    if (!teamName.trim()) {
      setTeamError("Please enter a team name.");
      return;
    }

    setTeamError("");
    setTeamSuccess("");
    setIsCreating(true);

    try {
      const newTeam = await createTeam(eventId, {
        name: teamName.trim(),
      });

      setRegisteredEvents((current) =>
        current.map((item) =>
          item.event.id === eventId
            ? { ...item, teams: [...item.teams, newTeam] }
            : item,
        ),
      );

      setTeamName("");
      setTeamSuccess("Team created successfully.");
    } catch (err: unknown) {
      setTeamError(
        getErrorMessage(err, "Unable to create the team."),
      );
    } finally {
      setCreatingForEvent("");
      setIsCreating(false);
    }
  }

  if (isLoading) {
    return (
      <main className="magizh-container py-20">
        <PageLoader label="Loading your events..." />
      </main>
    );
  }

  return (
    <main className="magizh-container py-12 md:py-16">
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

      {!error && registeredEvents.length > 0 && (
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {registeredEvents.map(({ registration, event, teams }) => {
            const myTeam = teams[0] ?? null;

            return (
              <article
                key={registration.id}
                className="magizh-card flex flex-col overflow-hidden transition-colors duration-200 hover:border-[#D4AF37]"
              >
                {event.banner_url ? (
                  <div className="relative aspect-[16/8] overflow-hidden border-b border-[#252525]">
                    <Image
                      fill
                      unoptimized
                      src={event.banner_url}
                      alt={event.title}
                      className="object-cover"
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[16/8] items-center justify-center border-b border-[#252525] bg-[#0A0A0A]">
                    <span className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
                      MAGIZH EVENT
                    </span>
                  </div>
                )}

                <div className="flex flex-1 flex-col p-6">
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

                  <div className="mt-6 flex flex-col gap-3 border-t border-[#252525] pt-5">
                    {myTeam ? (
                      <Link
                        href={`/dashboard/teams/${myTeam.id}`}
                        className="inline-flex items-center justify-center border border-[#D4AF37]/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#D4AF37] transition-colors hover:bg-[#D4AF37]/10"
                      >
                        Manage Team
                      </Link>
                    ) : creatingForEvent === event.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={teamName}
                          onChange={(e) =>
                            setTeamName(e.target.value)
                          }
                          placeholder="Team name"
                          className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-2.5 text-sm text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
                        />

                        <button
                          type="button"
                          disabled={isCreating}
                          onClick={() =>
                            handleCreateTeam(event.id)
                          }
                          className="w-full bg-[#D4AF37] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-black transition hover:bg-[#E5C04A] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Create Team
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setTeamName("");
                          setTeamError("");
                          setTeamSuccess("");
                          setCreatingForEvent(event.id);
                        }}
                        className="inline-flex items-center justify-center bg-[#D4AF37] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-black transition hover:bg-[#E5C04A]"
                      >
                        Create Team
                      </button>
                    )}

                    {teamError && creatingForEvent === event.id && (
                      <p className="text-xs text-[#C75C5C]">
                        {teamError}
                      </p>
                    )}

                    {teamSuccess && creatingForEvent === event.id && (
                      <p className="text-xs text-[#6FAF7B]">
                        {teamSuccess}
                      </p>
                    )}
                  </div>

                  <Link
                    href={`/events/${event.id}`}
                    className="mt-5 inline-flex text-sm font-semibold uppercase tracking-wider text-[#D4AF37] transition-colors hover:text-[#E5C04A]"
                  >
                    View Event →
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}