const ACCESS_TOKEN_KEY = "magizh_access_token";
const REFRESH_TOKEN_KEY = "magizh_refresh_token";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getAccessToken(): string | null {
  if (!isBrowser()) {
    return null;
  }

  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getRefreshToken(): string | null {
  if (!isBrowser()) {
    return null;
  }

  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string): void {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
}

export function removeAccessToken(): void {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function removeRefreshToken(): void {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function clearTokens(): void {
  removeAccessToken();
  removeRefreshToken();
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken() || getRefreshToken());
}