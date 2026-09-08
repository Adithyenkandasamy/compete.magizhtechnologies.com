"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Copy, Check, Users, Crown, Plus, Link2 } from "lucide-react";

import { getMyRegistrations } from "@/lib/registrations-api";
import { getEvent } from "@/lib/events-api";
import { useAuth } from "@/providers/auth-provider";
import {
  createTeam,
  getEventTeams,
  getTeam,
  generateInvite,
} from "@/lib/teams-api";
import type { Registration } from "@/lib/registrations-api";
import type { Event } from "@/types/events";
import type { Team, TeamMember } from "@/lib/teams-api";
import { getErrorMessage } from "@/lib/error-message";
import { PageLoader } from "@/components/loading";
import { BackButton } from "@/components/ui/BackButton";

type TeamWithMembers = Team & {
  members?: TeamMember[];
  member_count?: number;
  max_members?: number;
};

type EventTeams = {
  event: Event;
  teams: TeamWithMembers[];
};

export default function MyTeamsPage() {
  const { user } = useAuth();
  const [eventTeams, setEventTeams] = useState<EventTeams[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [creatingForEvent, setCreatingForEvent] = useState("");
  const [teamName, setTeamName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [inviteTeamId, setInviteTeamId] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  const loadTeams = useCallback(async () => {
    try {
      setError("");

      const registrations = await getMyRegistrations();

      const results = await Promise.all(
        registrations.map(async (registration) => {
          let event: Event | null = null;

          try {
            event = await getEvent(registration.event_id);
          } catch {
            return null;
          }

          if (!event) return null;

          let teams: TeamWithMembers[] = [];

          try {
            const eventTeams = await getEventTeams(registration.event_id);
            teams = await Promise.all(
              eventTeams.map(async (t) => {
                try {
                  const full = await getTeam(t.id);
                  return full as TeamWithMembers;
                } catch {
                  return t as TeamWithMembers;
                }
              }),
            );
          } catch {
            teams = [];
          }

          return { event, teams };
        }),
      );

      setEventTeams(results.filter((r): r is EventTeams => r !== null));
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to load your teams."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  async function handleCreateTeam(eventId: string) {
    if (!teamName.trim()) {
      setError("Please enter a team name.");
      return;
    }

    setError("");
    setIsCreating(true);
    setCreatingForEvent(eventId);

    try {
      const newTeam = await createTeam(eventId, { name: teamName.trim() });
      const full = await getTeam(newTeam.id);

      setEventTeams((current) =>
        current.map((item) =>
          item.event.id === eventId
            ? { ...item, teams: [...item.teams, full as TeamWithMembers] }
            : item,
        ),
      );

      setTeamName("");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to create the team."));
    } finally {
      setIsCreating(false);
      setCreatingForEvent("");
    }
  }

  async function handleGenerateInvite(teamId: string) {
    setInviteTeamId(teamId);
    setInviteLink("");
    setCopied(false);

    try {
      const data = await generateInvite(teamId);
      const fullUrl = `${window.location.origin}/join/${data.token}`;
      setInviteLink(fullUrl);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to generate invite link."));
    } finally {
      setInviteTeamId(null);
    }
  }

  function handleCopyLink() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isLoading) {
    return (
      <main className="magizh-container py-20">
        <PageLoader label="Loading your teams..." />
      </main>
    );
  }

  return (
    <main className="magizh-container py-12 md:py-16">
      <BackButton label="Back" href="/dashboard" className="mb-6" />

      <div className="mb-10">
        <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.25em]">
          MY TEAMS
        </p>

        <h1 className="magizh-heading mt-3 text-4xl font-bold md:text-5xl">
          Teams & Members
        </h1>

        <p className="magizh-muted mt-4 max-w-2xl text-base leading-7">
          Your registered events, the teams you belong to, and every member
          in each team — all in one place.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded border border-[#C75C5C]/40 bg-[#C75C5C]/10 px-4 py-3">
          <p className="text-sm text-[#C75C5C]">{error}</p>
        </div>
      )}

      {eventTeams.length === 0 && (
        <div className="magizh-card p-10 text-center">
          <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
            NO EVENTS
          </p>

          <h2 className="magizh-heading mt-3 text-2xl font-bold">
            Register for an event first.
          </h2>

          <p className="magizh-muted mt-3">
            Once you register for an event, you can create and manage your
            team here.
          </p>

          <Link href="/events" className="magizh-button mt-6">
            Explore Events
          </Link>
        </div>
      )}

      <div className="space-y-12">
        {eventTeams.map(({ event, teams }) => (
          <section key={event.id}>
            {/* Event header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
                  {event.event_type.replace("_", " ")}
                </p>
                <h2 className="magizh-heading mt-2 text-3xl font-bold">
                  {event.title}
                </h2>
                <p className="magizh-muted mt-1 text-sm">
                  {new Date(event.start_date).toLocaleDateString()} —{" "}
                  {new Date(event.end_date).toLocaleDateString()}
                </p>
              </div>

              <Link
                href={`/events/${event.id}`}
                className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37] transition-colors hover:text-[#E5C04A]"
              >
                View Event →
              </Link>
            </div>

            {teams.length === 0 ? (
              <div className="magizh-card p-7">
                <h3 className="magizh-heading text-xl font-bold">
                  No teams yet
                </h3>
                <p className="magizh-muted mt-2 text-sm">
                  Create a team to start collaborating for this event.
                </p>

                <div className="mt-5 flex gap-3">
                  <input
                    type="text"
                    value={creatingForEvent === event.id ? teamName : ""}
                    onChange={(e) => {
                      setCreatingForEvent(event.id);
                      setTeamName(e.target.value);
                    }}
                    placeholder="Team name"
                    className="flex-1 rounded border border-[#252525] bg-[#0A0A0A] px-4 py-2.5 text-sm text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
                  />
                  <button
                    type="button"
                    onClick={() => handleCreateTeam(event.id)}
                    disabled={
                      isCreating && creatingForEvent === event.id
                    }
                    className="magizh-button shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isCreating && creatingForEvent === event.id
                      ? "Creating..."
                      : "Create Team"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {teams.map((team) => {
                  const members = team.members ?? [];
                  const leaderId = team.leader_id;
                  const isLeader = leaderId === user?.id;
                  const leaderMember = members.find(
                    (m) => (m.user_id || m.id) === leaderId,
                  );

                  return (
                    <div
                      key={team.id}
                      className="magizh-card overflow-hidden"
                    >
                      {/* Team header */}
                      <div className="flex flex-col gap-4 border-b border-[#252525] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded border border-[#252525] bg-[#0A0A0A]">
                            <Users
                              size={18}
                              className="text-[#D4AF37]"
                            />
                          </div>

                          <div>
                            <h3 className="text-lg font-bold">
                              {team.name}
                            </h3>
                            <p className="magizh-muted text-xs">
                              {members.length}{" "}
                              {members.length === 1
                                ? "member"
                                : "members"}
                              {team.max_members
                                ? ` / ${team.max_members} max`
                                : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {isLeader && (
                            <button
                              type="button"
                              onClick={() =>
                                handleGenerateInvite(team.id)
                              }
                              disabled={inviteTeamId === team.id}
                              className="inline-flex items-center gap-2 rounded border border-[#252525] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#A1A1A1] transition hover:border-[#D4AF37] hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Link2 size={13} />
                              {inviteTeamId === team.id
                                ? "Generating..."
                                : "Invite Link"}
                            </button>
                          )}

                          <Link
                            href={`/dashboard/teams/${team.id}`}
                            className="inline-flex items-center rounded border border-[#D4AF37]/60 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#D4AF37] transition-colors hover:bg-[#D4AF37]/10"
                          >
                            Manage
                          </Link>
                        </div>
                      </div>

                      {/* Invite link banner */}
                      {inviteLink && inviteTeamId === null && (
                        <div className="border-b border-[#252525] bg-[#D4AF37]/5 px-6 py-4">
                          <p className="magizh-gold text-[10px] font-semibold uppercase tracking-[0.2em]">
                            Share this invite link
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <code className="flex-1 truncate rounded border border-[#252525] bg-[#0A0A0A] px-3 py-2 text-xs text-[#F5F3ED]">
                              {inviteLink}
                            </code>
                            <button
                              type="button"
                              onClick={handleCopyLink}
                              className="shrink-0 rounded border border-[#252525] px-3 py-2 text-xs font-semibold text-[#A1A1A1] transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
                            >
                              {copied ? (
                                <Check
                                  size={14}
                                  className="text-[#6FAF7B]"
                                />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Members list */}
                      {members.length > 0 ? (
                        <div className="divide-y divide-[#252525]">
                          {members.map((member) => {
                            const memberId =
                              member.user_id || member.id;
                            const isMemberLeader =
                              memberId === leaderId;
                            const displayName =
                              member.full_name ||
                              member.email ||
                              "Student";

                            return (
                              <div
                                key={memberId}
                                className="flex items-center gap-4 px-6 py-4"
                              >
                                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#252525] bg-[#0A0A0A] text-xs font-semibold text-[#A1A1A1]">
                                  {displayName
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="truncate text-sm font-medium">
                                      {displayName}
                                    </p>
                                    {isMemberLeader && (
                                      <span className="inline-flex items-center gap-1 rounded border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#D4AF37]">
                                        <Crown size={9} />
                                        Leader
                                      </span>
                                    )}
                                  </div>
                                  {member.email && (
                                    <p className="magizh-muted mt-0.5 truncate text-xs">
                                      {member.email}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="px-6 py-5">
                          <p className="magizh-muted text-sm">
                            No member details available.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Inline create team */}
                <div className="rounded border border-dashed border-[#252525] bg-[#0A0A0A]/50 p-5">
                  <div className="flex items-center gap-3">
                    <Plus
                      size={16}
                      className="text-[#A1A1A1]"
                    />

                    <p className="text-sm font-medium">
                      Create another team for this event
                    </p>
                  </div>

                  <div className="mt-3 flex gap-3">
                    <input
                      type="text"
                      value={
                        creatingForEvent === event.id
                          ? teamName
                          : ""
                      }
                      onChange={(e) => {
                        setCreatingForEvent(event.id);
                        setTeamName(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleCreateTeam(event.id);
                        }
                      }}
                      placeholder="New team name"
                      className="flex-1 rounded border border-[#252525] bg-[#0A0A0A] px-4 py-2.5 text-sm text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
                    />
                    <button
                      type="button"
                      onClick={() => handleCreateTeam(event.id)}
                      disabled={
                        isCreating && creatingForEvent === event.id
                      }
                      className="magizh-button shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isCreating && creatingForEvent === event.id
                        ? "Creating..."
                        : "Create"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
