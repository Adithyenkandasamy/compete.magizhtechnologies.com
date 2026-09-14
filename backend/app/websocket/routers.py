"""
WebSocket Endpoints — Magizh Innovation Platform.

Four WebSocket channels:
  /ws/admin             — Admin/Super-Admin command-center live feed
  /ws/events/{event_id} — Per-event live update channel
  /ws/teams/{team_id}   — Per-team live update channel
  /ws/users/{user_id}   — Per-user personal notification channel

Authentication:
  All protected channels require a valid JWT access token passed as the
  `token` query parameter:
    ws://host/ws/admin?token=<access_token>

  Token validation is performed BEFORE accepting the WebSocket upgrade.
  Missing, invalid, expired, or suspended tokens result in WS close code 4001.
  Privilege violations result in WS close code 4003.

Authorization:
  /ws/admin             → ADMIN or SUPER_ADMIN only
  /ws/events/{event_id} → Authenticated users who are registered for the event,
                          assigned judges, or admins
  /ws/teams/{team_id}   → Team members or admins
  /ws/users/{user_id}   → Only the authenticated user matching user_id

Message contract:
  Server → Client:
    {
      "type": "<RealtimeEventType>",
      "timestamp": "<ISO-8601 UTC>",
      "event_id": "<uuid>|null",
      "team_id": "<uuid>|null",
      "user_id": "<uuid>|null",
      "data": { ... }
    }

  Client → Server:
    The initial architecture only supports a minimal ping/heartbeat message:
    { "type": "ping" }
    The server responds with:
    { "type": "pong", "timestamp": "<ISO-8601 UTC>" }

Reconnect behavior:
  WebSocket delivery is BEST-EFFORT and NOT guaranteed.
  If a connection drops, the client MUST re-fetch current state via REST after reconnecting.
  Missed events are NOT replayed.

Single-instance limitation:
  This manager is in-process. Multiple FastAPI instances will NOT share connections.
  See manager.py for scaling notes.
"""

import json
import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db_raw
from app.models.enums import UserRole
from app.repositories.event_judge_repo import EventJudgeRepository
from app.repositories.judge_repo import JudgeRepository
from app.repositories.registration_repo import RegistrationRepository
from app.repositories.team_repo import TeamRepository
from app.websocket.auth import ws_authenticate, ws_require_admin, ws_require_self_or_admin
from app.websocket.manager import manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSockets"])

_MAX_MESSAGE_SIZE = 4096  # bytes — reject oversized client messages


def _pong_payload() -> str:
    return json.dumps({"type": "pong", "timestamp": datetime.now(timezone.utc).isoformat()})


async def _handle_client_message(ws: WebSocket, raw: str) -> None:
    """
    Process a minimal controlled message from the client.
    Only 'ping' messages are supported. Any other message is ignored.
    """
    if len(raw.encode("utf-8")) > _MAX_MESSAGE_SIZE:
        logger.warning("websocket.oversized_message path=%s size=%d", ws.url.path, len(raw))
        return
    try:
        msg = json.loads(raw)
        if isinstance(msg, dict) and msg.get("type") == "ping":
            await ws.send_text(_pong_payload())
    except (json.JSONDecodeError, Exception):
        pass  # Silently discard malformed messages


# ---------------------------------------------------------------------------
# 1. ADMIN WEBSOCKET
# ---------------------------------------------------------------------------

@router.websocket("/ws/admin")
async def ws_admin(websocket: WebSocket) -> None:
    """
    Admin/Super-Admin live command-center channel.

    Requires: ADMIN or SUPER_ADMIN JWT (passed as ?token=<jwt>)
    Rejects:  STUDENT, JUDGE
    """
    # We need a DB session for authentication
    user = None
    async for session in get_db_raw():
        user = await ws_require_admin(websocket, session)
        break

    if user is None:
        return  # Connection already closed by ws_require_admin

    await manager.connect_admin(websocket)
    logger.info(
        "websocket.connected channel=admin user_id=%s role=%s",
        user.id,
        user.role,
    )
    try:
        while True:
            raw = await websocket.receive_text()
            await _handle_client_message(websocket, raw)
    except WebSocketDisconnect:
        logger.info("websocket.disconnected channel=admin user_id=%s", user.id)
    except Exception as exc:
        logger.warning("websocket.error channel=admin user_id=%s error=%s", user.id, exc)
    finally:
        manager.disconnect_admin(websocket)


# ---------------------------------------------------------------------------
# 2. EVENT WEBSOCKET
# ---------------------------------------------------------------------------

