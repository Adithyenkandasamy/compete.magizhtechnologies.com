import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException, Request, status
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
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
from app.models.enums import AccountStatus, SecurityAlertSeverity
from app.models.user import User
from app.repositories.audit_repo import AuditRepository
from app.repositories.login_attempt_repo import LoginAttemptRepository
from app.repositories.security_alert_repo import SecurityAlertRepository
from app.repositories.session_repo import SessionRepository
from app.repositories.user_repo import UserRepository
from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse
import app.websocket.publisher as realtime


def _client_context(request: Optional[Request]) -> tuple[Optional[str], Optional[str], Optional[str]]:
    """Extract IP address, user agent, and request_id from a request."""
    if not request:
        return None, None, None
    ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    request_id = getattr(request.state, "request_id", None) if hasattr(request, "state") else None
    if not request_id:
        request_id = request.headers.get("x-request-id")
    return ip, user_agent, request_id


class AuthService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = UserRepository(session)
        self.session_repo = SessionRepository(session)
        self.audit_repo = AuditRepository(session)
        self.login_repo = LoginAttemptRepository(session)
        self.alert_repo = SecurityAlertRepository(session)

    async def _check_login_abuse(
        self,
        email: str,
        ip_address: Optional[str],
        user_id: Optional[uuid.UUID] = None,
    ) -> Optional[dict]:
        """
        Detect repeated login failures and trigger a SecurityAlert when threshold is exceeded.
        Returns minimal alert metadata if a NEW alert was created, else None.
        The caller is responsible for emitting realtime AFTER the session is committed.
        """
        from app.models.security import SecurityAlert
        email_failures = await self.login_repo.count_recent_failures(
            email=email, window_minutes=settings.login_failure_window_minutes
        )
        ip_failures = 0
        if ip_address:
            ip_failures = await self.login_repo.count_recent_failures(
                ip_address=ip_address, window_minutes=settings.login_failure_window_minutes
            )

        max_failures = max(email_failures, ip_failures)
        if max_failures >= settings.login_failure_threshold:
            # Check if an active open alert already exists to prevent alert flooding
            existing = await self.alert_repo.get_open_alert(
                alert_type="brute_force_detected",
                user_id=user_id,
                ip_address=ip_address,
            )
            if not existing:
                desc = (
                    f"Repeated failed login attempts ({max_failures}) detected for '{email}' "
                    f"from IP {ip_address or 'unknown'} within {settings.login_failure_window_minutes} minutes"
                )
                alert: SecurityAlert = await self.alert_repo.create_alert(
                    alert_type="brute_force_detected",
                    severity=SecurityAlertSeverity.HIGH,
                    description=desc,
                    user_id=user_id,
                    ip_address=ip_address,
                )
                # Return metadata for post-commit realtime emit
                return {
                    "alert_id": alert.id,
                    "alert_type": "brute_force_detected",
                    "severity": SecurityAlertSeverity.HIGH.value,
                }
        return None

    async def register_user(
        self, data: RegisterRequest, request: Optional[Request] = None
    ) -> User:
        """Register a new user after validating email uniqueness and record audit."""
        email = data.email.lower().strip()
        ip, user_agent, request_id = _client_context(request)

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

        await self.audit_repo.create_audit_log(
            action="auth.register",
            event_type="authentication",
            user_id=user.id,
            resource_type="User",
            resource_id=str(user.id),
            ip_address=ip,
            user_agent=user_agent,
            endpoint=request.url.path if request else "/api/auth/register",
            http_method=request.method if request else "POST",
            status_code=status.HTTP_201_CREATED,
            request_id=request_id,
        )
        await self.session.commit()
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

    async def authenticate_user(
        self, data: LoginRequest, request: Request
    ) -> tuple[User, TokenResponse]:
        """Authenticate user credentials, record login attempts, create a session, and audit."""
        email = data.email.lower().strip()
        ip, user_agent, request_id = _client_context(request)

        # Generic error message to prevent email enumeration
        invalid_creds_exc = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

        user = await self.repo.get_by_email(email)
        if not user:
            await self.login_repo.record_attempt(
                email=email,
                success=False,
                ip_address=ip,
                user_agent=user_agent,
                failure_reason="invalid_credentials",
                user_id=None,
            )
            alert_meta = await self._check_login_abuse(email=email, ip_address=ip)
            await self.audit_repo.create_audit_log(
                action="auth.login.failure",
                event_type="authentication",
                user_id=None,
                resource_type="User",
                resource_id=None,
                ip_address=ip,
                user_agent=user_agent,
                endpoint=request.url.path,
                http_method=request.method,
                status_code=status.HTTP_401_UNAUTHORIZED,
                request_id=request_id,
            )
            await self.session.commit()
            if alert_meta:
                await realtime.publish_security_alert_created(
                    alert_id=alert_meta["alert_id"],
                    alert_type=alert_meta["alert_type"],
                    severity=alert_meta["severity"],
                )
            raise invalid_creds_exc

        if not verify_password(data.password, user.password_hash):
            await self.login_repo.record_attempt(
                email=email,
                success=False,
                ip_address=ip,
                user_agent=user_agent,
                failure_reason="invalid_credentials",
                user_id=user.id,
            )
            alert_meta = await self._check_login_abuse(email=email, ip_address=ip, user_id=user.id)
            await self.audit_repo.create_audit_log(
                action="auth.login.failure",
                event_type="authentication",
                user_id=user.id,
                resource_type="User",
                resource_id=str(user.id),
                ip_address=ip,
                user_agent=user_agent,
                endpoint=request.url.path,
                http_method=request.method,
                status_code=status.HTTP_401_UNAUTHORIZED,
                request_id=request_id,
            )
            await self.session.commit()
            if alert_meta:
                await realtime.publish_security_alert_created(
                    alert_id=alert_meta["alert_id"],
                    alert_type=alert_meta["alert_type"],
                    severity=alert_meta["severity"],
                )
            raise invalid_creds_exc

        if user.status != AccountStatus.ACTIVE:
            fail_reason = (
                "suspended_account" if user.status == AccountStatus.SUSPENDED else "inactive_account"
            )
            await self.login_repo.record_attempt(
                email=email,
                success=False,
                ip_address=ip,
                user_agent=user_agent,
                failure_reason=fail_reason,
                user_id=user.id,
            )
            await self.audit_repo.create_audit_log(
                action="auth.login.failure",
                event_type="authentication",
                user_id=user.id,
                resource_type="User",
                resource_id=str(user.id),
                ip_address=ip,
                user_agent=user_agent,
                endpoint=request.url.path,
                http_method=request.method,
                status_code=status.HTTP_403_FORBIDDEN,
                request_id=request_id,
            )
            await self.session.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been suspended or deleted.",
            )

        # Successful login
        await self.login_repo.record_attempt(
            email=email,
            success=True,
            ip_address=ip,
            user_agent=user_agent,
            failure_reason=None,
            user_id=user.id,
        )

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
            action="auth.login.success",
            event_type="authentication",
            user_id=user.id,
            resource_type="UserSession",
            resource_id=str(session_id),
            ip_address=ip,
            user_agent=user_agent,
            endpoint=request.url.path,
            http_method=request.method,
            status_code=status.HTTP_200_OK,
            request_id=request_id,
        )
        await self.session.commit()

        return user, tokens

    async def refresh_tokens(self, data: RefreshRequest, request: Request) -> TokenResponse:
        """Validate a refresh token, rotate it, and issue a fresh token pair."""
        ip, user_agent, request_id = _client_context(request)

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

        if user_session.session_hash != hash_token(data.refresh_token):
            raise invalid_exc

        if user_session.revoked_at is not None:
            raise invalid_exc

        if user_session.expires_at is None or user_session.expires_at < datetime.now(timezone.utc):
            raise invalid_exc

        user = await self.repo.get_by_id(user_id)
        if not user or user.status != AccountStatus.ACTIVE:
            raise invalid_exc

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
            status_code=status.HTTP_200_OK,
            request_id=request_id,
        )
        await self.session.commit()

        return new_tokens

    async def logout(self, refresh_token: str, request: Request) -> dict:
        """Revoke the session associated with the provided refresh token."""
        ip, user_agent, request_id = _client_context(request)
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
                status_code=status.HTTP_200_OK,
                request_id=request_id,
            )
            await self.session.commit()

        return {"message": "Successfully logged out"}