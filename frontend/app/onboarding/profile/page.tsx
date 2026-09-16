"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, ShieldCheck } from "lucide-react";

import { useAuth } from "@/providers/auth-provider";
import { getMyProfile, updateMyProfile, isProfileComplete } from "@/lib/profile-api";
import { getErrorMessage } from "@/lib/error-message";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { PhoneInput } from "@/components/ui/phone-input";

export default function OnboardingProfilePage() {
  const router = useRouter();
  const { user, status } = useAuth();

  // Required Fields
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("1");

  // Optional Fields
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?redirect=/onboarding/profile");
      return;
    }

    if (status === "authenticated") {
      getMyProfile()
        .then((data) => {
          if (data) {
            setFullName(data.full_name || user?.profile?.full_name || "");
            setDateOfBirth(data.date_of_birth || "");
            setPhone(data.phone || "");
            setCollege(data.college || "");
            setDepartment(data.department || "");
            setYear(data.year ? String(data.year) : "1");
            setBio(data.bio || "");
            setSkills(data.skills?.join(", ") || "");
            setLinkedinUrl(data.linkedin_url || "");
            setGithubUrl(data.github_url || "");
            setPortfolioUrl(data.portfolio_url || "");

            // If profile is already complete, don't force them here!
            if (isProfileComplete(data)) {
              router.replace("/dashboard");
            }
          }
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [status, user, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your Full Name.");
      return;
    }
    if (!dateOfBirth.trim()) {
      setError("Please select your Date of Birth.");
      return;
    }
    if (!phone.trim() || phone.replace(/[^0-9]/g, "").length < 7) {
      setError("Please enter a valid Phone Number.");
      return;
    }
    if (!college.trim()) {
      setError("Please enter your College name.");
      return;
    }
    if (!department.trim()) {
      setError("Please enter your Department.");
      return;
    }

    setIsSaving(true);

    try {
      await updateMyProfile({
        full_name: fullName.trim(),
        date_of_birth: dateOfBirth.trim(),
        phone: phone.trim(),
        college: college.trim(),
        department: department.trim(),
        year: year ? Number(year) : 1,
        bio: bio.trim() || null,
        skills: skills
          ? skills
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        linkedin_url: linkedinUrl.trim() || null,
        github_url: githubUrl.trim() || null,
        portfolio_url: portfolioUrl.trim() || null,
      });

      // Redirect to dashboard or redirect parameter
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect") || "/dashboard";
      router.replace(redirect);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to save profile. Please check all fields."));
      setIsSaving(false);
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-black text-[#F5F3ED] flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-[#A1A1A1]">
            <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37]" />
            Loading profile...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#F5F3ED] flex flex-col">
      <Navbar />

      <main className="flex-1 py-12 md:py-20">
        <div className="magizh-container max-w-2xl">
          {/* Header */}
          <div className="mb-10 text-center sm:text-left border-b border-[#252525] pb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
              <ShieldCheck size={13} />
              STUDENT PROFILE ONBOARDING
            </div>

            <h1 className="magizh-heading mt-4 text-3xl font-bold tracking-tight sm:text-4xl text-[#F5F3ED]">
              Complete Your Student Identity
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-[#A1A1A1]">
              Your student profile is created once and permanently assigned a unique Magizh Student ID.
              This identity will be automatically reused across all Magizh hackathons, teams, and official credentials.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="rounded-lg border border-[#C75C5C]/50 bg-[#C75C5C]/10 px-4 py-3 text-sm text-[#C75C5C]">
                {error}
              </div>
            )}

            {/* SECTION: REQUIRED FIELDS */}
            <div className="space-y-5">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                Required Information
              </h2>

              <div>
                <label htmlFor="fullName" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#A1A1A1]">
                  Full Name <span className="text-[#D4AF37]">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Adithyen Kandasamy"
                  className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="dateOfBirth" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#A1A1A1]">
                    Date of Birth <span className="text-[#D4AF37]">*</span>
                  </label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#A1A1A1]">
                    Phone Number <span className="text-[#D4AF37]">*</span>
                  </label>
                  <PhoneInput
                    id="phone"
                    required
                    value={phone}
                    onChange={setPhone}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="college" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#A1A1A1]">
                  College / Institution <span className="text-[#D4AF37]">*</span>
                </label>
                <input
                  id="college"
                  type="text"
                  required
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. SNS College of Engineering"
                  className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="department" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#A1A1A1]">
                    Department <span className="text-[#D4AF37]">*</span>
                  </label>
                  <input
                    id="department"
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Science & Engineering"
                    className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label htmlFor="year" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#A1A1A1]">
                    Year of Study <span className="text-[#D4AF37]">*</span>
                  </label>
                  <select
                    id="year"
                    required
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                    <option value="5">5th Year (Dual/Integrated)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION: OPTIONAL FIELDS */}
            <div className="space-y-5 border-t border-[#252525] pt-8">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#A1A1A1]">
                Optional Information
              </h2>

              <div>
                <label htmlFor="bio" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#A1A1A1]">
                  Bio / About Yourself
                </label>
                <textarea
                  id="bio"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us a little about your interests and focus areas..."
                  className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label htmlFor="skills" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#A1A1A1]">
                  Skills (comma separated)
                </label>
                <input
                  id="skills"
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. React, Next.js, Python, FastAPI, Machine Learning"
                  className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <div>
                  <label htmlFor="linkedinUrl" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#A1A1A1]">
                    LinkedIn
                  </label>
                  <input
                    id="linkedinUrl"
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label htmlFor="githubUrl" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#A1A1A1]">
                    GitHub
                  </label>
                  <input
                    id="githubUrl"
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label htmlFor="portfolioUrl" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#A1A1A1]">
                    Portfolio
                  </label>
                  <input
                    id="portfolioUrl"
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://yourportfolio.dev"
                    className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex w-full items-center justify-center gap-2 rounded bg-[#D4AF37] py-4 text-xs font-bold uppercase tracking-[0.2em] text-black transition hover:bg-[#E5C04A] disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    SAVING...
                  </>
                ) : (
                  <>
                    SAVE PROFILE & ASSIGN MAGIZH ID <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
