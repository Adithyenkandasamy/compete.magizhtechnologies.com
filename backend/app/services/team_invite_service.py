import hashlib
import secrets
import uuid

from fastapi import HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.team_request import TeamInvite
from app.repositories.audit_repo import AuditRepository
from app.repositories.team_invite_repo import TeamInviteRepository
from app.repositories.team_repo import TeamRepository


class TeamInviteService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.invite_repo = TeamInviteRepository(session)
        self.team_repo = TeamRepository(session)
        self.audit_repo = AuditRepository(session)

    def _hash_token(self, token: str) -> str:
        """Securely hash the token for database storage."""
        return hashlib.sha256(token.encode()).hexdigest()

    def _generate_secure_token(self) -> str:
        """Generate a cryptographically secure random token string."""
        return secrets.token_urlsafe(32)

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

    async def generate_or_get_invite(
        self, team_id: uuid.UUID, user_id: uuid.UUID, request: Request
    ) -> tuple[TeamInvite, str]:
        """
        Generate a new invite or return the existing one.
        Returns the TeamInvite model AND the raw token.
        Only the leader can do this.
        """
        team = await self.team_repo.get_team_by_id(team_id)
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        if team.leader_id != user_id:
            raise HTTPException(status_code=403, detail="Only the leader can generate invites")

        existing_invite = await self.invite_repo.get_invite_by_team(team_id)
        
        # We cannot reverse the hash to return the raw token. 
        # If an invite exists, the leader must regenerate it to see the raw token again,
        # OR we just regenerate it automatically when they ask for it if they lost it.
        # Actually, let's just regenerate it if they ask, and invalidate the old one.
        if existing_invite:
            await self.invite_repo.delete_invite(existing_invite)
            await self.session.flush()

        raw_token = self._generate_secure_token()
        token_hash = self._hash_token(raw_token)
        
        invite = await self.invite_repo.create_invite(team_id, token_hash)
        
        action = "team.invite_regenerated" if existing_invite else "team.invite_created"
        await self._log(request, action, str(team.id), user_id)
        
        return invite, raw_token

    async def invalidate_invite(
        self, team_id: uuid.UUID, user_id: uuid.UUID, request: Request
    ) -> dict:
        team = await self.team_repo.get_team_by_id(team_id)
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        if team.leader_id != user_id:
            raise HTTPException(status_code=403, detail="Only the leader can invalidate invites")

        existing_invite = await self.invite_repo.get_invite_by_team(team_id)
        if not existing_invite:
            raise HTTPException(status_code=400, detail="No active invite exists")

        await self.invite_repo.delete_invite(existing_invite)
        await self._log(request, "team.invite_revoked", str(team.id), user_id)
        return {"message": "Invite link revoked"}

    async def get_invite_info(self, raw_token: str) -> dict:
        """Resolve a raw token into publicly safe team/event info."""
        token_hash = self._hash_token(raw_token)
        invite = await self.invite_repo.get_invite_by_hash(token_hash)
        
        if not invite:
            raise HTTPException(status_code=404, detail="Invalid or expired invite link")
            
        team = await self.team_repo.get_team_by_id(invite.team_id)
        if not team:
            raise HTTPException(status_code=404, detail="Team no longer exists")

        return {
            "team": team,
            "event": team.event,
        }
