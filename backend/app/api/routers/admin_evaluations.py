import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import SessionDep, require_admin
from app.schemas.evaluation import AdminEvaluationResponse
from app.schemas.event import PaginatedResponse
from app.services.evaluation_service import EvaluationService

router = APIRouter(
    prefix="/admin/evaluations",
    tags=["Evaluations (Admin)"],
    dependencies=[Depends(require_admin)],
)


@router.get(
    "",
    response_model=PaginatedResponse[AdminEvaluationResponse],
    summary="List all evaluations",
    description="Retrieve paginated evaluations with eager-loaded relations and filters (event, submission, judge).",
)
async def list_evaluations(
    session: SessionDep,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    event_id: Optional[uuid.UUID] = Query(None, description="Filter by event ID"),
    submission_id: Optional[uuid.UUID] = Query(None, description="Filter by submission ID"),
    judge_id: Optional[uuid.UUID] = Query(None, description="Filter by judge ID"),
) -> PaginatedResponse[AdminEvaluationResponse]:
    service = EvaluationService(session)
    items, total = await service.admin_list_evaluations(
        page=page,
        size=size,
        event_id=event_id,
        submission_id=submission_id,
        judge_id=judge_id,
    )
    pages = (total + size - 1) // size if total else 0
    return PaginatedResponse[AdminEvaluationResponse](
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get(
    "/{evaluation_id}",
    response_model=AdminEvaluationResponse,
    summary="Get detailed evaluation",
    description="View detailed evaluation including scores, judge, submission, project, team, and event.",
)
async def get_evaluation(
    evaluation_id: uuid.UUID,
    session: SessionDep,
) -> AdminEvaluationResponse:
    service = EvaluationService(session)
    return await service.admin_get_evaluation(evaluation_id=evaluation_id)
