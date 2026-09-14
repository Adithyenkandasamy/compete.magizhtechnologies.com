"""
In-process WebSocket Connection Manager — Magizh Innovation Platform.

Manages four distinct connection sets:
  - admin_connections   : Admin/Super-Admin command center channel
  - event_connections   : Per-event live update channels
  - team_connections    : Per-team live update channels
  - user_connections    : Per-user personal notification channels

Design principles:
  - Never expose raw WebSocket objects outside this module.
  - Handle dead connections gracefully (send failures are caught, stale refs cleaned).
  - One broken connection must never crash the manager or any other connection.
  - This manager is in-memory, therefore it is limited to a SINGLE FastAPI instance.

Horizontal-scaling note:
  If the application is later deployed across multiple FastAPI instances behind
  a load balancer, each instance will maintain its own in-memory connection set.
  Clients connected to Instance A will not receive broadcasts sent from Instance B.
  To solve this at scale, a shared pub/sub layer (e.g. Redis Pub/Sub, Valkey)
  would be required. That is OUT OF SCOPE for this phase.
"""

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import WebSocket
from starlette.websockets import WebSocketState

logger = logging.getLogger(__name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class ConnectionManager:
    """
    Thread-safe (asyncio-friendly) in-memory WebSocket connection registry.

    Tracks connections by channel type and resource ID so the publisher
    can target the right set of sockets without knowing internal structure.
    """

    def __init__(self) -> None:
        # Set of WebSocket objects connected to the admin broadcast channel
        self._admin: set[WebSocket] = set()

        # event_id (UUID) -> set of WebSocket objects
        self._events: dict[uuid.UUID, set[WebSocket]] = {}

        # team_id (UUID) -> set of WebSocket objects
        self._teams: dict[uuid.UUID, set[WebSocket]] = {}

        # user_id (UUID) -> set of WebSocket objects (a user may have multiple tabs)
        self._users: dict[uuid.UUID, set[WebSocket]] = {}

    # ------------------------------------------------------------------ #
    # CONNECT
    # ------------------------------------------------------------------ #

    async def connect_admin(self, ws: WebSocket) -> None:
        await ws.accept()
        self._admin.add(ws)
        logger.info(
            "websocket.connected channel=admin total=%d",
            len(self._admin),
        )

    async def connect_event(self, ws: WebSocket, event_id: uuid.UUID) -> None:
        await ws.accept()
        self._events.setdefault(event_id, set()).add(ws)
        logger.info(
            "websocket.connected channel=event event_id=%s subscribers=%d",
            event_id,
            len(self._events[event_id]),
        )

    async def connect_team(self, ws: WebSocket, team_id: uuid.UUID) -> None:
        await ws.accept()
        self._teams.setdefault(team_id, set()).add(ws)
        logger.info(
            "websocket.connected channel=team team_id=%s subscribers=%d",
            team_id,
            len(self._teams[team_id]),
        )

    async def connect_user(self, ws: WebSocket, user_id: uuid.UUID) -> None:
        await ws.accept()
        self._users.setdefault(user_id, set()).add(ws)
        logger.info(
            "websocket.connected channel=user user_id=%s connections=%d",
            user_id,
            len(self._users[user_id]),
        )

    # ------------------------------------------------------------------ #
    # DISCONNECT
    # ------------------------------------------------------------------ #

    def disconnect_admin(self, ws: WebSocket) -> None:
        self._admin.discard(ws)
        logger.info(
            "websocket.disconnected channel=admin remaining=%d",
            len(self._admin),
        )

    def disconnect_event(self, ws: WebSocket, event_id: uuid.UUID) -> None:
        sockets = self._events.get(event_id, set())
        sockets.discard(ws)
        if not sockets:
            self._events.pop(event_id, None)
        logger.info(
            "websocket.disconnected channel=event event_id=%s remaining=%d",
            event_id,
            len(sockets),
        )

    def disconnect_team(self, ws: WebSocket, team_id: uuid.UUID) -> None:
        sockets = self._teams.get(team_id, set())
        sockets.discard(ws)
        if not sockets:
            self._teams.pop(team_id, None)
        logger.info(
            "websocket.disconnected channel=team team_id=%s remaining=%d",
            team_id,
            len(sockets),
        )

    def disconnect_user(self, ws: WebSocket, user_id: uuid.UUID) -> None:
        sockets = self._users.get(user_id, set())
        sockets.discard(ws)
        if not sockets:
            self._users.pop(user_id, None)
        logger.info(
            "websocket.disconnected channel=user user_id=%s remaining=%d",
            user_id,
            len(sockets),
        )

    # ------------------------------------------------------------------ #
    # BROADCAST HELPERS (private)
    # ------------------------------------------------------------------ #

    async def _send_to_socket(self, ws: WebSocket, payload: str) -> bool:
        """
        Attempt to send a message to a single WebSocket.
        Returns True on success, False if the connection is dead.
        Never propagates exceptions to the caller.
        """
        try:
            if ws.client_state == WebSocketState.CONNECTED:
                await ws.send_text(payload)
                return True
        except Exception as exc:
            logger.debug("websocket.send_failed error=%s", exc)
        return False

    async def _broadcast_to_set(
        self, sockets: set[WebSocket], payload: str
    ) -> None:
        """
        Broadcast a JSON payload to a set of sockets and silently remove
        stale connections that fail to receive the message.
        """
        stale: list[WebSocket] = []
        for ws in list(sockets):
            ok = await self._send_to_socket(ws, payload)
            if not ok:
                stale.append(ws)
        for ws in stale:
            sockets.discard(ws)

    # ------------------------------------------------------------------ #
    # PUBLIC BROADCAST METHODS
    # ------------------------------------------------------------------ #

    async def broadcast_to_admins(self, payload: dict[str, Any]) -> None:
        """Send a notification to every connected admin/super-admin client."""
        text = json.dumps(payload, default=str)
        await self._broadcast_to_set(self._admin, text)

    async def broadcast_to_event(
        self, event_id: uuid.UUID, payload: dict[str, Any]
    ) -> None:
        """Send a notification to all clients subscribed to an event channel."""
        sockets = self._events.get(event_id)
        if not sockets:
            return
        text = json.dumps(payload, default=str)
        await self._broadcast_to_set(sockets, text)

    async def broadcast_to_team(
        self, team_id: uuid.UUID, payload: dict[str, Any]
    ) -> None:
        """Send a notification to all clients subscribed to a team channel."""
        sockets = self._teams.get(team_id)
        if not sockets:
            return
        text = json.dumps(payload, default=str)
        await self._broadcast_to_set(sockets, text)

    async def send_to_user(
        self, user_id: uuid.UUID, payload: dict[str, Any]
    ) -> None:
        """Send a personal notification to a specific user's channel."""
        sockets = self._users.get(user_id)
        if not sockets:
            return
        text = json.dumps(payload, default=str)
        await self._broadcast_to_set(sockets, text)

    # ------------------------------------------------------------------ #
    # STATS (for debugging / health checks)
    # ------------------------------------------------------------------ #

    def stats(self) -> dict[str, Any]:
        """Return a summary of current connection counts (no socket refs exposed)."""
        return {
            "admin_connections": len(self._admin),
            "event_channels": len(self._events),
            "event_connections": sum(len(s) for s in self._events.values()),
            "team_channels": len(self._teams),
            "team_connections": sum(len(s) for s in self._teams.values()),
            "user_channels": len(self._users),
            "user_connections": sum(len(s) for s in self._users.values()),
        }


# ---------------------------------------------------------------------------
# Singleton — one manager shared across the entire application lifetime
# ---------------------------------------------------------------------------
manager = ConnectionManager()
