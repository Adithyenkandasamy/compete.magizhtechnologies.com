import uuid
from typing import Optional

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import SubmissionStatus
from app.models.event import Event
from app.models.project import Project, Submission
from app.models.team import Team, TeamMember
from app.models.user import User


class SubmissionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_submission_by_id(self, submission_id: uuid.UUID) -> Optional[Submission]:
        """Fetch a basic submission by ID."""
        stmt = select(Submission).where(Submission.id == submission_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_submission_by_id_with_lock(self, submission_id: uuid.UUID) -> Optional[Submission]:
        """Fetch submission with row-level lock (FOR UPDATE) for safe concurrent final submission."""
        stmt = select(Submission).where(Submission.id == submission_id).with_for_update()
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_submission_by_project_id(self, project_id: uuid.UUID) -> Optional[Submission]:
        """Fetch submission associated with a project."""
        stmt = select(Submission).where(Submission.project_id == project_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_submission_with_details(self, submission_id: uuid.UUID) -> Optional[Submission]:
        """Fetch submission with eager loading of project, team, members, and event (prevents N+1)."""
        stmt = (
            select(Submission)
            .options(
                selectinload(Submission.event),
                selectinload(Submission.project).selectinload(Project.team).selectinload(Team.members).selectinload(TeamMember.user).selectinload(User.profile),
            )
            .where(Submission.id == submission_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_submission(self, submission: Submission) -> Submission:
        """Create and flush a new submission record."""
        self.session.add(submission)
        await self.session.flush()
        await self.session.refresh(submission)
        return submission

    async def update_submission(
        self, submission: Submission, update_data: dict
    ) -> Submission:
        """Update fields on a submission."""
        for key, value in update_data.items():
            setattr(submission, key, value)
        await self.session.flush()
        await self.session.refresh(submission)
        return submission

    async def list_submissions(
        self,
        offset: int = 0,
        limit: int = 20,
        event_id: Optional[uuid.UUID] = None,
        status: Optional[SubmissionStatus] = None,
        search: Optional[str] = None,
    ) -> tuple[list[Submission], int]:
        """
        List submissions with filtering, pagination, and eager loading to prevent N+1 queries.
        Returns (items, total_count).
        """
        stmt = (
            select(Submission)
            .join(Submission.project)
            .options(
                selectinload(Submission.event),
                selectinload(Submission.project).selectinload(Project.team).selectinload(Team.members).selectinload(TeamMember.user).selectinload(User.profile),
            )
        )
        count_stmt = select(func.count(Submission.id)).select_from(Submission).join(Submission.project)

        if event_id:
            stmt = stmt.where(Submission.event_id == event_id)
            count_stmt = count_stmt.where(Submission.event_id == event_id)

        if status:
            stmt = stmt.where(Submission.status == status)
            count_stmt = count_stmt.where(Submission.status == status)

        if search:
            search_pattern = f"%{search.strip()}%"
            search_filter = Project.title.ilike(search_pattern)
            stmt = stmt.where(search_filter)
            count_stmt = count_stmt.where(search_filter)

        # Order by newest first
        stmt = stmt.order_by(Submission.created_at.desc()).offset(offset).limit(limit)

        total_result = await self.session.execute(count_stmt)
        total = total_result.scalar_one()

        result = await self.session.execute(stmt)
        items = list(result.scalars().all())

        return items, total
