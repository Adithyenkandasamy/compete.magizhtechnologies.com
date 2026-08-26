export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-text mb-8">Project Showcase</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-card rounded-xl overflow-hidden border border-border hover:border-primary transition">
              <div className="h-40 bg-gradient-to-r from-accent to-primary"></div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-text mb-2">Project {i}</h3>
                <p className="text-muted text-sm mb-4">An innovative solution built with modern tech</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">React</span>
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Node.js</span>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 bg-primary/20 text-primary rounded hover:bg-primary/30 transition text-sm">
                    View
                  </button>
                  <button className="flex-1 px-3 py-2 bg-surface border border-border text-text rounded hover:border-primary transition text-sm">
                    GitHub
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
