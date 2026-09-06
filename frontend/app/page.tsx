"use client";

<<<<<<< HEAD
import Link from "next/link";
import { ArrowRight, CalendarDays, Trophy, Users, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

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

          <Link
            href="/login"
            className="border border-[#252525] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
          >
            Login
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-[#252525]">
        <div className="absolute inset-0 pointer-events-none">
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
              <span className="text-[#D4AF37] italic">idea.</span>
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
                href="/events"
                className="group inline-flex items-center justify-center gap-3 bg-[#D4AF37] px-7 py-4 text-sm font-semibold text-black transition hover:bg-[#E5C04A]"
              >
                Explore Events
                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>

              <a
                href="#about"
                className="inline-flex items-center justify-center border border-[#252525] px-7 py-4 text-sm font-semibold transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
              >
                Learn More
              </a>
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
=======
const stats = [
  { value: "40+", label: "Events Hosted" },
  { value: "1.2k", label: "Participants" },
  { value: "300+", label: "Projects Built" },
  { value: "25+", label: "Partner Communities" },
];

const programs = [
  {
    title: "Hackathons",
    description:
      "48-hour sprints where bold ideas meet relentless execution. Ship, demo, and compete for recognition.",
  },
  {
    title: "Workshops",
    description:
      "Hands-on sessions led by engineers and designers, from first commit to production deployment.",
  },
  {
    title: "Competitions",
    description:
      "Structured challenges that reward craft, creativity, and technical depth across every discipline.",
  },
  {
    title: "Project Showcases",
    description:
      "A curated gallery of standout work — the stories, the builds, and the people behind them.",
  },
];

export default function Home() {
  return (
    <main className="magizh-container py-20">
      <section className="max-w-3xl">
        <p className="magizh-kicker magizh-gold mb-6 text-xs font-semibold uppercase">
          Magizh Technologies
        </p>

        <h1 className="magizh-display text-5xl font-bold leading-[1.05] md:text-7xl">
          Innovation begins <span className="magizh-gold italic">with an idea.</span>
        </h1>

        <p className="magizh-muted mt-6 max-w-xl text-lg leading-8">
          Discover hackathons, workshops, competitions, meetups, and project
          showcases powered by Magizh Technologies — where makers gather to
          build what&apos;s next.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Button>Explore Events</Button>
          <Button variant="outline">Learn More</Button>
        </div>
      </section>

      <section className="mt-24 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)] md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-[var(--card)] px-6 py-8">
            <p className="magizh-accent magizh-gold text-4xl font-semibold tracking-tight">
              {stat.value}
            </p>
            <p className="magizh-muted mt-2 text-sm">{stat.label}</p>
          </div>
        ))}
      </section>

      <section className="mt-24">
        <SectionTitle
          label="What we run"
          title="Programs built for builders."
          description="Every format is designed around one belief: the best way to learn is to make something real."
        />

        <div className="grid gap-6 md:grid-cols-2">
          {programs.map((program) => (
            <Card key={program.title} className="group p-8 transition-colors hover:border-[var(--gold)]">
              <p className="magizh-gold text-sm font-semibold uppercase tracking-widest">
                {program.title}
              </p>
              <p className="magizh-muted mt-3 leading-7">{program.description}</p>
              <p className="magizh-accent mt-6 text-sm font-medium text-[var(--gold)] opacity-0 transition-opacity group-hover:opacity-100">
                Join the next one →
              </p>
            </Card>
>>>>>>> e9267dfe5ddf938a4d6ac2efd5e1b0ac0921637d
          ))}
        </div>
      </section>

<<<<<<< HEAD
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
              Explore upcoming Magizh Technologies events and find your next
              opportunity to innovate.
            </p>

            <Link
              href="/events"
              className="mt-9 inline-flex items-center gap-3 bg-[#D4AF37] px-7 py-4 text-sm font-semibold text-black transition hover:bg-[#E5C04A]"
            >
              Explore Events
              <ArrowRight size={17} />
            </Link>
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
=======
      <section className="mt-24 text-center">
        <Card className="mx-auto max-w-2xl p-10">
          <p className="magizh-kicker magizh-gold mb-4 text-xs font-semibold uppercase">
            Get involved
          </p>
          <h2 className="magizh-heading text-3xl font-bold leading-tight md:text-4xl">
            Ready to build something&nbsp;<span className="magizh-gold italic">remarkable?</span>
          </h2>
          <p className="magizh-muted mx-auto mt-4 max-w-md leading-7">
            Join the community, find your next event, and put your ideas into
            the world.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button>Create an Account</Button>
            <Button variant="outline">Browse Projects</Button>
          </div>
        </Card>
      </section>
>>>>>>> e9267dfe5ddf938a4d6ac2efd5e1b0ac0921637d
    </main>
  );
}