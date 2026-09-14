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
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// JWT helpers (client-side, no library needed)
// ---------------------------------------------------------------------------

/**
 * Decode the exp claim from a JWT without verifying signature.
 * Returns the expiry as a Unix timestamp (seconds), or 0 if parsing fails.
 */
function getJwtExpiry(token: string): number {
  try {
    const payload = token.split(".")[1];
    if (!payload) return 0;
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof decoded.exp === "number" ? decoded.exp : 0;
  } catch {
    return 0;
  }
}

/**
 * Returns true if the access token exists AND has > 60 seconds remaining.
 * We use a 60-second buffer so we don't race against the server's clock.
 */
function isAccessTokenFresh(): boolean {
  const token = getAccessToken();
  if (!token) return false;
  const exp = getJwtExpiry(token);
  if (!exp) return true; // If no exp claim, assume fresh (unusual)
  return Date.now() / 1000 < exp - 60;
}

// Cache the resolved user in memory so fast page navigations don't re-fetch.
let cachedUser: User | null = null;

// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(cachedUser);
  const [status, setStatus] = useState<AuthStatus>(
    // If we already have a cached user, skip the loading state entirely.
    cachedUser ? "authenticated" : "loading"
  );

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const hasRefresh = Boolean(getRefreshToken());
      const hasAccess = Boolean(getAccessToken());

      // No tokens at all — unauthenticated, done immediately.
      if (!hasRefresh && !hasAccess) {
        if (!cancelled) setStatus("unauthenticated");
        return;
      }

      // Access token is still fresh — skip the /auth/me network call entirely.
      if (isAccessTokenFresh() && cachedUser) {
        if (!cancelled) {
          setUser(cachedUser);
          setStatus("authenticated");
        }
        return;
      }

      // Access token is stale / absent but we have a refresh token.
      // The interceptor will auto-refresh on the /auth/me call below.
      try {
        const currentUser = await getCurrentUser();
        cachedUser = currentUser;
        if (!cancelled) {
          setUser(currentUser);
          setStatus("authenticated");
        }
      } catch {
        cachedUser = null;
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
    cachedUser = currentUser;
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
    cachedUser = currentUser;
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
        // Best-effort: always clear local state.
      }
    }

    cachedUser = null;
    clearTokens();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      cachedUser = currentUser;
      setUser(currentUser);
    } catch {
      // Ignore refresh errors
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === "authenticated",
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, status, login, register, logout, refreshUser],
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