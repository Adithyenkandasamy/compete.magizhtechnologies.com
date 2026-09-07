import apiClient from "@/lib/api-client";
import type {
  Event,
  EventMode,
  EventType,
} from "@/types/events";

// ---------------------------------------------------------------------------
// Admin Dashboard
// ---------------------------------------------------------------------------

export type AdminDashboardStats = {
  total_users: number;
  total_students: number;
  total_events: number;
  total_hackathons: number;
  total_registrations: number;
  total_teams: number;
  total_projects: number;
  total_submissions: number;
};

export type HackathonOverviewItem = {
  id: string;
  title: string;
  status: string;
  registrations: number;
  teams: number;
  students: number;
};

export type AdminDashboardResponse = {
  stats: AdminDashboardStats;
  hackathons: HackathonOverviewItem[];
};

export type AdminActivity = {
  id: string;
  type: string;
  message: string;
  created_at: string;
};

export type EventStudent = {
  id: string;
  email: string;
  full_name?: string | null;
  registration_status: string;
  registered_at: string;
};

export type EventTeamOverview = {
  id: string;
  name: string;
  leader_id: string;
  leader_name?: string | null;
  member_count: number;
};

export type EventOverviewResponse = {
  event_id: string;
  title: string;
  status: string;
  event_type: string;
  start_date?: string | null;
  end_date?: string | null;
  students: EventStudent[];
  teams: EventTeamOverview[];
  total_students: number;
  total_teams: number;
};

export async function getAdminDashboard(): Promise<AdminDashboardResponse> {
  const response = await apiClient.get<AdminDashboardResponse>(
    "/admin/dashboard",
  );

  return response.data;
}

export async function getAdminDashboardActivity(): Promise<AdminActivity[]> {
  const response = await apiClient.get<AdminActivity[]>(
    "/admin/dashboard/activity",
  );

  return response.data;
}

export async function getEventOverview(
  eventId: string,
): Promise<EventOverviewResponse> {
  const response = await apiClient.get<EventOverviewResponse>(
    `/admin/events/${eventId}/overview`,
  );

  return response.data;
}

// ---------------------------------------------------------------------------
// Admin Events
// ---------------------------------------------------------------------------

export type CreateEventRequest = {
  title: string;
  description: string;
  event_type: EventType;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  location?: string;
  mode: EventMode;
  max_participants?: number;
  team_size_min: number;
  team_size_max: number;
  prize_pool?: number;
  rules?: string;
};

export type UpdateEventRequest = Partial<CreateEventRequest>;

export async function getAdminEvents(): Promise<Event[]> {
  const response = await apiClient.get<Event[]>("/admin/events");

  return response.data;
}

export async function getAdminEvent(
  eventId: string,
): Promise<Event> {
  const response = await apiClient.get<Event>(
    `/admin/events/${eventId}`,
  );

  return response.data;
}

export async function createAdminEvent(
  data: CreateEventRequest,
): Promise<Event> {
  const response = await apiClient.post<Event>(
    "/admin/events",
    data,
  );

  return response.data;
}

export async function updateAdminEvent(
  eventId: string,
  data: UpdateEventRequest,
): Promise<Event> {
  const response = await apiClient.put<Event>(
    `/admin/events/${eventId}`,
    data,
  );

  return response.data;
}

export async function publishAdminEvent(
  eventId: string,
): Promise<Event> {
  const response = await apiClient.post<Event>(
    `/admin/events/${eventId}/publish`,
  );

  return response.data;
}

export async function unpublishAdminEvent(
  eventId: string,
): Promise<Event> {
  const response = await apiClient.post<Event>(
    `/admin/events/${eventId}/unpublish`,
  );

  return response.data;
}

export async function deleteAdminEvent(
  eventId: string,
): Promise<void> {
  await apiClient.delete(`/admin/events/${eventId}`);
}