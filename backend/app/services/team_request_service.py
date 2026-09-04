import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import JoinRequestStatus
from app.models.team_request import TeamJoinRequest
from app.repositories.audit_repo import AuditRepository
from app.repositories.registration_repo import RegistrationRepository
from app.repositories.team_repo import TeamRepository
from app.repositories.team_request_repo import TeamRequestRepository
from app.services.team_invite_service import TeamInviteService


class TeamRequestService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.team_repo = TeamRepository(session)
        self.request_repo = TeamRequestRepository(session)
        self.reg_repo = RegistrationRepository(session)
        self.audit_repo = AuditRepository(session)
        self.invite_service = TeamInviteService(session)

    def _get_utc_now(self) -> datetime:
        return datetime.now(timezone.utc)

    async def _log(self, request: Request, action: str, team_id: str, user_id: uuid.UUID):
        await self.audit_repo.create_audit_log(
            action=action,
            event_type="team_management",
            user_id=user_id,
            resource_type="Team",
            resource_id=team_id,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            endpoint=request.url.path,
            http_method=request.method,
        )

    async def request_join(
        self, raw_token: str, user_id: uuid.UUID, request: Request
    ) -> TeamJoinRequest:
        """Submit a request to join a team using an invite link."""
        info = await self.invite_service.get_invite_info(raw_token)
        team = info["team"]
        event = info["event"]

        # Validate User is registered for the event
        reg = await self.reg_repo.get_registration_by_event_and_user(event.id, user_id)
        if not reg or reg.status.value != "CONFIRMED":
            raise HTTPException(status_code=403, detail="You must be registered for this event to join a team")

        # Validate User is not already in a team for this event
        existing_team = await self.team_repo.get_user_team_for_event(user_id, event.id)
        if existing_team:
            raise HTTPException(status_code=409, detail="You already belong to a team for this event")

        # Validate no active pending request
        active_req = await self.request_repo.get_active_request(team.id, user_id)
        if active_req:
            raise HTTPException(status_code=409, detail="You already have an active join request for this team")

        # Capacity Check (basic check, hard check happens on accept)
        if len(team.members) >= event.team_size_max:
            raise HTTPException(status_code=400, detail="Team has already reached maximum capacity")

        join_request = await self.request_repo.create_request(team.id, user_id)
        await self._log(request, "team.join_request.created", str(team.id), user_id)
        
        return join_request

    async def accept_request(
        self, team_id: uuid.UUID, request_id: uuid.UUID, leader_id: uuid.UUID, request: Request
    ) -> dict:
        """Accept a join request. Uses Row Locking to prevent capacity race conditions."""
        # 1. Fetch team with lock to prevent race condition on capacity
        team = await self.team_repo.get_team_with_lock(team_id)
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Have to fetch the relationships since with_for_update doesn't play well with selectinload
        # So we fetch the full team object to inspect it
        full_team = await self.team_repo.get_team_by_id(team_id)
        
        if full_team.leader_id != leader_id:
            raise HTTPException(status_code=403, detail="Only the leader can accept requests")

        # 2. Fetch Request
        join_request = await self.request_repo.get_request_by_id(request_id)
        if not join_request or join_request.team_id != team_id:
            raise HTTPException(status_code=404, detail="Join request not found")
        if join_request.status != JoinRequestStatus.PENDING:
            raise HTTPException(status_code=400, detail="Request is no longer pending")

        # 3. Capacity Check
        if len(full_team.members) >= full_team.event.team_size_max:
            raise HTTPException(status_code=400, detail="Team has already reached maximum capacity")

        # 4. User Validation (Are they still registered? Are they in another team?)
        reg = await self.reg_repo.get_registration_by_event_and_user(full_team.event_id, join_request.user_id)
        if not reg or reg.status.value != "CONFIRMED":
            raise HTTPException(status_code=400, detail="User is no longer registered for this event")
            
        existing_team = await self.team_repo.get_user_team_for_event(join_request.user_id, full_team.event_id)
        if existing_team:
            raise HTTPException(status_code=409, detail="User already joined another team")

        # 5. Add to Team
        await self.team_repo.add_member(team_id, join_request.user_id)
        
        # 6. Update Request Status
        await self.request_repo.update_request_status(
            join_request, JoinRequestStatus.ACCEPTED, leader_id, self._get_utc_now()
        )
        
        await self._log(request, "team.join_request.accepted", str(team_id), leader_id)
        return {"message": "Request accepted successfully"}

    async def reject_request(
        self, team_id: uuid.UUID, request_id: uuid.UUID, leader_id: uuid.UUID, request: Request
    ) -> dict:
        team = await self.team_repo.get_team_by_id(team_id)
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        if team.leader_id != leader_id:
            raise HTTPException(status_code=403, detail="Only the leader can reject requests")

        join_request = await self.request_repo.get_request_by_id(request_id)
        if not join_request or join_request.team_id != team_id:
            raise HTTPException(status_code=404, detail="Join request not found")
        if join_request.status != JoinRequestStatus.PENDING:
            raise HTTPException(status_code=400, detail="Request is no longer pending")

        await self.request_repo.update_request_status(
            join_request, JoinRequestStatus.REJECTED, leader_id, self._get_utc_now()
        )
        await self._log(request, "team.join_request.rejected", str(team_id), leader_id)
        return {"message": "Request rejected successfully"}

    async def cancel_request(
        self, team_id: uuid.UUID, request_id: uuid.UUID, user_id: uuid.UUID, request: Request
    ) -> dict:
        join_request = await self.request_repo.get_request_by_id(request_id)
        if not join_request or join_request.team_id != team_id:
            raise HTTPException(status_code=404, detail="Join request not found")
            
        if join_request.user_id != user_id:
            raise HTTPException(status_code=403, detail="You can only cancel your own requests")
            
        if join_request.status != JoinRequestStatus.PENDING:
            raise HTTPException(status_code=400, detail="Request is no longer pending")

        await self.request_repo.update_request_status(join_request, JoinRequestStatus.CANCELLED)
        await self._log(request, "team.join_request.cancelled", str(team_id), user_id)
        return {"message": "Request cancelled successfully"}

    async def get_team_requests(self, team_id: uuid.UUID, user_id: uuid.UUID) -> list[TeamJoinRequest]:
        team = await self.team_repo.get_team_by_id(team_id)
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        if team.leader_id != user_id:
            raise HTTPException(status_code=403, detail="Only the leader can view requests")

        return await self.request_repo.get_team_requests(team_id)
