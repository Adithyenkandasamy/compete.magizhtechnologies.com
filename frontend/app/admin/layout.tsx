"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/providers/auth-provider";
import { PageLoader } from "@/components/loading";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { status, user } = useAuth();

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

  return <>{children}</>;
}
