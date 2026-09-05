export type Project = {
  id: string;
  team_id: string;
  event_id: string;
  title: string;
  description: string | null;
  problem: string | null;
  solution: string | null;
  tech_stack: string[] | null;
  github_url: string | null;
  demo_url: string | null;
  video_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectPayload = {
  title: string;
  description?: string | null;
  problem?: string | null;
  solution?: string | null;
  tech_stack?: string[] | null;
  github_url?: string | null;
  demo_url?: string | null;
  video_url?: string | null;
};