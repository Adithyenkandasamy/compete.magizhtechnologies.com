import uuid
from typing import Optional

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.team_request import TeamInvite


class TeamInviteRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_invite_by_hash(self, token_hash: str) -> Optional[TeamInvite]:
        """Find an active invite by its hash."""
        stmt = select(TeamInvite).where(TeamInvite.token_hash == token_hash)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_invite_by_team(self, team_id: uuid.UUID) -> Optional[TeamInvite]:
        """Find the current active invite for a team."""
        stmt = select(TeamInvite).where(TeamInvite.team_id == team_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_invite(self, team_id: uuid.UUID, token_hash: str) -> TeamInvite:
        """Create a new invite for a team."""
        invite = TeamInvite(team_id=team_id, token_hash=token_hash)
        self.session.add(invite)
        await self.session.flush()
        await self.session.refresh(invite)
        return invite

    async def delete_invite(self, invite: TeamInvite) -> None:
        """Revoke an invite."""
        await self.session.delete(invite)
        await self.session.flush()
