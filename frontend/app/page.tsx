"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Trophy,
  Users,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

import { useEvents } from "@/hooks/use-events";
import { EventCard } from "@/components/events/event-card";
import {
  HackerSnakeLoader,
  ErrorState,
  EmptyState,
} from "@/components/loading";

const stats = [
  { value: "40+", label: "Events" },
  { value: "1.2K+", label: "Participants" },
  { value: "300+", label: "Teams" },
  { value: "25+", label: "Winning Projects" },
];

const highlights = [
  {
    icon: CalendarDays,
    title: "Discover Events",
    description:
      "Find hackathons, workshops, competitions and innovation events built by Magizh Technologies.",
  },
  {
    icon: Users,
    title: "Build Teams",
    description:
      "Create a team, invite members and collaborate with students who share your ideas.",
  },
  {
    icon: Trophy,
    title: "Compete & Win",
    description:
      "Submit your project, move through event rounds and compete for recognition.",
  },
];

export default function HomePage() {
  const {
    data: events,
    isLoading: eventsLoading,
    isError: eventsError,
    refetch: refetchEvents,
  } = useEvents();

  const featuredEvents = events?.slice(0, 3) ?? [];

  return (
    <main className="min-h-screen bg-black text-[#F5F3ED]">
      {/* NAVBAR */}
      <header className="border-b border-[#252525]">
        <div className="magizh-container flex h-20 items-center justify-between">
          <Link href="/" className="group">
            <div className="text-sm font-semibold uppercase tracking-[0.28em]">
              MAGIZH
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.32em] text-[#A1A1A1]">
              Technologies
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/events"
              className="text-sm text-[#A1A1A1] transition hover:text-[#D4AF37]"
            >
              Events
            </Link>

            <Link
              href="/projects"
              className="text-sm text-[#A1A1A1] transition hover:text-[#D4AF37]"
            >
              Projects
            </Link>

            <Link
              href="/dashboard"
              className="text-sm text-[#A1A1A1] transition hover:text-[#D4AF37]"
            >
              Dashboard
            </Link>
          </nav>

          <div className="flex items-center gap-5">
            <Link
              href="/register"
              className="bg-[#D4AF37] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-[#E5C04A]"
            >
              Create Account
            </Link>

            <Link
              href="/login"
              className="border border-[#252525] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-[#252525]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.04] blur-[120px]" />
        </div>

        <div className="magizh-container relative flex min-h-[680px] items-center py-24">
          <div className="max-w-5xl">
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-7 text-xs font-semibold uppercase tracking-[0.35em] text-[#D4AF37]"
            >
              MAGIZH TECHNOLOGIES
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="magizh-heading max-w-5xl text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl"
            >
              Innovation begins
              <br />
              with an{" "}
              <span className="italic text-[#D4AF37]">idea.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="mt-8 max-w-2xl text-base leading-8 text-[#A1A1A1] md:text-lg"
            >
              Discover events. Build teams. Create meaningful projects.
              Compete, learn and showcase your innovation with Magizh
              Technologies.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="mt-10 flex flex-col gap-4 sm:flex-row"
            >
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-3 bg-[#D4AF37] px-7 py-4 text-sm font-semibold text-black transition hover:bg-[#E5C04A]"
              >
                Create Account
                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="/events"
                className="inline-flex items-center justify-center gap-3 border border-[#252525] px-7 py-4 text-sm font-semibold transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
              >
                Explore Events
              </Link>
            </motion.div>
          </div>
        </div>

        <div className="magizh-container pb-10">
          <div className="flex items-center justify-between border-t border-[#252525] pt-5">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#666]">
              Student Innovation Platform
            </p>

            <Sparkles size={16} className="text-[#D4AF37]" />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-b border-[#252525]">
        <div className="magizh-container grid grid-cols-2 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`px-5 py-10 md:px-8 ${
                index !== 0 ? "border-l border-[#252525]" : ""
              }`}
            >
              <p className="magizh-heading text-3xl font-bold md:text-4xl">
                {stat.value}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#666]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED EVENTS */}
      <section className="border-b border-[#252525] py-24">
        <div className="magizh-container">
          <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
                Upcoming Hackathons
              </p>

              <h2 className="magizh-heading text-4xl font-bold md:text-5xl">
                Find your next challenge.
              </h2>
            </div>

            <Link
              href="/events"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37] transition-colors hover:text-[#E5C04A]"
            >
              View All Events
              <ArrowRight size={14} />
            </Link>
          </div>

          {eventsLoading ? (
            <HackerSnakeLoader size="lg" message="SCANNING EVENTS" />
          ) : eventsError ? (
            <ErrorState
              title="Unable to load events."
              message="The backend may be offline. Please try again."
              onRetry={() => refetchEvents()}
              retryLabel="Try Again"
            />
          ) : featuredEvents.length === 0 ? (
            <EmptyState
              kicker="EVENTS"
              title="No events yet"
              description="New hackathons will be announced here. Check back soon."
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="border-b border-[#252525] py-24">
        <div className="magizh-container">
          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
                The Platform
              </p>

              <h2 className="magizh-heading text-4xl font-bold leading-tight md:text-5xl">
                From idea
                <br />
                to impact.
              </h2>
            </div>

            <div>
              <p className="max-w-3xl text-lg leading-8 text-[#A1A1A1]">
                MAGIZH | INNOVATION is the official innovation platform of
                Magizh Technologies, created for students to discover
                opportunities, collaborate with teams and turn ideas into
                real-world projects.
              </p>

              <p className="mt-6 max-w-3xl text-base leading-8 text-[#666]">
                Whether you are joining your first hackathon or building your
                next big project, the platform brings the complete journey
                together — from registration and team formation to submission,
                judging, results and certificates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <section className="border-b border-[#252525] py-24">
        <div className="magizh-container">
          <div className="mb-12">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
              What You Can Do
            </p>

            <h2 className="magizh-heading text-4xl font-bold md:text-5xl">
              Build. Compete. Showcase.
            </h2>
          </div>

          <div className="grid gap-px border border-[#252525] bg-[#252525] md:grid-cols-3">
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.title}
                  whileHover={{ y: -4 }}
                  className="bg-[#0D0D0F] p-8 md:p-10"
                >
                  <div className="mb-8 flex h-11 w-11 items-center justify-center border border-[#252525]">
                    <Icon size={19} className="text-[#D4AF37]" />
                  </div>

                  <h3 className="magizh-heading text-2xl font-bold">
                    {item.title}
                  </h3>

                  <p className="mt-4 text-sm leading-7 text-[#777]">
                    {item.description}
                  </p>

                  <Link
                    href="/events"
                    className="mt-7 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]"
                  >
                    Explore
                    <ArrowRight size={14} />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28">
        <div className="magizh-container">
          <div className="border border-[#252525] bg-[#0A0A0A] px-7 py-16 text-center md:px-16">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
              Your next idea starts here
            </p>

            <h2 className="magizh-heading mx-auto max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
              Ready to build something
              <span className="text-[#D4AF37]"> meaningful?</span>
            </h2>

            <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-[#777]">
              Create an account to register for events, build your team, and
              start innovating today.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center gap-3 bg-[#D4AF37] px-7 py-4 text-sm font-semibold text-black transition hover:bg-[#E5C04A]"
              >
                Create an Account
                <ArrowRight size={17} />
              </Link>

              <Link
                href="/events"
                className="inline-flex items-center gap-3 border border-[#252525] px-7 py-4 text-sm font-semibold text-[#F5F3ED] transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
              >
                Explore Events
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#252525]">
        <div className="magizh-container flex flex-col gap-5 py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em]">
              MAGIZH
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-[#666]">
              Technologies
            </p>
          </div>

          <p className="text-xs text-[#555]">
            © {new Date().getFullYear()} Magizh Technologies. All rights
            reserved.
          </p>

          <Link
            href="/events"
            className="text-xs uppercase tracking-[0.18em] text-[#777] transition hover:text-[#D4AF37]"
          >
            Discover Innovation
          </Link>
        </div>
      </footer>
    </main>
  );
}