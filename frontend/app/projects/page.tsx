"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getProjects, type Project } from "@/lib/projects-api";
import { ProjectShowcaseFilters } from "@/components/projects/showcase-filters";

export default function ProjectsShowcasePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        setError("");

        const data = await getProjects();
        setProjects(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load project showcase.");
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return projects;
    }

    return projects.filter((project) => {
      const title = project.title.toLowerCase();
      const description = project.description?.toLowerCase() ?? "";

      return (
        title.includes(query) ||
        description.includes(query)
      );
    });
  }, [projects, search]);

  return (
    <main className="min-h-screen bg-black">
      <section className="magizh-container py-16 md:py-24">
        <div className="max-w-3xl">
          <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.3em]">
            MAGIZH | INNOVATION
          </p>

          <h1 className="magizh-heading mt-4 text-5xl font-bold leading-tight md:text-6xl">
            Project Showcase
          </h1>

          <p className="magizh-muted mt-5 max-w-2xl text-base leading-7 md:text-lg">
            Explore innovative projects created by students through Magizh
            Technologies events.
          </p>
        </div>

        {!loading && !error && (
          <ProjectShowcaseFilters
            search={search}
            onSearchChange={setSearch}
          />
        )}

        {loading && (
          <div className="magizh-card mt-12 p-8">
            <p className="magizh-muted">Loading projects...</p>
          </div>
        )}

        {error && (
          <div className="magizh-card mt-12 border-[#C75C5C] p-8">
            <p className="text-[#C75C5C]">{error}</p>
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="magizh-card mt-12 p-10 text-center">
            <p className="magizh-gold text-xs font-semibold uppercase tracking-widest">
              SHOWCASE
            </p>

            <h2 className="magizh-heading mt-3 text-2xl font-bold">
              No projects available yet
            </h2>

            <p className="magizh-muted mx-auto mt-3 max-w-lg">
              Projects will appear here once teams create and publish their
              work.
            </p>
          </div>
        )}

        {!loading && !error && projects.length > 0 && (
          <>
            <div className="mt-6 flex items-center justify-between">
              <p className="magizh-muted text-sm">
                {filteredProjects.length}{" "}
                {filteredProjects.length === 1 ? "project" : "projects"} found
              </p>

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-sm font-semibold text-[#D4AF37] transition-colors hover:text-[#E5C04A]"
                >
                  Clear search
                </button>
              )}
            </div>

            {filteredProjects.length === 0 ? (
              <div className="magizh-card mt-6 p-10 text-center">
                <h2 className="magizh-heading text-2xl font-bold">
                  No matching projects
                </h2>

                <p className="magizh-muted mt-3">
                  Try a different project title or keyword.
                </p>
              </div>
            ) : (
              <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="magizh-card group block p-6 transition-all duration-200 hover:border-[#D4AF37]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
                        PROJECT
                      </p>

                      <span className="text-[#555] transition-colors group-hover:text-[#D4AF37]">
                        →
                      </span>
                    </div>

                    <h2 className="magizh-heading mt-5 text-2xl font-bold">
                      {project.title}
                    </h2>

                    {project.description ? (
                      <p className="magizh-muted mt-3 line-clamp-4 text-sm leading-6">
                        {project.description}
                      </p>
                    ) : (
                      <p className="magizh-muted mt-3 text-sm">
                        No project description available.
                      </p>
                    )}

                    <div className="mt-6 border-t border-[#252525] pt-4">
                      <p className="text-xs text-[#666]">
                        Explore project details →
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}