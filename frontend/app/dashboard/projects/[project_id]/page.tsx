"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { deleteProject, getProject, updateProject } from "@/lib/projects-api";
import { getTeam } from "@/lib/teams-api";
import { getErrorMessage } from "@/lib/error-message";
import type { Project } from "@/types/project";
import type { Team } from "@/lib/teams-api";

type FormState = {
  title: string;
  description: string;
  problem: string;
  solution: string;
  techStack: string;
  githubUrl: string;
  demoUrl: string;
  videoUrl: string;
};

function toForm(project: Project): FormState {
  return {
    title: project.title,
    description: project.description || "",
    problem: project.problem || "",
    solution: project.solution || "",
    techStack: (project.tech_stack || []).join(", "),
    githubUrl: project.github_url || "",
    demoUrl: project.demo_url || "",
    videoUrl: project.video_url || "",
  };
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const projectId = params.project_id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [team, setTeam] = useState<Team | null>(null);

  const [form, setForm] = useState<FormState | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadProject() {
      try {
        setError("");

        const data = await getProject(projectId);
        setProject(data);
        setForm(toForm(data));

        const teamData = await getTeam(data.team_id);
        setTeam(teamData);
      } catch (err: unknown) {
        const message =
          getErrorMessage(err, "Unable to load this project.");

        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form?.title.trim()) {
      setError("Project title is required.");
      return;
    }

    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      const updated = await updateProject(projectId, {
        title: form.title.trim(),
        description: form.description.trim() || null,
        problem: form.problem.trim() || null,
        solution: form.solution.trim() || null,
        tech_stack: form.techStack
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        github_url: form.githubUrl.trim() || null,
        demo_url: form.demoUrl.trim() || null,
        video_url: form.videoUrl.trim() || null,
      });

      setProject(updated);
      setForm(toForm(updated));
      setIsEditing(false);
      setSuccess("Project updated successfully.");
    } catch (err: unknown) {
      const message =
        getErrorMessage(err, "Unable to update the project.");

      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project? This action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    setIsDeleting(true);

    try {
      await deleteProject(projectId);

      router.push("/dashboard/projects");
    } catch (err: unknown) {
      const message =
        getErrorMessage(err, "Unable to delete the project.");

      setError(message);
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="magizh-container py-20">
        <p className="magizh-muted">Loading project...</p>
      </main>
    );
  }

  if (!project || !team) {
    return (
      <main className="magizh-container py-20">
        <div className="magizh-card p-8">
          <p className="text-[#C75C5C]">{error || "Project not found."}</p>

          <Link
            href="/dashboard/projects"
            className="mt-5 inline-flex text-sm font-semibold uppercase tracking-wider text-[#D4AF37] hover:text-[#E5C04A]"
          >
            ← Back to Projects
          </Link>
        </div>
      </main>
    );
  }

  const urlFields = [
    { label: "GitHub", value: project.github_url },
    { label: "Live Demo", value: project.demo_url },
    { label: "Video", value: project.video_url },
  ].filter((item) => item.value) as { label: string; value: string }[];

  return (
    <main className="magizh-container py-12 md:py-16">
      <div className="mb-10">
        <Link
          href="/dashboard/projects"
          className="text-sm font-semibold uppercase tracking-wider text-[#D4AF37] transition-colors hover:text-[#E5C04A]"
        >
          ← My Projects
        </Link>

        <p className="magizh-gold mt-8 text-xs font-semibold uppercase tracking-[0.25em]">
          PROJECT
        </p>

        <h1 className="magizh-heading mt-3 text-4xl font-bold md:text-5xl">
          {project.title}
        </h1>

        <p className="magizh-muted mt-4 max-w-2xl">
          Built by team {team.name}.
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

      {isEditing ? (
        <form
          onSubmit={handleSave}
          className="magizh-card space-y-6 p-6 md:p-8"
        >
          <div>
            <label htmlFor="title" className="mb-2 block text-sm font-medium">
              Project Title <span className="text-[#C75C5C]">*</span>
            </label>

            <input
              id="title"
              type="text"
              value={form?.title ?? ""}
              onChange={(e) => updateField("title", e.target.value)}
              required
              className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium"
            >
              Description
            </label>

            <textarea
              id="description"
              value={form?.description ?? ""}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
              className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label htmlFor="problem" className="mb-2 block text-sm font-medium">
              Problem
            </label>

            <textarea
              id="problem"
              value={form?.problem ?? ""}
              onChange={(e) => updateField("problem", e.target.value)}
              rows={3}
              className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label htmlFor="solution" className="mb-2 block text-sm font-medium">
              Solution
            </label>

            <textarea
              id="solution"
              value={form?.solution ?? ""}
              onChange={(e) => updateField("solution", e.target.value)}
              rows={3}
              className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label
              htmlFor="techStack"
              className="mb-2 block text-sm font-medium"
            >
              Tech Stack
            </label>

            <input
              id="techStack"
              type="text"
              value={form?.techStack ?? ""}
              onChange={(e) => updateField("techStack", e.target.value)}
              placeholder="React, FastAPI, PostgreSQL"
              className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
            />

            <p className="magizh-muted mt-2 text-xs">
              Comma-separated list of technologies.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <label
                htmlFor="githubUrl"
                className="mb-2 block text-sm font-medium"
              >
                GitHub URL
              </label>

              <input
                id="githubUrl"
                type="url"
                value={form?.githubUrl ?? ""}
                onChange={(e) => updateField("githubUrl", e.target.value)}
                className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label
                htmlFor="demoUrl"
                className="mb-2 block text-sm font-medium"
              >
                Demo URL
              </label>

              <input
                id="demoUrl"
                type="url"
                value={form?.demoUrl ?? ""}
                onChange={(e) => updateField("demoUrl", e.target.value)}
                className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label
                htmlFor="videoUrl"
                className="mb-2 block text-sm font-medium"
              >
                Video URL
              </label>

              <input
                id="videoUrl"
                type="url"
                value={form?.videoUrl ?? ""}
                onChange={(e) => updateField("videoUrl", e.target.value)}
                className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              type="submit"
              disabled={isSaving}
              className="magizh-button disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
              className="rounded border border-[#252525] px-4 py-3 text-sm font-semibold transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <section className="magizh-card space-y-6 p-6 md:p-8">
            <div>
              <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
                DESCRIPTION
              </p>

              <p className="mt-3 leading-7">
                {project.description || "No description provided."}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded border border-[#252525] bg-[#0A0A0A] p-5">
                <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
                  PROBLEM
                </p>

                <p className="mt-3 text-sm leading-6">
                  {project.problem || "Not specified."}
                </p>
              </div>

              <div className="rounded border border-[#252525] bg-[#0A0A0A] p-5">
                <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
                  SOLUTION
                </p>

                <p className="mt-3 text-sm leading-6">
                  {project.solution || "Not specified."}
                </p>
              </div>
            </div>

            {project.tech_stack && project.tech_stack.length > 0 && (
              <div>
                <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
                  TECH STACK
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {project.tech_stack.map((tech) => (
                    <span
                      key={tech}
                      className="rounded border border-[#252525] bg-[#0A0A0A] px-3 py-1.5 text-sm text-[#D4AF37]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {urlFields.length > 0 && (
              <div>
                <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
                  LINKS
                </p>

                <div className="mt-3 flex flex-wrap gap-3">
                  {urlFields.map((item) => (
                    <a
                      key={item.label}
                      href={item.value}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="rounded border border-[#252525] px-3 py-1.5 text-sm font-semibold text-[#D4AF37] transition-colors hover:border-[#D4AF37]"
                    >
                      {item.label} ↗
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <div className="magizh-card p-6">
              <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
                PROJECT ACTIONS
              </p>

              <h2 className="magizh-heading mt-2 text-2xl font-bold">
                Manage
              </h2>

              <p className="magizh-muted mt-3 text-sm leading-6">
                Edit the project details or remove it entirely.
              </p>

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setSuccess("");
                    setIsEditing(true);
                  }}
                  disabled={isDeleting}
                  className="magizh-button w-full disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Edit Project
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full rounded border border-[#C75C5C]/50 px-4 py-3 text-sm font-semibold text-[#C75C5C] transition-colors hover:bg-[#C75C5C]/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Delete Project"}
                </button>
              </div>
            </div>

            <div className="magizh-card p-6">
              <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
                TEAM
              </p>

              <h2 className="magizh-heading mt-2 text-xl font-bold">
                {team.name}
              </h2>

              <Link
                href={`/dashboard/teams/${team.id}`}
                className="mt-4 inline-flex text-sm font-semibold uppercase tracking-wider text-[#D4AF37] transition-colors hover:text-[#E5C04A]"
              >
                Manage Team →
              </Link>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}