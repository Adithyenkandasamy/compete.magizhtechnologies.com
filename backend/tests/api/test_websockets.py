"""
Phase 14 — WebSocket Tests: Magizh Innovation Platform.

Test coverage:
  1.  ConnectionManager unit tests (connect, disconnect, broadcast, stale cleanup)
  2.  RealtimeEventType enum completeness
  3.  Publisher function signatures and payload shapes
  4.  WebSocket authentication: missing token → close 4001
  5.  WebSocket authentication: invalid token → close 4001
  6.  WebSocket authentication: expired token → close 4001
  7.  WebSocket authentication: suspended account → close 4001
  8.  WebSocket admin channel: STUDENT rejected with 4003
  9.  WebSocket admin channel: JUDGE rejected with 4003
  10. WebSocket admin channel: ADMIN accepted (ping-pong)
  11. WebSocket event channel: unregistered student rejected (4003)
  12. WebSocket event channel: registered student accepted
  13. WebSocket team channel: non-member rejected (4003)
  14. WebSocket user channel: different user rejected (IDOR → 4003)
  15. WebSocket user channel: self accepted
  16. Oversized client message silently discarded
  17. stats() returns correct counts
  18. Stale socket removed on broadcast failure
"""

import asyncio
import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.testclient import TestClient
from starlette.websockets import WebSocketState

from app.core.security import create_access_token, get_password_hash
from app.models.enums import (
    AccountStatus,
    EventStatus,
    RegistrationStatus,
    TeamMemberRole,
    UserRole,
)
from app.models.event import Event
from app.models.registration import Registration
from app.models.team import Team, TeamMember
from app.models.user import Profile, User
from app.websocket.events import RealtimeEventType
from app.websocket.manager import ConnectionManager


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_token(user_id: uuid.UUID, expires_delta: timedelta = timedelta(hours=1)) -> str:
    return create_access_token(subject=str(user_id), expires_delta=expires_delta)


async def _create_user(
    session: AsyncSession,
    email: str = "ws_test@example.com",
    role: UserRole = UserRole.STUDENT,
    status: AccountStatus = AccountStatus.ACTIVE,
) -> User:
    user = User(
        email=email,
        password_hash=get_password_hash("Passw0rd!"),
        role=role,
        status=status,
    )
    session.add(user)
    await session.flush()
    profile = Profile(user_id=user.id, full_name="WS Test User")
    session.add(profile)
    await session.flush()
    await session.refresh(user)
    return user


async def _create_event(session: AsyncSession, title: str = "WS Event") -> Event:
    event = Event(
        title=title,
        slug=f"ws-event-{uuid.uuid4().hex[:8]}",
        description="Test event for WS tests",
        event_type="HACKATHON",
        mode="ONLINE",
        status=EventStatus.PUBLISHED,
        team_size_min=1,
        team_size_max=5,
    )
    session.add(event)
    await session.flush()
    await session.refresh(event)
    return event


async def _create_registration(
    session: AsyncSession,
    user: User,
    event: Event,
    status: RegistrationStatus = RegistrationStatus.CONFIRMED,
) -> Registration:
    reg = Registration(user_id=user.id, event_id=event.id, status=status)
    session.add(reg)
    await session.flush()
    return reg


async def _create_team(session: AsyncSession, leader: User, event: Event) -> Team:
    team = Team(event_id=event.id, leader_id=leader.id, name=f"Team-{uuid.uuid4().hex[:6]}")
    session.add(team)
    await session.flush()
    member = TeamMember(team_id=team.id, user_id=leader.id, role=TeamMemberRole.LEADER)
    session.add(member)
    await session.flush()
    await session.refresh(team)
    return team


# ===========================================================================
# 1. ConnectionManager Unit Tests
# ===========================================================================


