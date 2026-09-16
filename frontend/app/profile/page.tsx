"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, IdCard, Loader2, ShieldCheck, Trash2, User } from "lucide-react";

import { getMyProfile, updateMyProfile } from "@/lib/profile-api";
import { uploadUserAvatar, removeUserAvatar } from "@/lib/uploads-api";
import { useAuth } from "@/providers/auth-provider";
import type { Profile } from "@/types/auth";
import { getErrorMessage } from "@/lib/error-message";
import { formatMagizhStudentId, formatDateOfBirth } from "@/lib/student-id";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { MagizhIdModal } from "@/components/student/MagizhIdModal";
import { PhoneInput } from "@/components/ui/phone-input";

export default function ProfilePage() {
  const router = useRouter();
  const { user, status } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isIdModalOpen, setIsIdModalOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?redirect=/profile");
    }
  }, [status, router]);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getMyProfile();
        setProfile(data);
        setFullName(data.full_name || "");
        setDateOfBirth(data.date_of_birth || "");
        setCollege(data.college || "");
        setDepartment(data.department || "");
        setYear(data.year ? String(data.year) : "");
        setBio(data.bio || "");
        setSkills(data.skills?.join(", ") || "");
        setPhone(data.phone || "");
        setLinkedinUrl(data.linkedin_url || "");
        setGithubUrl(data.github_url || "");
        setPortfolioUrl(data.portfolio_url || "");
        setAvatarUrl(data.avatar_url || null);
      } catch {
        setError("Unable to load your profile.");
      } finally {
        setIsLoading(false);
      }
    }

    if (status === "authenticated") {
      loadProfile();
    }
  }, [status]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);
      setError("");
      setSuccess("");
      const res = await uploadUserAvatar(file);
      setAvatarUrl(res.avatar_url);
      if (profile) {
        setProfile({ ...profile, avatar_url: res.avatar_url });
      }
      setSuccess("Avatar compressed and uploaded to Cloudinary successfully.");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to upload avatar."));
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = "";
    }
  }

  async function handleAvatarRemove() {
    try {
      setIsUploadingAvatar(true);
      setError("");
      setSuccess("");
      await removeUserAvatar();
      setAvatarUrl(null);
      if (profile) {
        setProfile({ ...profile, avatar_url: null });
      }
      setSuccess("Avatar removed successfully.");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to remove avatar."));
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      const updatedProfile = await updateMyProfile({
        full_name: fullName.trim(),
        date_of_birth: dateOfBirth.trim() || null,
        college: college.trim() || null,
        department: department.trim() || null,
        year: year ? Number(year) : null,
        bio: bio.trim() || null,
        skills: skills
          ? skills
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        phone: phone.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        github_url: githubUrl.trim() || null,
        portfolio_url: portfolioUrl.trim() || null,
      });

      setProfile(updatedProfile);
      setSuccess("Profile updated successfully.");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to update your profile."));
    } finally {
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

  if (!user) return null;

  const studentId = formatMagizhStudentId(profile?.magizh_student_id, user.id);

  return (
    <div className="min-h-screen bg-black text-[#F5F3ED] flex flex-col">
      <Navbar />

      <main className="flex-1 magizh-container py-12 md:py-16">
        {/* HEADER */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 border-b border-[#252525] pb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
              STUDENT PROFILE
            </p>
            <h1 className="magizh-heading mt-2 text-3xl font-bold md:text-4xl">
              Your Student Identity
            </h1>
            <p className="mt-2 text-sm text-[#A1A1A1]">
              Manage your personal, academic, and credential details.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsIdModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-black"
          >
            <IdCard size={15} />
            VIEW MY MAGIZH ID
          </button>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
          {/* LEFT: EDITABLE FORM */}
          <section className="rounded-xl border border-[#252525] bg-[#0A0A0A] p-6 md:p-8">
            {/* AVATAR UPLOAD SECTION */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-6 border-b border-[#252525] pb-8">
              <div className="relative group">
                <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-[#D4AF37]/50 bg-[#151515] flex items-center justify-center shadow-lg shadow-[#D4AF37]/10">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={fullName || "User Avatar"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#1A1A1A] text-2xl font-bold text-[#D4AF37]">
                      {fullName ? fullName.charAt(0).toUpperCase() : <User className="h-10 w-10 text-[#D4AF37]" />}
                    </div>
                  )}
                </div>

                {isUploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/75">
                    <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
                  </div>
                )}
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#F5F3ED]">
                    Profile Avatar
                  </h3>
                  <span className="rounded bg-[#D4AF37]/10 px-2 py-0.5 text-[9px] font-semibold text-[#D4AF37] border border-[#D4AF37]/30">
                    Auto-Compressed via Cloudinary
                  </span>
                </div>
                <p className="text-xs text-[#A1A1A1]">
                  Upload your student photo. It will be compressed, auto-cropped to your face, and served via Cloudinary CDN.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-black">
                    <Camera size={13} />
                    <span>{avatarUrl ? "Change Photo" : "Upload Photo"}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleAvatarChange}
                      disabled={isUploadingAvatar}
                    />
                  </label>

                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={handleAvatarRemove}
                      disabled={isUploadingAvatar}
                      className="inline-flex items-center gap-1.5 rounded border border-[#C75C5C]/40 bg-[#C75C5C]/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#C75C5C] transition hover:bg-[#C75C5C] hover:text-white disabled:opacity-50"
                    >
                      <Trash2 size={13} />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="fullName" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#A1A1A1]">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full rounded border border-[#252525] bg-[#000000] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="dateOfBirth" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#A1A1A1]">
                    Date of Birth
                  </label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full rounded border border-[#252525] bg-[#000000] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#A1A1A1]">
                    Phone Number
                  </label>
                  <PhoneInput id="phone" value={phone} onChange={setPhone} />
                </div>
              </div>

              <div>
                <label htmlFor="college" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#A1A1A1]">
                  College
                </label>
                <input
                  id="college"
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full rounded border border-[#252525] bg-[#000000] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="department" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#A1A1A1]">
                    Department
                  </label>
                  <input
                    id="department"
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded border border-[#252525] bg-[#000000] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label htmlFor="year" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#A1A1A1]">
                    Year of Study
                  </label>
                  <input
                    id="year"
                    type="number"
                    min="1"
                    max="6"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full rounded border border-[#252525] bg-[#000000] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="bio" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#A1A1A1]">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded border border-[#252525] bg-[#000000] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
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
                  className="w-full rounded border border-[#252525] bg-[#000000] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-3 border-t border-[#252525] pt-6">
                <div>
                  <label htmlFor="linkedinUrl" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#A1A1A1]">
                    LinkedIn
                  </label>
                  <input
                    id="linkedinUrl"
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full rounded border border-[#252525] bg-[#000000] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
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
                    className="w-full rounded border border-[#252525] bg-[#000000] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
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
                    className="w-full rounded border border-[#252525] bg-[#000000] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded border border-[#C75C5C]/40 bg-[#C75C5C]/10 px-4 py-3 text-xs text-[#C75C5C]">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded border border-[#6FAF7B]/40 bg-[#6FAF7B]/10 px-4 py-3 text-xs text-[#6FAF7B]">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center justify-center gap-2 rounded bg-[#D4AF37] px-6 py-3 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[#E5C04A] disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    SAVING...
                  </>
                ) : (
                  "SAVE CHANGES"
                )}
              </button>
            </form>
          </section>

          {/* RIGHT: IDENTITY SIDEBAR */}
          <aside className="space-y-6">
            <div className="rounded-xl border border-[#252525] bg-[#0A0A0A] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
                  OFFICIAL IDENTITY
                </span>
                <span className="flex items-center gap-1 text-[10px] font-semibold text-[#6FAF7B]">
                  <ShieldCheck size={12} />
                  ACTIVE
                </span>
              </div>

              <div className="flex items-center gap-3 border-b border-[#252525] pb-3">
                <div className="h-12 w-12 overflow-hidden rounded-full border border-[#D4AF37]/50 bg-[#151515] flex-shrink-0 flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[#D4AF37]">
                      {fullName ? fullName.charAt(0).toUpperCase() : <User size={18} className="text-[#D4AF37]" />}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-sm text-[#F5F3ED]">{fullName || "Student"}</p>
                  <p className="truncate text-[10px] uppercase tracking-wider text-[#A1A1A1]">{college || "Magizh Scholar"}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#A1A1A1]">
                  MAGIZH STUDENT ID
                </p>
                <p className="mt-1 font-mono text-base font-bold text-[#D4AF37]">
                  {studentId}
                </p>
              </div>

              <div className="border-t border-[#252525] pt-3 text-xs space-y-1">
                <p className="text-[#A1A1A1]">Account Email</p>
                <p className="font-mono text-[#F5F3ED] break-all">{user.email}</p>
              </div>

              <div className="border-t border-[#252525] pt-3 text-xs space-y-1">
                <p className="text-[#A1A1A1]">Date of Birth</p>
                <p className="font-mono text-[#F5F3ED]">{formatDateOfBirth(dateOfBirth)}</p>
              </div>

              <button
                type="button"
                onClick={() => setIsIdModalOpen(true)}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded border border-[#252525] bg-[#000000] py-2.5 text-xs font-semibold uppercase tracking-wider text-[#F5F3ED] transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
              >
                <IdCard size={14} className="text-[#D4AF37]" />
                VIEW MY MAGIZH ID
              </button>
            </div>
          </aside>
        </div>
      </main>

      <Footer />

      {/* REUSABLE ID CARD MODAL */}
      <MagizhIdModal
        isOpen={isIdModalOpen}
        onClose={() => setIsIdModalOpen(false)}
      />
    </div>
  );
}