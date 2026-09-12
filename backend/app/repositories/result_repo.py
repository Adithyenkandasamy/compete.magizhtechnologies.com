import uuid
from typing import Optional

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.project import Project, Submission
from app.models.result import EventResult
from app.models.team import Team, TeamMember
from app.models.user import Profile, User


class ResultRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, result_id: uuid.UUID) -> Optional[EventResult]:
        """Fetch result record by ID with project and team details."""
        stmt = (
            select(EventResult)
            .options(
                selectinload(EventResult.project),
                selectinload(EventResult.team).selectinload(Team.members).selectinload(TeamMember.user).selectinload(User.profile),
                selectinload(EventResult.submission),
            )
            .where(EventResult.id == result_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_submission_id(self, submission_id: uuid.UUID) -> Optional[EventResult]:
        """Fetch result for a given submission."""
        stmt = (
            select(EventResult)
            .options(
                selectinload(EventResult.project),
                selectinload(EventResult.team).selectinload(Team.members).selectinload(TeamMember.user).selectinload(User.profile),
                selectinload(EventResult.submission),
                selectinload(EventResult.event),
            )
            .where(EventResult.submission_id == submission_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_event_and_submission(
        self, event_id: uuid.UUID, submission_id: uuid.UUID
    ) -> Optional[EventResult]:
        """Fetch result for an event and submission."""
        stmt = select(EventResult).where(
            EventResult.event_id == event_id,
            EventResult.submission_id == submission_id,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_results_for_event(
        self, event_id: uuid.UUID, published_only: bool = False
    ) -> list[EventResult]:
        """
        List event results ordered by rank ascending with eager loading to prevent N+1 queries.
        """
        stmt = (
            select(EventResult)
            .options(
                selectinload(EventResult.project),
                selectinload(EventResult.team).selectinload(Team.members).selectinload(TeamMember.user).selectinload(User.profile),
                selectinload(EventResult.submission),
            )
            .where(EventResult.event_id == event_id)
        )
        if published_only:
            stmt = stmt.where(EventResult.is_published == True)  # noqa: E712

        stmt = stmt.order_by(EventResult.rank.asc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def save_results_batch(
        self, event_id: uuid.UUID, results: list[EventResult]
    ) -> list[EventResult]:
        """
        Replace previous calculation for an event with fresh results in a single transaction.
        """
        # Delete prior calculated results for this event
        del_stmt = delete(EventResult).where(EventResult.event_id == event_id)
        await self.session.execute(del_stmt)

        for r in results:
            self.session.add(r)

        await self.session.flush()
        return results

    async def update_result(
        self, result: EventResult, update_data: dict
    ) -> EventResult:
        """Update result fields (award, is_winner, notes)."""
        for k, v in update_data.items():
            setattr(result, k, v)
        await self.session.flush()
        await self.session.refresh(result)
        return result

    async def publish_all_for_event(self, event_id: uuid.UUID) -> int:
        """Set is_published = True on all event result rows."""
        stmt = (
            update(EventResult)
            .where(EventResult.event_id == event_id)
            .values(is_published=True)
        )
        res = await self.session.execute(stmt)
        await self.session.flush()
        return res.rowcount

    async def unpublish_all_for_event(self, event_id: uuid.UUID) -> int:
        """Set is_published = False on all event result rows."""
        stmt = (
            update(EventResult)
            .where(EventResult.event_id == event_id)
            .values(is_published=False)
        )
        res = await self.session.execute(stmt)
        await self.session.flush()
        return res.rowcount
