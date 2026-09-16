import Link from "next/link";
import Image from "next/image";
import { Calendar, Sparkles, ArrowRight } from "lucide-react";
import type { Event } from "@/types/events";

type EventCardProps = {
  event: Event;
};

export function EventCard({ event }: EventCardProps) {
  const hasRealBanner =
    Boolean(event.banner_url) &&
    !event.banner_url?.includes("placehold.co");

  return (
    <article className="magizh-card group flex flex-col overflow-hidden transition-all duration-300 hover:border-[#D4AF37]/80 hover:shadow-[0_0_30px_rgba(212,175,55,0.08)]">
      {hasRealBanner ? (
        <div className="relative aspect-[16/8] overflow-hidden border-b border-[#252525]">
          <Image
            fill
            unoptimized
            src={event.banner_url!}
            alt={event.title}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0F] via-black/20 to-black/60" />
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="rounded border border-[#D4AF37]/40 bg-black/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] backdrop-blur-md">
              {event.event_type.replace("_", " ")}
            </span>
            <span className="rounded border border-[#252525] bg-black/80 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#A1A1A1] backdrop-blur-md">
              {event.mode}
            </span>
          </div>
        </div>
      ) : (
        <div className="relative aspect-[16/8] overflow-hidden border-b border-[#252525] bg-gradient-to-br from-[#121217] via-[#0D0D10] to-[#070709] p-5 flex flex-col justify-between">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-[#D4AF37]/10 blur-xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(#252525_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded border border-[#D4AF37]/40 bg-[#0A0A0A]/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                {event.event_type.replace("_", " ")}
              </span>
              <span className="rounded border border-[#252525] bg-[#0A0A0A]/90 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#A1A1A1]">
                {event.mode}
              </span>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#D4AF37]">
              <Sparkles size={13} />
              <span className="font-bold tracking-widest text-[10px] uppercase">
                MAGIZH INNOVATION
              </span>
            </div>
            {event.prize_pool ? (
              <span className="font-mono text-[10px] font-semibold text-[#D4AF37]/90">
                ₹{Number(event.prize_pool).toLocaleString("en-IN")} PRIZE
              </span>
            ) : (
              <span className="font-mono text-[10px] text-[#A1A1A1]/60 uppercase tracking-wider">
                VERIFIED CONTEST
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col p-6">
        <Link href={`/events/${event.id}`}>
          <h3 className="magizh-heading text-xl font-bold text-[#F5F3ED] transition-colors group-hover:text-[#D4AF37]">
            {event.title}
          </h3>
        </Link>

        <p className="magizh-muted mt-2.5 line-clamp-2 text-xs leading-relaxed">
          {event.description}
        </p>

        <div className="mt-5 space-y-2 rounded-lg border border-[#252525]/70 bg-[#0A0A0C] p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[#A1A1A1]">
              <Calendar size={13} className="text-[#D4AF37]" />
              Starts:
            </span>
            <span className="font-mono text-[#F5F3ED]">
              {new Date(event.start_date).toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-[#252525]/60 pt-2">
            <span className="text-[#A1A1A1]">Registration Closes:</span>
            <span className="font-mono text-[#D4AF37]">
              {new Date(event.registration_deadline).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="mt-6 border-t border-[#252525] pt-4 flex items-center justify-between">
          <Link
            href={`/events/${event.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#D4AF37] transition hover:text-[#E5C04A]"
          >
            Explore Event <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </article>
  );
}