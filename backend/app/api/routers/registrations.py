import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request, status

from app.api.deps import SessionDep, get_current_user
from app.models.enums import RegistrationStatus
from app.models.user import User
from app.schemas.event import PaginatedResponse
from app.schemas.registration import RegistrationResponse, RegistrationWithEventResponse
from app.services.registration_service import RegistrationService

router = APIRouter(
    tags=["Registrations (Student)"],
    dependencies=[Depends(get_current_user)],
)


@router.post(
    "/api/events/{event_id}/register",
    response_model=RegistrationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register for an event",
)
async def register_for_event(
    event_id: uuid.UUID,
    request: Request,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> RegistrationResponse:
    """
    Register the authenticated user for an event.
    Automatically handles capacity limits and places users in WAITLISTED if full.
    """
    service = RegistrationService(session)
    registration = await service.register_for_event(event_id, current_user.id, request)
    return registration # type: ignore


@router.get(
    "/api/me/registrations",
    response_model=PaginatedResponse[RegistrationWithEventResponse],
    summary="List my registrations",
)
async def list_my_registrations(
    session: SessionDep,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status_filter: Optional[RegistrationStatus] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
) -> PaginatedResponse[RegistrationWithEventResponse]:
    """Get a paginated list of the authenticated user's registrations."""
    service = RegistrationService(session)
    return await service.get_user_registrations(
        user_id=current_user.id,
        page=page,
        size=size,
        status=status_filter,
    ) # type: ignore


@router.get(
    "/api/me/registrations/{registration_id}",
    response_model=RegistrationWithEventResponse,
    summary="Get a single registration",
)
async def get_my_registration(
    registration_id: uuid.UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> RegistrationWithEventResponse:
    """Get details of a specific registration belonging to the user."""
    service = RegistrationService(session)
    registration = await service.get_single_registration(registration_id, current_user.id)
    return registration # type: ignore


@router.delete(
    "/api/events/{event_id}/registration",
    status_code=status.HTTP_200_OK,
    summary="Cancel a registration",
)
async def cancel_my_registration(
    event_id: uuid.UUID,
    request: Request,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Cancel the user's registration for an event.
    Only allowed before the event starts.
    """
    service = RegistrationService(session)
    return await service.cancel_registration(event_id, current_user.id, request)
