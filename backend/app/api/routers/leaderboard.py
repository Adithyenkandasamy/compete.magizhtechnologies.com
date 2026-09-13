import uuid

from fastapi import APIRouter, Depends, status

from app.api.deps import CurrentUserDep, SessionDep
from app.models.enums import UserRole
from app.schemas.result import ResultsResponse, StudentTeamResultResponse
from app.services.result_service import ResultService

router = APIRouter(
    tags=["Results & Leaderboard"],
)


@router.get(
    "/events/{event_id}/results",
    response_model=ResultsResponse,
    summary="Get official published event results",
    description=(
        "Return published results for an event in ranked order. "
        "Draft results are strictly hidden. Returns 404 if results are not yet published."
    ),
)
async def get_event_results(
    event_id: uuid.UUID,
    session: SessionDep,
) -> ResultsResponse:
    service = ResultService(session)
    return await service.get_public_results(event_id=event_id)


@router.get(
    "/events/{event_id}/leaderboard",
    response_model=ResultsResponse,
    summary="Get official published event leaderboard (alias for results)",
    description="Convenience alias endpoint returning official published results.",
)
async def get_event_leaderboard_alias(
    event_id: uuid.UUID,
    session: SessionDep,
) -> ResultsResponse:
    service = ResultService(session)
    return await service.get_public_results(event_id=event_id)


@router.get(
    "/submissions/{submission_id}/result",
    response_model=StudentTeamResultResponse,
    summary="Get student team result and anonymous feedback",
    description=(
        "Allows an authenticated participant to view their team's rank, score, award, "
        "and anonymized judge feedback once results are officially published."
    ),
)
async def get_student_submission_result(
    submission_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUserDep,
) -> StudentTeamResultResponse:
    service = ResultService(session)
    is_admin = current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]
    return await service.get_student_team_result(
        submission_id=submission_id,
        user_id=current_user.id,
        is_admin=is_admin,
    )
