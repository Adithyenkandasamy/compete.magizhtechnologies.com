import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request, status

from app.api.deps import CurrentJudgeDep, CurrentUserDep, SessionDep
from app.models.enums import SubmissionStatus
from app.schemas.event import PaginatedResponse
from app.schemas.evaluation import (
    EvaluationCreate,
    EvaluationResponse,
    EvaluationUpdate,
    JudgeSubmissionResponse,
)
from app.services.evaluation_service import EvaluationService
from app.services.judge_service import JudgeService

router = APIRouter(
    prefix="/judge",
    tags=["Judging (Judge)"],
)


@router.get(
    "/submissions",
    response_model=PaginatedResponse[JudgeSubmissionResponse],
    summary="List submissions assigned to the authenticated judge",
    description=(
        "Retrieve submissions for events the authenticated judge is explicitly assigned to evaluate. "
        "Strictly prevents access to unassigned events. Includes current judge's existing evaluation if present."
    ),
)
async def list_judge_submissions(
    session: SessionDep,
    current_judge: CurrentJudgeDep,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    event_id: Optional[uuid.UUID] = Query(None, description="Filter by event ID"),
    status: Optional[SubmissionStatus] = Query(None, description="Filter by submission status"),
) -> PaginatedResponse[JudgeSubmissionResponse]:
    judge_svc = JudgeService(session)
    items, total = await judge_svc.list_submissions_for_judge(
        judge_id=current_judge.id,
        page=page,
        size=size,
        event_id=event_id,
        status_filter=status,
    )
    pages = (total + size - 1) // size if total else 0

    return PaginatedResponse[JudgeSubmissionResponse](
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get(
    "/submissions/{submission_id}",
    response_model=JudgeSubmissionResponse,
    summary="View detailed submission information for judging",
    description=(
        "Inspect project details, team info, members, and event data for an assigned submission. "
        "Enforces event assignment check and conceals other judges' private evaluations."
    ),
)
async def get_judge_submission(
    submission_id: uuid.UUID,
    session: SessionDep,
    current_judge: CurrentJudgeDep,
) -> JudgeSubmissionResponse:
    judge_svc = JudgeService(session)
    return await judge_svc.get_submission_detail_for_judge(
        submission_id=submission_id,
        judge_id=current_judge.id,
    )


@router.post(
    "/submissions/{submission_id}/evaluation",
    response_model=EvaluationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit an evaluation for a submission",
    description=(
        "Submit scores and feedback for a project. Validates score bounds, computes total_score strictly on "
        "the server, rejects duplicate evaluations with HTTP 409, and progresses submission lifecycle."
    ),
)
async def create_evaluation(
    submission_id: uuid.UUID,
    data: EvaluationCreate,
    request: Request,
    session: SessionDep,
    current_judge: CurrentJudgeDep,
    current_user: CurrentUserDep,
) -> EvaluationResponse:
    eval_svc = EvaluationService(session)
    return await eval_svc.create_evaluation(
        submission_id=submission_id,
        judge_id=current_judge.id,
        user_id=current_user.id,
        data=data,
        request=request,
    )


@router.put(
    "/evaluations/{evaluation_id}",
    response_model=EvaluationResponse,
    summary="Update an existing evaluation",
    description=(
        "Update scores or feedback on an evaluation owned by the authenticated judge. "
        "Strictly prevents IDOR by ensuring only the authoring judge can update the evaluation."
    ),
)
async def update_evaluation(
    evaluation_id: uuid.UUID,
    data: EvaluationUpdate,
    request: Request,
    session: SessionDep,
    current_judge: CurrentJudgeDep,
    current_user: CurrentUserDep,
) -> EvaluationResponse:
    eval_svc = EvaluationService(session)
    return await eval_svc.update_evaluation(
        evaluation_id=evaluation_id,
        judge_id=current_judge.id,
        user_id=current_user.id,
        data=data,
        request=request,
    )
