import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuthStore()

  return (
    <nav className="bg-surface border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg"></div>
            <span className="text-xl font-bold text-text">Comp</span>
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/events" className="text-muted hover:text-text transition">Events</Link>
            <Link to="/projects" className="text-muted hover:text-text transition">Projects</Link>
            {user ? (
              <>
                <Link to="/dashboard" className="text-muted hover:text-text transition">Dashboard</Link>
                {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                  <Link to="/admin" className="text-accent hover:text-primary transition">Admin</Link>
                )}
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-primary text-surface rounded-lg hover:bg-primary/80 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-muted hover:text-text transition">Login</Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-primary text-surface rounded-lg hover:bg-primary/80 transition"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-muted hover:text-text"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-card border-t border-border">
          <div className="px-4 pt-4 pb-4 space-y-4">
            <Link to="/events" className="block text-muted hover:text-text transition">Events</Link>
            <Link to="/projects" className="block text-muted hover:text-text transition">Projects</Link>
            {user ? (
              <>
                <Link to="/dashboard" className="block text-muted hover:text-text transition">Dashboard</Link>
                {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                  <Link to="/admin" className="block text-accent hover:text-primary transition">Admin</Link>
                )}
                <button
                  onClick={() => {
                    logout()
                    setIsOpen(false)
                  }}
                  className="w-full px-4 py-2 bg-primary text-surface rounded-lg hover:bg-primary/80 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block text-muted hover:text-text transition">Login</Link>
                <Link
                  to="/register"
                  className="block w-full px-4 py-2 bg-primary text-surface rounded-lg hover:bg-primary/80 transition text-center"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
