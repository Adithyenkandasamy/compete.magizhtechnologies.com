"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/providers/auth-provider";
import { PageLoader } from "@/components/loading";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") {
      let redirect = "/dashboard";

      if (typeof window !== "undefined") {
        redirect = window.location.pathname;
      }

      router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <main className="magizh-container py-20">
        <PageLoader label="loading dashboard" />
      </main>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return <>{children}</>;
}