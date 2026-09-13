"""
Admin dashboard + event drill-down queries.

These aggregates power the admin dashboard, the recent-activity feed, and
the per-hackathon student/team drill-down view.
"""

import uuid
from typing import Any, Optional

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.audit import AuditLog
from app.models.certificate import Certificate
from app.models.enums import (
    AccountStatus,
    EventStatus,
    EventType,
    RegistrationStatus,
    SecurityAlertStatus,
    SubmissionStatus,
    UserRole,
)
from app.models.event import Event
from app.models.judge import Evaluation
from app.models.project import Project, Submission
from app.models.registration import Registration
from app.models.security import SecurityAlert
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

    async def get_comprehensive_stats(self) -> dict[str, Any]:
        """
        Efficient aggregate query strategy to gather all dashboard metrics
        without loading rows into memory.
        """
        # 1. Users Breakdown
        users_status_stmt = select(User.status, func.count()).group_by(User.status)
        users_status_rows = (await self.session.execute(users_status_stmt)).all()
        status_map = {row[0]: row[1] for row in users_status_rows}

        users_role_stmt = select(User.role, func.count()).group_by(User.role)
        users_role_rows = (await self.session.execute(users_role_stmt)).all()
        role_map = {row[0]: row[1] for row in users_role_rows}

        total_users = sum(status_map.values())
        users_stats = {
            "total_users": total_users,
            "active_users": status_map.get(AccountStatus.ACTIVE, 0),
            "suspended_users": status_map.get(AccountStatus.SUSPENDED, 0),
            "deleted_users": status_map.get(AccountStatus.DELETED, 0),
            "students": role_map.get(UserRole.STUDENT, 0),
            "admins": role_map.get(UserRole.ADMIN, 0),
            "super_admins": role_map.get(UserRole.SUPER_ADMIN, 0),
            "judges": role_map.get(UserRole.JUDGE, 0),
        }

        # 2. Events Breakdown
        event_status_stmt = select(Event.status, func.count()).group_by(Event.status)
        event_status_rows = (await self.session.execute(event_status_stmt)).all()
        event_map = {row[0]: row[1] for row in event_status_rows}

        total_events = sum(event_map.values())
        events_stats = {
            "total_events": total_events,
            "draft_events": event_map.get(EventStatus.DRAFT, 0),
            "published_events": event_map.get(EventStatus.PUBLISHED, 0),
            "ongoing_events": event_map.get(EventStatus.ONGOING, 0),
            "completed_events": event_map.get(EventStatus.COMPLETED, 0),
            "cancelled_events": event_map.get(EventStatus.CANCELLED, 0),
        }

        # 3. Registrations Breakdown
        reg_status_stmt = select(Registration.status, func.count()).group_by(Registration.status)
        reg_status_rows = (await self.session.execute(reg_status_stmt)).all()
        reg_map = {row[0]: row[1] for row in reg_status_rows}

        total_regs = sum(reg_map.values())
        registrations_stats = {
            "total_registrations": total_regs,
            "confirmed_registrations": reg_map.get(RegistrationStatus.CONFIRMED, 0),
            "waitlisted_registrations": reg_map.get(RegistrationStatus.WAITLISTED, 0),
            "cancelled_registrations": reg_map.get(RegistrationStatus.CANCELLED, 0),
        }

        # 4. Submissions Breakdown
        sub_status_stmt = select(Submission.status, func.count()).group_by(Submission.status)
        sub_status_rows = (await self.session.execute(sub_status_stmt)).all()
        sub_map = {row[0]: row[1] for row in sub_status_rows}

        total_subs = sum(sub_map.values())
        submissions_stats = {
            "total_submissions": total_subs,
            "draft_submissions": sub_map.get(SubmissionStatus.DRAFT, 0),
            "submitted": sub_map.get(SubmissionStatus.SUBMITTED, 0),
            "under_review": sub_map.get(SubmissionStatus.UNDER_REVIEW, 0),
            "evaluated": sub_map.get(SubmissionStatus.EVALUATED, 0),
            "accepted": sub_map.get(SubmissionStatus.ACCEPTED, 0),
            "rejected": sub_map.get(SubmissionStatus.REJECTED, 0),
        }

        # 5. Certificates Breakdown
        cert_stmt = select(
            func.count().label("total"),
            func.count(case((Certificate.issued_at.isnot(None), 1))).label("issued"),
            func.count(case((Certificate.issued_at.is_(None), 1))).label("unissued"),
        ).select_from(Certificate)
        cert_row = (await self.session.execute(cert_stmt)).one()
        certificates_stats = {
            "total_certificates": cert_row.total,
            "issued_certificates": cert_row.issued,
            "unissued_certificates": cert_row.unissued,
        }

        # 6. Overview & Counts
        total_teams = await self._count(Team)
        total_projects = await self._count(Project)
        total_evaluations = await self._count(Evaluation)
        open_alerts = await self._count(SecurityAlert, SecurityAlert.status == SecurityAlertStatus.OPEN)
        activity_count = await self._count(AuditLog)

        overview_stats = {
            "total_teams": total_teams,
            "total_projects": total_projects,
            "total_evaluations": total_evaluations,
            "open_security_alerts": open_alerts,
            "recent_activity_count": activity_count,
        }

        return {
            "users": users_stats,
            "events": events_stats,
            "registrations": registrations_stats,
            "submissions": submissions_stats,
            "certificates": certificates_stats,
            "overview": overview_stats,
            # Top-level convenience counts
            "total_users": total_users,
            "total_students": users_stats["students"],
            "total_events": total_events,
            "total_hackathons": await self._count(Event, Event.event_type == EventType.HACKATHON),
            "total_registrations": total_regs,
            "total_teams": total_teams,
            "total_projects": total_projects,
            "total_submissions": total_subs,
        }

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