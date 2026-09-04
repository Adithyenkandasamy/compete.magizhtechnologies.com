import uuid
from typing import Optional, Any

from fastapi import HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import EventStatus, EventType
from app.models.event import Event
from app.repositories.audit_repo import AuditRepository
from app.repositories.event_repo import EventRepository
from app.schemas.event import EventCreate, EventUpdate, PaginatedResponse


class EventService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = EventRepository(session)
        self.audit_repo = AuditRepository(session)

    async def _log_action(
        self,
        request: Request,
        action: str,
        resource_id: str,
        user_id: Optional[uuid.UUID] = None,
    ):
        """Helper to log admin actions."""
        # user_id is extracted from request.state if available
        current_user = getattr(request.state, "user", None)
        uid = user_id or (current_user.id if current_user else None)

        await self.audit_repo.create_audit_log(
            action=action,
            event_type="event_management",
            user_id=uid,
            resource_type="Event",
            resource_id=resource_id,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            endpoint=request.url.path,
            http_method=request.method,
            status_code=None,  # We don't have the final response code here easily, but we know it succeeded
        )

    async def list_events(
        self,
        page: int = 1,
        size: int = 20,
        event_type: Optional[EventType] = None,
        status_filter: Optional[EventStatus] = None,
        search: Optional[str] = None,
        public_only: bool = False,
    ) -> PaginatedResponse[Any]:
        """Get paginated events."""
        skip = (page - 1) * size
        items, total = await self.repo.get_events(
            skip=skip,
            limit=size,
            event_type=event_type,
            status=status_filter,
            search=search,
            public_only=public_only,
        )
        pages = (total + size - 1) // size
        return PaginatedResponse(
            items=items, total=total, page=page, size=size, pages=pages
        )

    async def get_event_or_404(self, event_id: uuid.UUID, public_only: bool = False) -> Event:
        event = await self.repo.get_by_id(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        if public_only and event.status == EventStatus.DRAFT:
            raise HTTPException(status_code=404, detail="Event not found")
        return event

    async def create_event(self, data: EventCreate, request: Request) -> Event:
        """Create a new event."""
        existing = await self.repo.get_by_slug(data.slug)
        if existing:
            raise HTTPException(status_code=409, detail="Event slug already in use")

        # Create as DRAFT by default
        create_data = data.model_dump()
        event = await self.repo.create_event(create_data)
        
        await self._log_action(request, "event.created", str(event.id))
        return event

    async def update_event(
        self, event_id: uuid.UUID, data: EventUpdate, request: Request
    ) -> Event:
        """Update event details."""
        event = await self.get_event_or_404(event_id)

        if data.slug and data.slug != event.slug:
            existing = await self.repo.get_by_slug(data.slug)
            if existing:
                raise HTTPException(status_code=409, detail="Event slug already in use")

        update_data = data.model_dump(exclude_unset=True)
        if update_data:
            event = await self.repo.update_event(event, update_data)
            await self._log_action(request, "event.updated", str(event.id))

        return event

    async def delete_event(self, event_id: uuid.UUID, request: Request) -> dict:
        """
        Safely delete or cancel an event.
        Hard delete if it's a DRAFT with no dependencies.
        Cancel if it has dependencies or has been published.
        """
        event = await self.get_event_or_404(event_id)
        
        deps_count = await self.repo.count_event_dependencies(event_id)
        
        if deps_count > 0 or event.status != EventStatus.DRAFT:
            # Soft delete / Cancel
            if event.status == EventStatus.CANCELLED:
                raise HTTPException(status_code=400, detail="Event is already cancelled")
            
            await self.repo.update_event(event, {"status": EventStatus.CANCELLED})
            await self._log_action(request, "event.cancelled", str(event.id))
            return {"message": "Event has been cancelled due to existing dependencies or non-draft status."}
        else:
            # Hard delete
            await self.repo.delete_event(event)
            await self._log_action(request, "event.deleted", str(event_id))
            return {"message": "Event hard deleted successfully."}

    async def publish_event(self, event_id: uuid.UUID, request: Request) -> Event:
        """Change event status to PUBLISHED."""
        event = await self.get_event_or_404(event_id)
        
        if event.status == EventStatus.PUBLISHED:
            raise HTTPException(status_code=400, detail="Event is already published")
        if event.status in [EventStatus.CANCELLED, EventStatus.COMPLETED]:
            raise HTTPException(status_code=400, detail="Cannot publish a cancelled or completed event")

        # Validate required fields for publishing
        required_fields = ["start_date", "end_date", "registration_deadline", "max_participants"]
        missing = [f for f in required_fields if getattr(event, f) is None]
        if missing:
            raise HTTPException(
                status_code=422,
                detail=f"Cannot publish event. Missing required fields: {', '.join(missing)}"
            )

        event = await self.repo.update_event(event, {"status": EventStatus.PUBLISHED})
        await self._log_action(request, "event.published", str(event.id))
        return event

    async def unpublish_event(self, event_id: uuid.UUID, request: Request) -> Event:
        """Change event status from PUBLISHED back to DRAFT."""
        event = await self.get_event_or_404(event_id)
        
        if event.status != EventStatus.PUBLISHED:
            raise HTTPException(status_code=400, detail="Only published events can be unpublished")

        event = await self.repo.update_event(event, {"status": EventStatus.DRAFT})
        await self._log_action(request, "event.unpublished", str(event.id))
        return event
