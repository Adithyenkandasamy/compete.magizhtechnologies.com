"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  getMyProfile,
  updateMyProfile,
} from "@/lib/profile-api";
import { useAuth } from "@/providers/auth-provider";
import type { Profile } from "@/types/auth";
import { getErrorMessage } from "@/lib/error-message";
import { LoadingButton, PageLoader } from "@/components/loading";

export default function ProfilePage() {
  const router = useRouter();
  const { user, status } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);

  const [fullName, setFullName] = useState("");
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [phone, setPhone] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getMyProfile();

        setProfile(data);
        setFullName(data.full_name || "");
        setCollege(data.college || "");
        setDepartment(data.department || "");
        setYear(data.year ? String(data.year) : "");
        setBio(data.bio || "");
        setSkills(data.skills?.join(", ") || "");
        setPhone(data.phone || "");
      } catch {
        setError("Unable to load your profile.");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      const updatedProfile = await updateMyProfile({
        full_name: fullName,
        college: college || null,
        department: department || null,
        year: year ? Number(year) : null,
        bio: bio || null,
        skills: skills
          ? skills
              .split(",")
              .map((skill) => skill.trim())
              .filter(Boolean)
          : [],
        phone: phone || null,
      });

      setProfile(updatedProfile);

      setSuccess("Profile updated successfully.");
    } catch (err: any) {
      setError(
        getErrorMessage(err, "Unable to update your profile."),
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading || status === "loading") {
    return (
      <main className="magizh-container py-20">
        <PageLoader label="loading profile" />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="magizh-container py-12 md:py-16">
      <div className="mb-10">
        <Link
          href="/dashboard"
          className="text-sm font-semibold uppercase tracking-wider text-[#D4AF37] hover:text-[#E5C04A]"
        >
          ← Dashboard
        </Link>

        <p className="magizh-gold mt-8 text-xs font-semibold uppercase tracking-[0.25em]">
          STUDENT PROFILE
        </p>

        <h1 className="magizh-heading mt-3 text-4xl font-bold md:text-5xl">
          Your Profile
        </h1>

        <p className="magizh-muted mt-4 max-w-2xl">
          Keep your information updated for events, teams, projects, and
          certificates.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <section className="magizh-card p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-medium"
              >
                Full Name
              </label>

              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label
                htmlFor="college"
                className="mb-2 block text-sm font-medium"
              >
                College
              </label>

              <input
                id="college"
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="Your college name"
                className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="department"
                  className="mb-2 block text-sm font-medium"
                >
                  Department
                </label>

                <input
                  id="department"
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. CSE"
                  className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label
                  htmlFor="year"
                  className="mb-2 block text-sm font-medium"
                >
                  Year
                </label>

                <input
                  id="year"
                  type="number"
                  min="1"
                  max="6"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="e.g. 2"
                  className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium"
              >
                Phone
              </label>

              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Your phone number"
                className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label
                htmlFor="skills"
                className="mb-2 block text-sm font-medium"
              >
                Skills
              </label>

              <input
                id="skills"
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="Python, Java, React, SQL"
                className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 outline-none focus:border-[#D4AF37]"
              />

              <p className="magizh-muted mt-2 text-xs">
                Separate skills with commas.
              </p>
            </div>

            <div>
              <label
                htmlFor="bio"
                className="mb-2 block text-sm font-medium"
              >
                Bio
              </label>

              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={5}
                placeholder="Tell us a little about yourself..."
                className="w-full resize-none rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 outline-none focus:border-[#D4AF37]"
              />
            </div>

            {error && (
              <div className="rounded border border-[#C75C5C]/40 bg-[#C75C5C]/10 px-4 py-3">
                <p className="text-sm text-[#C75C5C]">{error}</p>
              </div>
            )}

            {success && (
              <div className="rounded border border-[#6FAF7B]/40 bg-[#6FAF7B]/10 px-4 py-3">
                <p className="text-sm text-[#6FAF7B]">{success}</p>
              </div>
            )}

            <LoadingButton
              type="submit"
              loading={isSaving}
              loadingText="Saving..."
            >
              Save Profile
            </LoadingButton>
          </form>
        </section>

        <aside className="magizh-card h-fit p-6">
          <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.2em]">
            Account
          </p>

          <h2 className="magizh-heading mt-3 text-2xl font-bold">
            {profile?.full_name || "Student"}
          </h2>

          <p className="magizh-muted mt-2 break-all text-sm">
            {user.email}
          </p>

          <p className="magizh-muted mt-1 break-all text-xs">
            Profile ID: {profile?.user_id}
          </p>

          {profile?.skills && profile.skills.length > 0 && (
            <div className="mt-6">
              <p className="magizh-muted text-xs uppercase tracking-wider">
                Skills
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded border border-[#252525] px-3 py-1 text-xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}