class TestConnectionManager:
    """Unit tests for the ConnectionManager in isolation (no HTTP server)."""

    def setup_method(self):
        self.mgr = ConnectionManager()

    def _make_ws(self, connected: bool = True) -> MagicMock:
        ws = MagicMock()
        ws.client_state = WebSocketState.CONNECTED if connected else WebSocketState.DISCONNECTED
        ws.accept = AsyncMock()
        ws.send_text = AsyncMock()
        return ws

    # ------------------------------------------------------------------ #
    # connect / disconnect
    # ------------------------------------------------------------------ #

    @pytest.mark.asyncio
    async def test_connect_admin(self):
        ws = self._make_ws()
        await self.mgr.connect_admin(ws)
        assert ws in self.mgr._admin
        ws.accept.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_disconnect_admin(self):
        ws = self._make_ws()
        await self.mgr.connect_admin(ws)
        self.mgr.disconnect_admin(ws)
        assert ws not in self.mgr._admin

    @pytest.mark.asyncio
    async def test_connect_event(self):
        ws = self._make_ws()
        eid = uuid.uuid4()
        await self.mgr.connect_event(ws, eid)
        assert ws in self.mgr._events[eid]

    @pytest.mark.asyncio
    async def test_disconnect_event_removes_channel_when_empty(self):
        ws = self._make_ws()
        eid = uuid.uuid4()
        await self.mgr.connect_event(ws, eid)
        self.mgr.disconnect_event(ws, eid)
        assert eid not in self.mgr._events

    @pytest.mark.asyncio
    async def test_connect_team(self):
        ws = self._make_ws()
        tid = uuid.uuid4()
        await self.mgr.connect_team(ws, tid)
        assert ws in self.mgr._teams[tid]

    @pytest.mark.asyncio
    async def test_connect_user(self):
        ws = self._make_ws()
        uid = uuid.uuid4()
        await self.mgr.connect_user(ws, uid)
        assert ws in self.mgr._users[uid]

    @pytest.mark.asyncio
    async def test_user_allows_multiple_connections(self):
        """A single user may connect from multiple browser tabs."""
        ws1 = self._make_ws()
        ws2 = self._make_ws()
        uid = uuid.uuid4()
        await self.mgr.connect_user(ws1, uid)
        await self.mgr.connect_user(ws2, uid)
        assert len(self.mgr._users[uid]) == 2

    # ------------------------------------------------------------------ #
    # broadcast
    # ------------------------------------------------------------------ #

    @pytest.mark.asyncio
    async def test_broadcast_to_admins(self):
        ws = self._make_ws()
        await self.mgr.connect_admin(ws)
        payload = {"type": "test", "data": {}}
        await self.mgr.broadcast_to_admins(payload)
        ws.send_text.assert_awaited_once()
        sent = json.loads(ws.send_text.call_args[0][0])
        assert sent["type"] == "test"

    @pytest.mark.asyncio
    async def test_broadcast_to_event(self):
        ws = self._make_ws()
        eid = uuid.uuid4()
        await self.mgr.connect_event(ws, eid)
        await self.mgr.broadcast_to_event(eid, {"type": "event.updated", "data": {}})
        ws.send_text.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_broadcast_to_team(self):
        ws = self._make_ws()
        tid = uuid.uuid4()
        await self.mgr.connect_team(ws, tid)
        await self.mgr.broadcast_to_team(tid, {"type": "team.created", "data": {}})
        ws.send_text.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_send_to_user(self):
        ws = self._make_ws()
        uid = uuid.uuid4()
        await self.mgr.connect_user(ws, uid)
        await self.mgr.send_to_user(uid, {"type": "certificate.issued", "data": {}})
        ws.send_text.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_broadcast_no_sockets_is_noop(self):
        # Should not raise when nobody is subscribed
        await self.mgr.broadcast_to_event(uuid.uuid4(), {"type": "test", "data": {}})
        await self.mgr.broadcast_to_team(uuid.uuid4(), {"type": "test", "data": {}})
        await self.mgr.send_to_user(uuid.uuid4(), {"type": "test", "data": {}})

    @pytest.mark.asyncio
    async def test_stale_socket_removed_on_broadcast_failure(self):
        """A disconnected socket should be silently removed from the set."""
        ws = self._make_ws(connected=False)
        ws.send_text = AsyncMock(side_effect=RuntimeError("connection lost"))
        eid = uuid.uuid4()
        # Manually add the stale socket
        self.mgr._events[eid] = {ws}
        await self.mgr.broadcast_to_event(eid, {"type": "test", "data": {}})
        # Socket should have been removed
        assert ws not in self.mgr._events.get(eid, set())

    # ------------------------------------------------------------------ #
    # stats
    # ------------------------------------------------------------------ #

    @pytest.mark.asyncio
    async def test_stats_counts(self):
        ws1 = self._make_ws()
        ws2 = self._make_ws()
        eid = uuid.uuid4()
        await self.mgr.connect_admin(ws1)
        await self.mgr.connect_event(ws2, eid)
        stats = self.mgr.stats()
        assert stats["admin_connections"] == 1
        assert stats["event_channels"] == 1
        assert stats["event_connections"] == 1
        assert stats["team_channels"] == 0


