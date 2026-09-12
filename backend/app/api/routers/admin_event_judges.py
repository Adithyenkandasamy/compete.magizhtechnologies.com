import uuid

from fastapi import APIRouter, Depends, Request, status

from app.api.deps import CurrentUserDep, SessionDep, require_admin
from app.schemas.evaluation import EventJudgingOverviewResponse
from app.schemas.judge import EventJudgeResponse
from app.services.evaluation_service import EvaluationService
from app.services.judge_service import JudgeService

router = APIRouter(
    prefix="/admin/events",
    tags=["Event Judges (Admin)"],
    dependencies=[Depends(require_admin)],
)


@router.post(
    "/{event_id}/judges/{judge_id}",
    response_model=EventJudgeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Assign judge to event",
    description="Explicitly assign an active judge to an event. Rejects duplicates and records audit log.",
)
async def assign_judge_to_event(
    event_id: uuid.UUID,
    judge_id: uuid.UUID,
    request: Request,
    session: SessionDep,
    current_user: CurrentUserDep,
) -> EventJudgeResponse:
    service = JudgeService(session)
    return await service.assign_judge_to_event(
        event_id=event_id,
        judge_id=judge_id,
        admin_user_id=current_user.id,
        request=request,
    )


@router.delete(
    "/{event_id}/judges/{judge_id}",
    status_code=status.HTTP_200_OK,
    summary="Remove judge from event",
    description="Unassign judge from an event while preserving all historical evaluations.",
)
async def remove_judge_from_event(
    event_id: uuid.UUID,
    judge_id: uuid.UUID,
    request: Request,
    session: SessionDep,
    current_user: CurrentUserDep,
) -> dict:
    service = JudgeService(session)
    return await service.remove_judge_from_event(
        event_id=event_id,
        judge_id=judge_id,
        admin_user_id=current_user.id,
        request=request,
    )


@router.get(
    "/{event_id}/judges",
    response_model=list[EventJudgeResponse],
    summary="List judges assigned to an event",
    description="Retrieve all judges currently assigned to the given event.",
)
async def list_event_judges(
    event_id: uuid.UUID,
    session: SessionDep,
) -> list[EventJudgeResponse]:
    service = JudgeService(session)
    return await service.list_event_judges(event_id=event_id)


@router.get(
    "/{event_id}/judging",
    response_model=EventJudgingOverviewResponse,
    summary="Event judging overview",
    description="Aggregate metrics for event judging: total submissions, evaluated, pending, judges, and average score.",
)
async def get_event_judging_overview(
    event_id: uuid.UUID,
    session: SessionDep,
) -> EventJudgingOverviewResponse:
    service = EvaluationService(session)
    return await service.get_event_judging_overview(event_id=event_id)