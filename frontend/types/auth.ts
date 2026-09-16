export type UserRole = "STUDENT" | "ADMIN" | "SUPER_ADMIN";

export type UserStatus = "ACTIVE" | "SUSPENDED" | "DELETED";

export type ProfileSummary = {
  full_name: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  college?: string | null;
  department?: string | null;
  year_of_study?: number | null;
  magizh_student_id?: string | null;
  date_of_birth?: string | null;
  phone?: string | null;
  is_profile_completed?: boolean;
};

export type User = {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  profile: ProfileSummary | null;
};

export type RegisterRequest = {
  email: string;
  password: string;
  full_name: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in?: number;
  refresh_expires_in?: number;
};

export type Profile = {
  user_id: string;
  magizh_student_id?: string | null;
  full_name: string | null;
  date_of_birth?: string | null;
  avatar_url?: string | null;
  college?: string | null;
  department?: string | null;
  year?: number | null;
  bio?: string | null;
  skills?: string[] | null;
  phone?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  is_profile_completed?: boolean;
  created_at: string;
  updated_at: string;
};

export type StudentIdentity = {
  magizh_student_id: string;
  full_name: string;
  date_of_birth?: string | null;
  college?: string | null;
  department?: string | null;
  year?: number | null;
  status: string;
  is_profile_completed: boolean;
  verification_url: string;
};