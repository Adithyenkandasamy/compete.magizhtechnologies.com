interface EventsPageProps {
  filterType?: string
}

export default function EventsPage(_props: EventsPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-text mb-8">Discover Events</h1>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <input
            type="text"
            placeholder="Search events..."
            className="px-4 py-2 bg-card border border-border rounded-lg text-text placeholder-muted focus:outline-none focus:border-primary"
          />
          <select className="px-4 py-2 bg-card border border-border rounded-lg text-text focus:outline-none focus:border-primary">
            <option>All Categories</option>
            <option>Hackathon</option>
            <option>Workshop</option>
            <option>Competition</option>
          </select>
          <select className="px-4 py-2 bg-card border border-border rounded-lg text-text focus:outline-none focus:border-primary">
            <option>All Modes</option>
            <option>Online</option>
            <option>Offline</option>
            <option>Hybrid</option>
          </select>
          <button className="px-4 py-2 bg-primary text-surface rounded-lg hover:bg-primary/80 transition">
            Filter
          </button>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-card rounded-xl overflow-hidden border border-border hover:border-primary transition">
              <div className="h-40 bg-gradient-to-r from-primary to-accent"></div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-text">Event {i}</h3>
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Live</span>
                </div>
                <p className="text-muted text-sm mb-4">Join us for this amazing opportunity</p>
                <div className="space-y-2 mb-4 text-sm text-muted">
                  <p>📅 Dec {i}, 2026</p>
                  <p>📍 {i % 2 === 0 ? 'Online' : 'College Auditorium'}</p>
                  <p>👥 {i * 100} registered</p>
                </div>
                <button className="w-full px-4 py-2 bg-primary text-surface rounded-lg hover:bg-primary/80 transition">
                  Register Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
