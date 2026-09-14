"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, ExternalLink, ShieldCheck, Download, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "@/providers/auth-provider";
import { getMyProfile } from "@/lib/profile-api";
import type { Profile } from "@/types/auth";
import { StudentIdCard } from "./student-id-card";

interface StudentIdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StudentIdModal({ isOpen, onClose }: StudentIdModalProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      getMyProfile()
        .then(setProfile)
        .catch(() => {
          // fallback to user embedded profile
        });
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-lg rounded-2xl border border-[#252525] bg-[#0A0A0A] p-6 shadow-2xl"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 rounded-full border border-[#252525] bg-[#111114] p-2 text-[#A1A1A1] transition hover:border-[#D4AF37] hover:text-[#F5F3ED]"
          >
            <X size={18} />
          </button>

          <div className="mb-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">
              MAGIZH PASSPORT
            </span>
            <h2 className="magizh-heading mt-1 text-2xl font-bold text-[#F5F3ED]">
              Digital Student ID
            </h2>
          </div>

          {/* Physical ID Card Replica */}
          <div className="flex justify-center my-4">
            <StudentIdCard user={user} profile={profile} />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#252525] pt-4">
            <div className="text-xs text-[#A1A1A1]">
              Permanent ID for all Magizh Hackathons & Events.
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/my-id"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 rounded border border-[#D4AF37]/50 bg-[#D4AF37]/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-black"
              >
                Full ID Page <ExternalLink size={13} />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
