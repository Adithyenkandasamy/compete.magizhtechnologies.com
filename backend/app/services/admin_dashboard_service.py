"""
Admin dashboard service: aggregates platform stats, activity, and
per-event drill-down data for the admin UI.
"""

import uuid

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.admin_dashboard_repo import AdminDashboardRepository
from app.schemas.admin import (
    AdminActivity,
    AdminDashboardResponse,
    AdminDashboardStats,
    EventOverviewResponse,
)


def _humanize_action(action: str) -> str:
    """Convert 'registration.created' into 'Registration created'."""
    parts = action.replace("-", "_").split(".")
    return " ".join(part.replace("_", " ").capitalize() for part in parts)


class AdminDashboardService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = AdminDashboardRepository(session)

    async def get_dashboard(self) -> AdminDashboardResponse:
        stats = AdminDashboardStats(
            total_users=await self.repo.count_users(),
            total_students=await self.repo.count_students(),
            total_events=await self.repo.count_events(),
            total_hackathons=await self.repo.count_hackathons(),
            total_registrations=await self.repo.count_registrations(),
            total_teams=await self.repo.count_teams(),
            total_projects=await self.repo.count_projects(),
            total_submissions=await self.repo.count_submissions(),
        )
        hackathons = await self.repo.get_hackathon_overview(limit=10)
        return AdminDashboardResponse(stats=stats, hackathons=hackathons)

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