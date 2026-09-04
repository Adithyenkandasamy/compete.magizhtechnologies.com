import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request, status

from app.api.deps import SessionDep, require_admin
from app.models.enums import EventStatus, EventType
from app.schemas.event import (
    EventAdminResponse,
    EventCreate,
    EventUpdate,
    PaginatedResponse,
)
from app.services.event_service import EventService

router = APIRouter(
    prefix="/admin/events",
    tags=["Events (Admin)"],
    dependencies=[Depends(require_admin)],
)


@router.get(
    "",
    response_model=PaginatedResponse[EventAdminResponse],
    summary="List all events (including drafts)",
)
async def list_admin_events(
    session: SessionDep,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    event_type: Optional[EventType] = None,
    status_filter: Optional[EventStatus] = Query(None, alias="status"),
    search: Optional[str] = None,
) -> PaginatedResponse[EventAdminResponse]:
    """Admin endpoint to list all events."""
    service = EventService(session)
    return await service.list_events(
        page=page,
        size=size,
        event_type=event_type,
        status_filter=status_filter,
        search=search,
        public_only=False,
    ) # type: ignore


@router.get(
    "/{event_id}",
    response_model=EventAdminResponse,
    summary="Get full event details",
)
async def get_admin_event(
    event_id: uuid.UUID,
    session: SessionDep,
) -> EventAdminResponse:
    """Admin endpoint to fetch an event regardless of status."""
    service = EventService(session)
    event = await service.get_event_or_404(event_id, public_only=False)
    return event # type: ignore


@router.post(
    "",
    response_model=EventAdminResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new event",
)
async def create_event(
    request: Request,
    data: EventCreate,
    session: SessionDep,
) -> EventAdminResponse:
    """Create a new event. Defaults to DRAFT status."""
    service = EventService(session)
    event = await service.create_event(data, request)
    return event # type: ignore


@router.put(
    "/{event_id}",
    response_model=EventAdminResponse,
    summary="Update an event",
)
async def update_event(
    event_id: uuid.UUID,
    request: Request,
    data: EventUpdate,
    session: SessionDep,
) -> EventAdminResponse:
    """Update event properties."""
    service = EventService(session)
    event = await service.update_event(event_id, data, request)
    return event # type: ignore


@router.delete(
    "/{event_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete or cancel an event",
)
async def delete_event(
    event_id: uuid.UUID,
    request: Request,
    session: SessionDep,
) -> dict:
    """
    Safely delete or cancel an event.
    Hard-deletes isolated drafts, otherwise cancels the event to preserve data.
    """
    service = EventService(session)
    return await service.delete_event(event_id, request)


@router.post(
    "/{event_id}/publish",
    response_model=EventAdminResponse,
    summary="Publish an event",
)
async def publish_event(
    event_id: uuid.UUID,
    request: Request,
    session: SessionDep,
) -> EventAdminResponse:
    """Change event status from DRAFT to PUBLISHED."""
    service = EventService(session)
    event = await service.publish_event(event_id, request)
    return event # type: ignore


@router.post(
    "/{event_id}/unpublish",
    response_model=EventAdminResponse,
    summary="Unpublish an event",
)
async def unpublish_event(
    event_id: uuid.UUID,
    request: Request,
    session: SessionDep,
) -> EventAdminResponse:
    """Change event status from PUBLISHED to DRAFT."""
    service = EventService(session)
    event = await service.unpublish_event(event_id, request)
    return event # type: ignore
