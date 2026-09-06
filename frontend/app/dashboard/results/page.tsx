"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getMyRegistrations } from "@/lib/registrations-api";
import { getEvent } from "@/lib/events-api";
import { getEventResults, type EventResult } from "@/lib/results-api";

type EventWithResults = {
  eventId: string;
  title: string;
  results: EventResult[];
};

export default function ResultsPage() {
  const [eventResults, setEventResults] = useState<EventWithResults[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadResults() {
      try {
        setLoading(true);
        setError("");

        const registrations = await getMyRegistrations();

        const uniqueEventIds = Array.from(
          new Set(
            registrations.map(
              (registration) => registration.event_id,
            ),
          ),
        );

        const results: EventWithResults[] = [];

        for (const eventId of uniqueEventIds) {
          try {
            const [event, eventResults] = await Promise.all([
              getEvent(eventId),
              getEventResults(eventId),
            ]);

            results.push({
              eventId,
              title: event.title,
              results: eventResults,
            });
          } catch {
            // Ignore events whose results are unavailable.
          }
        }

        setEventResults(results);
      } catch (err) {
        console.error(err);
        setError("Unable to load results.");
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, []);

  function getRank(result: EventResult) {
    return result.rank ?? result.position ?? "-";
  }

  function getProjectName(result: EventResult) {
    return result.project_name || result.project_id || "Project";
  }

  function getTeamName(result: EventResult) {
    return result.team_name || result.team_id || "Team";
  }

  return (
    <main className="magizh-container py-12">
      <div className="mb-10">
        <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.25em]">
          COMPETITION RESULTS
        </p>

        <h1 className="magizh-heading mt-3 text-4xl font-bold md:text-5xl">
          Results
        </h1>

        <p className="magizh-muted mt-3 max-w-2xl">
          View published results and leaderboards from the
          events you participated in.
        </p>
      </div>

      {loading && (
        <div className="magizh-card p-6">
          <p className="magizh-muted">Loading results...</p>
        </div>
      )}

      {error && (
        <div className="magizh-card border-[#C75C5C] p-6">
          <p className="text-[#C75C5C]">{error}</p>
        </div>
      )}

      {!loading && !error && eventResults.length === 0 && (
        <div className="magizh-card p-8 text-center">
          <p className="magizh-gold text-xs font-semibold uppercase tracking-widest">
            RESULTS
          </p>

          <h2 className="magizh-heading mt-3 text-2xl font-bold">
            No published results yet
          </h2>

          <p className="magizh-muted mx-auto mt-3 max-w-md">
            Results will appear here once the event results
            are published by Magizh Technologies.
          </p>

          <Link href="/events" className="magizh-button mt-6">
            Explore Events
          </Link>
        </div>
      )}

      {!loading && !error && eventResults.length > 0 && (
        <div className="space-y-8">
          {eventResults.map((event) => (
            <section
              key={event.eventId}
              className="magizh-card overflow-hidden"
            >
              <div className="border-b border-[#252525] p-6">
                <p className="magizh-gold text-xs font-semibold uppercase tracking-widest">
                  EVENT RESULT
                </p>

                <h2 className="magizh-heading mt-2 text-2xl font-bold">
                  {event.title}
                </h2>
              </div>

              {event.results.length === 0 ? (
                <div className="p-6">
                  <p className="magizh-muted">
                    No result entries available yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px]">
                    <thead>
                      <tr className="border-b border-[#252525] text-left">
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest">
                          Rank
                        </th>

                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest">
                          Project
                        </th>

                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest">
                          Team
                        </th>

                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest">
                          Score
                        </th>

                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest">
                          Result
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {event.results.map((result, index) => (
                        <tr
                          key={
                            result.id ||
                            result.project_id ||
                            result.team_id ||
                            index
                          }
                          className="border-b border-[#252525] last:border-b-0"
                        >
                          <td className="px-6 py-5">
                            <span className="magizh-gold font-semibold">
                              {getRank(result)}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <p className="font-semibold">
                              {getProjectName(result)}
                            </p>
                          </td>

                          <td className="px-6 py-5">
                            <p className="magizh-muted">
                              {getTeamName(result)}
                            </p>
                          </td>

                          <td className="px-6 py-5">
                            {result.score !== undefined
                              ? result.score
                              : "-"}
                          </td>

                          <td className="px-6 py-5">
                            <span className="text-sm font-semibold">
                              {result.result ||
                                result.prize ||
                                result.status ||
                                "-"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}