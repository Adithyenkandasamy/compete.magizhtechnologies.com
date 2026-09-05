"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { getEventAnalytics } from "@/lib/admin-analytics-api";

function formatLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

export default function EventAnalyticsPage() {
  const params = useParams();
  const eventId = params.event_id as string;

  const {
    data: analytics,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-event-analytics", eventId],
    queryFn: () => getEventAnalytics(eventId),
    enabled: Boolean(eventId),
  });

  const entries = analytics
    ? Object.entries(analytics)
    : [];

  return (
    <main className="min-h-screen bg-black text-[#F5F3ED]">
      <div className="magizh-container py-10 md:py-14">
        <div className="mb-10 flex flex-col gap-5 border-b border-[#252525] pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
              Admin / Analytics / Event
            </p>

            <h1 className="magizh-heading text-4xl font-bold md:text-5xl">
              Event Analytics
            </h1>

            <p className="mt-3 text-sm text-[#A1A1A1]">
              Event ID:{" "}
              <span className="font-mono text-[#F5F3ED]">
                {eventId}
              </span>
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
              <Loader2
                size={20}
                className="animate-spin"
              />
              Loading event analytics...
            </div>
          </div>
        )}

        {isError && !isLoading && (
          <div className="rounded-lg border border-[#C75C5C]/40 bg-[#0D0D0F] p-8 text-center">
            <p className="text-[#C75C5C]">
              Failed to load event analytics.
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
          entries.length === 0 && (
            <div className="rounded-lg border border-[#252525] bg-[#0D0D0F] p-12 text-center">
              <BarChart3
                size={40}
                className="mx-auto mb-4 text-[#D4AF37]"
              />

              <h2 className="text-xl font-semibold">
                No analytics available
              </h2>

              <p className="mt-2 text-sm text-[#A1A1A1]">
                Analytics for this event will appear here
                once available.
              </p>
            </div>
          )}

        {!isLoading &&
          !isError &&
          analytics &&
          entries.length > 0 && (
            <section>
              <div className="mb-5 flex items-center gap-3">
                <BarChart3
                  size={20}
                  className="text-[#D4AF37]"
                />

                <h2 className="text-lg font-semibold">
                  Event Metrics
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {entries.map(([key, value]) => {
                  const isObject =
                    typeof value === "object" &&
                    value !== null;

                  return (
                    <div
                      key={key}
                      className={`rounded-lg border border-[#252525] bg-[#0D0D0F] p-6 ${
                        isObject
                          ? "sm:col-span-2 lg:col-span-2"
                          : ""
                      }`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#A1A1A1]">
                        {formatLabel(key)}
                      </p>

                      {isObject ? (
                        <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded border border-[#252525] bg-black p-4 font-mono text-xs leading-6 text-[#F5F3ED]">
                          {formatValue(value)}
                        </pre>
                      ) : (
                        <p className="mt-4 break-words text-3xl font-semibold">
                          {formatValue(value)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
      </div>
    </main>
  );
}