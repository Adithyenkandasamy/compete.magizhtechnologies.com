import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.audit import UserSession


class SessionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_session(
        self,
        user_id: uuid.UUID,
        session_hash: str,
        expires_at: datetime,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        session_id: Optional[uuid.UUID] = None,
    ) -> UserSession:
        """Create a new user session."""
        user_session = UserSession(
            id=session_id,
            user_id=user_id,
            session_hash=session_hash,
            ip_address=ip_address,
            user_agent=user_agent,
            expires_at=expires_at,
        )
        self.session.add(user_session)
        await self.session.commit()
        await self.session.refresh(user_session)
        return user_session

    async def get_session_by_id(self, session_id: uuid.UUID) -> Optional[UserSession]:
        """Fetch a session by its ID, eagerly loading the associated user."""
        stmt = (
            select(UserSession)
            .where(UserSession.id == session_id)
            .options(selectinload(UserSession.user))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_session_by_hash(self, session_hash: str) -> Optional[UserSession]:
        """Fetch a session by its stored (hashed) token value."""
        stmt = (
            select(UserSession)
            .where(UserSession.session_hash == session_hash)
            .options(selectinload(UserSession.user))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def update_session(
        self,
        user_session: UserSession,
        *,
        session_hash: Optional[str] = None,
        last_seen: Optional[datetime] = None,
        expires_at: Optional[datetime] = None,
        revoked_at: Optional[datetime] = None,
    ) -> UserSession:
        """Update mutable fields on an existing session and commit."""
        if session_hash is not None:
            user_session.session_hash = session_hash
        if last_seen is not None:
            user_session.last_seen = last_seen
        if expires_at is not None:
            user_session.expires_at = expires_at
        if revoked_at is not None:
            user_session.revoked_at = revoked_at

        await self.session.commit()
        await self.session.refresh(user_session)
        return user_session

    async def revoke_session(self, user_session: UserSession) -> UserSession:
        """Mark a session as revoked."""
        user_session.revoked_at = datetime.now(timezone.utc)
        await self.session.commit()
        await self.session.refresh(user_session)
        return user_session

    async def revoke_all_user_sessions(self, user_id: uuid.UUID) -> None:
        """Revoke every active session for a user (used on security events)."""
        stmt = select(UserSession).where(
            UserSession.user_id == user_id, UserSession.revoked_at.is_(None)
        )
        result = await self.session.execute(stmt)
        sessions = result.scalars().all()
        for user_session in sessions:
            user_session.revoked_at = datetime.now(timezone.utc)
        await self.session.commit()