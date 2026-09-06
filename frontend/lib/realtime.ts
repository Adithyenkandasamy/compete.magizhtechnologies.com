export type RealtimeEventType =
  | "created"
  | "updated"
  | "deleted"
  | "published"
  | "unpublished"
  | "submitted"
  | "evaluated"
  | "status_changed"
  | "notification"
  | "unknown";

export type RealtimeEvent = {
  type?: string;
  event?: string;
  message?: string;
  data?: unknown;
  [key: string]: unknown;
};

export function getRealtimeEventType(
  message: RealtimeEvent,
): RealtimeEventType {
  const value =
    typeof message.event === "string"
      ? message.event
      : typeof message.type === "string"
        ? message.type
        : "";

  const normalized = value.toLowerCase();

  if (normalized.includes("created")) return "created";
  if (normalized.includes("updated")) return "updated";
  if (normalized.includes("deleted")) return "deleted";
  if (normalized.includes("published")) return "published";
  if (normalized.includes("unpublished")) return "unpublished";
  if (normalized.includes("submitted")) return "submitted";
  if (normalized.includes("evaluated")) return "evaluated";
  if (normalized.includes("status")) return "status_changed";
  if (normalized.includes("notification")) return "notification";

  return "unknown";
}

export function getRealtimeMessage(
  message: RealtimeEvent,
): string {
  if (
    typeof message.message === "string" &&
    message.message.trim()
  ) {
    return message.message;
  }

  if (
    typeof message.event === "string" &&
    message.event.trim()
  ) {
    return message.event;
  }

  if (
    typeof message.type === "string" &&
    message.type.trim()
  ) {
    return message.type;
  }

  return "Realtime update received";
}

export function isRealtimeEvent(
  message: RealtimeEvent,
  type: RealtimeEventType,
): boolean {
  return getRealtimeEventType(message) === type;
}