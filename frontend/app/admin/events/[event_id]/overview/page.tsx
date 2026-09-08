"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BackButton } from "@/components/ui/BackButton";
import {
  GraduationCap,
  Trophy,
  Users,
} from "lucide-react";

import { getEventOverview } from "@/lib/admin-api";
import {
  EmptyState,
  ErrorState,
  Skeleton,
} from "@/components/loading";

export default function AdminEventOverviewPage() {
  const params = useParams();
  const eventId = params.event_id as string;

  const overviewQuery = useQuery({
    queryKey: ["admin-event-overview", eventId],
    queryFn: () => getEventOverview(eventId),
    enabled: Boolean(eventId),
  });

  const data = overviewQuery.data;

  return (
    <main className="min-h-screen bg-black text-[#F5F3ED]">
      <div className="magizh-container py-10 md:py-14">
        <BackButton label="Back" href="/admin/events" className="mb-6" />

        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-wrap items-center gap-4">
            {data && (
              <Link
                href={`/admin/events/${eventId}`}
                className="text-sm font-semibold uppercase tracking-wider text-[#A1A1A1] transition-colors hover:text-[#D4AF37]"
              >
                Edit Event →
              </Link>
            )}
          </div>

          {overviewQuery.isLoading ? (
            <div className="mt-8 max-w-2xl space-y-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-12 w-3/4" />
            </div>
          ) : overviewQuery.isError ? (
            <div className="mt-8">
              <ErrorState
                title="Unable to load this event's overview."
                message="The admin overview API may be offline."
                onRetry={() => overviewQuery.refetch()}
                retryLabel="Try Again"
              />
            </div>
          ) : data ? (
            <>
              <p className="mt-8 text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
                {data.event_type.replace("_", " ")} · {data.status}
              </p>

              <h1 className="magizh-heading mt-3 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
                {data.title}
              </h1>

              <div className="mt-6 flex flex-wrap gap-6">
                <div className="rounded border border-[#252525] bg-[#0D0D0F] px-5 py-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap
                      size={16}
                      className="text-[#D4AF37]"
                    />

                    <p className="text-2xl font-semibold">
                      {data.total_students}
                    </p>
                  </div>

                  <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-[#777]">
                    Registered Students
                  </p>
                </div>

                <div className="rounded border border-[#252525] bg-[#0D0D0F] px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-[#D4AF37]" />

                    <p className="text-2xl font-semibold">
                      {data.total_teams}
                    </p>
                  </div>

                  <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-[#777]">
                    Teams
                  </p>
                </div>

                {data.start_date && (
                  <div className="rounded border border-[#252525] bg-[#0D0D0F] px-5 py-4">
                    <p className="text-sm font-semibold">
                      {new Date(data.start_date).toLocaleDateString()}
                    </p>

                    <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-[#777]">
                      Starts
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {data && (
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Students */}
            <section className="rounded border border-[#252525] bg-[#0D0D0F]">
              <div className="border-b border-[#252525] px-6 py-5">
                <div className="flex items-center gap-2">
                  <GraduationCap
                    size={18}
                    className="text-[#D4AF37]"
                  />

                  <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#A1A1A1]">
                    Students ({data.total_students})
                  </h2>
                </div>
              </div>

              {data.students.length === 0 ? (
                <EmptyState
                  kicker="STUDENTS"
                  title="No registered students"
                  description="Students who register will appear here."
                  className="m-6"
                />
              ) : (
                <div className="divide-y divide-[#252525]">
                  {data.students.map((student) => (
                    <div
                      key={student.id}
                      className="flex flex-col gap-2 px-6 py-4"
                    >
                      <p className="text-sm font-semibold">
                        {student.full_name || "Student"}
                      </p>

                      <p className="break-all text-xs text-[#A1A1A1]">
                        {student.email}
                      </p>

                      <div className="flex items-center gap-3">
                        <span className="rounded border border-[#252525] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#6FAF7B]">
                          {student.registration_status}
                        </span>

                        <span className="text-[10px] uppercase tracking-[0.12em] text-[#777]">
                          {new Date(
                            student.registered_at,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Teams */}
            <section className="rounded border border-[#252525] bg-[#0D0D0F]">
              <div className="border-b border-[#252525] px-6 py-5">
                <div className="flex items-center gap-2">
                  <Trophy size={18} className="text-[#D4AF37]" />

                  <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#A1A1A1]">
                    Teams ({data.total_teams})
                  </h2>
                </div>
              </div>

              {data.teams.length === 0 ? (
                <EmptyState
                  kicker="TEAMS"
                  title="No teams yet"
                  description="Teams created by students will appear here."
                  className="m-6"
                />
              ) : (
                <div className="divide-y divide-[#252525]">
                  {data.teams.map((team) => (
                    <div
                      key={team.id}
                      className="flex flex-col gap-2 px-6 py-4"
                    >
                      <p className="text-sm font-semibold">
                        {team.name}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#A1A1A1]">
                        <span>
                          Leader: {team.leader_name || "Unknown"}
                        </span>

                        <span className="rounded border border-[#252525] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                          {team.member_count}{" "}
                          {team.member_count === 1
                            ? "member"
                            : "members"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}