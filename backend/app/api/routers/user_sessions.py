import uuid

from fastapi import APIRouter, Depends, Request, status

from app.api.deps import CurrentUserDep, SessionDep
from app.schemas.session import UserSessionResponse
from app.services.user_session_service import UserSessionService

router = APIRouter(
    prefix="/me/sessions",
    tags=["User Sessions"],
)


@router.get(
    "",
    response_model=list[UserSessionResponse],
    summary="List current user active sessions",
    description="Retrieve list of active and recent sessions for the authenticated user without exposing security hashes.",
)
async def list_my_sessions(
    session: SessionDep,
    current_user: CurrentUserDep,
) -> list[UserSessionResponse]:
    service = UserSessionService(session)
    return await service.list_my_sessions(user_id=current_user.id)


@router.delete(
    "/{session_id}",
    status_code=status.HTTP_200_OK,
    summary="Revoke a user session",
    description="Revoke an active session. Protected against IDOR: users can only revoke their own sessions.",
)
async def revoke_my_session(
    session_id: uuid.UUID,
    request: Request,
    session: SessionDep,
    current_user: CurrentUserDep,
) -> dict:
    service = UserSessionService(session)
    return await service.revoke_my_session(
        session_id=session_id,
        user_id=current_user.id,
        request=request,
    )