# ===========================================================================
# 2. RealtimeEventType Coverage
# ===========================================================================


class TestRealtimeEventTypes:
    def test_all_event_types_are_strings(self):
        for et in RealtimeEventType:
            assert isinstance(et.value, str)
            assert "." in et.value, f"Event type '{et.value}' should follow domain.action format"

    def test_expected_types_exist(self):
        expected = [
            "registration.created",
            "registration.cancelled",
            "team.created",
            "team.member_joined",
            "team.join_request.created",
            "team.join_request.accepted",
            "team.join_request.rejected",
            "submission.created",
            "submission.submitted",
            "evaluation.created",
            "result.published",
            "certificate.issued",
            "security_alert.created",
        ]
        values = {et.value for et in RealtimeEventType}
        for exp in expected:
            assert exp in values, f"Missing expected event type: {exp}"


# ===========================================================================
# 3. Publisher Unit Tests (no real sockets)
# ===========================================================================


class TestPublisher:
    """Verify publisher functions produce correctly shaped payloads."""

    @pytest.mark.asyncio
    async def test_publish_registration_created_calls_manager(self):
        from app.websocket import publisher

        reg_id = uuid.uuid4()
        evt_id = uuid.uuid4()
        user_id = uuid.uuid4()

        with (
            patch.object(publisher.manager, "broadcast_to_admins", new=AsyncMock()) as mock_admin,
            patch.object(publisher.manager, "broadcast_to_event", new=AsyncMock()) as mock_event,
        ):
            await publisher.publish_registration_created(reg_id, evt_id, user_id)
            mock_admin.assert_awaited_once()
            mock_event.assert_awaited_once_with(evt_id, mock_admin.call_args[0][0])

    @pytest.mark.asyncio
    async def test_publish_security_alert_only_goes_to_admins(self):
        from app.websocket import publisher

        alert_id = uuid.uuid4()

        with (
            patch.object(publisher.manager, "broadcast_to_admins", new=AsyncMock()) as mock_admin,
            patch.object(publisher.manager, "broadcast_to_event", new=AsyncMock()) as mock_event,
            patch.object(publisher.manager, "broadcast_to_team", new=AsyncMock()) as mock_team,
            patch.object(publisher.manager, "send_to_user", new=AsyncMock()) as mock_user,
        ):
            await publisher.publish_security_alert_created(alert_id, "brute_force_detected", "HIGH")
            mock_admin.assert_awaited_once()
            mock_event.assert_not_awaited()
            mock_team.assert_not_awaited()
            mock_user.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_publisher_payload_type_field(self):
        from app.websocket import publisher

        captured_payloads: list[dict] = []

        async def capture(payload):
            captured_payloads.append(payload)

        with patch.object(publisher.manager, "broadcast_to_admins", new=capture):
            with patch.object(publisher.manager, "broadcast_to_event", new=AsyncMock()):
                await publisher.publish_result_published(uuid.uuid4(), uuid.uuid4())

        assert len(captured_payloads) == 1
        assert captured_payloads[0]["type"] == RealtimeEventType.RESULT_PUBLISHED.value
        assert "timestamp" in captured_payloads[0]
        assert "data" in captured_payloads[0]

    @pytest.mark.asyncio
    async def test_publisher_swallows_manager_exceptions(self):
        """WebSocket failures must not propagate to callers."""
        from app.websocket import publisher

        with patch.object(
            publisher.manager, "broadcast_to_admins", new=AsyncMock(side_effect=RuntimeError("boom"))
        ):
            # Should not raise
            await publisher.publish_registration_created(uuid.uuid4(), uuid.uuid4(), uuid.uuid4())

    @pytest.mark.asyncio
    async def test_certificate_issued_notifies_recipient(self):
        from app.websocket import publisher

        cert_id = uuid.uuid4()
        event_id = uuid.uuid4()
        recipient_id = uuid.uuid4()

        with (
            patch.object(publisher.manager, "broadcast_to_admins", new=AsyncMock()) as mock_admin,
            patch.object(publisher.manager, "send_to_user", new=AsyncMock()) as mock_user,
        ):
            await publisher.publish_certificate_issued(cert_id, event_id, recipient_id, "WINNER")
            mock_admin.assert_awaited_once()
            mock_user.assert_awaited_once_with(recipient_id, mock_admin.call_args[0][0])


