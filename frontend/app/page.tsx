import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";

export default function Home() {
  return (
    <main className="magizh-container py-20">
      <SectionTitle
        label="MAGIZH TECHNOLOGIES"
        title="Innovation begins with an idea."
        description="Discover hackathons, workshops, competitions, meetups, and project showcases powered by Magizh Technologies."
      />

      <div className="mt-8 flex flex-wrap gap-4">
        <Button>Explore Events</Button>

        <Button variant="outline">Learn More</Button>
      </div>

      <Card className="mt-16 max-w-md p-6">
        <p className="magizh-gold text-sm font-semibold uppercase tracking-widest">
          Design System
        </p>

        <h2 className="magizh-heading mt-2 text-2xl">
          MAGIZH | INNOVATION
        </h2>

        <p className="magizh-muted mt-3">
          Dark background · Gold accent · Premium minimal interface
        </p>
      </Card>
    </main>
  );
}