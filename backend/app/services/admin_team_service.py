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
from app.schemas.admin_teams import (
    AdminTeamMemberItem,
    AdminTeamProjectSummary,
    AdminTeamResponse,
)


class AdminTeamService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _format_team(self, team: Team) -> AdminTeamResponse:
        leader_name = (
            team.leader.profile.full_name
            if (team.leader and team.leader.profile and team.leader.profile.full_name)
            else (team.leader.email if team.leader else None)
        )
        leader_email = team.leader.email if team.leader else None

        members_list = []
        if team.members:
            for m in team.members:
                user_email = m.user.email if m.user else "Unknown"
                user_name = (
                    m.user.profile.full_name
                    if (m.user and m.user.profile and m.user.profile.full_name)
                    else user_email
                )
                members_list.append(
                    AdminTeamMemberItem(
                        user_id=m.user_id,
                        email=user_email,
                        full_name=user_name,
                        role=m.role,
                        joined_at=m.joined_at,
                    )
                )

        project_summary = None
        if team.project:
            submission_id = None
            submission_status = None
            if team.project.submissions:
                latest_sub = team.project.submissions[0]
                submission_id = latest_sub.id
                submission_status = latest_sub.status

            project_summary = AdminTeamProjectSummary(
                id=team.project.id,
                title=team.project.title,
                description=team.project.description,
                submission_id=submission_id,
                submission_status=submission_status,
            )

        return AdminTeamResponse(
            id=team.id,
            event_id=team.event_id,
            event_title=team.event.title if team.event else None,
            name=team.name,
            leader_id=team.leader_id,
            leader_name=leader_name,
            leader_email=leader_email,
            member_count=len(members_list),
            members=members_list,
            project=project_summary,
            created_at=team.created_at,
            updated_at=team.updated_at,
        )

    async def list_teams(
        self,
        page: int = 1,
        size: int = 20,
        event_id: Optional[uuid.UUID] = None,
        search: Optional[str] = None,
    ) -> tuple[list[AdminTeamResponse], int]:
        stmt = (
            select(Team)
            .options(
                selectinload(Team.event),
                selectinload(Team.leader).selectinload(User.profile),
                selectinload(Team.members).selectinload(TeamMember.user).selectinload(User.profile),
                selectinload(Team.project).selectinload(Project.submissions),
            )
        )

        if event_id:
            stmt = stmt.where(Team.event_id == event_id)
        if search:
            clean_search = f"%{search.strip()}%"
            stmt = stmt.where(Team.name.ilike(clean_search))

        count_stmt = select(func.count(func.distinct(Team.id))).select_from(
            stmt.with_only_columns(Team.id).subquery()
        )
        total = (await self.session.execute(count_stmt)).scalar_one()

        stmt = stmt.order_by(Team.created_at.desc())
        offset = (page - 1) * size
        stmt = stmt.offset(offset).limit(size)

        teams = (await self.session.execute(stmt)).scalars().all()
        items = [await self._format_team(t) for t in teams]
        return items, total

    async def get_team(self, team_id: uuid.UUID) -> AdminTeamResponse:
        stmt = (
            select(Team)
            .options(
                selectinload(Team.event),
                selectinload(Team.leader).selectinload(User.profile),
                selectinload(Team.members).selectinload(TeamMember.user).selectinload(User.profile),
                selectinload(Team.project).selectinload(Project.submissions),
            )
            .where(Team.id == team_id)
        )
        team = (await self.session.execute(stmt)).scalar_one_or_none()
        if not team:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team not found",
            )
        return await self._format_team(team)
