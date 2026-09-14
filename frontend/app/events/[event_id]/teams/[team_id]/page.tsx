"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Shield,
  Crown,
  Share2,
  Trash2,
  LogOut,
  FolderGit2,
  Copy,
  CheckCircle2,
  UserX,
  RefreshCw,
  Plus,
  ArrowRight,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getTeam,
  updateTeam,
  deleteTeam,
  leaveTeam,
  removeTeamMember,
  transferTeamLeadership,
  generateInvite,
  revokeInvite,
  getJoinRequests,
  acceptJoinRequest,
  rejectJoinRequest,
  type Team,
  type JoinRequest,
} from "@/lib/teams-api";
import { useEvent } from "@/hooks/use-events";
import { useAuth } from "@/providers/auth-provider";
import { getErrorMessage } from "@/lib/error-message";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { HackerSnakeLoader, ErrorState } from "@/components/loading";

interface PageProps {
  params: Promise<{ event_id: string; team_id: string }>;
}

export default function TeamDashboardPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { event_id: eventId, team_id: teamId } = resolvedParams;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, status } = useAuth();

  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [actionError, setActionError] = useState("");

  const { data: event } = useEvent(eventId);

  const {
    data: team,
    isLoading: teamLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["team", teamId],
    queryFn: () => getTeam(teamId),
    enabled: Boolean(teamId),
  });

  const isLeader = team?.leader_id === user?.id;
  const isMember = team?.members?.some((m) => m.user_id === user?.id) || isLeader;

  // Join Requests Query (Only for Leader)
  const { data: joinRequests = [], refetch: refetchRequests } = useQuery({
    queryKey: ["team-requests", teamId],
    queryFn: () => getJoinRequests(teamId),
    enabled: Boolean(teamId && isLeader),
  });

  // MUTATIONS
  const generateInviteMutation = useMutation({
    mutationFn: () => generateInvite(teamId),
    onSuccess: (data) => {
      setInviteToken(data.token);
    },
    onError: (err) => {
      setActionError(getErrorMessage(err, "Unable to generate invite token."));
    },
  });

  const revokeInviteMutation = useMutation({
    mutationFn: () => revokeInvite(teamId),
    onSuccess: () => {
      setInviteToken(null);
    },
    onError: (err) => {
      setActionError(getErrorMessage(err, "Unable to revoke invite."));
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (targetUserId: string) => removeTeamMember(teamId, targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
    },
    onError: (err) => {
      setActionError(getErrorMessage(err, "Unable to remove member."));
    },
  });

  const transferLeaderMutation = useMutation({
    mutationFn: (targetUserId: string) => transferTeamLeadership(teamId, targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
    },
    onError: (err) => {
      setActionError(getErrorMessage(err, "Unable to transfer leadership."));
    },
  });

  const leaveTeamMutation = useMutation({
    mutationFn: () => leaveTeam(teamId),
    onSuccess: () => {
      router.push(`/events/${eventId}/teams`);
    },
    onError: (err) => {
      setActionError(getErrorMessage(err, "Unable to leave team. Leaders must transfer leadership first."));
    },
  });

  const acceptRequestMutation = useMutation({
    mutationFn: (requestId: string) => acceptJoinRequest(teamId, requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
      refetchRequests();
    },
    onError: (err) => {
      setActionError(getErrorMessage(err, "Unable to accept join request."));
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: (requestId: string) => rejectJoinRequest(teamId, requestId),
    onSuccess: () => {
      refetchRequests();
    },
    onError: (err) => {
      setActionError(getErrorMessage(err, "Unable to reject join request."));
    },
  });

  if (teamLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <HackerSnakeLoader size="lg" message="LOADING TEAM ROSTER..." />
        </main>
        <Footer />
      </div>
    );
  }

  if (isError || !team) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <Navbar />
        <main className="flex-1 magizh-container py-16">
          <ErrorState
            title="Team Not Found"
            message="This team may have been dissolved or does not exist."
            onRetry={() => refetch()}
          />
        </main>
        <Footer />
      </div>
    );
  }

  const inviteUrl = inviteToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/team-invite/${inviteToken}`
    : "";

  function copyInvite() {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div className="min-h-screen bg-black text-[#F5F3ED] flex flex-col">
      <Navbar />

      <main className="flex-1 magizh-container py-12 md:py-16">
        {/* Header */}
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-[#252525] pb-8">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={`/events/${eventId}/teams`}
                className="text-xs uppercase tracking-wider text-[#A1A1A1] hover:text-[#D4AF37]"
              >
                ← Event Teams
              </Link>
              <span className="text-xs text-[#252525]">•</span>
              <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                {event?.title || "Event Team"}
              </span>
            </div>

            <h1 className="magizh-heading mt-3 text-4xl font-extrabold md:text-5xl">
              {team.name}
            </h1>

            <p className="magizh-muted mt-2 text-xs">
              {team.members?.length || 1} / {event?.team_size_max || 4} Members • Team ID:{" "}
              <span className="font-mono text-[#D4AF37]">{team.id.slice(0, 8)}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/projects`}
              className="flex items-center gap-2 rounded bg-[#D4AF37] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[#E5C04A]"
            >
              <FolderGit2 size={15} /> Team Project
            </Link>

            {isMember && !isLeader && (
              <button
                type="button"
                onClick={() => leaveTeamMutation.mutate()}
                className="flex items-center gap-1.5 rounded border border-[#C75C5C]/50 bg-[#C75C5C]/10 px-4 py-2.5 text-xs font-semibold text-[#C75C5C] hover:bg-[#C75C5C] hover:text-white transition"
              >
                <LogOut size={14} /> Leave Team
              </button>
            )}
          </div>
        </div>

        {actionError && (
          <div className="mb-8 rounded border border-[#C75C5C]/40 bg-[#C75C5C]/10 p-4 text-xs text-[#C75C5C]">
            {actionError}
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-12">
          {/* Main: Members & Project (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* MEMBERS LIST */}
            <div className="magizh-card p-6 md:p-8">
              <div className="flex items-center justify-between border-b border-[#252525] pb-4">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37]">
                    ROSTER
                  </span>
                  <h3 className="text-xl font-bold text-[#F5F3ED]">Team Members</h3>
                </div>

                <span className="font-mono text-xs text-[#A1A1A1]">
                  {team.members?.length || 1} / {event?.team_size_max || 4}
                </span>
              </div>

              <div className="mt-6 space-y-4">
                {team.members?.map((m) => {
                  const isMemberLeader = m.user_id === team.leader_id;
                  const isSelf = m.user_id === user?.id;

                  return (
                    <div
                      key={m.id || m.user_id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-[#252525] bg-[#000000] p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#252525] bg-[#0A0A0A] font-bold text-[#D4AF37]">
                          {isMemberLeader ? <Crown size={16} /> : <Users size={16} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm text-[#F5F3ED]">
                              {m.full_name || m.email || "Scholar"}
                            </h4>
                            {isMemberLeader && (
                              <span className="rounded bg-[#D4AF37]/10 px-2 py-0.5 text-[9px] font-bold text-[#D4AF37]">
                                LEADER
                              </span>
                            )}
                            {isSelf && (
                              <span className="rounded bg-[#252525] px-1.5 py-0.5 text-[9px] text-[#A1A1A1]">
                                YOU
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#A1A1A1] font-mono mt-0.5">
                            {m.email}
                          </p>
                        </div>
                      </div>

                      {/* LEADER ACTIONS (Only visible to Leader, and not for themselves) */}
                      {isLeader && !isMemberLeader && m.user_id && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => transferLeaderMutation.mutate(m.user_id!)}
                            className="rounded border border-[#252525] bg-[#0A0A0A] px-2.5 py-1.5 text-[11px] font-semibold text-[#D4AF37] hover:border-[#D4AF37]"
                          >
                            Make Leader
                          </button>
                          <button
                            type="button"
                            onClick={() => removeMemberMutation.mutate(m.user_id!)}
                            className="rounded border border-[#252525] bg-[#0A0A0A] p-1.5 text-[#C75C5C] hover:border-[#C75C5C]"
                            title="Remove Member"
                          >
                            <UserX size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* JOIN REQUESTS (Leader Only) */}
            {isLeader && (
              <div className="magizh-card p-6 md:p-8">
                <div className="flex items-center justify-between border-b border-[#252525] pb-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37]">
                      INCOMING REQUESTS
                    </span>
                    <h3 className="text-xl font-bold text-[#F5F3ED]">
                      Team Join Requests
                    </h3>
                  </div>

                  <span className="font-mono text-xs text-[#D4AF37]">
                    {joinRequests.length} Pending
                  </span>
                </div>

                {joinRequests.length === 0 ? (
                  <p className="mt-6 text-xs text-[#A1A1A1]">
                    No pending join requests. Share your invite link to receive applicant requests.
                  </p>
                ) : (
                  <div className="mt-6 space-y-3">
                    {joinRequests.map((req) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between rounded-lg border border-[#252525] bg-[#000000] p-4"
                      >
                        <div>
                          <p className="font-semibold text-xs text-[#F5F3ED]">
                            {req.user_id}
                          </p>
                          <span className="text-[10px] text-[#A1A1A1]">
                            Status: {req.status}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => acceptRequestMutation.mutate(req.id)}
                            className="rounded bg-[#6FAF7B] px-3 py-1.5 text-xs font-bold text-black hover:bg-[#6FAF7B]/90"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => rejectRequestMutation.mutate(req.id)}
                            className="rounded border border-[#252525] bg-[#0A0A0A] px-3 py-1.5 text-xs text-[#C75C5C] hover:border-[#C75C5C]"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar Controls (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* LEADER CONTROLS: INVITE LINK GENERATION */}
            {isLeader && (
              <div className="magizh-card p-6 space-y-4">
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37]">
                  TEAM INVITATION
                </span>
                <h4 className="font-bold text-sm text-[#F5F3ED]">Share Invite Link</h4>

                <p className="text-xs text-[#A1A1A1] leading-relaxed">
                  Students with the link can request to join your team. You will review and accept each candidate.
                </p>

                {inviteToken ? (
                  <div className="space-y-3 pt-2">
                    <div className="rounded border border-[#252525] bg-[#000000] p-2.5 font-mono text-[11px] truncate text-[#D4AF37]">
                      {inviteUrl}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={copyInvite}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded bg-[#D4AF37] py-2 text-xs font-bold uppercase text-black hover:bg-[#E5C04A]"
                      >
                        <Copy size={13} /> {copied ? "Copied!" : "Copy Link"}
                      </button>
                      <button
                        type="button"
                        onClick={() => revokeInviteMutation.mutate()}
                        className="rounded border border-[#252525] bg-[#0A0A0A] px-3 py-2 text-xs text-[#C75C5C] hover:border-[#C75C5C]"
                        title="Revoke Token"
                      >
                        Revoke
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => generateInviteMutation.mutate()}
                    className="w-full rounded bg-[#D4AF37] py-2.5 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[#E5C04A]"
                  >
                    Generate Invite Link
                  </button>
                )}
              </div>
            )}

            {/* Event Summary Box */}
            <div className="magizh-card p-6 text-xs space-y-3">
              <span className="text-[10px] uppercase tracking-wider text-[#A1A1A1]">
                EVENT PARAMETERS
              </span>
              <div className="flex justify-between border-b border-[#252525] pb-2">
                <span className="text-[#A1A1A1]">Max Team Size:</span>
                <span className="font-mono text-[#F5F3ED]">{event?.team_size_max || 4} Members</span>
              </div>
              <div className="flex justify-between border-b border-[#252525] pb-2">
                <span className="text-[#A1A1A1]">Mode:</span>
                <span className="font-mono text-[#D4AF37]">{event?.mode || "Online"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A1A1A1]">Results:</span>
                <Link
                  href={`/events/${eventId}/results`}
                  className="text-[#D4AF37] hover:underline"
                >
                  Leaderboard →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
