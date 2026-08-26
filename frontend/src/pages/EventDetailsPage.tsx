import { useParams } from 'react-router-dom'

export default function EventDetailsPage() {
  const { id } = useParams()

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="h-80 bg-gradient-to-r from-primary to-accent rounded-xl mb-8"></div>

        <div className="bg-card rounded-xl border border-border p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-text mb-2">Event {id}</h1>
              <p className="text-muted">Organized by Amazing Community</p>
            </div>
            <button className="px-6 py-2 bg-primary text-surface rounded-lg hover:bg-primary/80 transition">
              Register
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div>
              <p className="text-muted text-sm mb-2">DATE</p>
              <p className="text-text">December {id}, 2026</p>
            </div>
            <div>
              <p className="text-muted text-sm mb-2">LOCATION</p>
              <p className="text-text">College Auditorium</p>
            </div>
            <div>
              <p className="text-muted text-sm mb-2">PARTICIPANTS</p>
              <p className="text-text">1,234 registered</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-text mb-4">About</h2>
              <p className="text-muted leading-relaxed">
                Join us for an amazing event where you can showcase your skills, network with peers, and compete for exciting prizes. This is your opportunity to build something real and connect with the community.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-text mb-4">Timeline</h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-3 h-3 bg-primary rounded-full mt-2"></div>
                  <div>
                    <p className="font-semibold text-text">Registration Opens</p>
                    <p className="text-muted text-sm">December 1, 2026</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-3 h-3 bg-accent rounded-full mt-2"></div>
                  <div>
                    <p className="font-semibold text-text">Event Starts</p>
                    <p className="text-muted text-sm">December {id}, 2026</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-text mb-4">Prizes</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface rounded-lg p-4 border border-border">
                  <div className="text-2xl font-bold text-primary mb-2">🥇</div>
                  <p className="font-semibold text-text">First Prize</p>
                  <p className="text-muted">₹50,000</p>
                </div>
                <div className="bg-surface rounded-lg p-4 border border-border">
                  <div className="text-2xl font-bold text-accent mb-2">🥈</div>
                  <p className="font-semibold text-text">Second Prize</p>
                  <p className="text-muted">₹30,000</p>
                </div>
                <div className="bg-surface rounded-lg p-4 border border-border">
                  <div className="text-2xl font-bold text-warning mb-2">🥉</div>
                  <p className="font-semibold text-text">Third Prize</p>
                  <p className="text-muted">₹20,000</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
