export type EventType =
  | "HACKATHON"
  | "WORKSHOP"
  | "MEETUP"
  | "COMPETITION"
  | "PROJECT_EXPO";

export type EventMode = "ONLINE" | "OFFLINE" | "HYBRID";

export type EventStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ONGOING"
  | "COMPLETED"
  | "CANCELLED";

export type Event = {
  id: string;
  title: string;
  slug: string;
  description: string;

  event_type: EventType;

  banner_url?: string | null;

  start_date: string;
  end_date: string;
  registration_deadline: string;

  location?: string | null;
  mode: EventMode;

  max_participants?: number | null;

  team_size_min: number;
  team_size_max: number;

  prize_pool?: number | null;

  rules?: string | null;

  status: EventStatus;

  created_at: string;
  updated_at: string;
};