from datetime import datetime
from typing import Optional
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.audit import AuditLog
from app.models.user import Profile, User
from app.schemas.admin_activity import AdminActivityItem


class AdminActivityService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_activity(
        self,
        page: int = 1,
        size: int = 20,
        action: Optional[str] = None,
        event_type: Optional[str] = None,
        user_id: Optional[uuid.UUID] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
    ) -> tuple[list[AdminActivityItem], int]:
        stmt = (
            select(AuditLog)
            .outerjoin(AuditLog.user)
            .outerjoin(User.profile)
            .options(selectinload(AuditLog.user).selectinload(User.profile))
        )

        if action:
            stmt = stmt.where(AuditLog.action.ilike(f"%{action.strip()}%"))
        if event_type:
            stmt = stmt.where(AuditLog.event_type.ilike(f"%{event_type.strip()}%"))
        if user_id:
            stmt = stmt.where(AuditLog.user_id == user_id)
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

        logs = (await self.session.execute(stmt)).scalars().all()

        items = []
        for log in logs:
            actor_name = None
            actor_email = None
            actor_role = None
            if log.user:
                actor_email = log.user.email
                actor_role = log.user.role.value if hasattr(log.user.role, 'value') else str(log.user.role)
                if log.user.profile and log.user.profile.full_name:
                    actor_name = log.user.profile.full_name
                else:
                    actor_name = log.user.email

            items.append(
                AdminActivityItem(
                    id=log.id,
                    action=log.action or "unknown",
                    event_type=log.event_type or "system",
                    resource_type=log.resource_type,
                    resource_id=log.resource_id,
                    user_id=log.user_id,
                    actor_name=actor_name,
                    actor_email=actor_email,
                    actor_role=actor_role,
                    endpoint=log.endpoint,
                    http_method=log.http_method,
                    created_at=log.created_at,
                )
            )

        return items, total
