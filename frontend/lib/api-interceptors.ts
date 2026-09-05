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
  timeout: 10000,
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
  } catch {
    clearTokens();
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
    const redirect = encodeURIComponent(
      window.location.pathname + window.location.search,
    );
    const loginUrl = new URL(
      `/login?redirect=${redirect}`,
      window.location.origin,
    );

    window.location.href = loginUrl.toString();
  }
}

export function setupInterceptors(client: AxiosInstance): void {
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

      if (status !== 401) {
        return Promise.reject(error);
      }

      // Never try to refresh in response to an auth endpoint itself.
      if (!config || shouldSkipRefresh(config.url)) {
        clearTokens();
        redirectToLogin();
        return Promise.reject(error);
      }

      // Try a silent refresh and retry the failed request once.
      if (!config._retry) {
        const refreshed = await refreshTokens();

        if (refreshed) {
          config._retry = true;
          config.headers.Authorization = `Bearer ${getAccessToken()}`;
          return client(config);
        }
      }

      clearTokens();
      redirectToLogin();
      return Promise.reject(error);
    },
  );
}