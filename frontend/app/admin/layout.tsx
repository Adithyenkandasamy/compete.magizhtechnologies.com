"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Shield } from "lucide-react";

import { useAuth } from "@/providers/auth-provider";
import { PageLoader } from "@/components/loading";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { status, user, logout } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") {
      let redirect = "/admin";

      if (typeof window !== "undefined") {
        redirect = window.location.pathname;
      }

      router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }

    if (status === "authenticated" && user?.role) {
      const isAdmin =
        user.role === "ADMIN" || user.role === "SUPER_ADMIN";

      if (!isAdmin) {
        router.replace("/dashboard");
      }
    }
  }, [status, user, router]);

  if (status === "loading") {
    return (
      <main className="magizh-container py-20">
        <PageLoader label="loading admin" />
      </main>
    );
  }

  if (status !== "authenticated" || !user) {
    return null;
  }

  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  if (!isAdmin) {
    return null;
  }

  async function handleSignOut() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-black text-[#F5F3ED]">
      <header className="sticky top-0 z-50 border-b border-[#252525] bg-[#0A0A0C]/90 backdrop-blur">
        <div className="magizh-container flex items-center justify-between py-3">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#D4AF37] transition hover:text-[#E5C04A]"
          >
            <Shield size={18} strokeWidth={1.5} />
            Admin Panel
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="hidden text-xs font-semibold uppercase tracking-wider text-[#A1A1A1] transition hover:text-[#F5F3ED] sm:inline"
            >
              Student Dashboard
            </Link>

            <span className="hidden text-xs text-[#555] sm:inline">
              {user.email}
            </span>

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded border border-[#252525] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#A1A1A1] transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
