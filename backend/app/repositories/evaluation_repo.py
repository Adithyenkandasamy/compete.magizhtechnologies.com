import uuid
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import SubmissionStatus
from app.models.judge import Evaluation, Judge
from app.models.project import Project, Submission
from app.models.team import Team
from app.models.user import User


class EvaluationRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, evaluation_id: uuid.UUID) -> Optional[Evaluation]:
        """Fetch basic evaluation by ID."""
        stmt = select(Evaluation).where(Evaluation.id == evaluation_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id_with_lock(self, evaluation_id: uuid.UUID) -> Optional[Evaluation]:
        """Fetch evaluation with row-level lock (FOR UPDATE)."""
        stmt = select(Evaluation).where(Evaluation.id == evaluation_id).with_for_update()
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id_with_details(self, evaluation_id: uuid.UUID) -> Optional[Evaluation]:
        """Fetch evaluation with full eager loaded details."""
        stmt = (
            select(Evaluation)
            .options(
                selectinload(Evaluation.judge).selectinload(Judge.user),
                selectinload(Evaluation.submission).selectinload(Submission.event),
                selectinload(Evaluation.submission).selectinload(Submission.project).selectinload(Project.team),
            )
            .where(Evaluation.id == evaluation_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_submission_and_judge(
        self, submission_id: uuid.UUID, judge_id: uuid.UUID
    ) -> Optional[Evaluation]:
        """Find evaluation for a specific submission by a specific judge."""
        stmt = select(Evaluation).where(
            Evaluation.submission_id == submission_id,
            Evaluation.judge_id == judge_id,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_evaluation(self, evaluation: Evaluation) -> Evaluation:
        """Persist new evaluation."""
        self.session.add(evaluation)
        await self.session.flush()
        await self.session.refresh(evaluation)
        return evaluation

    async def update_evaluation(
        self, evaluation: Evaluation, update_data: dict
    ) -> Evaluation:
        """Update evaluation record."""
        for key, value in update_data.items():
            setattr(evaluation, key, value)
        await self.session.flush()
        await self.session.refresh(evaluation)
        return evaluation

    async def list_evaluations(
        self,
        offset: int = 0,
        limit: int = 20,
        event_id: Optional[uuid.UUID] = None,
        submission_id: Optional[uuid.UUID] = None,
        judge_id: Optional[uuid.UUID] = None,
    ) -> tuple[list[Evaluation], int]:
        """
        List evaluations with filtering, pagination, and eager loading to prevent N+1 queries.
        Returns (items, total_count).
        """
        stmt = (
            select(Evaluation)
            .join(Evaluation.submission)
            .options(
                selectinload(Evaluation.judge).selectinload(Judge.user),
                selectinload(Evaluation.submission).selectinload(Submission.event),
                selectinload(Evaluation.submission).selectinload(Submission.project).selectinload(Project.team),
            )
        )
        count_stmt = select(func.count(Evaluation.id)).select_from(Evaluation).join(Evaluation.submission)

        if event_id:
            stmt = stmt.where(Submission.event_id == event_id)
            count_stmt = count_stmt.where(Submission.event_id == event_id)

        if submission_id:
            stmt = stmt.where(Evaluation.submission_id == submission_id)
            count_stmt = count_stmt.where(Evaluation.submission_id == submission_id)

        if judge_id:
            stmt = stmt.where(Evaluation.judge_id == judge_id)
            count_stmt = count_stmt.where(Evaluation.judge_id == judge_id)

        stmt = stmt.order_by(Evaluation.created_at.desc()).offset(offset).limit(limit)

        total = (await self.session.execute(count_stmt)).scalar_one()
        items = list((await self.session.execute(stmt)).scalars().all())

        return items, total

    async def count_evaluations_for_submission(self, submission_id: uuid.UUID) -> int:
        """Count how many evaluations a submission has received."""
        stmt = select(func.count(Evaluation.id)).where(Evaluation.submission_id == submission_id)
        result = await self.session.execute(stmt)
        return result.scalar_one() or 0

    async def get_event_judging_metrics(self, event_id: uuid.UUID) -> dict:
        """Calculate event judging summary metrics efficiently using SQL aggregates."""
        # Total submissions for event (excluding DRAFT)
        total_sub_stmt = (
            select(func.count(Submission.id))
            .where(Submission.event_id == event_id, Submission.status != SubmissionStatus.DRAFT)
        )
        total_submissions = (await self.session.execute(total_sub_stmt)).scalar_one() or 0

        # Submissions evaluated
        eval_sub_stmt = (
            select(func.count(Submission.id))
            .where(Submission.event_id == event_id, Submission.status == SubmissionStatus.EVALUATED)
        )
        submissions_evaluated = (await self.session.execute(eval_sub_stmt)).scalar_one() or 0

        # Submissions pending
        submissions_pending = max(0, total_submissions - submissions_evaluated)

        # Total evaluations count and average score across event
        stats_stmt = (
            select(
                func.count(Evaluation.id),
                func.avg(Evaluation.total_score),
            )
            .join(Submission, Evaluation.submission_id == Submission.id)
            .where(Submission.event_id == event_id)
        )
        stats_res = (await self.session.execute(stats_stmt)).one()
        evaluations_count = stats_res[0] or 0
        average_score = round(float(stats_res[1]), 2) if stats_res[1] is not None else None

        return {
            "total_submissions": total_submissions,
            "submissions_evaluated": submissions_evaluated,
            "submissions_pending": submissions_pending,
            "evaluations_count": evaluations_count,
            "average_score": average_score,
        }
