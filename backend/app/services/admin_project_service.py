import uuid
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.event import Event
from app.models.project import Project, Submission
from app.models.team import Team, TeamMember
from app.models.user import Profile, User
from app.schemas.admin_projects import (
    AdminProjectResponse,
    AdminProjectSubmissionSummary,
    AdminProjectTeamSummary,
)


class AdminProjectService:
    def __init__(self, session: AsyncSession):
        self.session = session

    def _format_project(self, p: Project) -> AdminProjectResponse:
        team_summary = None
        event_id = None
        event_title = None

        if p.team:
            leader_name = None
            if p.team.leader:
                leader_name = (
                    p.team.leader.profile.full_name
                    if (p.team.leader.profile and p.team.leader.profile.full_name)
                    else p.team.leader.email
                )
            member_count = len(p.team.members) if p.team.members else 0
            team_summary = AdminProjectTeamSummary(
                id=p.team.id,
                name=p.team.name,
                leader_name=leader_name,
                member_count=member_count,
            )
            if p.team.event:
                event_id = p.team.event.id
                event_title = p.team.event.title

        sub_summary = None
        if p.submissions:
            latest_sub = p.submissions[0]
            sub_summary = AdminProjectSubmissionSummary(
                id=latest_sub.id,
                status=latest_sub.status,
                submitted_at=latest_sub.submitted_at,
            )

        return AdminProjectResponse(
            id=p.id,
            team_id=p.team_id,
            team_name=p.team.name if p.team else None,
            event_id=event_id,
            event_title=event_title,
            title=p.title,
            description=p.description,
            repository_url=p.repository_url,
            demo_url=p.demo_url,
            team=team_summary,
            submission=sub_summary,
            created_at=p.created_at,
            updated_at=p.updated_at,
        )

    async def list_projects(
        self,
        page: int = 1,
        size: int = 20,
        event_id: Optional[uuid.UUID] = None,
        team_id: Optional[uuid.UUID] = None,
        search: Optional[str] = None,
    ) -> tuple[list[AdminProjectResponse], int]:
        stmt = (
            select(Project)
            .join(Project.team)
            .options(
                selectinload(Project.team).selectinload(Team.event),
                selectinload(Project.team).selectinload(Team.leader).selectinload(User.profile),
                selectinload(Project.team).selectinload(Team.members),
                selectinload(Project.submissions),
            )
        )

        if event_id:
            stmt = stmt.where(Team.event_id == event_id)
        if team_id:
            stmt = stmt.where(Project.team_id == team_id)
        if search:
            clean_search = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    Project.title.ilike(clean_search),
                    Project.description.ilike(clean_search),
                    Team.name.ilike(clean_search),
                )
            )

        count_stmt = select(func.count(func.distinct(Project.id))).select_from(
            stmt.with_only_columns(Project.id).subquery()
        )
        total = (await self.session.execute(count_stmt)).scalar_one()

        stmt = stmt.order_by(Project.created_at.desc())
        offset = (page - 1) * size
        stmt = stmt.offset(offset).limit(size)

        projects = (await self.session.execute(stmt)).scalars().all()
        items = [self._format_project(p) for p in projects]
        return items, total

    async def get_project(self, project_id: uuid.UUID) -> AdminProjectResponse:
        stmt = (
            select(Project)
            .options(
                selectinload(Project.team).selectinload(Team.event),
                selectinload(Project.team).selectinload(Team.leader).selectinload(User.profile),
                selectinload(Project.team).selectinload(Team.members),
                selectinload(Project.submissions),
            )
            .where(Project.id == project_id)
        )
        proj = (await self.session.execute(stmt)).scalar_one_or_none()
        if not proj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found",
            )
        return self._format_project(proj)
