"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  FolderKanban,
  Gavel,
  LayoutDashboard,
  Radio,
  RefreshCw,
  Shield,
  Trophy,
  UserRound,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";

<<<<<<< HEAD
import {
  getAdminDashboard,
  getAdminDashboardActivity,
} from "@/lib/admin-api";
import {
  useWebSocket,
  type WebSocketMessage,
} from "@/hooks/use-websocket";
import {
  getRealtimeEventType,
  getRealtimeMessage,
} from "@/lib/realtime";
=======
import { getAdminDashboard, getAdminDashboardActivity } from "@/lib/admin-api";
import { useWebSocket, type WebSocketMessage } from "@/hooks/use-websocket";
import {
  EmptyState,
  ErrorState,
  RefetchIndicator,
  Skeleton,
} from "@/components/loading";
>>>>>>> e9267dfe5ddf938a4d6ac2efd5e1b0ac0921637d

type QuickLink = {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{
    size?: number;
    strokeWidth?: number;
<<<<<<< HEAD
=======
    className?: string;
>>>>>>> e9267dfe5ddf938a4d6ac2efd5e1b0ac0921637d
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
    href: "/admin/results",
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
];

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function getEventLabel(message: WebSocketMessage) {
  const eventType = getRealtimeEventType(message);

  if (eventType === "unknown") {
    return "Realtime";
  }

  return eventType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();

  const [lastRealtimeMessage, setLastRealtimeMessage] =
    useState<WebSocketMessage | null>(null);

  const dashboardQuery = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: getAdminDashboard,
  });

  const activityQuery = useQuery({
    queryKey: ["admin-dashboard-activity"],
    queryFn: getAdminDashboardActivity,
  });

  const handleRealtimeMessage = useCallback(
    (message: WebSocketMessage) => {
      setLastRealtimeMessage(message);

      /*
       * WebSocket only informs the frontend that something changed.
       * PostgreSQL remains the source of truth.
       *
       * Therefore, invalidate the relevant queries and fetch the
       * latest dashboard data from the REST API.
       */
      queryClient.invalidateQueries({
        queryKey: ["admin-dashboard"],
      });

      queryClient.invalidateQueries({
        queryKey: ["admin-dashboard-activity"],
      });
    },
    [queryClient],
  );

  const {
    connected: websocketConnected,
    connecting: websocketConnecting,
    reconnect: reconnectWebSocket,
  } = useWebSocket("/ws/admin", {
    enabled: true,
    reconnect: true,
    reconnectDelay: 3000,
    onMessage: handleRealtimeMessage,
  });

  useEffect(() => {
    if (!lastRealtimeMessage) {
      return;
    }

    const timer = window.setTimeout(() => {
      setLastRealtimeMessage(null);
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [lastRealtimeMessage]);

  const stats = dashboardQuery.data;

  const statCards = useMemo(
    () => [
      {
        label: "Users",
        value: stats?.total_users ?? 0,
        icon: UserRound,
      },
      {
        label: "Events",
        value: stats?.total_events ?? 0,
        icon: CalendarDays,
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
      {
        label: "Projects",
        value: stats?.total_projects ?? 0,
        icon: FolderKanban,
      },
      {
        label: "Submissions",
        value: stats?.total_submissions ?? 0,
        icon: FileCheck2,
      },
    ],
    [stats],
  );

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
            <RefreshCw
              size={16}
              className={
                dashboardQuery.isFetching ||
                activityQuery.isFetching
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>
        </div>

        {/* WebSocket status */}
        <section className="mb-8">
          <div
            className={`flex flex-col gap-4 rounded border px-5 py-4 md:flex-row md:items-center md:justify-between ${
              websocketConnected
                ? "border-[#6FAF7B]/30 bg-[#0D0D0F]"
                : "border-[#252525] bg-[#0D0D0F]"
            }`}
          >
            <div className="flex items-center gap-3">
              {websocketConnected ? (
                <Wifi
                  size={18}
                  strokeWidth={1.7}
                  className="text-[#6FAF7B]"
                />
              ) : (
                <WifiOff
                  size={18}
                  strokeWidth={1.7}
                  className="text-[#A1A1A1]"
                />
              )}

              <div>
                <p className="text-sm font-semibold">
                  {websocketConnected
                    ? "Live updates connected"
                    : websocketConnecting
                      ? "Connecting to live updates..."
                      : "Live updates disconnected"}
                </p>

                <p className="mt-1 text-xs text-[#A1A1A1]">
                  {websocketConnected
                    ? "Admin dashboard is listening for realtime events."
                    : "The dashboard will automatically try to reconnect."}
                </p>
              </div>
            </div>

            {!websocketConnected && !websocketConnecting && (
              <button
                type="button"
                onClick={reconnectWebSocket}
                className="inline-flex items-center justify-center gap-2 rounded border border-[#252525] px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#F5F3ED] transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
              >
                <Radio size={14} />
                Reconnect
              </button>
            )}
          </div>

          {lastRealtimeMessage && (
            <div className="mt-3 rounded border border-[#D4AF37]/30 bg-[#0D0D0F] px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell
                  size={16}
                  className="shrink-0 text-[#D4AF37]"
                />

                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#D4AF37]">
                  {getEventLabel(lastRealtimeMessage)}
                </span>
              </div>

              <p className="mt-2 pl-6 text-sm text-[#F5F3ED]">
                {getRealtimeMessage(lastRealtimeMessage)}
              </p>
            </div>
          )}
        </section>

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

            {/* Background refetch: keep stats visible, show subtle update */}
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

        {/* Recent activity */}
        <section className="mb-12">
          <div className="mb-6 flex items-center gap-2">
            <Activity
              size={18}
              className="text-[#D4AF37]"
            />

<<<<<<< HEAD
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#A1A1A1]">
              Recent Activity
            </h2>
=======
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#A1A1A1]">
                Recent Activity
              </h2>
            </div>

            {/* Background refetch keeps existing activity visible */}
            {activityQuery.isFetching && !activityQuery.isLoading && (
              <RefetchIndicator active label="Updating" />
            )}
>>>>>>> e9267dfe5ddf938a4d6ac2efd5e1b0ac0921637d
          </div>

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
                  key={link.href}
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