import uuid
from datetime import datetime, timezone
from typing import Optional, Any

from fastapi import HTTPException, Request
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import EventStatus, RegistrationStatus
from app.models.registration import Registration
from app.repositories.audit_repo import AuditRepository
from app.repositories.registration_repo import RegistrationRepository
from app.schemas.event import PaginatedResponse


class RegistrationService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = RegistrationRepository(session)
        self.audit_repo = AuditRepository(session)

    async def _log_action(
        self,
        request: Request,
        action: str,
        resource_id: str,
        user_id: uuid.UUID,
    ):
        """Helper to log student registration actions."""
        await self.audit_repo.create_audit_log(
            action=action,
            event_type="event_registration",
            user_id=user_id,
            resource_type="Registration",
            resource_id=resource_id,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            endpoint=request.url.path,
            http_method=request.method,
        )

    def _get_utc_now(self) -> datetime:
        return datetime.now(timezone.utc)

    async def register_for_event(
        self, event_id: uuid.UUID, user_id: uuid.UUID, request: Request
    ) -> Registration:
        """
        Register a student for an event safely.
        Uses row-level locking on Event to prevent capacity race conditions.
        """
        # 1. Fetch Event with lock
        event = await self.repo.get_event_with_lock(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

        # 2. Basic Event Validations
        if event.status != EventStatus.PUBLISHED:
            raise HTTPException(status_code=400, detail="Cannot register for unpublished events")

        now = self._get_utc_now()
        
        # We need to make sure both datetimes are offset-aware for comparison
        # event.start_date / registration_deadline come from DB (timezone=True)
        if event.start_date and event.start_date < now:
            raise HTTPException(status_code=400, detail="Event has already started")

        if event.registration_deadline and event.registration_deadline < now:
            raise HTTPException(status_code=400, detail="Registration deadline has passed")

        # 3. Capacity Check
        new_status = RegistrationStatus.CONFIRMED
        if event.max_participants is not None:
            active_count = await self.repo.count_active_registrations(event_id)
            if active_count >= event.max_participants:
                # Based on user requirements: "If existing schema supports WAITLISTED, use it. Otherwise clear capacity error."
                # RegistrationStatus enum supports WAITLISTED.
                new_status = RegistrationStatus.WAITLISTED

        # 4. Attempt Registration (handle duplicates via DB Constraint)
        try:
            registration = await self.repo.create_registration(
                event_id=event_id, user_id=user_id, status=new_status
            )
        except IntegrityError:
            await self.session.rollback()
            raise HTTPException(status_code=409, detail="You are already registered for this event")
        
        # 5. Audit log
        await self._log_action(request, "registration.created", str(registration.id), user_id)
        
        return registration

    async def get_user_registrations(
        self,
        user_id: uuid.UUID,
        page: int = 1,
        size: int = 20,
        status: Optional[RegistrationStatus] = None,
    ) -> PaginatedResponse[Any]:
        """Fetch paginated registrations for a user."""
        skip = (page - 1) * size
        items, total = await self.repo.get_user_registrations(
            user_id=user_id, skip=skip, limit=size, status=status
        )
        pages = (total + size - 1) // size
        return PaginatedResponse(
            items=items, total=total, page=page, size=size, pages=pages
        )

    async def get_single_registration(
        self, registration_id: uuid.UUID, user_id: uuid.UUID
    ) -> Registration:
        """Fetch a specific registration, ensuring it belongs to the user."""
        registration = await self.repo.get_registration_by_id_and_user(registration_id, user_id)
        if not registration:
            raise HTTPException(status_code=404, detail="Registration not found")
        return registration

    async def cancel_registration(
        self, event_id: uuid.UUID, user_id: uuid.UUID, request: Request
    ) -> dict:
        """Cancel a registration before the event starts."""
        # We need the event to check start_date
        event = await self.repo.get_event_with_lock(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

        # Fetch registration
        registration = await self.repo.get_registration_by_event_and_user(event_id, user_id)
        if not registration:
            raise HTTPException(status_code=404, detail="Registration not found")

        # Check if already cancelled
        if registration.status == RegistrationStatus.CANCELLED:
            raise HTTPException(status_code=400, detail="Registration is already cancelled")

        # Time logic: do not allow cancellation after event starts
        now = self._get_utc_now()
        if event.start_date and event.start_date < now:
            raise HTTPException(
                status_code=400, 
                detail="Cannot cancel registration after the event has started"
            )

        # Cancel
        await self.repo.update_registration_status(registration, RegistrationStatus.CANCELLED)
        
        # Log
        await self._log_action(request, "registration.cancelled", str(registration.id), user_id)
        
        return {"message": "Registration successfully cancelled"}
