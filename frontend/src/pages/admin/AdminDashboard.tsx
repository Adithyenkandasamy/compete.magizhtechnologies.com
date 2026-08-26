export default function AdminDashboard() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text">Admin Dashboard</h1>
          <p className="text-muted mt-2">Real-time platform overview</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-danger/20 text-danger rounded-lg">
          <div className="w-2 h-2 bg-danger rounded-full animate-pulse"></div>
          <span className="font-medium">LIVE</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Students', value: '1,234', icon: '👥' },
          { label: 'Active Events', value: '12', icon: '📅' },
          { label: 'Registrations', value: '5,678', icon: '✓' },
          { label: 'Submissions', value: '342', icon: '📤' },
        ].map((stat, i) => (
          <div key={i} className="bg-card rounded-lg border border-border p-6">
            <div className="text-3xl mb-2">{stat.icon}</div>
            <p className="text-muted text-sm mb-2">{stat.label}</p>
            <p className="text-2xl font-bold text-text">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-bold text-text mb-4">Registration Trend</h2>
          <div className="h-64 bg-surface rounded-lg flex items-center justify-center text-muted">
            Chart Placeholder
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-bold text-text mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-sm border-b border-border pb-3 last:border-b-0">
                <p className="text-text font-medium">User registered for Event {i}</p>
                <p className="text-muted text-xs">2 minutes ago</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
