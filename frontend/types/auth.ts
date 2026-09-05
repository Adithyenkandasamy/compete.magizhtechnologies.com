export type UserRole = "STUDENT" | "ADMIN" | "SUPER_ADMIN";

export type UserStatus = "ACTIVE" | "SUSPENDED" | "DELETED";

export type ProfileSummary = {
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  college: string | null;
  department: string | null;
  year_of_study: number | null;
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
  full_name: string | null;
  avatar_url?: string | null;
  college?: string | null;
  department?: string | null;
  year?: number | null;
  bio?: string | null;
  skills?: string[] | null;
  phone?: string | null;
  created_at: string;
  updated_at: string;
};