@router.websocket("/ws/events/{event_id}")
async def ws_event(websocket: WebSocket, event_id: uuid.UUID) -> None:
    """
    Per-event live update channel.

    Access rules:
      - Admins/Super-admins: always allowed
      - Students: must be registered for the event (CONFIRMED or WAITLISTED)
      - Judges: must be assigned to this event
    """
    user = None
    authorized = False
    async for session in get_db_raw():
        user = await ws_authenticate(websocket, session)
        if user is None:
            return  # ws already closed

        # Authorization check
        if user.role in (UserRole.ADMIN, UserRole.SUPER_ADMIN):
            authorized = True
        elif user.role == UserRole.STUDENT:
            # Must have a registration for this event
            reg_repo = RegistrationRepository(session)
            reg = await reg_repo.get_registration_by_event_and_user(event_id, user.id)
            if reg and reg.status.value in ("CONFIRMED", "WAITLISTED"):
                authorized = True
        elif user.role == UserRole.JUDGE:
            # Must be assigned as a judge to this event
            # First resolve user → Judge profile
            judge_repo = JudgeRepository(session)
            judge = await judge_repo.get_by_user_id(user.id)
            if judge and judge.is_active:
                event_judge_repo = EventJudgeRepository(session)
                assignment = await event_judge_repo.get_assignment(event_id, judge.id)
                if assignment:
                    authorized = True
        break

    if user is None:
        return

    if not authorized:
        logger.warning(
            "websocket.authorization_failed user_id=%s event_id=%s channel=event",
            user.id,
            event_id,
        )
        await websocket.close(code=4003, reason="Not authorized for this event channel")
        return

    await manager.connect_event(websocket, event_id)
    logger.info(
        "websocket.connected channel=event event_id=%s user_id=%s",
        event_id,
        user.id,
    )
    try:
        while True:
            raw = await websocket.receive_text()
            await _handle_client_message(websocket, raw)
    except WebSocketDisconnect:
        logger.info("websocket.disconnected channel=event event_id=%s user_id=%s", event_id, user.id)
    except Exception as exc:
        logger.warning("websocket.error channel=event event_id=%s error=%s", event_id, exc)
    finally:
        manager.disconnect_event(websocket, event_id)


# ---------------------------------------------------------------------------
# 3. TEAM WEBSOCKET
# ---------------------------------------------------------------------------

@router.websocket("/ws/teams/{team_id}")
async def ws_team(websocket: WebSocket, team_id: uuid.UUID) -> None:
    """
    Per-team live update channel.

    Access rules:
      - Team members: allowed
      - Admins/Super-admins: allowed
      - All others: rejected
    """
    user = None
    authorized = False
    async for session in get_db_raw():
        user = await ws_authenticate(websocket, session)
        if user is None:
            return

        if user.role in (UserRole.ADMIN, UserRole.SUPER_ADMIN):
            authorized = True
        else:
            team_repo = TeamRepository(session)
            member = await team_repo.get_team_member(team_id, user.id)
            if member is not None:
                authorized = True
        break

    if user is None:
        return

    if not authorized:
        logger.warning(
            "websocket.authorization_failed user_id=%s team_id=%s channel=team reason=not_member",
            user.id,
            team_id,
        )
        await websocket.close(code=4003, reason="Not a member of this team")
        return

    await manager.connect_team(websocket, team_id)
    logger.info(
        "websocket.connected channel=team team_id=%s user_id=%s",
        team_id,
        user.id,
    )
    try:
        while True:
            raw = await websocket.receive_text()
            await _handle_client_message(websocket, raw)
    except WebSocketDisconnect:
        logger.info("websocket.disconnected channel=team team_id=%s user_id=%s", team_id, user.id)
    except Exception as exc:
        logger.warning("websocket.error channel=team team_id=%s error=%s", team_id, exc)
    finally:
        manager.disconnect_team(websocket, team_id)


# ---------------------------------------------------------------------------
# 4. USER WEBSOCKET
# ---------------------------------------------------------------------------

@router.websocket("/ws/users/{user_id}")
async def ws_user(websocket: WebSocket, user_id: uuid.UUID) -> None:
    """
    Per-user personal notification channel.

    Only the authenticated user matching user_id may connect.
    Attempting to connect to another user's channel is rejected (IDOR protection).
    """
    async for session in get_db_raw():
        user = await ws_require_self_or_admin(websocket, session, user_id)
        break

    if user is None:
        return  # ws already closed

    await manager.connect_user(websocket, user_id)
    logger.info(
        "websocket.connected channel=user user_id=%s",
        user_id,
    )
    try:
        while True:
            raw = await websocket.receive_text()
            await _handle_client_message(websocket, raw)
    except WebSocketDisconnect:
        logger.info("websocket.disconnected channel=user user_id=%s", user_id)
    except Exception as exc:
        logger.warning("websocket.error channel=user user_id=%s error=%s", user_id, exc)
    finally:
        manager.disconnect_user(websocket, user_id)
