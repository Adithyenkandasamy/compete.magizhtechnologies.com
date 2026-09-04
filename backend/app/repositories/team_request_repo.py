import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import JoinRequestStatus
from app.models.team_request import TeamJoinRequest


class TeamRequestRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_request_by_id(self, request_id: uuid.UUID) -> Optional[TeamJoinRequest]:
        stmt = select(TeamJoinRequest).where(TeamJoinRequest.id == request_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_active_request(
        self, team_id: uuid.UUID, user_id: uuid.UUID
    ) -> Optional[TeamJoinRequest]:
        """Check if user has a PENDING or ACCEPTED request for this team."""
        stmt = select(TeamJoinRequest).where(
            TeamJoinRequest.team_id == team_id,
            TeamJoinRequest.user_id == user_id,
            TeamJoinRequest.status.in_([JoinRequestStatus.PENDING, JoinRequestStatus.ACCEPTED]),
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_team_requests(self, team_id: uuid.UUID) -> list[TeamJoinRequest]:
        """Fetch all requests for a team, including basic user info."""
        stmt = (
            select(TeamJoinRequest)
            .options(selectinload(TeamJoinRequest.user))
            .where(TeamJoinRequest.team_id == team_id)
            .order_by(TeamJoinRequest.requested_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create_request(
        self, team_id: uuid.UUID, user_id: uuid.UUID
    ) -> TeamJoinRequest:
        request = TeamJoinRequest(team_id=team_id, user_id=user_id)
        self.session.add(request)
        await self.session.flush()
        await self.session.refresh(request)
        return request

    async def update_request_status(
        self,
        request: TeamJoinRequest,
        status: JoinRequestStatus,
        reviewed_by: Optional[uuid.UUID] = None,
        reviewed_at: Optional[any] = None,
    ) -> TeamJoinRequest:
        request.status = status
        if reviewed_by:
            request.reviewed_by = reviewed_by
        if reviewed_at:
            request.reviewed_at = reviewed_at
            
        await self.session.flush()
        await self.session.refresh(request)
        return request
