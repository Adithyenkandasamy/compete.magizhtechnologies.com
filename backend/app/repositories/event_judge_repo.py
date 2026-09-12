import uuid
from typing import Optional

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.judge import EventJudge, Judge


class EventJudgeRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def is_judge_assigned(self, event_id: uuid.UUID, judge_id: uuid.UUID) -> bool:
        """Check if judge is actively assigned to an event."""
        stmt = (
            select(func.count())
            .select_from(EventJudge)
            .where(EventJudge.event_id == event_id, EventJudge.judge_id == judge_id)
        )
        result = await self.session.execute(stmt)
        return (result.scalar_one() or 0) > 0

    async def get_assignment(self, event_id: uuid.UUID, judge_id: uuid.UUID) -> Optional[EventJudge]:
        """Fetch assignment record."""
        stmt = (
            select(EventJudge)
            .options(selectinload(EventJudge.judge).selectinload(Judge.user))
            .where(EventJudge.event_id == event_id, EventJudge.judge_id == judge_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def assign_judge(
        self,
        event_id: uuid.UUID,
        judge_id: uuid.UUID,
        assigned_by: Optional[uuid.UUID] = None,
    ) -> EventJudge:
        """Create event-judge assignment."""
        assignment = EventJudge(
            event_id=event_id,
            judge_id=judge_id,
            assigned_by=assigned_by,
        )
        self.session.add(assignment)
        await self.session.flush()
        await self.session.refresh(assignment)
        return assignment

    async def remove_judge(self, event_id: uuid.UUID, judge_id: uuid.UUID) -> bool:
        """Remove event-judge assignment."""
        stmt = delete(EventJudge).where(
            EventJudge.event_id == event_id,
            EventJudge.judge_id == judge_id,
        )
        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.rowcount > 0

    async def list_judges_for_event(self, event_id: uuid.UUID) -> list[EventJudge]:
        """List all judges assigned to an event with eager loaded judge details."""
        stmt = (
            select(EventJudge)
            .options(selectinload(EventJudge.judge).selectinload(Judge.user))
            .where(EventJudge.event_id == event_id)
            .order_by(EventJudge.assigned_at.asc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_assigned_event_ids(self, judge_id: uuid.UUID) -> list[uuid.UUID]:
        """Return list of event IDs assigned to a judge."""
        stmt = select(EventJudge.event_id).where(EventJudge.judge_id == judge_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count_assigned_judges(self, event_id: uuid.UUID) -> int:
        """Count how many judges are assigned to an event."""
        stmt = select(func.count()).select_from(EventJudge).where(EventJudge.event_id == event_id)
        result = await self.session.execute(stmt)
        return result.scalar_one() or 0
