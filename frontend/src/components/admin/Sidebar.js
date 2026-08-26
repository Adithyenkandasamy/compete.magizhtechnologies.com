import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
export default function Sidebar() {
    const location = useLocation();
    const { logout } = useAuthStore();
    const isActive = (path) => location.pathname === path;
    const menuItems = [
        { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/users', label: 'Users', icon: Users },
        { path: '/admin/events', label: 'Events', icon: Calendar },
    ];
    return (_jsxs("aside", { className: "w-64 bg-surface border-r border-border h-screen flex flex-col", children: [_jsx("div", { className: "p-6 border-b border-border", children: _jsxs(Link, { to: "/", className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg" }), _jsx("span", { className: "font-bold text-text", children: "Comp Admin" })] }) }), _jsx("nav", { className: "flex-1 p-4 space-y-2", children: menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (_jsxs(Link, { to: item.path, className: `flex items-center space-x-3 px-4 py-2 rounded-lg transition ${active
                            ? 'bg-primary text-surface'
                            : 'text-muted hover:bg-card'}`, children: [_jsx(Icon, { size: 20 }), _jsx("span", { children: item.label })] }, item.path));
                }) }), _jsx("div", { className: "p-4 border-t border-border", children: _jsxs("button", { onClick: logout, className: "w-full flex items-center space-x-3 px-4 py-2 text-danger hover:bg-card rounded-lg transition", children: [_jsx(LogOut, { size: 20 }), _jsx("span", { children: "Logout" })] }) })] }));
}