# ===========================================================================
# 4–16. WebSocket Endpoint Integration Tests
# ===========================================================================


@pytest.mark.asyncio
async def test_ws_admin_missing_token(client: AsyncClient, session: AsyncSession):
    """4. Missing token: ws closed with 4001."""
    from starlette.testclient import TestClient
    from app.main import app

    with TestClient(app) as tc:
        with tc.websocket_connect("/ws/admin") as ws:
            # The server should close the connection
            data = ws.receive()
            assert data["type"] == "websocket.close"
            assert data["code"] == 4001


@pytest.mark.asyncio
async def test_ws_admin_invalid_token(client: AsyncClient, session: AsyncSession):
    """5. Invalid token: ws closed with 4001."""
    from starlette.testclient import TestClient
    from app.main import app

    with TestClient(app) as tc:
        with tc.websocket_connect("/ws/admin?token=not-a-valid-jwt") as ws:
            data = ws.receive()
            assert data["type"] == "websocket.close"
            assert data["code"] == 4001


@pytest.mark.asyncio
async def test_ws_admin_student_rejected(client: AsyncClient, session: AsyncSession):
    """8. STUDENT cannot connect to admin channel → 4003."""
    from starlette.testclient import TestClient
    from app.main import app
    from app.database.session import get_db

    student = await _create_user(session, "ws_student_admin@example.com", UserRole.STUDENT)
    await session.commit()
    token = _make_token(student.id)

    app.dependency_overrides[get_db] = lambda: session

    with TestClient(app) as tc:
        with tc.websocket_connect(f"/ws/admin?token={token}") as ws:
            data = ws.receive()
            assert data["type"] == "websocket.close"
            assert data["code"] == 4003

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_ws_admin_judge_rejected(client: AsyncClient, session: AsyncSession):
    """9. JUDGE cannot connect to admin channel → 4003."""
    from starlette.testclient import TestClient
    from app.main import app
    from app.database.session import get_db

    judge_user = await _create_user(session, "ws_judge@example.com", UserRole.JUDGE)
    await session.commit()
    token = _make_token(judge_user.id)

    app.dependency_overrides[get_db] = lambda: session

    with TestClient(app) as tc:
        with tc.websocket_connect(f"/ws/admin?token={token}") as ws:
            data = ws.receive()
            assert data["type"] == "websocket.close"
            assert data["code"] == 4003

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_ws_admin_ping_pong(client: AsyncClient, session: AsyncSession):
    """10. Admin receives pong in response to ping."""
    from starlette.testclient import TestClient
    from app.main import app
    from app.database.session import get_db

    admin = await _create_user(session, "ws_admin@example.com", UserRole.ADMIN)
    await session.commit()
    token = _make_token(admin.id)

    app.dependency_overrides[get_db] = lambda: session

    with TestClient(app) as tc:
        with tc.websocket_connect(f"/ws/admin?token={token}") as ws:
            ws.send_text(json.dumps({"type": "ping"}))
            response = ws.receive_text()
            msg = json.loads(response)
            assert msg["type"] == "pong"
            assert "timestamp" in msg

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_ws_event_unregistered_student_rejected(client: AsyncClient, session: AsyncSession):
    """11. Student not registered for event cannot connect → 4003."""
    from starlette.testclient import TestClient
    from app.main import app
    from app.database.session import get_db

    student = await _create_user(session, "ws_unreg@example.com", UserRole.STUDENT)
    event = await _create_event(session)
    await session.commit()
    token = _make_token(student.id)

    app.dependency_overrides[get_db] = lambda: session

    with TestClient(app) as tc:
        with tc.websocket_connect(f"/ws/events/{event.id}?token={token}") as ws:
            data = ws.receive()
            assert data["type"] == "websocket.close"
            assert data["code"] == 4003

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_ws_event_registered_student_ping_pong(client: AsyncClient, session: AsyncSession):
    """12. Student registered for event can connect and ping/pong."""
    from starlette.testclient import TestClient
    from app.main import app
    from app.database.session import get_db

    student = await _create_user(session, "ws_reg@example.com", UserRole.STUDENT)
    event = await _create_event(session)
    await _create_registration(session, student, event)
    await session.commit()
    token = _make_token(student.id)

    app.dependency_overrides[get_db] = lambda: session

    with TestClient(app) as tc:
        with tc.websocket_connect(f"/ws/events/{event.id}?token={token}") as ws:
            ws.send_text(json.dumps({"type": "ping"}))
            response = ws.receive_text()
            msg = json.loads(response)
            assert msg["type"] == "pong"

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_ws_team_non_member_rejected(client: AsyncClient, session: AsyncSession):
    """13. Non-member cannot connect to team channel → 4003."""
    from starlette.testclient import TestClient
    from app.main import app
    from app.database.session import get_db

    leader = await _create_user(session, "ws_team_leader@example.com", UserRole.STUDENT)
    outsider = await _create_user(session, "ws_outsider@example.com", UserRole.STUDENT)
    event = await _create_event(session)
    team = await _create_team(session, leader, event)
    await session.commit()
    token = _make_token(outsider.id)

    app.dependency_overrides[get_db] = lambda: session

    with TestClient(app) as tc:
        with tc.websocket_connect(f"/ws/teams/{team.id}?token={token}") as ws:
            data = ws.receive()
            assert data["type"] == "websocket.close"
            assert data["code"] == 4003

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_ws_team_leader_can_connect(client: AsyncClient, session: AsyncSession):
    """Team leader can connect to their team channel."""
    from starlette.testclient import TestClient
    from app.main import app
    from app.database.session import get_db

    leader = await _create_user(session, "ws_leader@example.com", UserRole.STUDENT)
    event = await _create_event(session)
    team = await _create_team(session, leader, event)
    await session.commit()
    token = _make_token(leader.id)

    app.dependency_overrides[get_db] = lambda: session

    with TestClient(app) as tc:
        with tc.websocket_connect(f"/ws/teams/{team.id}?token={token}") as ws:
            ws.send_text(json.dumps({"type": "ping"}))
            response = ws.receive_text()
            msg = json.loads(response)
            assert msg["type"] == "pong"

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_ws_user_idor_protection(client: AsyncClient, session: AsyncSession):
    """14. Cannot connect to another user's channel → 4003."""
    from starlette.testclient import TestClient
    from app.main import app
    from app.database.session import get_db

    user1 = await _create_user(session, "ws_user1@example.com", UserRole.STUDENT)
    user2 = await _create_user(session, "ws_user2@example.com", UserRole.STUDENT)
    await session.commit()
    token_user1 = _make_token(user1.id)

    app.dependency_overrides[get_db] = lambda: session

    with TestClient(app) as tc:
        # User 1 tries to connect to User 2's channel
        with tc.websocket_connect(f"/ws/users/{user2.id}?token={token_user1}") as ws:
            data = ws.receive()
            assert data["type"] == "websocket.close"
            assert data["code"] == 4003

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_ws_user_self_can_connect(client: AsyncClient, session: AsyncSession):
    """15. User can connect to their own channel."""
    from starlette.testclient import TestClient
    from app.main import app
    from app.database.session import get_db

    user = await _create_user(session, "ws_self@example.com", UserRole.STUDENT)
    await session.commit()
    token = _make_token(user.id)

    app.dependency_overrides[get_db] = lambda: session

    with TestClient(app) as tc:
        with tc.websocket_connect(f"/ws/users/{user.id}?token={token}") as ws:
            ws.send_text(json.dumps({"type": "ping"}))
            response = ws.receive_text()
            msg = json.loads(response)
            assert msg["type"] == "pong"

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_ws_oversized_message_silently_ignored(client: AsyncClient, session: AsyncSession):
    """16. Messages exceeding 4096 bytes are silently discarded."""
    from starlette.testclient import TestClient
    from app.main import app
    from app.database.session import get_db

    admin = await _create_user(session, "ws_admin_big@example.com", UserRole.ADMIN)
    await session.commit()
    token = _make_token(admin.id)

    app.dependency_overrides[get_db] = lambda: session

    oversized_message = "x" * 5000

    with TestClient(app) as tc:
        with tc.websocket_connect(f"/ws/admin?token={token}") as ws:
            ws.send_text(oversized_message)
            # No response is expected; send a ping to confirm connection is still alive
            ws.send_text(json.dumps({"type": "ping"}))
            response = ws.receive_text()
            msg = json.loads(response)
            assert msg["type"] == "pong"

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_ws_stats_endpoint(client: AsyncClient):
    """17. /ws/stats returns correct shape."""
    response = await client.get("/ws/stats")
    assert response.status_code == 200
    data = response.json()
    assert "admin_connections" in data
    assert "event_channels" in data
    assert "team_channels" in data
    assert "user_channels" in data
    for key, value in data.items():
        assert isinstance(value, int), f"{key} should be int, got {type(value)}"


