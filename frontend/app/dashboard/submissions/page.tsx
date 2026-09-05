"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getMyRegistrations } from "@/lib/registrations-api";
import { getEventTeams, type Team } from "@/lib/teams-api";
import { getTeamProjects, type Project } from "@/lib/projects-api";
import {
  getProjectSubmission,
  type Submission,
} from "@/lib/submissions-api";

type ProjectSubmission = {
  project: Project;
  submission: Submission;
};

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<ProjectSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSubmissions() {
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
            // Ignore events whose teams cannot be loaded.
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
            const projects = await getTeamProjects(team.id);
            allProjects.push(...projects);
          } catch {
            // Ignore teams whose projects cannot be loaded.
          }
        }

        const uniqueProjects = Array.from(
          new Map(
            allProjects.map((project) => [project.id, project]),
          ).values(),
        );

        const results: ProjectSubmission[] = [];

        for (const project of uniqueProjects) {
          try {
            const submission = await getProjectSubmission(project.id);

            results.push({
              project,
              submission,
            });
          } catch {
            // A project without a submission is ignored.
          }
        }

        setSubmissions(results);
      } catch (err) {
        console.error(err);
        setError("Unable to load submissions.");
      } finally {
        setLoading(false);
      }
    }

    loadSubmissions();
  }, []);

  function getStatusClass(status: string) {
    const normalized = status.toUpperCase();

    if (normalized === "SUBMITTED") {
      return "border-[#6FAF7B] text-[#6FAF7B]";
    }

    if (
      normalized === "REJECTED" ||
      normalized === "FAILED"
    ) {
      return "border-[#C75C5C] text-[#C75C5C]";
    }

    return "border-[#D4AF37] text-[#D4AF37]";
  }

  return (
    <main className="magizh-container py-12">
      <div className="mb-10">
        <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.25em]">
          MY WORK
        </p>

        <h1 className="magizh-heading mt-3 text-4xl font-bold">
          My Submissions
        </h1>

        <p className="magizh-muted mt-3 max-w-2xl">
          Track the projects you have submitted for Magizh
          Innovation events.
        </p>
      </div>

      {loading && (
        <div className="magizh-card p-6">
          <p className="magizh-muted">
            Loading submissions...
          </p>
        </div>
      )}

      {error && (
        <div className="magizh-card border-[#C75C5C] p-6">
          <p className="text-[#C75C5C]">{error}</p>
        </div>
      )}

      {!loading &&
        !error &&
        submissions.length === 0 && (
          <div className="magizh-card p-8 text-center">
            <p className="magizh-gold text-xs font-semibold uppercase tracking-widest">
              NO SUBMISSIONS
            </p>

            <h2 className="magizh-heading mt-3 text-2xl font-bold">
              No submissions yet
            </h2>

            <p className="magizh-muted mx-auto mt-3 max-w-md">
              Create a project from one of your teams and
              manage its submission from the project page.
            </p>

            <Link
              href="/dashboard/projects"
              className="magizh-button mt-6"
            >
              Go to My Projects
            </Link>
          </div>
        )}

      {!loading &&
        !error &&
        submissions.length > 0 && (
          <div className="space-y-5">
            {submissions.map(({ project, submission }) => (
              <div
                key={submission.id}
                className="magizh-card p-6"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="magizh-gold text-xs font-semibold uppercase tracking-widest">
                      PROJECT SUBMISSION
                    </p>

                    <h2 className="magizh-heading mt-2 text-2xl font-bold">
                      {project.title}
                    </h2>

                    {project.description && (
                      <p className="magizh-muted mt-2 max-w-2xl line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </div>

                  <div
                    className={`w-fit border px-3 py-2 text-xs font-semibold uppercase tracking-widest ${getStatusClass(
                      submission.status,
                    )}`}
                  >
                    {submission.status}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="border border-[#252525] p-4">
                    <p className="magizh-muted text-xs uppercase tracking-widest">
                      Submission ID
                    </p>

                    <p className="mt-2 break-all text-sm">
                      {submission.id}
                    </p>
                  </div>

                  <div className="border border-[#252525] p-4">
                    <p className="magizh-muted text-xs uppercase tracking-widest">
                      Submitted At
                    </p>

                    <p className="mt-2 text-sm">
                      {submission.submitted_at
                        ? new Date(
                            submission.submitted_at,
                          ).toLocaleString()
                        : "Not submitted yet"}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="magizh-button"
                  >
                    Open Project →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
    </main>
  );
}