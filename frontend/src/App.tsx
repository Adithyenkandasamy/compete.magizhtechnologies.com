import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import Layout from '@/components/Layout'
import AdminLayout from '@/components/admin/AdminLayout'

// Pages
import HomePage from '@/pages/HomePage'
import EventsPage from '@/pages/EventsPage'
import EventDetailsPage from '@/pages/EventDetailsPage'
import DashboardPage from '@/pages/DashboardPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ProjectsPage from '@/pages/ProjectsPage'
import ProjectDetailsPage from '@/pages/ProjectDetailsPage'

// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminUsers from '@/pages/admin/AdminUsers'
import AdminEvents from '@/pages/admin/AdminEvents'

const queryClient = new QueryClient()

function App() {
  const { token, user } = useAuthStore()

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailsPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailsPage />} />
            <Route path="/hackathons" element={<EventsPage filterType="hackathon" />} />
            <Route path="/workshops" element={<EventsPage filterType="workshop" />} />
            <Route path="/meetups" element={<EventsPage filterType="meetup" />} />
            <Route path="/competitions" element={<EventsPage filterType="competition" />} />
          </Route>

          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected student routes */}
          {token && user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN' ? (
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>
          ) : null}

          {/* Admin routes */}
          {token && (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') ? (
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/events" element={<AdminEvents />} />
            </Route>
          ) : null}

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App
