"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { getMyProfile, isProfileComplete } from "@/lib/profile-api";

interface ProfileCompletionGuardProps {
  children: ReactNode;
}

export function ProfileCompletionGuard({ children }: ProfileCompletionGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, status } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // If not authenticated, let auth guard handle it
    if (status !== "authenticated" || !user) {
      setChecking(false);
      return;
    }

    // Admins don't need student profile onboarding
    if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
      setChecking(false);
      return;
    }

    // Allow onboarding page itself without recursive loop
    if (pathname.startsWith("/onboarding") || pathname.startsWith("/login") || pathname.startsWith("/register")) {
      setChecking(false);
      return;
    }

    let isMounted = true;
    getMyProfile()
      .then((profile) => {
        if (!isMounted) return;
        if (!isProfileComplete(profile)) {
          router.replace(`/onboarding/profile?redirect=${encodeURIComponent(pathname)}`);
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        if (isMounted) setChecking(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user, status, pathname, router]);

  if (checking) {
    return null; // Silent check, no dramatic loader
  }

  return <>{children}</>;
}
