"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  Plus,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Sparkles,
  ExternalLink,
  Lock,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { getEventTeams, createTeam, type Team } from "@/lib/teams-api";
import { useEvent } from "@/hooks/use-events";
import { useAuth } from "@/providers/auth-provider";
import { getErrorMessage } from "@/lib/error-message";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { HackerSnakeLoader, ErrorState, EmptyState } from "@/components/loading";

interface PageProps {
  params: Promise<{ event_id: string }>;
}

export default function EventTeamsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.event_id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, status } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [createError, setCreateError] = useState("");

  const { data: event, isLoading: eventLoading } = useEvent(eventId);

  const {
    data: teams = [],
    isLoading: teamsLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["event-teams", eventId],
    queryFn: () => getEventTeams(eventId),
    enabled: Boolean(eventId),
  });

  // Check if current user is already a member of a team in this event
  const myTeam = teams.find((t) =>
    t.members?.some((m) => m.user_id === user?.id) || t.leader_id === user?.id
  );

  const createTeamMutation = useMutation({
    mutationFn: () => createTeam(eventId, { name: teamName.trim() }),
    onSuccess: (newTeam) => {
      setCreateModalOpen(false);
      setTeamName("");
      queryClient.invalidateQueries({ queryKey: ["event-teams", eventId] });
      router.push(`/events/${eventId}/teams/${newTeam.id}`);
    },
    onError: (err) => {
      setCreateError(getErrorMessage(err, "Unable to create team. Name might already be taken."));
    },
  });

  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="min-h-screen bg-black text-[#F5F3ED] flex flex-col">
      <Navbar />

      <main className="flex-1 magizh-container py-12 md:py-16">
        {/* Header */}
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-[#252525] pb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
                EVENT COLLABORATION
              </span>
              <span className="text-xs text-[#A1A1A1]">•</span>
              <span className="text-xs text-[#A1A1A1]">{event?.title || "Magizh Event"}</span>
            </div>

            <h1 className="magizh-heading mt-3 text-4xl font-extrabold md:text-5xl">
              Event Teams
            </h1>

            <p className="magizh-muted mt-3 max-w-2xl text-xs leading-relaxed md:text-sm">
              Discover active teams registered for this challenge or create your own team as leader.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/events/${eventId}`}
              className="rounded border border-[#252525] bg-[#0A0A0A] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#A1A1A1] hover:border-[#D4AF37] hover:text-[#F5F3ED]"
            >
              ← Event Details
            </Link>

            {!myTeam && (
              <button
                type="button"
                onClick={() => {
                  if (status !== "authenticated") {
                    router.push(`/login?redirect=/events/${eventId}/teams`);
                    return;
                  }
                  setCreateModalOpen(true);
                }}
                className="flex items-center gap-2 rounded bg-[#D4AF37] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[#E5C04A]"
              >
                <Plus size={15} /> Create Team
              </button>
            )}
          </div>
        </div>

        {/* PROMINENT MY TEAM CARD (If in team) */}
        {myTeam && (
          <div className="mb-10 rounded-xl border-2 border-[#D4AF37]/60 bg-gradient-to-r from-[#0D0D0F] via-[#0A0A0A] to-[#0D0D0F] p-6 shadow-[0_0_30px_rgba(212,175,55,0.08)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 px-3 py-0.5 font-mono text-[10px] font-bold text-[#D4AF37]">
                  ★ YOUR REGISTERED TEAM
                </span>
                <h3 className="magizh-heading mt-3 text-2xl font-bold text-[#F5F3ED]">
                  {myTeam.name}
                </h3>
                <p className="mt-1 text-xs text-[#A1A1A1]">
                  {myTeam.members?.length || 1} / {event?.team_size_max || 4} Members • Role:{" "}
                  {myTeam.leader_id === user?.id ? "Team Leader" : "Member"}
                </p>
              </div>

              <Link
                href={`/events/${eventId}/teams/${myTeam.id}`}
                className="inline-flex items-center gap-2 rounded bg-[#D4AF37] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[#E5C04A]"
              >
                Open Team Dashboard <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}

        {/* SEARCH & FILTERS */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A1A1A1]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search teams in this event..."
              className="w-full rounded border border-[#252525] bg-[#0A0A0A] py-2.5 pl-10 pr-4 text-xs text-[#F5F3ED] placeholder-[#A1A1A1]/60 outline-none transition focus:border-[#D4AF37]"
            />
          </div>

          <div className="text-xs font-mono text-[#A1A1A1]">
            <span className="font-bold text-[#D4AF37]">{filteredTeams.length}</span> Active Teams
          </div>
        </div>

        {/* TEAMS GRID */}
        {teamsLoading ? (
          <div className="py-20">
            <HackerSnakeLoader size="lg" message="SCANNING EVENT TEAMS..." />
          </div>
        ) : isError ? (
          <div className="py-12">
            <ErrorState
              title="Unable to load teams"
              message="Please verify backend connectivity."
              onRetry={() => refetch()}
            />
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="py-16">
            <EmptyState
              kicker="EVENT TEAMS"
              title={searchQuery ? "No teams found matching your search." : "No teams created yet for this event."}
              description="Be the first to create a team and invite collaborators."
            />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTeams.map((team) => {
              const isFull = (team.members?.length || 0) >= (event?.team_size_max || 4);
              const isMyTeamItem = team.id === myTeam?.id;

              return (
                <div
                  key={team.id}
                  className={`magizh-card p-6 flex flex-col justify-between transition-colors ${
                    isMyTeamItem ? "border-[#D4AF37]" : "hover:border-[#D4AF37]/50"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-[#252525] px-2 py-0.5 font-mono text-[10px] text-[#A1A1A1]">
                        {team.members?.length || 1} / {event?.team_size_max || 4} MEMBERS
                      </span>
                      {isFull ? (
                        <span className="text-[10px] font-mono text-[#C75C5C]">TEAM FULL</span>
                      ) : (
                        <span className="text-[10px] font-mono text-[#6FAF7B]">OPEN FOR JOIN</span>
                      )}
                    </div>

                    <h3 className="magizh-heading mt-4 text-xl font-bold text-[#F5F3ED]">
                      {team.name}
                    </h3>

                    {/* Team Members list summary */}
                    <div className="mt-4 space-y-1.5 text-xs text-[#A1A1A1]">
                      {team.members?.slice(0, 3).map((m, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 truncate">
                          <Users size={12} className="text-[#D4AF37]" />
                          <span className="truncate">{m.full_name || m.email || "Scholar"}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 border-t border-[#252525] pt-4 flex items-center justify-between">
                    <Link
                      href={`/events/${eventId}/teams/${team.id}`}
                      className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37] hover:underline"
                    >
                      {isMyTeamItem ? "Manage Team →" : "View Team →"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* CREATE TEAM MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-[#252525] bg-[#0A0A0A] p-6 text-[#F5F3ED] shadow-2xl">
            <h3 className="magizh-heading text-2xl font-bold">Create New Team</h3>
            <p className="mt-1 text-xs text-[#A1A1A1]">
              You will be registered as the Team Leader for this event.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createTeamMutation.mutate();
              }}
              className="mt-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1A1] mb-2">
                  Team Name *
                </label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Code Warriors, Neural Dynamics"
                  className="w-full rounded border border-[#252525] bg-[#000000] px-4 py-3 text-sm text-[#F5F3ED] outline-none focus:border-[#D4AF37]"
                />
              </div>

              {createError && (
                <div className="rounded border border-[#C75C5C]/40 bg-[#C75C5C]/10 p-3 text-xs text-[#C75C5C]">
                  {createError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded border border-[#252525] bg-[#0A0A0A] px-4 py-2.5 text-xs font-semibold uppercase text-[#A1A1A1]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTeamMutation.isPending || !teamName.trim()}
                  className="flex-1 rounded bg-[#D4AF37] py-2.5 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[#E5C04A] disabled:opacity-50"
                >
                  {createTeamMutation.isPending ? "Creating..." : "Establish Team"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
