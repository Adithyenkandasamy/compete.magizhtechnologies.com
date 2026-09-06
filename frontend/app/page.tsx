import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";

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
          ))}
        </div>
      </section>

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
    </main>
  );
}