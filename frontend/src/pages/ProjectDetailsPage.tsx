import { useParams } from 'react-router-dom'

export default function ProjectDetailsPage() {
  const { id } = useParams()

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-80 bg-gradient-to-r from-accent to-primary rounded-xl mb-8"></div>

        <div className="bg-card rounded-xl border border-border p-8">
          <h1 className="text-4xl font-bold text-text mb-2">Project {id}</h1>
          <p className="text-muted mb-6">Built by Amazing Developers • AI Hackathon 2026</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-xl font-bold text-text mb-4">About</h2>
              <p className="text-muted leading-relaxed">
                This project solves real-world problems using cutting-edge technology. The team spent weeks researching, designing, and building a scalable solution.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-text mb-4">Tech Stack</h2>
              <div className="flex flex-wrap gap-2">
                <span className="bg-primary/20 text-primary px-3 py-1 rounded-lg text-sm">React</span>
                <span className="bg-primary/20 text-primary px-3 py-1 rounded-lg text-sm">Node.js</span>
                <span className="bg-primary/20 text-primary px-3 py-1 rounded-lg text-sm">PostgreSQL</span>
                <span className="bg-primary/20 text-primary px-3 py-1 rounded-lg text-sm">Docker</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button className="px-6 py-2 bg-primary text-surface rounded-lg hover:bg-primary/80 transition">
              View Demo
            </button>
            <button className="px-6 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition">
              GitHub Repository
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
