"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { getEvent } from "@/lib/events-api";
import { getTeam } from "@/lib/teams-api";
import { createTeamProject } from "@/lib/projects-api";
import { getErrorMessage } from "@/lib/error-message";
import type { Event } from "@/types/events";
import type { Team } from "@/lib/teams-api";

export default function NewProjectPage() {
  const params = useParams();
  const router = useRouter();

  const teamId = params.team_id as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [event, setEvent] = useState<Event | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [techStack, setTechStack] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadContext() {
      try {
        setError("");

        const teamData = await getTeam(teamId);
        setTeam(teamData);

        const eventData = await getEvent(teamData.event_id);
        setEvent(eventData);
      } catch (err: unknown) {
        const message =
          getErrorMessage(err, "Unable to load this team.");

        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    if (teamId) {
      loadContext();
    }
  }, [teamId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      setError("Project title is required.");
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      const project = await createTeamProject(teamId, {
        title: title.trim(),
        description: description.trim() || null,
        problem: problem.trim() || null,
        solution: solution.trim() || null,
        tech_stack: techStack
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        github_url: githubUrl.trim() || null,
        demo_url: demoUrl.trim() || null,
        video_url: videoUrl.trim() || null,
      });

      router.push(`/dashboard/projects/${project.id}`);
    } catch (err: unknown) {
      const message =
        getErrorMessage(err, "Unable to create the project.");

      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main className="magizh-container py-20">
        <p className="magizh-muted">Loading...</p>
      </main>
    );
  }

  if (!team || !event) {
    return (
      <main className="magizh-container py-20">
        <div className="magizh-card p-8">
          <p className="text-[#C75C5C]">{error || "Team not found."}</p>

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
          NEW PROJECT
        </p>

        <h1 className="magizh-heading mt-3 text-4xl font-bold md:text-5xl">
          Create a Project
        </h1>

        <p className="magizh-muted mt-4 max-w-2xl">
          Add your team&apos;s project for {event.title}.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded border border-[#C75C5C]/40 bg-[#C75C5C]/10 px-4 py-3">
          <p className="text-sm text-[#C75C5C]">{error}</p>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <form
          onSubmit={handleSubmit}
          className="magizh-card space-y-6 p-6 md:p-8"
        >
          <div>
            <label
              htmlFor="title"
              className="mb-2 block text-sm font-medium"
            >
              Project Title <span className="text-[#C75C5C]">*</span>
            </label>

            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Smart Campus Navigator"
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What is this project about?"
              className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label
              htmlFor="problem"
              className="mb-2 block text-sm font-medium"
            >
              Problem
            </label>

            <textarea
              id="problem"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              rows={3}
              placeholder="What problem does it solve?"
              className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label
              htmlFor="solution"
              className="mb-2 block text-sm font-medium"
            >
              Solution
            </label>

            <textarea
              id="solution"
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              rows={3}
              placeholder="How does it solve the problem?"
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
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
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
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/..."
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
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                placeholder="https://demo..."
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
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/..."
                className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="magizh-button disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Creating..." : "Create Project"}
          </button>
        </form>

        <aside className="magizh-card h-fit space-y-6 p-6">
          <div>
            <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
              TEAM
            </p>

            <h2 className="magizh-heading mt-2 text-xl font-bold">
              {team.name}
            </h2>
          </div>

          <div className="rounded border border-[#252525] bg-[#0A0A0A] p-4">
            <p className="magizh-muted text-xs uppercase tracking-wider">
              Event
            </p>

            <p className="mt-2 text-sm">{event.title}</p>
          </div>
        </aside>
      </div>
    </main>
  );
}