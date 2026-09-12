import uuid

from fastapi import APIRouter, Depends, status

from app.api.deps import CurrentUserDep, SessionDep
from app.models.enums import UserRole
from app.schemas.result import LeaderboardResponse, StudentTeamResultResponse
from app.services.result_service import ResultService

router = APIRouter(
    tags=["Leaderboard & Results"],
)


@router.get(
    "/events/{event_id}/leaderboard",
    response_model=LeaderboardResponse,
    summary="Get public event leaderboard",
    description=(
        "Retrieve the official ranked leaderboard for an event. "
        "If results are not yet published by organizers, an unreleased status with an empty list is returned."
    ),
)
async def get_event_leaderboard(
    event_id: uuid.UUID,
    session: SessionDep,
) -> LeaderboardResponse:
    service = ResultService(session)
    return await service.get_public_leaderboard(event_id=event_id)


@router.get(
    "/submissions/{submission_id}/result",
    response_model=StudentTeamResultResponse,
    summary="Get student team result and feedback",
    description=(
        "Allows an authenticated participant to view their team's rank, score, award, "
        "and anonymized judge feedback once results are published."
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
