"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
    acceptJoinRequest,
    cancelJoinRequest,
    deleteTeam,
    getJoinRequests,
    getTeam,
    leaveTeam,
    rejectJoinRequest,
    removeTeamMember,
    transferTeamLeadership,
    updateTeam,
} from "@/lib/teams-api";

import type {
    JoinRequest,
    Team,
} from "@/lib/teams-api";

import {
    useWebSocket,
    type WebSocketMessage,
} from "@/hooks/use-websocket";

import {
    getRealtimeEventType,
    getRealtimeMessage,
} from "@/lib/realtime";

type TeamMember = {
    id: string;
    user_id?: string;
    full_name?: string;
    email?: string;
};

type TeamWithMembers = Team & {
    members?: TeamMember[];
};

export default function TeamDetailsPage() {
    const params = useParams();
    const router = useRouter();

    const teamId = params.team_id as string;

    const [team, setTeam] = useState<TeamWithMembers | null>(null);
    const [teamName, setTeamName] = useState("");

    const [joinRequests, setJoinRequests] = useState<JoinRequest[]>(
        [],
    );

    const [isLoading, setIsLoading] = useState(true);
    const [isRequestsLoading, setIsRequestsLoading] = useState(true);

    const [isSaving, setIsSaving] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [processingRequestId, setProcessingRequestId] =
        useState<string | null>(null);

    const [processingMemberId, setProcessingMemberId] =
        useState<string | null>(null);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [latestRealtimeMessage, setLatestRealtimeMessage] =
        useState("");

    /*
     * Load team details.
     * REST API remains the source of truth.
     */
    const loadTeam = useCallback(async () => {
        try {
            setError("");

            const data = await getTeam(teamId);

            setTeam(data as TeamWithMembers);
            setTeamName(data.name);
        } catch (err: any) {
            const message =
                err?.response?.data?.detail ||
                "Unable to load this team.";

            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [teamId]);

    /*
     * Load join requests.
     */
    const loadJoinRequests = useCallback(async () => {
        try {
            setIsRequestsLoading(true);

            const data = await getJoinRequests(teamId);

            setJoinRequests(data);
        } catch (err: any) {
            /*
             * Non-leaders may not have permission to view
             * join requests. We don't replace the main team error.
             */
            const message =
                err?.response?.data?.detail ||
                "";

            if (message) {
                setError(message);
            }
        } finally {
            setIsRequestsLoading(false);
        }
    }, [teamId]);

    /*
     * Initial team + join request loading.
     */
    useEffect(() => {
        if (!teamId) {
            return;
        }

        loadTeam();
        loadJoinRequests();
    }, [teamId, loadTeam, loadJoinRequests]);

    /*
     * Team realtime updates.
     */
    const handleRealtimeMessage = useCallback(
        (message: WebSocketMessage) => {
            const eventType = getRealtimeEventType(message);
            const messageText = getRealtimeMessage(message);

            setLatestRealtimeMessage(
                `${eventType}: ${messageText}`,
            );

            /*
             * WebSocket acts as a signal.
             * Actual data is refetched through REST.
             */
            if (
                eventType === "created" ||
                eventType === "updated" ||
                eventType === "status_changed"
            ) {
                loadTeam();
                loadJoinRequests();
            }

            if (eventType === "deleted") {
                setTeam(null);
                setTeamName("");
                setJoinRequests([]);
                setError("This team is no longer available.");
            }
        },
        [loadTeam, loadJoinRequests],
    );

    const {
        connected,
        connecting,
        reconnect,
    } = useWebSocket(`/ws/teams/${teamId}`, {
        enabled: Boolean(teamId),
        reconnect: true,
        reconnectDelay: 3000,
        onMessage: handleRealtimeMessage,
    });

    /*
     * Update team name.
     */
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

            setTeam(updatedTeam as TeamWithMembers);
            setTeamName(updatedTeam.name);
            setSuccess("Team updated successfully.");
        } catch (err: any) {
            const message =
                err?.response?.data?.detail ||
                "Unable to update the team.";

            setError(message);
        } finally {
            setIsSaving(false);
        }
    }

    /*
     * Leave team.
     */
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
        } catch (err: any) {
            const message =
                err?.response?.data?.detail ||
                "Unable to leave the team.";

            setError(message);
        } finally {
            setIsLeaving(false);
        }
    }

    /*
     * Delete team.
     */
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
        } catch (err: any) {
            const message =
                err?.response?.data?.detail ||
                "Unable to delete the team.";

            setError(message);
        } finally {
            setIsDeleting(false);
        }
    }

    /*
     * Accept join request.
     */
    async function handleAcceptRequest(requestId: string) {
        setError("");
        setSuccess("");
        setProcessingRequestId(requestId);

        try {
            await acceptJoinRequest(teamId, requestId);

            setSuccess("Join request accepted.");

            await Promise.all([
                loadTeam(),
                loadJoinRequests(),
            ]);
        } catch (err: any) {
            const message =
                err?.response?.data?.detail ||
                "Unable to accept the join request.";

            setError(message);
        } finally {
            setProcessingRequestId(null);
        }
    }

    /*
     * Reject join request.
     */
    async function handleRejectRequest(requestId: string) {
        setError("");
        setSuccess("");
        setProcessingRequestId(requestId);

        try {
            await rejectJoinRequest(teamId, requestId);

            setSuccess("Join request rejected.");

            await loadJoinRequests();
        } catch (err: any) {
            const message =
                err?.response?.data?.detail ||
                "Unable to reject the join request.";

            setError(message);
        } finally {
            setProcessingRequestId(null);
        }
    }

    /*
     * Cancel join request.
     * This is useful if the current user owns the request.
     */
    async function handleCancelRequest(requestId: string) {
        setError("");
        setSuccess("");
        setProcessingRequestId(requestId);

        try {
            await cancelJoinRequest(teamId, requestId);

            setSuccess("Join request cancelled.");

            await loadJoinRequests();
        } catch (err: any) {
            const message =
                err?.response?.data?.detail ||
                "Unable to cancel the join request.";

            setError(message);
        } finally {
            setProcessingRequestId(null);
        }
    }

    /*
     * Remove team member.
     */
    async function handleRemoveMember(
        memberId: string,
        memberName: string,
    ) {
        const confirmed = window.confirm(
            `Remove ${memberName} from this team?`,
        );

        if (!confirmed) {
            return;
        }

        setError("");
        setSuccess("");
        setProcessingMemberId(memberId);

        try {
            await removeTeamMember(teamId, memberId);

            setSuccess("Team member removed successfully.");

            await loadTeam();
        } catch (err: any) {
            const message =
                err?.response?.data?.detail ||
                "Unable to remove the team member.";

            setError(message);
        } finally {
            setProcessingMemberId(null);
        }
    }

    /*
     * Transfer leadership.
     */
    async function handleTransferLeadership(
        memberId: string,
        memberName: string,
    ) {
        const confirmed = window.confirm(
            `Transfer team leadership to ${memberName}?`,
        );

        if (!confirmed) {
            return;
        }

        setError("");
        setSuccess("");
        setProcessingMemberId(memberId);

        try {
            await transferTeamLeadership(
                teamId,
                memberId,
            );

            setSuccess(
                "Team leadership transferred successfully.",
            );

            await loadTeam();
        } catch (err: any) {
            const message =
                err?.response?.data?.detail ||
                "Unable to transfer team leadership.";

            setError(message);
        } finally {
            setProcessingMemberId(null);
        }
    }

    if (isLoading) {
        return (
            <main className="magizh-container py-20">
                <p className="magizh-muted">
                    Loading team...
                </p>
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

    const members = team.members ?? [];

    return (
        <main className="magizh-container py-12 md:py-16">
            {/* Header */}
            <div className="mb-10">
                <Link
                    href="/dashboard/teams"
                    className="text-sm font-semibold uppercase tracking-wider text-[#D4AF37] transition-colors hover:text-[#E5C04A]"
                >
                    ← My Teams
                </Link>

                <div className="mt-8 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div>
                        <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.25em]">
                            TEAM MANAGEMENT
                        </p>

                        <h1 className="magizh-heading mt-3 text-4xl font-bold md:text-5xl">
                            {team.name}
                        </h1>

                        <p className="magizh-muted mt-4 max-w-2xl">
                            Manage your team, members, join requests,
                            and participation for this event.
                        </p>
                    </div>

                    {/* Realtime status */}
                    <div className="flex items-center gap-3 rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3">
                        <span
                            className={`h-2.5 w-2.5 rounded-full ${
                                connected
                                    ? "bg-[#6FAF7B]"
                                    : connecting
                                      ? "bg-[#D4AF37]"
                                      : "bg-[#C75C5C]"
                            }`}
                        />

                        <span className="text-xs font-semibold uppercase tracking-[0.15em]">
                            {connected
                                ? "Live"
                                : connecting
                                  ? "Connecting"
                                  : "Offline"}
                        </span>

                        {!connected && !connecting && (
                            <button
                                type="button"
                                onClick={reconnect}
                                className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37] hover:text-[#E5C04A]"
                            >
                                Reconnect
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6 rounded border border-[#C75C5C]/40 bg-[#C75C5C]/10 px-4 py-3">
                    <p className="text-sm text-[#C75C5C]">
                        {error}
                    </p>
                </div>
            )}

            {/* Success */}
            {success && (
                <div className="mb-6 rounded border border-[#6FAF7B]/40 bg-[#6FAF7B]/10 px-4 py-3">
                    <p className="text-sm text-[#6FAF7B]">
                        {success}
                    </p>
                </div>
            )}

            {/* Realtime message */}
            {latestRealtimeMessage && (
                <div className="mb-6 rounded border border-[#D4AF37]/30 bg-[#D4AF37]/5 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
                        Realtime Update
                    </p>

                    <p className="mt-2 text-sm">
                        {latestRealtimeMessage}
                    </p>
                </div>
            )}

            <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
                {/* Main */}
                <div className="space-y-8">
                    {/* Team Information */}
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
                                    onChange={(e) =>
                                        setTeamName(e.target.value)
                                    }
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
                                    Team Leader ID
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
                                {isSaving
                                    ? "Saving..."
                                    : "Save Changes"}
                            </button>
                        </div>
                    </section>

                    {/* Team Members */}
                    <section className="magizh-card p-6 md:p-8">
                        <div className="mb-8">
                            <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
                                TEAM MEMBERS
                            </p>

                            <h2 className="magizh-heading mt-2 text-2xl font-bold">
                                Members
                            </h2>

                            <p className="magizh-muted mt-3 text-sm leading-6">
                                Manage members, remove participants, and
                                transfer team leadership.
                            </p>
                        </div>

                        {members.length === 0 ? (
                            <div className="rounded border border-[#252525] bg-[#0A0A0A] p-6">
                                <p className="magizh-muted text-sm">
                                    No member details are available yet.
                                </p>

                                <p className="magizh-muted mt-2 text-xs leading-5">
                                    The team API currently provides the
                                    team information and member-management
                                    actions. Member details will appear
                                    here when returned by the backend.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {members.map((member) => {
                                    const memberId =
                                        member.user_id || member.id;

                                    const memberName =
                                        member.full_name ||
                                        member.email ||
                                        memberId;

                                    const isLeader =
                                        memberId === team.leader_id;

                                    const isProcessing =
                                        processingMemberId ===
                                        memberId;

                                    return (
                                        <div
                                            key={memberId}
                                            className="rounded border border-[#252525] bg-[#0A0A0A] p-5"
                                        >
                                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="font-semibold">
                                                            {memberName}
                                                        </p>

                                                        {isLeader && (
                                                            <span className="rounded border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#D4AF37]">
                                                                Leader
                                                            </span>
                                                        )}
                                                    </div>

                                                    {member.email && (
                                                        <p className="magizh-muted mt-1 text-sm">
                                                            {member.email}
                                                        </p>
                                                    )}

                                                    <p className="magizh-muted mt-2 break-all text-xs">
                                                        {memberId}
                                                    </p>
                                                </div>

                                                {!isLeader && (
                                                    <div className="flex flex-col gap-2 sm:flex-row">
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                isProcessing
                                                            }
                                                            onClick={() =>
                                                                handleTransferLeadership(
                                                                    memberId,
                                                                    memberName,
                                                                )
                                                            }
                                                            className="rounded border border-[#252525] px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            Transfer Leadership
                                                        </button>

                                                        <button
                                                            type="button"
                                                            disabled={
                                                                isProcessing
                                                            }
                                                            onClick={() =>
                                                                handleRemoveMember(
                                                                    memberId,
                                                                    memberName,
                                                                )
                                                            }
                                                            className="rounded border border-[#C75C5C]/50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#C75C5C] transition-colors hover:bg-[#C75C5C]/10 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* Join Requests */}
                    <section className="magizh-card p-6 md:p-8">
                        <div className="mb-8">
                            <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
                                JOIN REQUESTS
                            </p>

                            <h2 className="magizh-heading mt-2 text-2xl font-bold">
                                Pending Requests
                            </h2>

                            <p className="magizh-muted mt-3 text-sm leading-6">
                                Review requests from students who want to
                                join this team.
                            </p>
                        </div>

                        {isRequestsLoading ? (
                            <p className="magizh-muted text-sm">
                                Loading join requests...
                            </p>
                        ) : joinRequests.length === 0 ? (
                            <div className="rounded border border-[#252525] bg-[#0A0A0A] p-6">
                                <p className="magizh-muted text-sm">
                                    No join requests available.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {joinRequests.map((request) => {
                                    const isProcessing =
                                        processingRequestId ===
                                        request.id;

                                    const status =
                                        request.status?.toUpperCase();

                                    return (
                                        <div
                                            key={request.id}
                                            className="rounded border border-[#252525] bg-[#0A0A0A] p-5"
                                        >
                                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                                <div>
                                                    <p className="font-semibold">
                                                        Join Request
                                                    </p>

                                                    <p className="magizh-muted mt-1 break-all text-xs">
                                                        Request ID:{" "}
                                                        {request.id}
                                                    </p>

                                                    <p className="magizh-muted mt-1 break-all text-xs">
                                                        User ID:{" "}
                                                        {request.user_id}
                                                    </p>

                                                    <span className="mt-3 inline-flex rounded border border-[#252525] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider">
                                                        {status ||
                                                            "UNKNOWN"}
                                                    </span>
                                                </div>

                                                <div className="flex flex-col gap-2 sm:flex-row">
                                                    {status ===
                                                        "PENDING" && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    isProcessing
                                                                }
                                                                onClick={() =>
                                                                    handleAcceptRequest(
                                                                        request.id,
                                                                    )
                                                                }
                                                                className="rounded border border-[#6FAF7B]/50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#6FAF7B] transition-colors hover:bg-[#6FAF7B]/10 disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                {isProcessing
                                                                    ? "Processing..."
                                                                    : "Accept"}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    isProcessing
                                                                }
                                                                onClick={() =>
                                                                    handleRejectRequest(
                                                                        request.id,
                                                                    )
                                                                }
                                                                className="rounded border border-[#C75C5C]/50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#C75C5C] transition-colors hover:bg-[#C75C5C]/10 disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}

                                                    {status ===
                                                        "PENDING" && (
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                isProcessing
                                                            }
                                                            onClick={() =>
                                                                handleCancelRequest(
                                                                    request.id,
                                                                )
                                                            }
                                                            className="rounded border border-[#252525] px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>

                {/* Sidebar */}
                <aside className="space-y-6">
                    {/* Actions */}
                    <div className="magizh-card p-6">
                        <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
                            TEAM ACTIONS
                        </p>

                        <h2 className="magizh-heading mt-2 text-2xl font-bold">
                            Manage
                        </h2>

                        <p className="magizh-muted mt-3 text-sm leading-6">
                            Manage your participation in this team.
                        </p>

                        <div className="mt-6 space-y-3">
                            <button
                                type="button"
                                onClick={handleLeaveTeam}
                                disabled={
                                    isLeaving || isDeleting
                                }
                                className="w-full rounded border border-[#252525] px-4 py-3 text-sm font-semibold transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isLeaving
                                    ? "Leaving..."
                                    : "Leave Team"}
                            </button>

                            <button
                                type="button"
                                onClick={handleDeleteTeam}
                                disabled={
                                    isDeleting || isLeaving
                                }
                                className="w-full rounded border border-[#C75C5C]/50 px-4 py-3 text-sm font-semibold text-[#C75C5C] transition-colors hover:bg-[#C75C5C]/10 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isDeleting
                                    ? "Deleting..."
                                    : "Delete Team"}
                            </button>
                        </div>
                    </div>

                    {/* Realtime */}
                    <div className="magizh-card p-6">
                        <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
                            REALTIME
                        </p>

                        <h2 className="magizh-heading mt-2 text-xl font-bold">
                            Team Live Updates
                        </h2>

                        <div className="mt-5 flex items-center gap-3">
                            <span
                                className={`h-2.5 w-2.5 rounded-full ${
                                    connected
                                        ? "bg-[#6FAF7B]"
                                        : connecting
                                          ? "bg-[#D4AF37]"
                                          : "bg-[#C75C5C]"
                                }`}
                            />

                            <span className="text-sm font-semibold">
                                {connected
                                    ? "Connected"
                                    : connecting
                                      ? "Connecting..."
                                      : "Disconnected"}
                            </span>
                        </div>

                        {!connected && !connecting && (
                            <button
                                type="button"
                                onClick={reconnect}
                                className="magizh-button mt-5 w-full"
                            >
                                Reconnect
                            </button>
                        )}
                    </div>

                    {/* Team ID */}
                    <div className="magizh-card p-6">
                        <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
                            TEAM
                        </p>

                        <p className="magizh-muted mt-3 text-xs uppercase tracking-wider">
                            Team ID
                        </p>

                        <p className="mt-2 break-all text-sm">
                            {team.id}
                        </p>
                    </div>
                </aside>
            </div>
        </main>
    );
}