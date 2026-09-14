"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
  X,
  Clock,
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
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function timeAgo(value: string) {
  const now = Date.now();
  const then = new Date(value).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return formatDate(value);
}

// ---------------------------------------------------------------------------
// Activity Slide-Over Panel
// ---------------------------------------------------------------------------
function ActivityPanel({
  open,
  onClose,
  activityQuery,
}: {
  open: boolean;
  onClose: () => void;
  activityQuery: ReturnType<typeof useQuery>;
}) {
  const activities = activityQuery.data as
    | { id: string; message: string; type: string; created_at: string }[]
    | undefined;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Slide-over panel */}
      <div
        className={`fixed top-0 right-0 z-50 flex h-full w-full max-w-sm flex-col bg-[#0A0A0A] shadow-[−4px_0_40px_rgba(0,0,0,0.8)] border-l border-[#252525] transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-[#252525] px-5 py-4">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-[#D4AF37]" />
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#F5F3ED]">
              Recent Activity
            </h2>
            {activityQuery.isFetching && (
              <div className="h-3 w-3 rounded-full border border-[#252525] border-t-[#D4AF37] animate-spin" />
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded border border-[#252525] text-[#A1A1A1] transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
            aria-label="Close activity panel"
          >
            <X size={14} />
          </button>
        </div>

        {/* Panel body */}
        <div className="flex-1 overflow-y-auto">
          {activityQuery.isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : activityQuery.isError ? (
            <div className="p-5">
              <ErrorState
                title="Unable to load activity."
                onRetry={() => activityQuery.refetch()}
                retryLabel="Retry"
              />
            </div>
          ) : !activities?.length ? (
            <div className="p-5">
              <EmptyState
                kicker="ACTIVITY"
                title="No activity yet"
                description="Platform events will appear here in real time."
              />
            </div>
          ) : (
            <div className="divide-y divide-[#1A1A1A]">
              {activities.map((activity) => (
                <div key={activity.id} className="px-5 py-4">
                  <p className="text-sm font-medium text-[#F5F3ED] leading-snug">
                    {activity.message}
                  </p>
                  <div className="mt-1.5 flex items-center gap-3">
                    <span className="rounded border border-[#252525] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-[#A1A1A1]">
                      {activity.type}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-[#555]">
                      <Clock size={10} />
                      {timeAgo(activity.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel footer */}
        <div className="border-t border-[#252525] px-5 py-4">
          <Link
            href="/admin/activity"
            onClick={onClose}
            className="flex items-center justify-center gap-2 rounded border border-[#252525] py-2.5 text-xs font-semibold uppercase tracking-wider text-[#D4AF37] transition hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/5"
          >
            View All Activity <ChevronRight size={13} />
          </Link>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main admin dashboard
// ---------------------------------------------------------------------------
export default function AdminDashboardPage() {
  const [activityOpen, setActivityOpen] = useState(false);

  const dashboardQuery = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: getAdminDashboard,
  });

  const activityQuery = useQuery({
    queryKey: ["admin-dashboard-activity"],
    queryFn: getAdminDashboardActivity,
    enabled: activityOpen, // only fetch when panel is first opened
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
    await dashboardQuery.refetch();
    if (activityOpen) await activityQuery.refetch();
  };

  return (
    <>
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

            <div className="flex items-center gap-3">
              {/* Activity mini-window trigger */}
              <button
                type="button"
                onClick={() => setActivityOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded border border-[#D4AF37]/40 bg-[#D4AF37]/5 px-5 py-3 text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/10"
              >
                <Activity size={16} />
                Activity
              </button>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={dashboardQuery.isFetching}
                className="inline-flex items-center justify-center gap-2 rounded border border-[#252525] px-5 py-3 text-sm font-semibold text-[#F5F3ED] transition hover:border-[#D4AF37] hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {dashboardQuery.isFetching ? (
                  <HackerSnakeLoader size="sm" announce={false} />
                ) : (
                  <RefreshCw size={16} />
                )}
                Refresh
              </button>
            </div>
          </div>

          {/* Stats */}
          <section className="mb-12">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-[#D4AF37]" />
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

          {/* Quick links */}
          <section>
            <div className="mb-6 flex items-center gap-2">
              <LayoutDashboard size={18} className="text-[#D4AF37]" />
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

                    <h3 className="mt-6 text-lg font-semibold">{link.title}</h3>

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

      {/* Activity slide-over */}
      <ActivityPanel
        open={activityOpen}
        onClose={() => setActivityOpen(false)}
        activityQuery={activityQuery}
      />
    </>
  );
}