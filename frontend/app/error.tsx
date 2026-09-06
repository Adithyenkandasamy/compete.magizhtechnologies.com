"use client";

import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

/**
 * Root error boundary.
 *
 * Loading always has an error counterpart so the app never stays stuck on a
 * loading state if a route crashes. Next 16 passes `retry` to re-render the
 * failed segment.
 */
export default function ErrorPage({ error, retry }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-5 py-20">
      <div className="w-full max-w-md rounded-lg border border-[#C75C5C]/40 bg-[#0D0D0F] p-8 text-center">
        <p className="magizh-kicker text-[10px] font-semibold uppercase tracking-[0.3em] text-[#C75C5C]">
          Something went wrong
        </p>

        <h1 className="magizh-heading mt-3 text-2xl font-bold">
          Unable to load this page
        </h1>

        <p className="magizh-muted mt-3 text-sm leading-6">
          An unexpected error occurred while rendering. You can try again.
        </p>

        <button
          type="button"
          onClick={retry}
          className="magizh-button mt-6"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}