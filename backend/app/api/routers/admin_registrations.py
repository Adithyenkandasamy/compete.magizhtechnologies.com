import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request, status

from app.api.deps import CurrentUserDep, SessionDep, require_admin
from app.models.enums import RegistrationStatus
from app.schemas.admin_registrations import (
    AdminRegistrationResponse,
    UpdateAdminRegistrationRequest,
)
from app.schemas.event import PaginatedResponse
from app.services.admin_registration_service import AdminRegistrationService

router = APIRouter(
    prefix="/admin/registrations",
    tags=["Registrations (Admin)"],
    dependencies=[Depends(require_admin)],
)


@router.get(
    "",
    response_model=PaginatedResponse[AdminRegistrationResponse],
    summary="List all registrations with filters and pagination",
    description="Retrieve registrations with eager-loaded user profiles and event summaries. Filter by event, user, status, or search.",
)
async def list_registrations(
    session: SessionDep,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    event_id: Optional[uuid.UUID] = Query(None, description="Filter by event ID"),
    user_id: Optional[uuid.UUID] = Query(None, description="Filter by user ID"),
    status: Optional[RegistrationStatus] = Query(None, description="Filter by registration status"),
    search: Optional[str] = Query(None, description="Search by student email, name, or event title"),
) -> PaginatedResponse[AdminRegistrationResponse]:
    service = AdminRegistrationService(session)
    items, total = await service.list_registrations(
        page=page,
        size=size,
        event_id=event_id,
        user_id=user_id,
        reg_status=status,
        search=search,
    )
    pages = (total + size - 1) // size if total else 0
    return PaginatedResponse[AdminRegistrationResponse](
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get(
    "/{registration_id}",
    response_model=AdminRegistrationResponse,
    summary="Get registration details",
    description="Fetch a single registration with user profile and event details.",
)
async def get_registration(
    registration_id: uuid.UUID,
    session: SessionDep,
) -> AdminRegistrationResponse:
    service = AdminRegistrationService(session)
    return await service.get_registration(registration_id)


@router.post(
    "/{registration_id}/status",
    response_model=AdminRegistrationResponse,
    summary="Update registration status (POST)",
    description="Update registration status (CONFIRMED, WAITLISTED, CANCELLED) and record an audit log.",
)
async def update_registration_status_post(
    registration_id: uuid.UUID,
    data: UpdateAdminRegistrationRequest,
    request: Request,
    session: SessionDep,
    current_user: CurrentUserDep,
) -> AdminRegistrationResponse:
    service = AdminRegistrationService(session)
    return await service.update_registration_status(
        registration_id=registration_id,
        data=data,
        admin_user_id=current_user.id,
        request=request,
    )


@router.put(
    "/{registration_id}/status",
    response_model=AdminRegistrationResponse,
    summary="Update registration status (PUT)",
    description="PUT compatibility for updating registration status.",
)
async def update_registration_status_put(
    registration_id: uuid.UUID,
    data: UpdateAdminRegistrationRequest,
    request: Request,
    session: SessionDep,
    current_user: CurrentUserDep,
) -> AdminRegistrationResponse:
    service = AdminRegistrationService(session)
    return await service.update_registration_status(
        registration_id=registration_id,
        data=data,
        admin_user_id=current_user.id,
        request=request,
    )
