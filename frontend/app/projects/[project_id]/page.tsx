"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FolderGit2,
  Globe,
  Video,

  CheckCircle2,
  Lock,
  Edit3,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  FileText,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getProject,
  updateProject,
  type Project,
  type UpdateProjectRequest,
} from "@/lib/projects-api";
import {
  getProjectSubmission,
  createSubmission,
  submitSubmission,
  type Submission,
} from "@/lib/submissions-api";
import { useAuth } from "@/providers/auth-provider";
import { getErrorMessage } from "@/lib/error-message";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { HackerSnakeLoader, ErrorState } from "@/components/loading";

interface PageProps {
  params: Promise<{ project_id: string }>;
}

export default function ProjectWorkspacePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.project_id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [actionError, setActionError] = useState("");
  const [submitModalOpen, setSubmitModalOpen] = useState(false);

  // Queries
  const {
    data: project,
    isLoading: projectLoading,
    isError,
    refetch: refetchProject,
  } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId),
    enabled: Boolean(projectId),
  });

  const { data: submission, refetch: refetchSubmission } = useQuery({
    queryKey: ["project-submission", projectId],
    queryFn: () => getProjectSubmission(projectId).catch(() => null),
    enabled: Boolean(projectId && user),
  });

  useEffect(() => {
    if (project) {
      setTitle(project.title || "");
      setDescription(project.description || "");
      setRepoUrl((project as any).repo_url || "");
      setDemoUrl((project as any).demo_url || "");
    }
  }, [project]);

  const isSubmitted = submission?.status === "SUBMITTED" || submission?.status === "UNDER_REVIEW" || submission?.status === "EVALUATED";

  // Mutations
  const updateProjectMutation = useMutation({
    mutationFn: (data: UpdateProjectRequest) => updateProject(projectId, data),
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
    onError: (err) => {
      setActionError(getErrorMessage(err, "Unable to update project details."));
    },
  });

  const finalSubmitMutation = useMutation({
    mutationFn: async () => {
      let sub = submission;
      if (!sub) {
        sub = await createSubmission(projectId, {});
      }
      return submitSubmission(sub.id);
    },
    onSuccess: () => {
      setSubmitModalOpen(false);
      refetchSubmission();
      queryClient.invalidateQueries({ queryKey: ["project-submission", projectId] });
    },
    onError: (err) => {
      setActionError(getErrorMessage(err, "Unable to finalize submission."));
    },
  });

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <HackerSnakeLoader size="lg" message="LOADING PROJECT WORKSPACE..." />
        </main>
        <Footer />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <Navbar />
        <main className="flex-1 magizh-container py-16">
          <ErrorState
            title="Project Not Found"
            message="This project record may have been removed or does not exist."
            onRetry={() => refetchProject()}
          />
        </main>
        <Footer />
      </div>
    );
  }

  // Submission checklist indicators
  const hasTitle = Boolean(title.trim());
  const hasDescription = Boolean(description.trim());
  const hasRepo = Boolean(repoUrl.trim());
  const hasDemo = Boolean(demoUrl.trim());
  const isChecklistComplete = hasTitle && hasDescription;

  return (
    <div className="min-h-screen bg-black text-[#F5F3ED] flex flex-col">
      <Navbar />

      <main className="flex-1 magizh-container py-12 md:py-16">
        {/* Header */}
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-[#252525] pb-8">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/projects"
                className="text-xs uppercase tracking-wider text-[#A1A1A1] hover:text-[#D4AF37]"
              >
                ← All Projects
              </Link>
              <span className="text-xs text-[#252525]">•</span>
              <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                {isSubmitted ? "OFFICIAL SUBMISSION" : "WORKING WORKSPACE"}
              </span>
            </div>

            <h1 className="magizh-heading mt-3 text-4xl font-extrabold md:text-5xl">
              {project.title}
            </h1>

            <div className="mt-3 flex items-center gap-3">
              <span className="rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 px-3 py-0.5 font-mono text-[10px] font-bold text-[#D4AF37]">
                STATUS: {submission?.status || "WORKING DRAFT"}
              </span>

              {isSubmitted && (
                <span className="flex items-center gap-1 text-xs text-[#6FAF7B] font-semibold">
                  <Lock size={12} /> FINAL HANDOFF COMMITTED
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isSubmitted && user && (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-1.5 rounded border border-[#252525] bg-[#0A0A0A] px-4 py-2.5 text-xs font-semibold text-[#F5F3ED] hover:border-[#D4AF37]"
                >
                  <Edit3 size={14} /> {isEditing ? "Cancel Edit" : "Edit Details"}
                </button>

                <button
                  type="button"
                  onClick={() => setSubmitModalOpen(true)}
                  className="flex items-center gap-1.5 rounded bg-[#D4AF37] px-6 py-2.5 text-xs font-bold uppercase text-black hover:bg-[#E5C04A]"
                >
                  <CheckCircle2 size={14} /> Submit Final Project
                </button>
              </>
            )}
          </div>
        </div>

        {actionError && (
          <div className="mb-8 rounded border border-[#C75C5C]/40 bg-[#C75C5C]/10 p-4 text-xs text-[#C75C5C]">
            {actionError}
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-12">
          {/* Main Content (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            {isEditing ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateProjectMutation.mutate({
                    title: title.trim(),
                    description: description.trim() || null,
                  });
                }}
                className="magizh-card p-6 md:p-8 space-y-6"
              >
                <h3 className="magizh-heading text-xl font-bold">Edit Project Specification</h3>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1A1] mb-2">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded border border-[#252525] bg-[#000000] px-4 py-3 text-sm text-[#F5F3ED] outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1A1] mb-2">
                    Description & Solution Architecture
                  </label>
                  <textarea
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded border border-[#252525] bg-[#000000] px-4 py-3 text-sm text-[#F5F3ED] outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="rounded border border-[#252525] bg-[#0A0A0A] px-4 py-2.5 text-xs text-[#A1A1A1]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateProjectMutation.isPending}
                    className="rounded bg-[#D4AF37] px-6 py-2.5 text-xs font-bold uppercase text-black hover:bg-[#E5C04A]"
                  >
                    {updateProjectMutation.isPending ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="magizh-card p-6 md:p-8 space-y-6">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37]">
                    PROJECT OVERVIEW
                  </span>
                  <h3 className="magizh-heading text-2xl font-bold text-[#F5F3ED] mt-1">
                    About This Innovation
                  </h3>
                </div>

                <p className="text-sm leading-relaxed text-[#A1A1A1] whitespace-pre-wrap">
                  {project.description || "No project documentation provided yet."}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar Checklist & Hand-off (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* SUBMISSION HANDOFF CHECKLIST */}
            <div className="magizh-card p-6 space-y-4">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37]">
                FINAL SUBMISSION CHECKLIST
              </span>
              <h4 className="font-bold text-sm">Review Requirements</h4>

              <div className="space-y-3 pt-2 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className={hasTitle ? "text-[#6FAF7B]" : "text-[#252525]"} />
                  <span className={hasTitle ? "text-[#F5F3ED]" : "text-[#A1A1A1]"}>Project Title</span>
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className={hasDescription ? "text-[#6FAF7B]" : "text-[#252525]"} />
                  <span className={hasDescription ? "text-[#F5F3ED]" : "text-[#A1A1A1]"}>Architecture & Description</span>
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#6FAF7B]" />
                  <span className="text-[#F5F3ED]">Team Member Roster</span>
                </div>
              </div>

              {isSubmitted ? (
                <div className="rounded-lg border border-[#6FAF7B]/40 bg-[#6FAF7B]/10 p-3 text-center text-xs text-[#6FAF7B] font-semibold">
                  ✓ Final Submission Locked & Dispatched to Judges
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSubmitModalOpen(true)}
                  disabled={!isChecklistComplete}
                  className="w-full rounded bg-[#D4AF37] py-3 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[#E5C04A] disabled:opacity-50"
                >
                  Submit Final Project
                </button>
              )}
            </div>

            {/* Project Telemetry */}
            <div className="magizh-card p-6 text-xs space-y-3">
              <span className="text-[10px] uppercase tracking-wider text-[#A1A1A1]">
                PROJECT RECORD
              </span>
              <div className="flex justify-between border-b border-[#252525] pb-2">
                <span className="text-[#A1A1A1]">Project ID:</span>
                <span className="font-mono text-[#D4AF37]">{project.id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A1A1A1]">Created:</span>
                <span className="font-mono">{new Date(project.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FINAL SUBMISSION CONFIRMATION MODAL */}
      {submitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-[#252525] bg-[#0A0A0A] p-6 text-[#F5F3ED] shadow-2xl">
            <h3 className="magizh-heading text-2xl font-bold">Lock Final Submission?</h3>
            <p className="mt-2 text-xs text-[#A1A1A1] leading-relaxed">
              Submitting is the official final handoff for evaluation by Magizh judges. After submission, further edits will be locked.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setSubmitModalOpen(false)}
                className="rounded border border-[#252525] bg-[#0A0A0A] px-4 py-2.5 text-xs text-[#A1A1A1]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={finalSubmitMutation.isPending}
                onClick={() => finalSubmitMutation.mutate()}
                className="flex-1 rounded bg-[#D4AF37] py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-[#E5C04A] disabled:opacity-50"
              >
                {finalSubmitMutation.isPending ? "Locking..." : "Confirm & Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}