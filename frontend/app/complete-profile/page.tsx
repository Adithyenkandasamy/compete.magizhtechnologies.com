"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Sparkles, User, Building2, GraduationCap, Phone, Code, ArrowRight } from "lucide-react";

import { useAuth } from "@/providers/auth-provider";
import { getMyProfile, updateMyProfile } from "@/lib/profile-api";
import { getErrorMessage } from "@/lib/error-message";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { CircularHudLoader, LoadingButton } from "@/components/loading";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, status } = useAuth();

  const [fullName, setFullName] = useState("");
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("1");
  const [phone, setPhone] = useState("");
  const [skills, setSkills] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?redirect=/complete-profile");
      return;
    }

    if (status === "authenticated") {
      getMyProfile()
        .then((data) => {
          if (data) {
            setFullName(data.full_name || user?.profile?.full_name || "");
            setCollege(data.college || "");
            setDepartment(data.department || "");
            setYear(data.year ? String(data.year) : "1");
            setPhone(data.phone || "");
            setSkills(data.skills?.join(", ") || "");
            setBio(data.bio || "");
            setAvatarUrl(data.avatar_url || "");
          }
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [status, user, router]);

  // Calculate completion percentage based on core fields
  const fields = [
    Boolean(fullName.trim()),
    Boolean(college.trim()),
    Boolean(department.trim()),
    Boolean(year),
    Boolean(phone.trim()),
    Boolean(skills.trim()),
  ];
  const completedCount = fields.filter(Boolean).length;
  const progressPercent = Math.round((completedCount / fields.length) * 100);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      await updateMyProfile({
        full_name: fullName.trim(),
        college: college.trim() || null,
        department: department.trim() || null,
        year: year ? Number(year) : null,
        phone: phone.trim() || null,
        skills: skills
          ? skills
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      });

      setIsVerified(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to complete profile verification."));
    } finally {
      setIsSaving(false);
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <CircularHudLoader mode="session" message="CHECKING IDENTITY RECORD..." />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#F5F3ED] flex flex-col">
      <Navbar />

      <main className="flex-1 magizh-container py-12 md:py-16">
        <div className="mx-auto max-w-2xl">
          {isVerified ? (
            <div className="magizh-card p-10 text-center shadow-[0_0_50px_rgba(111,175,123,0.1)]">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#6FAF7B]/50 bg-[#6FAF7B]/10 text-[#6FAF7B]">
                <CheckCircle2 size={36} />
              </div>

              <span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-[#6FAF7B]">
                IDENTITY VERIFIED
              </span>

              <h1 className="magizh-heading mt-3 text-3xl font-bold md:text-4xl">
                Welcome to Magizh Innovation
              </h1>

              <p className="magizh-muted mx-auto mt-3 max-w-md text-sm leading-relaxed">
                Your Magizh Student ID has been minted and permanently activated. You can now register for all active and upcoming hackathons.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="w-full sm:w-auto rounded bg-[#D4AF37] px-8 py-3 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[#E5C04A]"
                >
                  Continue to Magizh Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/my-id")}
                  className="w-full sm:w-auto rounded border border-[#252525] bg-[#0A0A0A] px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#F5F3ED] hover:border-[#D4AF37]"
                >
                  View My Magizh ID
                </button>
              </div>
            </div>
          ) : (
            <div className="magizh-card p-8 md:p-10">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-[#D4AF37]">
                  <Sparkles size={12} />
                  WELCOME TO MAGIZH
                </div>

                <h1 className="magizh-heading mt-4 text-3xl font-bold md:text-4xl">
                  Complete Your Student Profile
                </h1>

                <p className="magizh-muted mt-2 text-xs">
                  Fill in your academic profile once. It will be attached permanently to your Magizh Student ID.
                </p>

                {/* Progress Bar */}
                <div className="mt-6">
                  <div className="flex justify-between text-xs font-mono text-[#A1A1A1]">
                    <span>COMPLETION STATUS</span>
                    <span className="text-[#D4AF37] font-bold">{progressPercent}%</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#1A1A1A]">
                    <div
                      className="h-full bg-gradient-to-r from-[#D4AF37] to-[#E5C04A] transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div>
                  <label htmlFor="fullName" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#A1A1A1]">
                    Full Name *
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your official full name"
                    className="w-full rounded border border-[#252525] bg-[#000000] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="college" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#A1A1A1]">
                      College / Institution *
                    </label>
                    <input
                      id="college"
                      type="text"
                      required
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      placeholder="e.g. Anna University"
                      className="w-full rounded border border-[#252525] bg-[#000000] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label htmlFor="department" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#A1A1A1]">
                      Department / Major *
                    </label>
                    <input
                      id="department"
                      type="text"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Computer Science"
                      className="w-full rounded border border-[#252525] bg-[#000000] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="year" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#A1A1A1]">
                      Year of Study *
                    </label>
                    <select
                      id="year"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full rounded border border-[#252525] bg-[#000000] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
                    >
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                      <option value="5">5th Year (Postgrad / Dual)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="phone" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#A1A1A1]">
                      Phone Number *
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full rounded border border-[#252525] bg-[#000000] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="skills" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#A1A1A1]">
                    Skills & Technologies * (comma separated)
                  </label>
                  <input
                    id="skills"
                    type="text"
                    required
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="Python, React, FastApi, Machine Learning, UI/UX"
                    className="w-full rounded border border-[#252525] bg-[#000000] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label htmlFor="bio" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#A1A1A1]">
                    Short Bio (optional)
                  </label>
                  <textarea
                    id="bio"
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Passionate student developer interested in AI and cloud systems..."
                    className="w-full resize-none rounded border border-[#252525] bg-[#000000] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
                  />
                </div>

                {error && (
                  <div className="rounded border border-[#C75C5C]/40 bg-[#C75C5C]/10 p-3 text-xs text-[#C75C5C]">
                    {error}
                  </div>
                )}

                <LoadingButton
                  type="submit"
                  disabled={isSaving}
                  loading={isSaving}
                  loadingText="Verifying Identity..."
                  className="w-full py-3.5 text-xs font-bold uppercase tracking-widest"
                >
                  Verify & Activate Magizh Identity
                </LoadingButton>
              </form>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
