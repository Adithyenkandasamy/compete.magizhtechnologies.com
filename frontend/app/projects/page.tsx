"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, FolderGit2, Sparkles, ExternalLink, Globe, ArrowRight } from "lucide-react";

import { getProjects, type Project } from "@/lib/projects-api";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { HackerSnakeLoader, ErrorState, EmptyState } from "@/components/loading";

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
        setError("Unable to load project showcase.");
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return projects;

    return projects.filter((project) => {
      const title = project.title.toLowerCase();
      const description = project.description?.toLowerCase() ?? "";
      return title.includes(query) || description.includes(query);
    });
  }, [projects, search]);

  return (
    <div className="min-h-screen bg-black text-[#F5F3ED] flex flex-col">
      <Navbar />

      <main className="flex-1 magizh-container py-12 md:py-16">
        {/* Header */}
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-[#252525] pb-8">
          <div>
            <div className="flex items-center gap-2">
              <FolderGit2 size={14} className="text-[#D4AF37]" />
              <span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
                MAGIZH INNOVATION SHOWCASE
              </span>
            </div>

            <h1 className="magizh-heading mt-3 text-4xl font-extrabold md:text-5xl lg:text-6xl">
              Student Projects
            </h1>

            <p className="magizh-muted mt-3 max-w-2xl text-xs leading-relaxed md:text-sm">
              Discover cutting-edge prototypes, production systems, and creative solutions engineered by student teams across Magizh hackathons.
            </p>
          </div>

          <div className="text-xs font-mono text-[#D4AF37]">
            <span className="font-bold text-lg">{projects.length}</span> Published Innovations
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A1A1A1]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by project title, problem, or technology..."
              className="w-full rounded border border-[#252525] bg-[#0A0A0A] py-2.5 pl-10 pr-4 text-xs text-[#F5F3ED] placeholder-[#A1A1A1]/60 outline-none transition focus:border-[#D4AF37]"
            />
          </div>

          <div className="text-xs font-mono text-[#A1A1A1]">
            Showing {filteredProjects.length} Projects
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20">
            <HackerSnakeLoader size="lg" message="SCANNING PROJECT SHOWCASE..." />
          </div>
        ) : error ? (
          <div className="py-12">
            <ErrorState title="Unable to load showcase" message={error} />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-16">
            <EmptyState
              kicker="MAGIZH SHOWCASE"
              title="No student projects found."
              description="Projects developed in Magizh hackathons and expos will appear here."
            />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="magizh-card group p-6 flex flex-col justify-between border-[#252525] hover:border-[#D4AF37] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-[#252525] pb-3">
                    <span className="rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#D4AF37]">
                      PROTOTYPE
                    </span>

                    <span className="text-xs text-[#A1A1A1] transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </div>

                  <h3 className="magizh-heading mt-4 text-xl font-bold text-[#F5F3ED] group-hover:text-[#D4AF37] transition-colors">
                    {project.title}
                  </h3>

                  <p className="magizh-muted mt-3 line-clamp-3 text-xs leading-relaxed">
                    {project.description || "Innovative technical solution built during Magizh competition."}
                  </p>
                </div>

                <div className="mt-6 border-t border-[#252525] pt-4 flex items-center justify-between text-xs text-[#A1A1A1]">
                  <span className="font-mono text-[11px] text-[#A1A1A1]">
                    ID: {project.id.slice(0, 8)}
                  </span>
                  <span className="font-semibold text-[#D4AF37]">
                    Case Study →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}