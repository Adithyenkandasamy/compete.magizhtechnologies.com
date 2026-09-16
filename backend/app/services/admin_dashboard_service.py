"""
Admin dashboard service: aggregates platform stats, activity, and
per-event drill-down data for the admin UI.
"""

import time
import uuid
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.admin_dashboard_repo import AdminDashboardRepository
from app.schemas.admin import (
    AdminActivity,
    AdminDashboardCertificatesStats,
    AdminDashboardEventsStats,
    AdminDashboardOverviewStats,
    AdminDashboardRegistrationsStats,
    AdminDashboardResponse,
    AdminDashboardStats,
    AdminDashboardSubmissionsStats,
    AdminDashboardUsersStats,
    EventOverviewResponse,
)

# ---------------------------------------------------------------------------
# In-memory TTL cache for admin dashboard stats
# ---------------------------------------------------------------------------
_DASHBOARD_CACHE: Optional[AdminDashboardResponse] = None
_DASHBOARD_CACHE_TIMESTAMP: float = 0.0
_DASHBOARD_CACHE_TTL_SECONDS: float = 60.0  # 1-minute TTL


def _humanize_action(action: str) -> str:
    """Convert 'registration.created' into 'Registration created'."""
    parts = action.replace("-", "_").split(".")
    return " ".join(part.replace("_", " ").capitalize() for part in parts)


class AdminDashboardService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = AdminDashboardRepository(session)

    async def get_dashboard(self, force_refresh: bool = False) -> AdminDashboardResponse:
        global _DASHBOARD_CACHE, _DASHBOARD_CACHE_TIMESTAMP
        now = time.monotonic()

        # Return cached response if still fresh
        if (
            not force_refresh
            and _DASHBOARD_CACHE is not None
            and (now - _DASHBOARD_CACHE_TIMESTAMP) < _DASHBOARD_CACHE_TTL_SECONDS
        ):
            return _DASHBOARD_CACHE

        raw_stats = await self.repo.get_comprehensive_stats()

        stats = AdminDashboardStats(
            users=AdminDashboardUsersStats(**raw_stats["users"]),
            events=AdminDashboardEventsStats(**raw_stats["events"]),
            registrations=AdminDashboardRegistrationsStats(**raw_stats["registrations"]),
            submissions=AdminDashboardSubmissionsStats(**raw_stats["submissions"]),
            certificates=AdminDashboardCertificatesStats(**raw_stats["certificates"]),
            overview=AdminDashboardOverviewStats(**raw_stats["overview"]),
            total_users=raw_stats["total_users"],
            total_students=raw_stats["total_students"],
            total_events=raw_stats["total_events"],
            total_hackathons=raw_stats["total_hackathons"],
            total_registrations=raw_stats["total_registrations"],
            total_teams=raw_stats["total_teams"],
            total_projects=raw_stats["total_projects"],
            total_submissions=raw_stats["total_submissions"],
        )
        hackathons = await self.repo.get_hackathon_overview(limit=10)
        response = AdminDashboardResponse(stats=stats, hackathons=hackathons)

        # Store in cache
        _DASHBOARD_CACHE = response
        _DASHBOARD_CACHE_TIMESTAMP = now

        return response

    @staticmethod
    def invalidate_cache() -> None:
        """Clear the dashboard cache so the next request fetches fresh data."""
        global _DASHBOARD_CACHE, _DASHBOARD_CACHE_TIMESTAMP
        _DASHBOARD_CACHE = None
        _DASHBOARD_CACHE_TIMESTAMP = 0.0

    async def get_activity(self, limit: int = 15) -> list[AdminActivity]:
        logs = await self.repo.get_recent_activity(limit=limit)
        items: list[AdminActivity] = []
        for log in logs:
            message = _humanize_action(log.action or "Activity")
            if log.user:
                actor_name = (
                    log.user.profile.full_name
                    if log.user.profile and log.user.profile.full_name
                    else log.user.email
                )
                message = f"{message} — {actor_name}"
            items.append(
                AdminActivity(
                    id=log.id,
                    type=log.event_type or "system",
                    message=message,
                    created_at=log.created_at,
                )
            )
        return items

    async def get_event_overview(
        self, event_id: uuid.UUID
    ) -> EventOverviewResponse:
        event = await self.repo.get_event(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

        students = await self.repo.get_event_students(event_id)
        teams = await self.repo.get_event_teams(event_id)

        return EventOverviewResponse(
            event_id=event.id,
            title=event.title,
            status=event.status,
            event_type=event.event_type,
            start_date=event.start_date,
            end_date=event.end_date,
            students=students,
            teams=teams,
            total_students=len(students),
            total_teams=len(teams),
        )