from datetime import datetime, timezone
from typing import Optional
import uuid

from fastapi import HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import UserSession
from app.repositories.audit_repo import AuditRepository
from app.repositories.session_repo import SessionRepository
from app.schemas.session import AdminSessionResponse, UserSessionResponse


class UserSessionService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.session_repo = SessionRepository(session)
        self.audit_repo = AuditRepository(session)

    async def list_my_sessions(self, user_id: uuid.UUID) -> list[UserSessionResponse]:
        sessions = await self.session_repo.list_user_sessions(user_id)
        now = datetime.now(timezone.utc)
        return [
            UserSessionResponse(
                id=s.id,
                created_at=s.created_at,
                last_seen=s.last_seen,
                expires_at=s.expires_at,
                is_active=(s.revoked_at is None and s.expires_at > now),
                ip_address=s.ip_address,
                user_agent=s.user_agent,
            )
            for s in sessions
        ]

    async def revoke_my_session(
        self, session_id: uuid.UUID, user_id: uuid.UUID, request: Request
    ) -> dict:
        user_session = await self.session_repo.get_session_by_id(session_id)
        if not user_session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found",
            )

        # IDOR protection: cannot revoke someone else's session
        if user_session.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You do not own this session",
            )

        if user_session.revoked_at is None:
            await self.session_repo.revoke_session(user_session)

            request_id = getattr(request.state, "request_id", None) if hasattr(request, "state") else None
            ip = request.client.host if request.client else None
            user_agent = request.headers.get("user-agent")

            await self.audit_repo.create_audit_log(
                action="session.revoked",
                event_type="authentication",
                user_id=user_id,
                resource_type="UserSession",
                resource_id=str(session_id),
                ip_address=ip,
                user_agent=user_agent,
                endpoint=request.url.path,
                http_method=request.method,
                status_code=status.HTTP_200_OK,
                request_id=request_id,
            )
            await self.session.commit()

        return {"status": "success", "message": "Session revoked"}

    async def list_admin_sessions(
        self,
        page: int = 1,
        size: int = 20,
        user_id: Optional[uuid.UUID] = None,
        is_active: Optional[bool] = None,
    ) -> tuple[list[AdminSessionResponse], int]:
        sessions, total = await self.session_repo.list_admin_sessions(
            page=page, size=size, user_id=user_id, is_active=is_active
        )
        now = datetime.now(timezone.utc)
        items = []
        for s in sessions:
            user_email = s.user.email if s.user else None
            user_name = (
                s.user.profile.full_name
                if (s.user and s.user.profile and s.user.profile.full_name)
                else user_email
            )
            items.append(
                AdminSessionResponse(
                    id=s.id,
                    user_id=s.user_id,
                    user_email=user_email,
                    user_name=user_name,
                    ip_address=s.ip_address,
                    user_agent=s.user_agent,
                    created_at=s.created_at,
                    last_seen=s.last_seen,
                    expires_at=s.expires_at,
                    revoked_at=s.revoked_at,
                    is_active=(s.revoked_at is None and s.expires_at > now),
                )
            )
        return items, total
