"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
  getProject,
  type Project,
} from "@/lib/projects-api";

import {
  createSubmission,
  getProjectSubmission,
  submitSubmission,
  type Submission,
} from "@/lib/submissions-api";

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = params.project_id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);

  const [loading, setLoading] = useState(true);
  const [submissionLoading, setSubmissionLoading] = useState(true);

  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [submissionError, setSubmissionError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!projectId) {
      return;
    }

    async function loadProject() {
      try {
        setLoading(true);
        setError("");

        const data = await getProject(projectId);
        setProject(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load project.");
      } finally {
        setLoading(false);
      }
    }

    async function loadSubmission() {
      try {
        setSubmissionLoading(true);
        setSubmissionError("");

        const data = await getProjectSubmission(projectId);
        setSubmission(data);
      } catch (err) {
        console.error(err);

        setSubmission(null);
      } finally {
        setSubmissionLoading(false);
      }
    }

    loadProject();
    loadSubmission();
  }, [projectId]);

  async function handleCreateSubmission() {
    try {
      setCreating(true);
      setSubmissionError("");
      setSuccess("");

      const data = await createSubmission(projectId, {});

      setSubmission(data);
      setSuccess("Submission created successfully.");
    } catch (err) {
      console.error(err);
      setSubmissionError("Unable to create submission.");
    } finally {
      setCreating(false);
    }
  }

  async function handleSubmitSubmission() {
    if (!submission) {
      return;
    }

    try {
      setSubmitting(true);
      setSubmissionError("");
      setSuccess("");

      const data = await submitSubmission(submission.id);

      setSubmission(data);
      setSuccess("Project submitted successfully.");
    } catch (err) {
      console.error(err);
      setSubmissionError("Unable to submit the project.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="magizh-container py-12">
        <div className="magizh-card p-6">
          <p className="magizh-muted">Loading project...</p>
        </div>
      </main>
    );
  }

  if (error || !project) {
    return (
      <main className="magizh-container py-12">
        <div className="magizh-card border-[#C75C5C] p-6">
          <p className="text-[#C75C5C]">
            {error || "Project not found."}
          </p>

          <Link
            href="/dashboard/projects"
            className="magizh-button mt-6"
          >
            Back to Projects
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="magizh-container py-12">
      <Link
        href="/dashboard/projects"
        className="magizh-muted text-sm transition hover:text-[#D4AF37]"
      >
        ← Back to My Projects
      </Link>

      <div className="mt-8">
        <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.25em]">
          PROJECT
        </p>

        <h1 className="magizh-heading mt-3 text-4xl font-bold md:text-5xl">
          {project.title}
        </h1>

        <p className="magizh-muted mt-3 text-sm">
          Project ID: {project.id}
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <section className="magizh-card p-6 lg:col-span-2">
          <h2 className="magizh-heading text-2xl font-bold">
            Project Details
          </h2>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-widest magizh-gold">
              Description
            </p>

            <p className="magizh-muted mt-3 whitespace-pre-wrap leading-7">
              {project.description || "No description added yet."}
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="border border-[#252525] p-4">
              <p className="magizh-muted text-xs uppercase tracking-widest">
                Repository
              </p>

              {project.repository_url ? (
                <a
                  href={project.repository_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block break-all text-sm text-[#D4AF37] hover:text-[#E5C04A]"
                >
                  {project.repository_url}
                </a>
              ) : (
                <p className="magizh-muted mt-2 text-sm">
                  Not provided
                </p>
              )}
            </div>

            <div className="border border-[#252525] p-4">
              <p className="magizh-muted text-xs uppercase tracking-widest">
                Demo
              </p>

              {project.demo_url ? (
                <a
                  href={project.demo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block break-all text-sm text-[#D4AF37] hover:text-[#E5C04A]"
                >
                  {project.demo_url}
                </a>
              ) : (
                <p className="magizh-muted mt-2 text-sm">
                  Not provided
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="magizh-card p-6">
          <p className="magizh-gold text-xs font-semibold uppercase tracking-widest">
            SUBMISSION
          </p>

          <h2 className="magizh-heading mt-3 text-2xl font-bold">
            Project Submission
          </h2>

          {submissionLoading && (
            <p className="magizh-muted mt-6">
              Checking submission...
            </p>
          )}

          {!submissionLoading && !submission && (
            <div className="mt-6">
              <p className="magizh-muted text-sm leading-6">
                No submission has been created for this project yet.
              </p>

              <button
                type="button"
                onClick={handleCreateSubmission}
                disabled={creating}
                className="magizh-button mt-6 w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating
                  ? "Creating..."
                  : "Create Submission"}
              </button>
            </div>
          )}

          {!submissionLoading && submission && (
            <div className="mt-6">
              <div className="border border-[#252525] p-4">
                <p className="magizh-muted text-xs uppercase tracking-widest">
                  Status
                </p>

                <p className="mt-2 font-semibold uppercase">
                  {submission.status}
                </p>
              </div>

              <div className="mt-4 border border-[#252525] p-4">
                <p className="magizh-muted text-xs uppercase tracking-widest">
                  Submission ID
                </p>

                <p className="mt-2 break-all text-sm">
                  {submission.id}
                </p>
              </div>

              {submission.submitted_at && (
                <div className="mt-4 border border-[#252525] p-4">
                  <p className="magizh-muted text-xs uppercase tracking-widest">
                    Submitted At
                  </p>

                  <p className="mt-2 text-sm">
                    {new Date(
                      submission.submitted_at,
                    ).toLocaleString()}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmitSubmission}
                disabled={
                  submitting ||
                  submission.status.toUpperCase() === "SUBMITTED"
                }
                className="magizh-button mt-6 w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Submitting..."
                  : submission.status.toUpperCase() === "SUBMITTED"
                    ? "Already Submitted"
                    : "Submit Project"}
              </button>
            </div>
          )}

          {submissionError && (
            <div className="mt-5 border border-[#C75C5C] p-4">
              <p className="text-sm text-[#C75C5C]">
                {submissionError}
              </p>
            </div>
          )}

          {success && (
            <div className="mt-5 border border-[#6FAF7B] p-4">
              <p className="text-sm text-[#6FAF7B]">
                {success}
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}