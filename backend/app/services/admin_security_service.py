from datetime import datetime, timezone
from typing import Optional
import uuid

from fastapi import HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import SecurityAlertSeverity, SecurityAlertStatus
from app.models.security import SecurityAlert
from app.models.user import User
from app.repositories.audit_repo import AuditRepository
from app.schemas.admin_security import SecurityAlertResponse, SecurityAlertUpdate


class AdminSecurityService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.audit_repo = AuditRepository(session)

    def _format_alert(self, a: SecurityAlert) -> SecurityAlertResponse:
        return SecurityAlertResponse(
            id=a.id,
            type=a.type,
            severity=a.severity,
            user_id=a.user_id,
            user_email=a.user.email if a.user else None,
            ip_address=a.ip_address,
            description=a.description,
            status=a.status,
            created_at=a.created_at,
            resolved_at=a.resolved_at,
        )

    async def list_alerts(
        self,
        page: int = 1,
        size: int = 20,
        alert_status: Optional[SecurityAlertStatus] = None,
        severity: Optional[SecurityAlertSeverity] = None,
        alert_type: Optional[str] = None,
    ) -> tuple[list[SecurityAlertResponse], int]:
        stmt = select(SecurityAlert).options(selectinload(SecurityAlert.user))

        if alert_status:
            stmt = stmt.where(SecurityAlert.status == alert_status)
        if severity:
            stmt = stmt.where(SecurityAlert.severity == severity)
        if alert_type:
            stmt = stmt.where(SecurityAlert.type.ilike(f"%{alert_type.strip()}%"))

        count_stmt = select(func.count(func.distinct(SecurityAlert.id))).select_from(
            stmt.with_only_columns(SecurityAlert.id).subquery()
        )
        total = (await self.session.execute(count_stmt)).scalar_one()

        stmt = stmt.order_by(SecurityAlert.created_at.desc())
        offset = (page - 1) * size
        stmt = stmt.offset(offset).limit(size)

        alerts = (await self.session.execute(stmt)).scalars().all()
        return [self._format_alert(a) for a in alerts], total

    async def get_alert(self, alert_id: uuid.UUID) -> SecurityAlertResponse:
        stmt = select(SecurityAlert).options(selectinload(SecurityAlert.user)).where(SecurityAlert.id == alert_id)
        alert = (await self.session.execute(stmt)).scalar_one_or_none()
        if not alert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Security alert not found",
            )
        return self._format_alert(alert)

    async def update_alert(
        self,
        alert_id: uuid.UUID,
        data: SecurityAlertUpdate,
        admin_user_id: uuid.UUID,
        request: Request,
    ) -> SecurityAlertResponse:
        stmt = select(SecurityAlert).options(selectinload(SecurityAlert.user)).where(SecurityAlert.id == alert_id)
        alert = (await self.session.execute(stmt)).scalar_one_or_none()
        if not alert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Security alert not found",
            )

        old_status = alert.status
        alert.status = data.status
        if data.status in [SecurityAlertStatus.RESOLVED, SecurityAlertStatus.DISMISSED]:
            if not alert.resolved_at:
                alert.resolved_at = datetime.now(timezone.utc)
        else:
            alert.resolved_at = None

        await self.session.commit()
        await self.session.refresh(alert)

        await self.audit_repo.create_audit_log(
            action="admin.security_alert.updated",
            event_type="security_management",
            user_id=admin_user_id,
            resource_type="SecurityAlert",
            resource_id=str(alert.id),
            details=f"Alert {alert.type} status changed from {old_status.value} to {data.status.value}. Notes: {data.notes or 'None'}",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            endpoint=request.url.path,
            http_method=request.method,
        )

        return self._format_alert(alert)
