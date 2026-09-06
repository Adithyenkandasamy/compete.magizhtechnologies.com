"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, CheckCircle, RefreshCw } from "lucide-react";
import {
  getAdminCertificates,
  issueCertificate,
} from "@/lib/admin-certificates-api";
import {
  EmptyState,
  ErrorState,
  LoadingButton,
  TableSkeleton,
} from "@/components/loading";

export default function AdminCertificatesPage() {
  const queryClient = useQueryClient();

  const {
    data: certificates,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-certificates"],
    queryFn: getAdminCertificates,
  });

  const issueMutation = useMutation({
    mutationFn: issueCertificate,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-certificates"],
      });
    },
  });

  const handleIssue = (certificateId: string) => {
    if (issueMutation.isPending) return;

    issueMutation.mutate(certificateId);
  };

  const formatDate = (date?: string | null) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <main className="min-h-screen bg-black text-[#F5F3ED]">
      <div className="magizh-container py-10 md:py-14">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-5 border-b border-[#252525] pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
              Admin
            </p>

            <h1 className="magizh-heading text-4xl font-bold md:text-5xl">
              Certificates
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#A1A1A1]">
              Manage generated certificates and issue certificates to
              participants.
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

        {/* Loading */}
        {isLoading && <TableSkeleton rows={6} columns={7} />}

        {/* Error */}
        {isError && !isLoading && (
          <ErrorState
            title="Failed to load certificates."
            onRetry={() => refetch()}
            retryLabel="Try Again"
          />
        )}

        {/* Empty */}
        {!isLoading &&
          !isError &&
          (!certificates || certificates.length === 0) && (
            <EmptyState
              kicker="CERTIFICATES"
              title="No certificates found"
              description="Generated certificates will appear here."
            />
          )}

        {/* Certificates */}
        {!isLoading &&
          !isError &&
          certificates &&
          certificates.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-[#252525] bg-[#0D0D0F]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#252525] text-xs uppercase tracking-[0.15em] text-[#A1A1A1]">
                      <th className="px-5 py-4 font-medium">
                        Certificate ID
                      </th>
                      <th className="px-5 py-4 font-medium">
                        User ID
                      </th>
                      <th className="px-5 py-4 font-medium">
                        Event ID
                      </th>
                      <th className="px-5 py-4 font-medium">
                        Certificate Code
                      </th>
                      <th className="px-5 py-4 font-medium">
                        Status
                      </th>
                      <th className="px-5 py-4 font-medium">
                        Issued
                      </th>
                      <th className="px-5 py-4 text-right font-medium">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {certificates.map((certificate) => {
                      const isIssued =
                        certificate.status?.toUpperCase() === "ISSUED";

                      const isIssuing =
                        issueMutation.isPending &&
                        issueMutation.variables === certificate.id;

                      return (
                        <tr
                          key={certificate.id}
                          className="border-b border-[#252525] last:border-b-0 hover:bg-[#111113]"
                        >
                          <td className="px-5 py-5">
                            <span className="font-mono text-xs text-[#F5F3ED]">
                              {certificate.id}
                            </span>
                          </td>

                          <td className="px-5 py-5">
                            <span className="font-mono text-xs text-[#A1A1A1]">
                              {certificate.user_id}
                            </span>
                          </td>

                          <td className="px-5 py-5">
                            <span className="font-mono text-xs text-[#A1A1A1]">
                              {certificate.event_id}
                            </span>
                          </td>

                          <td className="px-5 py-5">
                            <span className="font-mono text-xs text-[#D4AF37]">
                              {certificate.certificate_code || "—"}
                            </span>
                          </td>

                          <td className="px-5 py-5">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
                                isIssued
                                  ? "border-[#6FAF7B]/40 bg-[#6FAF7B]/10 text-[#6FAF7B]"
                                  : "border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]"
                              }`}
                            >
                              {certificate.status || "PENDING"}
                            </span>
                          </td>

                          <td className="px-5 py-5 text-sm text-[#A1A1A1]">
                            {formatDate(certificate.issued_at)}
                          </td>

                          <td className="px-5 py-5 text-right">
                            {isIssued ? (
                              <span className="inline-flex items-center gap-2 text-sm text-[#6FAF7B]">
                                <CheckCircle size={16} />
                                Issued
                              </span>
                            ) : (
                              <LoadingButton
                                type="button"
                                onClick={() =>
                                  handleIssue(certificate.id)
                                }
                                variant="gold"
                                size="sm"
                                loading={isIssuing}
                                loadingText="Issuing..."
                                disabled={issueMutation.isPending}
                              >
                                <Award size={15} />
                                Issue
                              </LoadingButton>
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

        {/* Mutation error */}
        {issueMutation.isError && (
          <div className="mt-5 rounded-lg border border-[#C75C5C]/40 bg-[#0D0D0F] px-5 py-4 text-sm text-[#C75C5C]">
            Failed to issue the certificate. Please try again.
          </div>
        )}

        {/* Mutation success */}
        {issueMutation.isSuccess && (
          <div className="mt-5 flex items-center gap-2 rounded-lg border border-[#6FAF7B]/40 bg-[#0D0D0F] px-5 py-4 text-sm text-[#6FAF7B]">
            <CheckCircle size={17} />
            Certificate issued successfully.
          </div>
        )}
      </div>
    </main>
  );
}