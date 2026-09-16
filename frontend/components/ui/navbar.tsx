"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Calendar,
  Compass,
  FileText,
  IdCard,
  LogOut,
  Menu,
  Sparkles,
  Trophy,
  User,
  Users,
  X,
  Shield,
} from "lucide-react";

import { useAuth } from "@/providers/auth-provider";
import { MagizhIdModal } from "@/components/student/MagizhIdModal";
import { Loader2 } from "lucide-react";

type NavLink = {
  href: string;
  label: string;
  live?: boolean;
};

export function Navbar() {
  const pathname = usePathname();
  const { user, status, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // Public Links
  const publicNavLinks: NavLink[] = [
    { href: "/events", label: "Events" },
    { href: "/events?status=LIVE", label: "Live", live: true },
    { href: "/projects", label: "Projects" },
  ];

  // Student Links
  const studentNavLinks: NavLink[] = [
    { href: "/dashboard", label: "Home" },
    { href: "/events", label: "Events" },
    { href: "/dashboard/events", label: "My Events" },
    { href: "/dashboard/teams", label: "My Teams" },
    { href: "/dashboard/projects", label: "My Projects" },
    { href: "/certificates", label: "Certificates" },
  ];

  const currentLinks = isAuthenticated ? studentNavLinks : publicNavLinks;

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

      <header className="sticky top-0 z-40 w-full border-b border-[#252525] bg-[#000000]/90 backdrop-blur-md">
        <div className="magizh-container flex h-20 items-center justify-between">
          {/* BRAND */}
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded border border-[#D4AF37]/40 bg-[#0A0A0A] text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.15)] transition-all group-hover:border-[#D4AF37] group-hover:bg-[#D4AF37]/10">
              <span className="font-mono text-base font-bold tracking-tighter">M</span>
            </div>
            <div>
              <div className="text-sm font-bold uppercase tracking-[0.28em] text-[#F5F3ED]">
                MAGIZH
              </div>
              <div className="text-[9px] uppercase tracking-[0.32em] text-[#D4AF37]">
                INNOVATION PLATFORM
              </div>
            </div>
          </Link>

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden items-center gap-6 lg:flex">
            {currentLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative text-xs uppercase tracking-[0.16em] transition-colors ${
                    isActive
                      ? "font-semibold text-[#D4AF37]"
                      : "text-[#A1A1A1] hover:text-[#F5F3ED]"
                  }`}
                >
                  {link.label}
                  {link.live && (
                    <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#6FAF7B] animate-pulse" />
                  )}
                  {isActive && (
                    <span className="absolute -bottom-2 left-0 right-0 h-[2px] bg-[#D4AF37]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ACTIONS */}
          <div className="hidden items-center gap-4 lg:flex">
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 rounded border border-[#D4AF37]/50 bg-[#D4AF37]/10 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-black"
                  >
                    <Shield size={13} />
                    Command Center
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => setIdModalOpen(true)}
                  className="flex items-center gap-1.5 rounded border border-[#252525] bg-[#0A0A0A] px-3.5 py-2 text-xs font-medium uppercase tracking-[0.15em] text-[#F5F3ED] transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
                >
                  <IdCard size={14} className="text-[#D4AF37]" />
                  My Magizh ID
                </button>

                <Link
                  href="/profile"
                  className="flex items-center gap-1.5 rounded border border-[#252525] bg-[#0A0A0A] px-3.5 py-2 text-xs font-medium uppercase tracking-[0.15em] text-[#A1A1A1] transition hover:border-[#D4AF37] hover:text-[#F5F3ED]"
                >
                  <User size={14} />
                  Profile
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded p-2 text-[#A1A1A1] transition hover:text-[#C75C5C]"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#A1A1A1] transition hover:text-[#F5F3ED]"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded bg-[#D4AF37] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-[#E5C04A]"
                >
                  Join Magizh
                </Link>
              </>
            )}
          </div>

          {/* MOBILE MENU TOGGLE */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#A1A1A1] transition hover:text-[#F5F3ED] lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <div className="border-b border-[#252525] bg-[#0A0A0A] px-5 py-6 lg:hidden">
            <nav className="flex flex-col gap-4">
              {currentLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-sm uppercase tracking-[0.16em] ${
                      isActive ? "font-bold text-[#D4AF37]" : "text-[#A1A1A1]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              <div className="mt-4 flex flex-col gap-3 border-t border-[#252525] pt-4">
                {isAuthenticated ? (
                  <>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[#D4AF37]"
                      >
                        <Shield size={16} /> Command Center
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setIdModalOpen(true);
                      }}
                      className="flex items-center gap-2 text-left text-sm uppercase tracking-wider text-[#F5F3ED]"
                    >
                      <IdCard size={16} className="text-[#D4AF37]" /> View My Magizh ID
                    </button>
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 text-sm uppercase tracking-wider text-[#A1A1A1]"
                    >
                      <User size={16} /> Profile
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-2 text-left text-sm uppercase tracking-wider text-[#C75C5C]"
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-center text-sm uppercase tracking-wider text-[#A1A1A1]"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded bg-[#D4AF37] py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-black"
                    >
                      Join Magizh
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* STUDENT ID POPUP MODAL */}
      <StudentIdModal isOpen={idModalOpen} onClose={() => setIdModalOpen(false)} />
    </>
  );
}
