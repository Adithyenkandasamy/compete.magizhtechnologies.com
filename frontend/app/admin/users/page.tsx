"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, RefreshCw, Trash2, Users } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import { PageLoader } from "@/components/loading";
import { deleteAdminUser, getAdminUsers } from "@/lib/admin-users-api";
import type { User } from "@/types/auth";

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deletePermanently, setDeletePermanently] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const PAGE_SIZE = 20;

  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["admin-users", page],
    queryFn: () => getAdminUsers(page, PAGE_SIZE),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ userId, hard }: { userId: string; hard: boolean }) =>
      deleteAdminUser(userId, hard),
    onSuccess: () => {
      setUserToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || "Failed to delete user.";
      setDeleteError(msg);
    },
  });

  const users = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <main className="min-h-screen bg-black text-[#F5F3ED]">
      <div className="magizh-container py-10 md:py-14">
        <BackButton label="Back" href="/admin" className="mb-6" />

        {/* Header */}
        <div className="mb-10 flex flex-col gap-5 border-b border-[#252525] pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
              Admin
            </p>
            <h1 className="magizh-heading text-4xl font-bold md:text-5xl">
              Users
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#A1A1A1]">
              View and manage registered users on the MAGIZH platform.
              {!isLoading && total > 0 && (
                <span className="ml-2 text-[#D4AF37]">
                  {total.toLocaleString()} total
                </span>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center justify-center gap-2 rounded border border-[#252525] px-4 py-2.5 text-sm transition hover:border-[#D4AF37] hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Loading */}
        {isLoading && <PageLoader variant="section" label="Loading users..." />}

        {/* Error */}
        {isError && !isLoading && (
          <div className="rounded-lg border border-[#C75C5C]/40 bg-[#0D0D0F] p-8 text-center">
            <p className="text-[#C75C5C]">Failed to load users.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 rounded border border-[#252525] px-4 py-2 text-sm transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && users.length === 0 && (
          <div className="rounded-lg border border-[#252525] bg-[#0D0D0F] p-12 text-center">
            <Users size={40} className="mx-auto mb-4 text-[#D4AF37]" />
            <h2 className="text-xl font-semibold">No users found</h2>
            <p className="mt-2 text-sm text-[#A1A1A1]">
              Registered users will appear here.
            </p>
          </div>
        )}

        {/* Users Table */}
        {!isLoading && !isError && users.length > 0 && (
          <>
            <div className="overflow-hidden rounded-lg border border-[#252525] bg-[#0D0D0F]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#252525] text-xs uppercase tracking-[0.15em] text-[#A1A1A1]">
                      <th className="px-5 py-4 font-medium">Name</th>
                      <th className="px-5 py-4 font-medium">Email</th>
                      <th className="px-5 py-4 font-medium">Role</th>
                      <th className="px-5 py-4 font-medium">Status</th>
                      <th className="px-5 py-4 font-medium">Joined</th>
                      <th className="px-5 py-4 text-right font-medium">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-[#252525] last:border-b-0 hover:bg-[#111113] transition-colors"
                      >
                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-[#F5F3ED]">
                            {(user as any).profile?.full_name ?? "—"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-mono text-xs text-[#A1A1A1]">
                            {user.email}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-1 text-xs font-medium text-[#D4AF37]">
                            {user.role}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
                              user.status === "ACTIVE"
                                ? "border-[#6FAF7B]/40 bg-[#6FAF7B]/10 text-[#6FAF7B]"
                                : user.status === "SUSPENDED"
                                  ? "border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]"
                                  : "border-[#C75C5C]/40 bg-[#C75C5C]/10 text-[#C75C5C]"
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-[#A1A1A1]">
                          {formatDate(user.created_at)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/users/${user.id}`}
                              className="inline-flex items-center rounded border border-[#252525] px-3 py-1.5 text-xs transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
                            >
                              View
                            </Link>
                            <button
                              type="button"
                              title="Delete user"
                              onClick={() => {
                                setDeleteError(null);
                                setDeletePermanently(false);
                                setUserToDelete(user);
                              }}
                              className="inline-flex items-center rounded border border-[#252525] p-1.5 text-xs text-[#A1A1A1] transition hover:border-[#C75C5C] hover:bg-[#C75C5C]/10 hover:text-[#C75C5C]"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-xs text-[#555]">
                  Page {page} of {pages} &mdash; {total} users
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || isFetching}
                    className="flex h-9 w-9 items-center justify-center rounded border border-[#252525] text-[#A1A1A1] transition hover:border-[#D4AF37] hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={15} />
                  </button>

                  {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                    const p = i + 1;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        disabled={isFetching}
                        className={`flex h-9 w-9 items-center justify-center rounded border text-sm transition disabled:opacity-50 ${
                          p === page
                            ? "border-[#D4AF37] text-[#D4AF37]"
                            : "border-[#252525] text-[#A1A1A1] hover:border-[#D4AF37] hover:text-[#D4AF37]"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page >= pages || isFetching}
                    className="flex h-9 w-9 items-center justify-center rounded border border-[#252525] text-[#A1A1A1] transition hover:border-[#D4AF37] hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete User Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-[#333] bg-[#0D0D0F] p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#C75C5C]/40 bg-[#C75C5C]/10 text-[#C75C5C]">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#F5F3ED]">
                  Delete User Account
                </h3>
                <p className="mt-1 text-xs text-[#A1A1A1]">
                  You are about to delete user:
                </p>
                <p className="mt-1 break-all font-mono text-sm font-semibold text-[#F5F3ED]">
                  {userToDelete.email}
                </p>
              </div>
            </div>

            {/* Mode selection */}
            <div className="mt-6 space-y-3 rounded-lg border border-[#252525] bg-black/60 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="deleteModeList"
                  checked={!deletePermanently}
                  onChange={() => setDeletePermanently(false)}
                  className="mt-1 accent-[#D4AF37]"
                />
                <div>
                  <p className="text-sm font-medium text-[#F5F3ED]">
                    Deactivate (Soft Delete)
                  </p>
                  <p className="mt-0.5 text-xs text-[#888]">
                    Sets status to DELETED and revokes active sessions. Historic registrations, projects, and certificates are safely preserved.
                  </p>
                </div>
              </label>

              <div className="border-t border-[#252525] my-2" />

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="deleteModeList"
                  checked={deletePermanently}
                  onChange={() => setDeletePermanently(true)}
                  className="mt-1 accent-[#C75C5C]"
                />
                <div>
                  <p className="text-sm font-medium text-[#C75C5C]">
                    Permanent Purge (Hard Delete)
                  </p>
                  <p className="mt-0.5 text-xs text-[#888]">
                    Permanently removes user and associated records from the database. Cannot be undone!
                  </p>
                </div>
              </label>
            </div>

            {deleteError && (
              <div className="mt-4 rounded border border-[#C75C5C]/40 bg-[#C75C5C]/10 p-3 text-xs text-[#C75C5C]">
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={deleteMutation.isPending}
                className="rounded border border-[#252525] px-4 py-2 text-sm text-[#A1A1A1] transition hover:border-[#555] hover:text-[#F5F3ED] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  deleteMutation.mutate({
                    userId: userToDelete.id,
                    hard: deletePermanently,
                  })
                }
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-2 rounded border border-[#C75C5C] bg-[#C75C5C] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#b04a4a] disabled:opacity-50"
              >
                {deleteMutation.isPending && (
                  <RefreshCw size={14} className="animate-spin" />
                )}
                {deleteMutation.isPending
                  ? "Deleting..."
                  : deletePermanently
                    ? "Permanently Delete"
                    : "Deactivate User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}