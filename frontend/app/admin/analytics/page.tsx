"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { getAnalyticsOverview } from "@/lib/admin-analytics-api";

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function formatLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AdminAnalyticsPage() {
  const {
    data: analytics,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-analytics-overview"],
    queryFn: getAnalyticsOverview,
  });

  const entries = analytics
    ? Object.entries(analytics).filter(
        ([, value]) =>
          value !== null &&
          value !== undefined &&
          typeof value !== "object",
      )
    : [];

  return (
    <main className="min-h-screen bg-black text-[#F5F3ED]">
      <div className="magizh-container py-10 md:py-14">
        <div className="mb-10 flex flex-col gap-5 border-b border-[#252525] pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
              Admin / Analytics
            </p>

            <h1 className="magizh-heading text-4xl font-bold md:text-5xl">
              Analytics Overview
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#A1A1A1]">
              Monitor platform-wide participation, events, projects,
              registrations, and other analytics.
            </p>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded border border-[#252525] px-4 py-2.5 text-sm transition hover:border-[#D4AF37] hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {isLoading && (
          <div className="flex min-h-60 items-center justify-center">
            <div className="flex items-center gap-3 text-[#A1A1A1]">
              <Loader2 size={20} className="animate-spin" />
              Loading analytics...
            </div>
          </div>
        )}

        {isError && !isLoading && (
          <div className="rounded-lg border border-[#C75C5C]/40 bg-[#0D0D0F] p-8 text-center">
            <p className="text-[#C75C5C]">
              Failed to load analytics overview.
            </p>

            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 rounded border border-[#252525] px-4 py-2 text-sm transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
            >
              Try Again
            </button>
          </div>
        )}

        {!isLoading &&
          !isError &&
          analytics &&
          Object.keys(analytics).length === 0 && (
            <div className="rounded-lg border border-[#252525] bg-[#0D0D0F] p-12 text-center">
              <BarChart3
                size={40}
                className="mx-auto mb-4 text-[#D4AF37]"
              />

              <h2 className="text-xl font-semibold">
                No analytics available
              </h2>

              <p className="mt-2 text-sm text-[#A1A1A1]">
                Analytics data will appear here once available.
              </p>
            </div>
          )}

        {!isLoading &&
          !isError &&
          analytics &&
          entries.length > 0 && (
            <section>
              <div className="mb-5 flex items-center gap-3">
                <BarChart3 size={20} className="text-[#D4AF37]" />

                <h2 className="text-lg font-semibold">
                  Platform Metrics
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {entries.map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-lg border border-[#252525] bg-[#0D0D0F] p-6 transition hover:border-[#3A3A3A]"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#A1A1A1]">
                      {formatLabel(key)}
                    </p>

                    <p className="mt-4 break-words text-3xl font-semibold text-[#F5F3ED]">
                      {formatValue(value)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

        {!isLoading &&
          !isError &&
          analytics &&
          Object.keys(analytics).length > 0 &&
          entries.length === 0 && (
            <div className="rounded-lg border border-[#252525] bg-[#0D0D0F] p-8 text-center">
              <p className="text-sm text-[#A1A1A1]">
                Analytics data was received, but there are no
                directly displayable overview metrics yet.
              </p>
            </div>
          )}
      </div>
    </main>
  );
}