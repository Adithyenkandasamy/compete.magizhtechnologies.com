"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getMyRegistrations } from "@/lib/registrations-api";
import { getEvent } from "@/lib/events-api";
import { createTeam, getEventTeams } from "@/lib/teams-api";
import type { Registration } from "@/lib/registrations-api";
import type { Event } from "@/types/events";
import type { Team } from "@/lib/teams-api";

type EventTeams = {
  event: Event;
  teams: Team[];
};

export default function MyTeamsPage() {
  const [eventTeams, setEventTeams] = useState<EventTeams[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [creatingForEvent, setCreatingForEvent] = useState("");
  const [teamName, setTeamName] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadTeams() {
      try {
        setError("");

        const registrations: Registration[] =
          await getMyRegistrations();

        const registeredEventData = await Promise.all(
          registrations.map(async (registration) => {
            const event = await getEvent(registration.event_id);
            const teams = await getEventTeams(registration.event_id);

            return {
              event,
              teams,
            };
          }),
        );

        setEventTeams(registeredEventData);
      } catch (err: any) {
        const message =
          err?.response?.data?.detail ||
          "Unable to load your teams.";

        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadTeams();
  }, []);

  async function handleCreateTeam(
    eventId: string,
  ) {
    if (!teamName.trim()) {
      setError("Please enter a team name.");
      return;
    }

    setError("");
    setSuccess("");
    setCreatingForEvent(eventId);

    try {
      const newTeam = await createTeam(eventId, {
        name: teamName.trim(),
      });

      setEventTeams((current) =>
        current.map((item) =>
          item.event.id === eventId
            ? {
                ...item,
                teams: [...item.teams, newTeam],
              }
            : item,
        ),
      );

      setTeamName("");
      setSuccess("Team created successfully.");
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        "Unable to create the team.";

      setError(message);
    } finally {
      setCreatingForEvent("");
    }
  }

  if (isLoading) {
    return (
      <main className="magizh-container py-20">
        <p className="magizh-muted">Loading your teams...</p>
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
          MY TEAMS
        </p>

        <h1 className="magizh-heading mt-3 text-4xl font-bold md:text-5xl">
          Team Management
        </h1>

        <p className="magizh-muted mt-4 max-w-2xl text-base leading-7">
          Create and manage teams for the Magizh Technologies events you have
          registered for.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded border border-[#C75C5C]/40 bg-[#C75C5C]/10 px-4 py-3">
          <p className="text-sm text-[#C75C5C]">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 rounded border border-[#6FAF7B]/40 bg-[#6FAF7B]/10 px-4 py-3">
          <p className="text-sm text-[#6FAF7B]">{success}</p>
        </div>
      )}

      {eventTeams.length === 0 && (
        <div className="magizh-card p-10 text-center">
          <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
            NO EVENTS
          </p>

          <h2 className="magizh-heading mt-3 text-2xl font-bold">
            Register for an event first.
          </h2>

          <p className="magizh-muted mt-3">
            Once you register for an event, you can create and manage your
            team here.
          </p>

          <Link
            href="/events"
            className="magizh-button mt-6"
          >
            Explore Events
          </Link>
        </div>
      )}

      <div className="space-y-10">
        {eventTeams.map(({ event, teams }) => (
          <section key={event.id}>
            <div className="mb-5">
              <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
                {event.event_type.replace("_", " ")}
              </p>

              <h2 className="magizh-heading mt-2 text-3xl font-bold">
                {event.title}
              </h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <div>
                {teams.length === 0 ? (
                  <div className="magizh-card p-7">
                    <h3 className="magizh-heading text-xl font-bold">
                      No teams yet
                    </h3>

                    <p className="magizh-muted mt-2 text-sm">
                      Create a team to start collaborating for this event.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2">
                    {teams.map((team) => (
                      <article
                        key={team.id}
                        className="magizh-card p-6 transition-colors duration-200 hover:border-[#D4AF37]"
                      >
                        <p className="magizh-muted text-xs uppercase tracking-[0.15em]">
                          Team
                        </p>

                        <h3 className="magizh-heading mt-2 text-2xl font-bold">
                          {team.name}
                        </h3>

                        <div className="mt-5 space-y-2 text-sm">
                          <p>
                            <span className="magizh-muted">
                              Team ID:{" "}
                            </span>
                            {team.id}
                          </p>

                          <p>
                            <span className="magizh-muted">
                              Leader ID:{" "}
                            </span>
                            {team.leader_id}
                          </p>
                        </div>

                        <Link
                          href={`/dashboard/teams/${team.id}`}
                          className="mt-6 inline-flex text-sm font-semibold uppercase tracking-wider text-[#D4AF37] transition-colors hover:text-[#E5C04A]"
                        >
                          Manage Team →
                        </Link>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <aside className="magizh-card h-fit p-6">
                <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
                  CREATE TEAM
                </p>

                <h3 className="magizh-heading mt-2 text-2xl font-bold">
                  Start a new team
                </h3>

                <p className="magizh-muted mt-3 text-sm leading-6">
                  Create a team for this event and invite other participants
                  later.
                </p>

                <div className="mt-5">
                  <label
                    htmlFor={`team-name-${event.id}`}
                    className="mb-2 block text-sm font-medium"
                  >
                    Team Name
                  </label>

                  <input
                    id={`team-name-${event.id}`}
                    type="text"
                    value={
                      creatingForEvent === event.id
                        ? teamName
                        : ""
                    }
                    onChange={(e) => {
                      setCreatingForEvent(event.id);
                      setTeamName(e.target.value);
                    }}
                    placeholder="Enter team name"
                    className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleCreateTeam(event.id)}
                  disabled={creatingForEvent === event.id && !teamName.trim()}
                  className="magizh-button mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatingForEvent === event.id
                    ? "Creating..."
                    : "Create Team"}
                </button>
              </aside>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}