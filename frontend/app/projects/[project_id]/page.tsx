"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getProject, type Project } from "@/lib/projects-api";

export default function PublicProjectDetailsPage() {
  const params = useParams();
  const projectId = params.project_id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProject() {
      try {
        setLoading(true);
        setError("");

        const data = await getProject(projectId);
        setProject(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load project details.");
      } finally {
        setLoading(false);
      }
    }

    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  return (
    <main className="min-h-screen bg-black">
      <section className="magizh-container py-12 md:py-20">
        <Link
          href="/projects"
          className="text-sm font-semibold text-[#A1A1A1] transition-colors hover:text-[#D4AF37]"
        >
          ← Back to Showcase
        </Link>

        {loading && (
          <div className="magizh-card mt-10 p-8">
            <p className="magizh-muted">Loading project...</p>
          </div>
        )}

        {error && (
          <div className="magizh-card mt-10 border-[#C75C5C] p-8">
            <p className="text-[#C75C5C]">{error}</p>

            <Link
              href="/projects"
              className="magizh-button mt-6"
            >
              Return to Showcase
            </Link>
          </div>
        )}

        {!loading && !error && project && (
          <article className="mt-10 max-w-4xl">
            <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.3em]">
              PROJECT SHOWCASE
            </p>

            <h1 className="magizh-heading mt-4 text-4xl font-bold leading-tight md:text-6xl">
              {project.title}
            </h1>

            <div className="mt-10 border-t border-[#252525] pt-8">
              <p className="magizh-muted text-xs font-semibold uppercase tracking-[0.2em]">
                ABOUT THE PROJECT
              </p>

              <p className="mt-4 text-base leading-8 text-[#F5F3ED] md:text-lg">
                {project.description ||
                  "No project description available."}
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <div className="magizh-card p-6">
                <p className="magizh-muted text-xs uppercase tracking-widest">
                  Project ID
                </p>

                <p className="mt-3 break-all text-sm text-[#F5F3ED]">
                  {project.id}
                </p>
              </div>

              <div className="magizh-card p-6">
                <p className="magizh-muted text-xs uppercase tracking-widest">
                  Team ID
                </p>

                <p className="mt-3 break-all text-sm text-[#F5F3ED]">
                  {project.team_id}
                </p>
              </div>
            </div>

            {(project.repository_url || project.demo_url) && (
              <div className="mt-10 border-t border-[#252525] pt-8">
                <p className="magizh-muted text-xs font-semibold uppercase tracking-[0.2em]">
                  PROJECT LINKS
                </p>

                <div className="mt-5 flex flex-wrap gap-4">
                  {project.repository_url && (
                    <a
                      href={project.repository_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="magizh-button"
                    >
                      Repository ↗
                    </a>
                  )}

                  {project.demo_url && (
                    <a
                      href={project.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded border border-[#252525] px-5 py-3 font-semibold text-[#F5F3ED] transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37]"
                    >
                      Live Demo ↗
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="mt-12 border-t border-[#252525] pt-6">
              <p className="text-xs text-[#666]">
                Project ID: {project.id}
              </p>
            </div>
          </article>
        )}
      </section>
    </main>
  );
}