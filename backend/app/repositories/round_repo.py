import uuid
from typing import Optional, Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event import Event, EventRound
from app.schemas.round import EventRoundCreate, EventRoundUpdate


class RoundRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_event(self, event_id: uuid.UUID) -> Optional[Event]:
        stmt = select(Event).where(Event.id == event_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_rounds(self, event_id: uuid.UUID) -> list[EventRound]:
        stmt = (
            select(EventRound)
            .where(EventRound.event_id == event_id)
            .order_by(EventRound.order.asc(), EventRound.created_at.asc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_round(self, round_id: uuid.UUID) -> Optional[EventRound]:
        stmt = select(EventRound).where(EventRound.id == round_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_round_in_event(
        self, event_id: uuid.UUID, round_id: uuid.UUID
    ) -> Optional[EventRound]:
        stmt = select(EventRound).where(
            EventRound.id == round_id, EventRound.event_id == event_id
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def next_order(self, event_id: uuid.UUID) -> int:
        rounds = await self.list_rounds(event_id)
        return max((r.order for r in rounds), default=0) + 1

    async def create_round(
        self, event_id: uuid.UUID, data: EventRoundCreate
    ) -> EventRound:
        payload = data.model_dump()
        if not payload.get("order"):
            payload["order"] = await self.next_order(event_id)
        payload["event_id"] = event_id
        round_obj = EventRound(**payload)
        self.session.add(round_obj)
        await self.session.flush()
        await self.session.refresh(round_obj)
        return round_obj

    async def update_round(
        self, round_obj: EventRound, data: EventRoundUpdate
    ) -> EventRound:
        payload = {k: v for k, v in data.model_dump().items() if v is not None}
        for key, value in payload.items():
            setattr(round_obj, key, value)
        await self.session.flush()
        await self.session.refresh(round_obj)
        return round_obj

    async def delete_round(self, round_obj: EventRound) -> None:
        await self.session.delete(round_obj)
        await self.session.flush()