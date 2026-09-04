import uuid

from fastapi import APIRouter, Depends, Request, status

from app.api.deps import SessionDep, get_current_user
from app.models.user import User
from app.schemas.team import InviteInfoResponse, JoinRequestResponse, TeamInviteResponse
from app.services.team_invite_service import TeamInviteService
from app.services.team_request_service import TeamRequestService

router = APIRouter(
    prefix="/api",
    tags=["Team Invites & Requests"],
)


@router.post(
    "/teams/{team_id}/invite",
    response_model=TeamInviteResponse,
    dependencies=[Depends(get_current_user)],
    summary="Generate or fetch invite link",
)
async def generate_invite(
    team_id: uuid.UUID,
    request: Request,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> TeamInviteResponse:
    service = TeamInviteService(session)
    invite, raw_token = await service.generate_or_get_invite(team_id, current_user.id, request)
    return TeamInviteResponse(
        team_id=invite.team_id,
        token=raw_token,
        created_at=invite.created_at,
    )


@router.delete(
    "/teams/{team_id}/invite",
    dependencies=[Depends(get_current_user)],
    summary="Revoke an invite link",
)
async def revoke_invite(
    team_id: uuid.UUID,
    request: Request,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> dict:
    service = TeamInviteService(session)
    return await service.invalidate_invite(team_id, current_user.id, request)


@router.get(
    "/team-invites/{token}",
    response_model=InviteInfoResponse,
    summary="Get public info about an invite",
)
async def get_invite_info(
    token: str,
    session: SessionDep,
) -> InviteInfoResponse:
    service = TeamInviteService(session)
    info = await service.get_invite_info(token)
    team = info["team"]
    
    return InviteInfoResponse(
        team_id=team.id,
        team_name=team.name,
        event=team.event,
        member_count=len(team.members),
        max_members=team.event.team_size_max,
        is_full=len(team.members) >= team.event.team_size_max,
    )


@router.post(
    "/team-invites/{token}/request",
    response_model=JoinRequestResponse,
    dependencies=[Depends(get_current_user)],
    status_code=status.HTTP_201_CREATED,
    summary="Submit a join request via invite token",
)
async def request_to_join(
    token: str,
    request: Request,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> JoinRequestResponse:
    service = TeamRequestService(session)
    join_req = await service.request_join(token, current_user.id, request)
    return join_req # type: ignore


@router.get(
    "/teams/{team_id}/join-requests",
    response_model=list[JoinRequestResponse],
    dependencies=[Depends(get_current_user)],
    summary="List all join requests for a team",
)
async def list_join_requests(
    team_id: uuid.UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> list[JoinRequestResponse]:
    service = TeamRequestService(session)
    requests = await service.get_team_requests(team_id, current_user.id)
    
    for req in requests:
        req.requester_name = req.user.profile.full_name if req.user.profile else "Student"
        req.requester_email = req.user.email
        
    return requests # type: ignore


@router.post(
    "/teams/{team_id}/join-requests/{request_id}/accept",
    dependencies=[Depends(get_current_user)],
    summary="Accept a join request",
)
async def accept_join_request(
    team_id: uuid.UUID,
    request_id: uuid.UUID,
    request: Request,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> dict:
    service = TeamRequestService(session)
    return await service.accept_request(team_id, request_id, current_user.id, request)


@router.post(
    "/teams/{team_id}/join-requests/{request_id}/reject",
    dependencies=[Depends(get_current_user)],
    summary="Reject a join request",
)
async def reject_join_request(
    team_id: uuid.UUID,
    request_id: uuid.UUID,
    request: Request,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> dict:
    service = TeamRequestService(session)
    return await service.reject_request(team_id, request_id, current_user.id, request)


@router.post(
    "/teams/{team_id}/join-requests/{request_id}/cancel",
    dependencies=[Depends(get_current_user)],
    summary="Cancel a pending join request",
)
async def cancel_join_request(
    team_id: uuid.UUID,
    request_id: uuid.UUID,
    request: Request,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> dict:
    service = TeamRequestService(session)
    return await service.cancel_request(team_id, request_id, current_user.id, request)
