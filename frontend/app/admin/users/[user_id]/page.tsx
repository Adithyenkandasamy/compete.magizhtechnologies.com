"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Loader2,
  Save,
  Shield,
  UserRound,
} from "lucide-react";
import {
  getAdminUser,
  updateAdminUserRole,
  updateAdminUserStatus,
} from "@/lib/admin-users-api";

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const userId = params.user_id as string;

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: () => getAdminUser(userId),
    enabled: Boolean(userId),
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
        <div className="magizh-container flex min-h-screen items-center justify-center">
          <div className="flex items-center gap-3 text-[#A1A1A1]">
            <Loader2 size={20} className="animate-spin" />
            Loading user...
          </div>
        </div>
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
        {/* Back */}
        <Link
          href="/admin/users"
          className="mb-8 inline-flex items-center gap-2 text-sm text-[#A1A1A1] transition hover:text-[#D4AF37]"
        >
          <ArrowLeft size={16} />
          Back to Users
        </Link>

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
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
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
          </aside>
        </div>
      </div>
    </main>
  );
}