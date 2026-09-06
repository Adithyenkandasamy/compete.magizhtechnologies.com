import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event import EventSponsor


class SponsorRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, sponsor_id: uuid.UUID) -> Optional[EventSponsor]:
        stmt = select(EventSponsor).where(EventSponsor.id == sponsor_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_event(self, event_id: uuid.UUID) -> list[EventSponsor]:
        stmt = (
            select(EventSponsor)
            .where(EventSponsor.event_id == event_id)
            .order_by(EventSponsor.created_at.asc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, sponsor: EventSponsor) -> EventSponsor:
        self.session.add(sponsor)
        await self.session.flush()
        await self.session.refresh(sponsor)
        return sponsor

    async def update(
        self, sponsor: EventSponsor, update_data: dict
    ) -> EventSponsor:
        for key, value in update_data.items():
            setattr(sponsor, key, value)
        await self.session.flush()
        await self.session.refresh(sponsor)
        return sponsor

    async def delete(self, sponsor: EventSponsor) -> None:
        await self.session.delete(sponsor)
        await self.session.flush()