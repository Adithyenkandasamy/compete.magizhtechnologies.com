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
          new Map(
            allTeams.map((team) => [team.id, team]),
          ).values(),
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
        console.error("Unable to load projects:", err);
        setError("Unable to load projects.");
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

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
          Manage the projects your teams build for Magizh Technologies
          events.
        </p>
      </div>

      {loading && (
        <div className="magizh-card p-6">
          <p className="magizh-muted">
            Loading projects...
          </p>
        </div>
      )}

      {error && (
        <div className="magizh-card border-[#C75C5C] p-6">
          <p className="text-[#C75C5C]">{error}</p>
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="magizh-card p-10 text-center">
          <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
            NO PROJECTS YET
          </p>

          <h2 className="magizh-heading mt-3 text-2xl font-bold">
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

      {!loading && !error && projects.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="magizh-card group block p-6 transition hover:border-[#D4AF37]"
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

              <div className="mt-5 text-sm font-semibold text-[#D4AF37] transition-colors group-hover:text-[#E5C04A]">
                Open Project →
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}