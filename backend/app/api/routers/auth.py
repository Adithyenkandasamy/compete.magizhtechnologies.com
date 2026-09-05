from fastapi import APIRouter, Depends, Request, status
from fastapi.security import OAuth2PasswordRequestForm

from app.api.deps import CurrentUserDep, SessionDep
from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse, UserResponse
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
    request: Request,
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
    summary="Login and obtain an access + refresh token",
)
async def login(
    session: SessionDep,
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> TokenResponse:
    """
    Authenticate user credentials and return a Bearer access token
    plus a long-lived refresh token used to obtain new access tokens.
    Accepts standard OAuth2 form data (username, password).
    """
    auth_service = AuthService(session)
    # The OAuth2PasswordRequestForm uses 'username' instead of 'email'
    login_data = LoginRequest(email=form_data.username, password=form_data.password)
    _, tokens = await auth_service.authenticate_user(login_data, request)

    return tokens


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh an expired access token",
)
async def refresh(
    data: RefreshRequest,
    request: Request,
    session: SessionDep,
) -> TokenResponse:
    """
    Exchange a valid refresh token for a fresh access token.
    The refresh token is rotated: the old one is invalidated and a new
    refresh token is returned.
    """
    auth_service = AuthService(session)
    return await auth_service.refresh_tokens(data, request)


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
    data: RefreshRequest,
    request: Request,
    session: SessionDep,
) -> dict:
    """
    Logout endpoint.
    Revokes the session associated with the supplied refresh token, which
    invalidates the token pair. The client should also clear local tokens.
    Idempotent — logging out twice is safe.
    """
    auth_service = AuthService(session)
    return await auth_service.logout(data.refresh_token, request)
