import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import ResultStatus, SubmissionStatus
from app.models.judge import Evaluation
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

    async def get_latest_version(self, event_id: uuid.UUID) -> int:
        """Get highest result version calculated for this event, default 1."""
        stmt = select(func.max(EventResult.version)).where(EventResult.event_id == event_id)
        max_ver = (await self.session.execute(stmt)).scalar_one_or_none()
        return max_ver if max_ver is not None else 1

    async def get_published_version(self, event_id: uuid.UUID) -> Optional[int]:
        """Get latest published version for this event, if any."""
        stmt = (
            select(func.max(EventResult.version))
            .where(
                EventResult.event_id == event_id,
                EventResult.status == ResultStatus.PUBLISHED,
            )
        )
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def get_by_submission_and_event(
        self,
        submission_id: uuid.UUID,
        event_id: uuid.UUID,
        version: Optional[int] = None,
    ) -> Optional[EventResult]:
        """Fetch result for a given submission in an event."""
        stmt = (
            select(EventResult)
            .options(
                selectinload(EventResult.project),
                selectinload(EventResult.team).selectinload(Team.members).selectinload(TeamMember.user).selectinload(User.profile),
                selectinload(EventResult.submission),
                selectinload(EventResult.event),
            )
            .where(
                EventResult.submission_id == submission_id,
                EventResult.event_id == event_id,
            )
        )
        if version is not None:
            stmt = stmt.where(EventResult.version == version)
        else:
            # Prefer published version, or highest version
            stmt = stmt.order_by(EventResult.is_published.desc(), EventResult.version.desc())

        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def list_results_for_event(
        self,
        event_id: uuid.UUID,
        version: Optional[int] = None,
        status: Optional[ResultStatus] = None,
        published_only: bool = False,
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
            stmt = stmt.where(EventResult.status == ResultStatus.PUBLISHED)
        elif status is not None:
            stmt = stmt.where(EventResult.status == status)

        if version is not None:
            stmt = stmt.where(EventResult.version == version)

        stmt = stmt.order_by(EventResult.rank.asc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def save_results_batch(
        self,
        event_id: uuid.UUID,
        version: int,
        results: list[EventResult],
    ) -> list[EventResult]:
        """
        Save calculated results for an event and version.
        If draft results exist for this version, safely replace them.
        """
        # Delete prior draft results for this specific version
        del_stmt = delete(EventResult).where(
            EventResult.event_id == event_id,
            EventResult.version == version,
            EventResult.status == ResultStatus.DRAFT,
        )
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
        result.updated_at = datetime.now(timezone.utc)
        await self.session.flush()
        await self.session.refresh(result)
        return result

    async def publish_version(
        self, event_id: uuid.UUID, version: int, published_at: datetime
    ) -> int:
        """
        Mark all results for this event version as PUBLISHED.
        """
        stmt = (
            update(EventResult)
            .where(
                EventResult.event_id == event_id,
                EventResult.version == version,
            )
            .values(
                status=ResultStatus.PUBLISHED,
                is_published=True,
                published_at=published_at,
                updated_at=published_at,
            )
        )
        res = await self.session.execute(stmt)
        await self.session.flush()
        return res.rowcount

    async def get_status_metrics(self, event_id: uuid.UUID) -> dict:
        """
        Fetch summary metrics about an event's result status.
        """
        # Count total eligible evaluated submissions
        eligible_stmt = (
            select(func.count(Submission.id))
            .where(
                Submission.event_id == event_id,
                Submission.status != SubmissionStatus.DRAFT,
            )
        )
        total_eligible = (await self.session.execute(eligible_stmt)).scalar_one() or 0

        # Count total evaluations in event
        eval_stmt = (
            select(func.count(Evaluation.id))
            .join(Submission, Evaluation.submission_id == Submission.id)
            .where(Submission.event_id == event_id)
        )
        total_evals = (await self.session.execute(eval_stmt)).scalar_one() or 0

        # Latest result row
        latest_stmt = (
            select(EventResult)
            .where(EventResult.event_id == event_id)
            .order_by(EventResult.version.desc(), EventResult.rank.asc())
        )
        latest_res = (await self.session.execute(latest_stmt)).scalars().first()

        has_results = latest_res is not None
        current_version = latest_res.version if latest_res else 1
        current_status = latest_res.status if latest_res else None
        calculated_at = latest_res.calculated_at if latest_res else None
        published_at = latest_res.published_at if latest_res else None

        ranked_count = 0
        if has_results:
            count_stmt = select(func.count(EventResult.id)).where(
                EventResult.event_id == event_id,
                EventResult.version == current_version,
            )
            ranked_count = (await self.session.execute(count_stmt)).scalar_one() or 0

        return {
            "has_results": has_results,
            "status": current_status,
            "version": current_version,
            "calculated_at": calculated_at,
            "published_at": published_at,
            "ranked_submissions_count": ranked_count,
            "total_eligible_submissions": total_eligible,
            "total_evaluations": total_evals,
        }
