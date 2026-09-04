import uuid
from typing import Optional

from fastapi import HTTPException, Request
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import EventStatus, TeamMemberRole
from app.models.team import Team
from app.repositories.audit_repo import AuditRepository
from app.repositories.event_repo import EventRepository
from app.repositories.registration_repo import RegistrationRepository
from app.repositories.team_repo import TeamRepository


class TeamService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.team_repo = TeamRepository(session)
        self.event_repo = EventRepository(session)
        self.reg_repo = RegistrationRepository(session)
        self.audit_repo = AuditRepository(session)

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

    async def create_team(
        self, event_id: uuid.UUID, user_id: uuid.UUID, name: str, request: Request
    ) -> Team:
        """Create a team. Validates registration, event status, and duplicate memberships."""
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        if event.status != EventStatus.PUBLISHED:
            raise HTTPException(status_code=400, detail="Event is not active")

        # Must be registered
        reg = await self.reg_repo.get_registration_by_event_and_user(event_id, user_id)
        if not reg or reg.status.value != "CONFIRMED":
            raise HTTPException(status_code=403, detail="You must be registered to create a team")

        # Cannot be in another team
        existing_team = await self.team_repo.get_user_team_for_event(user_id, event_id)
        if existing_team:
            raise HTTPException(status_code=409, detail="You already belong to a team for this event")

        # Unique name check
        if await self.team_repo.get_team_by_name(event_id, name):
            raise HTTPException(status_code=409, detail="Team name already taken in this event")

        try:
            team = await self.team_repo.create_team(event_id, user_id, name)
            await self._log(request, "team.created", str(team.id), user_id)
            return team
        except IntegrityError:
            await self.session.rollback()
            raise HTTPException(status_code=409, detail="Error creating team")

    async def get_team(self, team_id: uuid.UUID) -> Team:
        team = await self.team_repo.get_team_by_id(team_id)
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        return team

    async def update_team(
        self, team_id: uuid.UUID, user_id: uuid.UUID, name: str, request: Request
    ) -> Team:
        team = await self.get_team(team_id)
        if team.leader_id != user_id:
            raise HTTPException(status_code=403, detail="Only the leader can update the team")

        if await self.team_repo.get_team_by_name(team.event_id, name):
            raise HTTPException(status_code=409, detail="Team name already taken in this event")

        team = await self.team_repo.update_team_name(team, name)
        await self._log(request, "team.updated", str(team.id), user_id)
        return team

    async def remove_member(
        self, team_id: uuid.UUID, leader_id: uuid.UUID, target_id: uuid.UUID, request: Request
    ) -> dict:
        team = await self.get_team(team_id)
        if team.leader_id != leader_id:
            raise HTTPException(status_code=403, detail="Only the leader can remove members")
        if leader_id == target_id:
            raise HTTPException(status_code=400, detail="Leader cannot remove themselves using this endpoint")

        member = await self.team_repo.get_team_member(team_id, target_id)
        if not member:
            raise HTTPException(status_code=404, detail="User is not a member of this team")

        await self.team_repo.remove_member(team_id, target_id)
        await self._log(request, "team.member_removed", str(team.id), leader_id)
        return {"message": "Member removed successfully"}

    async def leave_team(self, team_id: uuid.UUID, user_id: uuid.UUID, request: Request) -> dict:
        team = await self.get_team(team_id)
        member = await self.team_repo.get_team_member(team_id, user_id)
        if not member:
            raise HTTPException(status_code=404, detail="You are not a member of this team")

        if team.leader_id == user_id:
            if len(team.members) > 1:
                raise HTTPException(
                    status_code=400,
                    detail="As leader, you must transfer leadership before leaving."
                )
            else:
                # Option B: Safe delete empty team
                await self.team_repo.delete_team(team)
                await self._log(request, "team.deleted", str(team.id), user_id)
                return {"message": "Team deleted as the last member left"}
        else:
            await self.team_repo.remove_member(team_id, user_id)
            await self._log(request, "team.member_left", str(team.id), user_id)
            return {"message": "Left team successfully"}

    async def transfer_leadership(
        self, team_id: uuid.UUID, leader_id: uuid.UUID, target_id: uuid.UUID, request: Request
    ) -> dict:
        team = await self.get_team(team_id)
        if team.leader_id != leader_id:
            raise HTTPException(status_code=403, detail="Only the leader can transfer leadership")

        if leader_id == target_id:
            raise HTTPException(status_code=400, detail="You are already the leader")

        old_leader = await self.team_repo.get_team_member(team_id, leader_id)
        new_leader = await self.team_repo.get_team_member(team_id, target_id)

        if not new_leader:
            raise HTTPException(status_code=404, detail="Target user is not a member of this team")

        await self.team_repo.change_leader(team, old_leader, new_leader)
        await self._log(request, "team.leader_changed", str(team.id), leader_id)
        return {"message": "Leadership transferred successfully"}
