import { PageLoader } from "@/components/loading/PageLoader";

/**
 * Global Suspense fallback shown while route content streams in.
 *
 * Renders a lightweight Magizh loader and disappears naturally once the
 * route segment finishes loading.
 */
export default function Loading() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-5 py-20">
      <PageLoader />
    </main>
  );
}