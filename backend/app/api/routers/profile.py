from fastapi import APIRouter, Depends

from app.api.deps import SessionDep, get_current_user
from app.models.user import User
from app.schemas.profile import ProfileResponse, ProfileUpdate
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