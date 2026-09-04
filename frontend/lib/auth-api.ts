import apiClient from "./api-client";
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from "@/types/auth";

export async function registerUser(
  data: RegisterRequest,
): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>(
    "/auth/register",
    data,
  );

  return response.data;
}

export async function loginUser(
  data: LoginRequest,
): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>(
    "/auth/login",
    data,
  );

  return response.data;
}

export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<User>("/auth/me");

  return response.data;
}

export async function logoutUser(): Promise<void> {
  await apiClient.post("/auth/logout");
}