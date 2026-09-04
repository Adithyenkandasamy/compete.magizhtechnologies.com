import uuid
from typing import Optional, Any

from sqlalchemy import func, select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import EventStatus, EventType
from app.models.event import Event
from app.schemas.event import EventCreate, EventUpdate


class EventRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_events(
        self,
        skip: int = 0,
        limit: int = 20,
        event_type: Optional[EventType] = None,
        status: Optional[EventStatus] = None,
        search: Optional[str] = None,
        public_only: bool = False,
    ) -> tuple[list[Event], int]:
        """Fetch events with filtering and pagination. Returns (items, total_count)."""
        stmt = select(Event)
        count_stmt = select(func.count()).select_from(Event)

        # Filters
        if public_only:
            stmt = stmt.where(Event.status != EventStatus.DRAFT)
            count_stmt = count_stmt.where(Event.status != EventStatus.DRAFT)
        elif status:
            stmt = stmt.where(Event.status == status)
            count_stmt = count_stmt.where(Event.status == status)

        if event_type:
            stmt = stmt.where(Event.event_type == event_type)
            count_stmt = count_stmt.where(Event.event_type == event_type)

        if search:
            search_filter = or_(
                Event.title.ilike(f"%{search}%"),
                Event.slug.ilike(f"%{search}%")
            )
            stmt = stmt.where(search_filter)
            count_stmt = count_stmt.where(search_filter)

        # Ordering (newest first)
        stmt = stmt.order_by(Event.created_at.desc())

        # Pagination
        stmt = stmt.offset(skip).limit(limit)

        total_result = await self.session.execute(count_stmt)
        total = total_result.scalar_one()

        result = await self.session.execute(stmt)
        items = list(result.scalars().all())

        return items, total

    async def get_by_id(self, event_id: uuid.UUID) -> Optional[Event]:
        """Fetch event by ID."""
        stmt = select(Event).where(Event.id == event_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> Optional[Event]:
        """Fetch event by slug."""
        stmt = select(Event).where(Event.slug == slug)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_event(self, data: dict[str, Any]) -> Event:
        """Create a new event."""
        event = Event(**data)
        self.session.add(event)
        await self.session.flush()
        await self.session.refresh(event)
        return event

    async def update_event(self, event: Event, data: dict[str, Any]) -> Event:
        """Update an existing event."""
        for key, value in data.items():
            setattr(event, key, value)
        await self.session.flush()
        await self.session.refresh(event)
        return event

    async def count_event_dependencies(self, event_id: uuid.UUID) -> int:
        """
        Count registrations, teams, or projects associated with an event.
        Used to determine if safe to hard delete.
        """
        # Because we only have these models defined via relationships in Event,
        # we can just query the registrations count to get a sense. 
        # A more robust check might check all dependent tables.
        from app.models.registration import Registration
        from app.models.team import Team
        from app.models.project import Project

        reg_stmt = select(func.count()).select_from(Registration).where(Registration.event_id == event_id)
        team_stmt = select(func.count()).select_from(Team).where(Team.event_id == event_id)
        proj_stmt = select(func.count()).select_from(Project).where(Project.event_id == event_id)

        reg_count = (await self.session.execute(reg_stmt)).scalar_one()
        team_count = (await self.session.execute(team_stmt)).scalar_one()
        proj_count = (await self.session.execute(proj_stmt)).scalar_one()

        return reg_count + team_count + proj_count

    async def delete_event(self, event: Event) -> None:
        """Hard delete an event from the database."""
        await self.session.delete(event)
        await self.session.flush()
