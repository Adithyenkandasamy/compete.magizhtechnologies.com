import uuid
from typing import Optional

from fastapi import APIRouter, Query

from app.api.deps import SessionDep
from app.models.enums import EventStatus, EventType
from app.schemas.event import EventPublicResponse, PaginatedResponse
from app.services.event_service import EventService

router = APIRouter(prefix="/events", tags=["Events (Public)"])


@router.get(
    "",
    response_model=PaginatedResponse[EventPublicResponse],
    summary="List all public events",
)
async def list_events(
    session: SessionDep,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    event_type: Optional[EventType] = None,
    status: Optional[EventStatus] = None,
    search: Optional[str] = None,
) -> PaginatedResponse[EventPublicResponse]:
    """
    Get a paginated list of published/active events.
    Drafts are automatically excluded.
    """
    service = EventService(session)
    # Only allow fetching non-draft events via this public endpoint
    return await service.list_events(
        page=page,
        size=size,
        event_type=event_type,
        status_filter=status,
        search=search,
        public_only=True,
    ) # type: ignore


@router.get(
    "/{event_id}",
    response_model=EventPublicResponse,
    summary="Get public event details",
)
async def get_event(
    event_id: uuid.UUID,
    session: SessionDep,
) -> EventPublicResponse:
    """
    Get public details of a specific event. Returns 404 if the event is a draft.
    """
    service = EventService(session)
    event = await service.get_event_or_404(event_id, public_only=True)
    return event # type: ignore
