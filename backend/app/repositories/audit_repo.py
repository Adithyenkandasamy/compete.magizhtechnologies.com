from datetime import datetime
from typing import Optional
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.audit import AuditLog
from app.models.user import Profile, User


class AuditRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_audit_log(
        self,
        action: str,
        event_type: str,
        user_id: Optional[uuid.UUID] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        endpoint: Optional[str] = None,
        http_method: Optional[str] = None,
        status_code: Optional[int] = None,
        request_id: Optional[str] = None,
        details: Optional[str] = None,
    ) -> AuditLog:
        """Create a new audit log record safely."""
        audit = AuditLog(
            action=action,
            event_type=event_type,
            user_id=user_id,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=user_agent[:500] if user_agent else None,
            endpoint=endpoint,
            http_method=http_method,
            status_code=status_code,
            request_id=request_id,
        )
        self.session.add(audit)
        # Flush to generate ID, do not commit so it acts in the same transaction
        # as the business operation it's auditing.
        await self.session.flush()
        return audit

    async def list_audit_logs(
        self,
        page: int = 1,
        size: int = 20,
        user_id: Optional[uuid.UUID] = None,
        action: Optional[str] = None,
        event_type: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        status_code: Optional[int] = None,
        request_id: Optional[str] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
    ) -> tuple[list[AuditLog], int]:
        stmt = (
            select(AuditLog)
            .outerjoin(AuditLog.user)
            .outerjoin(User.profile)
            .options(selectinload(AuditLog.user).selectinload(User.profile))
        )

        if user_id is not None:
            stmt = stmt.where(AuditLog.user_id == user_id)
        if action:
            stmt = stmt.where(AuditLog.action.ilike(f"%{action.strip()}%"))
        if event_type:
            stmt = stmt.where(AuditLog.event_type.ilike(f"%{event_type.strip()}%"))
        if resource_type:
            stmt = stmt.where(AuditLog.resource_type.ilike(f"%{resource_type.strip()}%"))
        if resource_id:
            stmt = stmt.where(AuditLog.resource_id == resource_id)
        if status_code is not None:
            stmt = stmt.where(AuditLog.status_code == status_code)
        if request_id:
            stmt = stmt.where(AuditLog.request_id == request_id)
        if from_date:
            stmt = stmt.where(AuditLog.created_at >= from_date)
        if to_date:
            stmt = stmt.where(AuditLog.created_at <= to_date)

        count_stmt = select(func.count(func.distinct(AuditLog.id))).select_from(
            stmt.with_only_columns(AuditLog.id).subquery()
        )
        total = (await self.session.execute(count_stmt)).scalar_one()

        stmt = stmt.order_by(AuditLog.created_at.desc())
        offset = (page - 1) * size
        stmt = stmt.offset(offset).limit(size)

        result = await self.session.execute(stmt)
        return list(result.scalars().all()), total
