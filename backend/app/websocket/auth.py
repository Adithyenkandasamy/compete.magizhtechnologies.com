"""
WebSocket Authentication Helpers — Magizh Innovation Platform.

Browser WebSocket clients cannot set the Authorization header (the standard
Fetch/XHR limitation with the WebSocket API). The safest available option
without a backend session cookie infrastructure is to pass the JWT as a
query parameter (?token=<access_token>), but ONLY over TLS (WSS).

To avoid token logging, we:
  - Never log the raw token value.
  - Log only the authenticated user_id after successful validation.
  - Clear the token from memory immediately after validation.
  - Never echo the token in WebSocket messages or connection metadata.

Important: This module intentionally DOES NOT create a second authentication
system. It reuses the exact same JWT validation (decode_access_token) that
is used by all REST API endpoints.
"""

import logging
import uuid
from typing import Optional

from fastapi import WebSocket, status
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.database.session import get_db
from app.models.enums import AccountStatus, UserRole
from app.models.user import User
from app.repositories.user_repo import UserRepository

logger = logging.getLogger(__name__)


async def _resolve_user_from_token(
    token: str, session: AsyncSession
) -> Optional[User]:
    """
    Decode the JWT, fetch the User, and verify account is active.
    Returns None on any failure — callers should close the socket.
    Does NOT log the token value.
    """
    try:
        payload = decode_access_token(token)
        user_id_str: str = payload.get("sub")
        if not user_id_str:
            return None
        user_id = uuid.UUID(user_id_str)
    except (InvalidTokenError, ExpiredSignatureError, ValueError, TypeError):
        return None

    repo = UserRepository(session)
    user = await repo.get_by_id(user_id)
    if not user:
        return None
    if user.status != AccountStatus.ACTIVE:
        return None

    return user


async def ws_authenticate(ws: WebSocket, session: AsyncSession) -> Optional[User]:
    """
    Authenticate a WebSocket connection.

    Reads the token from the ?token= query parameter. If the token is missing,
    invalid, expired, or the user is inactive/suspended, the WebSocket is closed
    with code 4001 (custom auth failure) and None is returned.

    Caller MUST check the return value and exit the handler if None.
    """
    token: Optional[str] = ws.query_params.get("token")
    if not token:
        logger.warning(
            "websocket.auth_failed reason=missing_token path=%s", ws.url.path
        )
        await ws.close(code=4001, reason="Authentication required")
        return None

    user = await _resolve_user_from_token(token, session)
    if not user:
        logger.warning(
            "websocket.auth_failed reason=invalid_token path=%s", ws.url.path
        )
        await ws.close(code=4001, reason="Invalid or expired token")
        return None

    # Token is valid — we no longer need it; drop the reference
    del token

    logger.info(
        "websocket.auth_success user_id=%s path=%s", user.id, ws.url.path
    )
    return user


async def ws_require_admin(ws: WebSocket, session: AsyncSession) -> Optional[User]:
    """
    Authenticate and verify the user is ADMIN or SUPER_ADMIN.
    Returns User on success, closes with 4003 and returns None on failure.
    """
    user = await ws_authenticate(ws, session)
    if user is None:
        return None  # ws already closed

    if user.role not in (UserRole.ADMIN, UserRole.SUPER_ADMIN):
        logger.warning(
            "websocket.authorization_failed user_id=%s role=%s channel=admin",
            user.id,
            user.role,
        )
        await ws.close(code=4003, reason="Admin privileges required")
        return None

    return user


async def ws_require_self_or_admin(
    ws: WebSocket, session: AsyncSession, target_user_id: uuid.UUID
) -> Optional[User]:
    """
    Authenticate and verify the user is accessing their own user channel,
    OR is an admin with elevated visibility rights.
    """
    user = await ws_authenticate(ws, session)
    if user is None:
        return None

    if user.id != target_user_id:
        # Admins are optionally allowed — but the spec says personal channels
        # should only be self-accessible. We reject others here.
        logger.warning(
            "websocket.authorization_failed user_id=%s target_user_id=%s channel=user reason=idor",
            user.id,
            target_user_id,
        )
        await ws.close(code=4003, reason="Cannot connect to another user's channel")
        return None

    return user
