"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getCurrentUser } from "@/lib/auth-api";
import { getAccessToken } from "@/lib/auth";
import type { User } from "@/types/auth";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = getAccessToken();

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  if (isLoading) {
    return (
      <main className="magizh-container py-20">
        <p className="magizh-muted">Loading dashboard...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="magizh-container py-20">
        <div className="magizh-card max-w-lg p-8">
          <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
            Authentication Required
          </p>

          <h1 className="magizh-heading mt-3 text-3xl font-bold">
            Please sign in
          </h1>

          <p className="magizh-muted mt-3">
            You need to sign in to access your student dashboard.
          </p>

          <Link
            href="/login"
            className="magizh-button mt-6"
          >
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="magizh-container py-12 md:py-16">
      <section className="mb-12">
        <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.25em]">
          STUDENT DASHBOARD
        </p>

        <h1 className="magizh-heading mt-3 text-4xl font-bold md:text-5xl">
          Welcome back
          {user.email ? `, ${user.email.split("@")[0]}` : ""}.
        </h1>

        <p className="magizh-muted mt-4 max-w-2xl">
          Manage your events, teams, projects, submissions, results, and
          certificates from one place.
        </p>
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
            href="/notifications"
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