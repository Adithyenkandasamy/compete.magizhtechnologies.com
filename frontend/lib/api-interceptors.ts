import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "./auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Bare client WITHOUT interceptors — used for the refresh call so we never
// recurse into the 401 handler while refreshing.
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // slightly longer for refresh — don't drop valid sessions on slow networks
});

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// Single shared promise so concurrent 401s trigger exactly one refresh.
let refreshPromise: Promise<boolean> | null = null;

function shouldSkipRefresh(url: string | undefined): boolean {
  if (!url) {
    return true;
  }

  return (
    url.includes("/auth/login") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/logout")
  );
}

async function performRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return false;
  }

  try {
    const response = await refreshClient.post("/auth/refresh", {
      refresh_token: refreshToken,
    });

    const data = response.data as {
      access_token: string;
      refresh_token: string;
    };

    setTokens(data.access_token, data.refresh_token);
    return true;
  } catch (err) {
    const axiosErr = err as AxiosError;
    const status = axiosErr?.response?.status;

    // Only wipe tokens when the server explicitly says the refresh token is invalid.
    // Do NOT wipe on network errors (ECONNABORTED, timeout, 5xx) — those are transient.
    if (status === 401 || status === 403) {
      clearTokens();
    }

    return false;
  } finally {
    refreshPromise = null;
  }
}

function refreshTokens(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = performRefresh();
  }

  return refreshPromise;
}

function redirectToLogin(): void {
  if (typeof window !== "undefined") {
    const currentPath = window.location.pathname + window.location.search;
    // Don't redirect if already on login page
    if (currentPath.startsWith("/login")) return;

    const redirect = encodeURIComponent(currentPath);
    const loginUrl = new URL(
      `/login?redirect=${redirect}`,
      window.location.origin,
    );

    window.location.href = loginUrl.toString();
  }
}

export function setupInterceptors(client: AxiosInstance): void {
  // Attach access token to every outgoing request
  client.interceptors.request.use(
    (config) => {
      const token = getAccessToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => Promise.reject(error),
  );

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const status = error?.response?.status;
      const config = error?.config as RetryableConfig | undefined;

      // Only handle 401 Unauthorized
      if (status !== 401) {
        return Promise.reject(error);
      }

      // Never try to refresh in response to an auth endpoint 401.
      if (!config || shouldSkipRefresh(config.url)) {
        // Refresh token itself is rejected → session truly expired
        if (config?.url?.includes("/auth/refresh")) {
          clearTokens();
          redirectToLogin();
        }
        // Login/logout 401 are handled by the calling code (show error message, etc.)
        return Promise.reject(error);
      }

      // Don't retry the same request twice
      if (config._retry) {
        clearTokens();
        redirectToLogin();
        return Promise.reject(error);
      }

      // Try a silent refresh and retry the failed request once
      const refreshed = await refreshTokens();

      if (refreshed) {
        config._retry = true;
        config.headers.Authorization = `Bearer ${getAccessToken()}`;
        return client(config);
      }

      // Refresh failed with a real 401/403 (tokens are already cleared in performRefresh).
      // Only redirect if tokens are actually gone.
      if (!getRefreshToken() && !getAccessToken()) {
        redirectToLogin();
      }

      return Promise.reject(error);
    },
  );
}