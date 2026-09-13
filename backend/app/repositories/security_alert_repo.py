from datetime import datetime, timezone
from typing import Optional
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import SecurityAlertSeverity, SecurityAlertStatus
from app.models.security import SecurityAlert


class SecurityAlertRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_alert(
        self,
        alert_type: str,
        severity: SecurityAlertSeverity,
        description: str,
        user_id: Optional[uuid.UUID] = None,
        ip_address: Optional[str] = None,
    ) -> SecurityAlert:
        alert = SecurityAlert(
            type=alert_type,
            severity=severity,
            description=description,
            user_id=user_id,
            ip_address=ip_address,
            status=SecurityAlertStatus.OPEN,
        )
        self.session.add(alert)
        await self.session.flush()
        return alert

    async def get_open_alert(
        self,
        alert_type: str,
        user_id: Optional[uuid.UUID] = None,
        ip_address: Optional[str] = None,
    ) -> Optional[SecurityAlert]:
        stmt = (
            select(SecurityAlert)
            .where(
                SecurityAlert.type == alert_type,
                SecurityAlert.status.in_([SecurityAlertStatus.OPEN, SecurityAlertStatus.INVESTIGATING]),
            )
        )
        if user_id is not None:
            stmt = stmt.where(SecurityAlert.user_id == user_id)
        if ip_address is not None:
            stmt = stmt.where(SecurityAlert.ip_address == ip_address)

        stmt = stmt.order_by(SecurityAlert.created_at.desc()).limit(1)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id(self, alert_id: uuid.UUID) -> Optional[SecurityAlert]:
        stmt = (
            select(SecurityAlert)
            .options(selectinload(SecurityAlert.user))
            .where(SecurityAlert.id == alert_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def update_status(
        self,
        alert: SecurityAlert,
        new_status: SecurityAlertStatus,
    ) -> SecurityAlert:
        alert.status = new_status
        if new_status in [SecurityAlertStatus.RESOLVED, SecurityAlertStatus.DISMISSED]:
            if not alert.resolved_at:
                alert.resolved_at = datetime.now(timezone.utc)
        else:
            alert.resolved_at = None

        await self.session.flush()
        return alert
