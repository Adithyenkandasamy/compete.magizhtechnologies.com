import uuid
from typing import Optional

from sqlalchemy import func, select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import TeamMemberRole
from app.models.event import Event
from app.models.team import Team, TeamMember
from app.models.user import User


class TeamRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_team_with_lock(self, team_id: uuid.UUID) -> Optional[Team]:
        """Fetch team with row-level lock (FOR UPDATE) to prevent concurrency issues."""
        stmt = select(Team).where(Team.id == team_id).with_for_update()
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_team_by_id(self, team_id: uuid.UUID) -> Optional[Team]:
        """Fetch full team details including members and event."""
        stmt = (
            select(Team)
            .options(
                selectinload(Team.event),
                selectinload(Team.leader).selectinload(User.profile),
                selectinload(Team.members).selectinload(TeamMember.user).selectinload(User.profile)
            )
            .where(Team.id == team_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_team_by_name(self, event_id: uuid.UUID, name: str) -> Optional[Team]:
        """Check for duplicate team names within the same event."""
        stmt = select(Team).where(
            func.lower(Team.name) == func.lower(name),
            Team.event_id == event_id
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_user_team_for_event(
        self, user_id: uuid.UUID, event_id: uuid.UUID
    ) -> Optional[Team]:
        """Check if a user is already in a team for a specific event."""
        stmt = (
            select(Team)
            .join(TeamMember)
            .where(Team.event_id == event_id, TeamMember.user_id == user_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_team_member(
        self, team_id: uuid.UUID, user_id: uuid.UUID
    ) -> Optional[TeamMember]:
        """Fetch a specific team member."""
        stmt = select(TeamMember).where(
            TeamMember.team_id == team_id, TeamMember.user_id == user_id
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_team(
        self, event_id: uuid.UUID, leader_id: uuid.UUID, name: str
    ) -> Team:
        """Create a new team and automatically add the leader."""
        team = Team(event_id=event_id, leader_id=leader_id, name=name)
        self.session.add(team)
        await self.session.flush()

        # Add leader to team_members
        member = TeamMember(
            team_id=team.id,
            user_id=leader_id,
            role=TeamMemberRole.LEADER,
        )
        self.session.add(member)
        await self.session.flush()
        
        await self.session.refresh(team)
        return team

    async def update_team_name(self, team: Team, name: str) -> Team:
        team.name = name
        await self.session.flush()
        await self.session.refresh(team)
        return team

    async def add_member(
        self, team_id: uuid.UUID, user_id: uuid.UUID, role: TeamMemberRole = TeamMemberRole.MEMBER
    ) -> TeamMember:
        member = TeamMember(team_id=team_id, user_id=user_id, role=role)
        self.session.add(member)
        await self.session.flush()
        return member

    async def remove_member(self, team_id: uuid.UUID, user_id: uuid.UUID) -> None:
        stmt = delete(TeamMember).where(
            TeamMember.team_id == team_id, TeamMember.user_id == user_id
        )
        await self.session.execute(stmt)
        await self.session.flush()

    async def change_leader(
        self, team: Team, old_leader: TeamMember, new_leader: TeamMember
    ) -> Team:
        """Swap leadership roles and update the Team model."""
        old_leader.role = TeamMemberRole.MEMBER
        new_leader.role = TeamMemberRole.LEADER
        team.leader_id = new_leader.user_id
        await self.session.flush()
        await self.session.refresh(team)
        return team

    async def delete_team(self, team: Team) -> None:
        """Delete an empty team."""
        await self.session.delete(team)
        await self.session.flush()
