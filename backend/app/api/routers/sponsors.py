import uuid

from fastapi import APIRouter, Depends, Request, status

from app.api.deps import SessionDep, require_admin
from app.models.user import User
from app.schemas.sponsor import SponsorCreate, SponsorResponse, SponsorUpdate
from app.services.sponsor_service import SponsorService

public_router = APIRouter(
    prefix="/api/events",
    tags=["Sponsors (Public)"],
)


@public_router.get(
    "/{event_id}/sponsors",
    response_model=list[SponsorResponse],
    summary="List sponsors for an event",
)
async def list_event_sponsors(
    event_id: uuid.UUID,
    session: SessionDep,
) -> list[SponsorResponse]:
    service = SponsorService(session)
    sponsors = await service.list_event_sponsors(event_id)
    return sponsors  # type: ignore


router = APIRouter(
    prefix="/api/admin/events",
    tags=["Sponsors (Admin)"],
    dependencies=[Depends(require_admin)],
)


@router.post(
    "/{event_id}/sponsors",
    response_model=SponsorResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a sponsor to an event",
)
async def create_sponsor(
    event_id: uuid.UUID,
    data: SponsorCreate,
    request: Request,
    session: SessionDep,
    current_user: User = Depends(require_admin),
) -> SponsorResponse:
    service = SponsorService(session)
    sponsor = await service.create_sponsor(
        event_id, data, request, current_user.id
    )
    return sponsor  # type: ignore


@router.put(
    "/{event_id}/sponsors/{sponsor_id}",
    response_model=SponsorResponse,
    summary="Update an event sponsor",
)
async def update_sponsor(
    event_id: uuid.UUID,
    sponsor_id: uuid.UUID,
    data: SponsorUpdate,
    request: Request,
    session: SessionDep,
    current_user: User = Depends(require_admin),
) -> SponsorResponse:
    service = SponsorService(session)
    sponsor = await service.update_sponsor(
        event_id, sponsor_id, data, request, current_user.id
    )
    return sponsor  # type: ignore


@router.delete(
    "/{event_id}/sponsors/{sponsor_id}",
    status_code=status.HTTP_200_OK,
    summary="Remove a sponsor from an event",
)
async def delete_sponsor(
    event_id: uuid.UUID,
    sponsor_id: uuid.UUID,
    request: Request,
    session: SessionDep,
    current_user: User = Depends(require_admin),
) -> dict:
    service = SponsorService(session)
    return await service.delete_sponsor(
        event_id, sponsor_id, request, current_user.id
    )