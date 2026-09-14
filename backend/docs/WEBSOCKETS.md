# Phase 14 — Real-time WebSockets

## Overview

The Magizh Innovation Platform exposes **four WebSocket channels** for live, event-driven UI updates.

> **Best-effort delivery**: WebSocket events are notifications only — not durable messages. If a client misses an event (disconnected, slow connection), it MUST re-fetch current state via REST. PostgreSQL is always the source of truth.

---

## Endpoints

| Endpoint | Purpose | Auth Required |
|---|---|---|
| `ws://host/ws/admin` | Admin command-center live feed | ADMIN or SUPER_ADMIN |
| `ws://host/ws/events/{event_id}` | Per-event live updates | Registered participant, assigned judge, or admin |
| `ws://host/ws/teams/{team_id}` | Per-team live updates | Team member or admin |
| `ws://host/ws/users/{user_id}` | Personal notifications | Self only (IDOR protected) |
| `GET /ws/stats` | Connection count diagnostics | None (counts only, no sensitive data) |

---

## Authentication

Browser WebSocket clients cannot set `Authorization` headers (standard WebSocket API limitation). JWT access tokens are passed as a **query parameter**:

```
wss://api.magizh.tech/ws/admin?token=<access_token>
```

> **IMPORTANT**: Only use this over **TLS (WSS)**. Never send tokens over unencrypted `ws://` in production.

The backend reuses the same `decode_access_token` logic as all REST endpoints — no second authentication system exists.

**Rejection codes:**

| Close Code | Reason |
|---|---|
| 4001 | Missing, invalid, expired, or malformed token |
| 4003 | Insufficient privileges or IDOR attempt |

---

## Authorization Rules

### `/ws/admin`
- ✅ `ADMIN`, `SUPER_ADMIN`
- ❌ `STUDENT`, `JUDGE`

### `/ws/events/{event_id}`
- ✅ Admins (always)
- ✅ Students with `CONFIRMED` or `WAITLISTED` registration for this event
- ✅ Judges actively assigned to this event
- ❌ Everyone else

### `/ws/teams/{team_id}`
- ✅ Admins
- ✅ Existing team members
- ❌ Unrelated students, unassigned judges

### `/ws/users/{user_id}`
- ✅ The authenticated user whose `id == user_id` in the path
- ❌ All other users (IDOR protected — changing the UUID in the URL is rejected)

---

## Message Format

### Server → Client (all channels)

```json
{
  "type": "registration.created",
  "timestamp": "2026-09-14T10:30:00.000000+00:00",
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "team_id": null,
  "user_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "data": {
    "registration_id": "a3f1c2d0-1234-5678-abcd-ef0123456789"
  }
}
```

