"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/providers/auth-provider";
import { DashboardSkeleton } from "@/components/loading";

export default function DashboardPage() {
  const router = useRouter();
  const { user, status, logout } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <main className="magizh-container py-20">
        <DashboardSkeleton variant="student" />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const displayName = user.profile?.full_name || user.email.split("@")[0];

  async function handleSignOut() {
    await logout();
    router.replace("/login");
  }

  return (
    <main className="magizh-container py-12 md:py-16">
      <section className="mb-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.25em]">
              STUDENT DASHBOARD
            </p>

            <h1 className="magizh-heading mt-3 text-4xl font-bold md:text-5xl">
              Welcome back, {displayName}.
            </h1>

            <p className="magizh-muted mt-4 max-w-2xl">
              Manage your events, teams, projects, submissions, results, and
              certificates from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="magizh-button"
          >
            Sign Out
          </button>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="My Events"
          description="View events you have registered for."
          href="/dashboard/events"
        />

        <DashboardCard
          title="My Teams"
          description="Create and manage your event teams."
          href="/dashboard/teams"
        />

        <DashboardCard
          title="My Projects"
          description="Manage your innovation projects."
          href="/dashboard/projects"
        />

        <DashboardCard
          title="Submissions"
          description="Track your project submissions."
          href="/dashboard/submissions"
        />

        <DashboardCard
          title="Results"
          description="View event results and leaderboards."
          href="/dashboard/results"
        />

        <DashboardCard
          title="Certificates"
          description="View and download your certificates."
          href="/dashboard/certificates"
        />
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="magizh-card p-6">
          <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
            Account
          </p>

          <h2 className="magizh-heading mt-2 text-2xl font-bold">
            {user.email}
          </h2>

          <p className="magizh-muted mt-2 text-sm">
            Role: {user.role}
          </p>

          <Link
            href="/profile"
            className="mt-5 inline-flex text-sm font-semibold uppercase tracking-wider text-[#D4AF37] hover:text-[#E5C04A]"
          >
            View Profile →
          </Link>
        </div>

        <div className="magizh-card p-6">
          <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
            Notifications
          </p>

          <h2 className="magizh-heading mt-2 text-2xl font-bold">
            Stay updated
          </h2>

          <p className="magizh-muted mt-2 text-sm">
            Event updates, team activity, submissions, and results will appear
            here.
          </p>

          <Link
            href="/dashboard/notifications"
            className="mt-5 inline-flex text-sm font-semibold uppercase tracking-wider text-[#D4AF37] hover:text-[#E5C04A]"
          >
            View Notifications →
          </Link>
        </div>
      </section>
    </main>
  );
}

type DashboardCardProps = {
  title: string;
  description: string;
  href: string;
};

function DashboardCard({
  title,
  description,
  href,
}: DashboardCardProps) {
  return (
    <Link
      href={href}
      className="magizh-card group p-6 transition-colors duration-200 hover:border-[#D4AF37]"
    >
      <h2 className="magizh-heading text-2xl font-bold transition-colors group-hover:text-[#D4AF37]">
        {title}
      </h2>

      <p className="magizh-muted mt-3 text-sm leading-6">
        {description}
      </p>

      <span className="mt-6 inline-block text-sm font-semibold uppercase tracking-wider text-[#D4AF37]">
        Open →
      </span>
    </Link>
  );
}