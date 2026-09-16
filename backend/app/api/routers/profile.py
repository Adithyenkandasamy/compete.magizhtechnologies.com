import uuid
from fastapi import APIRouter, Depends

from app.api.deps import SessionDep, get_current_user
from app.models.user import User
from app.schemas.profile import (
    ProfilePublicResponse,
    ProfileResponse,
    ProfileUpdate,
    StudentIdentityResponse,
)
from app.services.profile_service import ProfileService

router = APIRouter(
    prefix="/api/me",
    tags=["Profile"],
    dependencies=[Depends(get_current_user)],
)


@router.get(
    "/profile",
    response_model=ProfileResponse,
    summary="Get the current user's profile",
)
async def get_my_profile(
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> ProfileResponse:
    """Return the authenticated user's profile."""
    service = ProfileService(session)
    profile = await service.get_profile(current_user.id)
    return profile  # type: ignore


@router.put(
    "/profile",
    response_model=ProfileResponse,
    summary="Update the current user's profile",
)
async def update_my_profile(
    data: ProfileUpdate,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> ProfileResponse:
    """Update the authenticated user's profile with the provided fields."""
    service = ProfileService(session)
    profile = await service.update_profile(current_user.id, data)
    return profile  # type: ignore


@router.get(
    "/identity",
    response_model=StudentIdentityResponse,
    summary="Get the current user's official Magizh Student Identity",
)
async def get_my_identity(
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> StudentIdentityResponse:
    """Return the permanent Magizh Student Identity credential."""
    service = ProfileService(session)
    return await service.get_identity(current_user.id)


# ---------------------------------------------------------------------------
# Public QR verification router (no authentication required)
# ---------------------------------------------------------------------------

public_router = APIRouter(
    prefix="/api/public",
    tags=["Public Verification"],
)


@public_router.get(
    "/students/{identifier}/verify",
    response_model=ProfilePublicResponse,
    summary="Public student QR verification",
    description="Verify student credential authenticity via QR scan by Magizh Student ID or UUID without authentication.",
)
async def verify_student_public(
    identifier: str,
    session: SessionDep,
) -> ProfilePublicResponse:
    """Return public non-sensitive student profile details for QR verification."""
    service = ProfileService(session)
    return await service.verify_public_student(identifier)