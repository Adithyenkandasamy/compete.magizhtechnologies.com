import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException, Request, status
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    get_password_hash,
    hash_token,
    verify_password,
)
from app.models.enums import AccountStatus
from app.models.user import User
from app.repositories.audit_repo import AuditRepository
from app.repositories.session_repo import SessionRepository
from app.repositories.user_repo import UserRepository
from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse


def _client_context(request: Request) -> tuple[Optional[str], Optional[str]]:
    """Extract IP address and user agent from a request for session/audit records."""
    ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return ip, user_agent


class AuthService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = UserRepository(session)
        self.session_repo = SessionRepository(session)
        self.audit_repo = AuditRepository(session)

    async def register_user(self, data: RegisterRequest) -> User:
        """Register a new user after validating email uniqueness."""
        # Normalize email
        email = data.email.lower().strip()

        # Check for duplicates
        existing_user = await self.repo.get_by_email(email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this email already exists",
            )

        # Hash password securely
        password_hash = get_password_hash(data.password)

        # Atomically create user and profile
        user = await self.repo.create_user_with_profile(
            email=email,
            password_hash=password_hash,
            full_name=data.full_name,
        )
        return user

    def _create_token_pair(self, user_id: uuid.UUID, session_id: uuid.UUID) -> TokenResponse:
        """Create a matching access + refresh token pair for a user session."""
        access_expires = timedelta(minutes=settings.access_token_expire_minutes)
        refresh_expires = timedelta(days=settings.refresh_token_expire_days)

        access_token = create_access_token(subject=user_id, expires_delta=access_expires)
        refresh_token = create_refresh_token(user_id, session_id, expires_delta=refresh_expires)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=int(access_expires.total_seconds()),
            refresh_expires_in=int(refresh_expires.total_seconds()),
        )

    async def authenticate_user(self, data: LoginRequest, request: Request) -> tuple[User, TokenResponse]:
        """Authenticate user credentials, create a session, and return access + refresh tokens."""
        email = data.email.lower().strip()
        ip, user_agent = _client_context(request)

        # Generic error message to prevent email enumeration
        invalid_creds_exc = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

        user = await self.repo.get_by_email(email)
        if not user:
            raise invalid_creds_exc

        if not verify_password(data.password, user.password_hash):
            raise invalid_creds_exc

        if user.status != AccountStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been suspended or deleted.",
            )

        # Create a session ID first so the refresh token can reference it
        session_id = uuid.uuid4()
        tokens = self._create_token_pair(user.id, session_id)

        expires_at = datetime.now(timezone.utc) + timedelta(
            days=settings.refresh_token_expire_days
        )
        await self.session_repo.create_session(
            user_id=user.id,
            session_hash=hash_token(tokens.refresh_token),
            expires_at=expires_at,
            ip_address=ip,
            user_agent=user_agent,
            session_id=session_id,
        )

        await self.audit_repo.create_audit_log(
            action="auth.login",
            event_type="authentication",
            user_id=user.id,
            resource_type="UserSession",
            resource_id=str(session_id),
            ip_address=ip,
            user_agent=user_agent,
            endpoint=request.url.path,
            http_method=request.method,
        )
        await self.session.commit()

        return user, tokens

    async def refresh_tokens(self, data: RefreshRequest, request: Request) -> TokenResponse:
        """Validate a refresh token, rotate it, and issue a fresh token pair."""
        ip, user_agent = _client_context(request)

        try:
            payload = decode_refresh_token(data.refresh_token)
        except (InvalidTokenError, ExpiredSignatureError):
            payload = None

        invalid_exc = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

        if not payload:
            raise invalid_exc

        try:
            user_id = uuid.UUID(str(payload.get("sub")))
            session_id = uuid.UUID(str(payload.get("sid")))
        except (TypeError, ValueError):
            raise invalid_exc

        user_session = await self.session_repo.get_session_by_id(session_id)
        if not user_session:
            raise invalid_exc

        # The presented refresh token must match the one stored for this session
        if user_session.session_hash != hash_token(data.refresh_token):
            raise invalid_exc

        if user_session.revoked_at is not None:
            raise invalid_exc

        if user_session.expires_at is None or user_session.expires_at < datetime.now(timezone.utc):
            raise invalid_exc

        user = await self.repo.get_by_id(user_id)
        if not user or user.status != AccountStatus.ACTIVE:
            raise invalid_exc

        # Rotate the refresh token — issue a new pair and update the session record
        new_tokens = self._create_token_pair(user.id, user_session.id)
        now = datetime.now(timezone.utc)
        await self.session_repo.update_session(
            user_session,
            session_hash=hash_token(new_tokens.refresh_token),
            last_seen=now,
            expires_at=now + timedelta(days=settings.refresh_token_expire_days),
        )

        await self.audit_repo.create_audit_log(
            action="auth.refresh",
            event_type="authentication",
            user_id=user.id,
            resource_type="UserSession",
            resource_id=str(user_session.id),
            ip_address=ip,
            user_agent=user_agent,
            endpoint=request.url.path,
            http_method=request.method,
        )
        await self.session.commit()

        return new_tokens

    async def logout(self, refresh_token: str, request: Request) -> dict:
        """Revoke the session associated with the provided refresh token.

        Idempotent: revoking an already-revoked or unknown session still succeeds.
        """
        ip, user_agent = _client_context(request)
        user_session = await self.session_repo.get_session_by_hash(
            hash_token(refresh_token)
        )

        if user_session and user_session.revoked_at is None:
            await self.session_repo.revoke_session(user_session)

            await self.audit_repo.create_audit_log(
                action="auth.logout",
                event_type="authentication",
                user_id=user_session.user_id,
                resource_type="UserSession",
                resource_id=str(user_session.id),
                ip_address=ip,
                user_agent=user_agent,
                endpoint=request.url.path,
                http_method=request.method,
            )
            await self.session.commit()

        return {"message": "Successfully logged out"}