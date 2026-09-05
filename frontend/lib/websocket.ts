import { WS_URL } from "@/lib/constants";
import { getAccessToken } from "@/lib/auth";

export function createWebSocketUrl(path: string): string | null {
  const token = getAccessToken();

  if (!token) {
    return null;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const separator = normalizedPath.includes("?") ? "&" : "?";

  return `${WS_URL}${normalizedPath}${separator}token=${encodeURIComponent(
    token,
  )}`;
}

export function isWebSocketSupported(): boolean {
  return typeof window !== "undefined" && "WebSocket" in window;
}