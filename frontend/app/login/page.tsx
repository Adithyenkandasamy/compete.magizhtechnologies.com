"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

import { useAuth } from "@/providers/auth-provider";
import { getMyProfile, isProfileComplete } from "@/lib/profile-api";
import { getErrorMessage } from "@/lib/error-message";
import { LoadingButton } from "@/components/loading";
import type { User } from "@/types/auth";

export default function LoginPage() {
  const router = useRouter();
  const { login, status, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function checkAndRedirect(loggedUser: User) {
    const isAdmin = loggedUser.role === "ADMIN" || loggedUser.role === "SUPER_ADMIN";
    if (isAdmin) {
      router.replace("/admin");
      return;
    }

    try {
      const profile = await getMyProfile();
      if (!isProfileComplete(profile)) {
        const redirectParam = new URLSearchParams(window.location.search).get("redirect");
        router.replace(
          `/onboarding/profile${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ""}`,
        );
        return;
      }
    } catch {
      // If fetching fails, let user proceed to dashboard
    }

    const redirectParam = new URLSearchParams(window.location.search).get("redirect");
    if (redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")) {
      router.replace(redirectParam);
    } else {
      router.replace("/dashboard");
    }
  }

  useEffect(() => {
    if (status === "authenticated" && user) {
      checkAndRedirect(user);
    }
  }, [status, user]);

  const loginMutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: (loggedUser) => {
      checkAndRedirect(loggedUser);
    },
    onError: (err) => {
      setError(
        getErrorMessage(
          err,
          "Unable to login. Please check your email and password.",
        ),
      );
    },
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    loginMutation.mutate();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-16 bg-black text-[#F5F3ED]">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
            MAGIZH TECHNOLOGIES
          </p>

          <h1 className="magizh-heading mt-4 text-4xl font-bold">
            Welcome Back
          </h1>

          <p className="mt-3 text-sm text-[#A1A1A1]">
            Sign in to continue your innovation journey.
          </p>
        </div>

        <div className="rounded-xl border border-[#252525] bg-[#0A0A0A] p-7 md:p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#A1A1A1]"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loginMutation.isPending}
                className="w-full rounded border border-[#252525] bg-[#000000] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#A1A1A1]"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loginMutation.isPending}
                className="w-full rounded border border-[#252525] bg-[#000000] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
              />
            </div>

            {error && (
              <div className="rounded border border-[#C75C5C]/40 bg-[#C75C5C]/10 px-4 py-3">
                <p className="text-xs text-[#C75C5C]">{error}</p>
              </div>
            )}

            <LoadingButton
              type="submit"
              loading={loginMutation.isPending}
              loadingText="Signing in..."
              className="w-full py-3.5 text-xs font-bold uppercase tracking-[0.18em]"
            >
              Sign In
            </LoadingButton>
          </form>

          <div className="mt-7 border-t border-[#252525] pt-6 text-center">
            <p className="text-xs text-[#A1A1A1]">
              Don&apos;t have an account?
            </p>

            <Link
              href="/register"
              className="mt-2 inline-block text-xs font-semibold uppercase tracking-wider text-[#D4AF37] transition hover:text-[#E5C04A]"
            >
              Create an account →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}