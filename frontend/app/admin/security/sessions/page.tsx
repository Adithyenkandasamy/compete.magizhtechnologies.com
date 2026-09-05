"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { getSecuritySessions } from "@/lib/admin-security-api";

export default function SecuritySessionsPage() {
  const {
    data: sessions,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-security-sessions"],
    queryFn: getSecuritySessions,
  });

  const formatDate = (date?: string | null) => {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="min-h-screen bg-black text-[#F5F3ED]">
      <div className="magizh-container py-10 md:py-14">
        <div className="mb-10 flex flex-col gap-5 border-b border-[#252525] pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
              Admin / Security
            </p>

            <h1 className="magizh-heading text-4xl font-bold md:text-5xl">
              Active Sessions
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#A1A1A1]">
              Monitor active authentication sessions across the platform.
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
              Loading sessions...
            </div>
          </div>
        )}

        {isError && !isLoading && (
          <div className="rounded-lg border border-[#C75C5C]/40 bg-[#0D0D0F] p-8 text-center">
            <p className="text-[#C75C5C]">
              Failed to load security sessions.
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
          (!sessions || sessions.length === 0) && (
            <div className="rounded-lg border border-[#252525] bg-[#0D0D0F] p-12 text-center">
              <ShieldCheck
                size={40}
                className="mx-auto mb-4 text-[#D4AF37]"
              />

              <h2 className="text-xl font-semibold">
                No active sessions
              </h2>

              <p className="mt-2 text-sm text-[#A1A1A1]">
                Active user sessions will appear here.
              </p>
            </div>
          )}

        {!isLoading &&
          !isError &&
          sessions &&
          sessions.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-[#252525] bg-[#0D0D0F]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#252525] text-xs uppercase tracking-[0.15em] text-[#A1A1A1]">
                      <th className="px-5 py-4 font-medium">
                        Session ID
                      </th>

                      <th className="px-5 py-4 font-medium">
                        User ID
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Email
                      </th>

                      <th className="px-5 py-4 font-medium">
                        IP Address
                      </th>

                      <th className="px-5 py-4 font-medium">
                        User Agent
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Created
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Expires
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {sessions.map((session) => (
                      <tr
                        key={session.id}
                        className="border-b border-[#252525] last:border-b-0 hover:bg-[#111113]"
                      >
                        <td className="px-5 py-5">
                          <span className="font-mono text-xs">
                            {session.id}
                          </span>
                        </td>

                        <td className="px-5 py-5">
                          <span className="break-all font-mono text-xs">
                            {session.user_id || "—"}
                          </span>
                        </td>

                        <td className="px-5 py-5 text-sm">
                          {session.email || "—"}
                        </td>

                        <td className="px-5 py-5 font-mono text-xs text-[#A1A1A1]">
                          {session.ip_address || "—"}
                        </td>

                        <td className="max-w-xs px-5 py-5">
                          <p className="truncate text-xs text-[#A1A1A1]">
                            {session.user_agent || "—"}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-5 py-5 text-sm text-[#A1A1A1]">
                          <span className="inline-flex items-center gap-2">
                            <Clock size={14} />
                            {formatDate(session.created_at)}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-5 text-sm text-[#A1A1A1]">
                          {formatDate(session.expires_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
      </div>
    </main>
  );
}