export type UserRole = "STUDENT" | "ADMIN" | "SUPER_ADMIN";

export type UserStatus = "ACTIVE" | "SUSPENDED" | "DELETED";

export type User = {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
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

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

export type Profile = {
  user_id: string;
  full_name: string;
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