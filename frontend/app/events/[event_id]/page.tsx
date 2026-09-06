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
import {
  getRealtimeEventType,
  getRealtimeMessage,
} from "@/lib/realtime";
import type { WebSocketMessage } from "@/hooks/use-websocket";

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const eventId = params.event_id as string;

  const { data: event, isLoading, isError } = useEvent(eventId);

  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [sponsorsLoading, setSponsorsLoading] = useState(true);

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
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        "Unable to register for this event. Please try again.";

      setError(message);
    } finally {
      setIsRegistering(false);
    }
  }

  if (isLoading) {
    return (
      <main className="magizh-container py-20">
        <p className="magizh-muted">Loading event...</p>
      </main>
    );
  }

  if (isError || !event) {
    return (
      <main className="magizh-container py-20">
        <div className="magizh-card p-8">
          <p className="text-[#C75C5C]">
            Unable to load this event.
          </p>

          <Link
            href="/events"
            className="mt-5 inline-flex text-sm font-semibold uppercase tracking-wider text-[#D4AF37] hover:text-[#E5C04A]"
          >
            ← Back to Events
          </Link>
        </div>
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
          <img
            src={event.banner_url}
            alt={event.title}
            className="h-full w-full object-cover"
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
                        <img
                          src={sponsor.logo_url}
                          alt={sponsor.name}
                          className="h-14 w-14 rounded border border-[#252525] object-contain bg-[#0A0A0A] p-2"
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

          <button
            type="button"
            onClick={handleRegister}
            disabled={isRegistering || Boolean(success)}
            className="magizh-button mt-8 w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRegistering
              ? "Registering..."
              : success
                ? "Registered"
                : "Register for Event"}
          </button>
        </aside>
      </div>
    </main>
  );
}