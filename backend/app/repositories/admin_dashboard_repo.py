"""
Admin dashboard + event drill-down queries.

These aggregates power the admin dashboard, the recent-activity feed, and
the per-hackathon student/team drill-down view.
"""

import uuid
from typing import Any, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.audit import AuditLog
from app.models.enums import EventType, RegistrationStatus, UserRole
from app.models.event import Event
from app.models.project import Project, Submission
from app.models.registration import Registration
from app.models.team import Team, TeamMember
from app.models.user import Profile, User


class AdminDashboardRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _count(self, model: type, *where_clauses: Any) -> int:
        stmt = select(func.count()).select_from(model)
        if where_clauses:
            stmt = stmt.where(*where_clauses)
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def count_users(self) -> int:
        return await self._count(User)

    async def count_students(self) -> int:
        return await self._count(User, User.role == UserRole.STUDENT)

    async def count_events(self) -> int:
        return await self._count(Event)

    async def count_hackathons(self) -> int:
        return await self._count(Event, Event.event_type == EventType.HACKATHON)

    async def count_registrations(self) -> int:
        return await self._count(Registration)

    async def count_teams(self) -> int:
        return await self._count(Team)

    async def count_projects(self) -> int:
        return await self._count(Project)

    async def count_submissions(self) -> int:
        return await self._count(Submission)

    async def get_hackathon_overview(
        self, limit: int = 10
    ) -> list[dict[str, Any]]:
        """Per-hackathon registration + team counts, most recent first."""
        registrations_sub = (
            select(
                Registration.event_id,
                func.count(func.distinct(Registration.user_id)).label(
                    "reg_count"
                ),
            )
            .where(Registration.status == RegistrationStatus.CONFIRMED)
            .group_by(Registration.event_id)
            .subquery()
        )
        teams_sub = (
            select(
                Team.event_id,
                func.count(func.distinct(Team.id)).label("team_count"),
            )
            .group_by(Team.event_id)
            .subquery()
        )
        stmt = (
            select(
                Event.id,
                Event.title,
                Event.status,
                func.coalesce(registrations_sub.c.reg_count, 0).label(
                    "registrations"
                ),
                func.coalesce(teams_sub.c.team_count, 0).label("teams"),
            )
            .outerjoin(
                registrations_sub,
                registrations_sub.c.event_id == Event.id,
            )
            .outerjoin(teams_sub, teams_sub.c.event_id == Event.id)
            .where(Event.event_type == EventType.HACKATHON)
            .order_by(Event.created_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        rows = result.all()
        return [
            {
                "id": row.id,
                "title": row.title,
                "status": row.status,
                "registrations": row.registrations,
                "teams": row.teams,
                "students": row.registrations,
            }
            for row in rows
        ]

    async def get_recent_activity(self, limit: int = 15) -> list[AuditLog]:
        stmt = (
            select(AuditLog)
            .options(selectinload(AuditLog.user).selectinload(User.profile))
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_event(self, event_id: uuid.UUID) -> Optional[Event]:
        stmt = select(Event).where(Event.id == event_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_event_students(
        self, event_id: uuid.UUID
    ) -> list[dict[str, Any]]:
        """Confirmed students registered for an event."""
        stmt = (
            select(
                User.id,
                User.email,
                Profile.full_name,
                Registration.status,
                Registration.registered_at,
            )
            .join(Registration, Registration.user_id == User.id)
            .outerjoin(Profile, Profile.user_id == User.id)
            .where(
                Registration.event_id == event_id,
                Registration.status == RegistrationStatus.CONFIRMED,
            )
            .order_by(Registration.registered_at.desc())
        )
        result = await self.session.execute(stmt)
        return [
            {
                "id": row.id,
                "email": row.email,
                "full_name": row.full_name,
                "registration_status": row.status,
                "registered_at": row.registered_at,
            }
            for row in result.all()
        ]

    async def get_event_teams(
        self, event_id: uuid.UUID
    ) -> list[dict[str, Any]]:
        """Teams participating in an event with leader + member counts."""
        stmt = (
            select(Team.id, Team.name, Team.leader_id, Team.created_at)
            .where(Team.event_id == event_id)
            .order_by(Team.created_at.asc())
        )
        result = await self.session.execute(stmt)
        teams = result.all()

        if not teams:
            return []

        team_ids = [team.id for team in teams]
        member_count_stmt = (
            select(TeamMember.team_id, func.count().label("member_count"))
            .where(TeamMember.team_id.in_(team_ids))
            .group_by(TeamMember.team_id)
        )
        counts = {
            row.team_id: row.member_count
            for row in (await self.session.execute(member_count_stmt)).all()
        }

        leader_ids = [team.leader_id for team in teams]
        leader_stmt = (
            select(User.id, Profile.full_name)
            .outerjoin(Profile, Profile.user_id == User.id)
            .where(User.id.in_(leader_ids))
        )
        leaders = {
            row.id: row.full_name
            for row in (await self.session.execute(leader_stmt)).all()
        }

        return [
            {
                "id": team.id,
                "name": team.name,
                "leader_id": team.leader_id,
                "leader_name": leaders.get(team.leader_id, "Unknown"),
                "member_count": counts.get(team.id, 0),
            }
            for team in teams
        ]