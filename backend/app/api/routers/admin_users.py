import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import SessionDep, require_admin
from app.models.enums import AccountStatus, UserRole
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.user_admin import (
    AdminUserResponse,
    UpdateUserRoleRequest,
    UpdateUserStatusRequest,
)

router = APIRouter(
    prefix="/admin/users",
    tags=["Users (Admin)"],
    dependencies=[Depends(require_admin)],
)


@router.get(
    "",
    response_model=list[AdminUserResponse],
    summary="List all platform users",
)
async def list_users(
    session: SessionDep,
) -> list[AdminUserResponse]:
    """Return every user with their profile loaded."""
    stmt = select(User).options(selectinload(User.profile))
    result = await session.execute(stmt)
    users = result.scalars().all()
    return [AdminUserResponse.model_validate(u) for u in users]


@router.get(
    "/{user_id}",
    response_model=AdminUserResponse,
    summary="Get a single user",
)
async def get_user(
    user_id: uuid.UUID,
    session: SessionDep,
) -> AdminUserResponse:
    """Return a user by ID with their profile loaded."""
    repo = UserRepository(session)
    user = await repo.get_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return AdminUserResponse.model_validate(user)


@router.put(
    "/{user_id}/status",
    response_model=AdminUserResponse,
    summary="Update a user's account status",
)
async def update_user_status(
    user_id: uuid.UUID,
    data: UpdateUserStatusRequest,
    session: SessionDep,
) -> AdminUserResponse:
    """Set a user's status to ACTIVE, SUSPENDED, or DELETED."""
    repo = UserRepository(session)
    user = await repo.get_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    user.status = AccountStatus(data.status)
    await session.flush()
    return AdminUserResponse.model_validate(user)


@router.put(
    "/{user_id}/role",
    response_model=AdminUserResponse,
    summary="Update a user's role",
)
async def update_user_role(
    user_id: uuid.UUID,
    data: UpdateUserRoleRequest,
    session: SessionDep,
) -> AdminUserResponse:
    """Set a user's role to STUDENT, ADMIN, or SUPER_ADMIN."""
    repo = UserRepository(session)
    user = await repo.get_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    user.role = UserRole(data.role)
    await session.flush()
    return AdminUserResponse.model_validate(user)