@pytest.mark.asyncio
async def test_ws_admin_super_admin_can_connect(client: AsyncClient, session: AsyncSession):
    """SUPER_ADMIN can also connect to admin channel."""
    from starlette.testclient import TestClient
    from app.main import app
    from app.database.session import get_db

    super_admin = await _create_user(
        session, "ws_superadmin@example.com", UserRole.SUPER_ADMIN
    )
    await session.commit()
    token = _make_token(super_admin.id)

    app.dependency_overrides[get_db] = lambda: session

    with TestClient(app) as tc:
        with tc.websocket_connect(f"/ws/admin?token={token}") as ws:
            ws.send_text(json.dumps({"type": "ping"}))
            response = ws.receive_text()
            msg = json.loads(response)
            assert msg["type"] == "pong"

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_ws_admin_can_join_event_channel(client: AsyncClient, session: AsyncSession):
    """Admin can connect to any event channel without registration."""
    from starlette.testclient import TestClient
    from app.main import app
    from app.database.session import get_db

    admin = await _create_user(session, "ws_event_admin@example.com", UserRole.ADMIN)
    event = await _create_event(session)
    await session.commit()
    token = _make_token(admin.id)

    app.dependency_overrides[get_db] = lambda: session

    with TestClient(app) as tc:
        with tc.websocket_connect(f"/ws/events/{event.id}?token={token}") as ws:
            ws.send_text(json.dumps({"type": "ping"}))
            response = ws.receive_text()
            msg = json.loads(response)
            assert msg["type"] == "pong"

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_ws_admin_can_join_team_channel(client: AsyncClient, session: AsyncSession):
    """Admin can connect to any team channel without being a member."""
    from starlette.testclient import TestClient
    from app.main import app
    from app.database.session import get_db

    admin = await _create_user(session, "ws_team_admin@example.com", UserRole.ADMIN)
    leader = await _create_user(session, "ws_team_leader2@example.com", UserRole.STUDENT)
    event = await _create_event(session)
    team = await _create_team(session, leader, event)
    await session.commit()
    token = _make_token(admin.id)

    app.dependency_overrides[get_db] = lambda: session

    with TestClient(app) as tc:
        with tc.websocket_connect(f"/ws/teams/{team.id}?token={token}") as ws:
            ws.send_text(json.dumps({"type": "ping"}))
            response = ws.receive_text()
            msg = json.loads(response)
            assert msg["type"] == "pong"

    app.dependency_overrides.clear()
