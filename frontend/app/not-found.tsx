import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-5 py-20">
      <div className="w-full max-w-md rounded-lg border border-[#252525] bg-[#0D0D0F] p-10 text-center">
        <p className="magizh-accent text-xs font-semibold uppercase tracking-[0.35em] text-[#D4AF37]">
          MAGIZH
        </p>

        <h1 className="magizh-heading mt-4 text-5xl font-bold">404</h1>

        <h2 className="magizh-heading mt-2 text-2xl font-bold">
          Page not found
        </h2>

        <p className="magizh-muted mx-auto mt-3 max-w-sm text-sm leading-6">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>

        <Link href="/" className="magizh-button mt-6">
          Back to Home
        </Link>
      </div>
    </main>
  );
}