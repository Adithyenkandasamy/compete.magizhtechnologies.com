import Link from "next/link";
import type { Event } from "@/types/events";

type EventCardProps = {
  event: Event;
};

export function EventCard({ event }: EventCardProps) {
  return (
    <article className="magizh-card overflow-hidden transition-colors duration-200 hover:border-[#D4AF37]">
      {event.banner_url ? (
        <div className="aspect-[16/8] overflow-hidden border-b border-[#252525]">
          <img
            src={event.banner_url}
            alt={event.title}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex aspect-[16/8] items-center justify-center border-b border-[#252525] bg-[#0A0A0A]">
          <span className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
            MAGIZH EVENT
          </span>
        </div>
      )}

      <div className="p-6">
        <div className="flex items-center justify-between gap-4">
          <span className="magizh-gold text-xs font-semibold uppercase tracking-[0.15em]">
            {event.event_type.replace("_", " ")}
          </span>

          <span className="magizh-muted text-xs uppercase tracking-wider">
            {event.mode}
          </span>
        </div>

        <h3 className="magizh-heading mt-3 text-2xl font-bold">
          {event.title}
        </h3>

        <p className="magizh-muted mt-3 line-clamp-2 text-sm leading-6">
          {event.description}
        </p>

        <div className="mt-5 space-y-2 text-sm">
          <p>
            <span className="magizh-muted">Starts: </span>
            {new Date(event.start_date).toLocaleDateString()}
          </p>

          <p>
            <span className="magizh-muted">Registration closes: </span>
            {new Date(event.registration_deadline).toLocaleDateString()}
          </p>
        </div>

        <Link
          href={`/events/${event.id}`}
          className="mt-6 inline-flex text-sm font-semibold uppercase tracking-wider text-[#D4AF37] transition-colors hover:text-[#E5C04A]"
        >
          View Event →
        </Link>
      </div>
    </article>
  );
}