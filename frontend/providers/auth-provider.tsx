"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getCurrentUser, loginUser, logoutUser, registerUser } from "@/lib/auth-api";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "@/lib/auth";
import type { RegisterRequest, User } from "@/types/auth";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  user: User | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterRequest) => Promise<User>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      // A stored access OR refresh token means we may have a live session.
      // If the access token is expired, the API layer will silently refresh
      // (and redirect to /login if that fails).
      if (!getRefreshToken() && !getAccessToken()) {
        if (!cancelled) {
          setStatus("unauthenticated");
        }
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        if (!cancelled) {
          setUser(currentUser);
          setStatus("authenticated");
        }
      } catch {
        clearTokens();
        if (!cancelled) {
          setUser(null);
          setStatus("unauthenticated");
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { access_token, refresh_token } = await loginUser({ email, password });

    setTokens(access_token, refresh_token);

    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setStatus("authenticated");

    return currentUser;
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    await registerUser(data);

    const { access_token, refresh_token } = await loginUser({
      email: data.email,
      password: data.password,
    });

    setTokens(access_token, refresh_token);

    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setStatus("authenticated");

    return currentUser;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();

    if (refreshToken) {
      try {
        await logoutUser(refreshToken);
      } catch {
        // Revocation is best-effort; always clear local state.
      }
    }

    clearTokens();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === "authenticated",
      login,
      register,
      logout,
    }),
    [user, status, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}