import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import Layout from '@/components/Layout';
import AdminLayout from '@/components/admin/AdminLayout';
// Pages
import HomePage from '@/pages/HomePage';
import EventsPage from '@/pages/EventsPage';
import EventDetailsPage from '@/pages/EventDetailsPage';
import DashboardPage from '@/pages/DashboardPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ProjectsPage from '@/pages/ProjectsPage';
import ProjectDetailsPage from '@/pages/ProjectDetailsPage';
// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminEvents from '@/pages/admin/AdminEvents';
const queryClient = new QueryClient();
function App() {
    const { token, user } = useAuthStore();
    return (_jsx(QueryClientProvider, { client: queryClient, children: _jsx(Router, { children: _jsxs(Routes, { children: [_jsxs(Route, { element: _jsx(Layout, {}), children: [_jsx(Route, { path: "/", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/events", element: _jsx(EventsPage, {}) }), _jsx(Route, { path: "/events/:id", element: _jsx(EventDetailsPage, {}) }), _jsx(Route, { path: "/projects", element: _jsx(ProjectsPage, {}) }), _jsx(Route, { path: "/projects/:id", element: _jsx(ProjectDetailsPage, {}) }), _jsx(Route, { path: "/hackathons", element: _jsx(EventsPage, { filterType: "hackathon" }) }), _jsx(Route, { path: "/workshops", element: _jsx(EventsPage, { filterType: "workshop" }) }), _jsx(Route, { path: "/meetups", element: _jsx(EventsPage, { filterType: "meetup" }) }), _jsx(Route, { path: "/competitions", element: _jsx(EventsPage, { filterType: "competition" }) })] }), _jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/register", element: _jsx(RegisterPage, {}) }), token && user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN' ? (_jsx(Route, { element: _jsx(Layout, {}), children: _jsx(Route, { path: "/dashboard", element: _jsx(DashboardPage, {}) }) })) : null, token && (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') ? (_jsxs(Route, { element: _jsx(AdminLayout, {}), children: [_jsx(Route, { path: "/admin", element: _jsx(AdminDashboard, {}) }), _jsx(Route, { path: "/admin/users", element: _jsx(AdminUsers, {}) }), _jsx(Route, { path: "/admin/events", element: _jsx(AdminEvents, {}) })] })) : null, _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }) }) }));
}
export default App;
