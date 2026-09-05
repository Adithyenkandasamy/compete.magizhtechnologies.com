"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

type Badge = {
  id: string;
  name?: string | null;
  description?: string | null;
  icon_url?: string | null;
  awarded_at?: string | null;
};

export default function BadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBadges() {
      try {
        setLoading(true);
        setError("");

        const response = await apiClient.get<Badge[]>(
          "/me/badges",
        );

        setBadges(response.data);
      } catch (err) {
        console.error(err);
        setError("Unable to load badges.");
      } finally {
        setLoading(false);
      }
    }

    loadBadges();
  }, []);

  return (
    <main className="magizh-container py-12">
      <div className="mb-10">
        <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.25em]">
          ACHIEVEMENTS
        </p>

        <h1 className="magizh-heading mt-3 text-4xl font-bold md:text-5xl">
          My Badges
        </h1>

        <p className="magizh-muted mt-3 max-w-2xl">
          View the badges you have earned through your
          participation and achievements.
        </p>
      </div>

      {loading && (
        <div className="magizh-card p-6">
          <p className="magizh-muted">Loading badges...</p>
        </div>
      )}

      {error && (
        <div className="magizh-card border-[#C75C5C] p-6">
          <p className="text-[#C75C5C]">{error}</p>
        </div>
      )}

      {!loading && !error && badges.length === 0 && (
        <div className="magizh-card p-8 text-center">
          <p className="magizh-gold text-xs font-semibold uppercase tracking-widest">
            BADGES
          </p>

          <h2 className="magizh-heading mt-3 text-2xl font-bold">
            No badges yet
          </h2>

          <p className="magizh-muted mx-auto mt-3 max-w-md">
            Your earned badges will appear here as you
            participate and achieve milestones.
          </p>
        </div>
      )}

      {!loading && !error && badges.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className="magizh-card p-6 transition hover:border-[#D4AF37]"
            >
              <div className="flex h-16 w-16 items-center justify-center border border-[#D4AF37] text-2xl">
                {badge.icon_url ? (
                  <img
                    src={badge.icon_url}
                    alt={badge.name || "Badge"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  "★"
                )}
              </div>

              <p className="magizh-gold mt-6 text-xs font-semibold uppercase tracking-widest">
                BADGE
              </p>

              <h2 className="magizh-heading mt-2 text-2xl font-bold">
                {badge.name || "Achievement Badge"}
              </h2>

              {badge.description && (
                <p className="magizh-muted mt-3 leading-7">
                  {badge.description}
                </p>
              )}

              {badge.awarded_at && (
                <p className="magizh-muted mt-5 text-xs">
                  Earned on{" "}
                  {new Date(
                    badge.awarded_at,
                  ).toLocaleDateString()}
                </p>
              )}

              <p className="magizh-muted mt-3 text-xs">
                Badge ID: {badge.id}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}