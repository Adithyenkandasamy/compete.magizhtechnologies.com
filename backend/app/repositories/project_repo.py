import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project


class ProjectRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_project_by_id(self, project_id: uuid.UUID) -> Optional[Project]:
        stmt = select(Project).where(Project.id == project_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_project_by_team(
        self, team_id: uuid.UUID, event_id: uuid.UUID
    ) -> Optional[Project]:
        stmt = select(Project).where(
            Project.team_id == team_id,
            Project.event_id == event_id
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_project(self, project: Project) -> Project:
        self.session.add(project)
        await self.session.flush()
        await self.session.refresh(project)
        return project

    async def update_project(
        self, project: Project, update_data: dict
    ) -> Project:
        for key, value in update_data.items():
            setattr(project, key, value)
        await self.session.flush()
        await self.session.refresh(project)
        return project

    async def delete_project(self, project: Project) -> None:
        await self.session.delete(project)
        await self.session.flush()

    async def list_projects(
        self, offset: int, limit: int
    ) -> list[Project]:
        stmt = (
            select(Project)
            .order_by(Project.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count_projects(self) -> int:
        stmt = select(Project)
        result = await self.session.execute(stmt)
        return len(result.scalars().all())
