import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Calendar, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/auth'

export default function Sidebar() {
  const location = useLocation()
  const { logout } = useAuthStore()

  const isActive = (path: string) => location.pathname === path

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/events', label: 'Events', icon: Calendar },
  ]

  return (
    <aside className="w-64 bg-surface border-r border-border h-screen flex flex-col">
      <div className="p-6 border-b border-border">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg"></div>
          <span className="font-bold text-text">Comp Admin</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition ${
                active
                  ? 'bg-primary text-surface'
                  : 'text-muted hover:bg-card'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-2 text-danger hover:bg-card rounded-lg transition"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
