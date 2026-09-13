import uuid

from fastapi import APIRouter, Depends, Request, status

from app.api.deps import CurrentUserDep, SessionDep, require_admin
from app.schemas.admin_badges import (
    AdminBadgeCreate,
    AdminBadgeResponse,
    AdminBadgeUpdate,
    AwardBadgeRequest,
)
from app.services.admin_badge_service import AdminBadgeService

router = APIRouter(
    prefix="/admin/badges",
    tags=["Badges (Admin)"],
    dependencies=[Depends(require_admin)],
)


@router.get(
    "",
    response_model=list[AdminBadgeResponse],
    summary="List all badges",
    description="Retrieve all platform achievement badges with recipient counts.",
)
async def list_badges(
    session: SessionDep,
) -> list[AdminBadgeResponse]:
    service = AdminBadgeService(session)
    return await service.list_badges()


@router.post(
    "",
    response_model=AdminBadgeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a badge",
    description="Define a new platform achievement badge.",
)
async def create_badge(
    data: AdminBadgeCreate,
    request: Request,
    session: SessionDep,
    current_user: CurrentUserDep,
) -> AdminBadgeResponse:
    service = AdminBadgeService(session)
    return await service.create_badge(
        data=data,
        admin_user_id=current_user.id,
        request=request,
    )


@router.get(
    "/{badge_id}",
    response_model=AdminBadgeResponse,
    summary="Get badge details",
    description="Fetch single badge by ID.",
)
async def get_badge(
    badge_id: uuid.UUID,
    session: SessionDep,
) -> AdminBadgeResponse:
    service = AdminBadgeService(session)
    return await service.get_badge(badge_id)


@router.put(
    "/{badge_id}",
    response_model=AdminBadgeResponse,
    summary="Update a badge",
    description="Update badge metadata (name, description, icon).",
)
async def update_badge(
    badge_id: uuid.UUID,
    data: AdminBadgeUpdate,
    request: Request,
    session: SessionDep,
    current_user: CurrentUserDep,
) -> AdminBadgeResponse:
    service = AdminBadgeService(session)
    return await service.update_badge(
        badge_id=badge_id,
        data=data,
        admin_user_id=current_user.id,
        request=request,
    )


@router.delete(
    "/{badge_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a badge",
    description="Remove badge and cascade unlink user achievements.",
)
async def delete_badge(
    badge_id: uuid.UUID,
    request: Request,
    session: SessionDep,
    current_user: CurrentUserDep,
) -> dict:
    service = AdminBadgeService(session)
    return await service.delete_badge(
        badge_id=badge_id,
        admin_user_id=current_user.id,
        request=request,
    )


@router.post(
    "/{badge_id}/award",
    status_code=status.HTTP_200_OK,
    summary="Award badge to user",
    description="Assign an achievement badge to a specific participant.",
)
async def award_badge(
    badge_id: uuid.UUID,
    data: AwardBadgeRequest,
    request: Request,
    session: SessionDep,
    current_user: CurrentUserDep,
) -> dict:
    service = AdminBadgeService(session)
    return await service.award_badge(
        badge_id=badge_id,
        data=data,
        admin_user_id=current_user.id,
        request=request,
    )
