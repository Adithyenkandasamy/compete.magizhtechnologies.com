"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Award,
  Medal,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Radio,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { getEventResults, type ResultsResponse, type EventResult } from "@/lib/results-api";
import { useEvent } from "@/hooks/use-events";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { HackerSnakeLoader } from "@/components/loading";

interface PageProps {
  params: Promise<{ event_id: string }>;
}

export default function EventResultsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.event_id;

  const { data: event } = useEvent(eventId);

  const {
    data: results,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["event-results", eventId],
    queryFn: () => getEventResults(eventId),
    retry: false,
    enabled: Boolean(eventId),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <HackerSnakeLoader size="lg" message="FETCHING PUBLISHED LEADERBOARD..." />
        </main>
        <Footer />
      </div>
    );
  }

  // Unpublished state
  if (isError || !results || !results.is_published) {
    return (
      <div className="min-h-screen bg-black text-[#F5F3ED] flex flex-col">
        <Navbar />
        <main className="flex-1 magizh-container py-20 flex items-center justify-center text-center">
          <div className="max-w-md rounded-2xl border border-[#252525] bg-[#0A0A0A] p-10">
            <Clock size={36} className="mx-auto text-[#D4AF37]" />
            <span className="mt-4 inline-block font-mono text-[10px] uppercase tracking-[0.25em] text-[#D4AF37]">
              EVALUATION IN PROGRESS
            </span>
            <h1 className="magizh-heading mt-2 text-3xl font-bold">
              Results Not Yet Published
            </h1>
            <p className="magizh-muted mt-3 text-xs leading-relaxed">
              Judges are currently reviewing and scoring submissions for <strong className="text-[#F5F3ED]">{event?.title || "this event"}</strong>. Official results will be published here upon conclusion.
            </p>
            <Link
              href={`/events/${eventId}`}
              className="mt-8 inline-flex items-center gap-1.5 rounded bg-[#D4AF37] px-6 py-2.5 text-xs font-bold uppercase text-black"
            >
              ← Back to Event
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const items = results.items || [];
  const winner = items[0];
  const runnerUp = items[1];
  const thirdPlace = items[2];
  const remainingFinalists = items.slice(3);

  return (
    <div className="min-h-screen bg-black text-[#F5F3ED] flex flex-col">
      <Navbar />

      <main className="flex-1 magizh-container py-12 md:py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-1 font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            <Trophy size={14} /> OFFICIAL PUBLISHED LEADERBOARD
          </div>

          <h1 className="magizh-heading mt-4 text-4xl font-extrabold sm:text-5xl md:text-6xl">
            {event?.title || "Event"} Results
          </h1>

          <p className="magizh-muted mx-auto mt-3 max-w-xl text-xs leading-relaxed">
            Verified ranking of participating student teams based on official judging evaluation rubrics.
          </p>
        </div>

        {/* PODIUM (Top 3) */}
        {items.length > 0 && (
          <div className="mb-16 grid gap-6 md:grid-cols-3 items-end">
            {/* 2nd Place */}
            {runnerUp && (
              <div className="magizh-card p-6 text-center border-[#A1A1A1]/40 bg-[#0A0A0A] order-2 md:order-1">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#A1A1A1]/50 bg-[#A1A1A1]/10 text-[#A1A1A1]">
                  <Medal size={28} />
                </div>
                <span className="mt-3 block font-mono text-xs font-bold text-[#A1A1A1]">
                  🥈 2ND PLACE (RUNNER UP)
                </span>
                <h3 className="magizh-heading mt-2 text-2xl font-bold">{runnerUp.team_name}</h3>
                <p className="mt-1 text-xs text-[#A1A1A1]">{runnerUp.project_title || "Innovation Submission"}</p>
                {runnerUp.total_score !== undefined && (
                  <div className="mt-4 font-mono text-lg font-bold text-[#D4AF37]">
                    Score: {runnerUp.total_score.toFixed(1)}
                  </div>
                )}
              </div>
            )}

            {/* 1st Place (Winner - Center Elevated) */}
            {winner && (
              <div className="rounded-2xl border-2 border-[#D4AF37] bg-gradient-to-b from-[#141208] to-[#0A0A0A] p-8 text-center shadow-[0_0_40px_rgba(212,175,55,0.15)] order-1 md:order-2">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37]">
                  <Trophy size={32} />
                </div>
                <span className="mt-4 block font-mono text-xs font-bold tracking-widest text-[#D4AF37]">
                  🥇 1ST PLACE WINNER
                </span>
                <h3 className="magizh-heading mt-2 text-3xl font-extrabold text-[#F5F3ED]">
                  {winner.team_name}
                </h3>
                <p className="mt-1 text-xs text-[#D4AF37]">{winner.project_title || "Grand Champion Project"}</p>
                {winner.total_score !== undefined && (
                  <div className="mt-4 font-mono text-2xl font-black text-[#D4AF37]">
                    Score: {winner.total_score.toFixed(1)}
                  </div>
                )}
              </div>
            )}

            {/* 3rd Place */}
            {thirdPlace && (
              <div className="magizh-card p-6 text-center border-[#A1A1A1]/30 bg-[#0A0A0A] order-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5 text-[#D4AF37]">
                  <Award size={28} />
                </div>
                <span className="mt-3 block font-mono text-xs font-bold text-[#A1A1A1]">
                  🥉 3RD PLACE
                </span>
                <h3 className="magizh-heading mt-2 text-2xl font-bold">{thirdPlace.team_name}</h3>
                <p className="mt-1 text-xs text-[#A1A1A1]">{thirdPlace.project_title || "Innovation Submission"}</p>
                {thirdPlace.total_score !== undefined && (
                  <div className="mt-4 font-mono text-lg font-bold text-[#D4AF37]">
                    Score: {thirdPlace.total_score.toFixed(1)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* REMAINING RANKED TEAMS TABLE */}
        {remainingFinalists.length > 0 && (
          <div className="magizh-card p-6 md:p-8">
            <h3 className="magizh-heading text-xl font-bold mb-6">Finalist Standings</h3>
            <div className="divide-y divide-[#252525]">
              {remainingFinalists.map((team: EventResult, idx: number) => (
                <div key={team.team_id || idx} className="py-4 flex items-center justify-between text-xs">

                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm font-bold text-[#A1A1A1] w-8">
                      #{idx + 4}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-[#F5F3ED]">{team.team_name}</h4>
                      <p className="text-[#A1A1A1]">{team.project_title || "Innovation Submission"}</p>
                    </div>
                  </div>

                  {team.total_score !== undefined && (
                    <span className="font-mono font-bold text-[#D4AF37]">
                      {team.total_score.toFixed(1)} pts
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
