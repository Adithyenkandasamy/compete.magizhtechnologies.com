import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request, status

from app.api.deps import CurrentUserDep, SessionDep, require_admin
from app.models.enums import AccountStatus, UserRole
from app.schemas.event import PaginatedResponse
from app.schemas.user_admin import (
    AdminUserResponse,
    UpdateUserRoleRequest,
    UpdateUserStatusRequest,
)
from app.services.admin_user_service import AdminUserService

router = APIRouter(
    prefix="/admin/users",
    tags=["Users (Admin)"],
    dependencies=[Depends(require_admin)],
)


@router.get(
    "",
    response_model=PaginatedResponse[AdminUserResponse],
    summary="List all platform users with filtering and search",
    description="Retrieve paginated list of users with profile data. Supports filtering by role and status, and text search across email and name.",
)
async def list_users(
    session: SessionDep,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    role: Optional[UserRole] = Query(None, description="Filter by user role"),
    account_status: Optional[AccountStatus] = Query(None, alias="status", description="Filter by account status"),
    search: Optional[str] = Query(None, description="Search by email, name, or college"),
    sort_desc: bool = Query(True, description="Sort descending by registration date"),
) -> PaginatedResponse[AdminUserResponse]:
    service = AdminUserService(session)
    items, total = await service.list_users(
        page=page,
        size=size,
        role=role,
        account_status=account_status,
        search=search,
        sort_desc=sort_desc,
    )
    pages = (total + size - 1) // size if total else 0
    return PaginatedResponse[AdminUserResponse](
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get(
    "/{user_id}",
    response_model=AdminUserResponse,
    summary="Get user details and participation statistics",
    description="Return a user by ID with profile data and aggregate participation statistics (registrations, teams, submissions, certificates).",
)
async def get_user(
    user_id: uuid.UUID,
    session: SessionDep,
) -> AdminUserResponse:
    service = AdminUserService(session)
    return await service.get_user_with_stats(user_id)


@router.put(
    "/{user_id}/status",
    response_model=AdminUserResponse,
    summary="Update user account status",
    description="Change user status (ACTIVE, SUSPENDED, DELETED). Prevents self-lockout and protects SUPER_ADMIN accounts.",
)
async def update_user_status(
    user_id: uuid.UUID,
    data: UpdateUserStatusRequest,
    request: Request,
    session: SessionDep,
    current_admin: CurrentUserDep,
) -> AdminUserResponse:
    service = AdminUserService(session)
    return await service.update_user_status(
        user_id=user_id,
        data=data,
        current_admin=current_admin,
        request=request,
    )


@router.put(
    "/{user_id}/role",
    response_model=AdminUserResponse,
    summary="Update user role with privilege escalation protection",
    description="Change user role (STUDENT, JUDGE, ADMIN, SUPER_ADMIN). Enforces strict privilege rules: only SUPER_ADMIN may assign or modify ADMIN/SUPER_ADMIN roles.",
)
async def update_user_role(
    user_id: uuid.UUID,
    data: UpdateUserRoleRequest,
    request: Request,
    session: SessionDep,
    current_admin: CurrentUserDep,
) -> AdminUserResponse:
    service = AdminUserService(session)
    return await service.update_user_role(
        user_id=user_id,
        data=data,
        current_admin=current_admin,
        request=request,
    )


@router.delete(
    "/{user_id}",
    summary="Delete a user (soft or hard)",
    description="Soft-deletes a user (sets status to DELETED and revokes active sessions) or permanently deletes user from database if hard=True. Prevents self-deletion and enforces privilege rules.",
)
async def delete_user(
    user_id: uuid.UUID,
    request: Request,
    session: SessionDep,
    current_admin: CurrentUserDep,
    hard: bool = Query(False, description="If true, permanently delete user and associated records from database"),
) -> dict:
    service = AdminUserService(session)
    return await service.delete_user(
        user_id=user_id,
        current_admin=current_admin,
        request=request,
        hard=hard,
    )
