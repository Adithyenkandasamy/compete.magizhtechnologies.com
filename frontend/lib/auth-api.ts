import apiClient from "./api-client";
import {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  User,
} from "@/types/auth";

export async function registerUser(
  data: RegisterRequest,
): Promise<User> {
  const response = await apiClient.post<User>("/auth/register", data);

  return response.data;
}

export async function loginUser(
  data: LoginRequest,
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    username: data.email,
    password: data.password,
  });

  const response = await apiClient.post<TokenResponse>("/auth/login", body, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return response.data;
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<TokenResponse> {
  const response = await apiClient.post<TokenResponse>("/auth/refresh", {
    refresh_token: refreshToken,
  });

  return response.data;
}

export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<User>("/auth/me");

  return response.data;
}

export async function logoutUser(refreshToken: string): Promise<void> {
  await apiClient.post("/auth/logout", {
    refresh_token: refreshToken,
  });
}