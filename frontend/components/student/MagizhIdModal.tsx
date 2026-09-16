"use client";

import { useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/providers/auth-provider";
import { getMyProfile } from "@/lib/profile-api";
import type { Profile } from "@/types/auth";
import { MagizhIdCard } from "./MagizhIdCard";

export interface MagizhIdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MagizhIdModal({ isOpen, onClose }: MagizhIdModalProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  // Load fresh profile data when modal opens
  useEffect(() => {
    if (isOpen && user) {
      getMyProfile()
        .then(setProfile)
        .catch(() => {
          // Fallback to cached auth user profile
        });
    }
  }, [isOpen, user]);

  // Handle ESC key listener
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Magizh Student ID Modal"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="relative my-auto flex flex-col items-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute -top-12 right-0 sm:-right-12 flex h-9 w-9 items-center justify-center rounded-full border border-[#252525] bg-[#0A0A0A] text-[#A1A1A1] transition-colors hover:border-[#D4AF37] hover:text-[#F5F3ED]"
            aria-label="Close Magizh ID modal"
          >
            <X size={18} />
          </button>

          {/* Full Magizh ID Card */}
          <MagizhIdCard
            user={user}
            profile={profile}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
