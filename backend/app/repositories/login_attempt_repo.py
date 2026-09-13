from datetime import datetime, timedelta, timezone
from typing import Optional
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import LoginAttempt


class LoginAttemptRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def record_attempt(
        self,
        email: str,
        success: bool,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        failure_reason: Optional[str] = None,
        user_id: Optional[uuid.UUID] = None,
    ) -> LoginAttempt:
        attempt = LoginAttempt(
            email=email.lower().strip(),
            success=success,
            ip_address=ip_address,
            user_agent=user_agent[:500] if user_agent else None,
            failure_reason=failure_reason,
            user_id=user_id,
        )
        self.session.add(attempt)
        await self.session.flush()
        return attempt

    async def count_recent_failures(
        self,
        email: Optional[str] = None,
        ip_address: Optional[str] = None,
        window_minutes: int = 15,
    ) -> int:
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=window_minutes)
        stmt = (
            select(func.count(LoginAttempt.id))
            .where(
                LoginAttempt.success.is_(False),
                LoginAttempt.created_at >= cutoff,
            )
        )
        if email:
            stmt = stmt.where(LoginAttempt.email == email.lower().strip())
        if ip_address:
            stmt = stmt.where(LoginAttempt.ip_address == ip_address)

        return (await self.session.execute(stmt)).scalar_one()

    async def list_recent_attempts(
        self,
        email: Optional[str] = None,
        ip_address: Optional[str] = None,
        limit: int = 50,
    ) -> list[LoginAttempt]:
        stmt = select(LoginAttempt)
        if email:
            stmt = stmt.where(LoginAttempt.email == email.lower().strip())
        if ip_address:
            stmt = stmt.where(LoginAttempt.ip_address == ip_address)
        stmt = stmt.order_by(LoginAttempt.created_at.desc()).limit(limit)
        return list((await self.session.execute(stmt)).scalars().all())
