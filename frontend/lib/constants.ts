export const APP_NAME = "MAGIZH | INNOVATION";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export const EVENT_TYPES = [
  "HACKATHON",
  "WORKSHOP",
  "MEETUP",
  "COMPETITION",
  "PROJECT_EXPO",
] as const;

export const EVENT_MODES = [
  "ONLINE",
  "OFFLINE",
  "HYBRID",
] as const;