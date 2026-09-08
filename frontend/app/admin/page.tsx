"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  Gavel,
  GraduationCap,
  LayoutDashboard,
  RefreshCw,
  Shield,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";

import {
  getAdminDashboard,
  getAdminDashboardActivity,
} from "@/lib/admin-api";
import {
  EmptyState,
  ErrorState,
  HackerSnakeLoader,
  RefetchIndicator,
  Skeleton,
} from "@/components/loading";

type QuickLink = {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>;
};

const quickLinks: QuickLink[] = [
  {
    title: "Events",
    description: "Create and manage innovation events.",
    href: "/admin/events",
    icon: CalendarDays,
  },
  {
    title: "Registrations",
    description: "Review and manage participant registrations.",
    href: "/admin/registrations",
    icon: BookOpen,
  },
  {
    title: "Submissions",
    description: "Monitor project submissions and status.",
    href: "/admin/submissions",
    icon: FileCheck2,
  },
  {
    title: "Judges",
    description: "Manage judges and event assignments.",
    href: "/admin/judges",
    icon: Gavel,
  },
  {
    title: "Results",
    description: "Manage event results and publication.",
    href: "/admin/events",
    icon: Trophy,
  },
  {
    title: "Certificates",
    description: "Manage certificates and issuance.",
    href: "/admin/certificates",
    icon: CheckCircle2,
  },
  {
    title: "Users",
    description: "Manage platform users and roles.",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Activity",
    description: "Review recent platform activity.",
    href: "/admin/activity",
    icon: Activity,
  },
  {
    title: "Audit Logs",
    description: "Review administrative audit records.",
    href: "/admin/audit-logs",
    icon: Shield,
  },
  {
    title: "Security",
    description: "Monitor security alerts and sessions.",
    href: "/admin/security",
    icon: Shield,
  },
  {
    title: "Analytics",
    description: "View platform and event analytics.",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "Evaluations",
    description: "Review submission evaluations.",
    href: "/admin/evaluations",
    icon: FileCheck2,
  },
];

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export default function AdminDashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: getAdminDashboard,
  });

  const activityQuery = useQuery({
    queryKey: ["admin-dashboard-activity"],
    queryFn: getAdminDashboardActivity,
  });

  const stats = dashboardQuery.data?.stats;

  const statCards = useMemo(
    () => [
      {
        label: "Users",
        value: stats?.total_users ?? 0,
        icon: UserRound,
      },
      {
        label: "Students",
        value: stats?.total_students ?? 0,
        icon: GraduationCap,
      },
      {
        label: "Events",
        value: stats?.total_events ?? 0,
        icon: CalendarDays,
      },
      {
        label: "Hackathons",
        value: stats?.total_hackathons ?? 0,
        icon: Trophy,
      },
      {
        label: "Registrations",
        value: stats?.total_registrations ?? 0,
        icon: BookOpen,
      },
      {
        label: "Teams",
        value: stats?.total_teams ?? 0,
        icon: Users,
      },
    ],
    [stats],
  );

  const hackathons = dashboardQuery.data?.hackathons ?? [];

  const handleRefresh = async () => {
    await Promise.all([
      dashboardQuery.refetch(),
      activityQuery.refetch(),
    ]);
  };

  return (
    <main className="min-h-screen bg-black text-[#F5F3ED]">
      <div className="magizh-container py-10 md:py-14">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
              Administration
            </p>

            <div className="flex items-center gap-3">
              <LayoutDashboard
                size={28}
                strokeWidth={1.5}
                className="text-[#D4AF37]"
              />

              <h1 className="magizh-heading text-4xl font-bold md:text-5xl">
                Admin Dashboard
              </h1>
            </div>

            <p className="mt-4 max-w-2xl text-base leading-7 text-[#A1A1A1]">
              Manage events, participants, submissions, judging, results,
              security, and platform activity from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={
              dashboardQuery.isFetching ||
              activityQuery.isFetching
            }
            className="inline-flex items-center justify-center gap-2 rounded border border-[#252525] px-5 py-3 text-sm font-semibold text-[#F5F3ED] transition hover:border-[#D4AF37] hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {dashboardQuery.isFetching ||
            activityQuery.isFetching ? (
              <HackerSnakeLoader size="sm" announce={false} />
            ) : (
              <RefreshCw size={16} />
            )}

            Refresh
          </button>
        </div>

        {/* Stats */}
        <section className="mb-12">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarChart3
                size={18}
                className="text-[#D4AF37]"
              />

              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#A1A1A1]">
                Platform Overview
              </h2>
            </div>

            {dashboardQuery.isFetching && !dashboardQuery.isLoading && (
              <RefetchIndicator active label="Updating" />
            )}
          </div>

          <div aria-busy={dashboardQuery.isLoading}>
            {dashboardQuery.isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-32" />
                ))}
              </div>
            ) : dashboardQuery.isError ? (
              <ErrorState
                title="Unable to load dashboard statistics."
                message="The admin dashboard API may be offline."
                onRetry={() => dashboardQuery.refetch()}
                retryLabel="Try Again"
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {statCards.map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <div
                      key={stat.label}
                      className="rounded border border-[#252525] bg-[#0D0D0F] p-6 transition hover:border-[#3a3a3a]"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A1A1A1]">
                          {stat.label}
                        </p>

                        <Icon
                          size={18}
                          strokeWidth={1.5}
                          className="text-[#D4AF37]"
                        />
                      </div>

                      <p className="mt-5 text-3xl font-semibold">
                        {stat.value.toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Hackathon overview */}
        <section className="mb-12">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-[#D4AF37]" />

              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#A1A1A1]">
                Hackathon Overview
              </h2>
            </div>

            <Link
              href="/admin/events"
              className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37] hover:text-[#E5C04A]"
            >
              Manage Events →
            </Link>
          </div>

          {dashboardQuery.isLoading ? (
            <div className="space-y-4" aria-hidden>
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-16" />
              ))}
            </div>
          ) : dashboardQuery.isError ? (
            <ErrorState
              title="Unable to load hackathon overview."
              onRetry={() => dashboardQuery.refetch()}
              retryLabel="Try Again"
            />
          ) : hackathons.length === 0 ? (
            <EmptyState
              kicker="HACKATHONS"
              title="No hackathons yet"
              description="Create your first hackathon to see live statistics here."
            />
          ) : (
            <div className="overflow-hidden rounded border border-[#252525] bg-[#0D0D0F]">
              <div className="divide-y divide-[#252525]">
                {hackathons.map((hackathon) => (
                  <div
                    key={hackathon.id}
                    className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/admin/events/${hackathon.id}/overview`}
                        className="text-base font-semibold transition-colors hover:text-[#D4AF37]"
                      >
                        {hackathon.title}
                      </Link>

                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <span className="rounded border border-[#252525] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#A1A1A1]">
                          {hackathon.status}
                        </span>

                        <span className="text-xs text-[#777]">
                          {hackathon.students} students
                        </span>

                        <span className="text-xs text-[#777]">
                          {hackathon.teams} teams
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-6">
                      <div className="text-right">
                        <p className="text-xl font-semibold">
                          {hackathon.registrations.toLocaleString()}
                        </p>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-[#777]">
                          Registrations
                        </p>
                      </div>

                      <Link
                        href={`/admin/events/${hackathon.id}/overview`}
                        aria-label={`View ${hackathon.title}`}
                        className="inline-flex items-center justify-center rounded border border-[#252525] px-3 py-2 text-[#D4AF37] transition hover:border-[#D4AF37]/60"
                      >
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Recent activity */}
        <section className="mb-12">
          <div className="mb-6 flex items-center gap-2">
            <Activity
              size={18}
              className="text-[#D4AF37]"
            />

            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#A1A1A1]">
              Recent Activity
            </h2>
          </div>

          {activityQuery.isFetching && !activityQuery.isLoading && (
            <RefetchIndicator active label="Updating" />
          )}

          <div className="overflow-hidden rounded border border-[#252525] bg-[#0D0D0F]">
            {activityQuery.isLoading ? (
              <div className="space-y-4 p-6" aria-hidden>
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-12" />
                ))}
              </div>
            ) : activityQuery.isError ? (
              <ErrorState
                title="Unable to load recent activity."
                message="The admin activity API may be offline."
                onRetry={() => activityQuery.refetch()}
                retryLabel="Try Again"
              />
            ) : !activityQuery.data?.length ? (
              <EmptyState
                kicker="ACTIVITY"
                title="No recent activity"
                description="Platform activity will appear here."
              />
            ) : (
              <div className="divide-y divide-[#252525]">
                {activityQuery.data.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex flex-col gap-2 px-6 py-5 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {activity.message}
                      </p>

                      <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#A1A1A1]">
                        {activity.type}
                      </p>
                    </div>

                    <p className="text-xs text-[#777]">
                      {formatDate(activity.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Quick links */}
        <section>
          <div className="mb-6 flex items-center gap-2">
            <LayoutDashboard
              size={18}
              className="text-[#D4AF37]"
            />

            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#A1A1A1]">
              Administration
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((link) => {
              const Icon = link.icon;

              return (
                <a
                  key={link.title}
                  href={link.href}
                  className="group rounded border border-[#252525] bg-[#0D0D0F] p-6 transition hover:border-[#D4AF37]/60"
                >
                  <div className="flex items-start justify-between">
                    <Icon
                      size={21}
                      strokeWidth={1.5}
                      className="text-[#D4AF37]"
                    />

                    <ChevronRight
                      size={17}
                      className="text-[#555] transition group-hover:translate-x-1 group-hover:text-[#D4AF37]"
                    />
                  </div>

                  <h3 className="mt-6 text-lg font-semibold">
                    {link.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#A1A1A1]">
                    {link.description}
                  </p>
                </a>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}