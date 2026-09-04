from fastapi import APIRouter, Depends, status

from app.api.deps import CurrentUserDep, SessionDep
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new student account",
)
async def register(
    data: RegisterRequest,
    session: SessionDep,
) -> UserResponse:
    """
    Register a new user on the platform.
    Automatically assigns the STUDENT role and creates an empty profile.
    """
    auth_service = AuthService(session)
    user = await auth_service.register_user(data)
    # The Pydantic UserResponse schema automatically strips the password hash
    return user  # type: ignore


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and obtain a JWT token",
)
async def login(
    data: LoginRequest,
    session: SessionDep,
) -> TokenResponse:
    """
    Authenticate user credentials and return a Bearer access token.
    """
    auth_service = AuthService(session)
    _, access_token = await auth_service.authenticate_user(data)
    
    return TokenResponse(access_token=access_token)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user details",
)
async def get_me(
    current_user: CurrentUserDep,
) -> UserResponse:
    """
    Returns the currently authenticated user's details, including profile.
    Requires a valid JWT Bearer token.
    """
    return current_user  # type: ignore


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Logout the current user",
)
async def logout(
    current_user: CurrentUserDep,
) -> dict:
    """
    Logout endpoint.
    Currently structural for frontend clearing of local tokens.
    In the future, this can be expanded to invalidate the token in Redis or UserSessions.
    """
    return {"message": "Successfully logged out"}
