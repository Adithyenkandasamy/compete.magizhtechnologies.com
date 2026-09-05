"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMyRegistrations } from "@/lib/registrations-api";
import {
  getEventTeams,
  type Team,
} from "@/lib/teams-api";
import {
  getTeamProjects,
  type Project,
} from "@/lib/projects-api";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        setError("");

        const registrations = await getMyRegistrations();

        const allTeams: Team[] = [];

        for (const registration of registrations) {
          try {
            const teams = await getEventTeams(registration.event_id);
            allTeams.push(...teams);
          } catch {
            // Ignore events where teams cannot be loaded.
          }
        }

        const uniqueTeams = Array.from(
          new Map(allTeams.map((team) => [team.id, team])).values(),
        );

        const allProjects: Project[] = [];

        for (const team of uniqueTeams) {
          try {
            const teamProjects = await getTeamProjects(team.id);
            allProjects.push(...teamProjects);
          } catch {
            // Ignore teams where projects cannot be loaded.
          }
        }

        const uniqueProjects = Array.from(
          new Map(
            allProjects.map((project) => [project.id, project]),
          ).values(),
        );

        setProjects(uniqueProjects);
      } catch (err) {
        console.error(err);
        setError("Unable to load projects.");
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  return (
    <main className="magizh-container py-12">
      <div className="mb-10">
        <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.25em]">
          MY WORK
        </p>

        <h1 className="magizh-heading mt-3 text-4xl font-bold">
          My Projects
        </h1>

        <p className="magizh-muted mt-3 max-w-2xl">
          View and manage the projects created by your teams.
        </p>
      </div>

      {loading && (
        <div className="magizh-card p-6">
          <p className="magizh-muted">Loading projects...</p>
        </div>
      )}

      {error && (
        <div className="magizh-card border-[#C75C5C] p-6">
          <p className="text-[#C75C5C]">{error}</p>
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="magizh-card p-8 text-center">
          <h2 className="magizh-heading text-2xl">
            No projects yet
          </h2>

          <p className="magizh-muted mt-3">
            Create a project from one of your teams.
          </p>

          <Link
            href="/dashboard/teams"
            className="magizh-button mt-6"
          >
            Go to My Teams
          </Link>
        </div>
      )}

      {!loading && projects.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="magizh-card block p-6 transition hover:border-[#D4AF37]"
            >
              <p className="magizh-gold text-xs font-semibold uppercase tracking-widest">
                PROJECT
              </p>

              <h2 className="magizh-heading mt-3 text-2xl font-bold">
                {project.title}
              </h2>

              {project.description && (
                <p className="magizh-muted mt-3 line-clamp-3">
                  {project.description}
                </p>
              )}

              <p className="magizh-muted mt-5 text-xs">
                Project ID: {project.id}
              </p>

              <div className="mt-5 text-sm font-semibold text-[#D4AF37]">
                Open Project →
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}