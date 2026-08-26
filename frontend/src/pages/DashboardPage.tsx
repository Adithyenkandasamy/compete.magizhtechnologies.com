export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text">Dashboard</h1>
          <p className="text-muted mt-2">Welcome back! Here's your event activity.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-lg p-6 border border-border">
            <p className="text-muted text-sm mb-2">Registered Events</p>
            <p className="text-3xl font-bold text-text">5</p>
          </div>
          <div className="bg-card rounded-lg p-6 border border-border">
            <p className="text-muted text-sm mb-2">XP Points</p>
            <p className="text-3xl font-bold text-accent">1,250</p>
          </div>
          <div className="bg-card rounded-lg p-6 border border-border">
            <p className="text-muted text-sm mb-2">Certificates</p>
            <p className="text-3xl font-bold text-success">3</p>
          </div>
          <div className="bg-card rounded-lg p-6 border border-border">
            <p className="text-muted text-sm mb-2">Team Members</p>
            <p className="text-3xl font-bold text-primary">4</p>
          </div>
        </div>

        {/* Registered Events */}
        <div className="bg-card rounded-xl border border-border p-6 mb-8">
          <h2 className="text-2xl font-bold text-text mb-4">Your Events</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex justify-between items-center p-4 bg-surface rounded-lg border border-border"
              >
                <div>
                  <p className="font-semibold text-text">Event {i}</p>
                  <p className="text-muted text-sm">Dec {i}, 2026 • Online</p>
                </div>
                <button className="px-4 py-2 text-primary hover:text-accent transition">
                  View →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