**Fields**:
- `type` — Event type string (see [Event Types](#event-types))
- `timestamp` — ISO-8601 UTC timestamp of when the event was emitted
- `event_id` — Platform event UUID (null if not applicable)
- `team_id` — Team UUID (null if not applicable)
- `user_id` — Affected user UUID (null if not applicable)
- `data` — Lightweight identifier payload (**never contains sensitive data**)

### Client → Server (heartbeat only)

```json
{ "type": "ping" }
```

Server responds with:

```json
{ "type": "pong", "timestamp": "2026-09-14T10:30:01.000000+00:00" }
```

Only `ping` is accepted. Any other client message type is **silently discarded**. Messages exceeding **4096 bytes** are also discarded.

---

## Event Types

All event types are defined in [`app/websocket/events.py`](../app/websocket/events.py).

| Event Type | Description | Admin | Event Ch. | Team Ch. | User Ch. |
|---|---|---|---|---|---|
| `registration.created` | User registered for event | ✅ | ✅ | — | — |
| `registration.cancelled` | Registration cancelled | ✅ | ✅ | — | — |
| `team.created` | New team created | ✅ | ✅ | ✅ | — |
| `team.updated` | Team details changed | ✅ | ✅ | ✅ | — |
| `team.member_joined` | Member joined team | ✅ | ✅ | ✅ | ✅ (recipient) |
| `team.member_removed` | Member removed/left | ✅ | ✅ | ✅ | ✅ (recipient) |
| `team.join_request.created` | Join request submitted | ✅ | — | ✅ | ✅ (leader) |
| `team.join_request.accepted` | Join request accepted | ✅ | — | ✅ | ✅ (requester) |
| `team.join_request.rejected` | Join request rejected | — | — | ✅ | ✅ (requester) |
| `team.leadership_transferred` | Leader changed | ✅ | — | ✅ | — |
| `submission.created` | Submission draft created | ✅ | ✅ | ✅ | — |
| `submission.submitted` | Project submitted for judging | ✅ | ✅ | ✅ | — |
| `submission.status_changed` | Admin changes submission status | ✅ | ✅ | ✅ | — |
| `evaluation.created` | Judge scored a submission | ✅ | ✅ | — | — |
| `evaluation.updated` | Judge updated their score | ✅ | ✅ | — | — |
| `result.published` | Event results published | ✅ | ✅ | — | — |
| `certificate.issued` | Certificate officially issued | ✅ | — | — | ✅ (recipient) |
| `security_alert.created` | Brute-force / security event | ✅ | ❌ | ❌ | ❌ |
| `event.updated` | Event details changed | ✅ | ✅ | — | — |
| `event.published` | Event published | ✅ | ✅ | — | — |
| `event.cancelled` | Event cancelled | ✅ | ✅ | — | — |

> **Privacy**: `security_alert.created` events are **admin-only** and never broadcast to event, team, or user channels.

---

## Payload Privacy Rules

WebSocket payloads **never** contain:

- `password_hash` / passwords
- JWT access or refresh tokens
- Session hash
- IP addresses (even in security alerts — only type and severity)
- Private audit data
- Judge feedback text
- Internal database URLs or credentials

Payloads contain only **IDs and event types** sufficient to tell the frontend: *"Something changed — go re-fetch via REST."*

---

## Reconnect Behavior

WebSocket delivery is **not guaranteed**. If a connection drops:

1. REST APIs remain fully functional.
2. PostgreSQL remains the authoritative state.
3. Client reconnects to the appropriate WS channel.
4. Client fetches current state via REST (e.g., TanStack Query invalidation).

**Missed events are NOT replayed.** There is no event history in the WebSocket layer.

---

## Transaction Contract

```
REST request
  ↓ validate
  ↓ business logic
  ↓ database.commit()  ← COMMIT FIRST
  ↓ publisher.publish_*(...)  ← THEN BROADCAST
  ↓ return HTTP response
```

- If DB commit fails → WebSocket event is **NOT emitted**
- If WebSocket publish fails → DB commit **remains successful** (exception swallowed)
- WebSocket failure **never** rolls back a committed transaction

---

## Integration Points

Services that emit realtime events after commit:

| Service | Events Emitted |
|---|---|
| `auth_service.py` | `security_alert.created` |
| `event_service.py` | `event.updated`, `event.published`, `event.cancelled` |
| `registration_service.py` | `registration.created`, `registration.cancelled` |
| `team_service.py` | `team.created`, `team.updated`, `team.member_removed`, `team.leadership_transferred` |
| `team_request_service.py` | `team.join_request.created/accepted/rejected`, `team.member_joined` |
| `submission_service.py` | `submission.created`, `submission.submitted`, `submission.status_changed` |
| `evaluation_service.py` | `evaluation.created`, `evaluation.updated` |
| `result_service.py` | `result.published` |
| `certificate_service.py` | `certificate.issued` |

---

## Architecture

```
ConnectionManager (in-process singleton)
├── _admin: set[WebSocket]
├── _events: dict[UUID, set[WebSocket]]
├── _teams: dict[UUID, set[WebSocket]]
└── _users: dict[UUID, set[WebSocket]]
```

**Module layout**:

| File | Responsibility |
|---|---|
| `app/websocket/events.py` | `RealtimeEventType` enum (21 types) |
| `app/websocket/manager.py` | `ConnectionManager` singleton |
| `app/websocket/auth.py` | JWT query-param authentication helpers |
| `app/websocket/publisher.py` | Centralized event routing and emission |
| `app/websocket/routers.py` | FastAPI WebSocket endpoint handlers |

---

## Known Limitations

1. **Single-instance only**: The in-memory `ConnectionManager` does not share state across multiple FastAPI processes. If horizontal scaling is needed, a shared pub/sub layer (Redis Pub/Sub, Valkey, etc.) would be required. **Do NOT add this now.**

2. **No message history / replay**: Missed events while disconnected are permanently lost. Frontend must re-fetch state via REST after reconnecting.

3. **Token via query parameter**: While the JWT is passed as `?token=`, this is only safe over TLS (WSS). The token is never logged and cleared from memory immediately after validation.

4. **No per-connection rate limiting beyond max-message-size**: Currently messages > 4096 bytes are dropped. More sophisticated rate limiting would require additional infrastructure.

5. **No backpressure / slow consumer protection**: A slow connected client could theoretically cause memory growth. This is acceptable at current scale.

---

## Commands to Run

```bash
# Activate virtual environment
source .venv/bin/activate

# Run tests
pytest tests/api/test_websockets.py -v

# Run all tests  
pytest -v

# Start server
uvicorn app.main:app --reload

# Test WebSocket connection manually (requires websocat)
websocat "ws://localhost:8000/ws/admin?token=<your_admin_jwt>"
```

### Expected WebSocket test output

```
tests/api/test_websockets.py::TestConnectionManager::test_connect_admin PASSED
tests/api/test_websockets.py::TestConnectionManager::test_disconnect_admin PASSED
...
tests/api/test_websockets.py::test_ws_admin_ping_pong PASSED
tests/api/test_websockets.py::test_ws_user_self_can_connect PASSED
tests/api/test_websockets.py::test_ws_user_idor_protection PASSED
...
```
