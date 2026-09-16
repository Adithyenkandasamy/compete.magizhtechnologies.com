"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CompleteProfileRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/onboarding/profile");
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-[#A1A1A1] text-xs font-mono">
      Redirecting to profile onboarding...
    </div>
  );
}

