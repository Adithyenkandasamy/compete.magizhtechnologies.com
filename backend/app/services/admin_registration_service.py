import uuid
from typing import Optional

from fastapi import HTTPException, Request, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import RegistrationStatus
from app.models.event import Event
from app.models.registration import Registration
from app.models.user import Profile, User
from app.repositories.audit_repo import AuditRepository
from app.schemas.admin_registrations import (
    AdminRegistrationResponse,
    RegistrationEventSummary,
    RegistrationStudentSummary,
    UpdateAdminRegistrationRequest,
)


class AdminRegistrationService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.audit_repo = AuditRepository(session)

    def _format_registration(self, r: Registration) -> AdminRegistrationResponse:
        user_summary = None
        if r.user:
            user_summary = RegistrationStudentSummary(
                id=r.user.id,
                email=r.user.email,
                full_name=r.user.profile.full_name if r.user.profile else None,
                avatar_url=r.user.profile.avatar_url if r.user.profile else None,
            )

        event_summary = None
        if r.event:
            event_summary = RegistrationEventSummary(
                id=r.event.id,
                title=r.event.title,
                slug=r.event.slug,
                event_type=r.event.event_type,
                status=r.event.status,
            )

        return AdminRegistrationResponse(
            id=r.id,
            event_id=r.event_id,
            user_id=r.user_id,
            status=r.status,
            registered_at=r.registered_at,
            created_at=r.registered_at,
            updated_at=r.registered_at,
            user=user_summary,
            event=event_summary,
        )

    async def list_registrations(
        self,
        page: int = 1,
        size: int = 20,
        event_id: Optional[uuid.UUID] = None,
        user_id: Optional[uuid.UUID] = None,
        reg_status: Optional[RegistrationStatus] = None,
        search: Optional[str] = None,
    ) -> tuple[list[AdminRegistrationResponse], int]:
        stmt = (
            select(Registration)
            .join(Registration.user)
            .outerjoin(User.profile)
            .join(Registration.event)
            .options(
                selectinload(Registration.user).selectinload(User.profile),
                selectinload(Registration.event),
            )
        )

        if event_id:
            stmt = stmt.where(Registration.event_id == event_id)
        if user_id:
            stmt = stmt.where(Registration.user_id == user_id)
        if reg_status:
            stmt = stmt.where(Registration.status == reg_status)
        if search:
            clean_search = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    User.email.ilike(clean_search),
                    Profile.full_name.ilike(clean_search),
                    Event.title.ilike(clean_search),
                )
            )

        # Total count
        count_stmt = select(func.count(func.distinct(Registration.id))).select_from(
            stmt.with_only_columns(Registration.id).subquery()
        )
        total = (await self.session.execute(count_stmt)).scalar_one()

        stmt = stmt.order_by(Registration.registered_at.desc())
        offset = (page - 1) * size
        stmt = stmt.offset(offset).limit(size)

        result = await self.session.execute(stmt)
        registrations = result.scalars().all()

        items = [self._format_registration(r) for r in registrations]
        return items, total

    async def get_registration(self, registration_id: uuid.UUID) -> AdminRegistrationResponse:
        stmt = (
            select(Registration)
            .options(
                selectinload(Registration.user).selectinload(User.profile),
                selectinload(Registration.event),
            )
            .where(Registration.id == registration_id)
        )
        result = await self.session.execute(stmt)
        reg = result.scalar_one_or_none()
        if not reg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Registration not found",
            )
        return self._format_registration(reg)

    async def update_registration_status(
        self,
        registration_id: uuid.UUID,
        data: UpdateAdminRegistrationRequest,
        admin_user_id: uuid.UUID,
        request: Request,
    ) -> AdminRegistrationResponse:
        stmt = (
            select(Registration)
            .options(
                selectinload(Registration.user).selectinload(User.profile),
                selectinload(Registration.event),
            )
            .where(Registration.id == registration_id)
        )
        result = await self.session.execute(stmt)
        reg = result.scalar_one_or_none()
        if not reg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Registration not found",
            )

        old_status = reg.status
        reg.status = data.status
        await self.session.commit()
        await self.session.refresh(reg)

        await self.audit_repo.create_audit_log(
            action="admin.registration.status_changed",
            event_type="registration_management",
            user_id=admin_user_id,
            resource_type="Registration",
            resource_id=str(reg.id),
            details=f"Status changed from {old_status.value} to {data.status.value}. Reason: {data.reason or 'None'}",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            endpoint=request.url.path,
            http_method=request.method,
        )

        return self._format_registration(reg)
