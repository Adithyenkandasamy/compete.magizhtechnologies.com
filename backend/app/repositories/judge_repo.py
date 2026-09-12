import uuid
from typing import Optional

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.judge import Evaluation, Judge
from app.models.user import User


class JudgeRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, judge_id: uuid.UUID) -> Optional[Judge]:
        """Fetch judge by ID with user relation."""
        stmt = (
            select(Judge)
            .options(selectinload(Judge.user))
            .where(Judge.id == judge_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_user_id(self, user_id: uuid.UUID) -> Optional[Judge]:
        """Fetch judge profile by associated user ID."""
        stmt = (
            select(Judge)
            .options(selectinload(Judge.user))
            .where(Judge.user_id == user_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_judge(self, judge: Judge) -> Judge:
        """Add and flush new judge record."""
        self.session.add(judge)
        await self.session.flush()
        await self.session.refresh(judge)
        return judge

    async def update_judge(self, judge: Judge, update_data: dict) -> Judge:
        """Update fields on judge record."""
        for key, value in update_data.items():
            setattr(judge, key, value)
        await self.session.flush()
        await self.session.refresh(judge)
        return judge

    async def delete_judge(self, judge: Judge) -> None:
        """Hard delete a judge record (only when no historical evaluations exist)."""
        await self.session.delete(judge)
        await self.session.flush()

    async def has_evaluations(self, judge_id: uuid.UUID) -> bool:
        """Check if judge has performed any evaluations."""
        stmt = select(func.count(Evaluation.id)).where(Evaluation.judge_id == judge_id)
        result = await self.session.execute(stmt)
        return (result.scalar_one() or 0) > 0

    async def list_judges(
        self,
        offset: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> tuple[list[Judge], int]:
        """List judges with pagination, eager loading, and filtering."""
        stmt = select(Judge).options(selectinload(Judge.user))
        count_stmt = select(func.count(Judge.id))

        if is_active is not None:
            stmt = stmt.where(Judge.is_active == is_active)
            count_stmt = count_stmt.where(Judge.is_active == is_active)

        if search:
            pattern = f"%{search.strip()}%"
            search_filter = or_(
                Judge.name.ilike(pattern),
                Judge.user.has(User.email.ilike(pattern)),
            )
            stmt = stmt.where(search_filter)
            count_stmt = count_stmt.join(Judge.user).where(search_filter)

        stmt = stmt.order_by(Judge.created_at.desc()).offset(offset).limit(limit)

        total = (await self.session.execute(count_stmt)).scalar_one()
        items = list((await self.session.execute(stmt)).scalars().all())

        return items, total
