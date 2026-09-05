import uuid
from typing import List

from fastapi import APIRouter, Depends, Request, status

from app.api.deps import SessionDep, get_current_user
from app.models.team import Team
from app.models.user import User
from app.schemas.team import TeamCreate, TeamResponse, TeamUpdate
from app.services.team_service import TeamService

router = APIRouter(
    prefix="/api",
    tags=["Teams"],
    dependencies=[Depends(get_current_user)],
)


def _populate_team_response(team: Team) -> Team:
    """Fill the transient fields the TeamResponse schema reads."""
    team.member_count = len(team.members)
    team.max_members = team.event.team_size_max if team.event else None

    for member in team.members:
        member.full_name = (
            member.user.profile.full_name if member.user.profile else "Student"
        )
        member.email = member.user.email

    return team


@router.post(
    "/events/{event_id}/teams",
    response_model=TeamResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new team",
)
async def create_team(
    event_id: uuid.UUID,
    data: TeamCreate,
    request: Request,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> TeamResponse:
    service = TeamService(session)
    team = await service.create_team(event_id, current_user.id, data.name, request)
    return await get_team(team.id, session)


@router.get(
    "/events/{event_id}/teams",
    response_model=List[TeamResponse],
    summary="List the current user's teams for an event",
)
async def list_event_teams(
    event_id: uuid.UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> List[TeamResponse]:
    """
    Returns every team the authenticated user belongs to within the given event.
    """
    service = TeamService(session)
    teams = await service.list_user_teams_for_event(current_user.id, event_id)
    return [_populate_team_response(team) for team in teams]  # type: ignore


@router.get(
    "/teams/{team_id}",
    response_model=TeamResponse,
    summary="Get team details",
)
async def get_team(
    team_id: uuid.UUID,
    session: SessionDep,
) -> TeamResponse:
    service = TeamService(session)
    team = await service.get_team(team_id)
    return _populate_team_response(team)  # type: ignore


@router.put(
    "/teams/{team_id}",
    response_model=TeamResponse,
    summary="Update a team",
)
async def update_team(
    team_id: uuid.UUID,
    data: TeamUpdate,
    request: Request,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> TeamResponse:
    service = TeamService(session)
    if data.name:
        await service.update_team(team_id, current_user.id, data.name, request)
        
    return await get_team(team_id, session)


@router.delete(
    "/teams/{team_id}/members/{user_id}",
    status_code=status.HTTP_200_OK,
    summary="Remove a member from the team",
)
async def remove_member(
    team_id: uuid.UUID,
    user_id: uuid.UUID,
    request: Request,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> dict:
    service = TeamService(session)
    return await service.remove_member(team_id, current_user.id, user_id, request)


@router.post(
    "/teams/{team_id}/leave",
    status_code=status.HTTP_200_OK,
    summary="Leave a team",
)
async def leave_team(
    team_id: uuid.UUID,
    request: Request,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> dict:
    service = TeamService(session)
    return await service.leave_team(team_id, current_user.id, request)


@router.post(
    "/teams/{team_id}/transfer-leadership/{user_id}",
    status_code=status.HTTP_200_OK,
    summary="Transfer leadership to another member",
)
async def transfer_leadership(
    team_id: uuid.UUID,
    user_id: uuid.UUID,
    request: Request,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> dict:
    service = TeamService(session)
    return await service.transfer_leadership(team_id, current_user.id, user_id, request)
