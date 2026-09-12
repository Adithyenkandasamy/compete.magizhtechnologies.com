import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request, status

from app.api.deps import CurrentUserDep, SessionDep, require_admin
from app.schemas.event import PaginatedResponse
from app.schemas.judge import JudgeCreate, JudgeResponse, JudgeUpdate
from app.services.judge_service import JudgeService

router = APIRouter(
    prefix="/admin/judges",
    tags=["Judges (Admin)"],
    dependencies=[Depends(require_admin)],
)


@router.get(
    "",
    response_model=PaginatedResponse[JudgeResponse],
    summary="List all judges",
    description="Retrieve paginated list of judges with optional search and active status filters.",
)
async def list_judges(
    session: SessionDep,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by judge name or user email"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
) -> PaginatedResponse[JudgeResponse]:
    service = JudgeService(session)
    items, total = await service.list_judges(
        page=page, size=size, search=search, is_active=is_active
    )
    pages = (total + size - 1) // size if total else 0
    return PaginatedResponse[JudgeResponse](
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get(
    "/{judge_id}",
    response_model=JudgeResponse,
    summary="Get a judge",
    description="Fetch judge details by judge ID.",
)
async def get_judge(
    judge_id: uuid.UUID,
    session: SessionDep,
) -> JudgeResponse:
    service = JudgeService(session)
    return await service.get_judge(judge_id)


@router.post(
    "",
    response_model=JudgeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a judge",
    description="Provision or link an existing user to a new judge profile. Prevents duplicate judge profiles.",
)
async def create_judge(
    data: JudgeCreate,
    request: Request,
    session: SessionDep,
    current_user: CurrentUserDep,
) -> JudgeResponse:
    service = JudgeService(session)
    return await service.create_judge(
        data=data,
        admin_user_id=current_user.id,
        request=request,
    )


@router.put(
    "/{judge_id}",
    response_model=JudgeResponse,
    summary="Update a judge",
    description="Update judge profile metadata (name, bio, expertise, is_active).",
)
async def update_judge(
    judge_id: uuid.UUID,
    data: JudgeUpdate,
    request: Request,
    session: SessionDep,
    current_user: CurrentUserDep,
) -> JudgeResponse:
    service = JudgeService(session)
    return await service.update_judge(
        judge_id=judge_id,
        data=data,
        admin_user_id=current_user.id,
        request=request,
    )


@router.delete(
    "/{judge_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete or deactivate a judge",
    description="Safely removes judge. If historical evaluations exist, deactivates to preserve records.",
)
async def delete_judge(
    judge_id: uuid.UUID,
    request: Request,
    session: SessionDep,
    current_user: CurrentUserDep,
) -> dict:
    service = JudgeService(session)
    return await service.delete_judge(
        judge_id=judge_id,
        admin_user_id=current_user.id,
        request=request,
    )