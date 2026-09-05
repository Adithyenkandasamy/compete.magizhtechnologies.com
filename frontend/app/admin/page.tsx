"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  getAdminDashboard,
  getAdminDashboardActivity,
  type AdminActivity,
  type AdminDashboardStats,
} from "@/lib/admin-api";

const adminSections = [
  {
    title: "Events",
    description: "Create, publish, update, and manage events.",
    href: "/admin/events",
  },
  {
    title: "Registrations",
    description: "Monitor and manage event registrations.",
    href: "/admin/registrations",
  },
  {
    title: "Teams",
    description: "Review teams and participation.",
    href: "/admin/teams",
  },
  {
    title: "Projects",
    description: "Manage submitted student projects.",
    href: "/admin/projects",
  },
  {
    title: "Submissions",
    description: "Review and manage project submissions.",
    href: "/admin/submissions",
  },
  {
    title: "Judges",
    description: "Manage judges and event assignments.",
    href: "/admin/judges",
  },
  {
    title: "Results",
    description: "Manage event results and publishing.",
    href: "/admin/results",
  },
  {
    title: "Certificates",
    description: "Generate and issue certificates.",
    href: "/admin/certificates",
  },
  {
    title: "Users",
    description: "Manage student accounts and roles.",
    href: "/admin/users",
  },
  {
    title: "Security",
    description: "Monitor alerts, sessions, and login activity.",
    href: "/admin/security",
  },
  {
    title: "Analytics",
    description: "View platform and event analytics.",
    href: "/admin/analytics",
  },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [activity, setActivity] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [dashboardData, activityData] = await Promise.all([
          getAdminDashboard(),
          getAdminDashboardActivity(),
        ]);

        setStats(dashboardData);
        setActivity(activityData);
      } catch (err) {
        console.error("Unable to load admin dashboard:", err);
        setError("Unable to load admin dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <main className="min-h-screen bg-black">
      <section className="magizh-container py-12 md:py-20">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.3em]">
              MAGIZH TECHNOLOGIES
            </p>

            <h1 className="magizh-heading mt-4 text-4xl font-bold leading-tight md:text-6xl">
              Admin Dashboard
            </h1>

            <p className="magizh-muted mt-4 max-w-2xl leading-7">
              Manage events, students, teams, projects, submissions, and
              platform activity from one place.
            </p>
          </div>

          <div className="text-xs uppercase tracking-[0.2em] text-[#666]">
            Administration
          </div>
        </div>

        {loading && (
          <div className="magizh-card mt-12 p-8">
            <p className="magizh-muted">Loading dashboard...</p>
          </div>
        )}

        {error && (
          <div className="magizh-card mt-12 border-[#C75C5C] p-8">
            <p className="text-[#C75C5C]">{error}</p>
          </div>
        )}

        {!loading && !error && stats && (
          <>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                label="Users"
                value={stats.total_users}
              />

              <StatCard
                label="Events"
                value={stats.total_events}
              />

              <StatCard
                label="Registrations"
                value={stats.total_registrations}
              />

              <StatCard
                label="Teams"
                value={stats.total_teams}
              />

              <StatCard
                label="Projects"
                value={stats.total_projects}
              />

              <StatCard
                label="Submissions"
                value={stats.total_submissions}
              />
            </div>

            <div className="mt-16 grid gap-10 lg:grid-cols-[1fr_360px]">
              <section>
                <div className="mb-6">
                  <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.25em]">
                    MANAGEMENT
                  </p>

                  <h2 className="magizh-heading mt-3 text-2xl font-bold md:text-3xl">
                    Platform Controls
                  </h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {adminSections.map((section) => (
                    <Link
                      key={section.href}
                      href={section.href}
                      className="magizh-card group block p-6 transition-all duration-200 hover:border-[#D4AF37]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="magizh-heading text-xl font-bold">
                          {section.title}
                        </h3>

                        <span className="text-[#555] transition-colors group-hover:text-[#D4AF37]">
                          →
                        </span>
                      </div>

                      <p className="magizh-muted mt-3 text-sm leading-6">
                        {section.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>

              <aside>
                <div className="mb-6">
                  <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.25em]">
                    ACTIVITY
                  </p>

                  <h2 className="magizh-heading mt-3 text-2xl font-bold">
                    Recent Activity
                  </h2>
                </div>

                <div className="magizh-card divide-y divide-[#252525]">
                  {activity.length === 0 ? (
                    <div className="p-6">
                      <p className="magizh-muted text-sm">
                        No recent activity.
                      </p>
                    </div>
                  ) : (
                    activity.map((item) => (
                      <div
                        key={item.id}
                        className="p-5"
                      >
                        <p className="text-sm leading-6 text-[#F5F3ED]">
                          {item.message}
                        </p>

                        <div className="mt-2 flex items-center justify-between gap-3">
                          <span className="magizh-gold text-[10px] font-semibold uppercase tracking-[0.15em]">
                            {item.type}
                          </span>

                          <span className="text-[10px] text-[#666]">
                            {new Date(
                              item.created_at,
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </aside>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="magizh-card p-6">
      <p className="magizh-muted text-xs font-semibold uppercase tracking-[0.2em]">
        {label}
      </p>

      <p className="magizh-heading mt-3 text-3xl font-bold md:text-4xl">
        {value.toLocaleString("en-IN")}
      </p>
    </div>
  );
}