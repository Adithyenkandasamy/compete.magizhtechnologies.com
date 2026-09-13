from datetime import datetime
from typing import Optional
import uuid

from pydantic import BaseModel


class EventAnalyticsItem(BaseModel):
    event_id: uuid.UUID
    title: str
    status: str
    registrations_count: int
    teams_count: int
    submissions_count: int


class EventsAnalyticsSummary(BaseModel):
    total_events: int
    by_status: dict[str, int]
    top_events: list[EventAnalyticsItem]


class UsersAnalyticsSummary(BaseModel):
    total_users: int
    by_role: dict[str, int]
    by_status: dict[str, int]


class ParticipationAnalyticsSummary(BaseModel):
    total_registrations: int
    total_teams: int
    total_projects: int
    total_submissions: int
    submission_rate: float


class JudgingAnalyticsSummary(BaseModel):
    total_evaluations: int
    evaluated_submissions_count: int
    evaluation_coverage_pct: float
    average_score: Optional[float] = None


class CertificatesAnalyticsSummary(BaseModel):
    total_certificates: int
    total_issued: int
    total_unissued: int
    by_type: dict[str, int]


class SecurityAnalyticsSummary(BaseModel):
    failed_logins: int
    successful_logins: int
    open_alerts: int
    high_critical_alerts: int
    revoked_sessions: int
    active_sessions: int


class AdminAnalyticsResponse(BaseModel):
    events: EventsAnalyticsSummary
    users: UsersAnalyticsSummary
    participation: ParticipationAnalyticsSummary
    judging: JudgingAnalyticsSummary
    certificates: CertificatesAnalyticsSummary
    security: SecurityAnalyticsSummary
    generated_at: datetime
