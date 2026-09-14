import Link from "next/link";
import { Sparkles, Shield, Trophy, Globe, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[#252525] bg-[#000000] text-[#A1A1A1]">
      <div className="magizh-container py-16">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded border border-[#D4AF37]/50 bg-[#0A0A0A] text-[#D4AF37] font-mono text-base font-bold">
                M
              </div>
              <div>
                <span className="text-sm font-bold uppercase tracking-[0.25em] text-[#F5F3ED]">
                  MAGIZH
                </span>
                <span className="block text-[9px] uppercase tracking-[0.3em] text-[#D4AF37]">
                  TECHNOLOGIES
                </span>
              </div>
            </div>

            <p className="max-w-md text-xs leading-relaxed text-[#A1A1A1]">
              The official innovation and student competition ecosystem of Magizh Technologies. One permanent verified student identity. Year-round opportunities to build, compete, and showcase.
            </p>

            <div className="flex items-center gap-4 text-xs font-mono text-[#D4AF37]">
              <span>● SYSTEM ACTIVE</span>
              <span>•</span>
              <span>MZ-INNOVATION-v2.0</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#F5F3ED]">
              Ecosystem
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li>
                <Link href="/events" className="transition hover:text-[#D4AF37]">
                  All Events
                </Link>
              </li>
              <li>
                <Link href="/events?status=LIVE" className="transition hover:text-[#D4AF37]">
                  Live Hackathons
                </Link>
              </li>
              <li>
                <Link href="/projects" className="transition hover:text-[#D4AF37]">
                  Project Showcase
                </Link>
              </li>
              <li>
                <Link href="/certificates" className="transition hover:text-[#D4AF37]">
                  Certificates & Awards
                </Link>
              </li>
            </ul>
          </div>

          {/* Student Hub */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#F5F3ED]">
              Student Hub
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li>
                <Link href="/dashboard" className="transition hover:text-[#D4AF37]">
                  Student Dashboard
                </Link>
              </li>
              <li>
                <Link href="/my-id" className="transition hover:text-[#D4AF37]">
                  Magizh Student ID
                </Link>
              </li>
              <li>
                <Link href="/profile" className="transition hover:text-[#D4AF37]">
                  Profile Verification
                </Link>
              </li>
              <li>
                <Link href="/register" className="transition hover:text-[#D4AF37]">
                  Join Ecosystem
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-[#252525] pt-8 text-xs text-[#A1A1A1]/60">
          <p>© {new Date().getFullYear()} Magizh Technologies. All rights reserved.</p>
          <p className="font-mono text-[10px] tracking-widest text-[#D4AF37]/80">
            WHERE STUDENT IDEAS BECOME REALITY.
          </p>
        </div>
      </div>
    </footer>
  );
}
