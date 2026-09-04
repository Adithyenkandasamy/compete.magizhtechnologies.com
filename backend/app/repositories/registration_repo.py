import uuid
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import RegistrationStatus
from app.models.event import Event
from app.models.registration import Registration


class RegistrationRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_event_with_lock(self, event_id: uuid.UUID) -> Optional[Event]:
        """Fetch event with row-level lock (FOR UPDATE) to prevent concurrency issues."""
        stmt = select(Event).where(Event.id == event_id).with_for_update()
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def count_active_registrations(self, event_id: uuid.UUID) -> int:
        """Count how many users are actively registered (CONFIRMED) for an event."""
        stmt = (
            select(func.count())
            .select_from(Registration)
            .where(
                Registration.event_id == event_id,
                Registration.status == RegistrationStatus.CONFIRMED,
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def get_registration_by_event_and_user(
        self, event_id: uuid.UUID, user_id: uuid.UUID
    ) -> Optional[Registration]:
        """Find a user's registration for a specific event."""
        stmt = select(Registration).where(
            Registration.event_id == event_id, Registration.user_id == user_id
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_registration_by_id_and_user(
        self, registration_id: uuid.UUID, user_id: uuid.UUID
    ) -> Optional[Registration]:
        """Fetch a specific registration, ensuring it belongs to the user."""
        stmt = (
            select(Registration)
            .options(selectinload(Registration.event))
            .where(Registration.id == registration_id, Registration.user_id == user_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_user_registrations(
        self,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 20,
        status: Optional[RegistrationStatus] = None,
    ) -> tuple[list[Registration], int]:
        """Fetch a user's registrations with pagination and optional filtering."""
        stmt = (
            select(Registration)
            .options(selectinload(Registration.event))
            .where(Registration.user_id == user_id)
        )
        count_stmt = select(func.count()).select_from(Registration).where(Registration.user_id == user_id)

        if status:
            stmt = stmt.where(Registration.status == status)
            count_stmt = count_stmt.where(Registration.status == status)

        stmt = stmt.order_by(Registration.registered_at.desc()).offset(skip).limit(limit)

        total_result = await self.session.execute(count_stmt)
        total = total_result.scalar_one()

        result = await self.session.execute(stmt)
        items = list(result.scalars().all())

        return items, total

    async def create_registration(
        self, event_id: uuid.UUID, user_id: uuid.UUID, status: RegistrationStatus
    ) -> Registration:
        """Create a new registration."""
        registration = Registration(
            event_id=event_id, user_id=user_id, status=status
        )
        self.session.add(registration)
        await self.session.flush()
        await self.session.refresh(registration)
        return registration

    async def update_registration_status(
        self, registration: Registration, status: RegistrationStatus
    ) -> Registration:
        """Update the status of an existing registration (e.g., to cancel it)."""
        registration.status = status
        await self.session.flush()
        await self.session.refresh(registration)
        return registration
