"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  X,
  ShieldCheck,
  Loader2,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "@/providers/auth-provider";
import { getMyProfile, isProfileComplete } from "@/lib/profile-api";
import { registerForEvent } from "@/lib/registrations-api";
import { getErrorMessage } from "@/lib/error-message";
import { formatMagizhStudentId, formatDateOfBirth } from "@/lib/student-id";
import type { Profile } from "@/types/auth";
import type { Event } from "@/types/events";

interface RegistrationModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EventRegistrationModal({
  event,
  isOpen,
  onClose,
  onSuccess,
}: RegistrationModalProps) {
  const { user } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && user) {
      setLoadingProfile(true);
      setError("");
      setIsSuccess(false);

      getMyProfile()
        .then((data) => {
          setProfile(data);
        })
        .catch(() => {
          // Fallback to user auth profile
        })
        .finally(() => {
          setLoadingProfile(false);
        });
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const fullName = (
    profile?.full_name ||
    user?.profile?.full_name ||
    "Magizh Student"
  ).toUpperCase();

  const studentId = formatMagizhStudentId(
    profile?.magizh_student_id,
    user?.id,
  );

  const dateOfBirth = formatDateOfBirth(
    profile?.date_of_birth || user?.profile?.date_of_birth,
  );

  const college = (
    profile?.college ||
    user?.profile?.college ||
    "SNS COLLEGE OF ENGINEERING"
  ).toUpperCase();

  const department = (
    profile?.department ||
    user?.profile?.department ||
    "COMPUTER SCIENCE & ENGINEERING"
  ).toUpperCase();

  const yearNum = profile?.year || user?.profile?.year_of_study || 1;
  const yearSuffix = yearNum === 1 ? "1ST" : yearNum === 2 ? "2ND" : yearNum === 3 ? "3RD" : `${yearNum}TH`;
  const yearDisplay = `${yearSuffix} YEAR`;

  const profileComplete = isProfileComplete(profile);

  async function handleConfirmRegistration() {
    setIsSubmitting(true);
    setError("");

    try {
      await registerForEvent(event.id);
      setIsSuccess(true);
      onSuccess();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to complete registration for this event."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg rounded-2xl border border-[#252525] bg-[#0A0A0A] p-6 sm:p-8 shadow-2xl text-[#F5F3ED]"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 rounded-full border border-[#252525] bg-[#000000] p-1.5 text-[#A1A1A1] transition hover:border-[#D4AF37] hover:text-[#F5F3ED]"
          >
            <X size={16} />
          </button>

          {isSuccess ? (
            /* SUCCESS STATE */
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#6FAF7B]/40 bg-[#6FAF7B]/10 text-[#6FAF7B]">
                <CheckCircle2 size={32} />
              </div>

              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#6FAF7B]">
                REGISTRATION CONFIRMED
              </span>

              <h2 className="magizh-heading text-2xl font-bold">
                You&apos;re Registered!
              </h2>

              <p className="text-xs text-[#A1A1A1] max-w-sm mx-auto leading-relaxed">
                Your registration for <strong className="text-[#F5F3ED]">{event.title}</strong> has been secured under your permanent Magizh Student ID.
              </p>

              <div className="rounded-xl border border-[#252525] bg-[#000000] p-4 text-xs space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-[#A1A1A1]">Student:</span>
                  <span className="font-semibold text-[#F5F3ED]">{fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A1A1A1]">Magizh Student ID:</span>
                  <span className="font-mono font-bold text-[#D4AF37]">{studentId}</span>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <Link
                  href={`/events/${event.id}/teams`}
                  onClick={onClose}
                  className="flex-1 rounded bg-[#D4AF37] py-3 text-center text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[#E5C04A]"
                >
                  Find / Create Team
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded border border-[#252525] bg-[#0A0A0A] py-3 text-center text-xs font-semibold uppercase tracking-wider text-[#A1A1A1] hover:text-[#F5F3ED]"
                >
                  Done
                </button>
              </div>
            </div>
          ) : loadingProfile ? (
            <div className="py-16 text-center">
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#D4AF37]" />
              <p className="mt-3 text-xs uppercase tracking-widest text-[#A1A1A1]">
                Loading your Magizh identity...
              </p>
            </div>
          ) : (
            /* CONFIRMATION UI */
            <div className="space-y-6">
              {/* Header */}
              <div className="border-b border-[#252525] pb-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">
                  CONFIRM REGISTRATION
                </span>
                <h2 className="magizh-heading mt-2 text-2xl font-bold text-[#F5F3ED]">
                  Event Entry Verification
                </h2>
              </div>

              {/* Incomplete Profile Warning */}
              {!profileComplete && (
                <div className="rounded-lg border border-[#D4AF37]/50 bg-[#D4AF37]/10 p-4 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[#D4AF37]">
                    <AlertCircle size={15} />
                    <span>Incomplete Profile Information</span>
                  </div>
                  <p className="text-[#A1A1A1]">
                    Please complete your required student profile before registering for events.
                  </p>
                  <Link
                    href={`/onboarding/profile?redirect=/events/${event.id}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 font-semibold text-[#D4AF37] hover:underline"
                  >
                    Complete Profile Now <ArrowRight size={12} />
                  </Link>
                </div>
              )}

              {/* MAGIZH STUDENT IDENTITY SUMMARY */}
              <div className="rounded-xl border border-[#252525] bg-[#000000] p-5 text-left text-xs space-y-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
                    MAGIZH STUDENT
                  </p>
                  <h4 className="magizh-heading mt-1 text-lg font-bold text-[#F5F3ED]">
                    {fullName}
                  </h4>
                  <span className="font-mono text-xs font-bold text-[#D4AF37]">
                    {studentId}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-[#252525] pt-3">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-[#A1A1A1]">
                      DATE OF BIRTH
                    </p>
                    <p className="mt-0.5 font-mono text-[#F5F3ED]">
                      {dateOfBirth}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-[#A1A1A1]">
                      YEAR
                    </p>
                    <p className="mt-0.5 text-[#F5F3ED]">
                      {yearDisplay}
                    </p>
                  </div>
                </div>

                <div className="border-t border-[#252525] pt-3 space-y-2">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-[#A1A1A1]">
                      COLLEGE
                    </p>
                    <p className="mt-0.5 text-[#F5F3ED]">
                      {college}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-[#A1A1A1]">
                      DEPARTMENT
                    </p>
                    <p className="mt-0.5 text-[#F5F3ED]">
                      {department}
                    </p>
                  </div>
                </div>
              </div>

              {/* EVENT SUMMARY */}
              <div className="rounded-xl border border-[#252525] bg-[#000000] p-4 text-xs">
                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#A1A1A1]">
                  EVENT
                </p>
                <h4 className="mt-1 font-bold text-[#F5F3ED] text-sm">
                  {event.title.toUpperCase()}
                </h4>
                <p className="mt-1 font-mono text-[11px] text-[#A1A1A1]">
                  {event.event_type} · {event.team_size_max > 1 ? `TEAMS (${event.team_size_min}-${event.team_size_max})` : "INDIVIDUAL"}
                </p>
              </div>

              {error && (
                <div className="rounded border border-[#C75C5C]/40 bg-[#C75C5C]/10 px-4 py-3 text-xs text-[#C75C5C]">
                  {error}
                </div>
              )}

              {/* ACTION BUTTON */}
              <div>
                <button
                  type="button"
                  disabled={isSubmitting || !profileComplete}
                  onClick={handleConfirmRegistration}
                  className="flex w-full items-center justify-center gap-2 rounded bg-[#D4AF37] py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-black transition hover:bg-[#E5C04A] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      CONFIRMING...
                    </>
                  ) : (
                    "CONFIRM REGISTRATION"
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
