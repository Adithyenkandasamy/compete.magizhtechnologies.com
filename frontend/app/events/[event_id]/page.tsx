"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useEvent } from "@/hooks/use-events";
import { useEventWebSocket } from "@/hooks/use-event-websocket";
import { registerForEvent } from "@/lib/registrations-api";
import { getAccessToken } from "@/lib/auth";
import { getEventSponsors, type Sponsor } from "@/lib/sponsors-api";
import { getPublicRounds, type EventRound } from "@/lib/admin-rounds-api";
import {
  getRealtimeEventType,
  getRealtimeMessage,
} from "@/lib/realtime";
import type { WebSocketMessage } from "@/hooks/use-websocket";
import { getErrorMessage } from "@/lib/error-message";
import { ErrorState, LoadingButton, PageLoader, SmartImage } from "@/components/loading";

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const eventId = params.event_id as string;

  const { data: event, isLoading, isError } = useEvent(eventId);

  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [sponsorsLoading, setSponsorsLoading] = useState(true);

  const [rounds, setRounds] = useState<EventRound[]>([]);
  const [roundsLoading, setRoundsLoading] = useState(true);

  const [isRegistering, setIsRegistering] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [realtimeMessage, setRealtimeMessage] = useState("");

  const handleRealtimeMessage = useCallback(
    (message: WebSocketMessage) => {
      const eventType = getRealtimeEventType(message);
      const messageText = getRealtimeMessage(message);

      setRealtimeMessage(messageText);

      if (
        eventType === "created" ||
        eventType === "updated" ||
        eventType === "deleted" ||
        eventType === "published" ||
        eventType === "unpublished" ||
        eventType === "status_changed"
      ) {
        queryClient.invalidateQueries({
          queryKey: ["event", eventId],
        });

        queryClient.invalidateQueries({
          queryKey: ["events"],
        });
      }
    },
    [eventId, queryClient],
  );

  const {
    connected: realtimeConnected,
    connecting: realtimeConnecting,
    reconnect: reconnectRealtime,
  } = useEventWebSocket(eventId, {
    enabled: Boolean(eventId && getAccessToken()),
    reconnect: true,
    reconnectDelay: 3000,
    onMessage: handleRealtimeMessage,
  });

  useEffect(() => {
    async function loadSponsors() {
      try {
        setSponsorsLoading(true);

        const data = await getEventSponsors(eventId);
        setSponsors(data);
      } catch (err) {
        console.error("Unable to load sponsors:", err);
        setSponsors([]);
      } finally {
        setSponsorsLoading(false);
      }
    }

    if (eventId) {
      loadSponsors();
    }
  }, [eventId]);

  useEffect(() => {
    async function loadRounds() {
      try {
        setRoundsLoading(true);

        const data = await getPublicRounds(eventId);
        setRounds(data);
      } catch (err) {
        console.error("Unable to load rounds:", err);
        setRounds([]);
      } finally {
        setRoundsLoading(false);
      }
    }

    if (eventId) {
      loadRounds();
    }
  }, [eventId]);

  async function handleRegister() {
    setSuccess("");
    setError("");

    const token = getAccessToken();

    if (!token) {
      router.push(`/login?redirect=/events/${eventId}`);
      return;
    }

    setIsRegistering(true);

    try {
      await registerForEvent(eventId);

      setSuccess("You have successfully registered for this event.");
queryClient.invalidateQueries({
        queryKey: ["event", eventId],
      });
    } catch (err: unknown) {
      setError(
        getErrorMessage(
          err,
          "Unable to register for this event. Please try again.",
        ),
      );
    } finally {
      setIsRegistering(false);
    }
  }

  if (isLoading) {
    return (
      <main className="magizh-container py-20">
        <PageLoader label="loading event" />
      </main>
    );
  }

  if (isError || !event) {
    return (
      <main className="magizh-container py-20">
        <ErrorState
          title="Unable to load this event."
          message="The event may have been removed or the backend may be offline."
        />
      </main>
    );
  }

  return (
    <main className="magizh-container py-12 md:py-16">
      <Link
        href="/events"
        className="mb-8 inline-flex text-sm font-semibold uppercase tracking-wider text-[#D4AF37] hover:text-[#E5C04A]"
      >
        ← Back to Events
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={`h-2 w-2 rounded-full ${
              realtimeConnected
                ? "bg-[#6FAF7B]"
                : realtimeConnecting
                  ? "animate-pulse bg-[#D4AF37]"
                  : "bg-[#A1A1A1]"
            }`}
          />

          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A1A1A1]">
            {realtimeConnected
              ? "Live Updates"
              : realtimeConnecting
                ? "Connecting..."
                : "Live Updates Offline"}
          </span>
        </div>

        {!realtimeConnected && !realtimeConnecting && getAccessToken() && (
          <button
            type="button"
            onClick={reconnectRealtime}
            className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37] transition-colors hover:text-[#E5C04A]"
          >
            Reconnect
          </button>
        )}
      </div>

      {realtimeMessage && (
        <div className="mb-8 rounded border border-[#D4AF37]/30 bg-[#D4AF37]/5 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
            Realtime Update
          </p>

          <p className="mt-1 text-sm text-[#F5F3ED]">
            {realtimeMessage}
          </p>
        </div>
      )}

      {event.banner_url && (
        <div className="mb-10 aspect-[16/6] overflow-hidden rounded-lg border border-[#252525]">
          <SmartImage
            src={event.banner_url}
            alt={event.title}
            className="h-full w-full"
          />
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <section>
          <div className="flex flex-wrap items-center gap-4">
            <span className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
              {event.event_type.replace("_", " ")}
            </span>

            <span className="magizh-muted text-xs uppercase tracking-[0.15em]">
              {event.mode}
            </span>
          </div>

          <h1 className="magizh-heading mt-4 text-4xl font-bold leading-tight md:text-6xl">
            {event.title}
          </h1>

          <p className="magizh-muted mt-6 max-w-3xl text-base leading-8">
            {event.description}
          </p>

          {event.rules && (
            <div className="mt-12">
              <h2 className="magizh-heading text-2xl font-bold">
                Rules & Guidelines
              </h2>

              <p className="magizh-muted mt-4 whitespace-pre-line leading-7">
                {event.rules}
              </p>
            </div>
          )}

          {!roundsLoading && rounds.length > 0 && (
            <div className="mt-14">
              <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.25em]">
                HOW IT WORKS
              </p>

              <h2 className="magizh-heading mt-3 text-2xl font-bold md:text-3xl">
                Hackathon Pipeline
              </h2>

              <ol className="mt-10 space-y-6">
                {rounds.map((round, index) => (
                  <li
                    key={round.id}
                    className="magizh-card relative p-6 md:p-8"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D4AF37] text-sm font-bold text-black">
                        {index + 1}
                      </span>

                      <span className="rounded border border-[#252525] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#A1A1A1]">
                        {round.round_type.replaceAll("_", " ")}
                      </span>

                      <span
                        className={`rounded border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] ${
                          round.status === "OPEN"
                            ? "border-[#6FAF7B] text-[#6FAF7B]"
                            : round.status === "CLOSED"
                              ? "border-[#777] text-[#777]"
                              : "border-[#252525] text-[#A1A1A1]"
                        }`}
                      >
                        {round.status.replaceAll("_", " ")}
                      </span>
                    </div>

                    <h3 className="magizh-heading mt-5 text-2xl font-bold">
                      {round.title}
                    </h3>

                    {round.description && (
                      <p className="magizh-muted mt-3 text-sm leading-7">
                        {round.description}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#A1A1A1]">
                      {round.duration_hours !== null && (
                        <span>{round.duration_hours} hours</span>
                      )}

                      {round.mode && (
                        <span>{round.mode.replaceAll("_", " ")}</span>
                      )}

                      {round.starts_at && (
                        <span>
                          Starts{" "}
                          {new Date(round.starts_at).toLocaleString()}
                        </span>
                      )}

                      {round.ends_at && (
                        <span>
                          Ends{" "}
                          {new Date(round.ends_at).toLocaleString()}
                        </span>
                      )}

                      {round.criteria_url && (
                        <a
                          href={round.criteria_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all text-[#D4AF37] hover:underline"
                        >
                          {round.criteria_url}
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {!sponsorsLoading && sponsors.length > 0 && (
            <div className="mt-14 border-t border-[#252525] pt-10">
              <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.25em]">
                EVENT SPONSORS
              </p>

              <h2 className="magizh-heading mt-3 text-2xl font-bold md:text-3xl">
                Supported by
              </h2>

              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                {sponsors.map((sponsor) => (
                  <div
                    key={sponsor.id}
                    className="magizh-card p-5 transition-colors hover:border-[#D4AF37]"
                  >
                    <div className="flex items-center gap-4">
                      {sponsor.logo_url ? (
                        <SmartImage
                          src={sponsor.logo_url}
                          alt={sponsor.name}
                          className="h-14 w-14 rounded border border-[#252525] bg-[#0A0A0A]"
                          imgClassName="object-contain p-2"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded border border-[#252525] bg-[#0A0A0A]">
                          <span className="magizh-gold text-lg font-semibold">
                            {sponsor.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}

                      <div className="min-w-0">
                        <h3 className="font-semibold text-[#F5F3ED]">
                          {sponsor.name}
                        </h3>

                        {sponsor.website_url && (
                          <a
                            href={sponsor.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-block text-xs text-[#A1A1A1] transition-colors hover:text-[#D4AF37]"
                          >
                            Visit website ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="magizh-card h-fit p-6">
          <h2 className="magizh-heading text-xl font-bold">
            Event Information
          </h2>

          <div className="mt-6 space-y-5 text-sm">
            <div>
              <p className="magizh-muted uppercase tracking-wider">
                Starts
              </p>

              <p className="mt-1">
                {new Date(event.start_date).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="magizh-muted uppercase tracking-wider">
                Ends
              </p>

              <p className="mt-1">
                {new Date(event.end_date).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="magizh-muted uppercase tracking-wider">
                Registration Deadline
              </p>

              <p className="mt-1">
                {new Date(
                  event.registration_deadline,
                ).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="magizh-muted uppercase tracking-wider">
                Location
              </p>

              <p className="mt-1">
                {event.location || "To be announced"}
              </p>
            </div>

            <div>
              <p className="magizh-muted uppercase tracking-wider">
                Team Size
              </p>

              <p className="mt-1">
                {event.team_size_min} - {event.team_size_max} members
              </p>
            </div>

            {event.prize_pool !== null &&
              event.prize_pool !== undefined && (
                <div>
                  <p className="magizh-muted uppercase tracking-wider">
                    Prize Pool
                  </p>

                  <p className="magizh-gold mt-1 text-lg font-semibold">
                    ₹{event.prize_pool.toLocaleString("en-IN")}
                  </p>
                </div>
              )}
          </div>

          {success && (
            <div className="mt-6 rounded border border-[#6FAF7B]/40 bg-[#6FAF7B]/10 px-4 py-3">
              <p className="text-sm text-[#6FAF7B]">
                {success}
              </p>
            </div>
          )}

          {error && (
            <div className="mt-6 rounded border border-[#C75C5C]/40 bg-[#C75C5C]/10 px-4 py-3">
              <p className="text-sm text-[#C75C5C]">
                {error}
              </p>
            </div>
          )}

          <LoadingButton
            type="button"
            onClick={handleRegister}
            variant="gold"
            loading={isRegistering}
            loadingText="Registering..."
            disabled={Boolean(success)}
            className="mt-8 w-full"
          >
            {success ? "Registered" : "Register for Event"}
          </LoadingButton>
        </aside>
      </div>
    </main>
  );
}