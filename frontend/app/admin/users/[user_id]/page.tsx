"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Save,
  Shield,
  Trash2,
  UserRound,
} from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import { PageLoader } from "@/components/loading";
import {
  deleteAdminUser,
  getAdminUser,
  updateAdminUserRole,
  updateAdminUserStatus,
} from "@/lib/admin-users-api";

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const userId = params.user_id as string;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePermanently, setDeletePermanently] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: () => getAdminUser(userId),
    enabled: Boolean(userId),
  });

  const deleteMutation = useMutation({
    mutationFn: (hard: boolean) => deleteAdminUser(userId, hard),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-users"],
      });
      router.replace("/admin/users");
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.detail || "Failed to delete user.";
      setDeleteError(msg);
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) =>
      updateAdminUserStatus(userId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-user", userId],
      });

      queryClient.invalidateQueries({
        queryKey: ["admin-users"],
      });
    },
  });

  const roleMutation = useMutation({
    mutationFn: (role: string) =>
      updateAdminUserRole(userId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-user", userId],
      });

      queryClient.invalidateQueries({
        queryKey: ["admin-users"],
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

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black text-[#F5F3ED]">
        <PageLoader label="Loading user..." />
      </main>
    );
  }

  if (isError || !user) {
    return (
      <main className="min-h-screen bg-black text-[#F5F3ED]">
        <div className="magizh-container py-14">
          <div className="rounded-lg border border-[#C75C5C]/40 bg-[#0D0D0F] p-8 text-center">
            <p className="text-[#C75C5C]">
              Failed to load user details.
            </p>

            <Link
              href="/admin/users"
              className="mt-5 inline-flex items-center gap-2 rounded border border-[#252525] px-4 py-2 text-sm hover:border-[#D4AF37] hover:text-[#D4AF37]"
            >
              <ArrowLeft size={16} />
              Back to Users
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isBusy =
    statusMutation.isPending || roleMutation.isPending;

  return (
    <main className="min-h-screen bg-black text-[#F5F3ED]">
      <div className="magizh-container py-10 md:py-14">
        <BackButton label="Back" href="/admin/users" className="mb-6" />

        {/* Header */}
        <div className="mb-10 border-b border-[#252525] pb-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
            Admin / Users
          </p>

          <h1 className="magizh-heading text-4xl font-bold md:text-5xl">
            User Details
          </h1>

          <p className="mt-3 font-mono text-xs text-[#A1A1A1]">
            {user.id}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* User information */}
          <section className="lg:col-span-2">
            <div className="rounded-lg border border-[#252525] bg-[#0D0D0F]">
              <div className="flex items-center gap-3 border-b border-[#252525] px-6 py-5">
                <UserRound size={20} className="text-[#D4AF37]" />

                <h2 className="text-lg font-semibold">
                  Account Information
                </h2>
              </div>

              <div className="grid gap-6 p-6 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.15em] text-[#A1A1A1]">
                    User ID
                  </p>

                  <p className="break-all font-mono text-sm">
                    {user.id}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.15em] text-[#A1A1A1]">
                    Email
                  </p>

                  <p className="break-all text-sm">
                    {user.email}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.15em] text-[#A1A1A1]">
                    Role
                  </p>

                  <span className="inline-flex rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-1 text-xs font-medium text-[#D4AF37]">
                    {user.role}
                  </span>
                </div>

                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.15em] text-[#A1A1A1]">
                    Status
                  </p>

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
                </div>

                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.15em] text-[#A1A1A1]">
                    Created
                  </p>

                  <p className="text-sm text-[#F5F3ED]">
                    {formatDate(user.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Controls */}
          <aside>
            <div className="rounded-lg border border-[#252525] bg-[#0D0D0F]">
              <div className="flex items-center gap-3 border-b border-[#252525] px-6 py-5">
                <Shield size={20} className="text-[#D4AF37]" />

                <h2 className="text-lg font-semibold">
                  Manage User
                </h2>
              </div>

              <div className="space-y-6 p-6">
                {/* Status */}
                <div>
                  <label
                    htmlFor="status"
                    className="mb-2 block text-xs uppercase tracking-[0.15em] text-[#A1A1A1]"
                  >
                    Account Status
                  </label>

                  <select
                    id="status"
                    value={user.status}
                    onChange={(event) =>
                      statusMutation.mutate(event.target.value)
                    }
                    disabled={isBusy}
                    className="w-full rounded border border-[#252525] bg-black px-3 py-3 text-sm text-[#F5F3ED] outline-none transition focus:border-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="DELETED">DELETED</option>
                  </select>
                </div>

                {/* Role */}
                <div>
                  <label
                    htmlFor="role"
                    className="mb-2 block text-xs uppercase tracking-[0.15em] text-[#A1A1A1]"
                  >
                    Role
                  </label>

                  <select
                    id="role"
                    value={user.role}
                    onChange={(event) =>
                      roleMutation.mutate(event.target.value)
                    }
                    disabled={isBusy}
                    className="w-full rounded border border-[#252525] bg-black px-3 py-3 text-sm text-[#F5F3ED] outline-none transition focus:border-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="STUDENT">STUDENT</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="SUPER_ADMIN">
                      SUPER_ADMIN
                    </option>
                  </select>
                </div>

                {isBusy && (
                  <div className="flex items-center gap-2 text-sm text-[#A1A1A1]">
                    <RefreshCw size={14} className="animate-spin text-[#D4AF37]" />
                    Updating...
                  </div>
                )}

                {statusMutation.isError && (
                  <p className="text-sm text-[#C75C5C]">
                    Failed to update user status.
                  </p>
                )}

                {roleMutation.isError && (
                  <p className="text-sm text-[#C75C5C]">
                    Failed to update user role.
                  </p>
                )}

                {(statusMutation.isSuccess ||
                  roleMutation.isSuccess) && (
                  <div className="flex items-center gap-2 text-sm text-[#6FAF7B]">
                    <Save size={16} />
                    User updated successfully.
                  </div>
                )}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="mt-6 rounded-lg border border-[#C75C5C]/30 bg-[#160B0B]/40 p-6">
              <div className="flex items-center gap-2 text-[#C75C5C]">
                <AlertTriangle size={18} />
                <h3 className="text-sm font-semibold uppercase tracking-wider">
                  Danger Zone
                </h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#A1A1A1]">
                Remove this user account from the platform. You can either deactivate the account (safe soft delete) or permanently purge all database records.
              </p>
              <button
                type="button"
                onClick={() => {
                  setDeleteError(null);
                  setDeletePermanently(false);
                  setShowDeleteModal(true);
                }}
                disabled={isBusy}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded border border-[#C75C5C]/50 bg-[#C75C5C]/10 px-4 py-2.5 text-sm font-medium text-[#C75C5C] transition hover:bg-[#C75C5C] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={16} />
                Delete User
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Delete User Modal */}
      {showDeleteModal && (
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
                  You are about to delete the user:
                </p>
                <p className="mt-1 break-all font-mono text-sm font-semibold text-[#F5F3ED]">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Mode selection */}
            <div className="mt-6 space-y-3 rounded-lg border border-[#252525] bg-black/60 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="deleteMode"
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
                  name="deleteMode"
                  checked={deletePermanently}
                  onChange={() => setDeletePermanently(true)}
                  className="mt-1 accent-[#C75C5C]"
                />
                <div>
                  <p className="text-sm font-medium text-[#C75C5C]">
                    Permanent Purge (Hard Delete)
                  </p>
                  <p className="mt-0.5 text-xs text-[#888]">
                    Permanently removes user and associated data from the database. This action cannot be undone!
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
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteMutation.isPending}
                className="rounded border border-[#252525] px-4 py-2 text-sm text-[#A1A1A1] transition hover:border-[#555] hover:text-[#F5F3ED] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deletePermanently)}
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