"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getMyRegistrations } from "@/lib/registrations-api";
import { getEvent } from "@/lib/events-api";
import { getEventTeams } from "@/lib/teams-api";
import { getTeamProject } from "@/lib/projects-api";
import { getErrorMessage } from "@/lib/error-message";
import type { Registration } from "@/lib/registrations-api";
import type { Event } from "@/types/events";
import type { Team } from "@/lib/teams-api";
import type { Project } from "@/types/project";

type TeamProject = {
  team: Team;
  project: Project | null;
};

type EventProjects = {
  event: Event;
  teams: TeamProject[];
};

export default function MyProjectsPage() {
  const [eventProjects, setEventProjects] = useState<EventProjects[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProjects() {
      try {
        setError("");

        const registrations: Registration[] = await getMyRegistrations();

        const data = await Promise.all(
          registrations.map(async (registration) => {
            const event = await getEvent(registration.event_id);
            const teams = await getEventTeams(registration.event_id);

            const teamProjects = await Promise.all(
              teams.map(async (team) => ({
                team,
                project: await getTeamProject(team.id),
              })),
            );

            return {
              event,
              teams: teamProjects,
            };
          }),
        );

        setEventProjects(data);
      } catch (err: unknown) {
        const message =
          getErrorMessage(err, "Unable to load your projects.");

        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadProjects();
  }, []);

  if (isLoading) {
    return (
      <main className="magizh-container py-20">
        <p className="magizh-muted">Loading your projects...</p>
      </main>
    );
  }

  const projects = eventProjects
    .flatMap(({ event, teams }) =>
      teams.map(({ team, project }) => ({ event, team, project })),
    )
    .filter(({ project }) => project !== null) as {
    event: Event;
    team: Team;
    project: Project;
  }[];

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
          MY PROJECTS
        </p>

        <h1 className="magizh-heading mt-3 text-4xl font-bold md:text-5xl">
          Innovation Projects
        </h1>

        <p className="magizh-muted mt-4 max-w-2xl text-base leading-7">
          Manage the projects your teams build for Magizh Technologies events.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded border border-[#C75C5C]/40 bg-[#C75C5C]/10 px-4 py-3">
          <p className="text-sm text-[#C75C5C]">{error}</p>
        </div>
      )}

      {!error && eventProjects.length === 0 && (
        <div className="magizh-card p-10 text-center">
          <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
            NO TEAMS
          </p>

          <h2 className="magizh-heading mt-3 text-2xl font-bold">
            Join a team to build a project.
          </h2>

          <p className="magizh-muted mt-3">
            Once you create or join a team for an event, you can add your
            project here.
          </p>

          <Link href="/events" className="magizh-button mt-6">
            Explore Events
          </Link>
        </div>
      )}

      {!error && eventProjects.length > 0 && projects.length === 0 && (
        <div className="magizh-card p-10 text-center">
          <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
            NO PROJECTS YET
          </p>

          <h2 className="magizh-heading mt-3 text-2xl font-bold">
            Your teams haven&apos;t added a project.
          </h2>

          <p className="magizh-muted mt-3">
            Pick a team below and create its first project.
          </p>
        </div>
      )}

      <div className="space-y-10">
        {eventProjects.map(({ event, teams }) => (
          <section key={event.id}>
            <div className="mb-5">
              <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
                {event.event_type.replace("_", " ")}
              </p>

              <h2 className="magizh-heading mt-2 text-3xl font-bold">
                {event.title}
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {teams.map(({ team, project }) => (
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

                  {project ? (
                    <div className="mt-5">
                      <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.15em]">
                        PROJECT
                      </p>

                      <h4 className="magizh-heading mt-2 text-lg font-bold">
                        {project.title}
                      </h4>

                      {project.tech_stack &&
                        project.tech_stack.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {project.tech_stack.map((tech) => (
                              <span
                                key={tech}
                                className="rounded border border-[#252525] bg-[#0A0A0A] px-2 py-1 text-xs text-[#D4AF37]"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}

                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        className="mt-6 inline-flex text-sm font-semibold uppercase tracking-wider text-[#D4AF37] transition-colors hover:text-[#E5C04A]"
                      >
                        Manage Project →
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-5">
                      <p className="magizh-muted text-sm">
                        No project yet for this team.
                      </p>

                      <Link
                        href={`/dashboard/projects/new/${team.id}`}
                        className="mt-6 inline-flex text-sm font-semibold uppercase tracking-wider text-[#D4AF37] transition-colors hover:text-[#E5C04A]"
                      >
                        Create Project →
                      </Link>
                    </div>
                  )}
                </article>
              ))}

              {teams.length === 0 && (
                <div className="magizh-card p-7">
                  <p className="magizh-muted text-sm">
                    You are not in a team for this event yet.
                  </p>

                  <Link
                    href="/dashboard/teams"
                    className="mt-5 inline-flex text-sm font-semibold uppercase tracking-wider text-[#D4AF37] transition-colors hover:text-[#E5C04A]"
                  >
                    Manage Teams →
                  </Link>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}