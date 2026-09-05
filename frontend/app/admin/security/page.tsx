"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  getSecurityAlerts,
  resolveSecurityAlert,
} from "@/lib/admin-security-api";

export default function AdminSecurityPage() {
  const queryClient = useQueryClient();

  const {
    data: alerts,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-security-alerts"],
    queryFn: getSecurityAlerts,
  });

  const resolveMutation = useMutation({
    mutationFn: (alertId: string) => resolveSecurityAlert(alertId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-security-alerts"],
      });
    },
  });

  const formatDate = (date?: string) => {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSeverityClass = (severity?: string | null) => {
    switch (severity?.toUpperCase()) {
      case "HIGH":
      case "CRITICAL":
        return "border-[#C75C5C]/40 bg-[#C75C5C]/10 text-[#C75C5C]";

      case "MEDIUM":
        return "border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]";

      default:
        return "border-[#6FAF7B]/40 bg-[#6FAF7B]/10 text-[#6FAF7B]";
    }
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
              Security Alerts
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#A1A1A1]">
              Monitor and resolve security alerts across the platform.
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
              Loading security alerts...
            </div>
          </div>
        )}

        {isError && !isLoading && (
          <div className="rounded-lg border border-[#C75C5C]/40 bg-[#0D0D0F] p-8 text-center">
            <AlertTriangle
              size={40}
              className="mx-auto mb-4 text-[#C75C5C]"
            />

            <p className="text-[#C75C5C]">
              Failed to load security alerts.
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
          (!alerts || alerts.length === 0) && (
            <div className="rounded-lg border border-[#252525] bg-[#0D0D0F] p-12 text-center">
              <CheckCircle
                size={40}
                className="mx-auto mb-4 text-[#6FAF7B]"
              />

              <h2 className="text-xl font-semibold">
                No security alerts
              </h2>

              <p className="mt-2 text-sm text-[#A1A1A1]">
                There are currently no security alerts to review.
              </p>
            </div>
          )}

        {!isLoading &&
          !isError &&
          alerts &&
          alerts.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-[#252525] bg-[#0D0D0F]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#252525] text-xs uppercase tracking-[0.15em] text-[#A1A1A1]">
                      <th className="px-5 py-4 font-medium">
                        Alert ID
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Type
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Severity
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Message
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Status
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Created
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {alerts.map((alert) => {
                      const isResolved =
                        alert.status?.toUpperCase() === "RESOLVED";

                      const isResolving =
                        resolveMutation.isPending &&
                        resolveMutation.variables === alert.id;

                      return (
                        <tr
                          key={alert.id}
                          className="border-b border-[#252525] last:border-b-0 hover:bg-[#111113]"
                        >
                          <td className="px-5 py-5">
                            <span className="font-mono text-xs">
                              {alert.id}
                            </span>
                          </td>

                          <td className="px-5 py-5 text-sm">
                            {alert.type || "—"}
                          </td>

                          <td className="px-5 py-5">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getSeverityClass(
                                alert.severity,
                              )}`}
                            >
                              {alert.severity || "UNKNOWN"}
                            </span>
                          </td>

                          <td className="max-w-md px-5 py-5 text-sm">
                            {alert.message || "—"}
                          </td>

                          <td className="px-5 py-5">
                            <span className="text-xs text-[#A1A1A1]">
                              {alert.status || "—"}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-5 py-5 text-sm text-[#A1A1A1]">
                            {formatDate(alert.created_at)}
                          </td>

                          <td className="px-5 py-5">
                            {isResolved ? (
                              <span className="inline-flex items-center gap-2 text-xs text-[#6FAF7B]">
                                <CheckCircle size={15} />
                                Resolved
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  resolveMutation.mutate(alert.id)
                                }
                                disabled={resolveMutation.isPending}
                                className="inline-flex items-center gap-2 rounded border border-[#252525] px-3 py-2 text-xs transition hover:border-[#6FAF7B] hover:text-[#6FAF7B] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isResolving ? (
                                  <Loader2
                                    size={14}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <CheckCircle size={14} />
                                )}
                                Resolve
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
      </div>
    </main>
  );
}