import uuid

from fastapi import APIRouter, Depends, Request, status

from app.api.deps import SessionDep, get_current_user
from app.models.user import User
from app.schemas.team import TeamCreate, TeamResponse, TeamUpdate
from app.services.team_service import TeamService

router = APIRouter(
    prefix="/api",
    tags=["Teams"],
    dependencies=[Depends(get_current_user)],
)


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
    return await service.get_team(team.id) # type: ignore


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
    # The TeamResponse schema needs member_count, max_members, etc.
    # We populate those properties on the fly for Pydantic to read.
    team.member_count = len(team.members)
    team.max_members = team.event.team_size_max
    
    # We need to map the nested user details for the response
    for member in team.members:
        member.full_name = member.user.full_name
        member.email = member.user.email
        
    return team # type: ignore


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
