export default function Footer() {
  return (
    <footer className="bg-surface border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-gradient-to-r from-primary to-accent rounded-lg"></div>
              <span className="font-bold text-text">Comp</span>
            </div>
            <p className="text-muted text-sm">Discover. Build. Compete. Connect.</p>
          </div>
          <div>
            <h3 className="font-semibold text-text mb-4">Platform</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li><a href="/events" className="hover:text-text transition">Events</a></li>
              <li><a href="/projects" className="hover:text-text transition">Projects</a></li>
              <li><a href="/" className="hover:text-text transition">Discover</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-text mb-4">Community</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li><a href="#" className="hover:text-text transition">Discord</a></li>
              <li><a href="#" className="hover:text-text transition">GitHub</a></li>
              <li><a href="#" className="hover:text-text transition">Twitter</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-text mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li><a href="#" className="hover:text-text transition">Terms</a></li>
              <li><a href="#" className="hover:text-text transition">Privacy</a></li>
              <li><a href="#" className="hover:text-text transition">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted">
          <p>&copy; 2026 Comp. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
