"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw, Users } from "lucide-react";
import { getAdminUsers } from "@/lib/admin-users-api";

export default function AdminUsersPage() {
  const {
    data: users,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-users"],
    queryFn: getAdminUsers,
  });

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
              View and manage registered users on the MAGIZH
              platform.
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
        {isLoading && (
          <div className="flex min-h-60 items-center justify-center">
            <div className="flex items-center gap-3 text-[#A1A1A1]">
              <Loader2 size={20} className="animate-spin" />
              Loading users...
            </div>
          </div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <div className="rounded-lg border border-[#C75C5C]/40 bg-[#0D0D0F] p-8 text-center">
            <p className="text-[#C75C5C]">
              Failed to load users.
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

        {/* Empty */}
        {!isLoading &&
          !isError &&
          (!users || users.length === 0) && (
            <div className="rounded-lg border border-[#252525] bg-[#0D0D0F] p-12 text-center">
              <Users
                size={40}
                className="mx-auto mb-4 text-[#D4AF37]"
              />

              <h2 className="text-xl font-semibold">
                No users found
              </h2>

              <p className="mt-2 text-sm text-[#A1A1A1]">
                Registered users will appear here.
              </p>
            </div>
          )}

        {/* Users Table */}
        {!isLoading &&
          !isError &&
          users &&
          users.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-[#252525] bg-[#0D0D0F]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#252525] text-xs uppercase tracking-[0.15em] text-[#A1A1A1]">
                      <th className="px-5 py-4 font-medium">
                        User ID
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Email
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Role
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Status
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Created
                      </th>

                      <th className="px-5 py-4 text-right font-medium">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-[#252525] last:border-b-0 hover:bg-[#111113]"
                      >
                        <td className="px-5 py-5">
                          <span className="font-mono text-xs text-[#F5F3ED]">
                            {user.id}
                          </span>
                        </td>

                        <td className="px-5 py-5">
                          <span className="text-sm text-[#F5F3ED]">
                            {user.email}
                          </span>
                        </td>

                        <td className="px-5 py-5">
                          <span className="inline-flex rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-1 text-xs font-medium text-[#D4AF37]">
                            {user.role}
                          </span>
                        </td>

                        <td className="px-5 py-5">
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

                        <td className="px-5 py-5 text-sm text-[#A1A1A1]">
                          {formatDate(user.created_at)}
                        </td>

                        <td className="px-5 py-5 text-right">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="inline-flex items-center rounded border border-[#252525] px-4 py-2 text-sm transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
                          >
                            View
                          </Link>
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