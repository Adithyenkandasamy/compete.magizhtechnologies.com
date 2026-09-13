from datetime import datetime
from typing import Optional
import uuid

from pydantic import BaseModel, Field

from app.models.enums import EventStatus, EventType, RegistrationStatus


class AdminDashboardUsersStats(BaseModel):
    total_users: int = 0
    active_users: int = 0
    suspended_users: int = 0
    deleted_users: int = 0
    students: int = 0
    admins: int = 0
    super_admins: int = 0
    judges: int = 0


class AdminDashboardEventsStats(BaseModel):
    total_events: int = 0
    draft_events: int = 0
    published_events: int = 0
    ongoing_events: int = 0
    completed_events: int = 0
    cancelled_events: int = 0


class AdminDashboardRegistrationsStats(BaseModel):
    total_registrations: int = 0
    confirmed_registrations: int = 0
    waitlisted_registrations: int = 0
    cancelled_registrations: int = 0


class AdminDashboardSubmissionsStats(BaseModel):
    total_submissions: int = 0
    draft_submissions: int = 0
    submitted: int = 0
    under_review: int = 0
    evaluated: int = 0
    accepted: int = 0
    rejected: int = 0


class AdminDashboardCertificatesStats(BaseModel):
    total_certificates: int = 0
    issued_certificates: int = 0
    unissued_certificates: int = 0


class AdminDashboardOverviewStats(BaseModel):
    total_teams: int = 0
    total_projects: int = 0
    total_evaluations: int = 0
    open_security_alerts: int = 0
    recent_activity_count: int = 0


class AdminDashboardStats(BaseModel):
    """Structured platform counters for the admin command center."""
    users: AdminDashboardUsersStats
    events: AdminDashboardEventsStats
    registrations: AdminDashboardRegistrationsStats
    submissions: AdminDashboardSubmissionsStats
    certificates: AdminDashboardCertificatesStats
    overview: AdminDashboardOverviewStats

    # Backward-compatible top-level convenience fields
    total_users: int = 0
    total_students: int = 0
    total_events: int = 0
    total_hackathons: int = 0
    total_registrations: int = 0
    total_teams: int = 0
    total_projects: int = 0
    total_submissions: int = 0


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
    full_name: Optional[str] = None
    registration_status: RegistrationStatus
    registered_at: datetime


class EventTeamOverview(BaseModel):
    """A team summary for an event (admin drill-down)."""
    id: uuid.UUID
    name: str
    leader_id: uuid.UUID
    leader_name: Optional[str] = None
    member_count: int


class EventOverviewResponse(BaseModel):
    """Full admin view of an event: registered students and teams."""
    event_id: uuid.UUID
    title: str
    status: EventStatus
    event_type: EventType
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    students: list[EventStudent]
    teams: list[EventTeamOverview]
    total_students: int
    total_teams: int