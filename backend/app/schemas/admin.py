from datetime import datetime
import uuid

from pydantic import BaseModel

from app.models.enums import EventStatus, EventType, RegistrationStatus


class AdminDashboardStats(BaseModel):
    """Aggregate platform counters shown on the admin dashboard."""
    total_users: int
    total_students: int
    total_events: int
    total_hackathons: int
    total_registrations: int
    total_teams: int
    total_projects: int
    total_submissions: int


class HackathonOverviewItem(BaseModel):
    """Per-hackathon summary so admins can drill into each event."""
    id: uuid.UUID
    title: str
    status: EventStatus
    registrations: int
    teams: int
    students: int


class AdminDashboardResponse(BaseModel):
    stats: AdminDashboardStats
    hackathons: list[HackathonOverviewItem]


class AdminActivity(BaseModel):
    id: uuid.UUID
    type: str
    message: str
    created_at: datetime


class EventStudent(BaseModel):
    """A student registered for an event (admin drill-down)."""
    id: uuid.UUID
    email: str
    full_name: str | None = None
    registration_status: RegistrationStatus
    registered_at: datetime


class EventTeamOverview(BaseModel):
    """A team summary for an event (admin drill-down)."""
    id: uuid.UUID
    name: str
    leader_id: uuid.UUID
    leader_name: str | None = None
    member_count: int


class EventOverviewResponse(BaseModel):
    """Full admin view of an event: registered students and teams."""
    event_id: uuid.UUID
    title: str
    status: EventStatus
    event_type: EventType
    start_date: datetime | None = None
    end_date: datetime | None = None
    students: list[EventStudent]
    teams: list[EventTeamOverview]
    total_students: int
    total_teams: int