"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  X,
  ShieldCheck,
  Calendar,
  Users,
  MapPin,
  Sparkles,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "@/providers/auth-provider";
import { registerForEvent } from "@/lib/registrations-api";
import { getErrorMessage } from "@/lib/error-message";
import { formatStudentId } from "@/components/ui/student-id-card";
import { HackerSnakeLoader } from "@/components/loading";
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
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const studentId = formatStudentId(user?.id);
  const fullName = user?.profile?.full_name || user?.email?.split("@")[0] || "Student";
  const college = user?.profile?.college || "Magizh Scholar";

  async function handleConfirmRegistration() {
    setIsSubmitting(true);
    setError("");

    try {
      await registerForEvent(event.id);
      setStep(4); // Success step
      onSuccess();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to complete registration for this event."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg rounded-2xl border border-[#252525] bg-[#0A0A0A] p-6 md:p-8 shadow-2xl text-[#F5F3ED]"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 rounded-full border border-[#252525] bg-[#111114] p-1.5 text-[#A1A1A1] transition hover:border-[#D4AF37] hover:text-[#F5F3ED]"
          >
            <X size={16} />
          </button>

          {/* STEP 4: SUCCESS */}
          {step === 4 ? (
            <div className="text-center py-4">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#6FAF7B]/50 bg-[#6FAF7B]/10 text-[#6FAF7B]">
                <CheckCircle2 size={36} />
              </div>

              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#6FAF7B]">
                REGISTRATION CONFIRMED
              </span>

              <h2 className="magizh-heading mt-2 text-2xl font-bold md:text-3xl">
                You&apos;re In the Challenge!
              </h2>

              <p className="magizh-muted mx-auto mt-3 max-w-sm text-xs leading-relaxed">
                Your entry for <strong className="text-[#F5F3ED]">{event.title}</strong> has been officially confirmed under your Magizh Student ID.
              </p>

              <div className="mt-6 rounded-lg border border-[#252525] bg-[#000000] p-4 text-xs space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-[#A1A1A1]">Scholar:</span>
                  <span className="font-bold text-[#F5F3ED]">{fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A1A1A1]">Magizh ID:</span>
                  <span className="font-mono font-bold text-[#D4AF37]">{studentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A1A1A1]">Next Step:</span>
                  <span className="text-[#6FAF7B] font-semibold">Join or Create Event Team</span>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href={`/events/${event.id}/teams`}
                  onClick={onClose}
                  className="flex-1 rounded bg-[#D4AF37] py-2.5 text-center text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[#E5C04A]"
                >
                  Find / Create Team
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded border border-[#252525] bg-[#0A0A0A] py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-[#F5F3ED] hover:border-[#D4AF37]"
                >
                  View Event Page
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Stepper Header */}
              <div className="border-b border-[#252525] pb-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#D4AF37]">
                    STEP {step} OF 3
                  </span>
                  <span className="text-xs text-[#A1A1A1]">
                    {step === 1 && "Identity Verification"}
                    {step === 2 && "Event Parameters"}
                    {step === 3 && "Final Confirmation"}
                  </span>
                </div>
                <h3 className="magizh-heading mt-2 text-xl font-bold">
                  {step === 1 && "1. Your Magizh Identity"}
                  {step === 2 && "2. Event Guidelines"}
                  {step === 3 && "3. Confirm Registration"}
                </h3>
              </div>

              {/* STEP 1: IDENTITY */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-[#D4AF37]/30 bg-[#000000] p-5">
                    <div className="flex items-center justify-between border-b border-[#252525] pb-3">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-[#A1A1A1]">PASSPORT</span>
                        <h4 className="font-bold text-[#F5F3ED]">{fullName}</h4>
                      </div>
                      <span className="rounded-full bg-[#6FAF7B]/10 px-2 py-0.5 text-[9px] font-bold text-[#6FAF7B]">
                        ✓ VERIFIED
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-[#A1A1A1]">MAGIZH ID:</span>
                        <p className="font-mono font-bold text-[#D4AF37]">{studentId}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#A1A1A1]">COLLEGE:</span>
                        <p className="truncate text-[#F5F3ED]">{college}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#A1A1A1] leading-relaxed">
                    You are registering using your permanent Magizh Scholar profile. No duplicate profile required.
                  </p>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded bg-[#D4AF37] py-3 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[#E5C04A]"
                  >
                    Proceed to Event Details <ArrowRight size={13} />
                  </button>
                </div>
              )}

              {/* STEP 2: EVENT GUIDELINES */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-[#252525] bg-[#000000] p-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#A1A1A1]">Challenge Title:</span>
                      <span className="font-bold text-[#F5F3ED]">{event.title}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#A1A1A1]">Event Mode:</span>
                      <span className="font-mono text-[#D4AF37]">{event.mode}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#A1A1A1]">Team Requirements:</span>
                      <span className="text-[#F5F3ED]">{event.team_size_min} - {event.team_size_max} Members</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#A1A1A1]">Registration Deadline:</span>
                      <span className="text-[#F5F3ED]">
                        {event.registration_deadline ? new Date(event.registration_deadline).toLocaleDateString() : "Standard"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="rounded border border-[#252525] bg-[#0A0A0A] px-4 py-2.5 text-xs font-semibold uppercase text-[#A1A1A1] hover:text-[#F5F3ED]"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="flex-1 rounded bg-[#D4AF37] py-2.5 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[#E5C04A]"
                    >
                      Review & Confirm
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: FINAL CONFIRMATION */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/5 p-4 text-xs leading-relaxed text-[#F5F3ED]">
                    By confirming, you commit to upholding the Magizh Technologies Student Code of Conduct and originality standards.
                  </div>

                  {error && (
                    <div className="rounded border border-[#C75C5C]/40 bg-[#C75C5C]/10 p-3 text-xs text-[#C75C5C]">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setStep(2)}
                      className="rounded border border-[#252525] bg-[#0A0A0A] px-4 py-2.5 text-xs font-semibold uppercase text-[#A1A1A1] hover:text-[#F5F3ED]"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleConfirmRegistration}
                      className="flex-1 flex items-center justify-center gap-2 rounded bg-[#D4AF37] py-3 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[#E5C04A] disabled:opacity-50"
                    >
                      {isSubmitting ? "Authenticating Entry..." : "Confirm Registration"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
