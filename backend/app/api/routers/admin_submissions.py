import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request, status

from app.api.deps import SessionDep, get_current_user, require_admin
from app.models.enums import SubmissionStatus
from app.models.user import User
from app.schemas.event import PaginatedResponse
from app.schemas.submission import AdminSubmissionResponse, SubmissionStatusUpdate
from app.services.submission_service import SubmissionService

router = APIRouter(
    prefix="/admin/submissions",
    tags=["Submissions (Admin)"],
    dependencies=[Depends(require_admin)],
)


@router.get(
    "",
    response_model=PaginatedResponse[AdminSubmissionResponse],
    summary="List submissions for admin dashboard",
    description=(
        "Retrieve paginated submissions with eager-loaded project, team, and event information. "
        "Supports filtering by event_id, status, and project title search without N+1 queries."
    ),
)
async def list_submissions(
    session: SessionDep,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    event_id: Optional[uuid.UUID] = Query(None, description="Filter by event ID"),
    status: Optional[SubmissionStatus] = Query(None, description="Filter by submission status"),
    search: Optional[str] = Query(None, description="Search in project title"),
) -> PaginatedResponse[AdminSubmissionResponse]:
    service = SubmissionService(session)
    items, total = await service.admin_list_submissions(
        page=page,
        size=size,
        event_id=event_id,
        status_filter=status,
        search=search,
    )
    pages = (total + size - 1) // size if total else 0

    return PaginatedResponse[AdminSubmissionResponse](
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get(
    "/{submission_id}",
    response_model=AdminSubmissionResponse,
    summary="View detailed submission information",
    description=(
        "Get comprehensive submission details including project fields, team members, "
        "and event info. Sensitive security credentials and hashes are never exposed."
    ),
)
async def get_submission(
    submission_id: uuid.UUID,
    session: SessionDep,
) -> AdminSubmissionResponse:
    service = SubmissionService(session)
    return await service.admin_get_submission(submission_id)


@router.post(
    "/{submission_id}/status",
    response_model=AdminSubmissionResponse,
    summary="Update submission review status",
    description=(
        "Change submission status through the formal review lifecycle "
        "(DRAFT -> SUBMITTED -> UNDER_REVIEW -> EVALUATED -> ACCEPTED / REJECTED). "
        "Validates state transitions and records audit logs."
    ),
)
async def update_submission_status_post(
    submission_id: uuid.UUID,
    data: SubmissionStatusUpdate,
    request: Request,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> AdminSubmissionResponse:
    service = SubmissionService(session)
    return await service.admin_update_status(
        submission_id=submission_id,
        admin_user_id=current_user.id,
        new_status=data.status,
        request=request,
    )


@router.put(
    "/{submission_id}/status",
    response_model=AdminSubmissionResponse,
    summary="Update submission review status (PUT compatibility)",
    description="PUT alias for updating submission status to maintain backward compatibility.",
)
async def update_submission_status_put(
    submission_id: uuid.UUID,
    data: SubmissionStatusUpdate,
    request: Request,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> AdminSubmissionResponse:
    service = SubmissionService(session)
    return await service.admin_update_status(
        submission_id=submission_id,
        admin_user_id=current_user.id,
        new_status=data.status,
        request=request,
    )
