"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/providers/auth-provider";
import { getErrorMessage } from "@/lib/error-message";

export default function RegisterPage() {
  const router = useRouter();
  const { register, status } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      await register({
        full_name: fullName,
        email,
        password,
      });

      router.replace("/dashboard");
    } catch (err: any) {
      setError(
        getErrorMessage(
          err,
          "Unable to create account. Please try again.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.3em]">
            MAGIZH TECHNOLOGIES
          </p>

          <h1 className="magizh-heading mt-4 text-4xl font-bold">
            Create Account
          </h1>

          <p className="magizh-muted mt-3">
            Join the Magizh innovation community.
          </p>
        </div>

        <div className="magizh-card p-7 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-medium"
              >
                Full Name
              </label>

              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                required
                disabled={isLoading}
                className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium"
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
                disabled={isLoading}
                className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password (min. 8 characters)"
                minLength={8}
                required
                disabled={isLoading}
                className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
              />
            </div>

            {error && (
              <div className="rounded border border-[#C75C5C]/40 bg-[#C75C5C]/10 px-4 py-3">
                <p className="text-sm text-[#C75C5C]">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="magizh-button w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-7 border-t border-[#252525] pt-6 text-center">
            <p className="magizh-muted text-sm">
              Already have an account?
            </p>

            <Link
              href="/login"
              className="mt-2 inline-block text-sm font-semibold text-[#D4AF37] transition-colors hover:text-[#E5C04A]"
            >
              Sign in →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}