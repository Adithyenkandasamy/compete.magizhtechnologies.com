export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-text leading-tight">
            Your Next Big Build Starts Here.
          </h1>
          <p className="text-xl text-muted mb-8 max-w-2xl mx-auto">
            Discover hackathons, workshops, competitions and communities that help you build something real.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/events"
              className="px-8 py-4 bg-primary text-surface rounded-lg font-semibold hover:bg-primary/80 transition"
            >
              Explore Events
            </a>
            <a
              href="#"
              className="px-8 py-4 border border-primary text-primary rounded-lg font-semibold hover:bg-primary/10 transition"
            >
              Host an Event
            </a>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-text">Featured Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-card rounded-xl p-6 border border-border hover:border-primary transition"
              >
                <div className="h-32 bg-gradient-to-r from-primary to-accent rounded-lg mb-4"></div>
                <h3 className="text-xl font-bold text-text mb-2">Event {i}</h3>
                <p className="text-muted text-sm mb-4">Amazing opportunity to compete and learn</p>
                <div className="flex justify-between items-center">
                  <span className="text-accent text-sm">1,234 registered</span>
                  <button className="text-primary hover:text-accent transition">View →</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-accent mb-2">500+</div>
              <p className="text-muted">Active Students</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">50+</div>
              <p className="text-muted">Events Hosted</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-success mb-2">100+</div>
              <p className="text-muted">Projects Submitted</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-warning mb-2">1000+</div>
              <p className="text-muted">Registrations</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
