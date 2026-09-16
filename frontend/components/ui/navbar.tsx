"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Award,
  Calendar,
  FolderGit2,
  Home,
  IdCard,
  Loader2,
  LogIn,
  LogOut,
  Radio,
  Shield,
  Sparkles,
  Trophy,
  User,
} from "lucide-react";

import { useAuth } from "@/providers/auth-provider";
import { MagizhIdModal } from "@/components/student/MagizhIdModal";
import {
  FloatingDockDesktop,
  FloatingDockMobile,
  type FloatingDockItem,
} from "@/components/ui/floating-dock";

export function Navbar() {
  const pathname = usePathname();
  const { user, status, logout } = useAuth();
  const [idModalOpen, setIdModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isAuthenticated = status === "authenticated" && !!user;
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
      window.location.href = "/";
    } finally {
      setIsLoggingOut(false);
    }
  }

  const dockItems: FloatingDockItem[] = isAuthenticated
    ? [
        {
          title: "Home",
          href: "/dashboard",
          icon: <Home size={18} />,
          active: pathname === "/dashboard",
        },
        {
          title: "Events",
          href: "/events",
          icon: <Calendar size={18} />,
          active:
            pathname === "/events" ||
            (pathname.startsWith("/events/") && !pathname.includes("/dashboard")),
        },
        {
          title: "Competitions",
          href: "/dashboard/events",
          icon: <Trophy size={18} />,
          active: pathname === "/dashboard/events",
        },
        {
          title: "Projects",
          href: "/dashboard/projects",
          icon: <FolderGit2 size={18} />,
          active:
            pathname.startsWith("/dashboard/projects") ||
            pathname.startsWith("/projects"),
        },
        {
          title: "Certificates",
          href: "/certificates",
          icon: <Award size={18} />,
          active: pathname.startsWith("/certificates"),
        },
        {
          title: "ID Card",
          onClick: () => setIdModalOpen(true),
          icon: <IdCard size={18} className="text-[#D4AF37]" />,
          active: idModalOpen,
        },
        {
          title: "Profile",
          href: "/profile",
          icon: <User size={18} />,
          active: pathname === "/profile",
        },
        ...(isAdmin
          ? [
              {
                title: "Admin",
                href: "/admin",
                icon: <Shield size={18} className="text-[#D4AF37]" />,
                active: pathname.startsWith("/admin"),
              },
            ]
          : []),
        {
          title: "Sign Out",
          onClick: handleLogout,
          icon: <LogOut size={18} className="text-[#C75C5C]" />,
        },
      ]
    : [
        {
          title: "Home",
          href: "/",
          icon: <Home size={18} />,
          active: pathname === "/",
        },
        {
          title: "Events",
          href: "/events",
          icon: <Calendar size={18} />,
          active: pathname === "/events",
        },
        {
          title: "Live",
          href: "/events?status=LIVE",
          icon: <Radio size={18} className="text-[#6FAF7B]" />,
          active: pathname === "/events?status=LIVE",
        },
        {
          title: "Projects",
          href: "/projects",
          icon: <FolderGit2 size={18} />,
          active: pathname.startsWith("/projects"),
        },
        {
          title: "Sign In",
          href: "/login",
          icon: <LogIn size={18} />,
          active: pathname === "/login",
        },
        {
          title: "Join Magizh",
          href: "/register",
          icon: <Sparkles size={18} className="text-[#D4AF37]" />,
          active: pathname === "/register",
        },
      ];

  return (
    <>
      {isLoggingOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-[#A1A1A1]">
            <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37]" />
            Signing out...
          </div>
        </div>
      )}

      {/* FLOATING DOCK NAVIGATION */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 hidden lg:block pointer-events-auto">
        <FloatingDockDesktop items={dockItems} />
      </div>

      <div className="fixed bottom-6 right-6 z-40 block lg:hidden pointer-events-auto">
        <FloatingDockMobile items={dockItems} />
      </div>

      {/* STUDENT ID POPUP MODAL */}
      <MagizhIdModal isOpen={idModalOpen} onClose={() => setIdModalOpen(false)} />
    </>
  );
}
