"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
    deleteTeam,
    getTeam,
    leaveTeam,
    updateTeam,
} from "@/lib/teams-api";
import type { Team } from "@/lib/teams-api";
import { getErrorMessage } from "@/lib/error-message";

export default function TeamDetailsPage() {
    const params = useParams();
    const router = useRouter();

    const teamId = params.team_id as string;

    const [team, setTeam] = useState<Team | null>(null);

    const [teamName, setTeamName] = useState("");

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        async function loadTeam() {
            try {
                setError("");

                const data = await getTeam(teamId);

                setTeam(data);
                setTeamName(data.name);
            } catch (err: unknown) {
                setError(
                    getErrorMessage(
                        err,
                        "Unable to load this team.",
                    ),
                );
            } finally {
                setIsLoading(false);
            }
        }

        if (teamId) {
            loadTeam();
        }
    }, [teamId]);

    async function handleUpdateTeam() {
        if (!teamName.trim()) {
            setError("Team name cannot be empty.");
            return;
        }

        setError("");
        setSuccess("");
        setIsSaving(true);

        try {
            const updatedTeam = await updateTeam(teamId, {
                name: teamName.trim(),
            });

            setTeam(updatedTeam);
            setTeamName(updatedTeam.name);
            setSuccess("Team updated successfully.");
        } catch (err: unknown) {
            setError(
                getErrorMessage(err, "Unable to update the team."),
            );
        } finally {
            setIsSaving(false);
        }
    }

    async function handleLeaveTeam() {
        const confirmed = window.confirm(
            "Are you sure you want to leave this team?",
        );

        if (!confirmed) {
            return;
        }

        setError("");
        setSuccess("");
        setIsLeaving(true);

        try {
            await leaveTeam(teamId);

            router.push("/dashboard/teams");
        } catch (err: unknown) {
            setError(
                getErrorMessage(err, "Unable to leave the team."),
            );
        } finally {
            setIsLeaving(false);
        }
    }

    async function handleDeleteTeam() {
        const confirmed = window.confirm(
            "Are you sure you want to delete this team? This action cannot be undone.",
        );

        if (!confirmed) {
            return;
        }

        setError("");
        setSuccess("");
        setIsDeleting(true);

        try {
            await deleteTeam(teamId);

            router.push("/dashboard/teams");
        } catch (err: unknown) {
            setError(
                getErrorMessage(err, "Unable to delete the team."),
            );
        } finally {
            setIsDeleting(false);
        }
    }

    if (isLoading) {
        return (
            <main className="magizh-container py-20">
                <p className="magizh-muted">Loading team...</p>
            </main>
        );
    }

    if (!team) {
        return (
            <main className="magizh-container py-20">
                <div className="magizh-card p-8">
                    <p className="text-[#C75C5C]">
                        {error || "Team not found."}
                    </p>

                    <Link
                        href="/dashboard/teams"
                        className="mt-5 inline-flex text-sm font-semibold uppercase tracking-wider text-[#D4AF37] hover:text-[#E5C04A]"
                    >
                        ← Back to Teams
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="magizh-container py-12 md:py-16">
            <div className="mb-10">
                <Link
                    href="/dashboard/teams"
                    className="text-sm font-semibold uppercase tracking-wider text-[#D4AF37] transition-colors hover:text-[#E5C04A]"
                >
                    ← My Teams
                </Link>

                <p className="magizh-gold mt-8 text-xs font-semibold uppercase tracking-[0.25em]">
                    TEAM MANAGEMENT
                </p>

                <h1 className="magizh-heading mt-3 text-4xl font-bold md:text-5xl">
                    {team.name}
                </h1>

                <p className="magizh-muted mt-4 max-w-2xl">
                    Manage your team and participation for this event.
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

            <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
                <section className="magizh-card p-6 md:p-8">
                    <div className="mb-8">
                        <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
                            TEAM INFORMATION
                        </p>

                        <h2 className="magizh-heading mt-2 text-2xl font-bold">
                            Team Details
                        </h2>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label
                                htmlFor="teamName"
                                className="mb-2 block text-sm font-medium"
                            >
                                Team Name
                            </label>

                            <input
                                id="teamName"
                                type="text"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
                            />
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                            <div className="rounded border border-[#252525] bg-[#0A0A0A] p-4">
                                <p className="magizh-muted text-xs uppercase tracking-wider">
                                    Team ID
                                </p>

                                <p className="mt-2 break-all text-sm">
                                    {team.id}
                                </p>
                            </div>

                            <div className="rounded border border-[#252525] bg-[#0A0A0A] p-4">
                                <p className="magizh-muted text-xs uppercase tracking-wider">
                                    Event ID
                                </p>

                                <p className="mt-2 break-all text-sm">
                                    {team.event_id}
                                </p>
                            </div>
                        </div>

                        <div className="rounded border border-[#252525] bg-[#0A0A0A] p-4">
                            <p className="magizh-muted text-xs uppercase tracking-wider">
                                Team Leader
                            </p>

                            <p className="mt-2 break-all text-sm">
                                {team.leader_id}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleUpdateTeam}
                            disabled={isSaving}
                            className="magizh-button disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </section>

                <aside className="space-y-6">
                    <div className="magizh-card p-6">
                        <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
                            TEAM ACTIONS
                        </p>

                        <h2 className="magizh-heading mt-2 text-2xl font-bold">
                            Manage
                        </h2>

                        <p className="magizh-muted mt-3 text-sm leading-6">
                            Team member management and invitations will be available here.
                        </p>

                        <div className="mt-6 space-y-3">
                            <button
                                type="button"
                                onClick={handleLeaveTeam}
                                disabled={isLeaving || isDeleting}
                                className="w-full rounded border border-[#252525] px-4 py-3 text-sm font-semibold transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isLeaving ? "Leaving..." : "Leave Team"}
                            </button>

                            <button
                                type="button"
                                onClick={handleDeleteTeam}
                                disabled={isDeleting || isLeaving}
                                className="w-full rounded border border-[#C75C5C]/50 px-4 py-3 text-sm font-semibold text-[#C75C5C] transition-colors hover:bg-[#C75C5C]/10 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isDeleting ? "Deleting..." : "Delete Team"}
                            </button>
                        </div>
                    </div>

                    <div className="magizh-card p-6">
                        <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
                            NEXT
                        </p>

                        <h2 className="magizh-heading mt-2 text-xl font-bold">
                            Team Members
                        </h2>

                        <p className="magizh-muted mt-3 text-sm leading-6">
                            Invite participants, manage join requests, remove members, and
                            transfer team leadership.
                        </p>
                    </div>
                </aside>
            </div>
        </main>
    );
}