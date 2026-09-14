"""
Realtime Event Publisher — Magizh Innovation Platform.

This module provides the single entry point for emitting WebSocket notifications
from business services. By centralizing routing logic here, no service needs to
know how channels are structured or which WebSocket sets to target.

CRITICAL TRANSACTION CONTRACT:
  Publishers MUST only be called AFTER a successful database commit.
  A WebSocket publishing failure must NEVER roll back an already-committed
  database transaction. All publish calls are wrapped to swallow exceptions.

Event payload format:
  {
    "type": "<RealtimeEventType>",
    "timestamp": "<ISO-8601 UTC>",
    "event_id": "<uuid or null>",      # platform event context
    "team_id": "<uuid or null>",       # team context
    "user_id": "<uuid or null>",       # affected user
    "data": { ... }                    # lightweight identifiers ONLY
  }

Privacy rules:
  NEVER include in payloads:
    - password_hash / passwords
    - JWT access tokens / refresh tokens
    - session_hash
    - IP addresses
    - security alert details (except to admins)
    - private judge feedback
    - internal database URLs or credentials

  ONLY include:
    - IDs that the frontend needs to know WHAT changed
    - The event type so the client knows HOW to react
    - Minimal context to avoid unnecessary REST re-fetches
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from app.websocket.events import RealtimeEventType
from app.websocket.manager import manager

logger = logging.getLogger(__name__)


def _build_payload(
    event_type: RealtimeEventType,
    data: dict[str, Any],
    platform_event_id: Optional[uuid.UUID] = None,
    team_id: Optional[uuid.UUID] = None,
    user_id: Optional[uuid.UUID] = None,
) -> dict[str, Any]:
    """Construct a clean, lightweight notification payload."""
    payload: dict[str, Any] = {
        "type": event_type.value,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": data,
    }
    if platform_event_id is not None:
        payload["event_id"] = str(platform_event_id)
    if team_id is not None:
        payload["team_id"] = str(team_id)
    if user_id is not None:
        payload["user_id"] = str(user_id)
    return payload


async def _safe_publish(coro) -> None:
    """
    Execute a coroutine (typically a broadcast call) and swallow any exceptions.
    WebSocket delivery must never corrupt business state.
    """
    try:
        await coro
    except Exception as exc:
        logger.debug("websocket.publish_failed error=%s", exc)


# ============================================================================
# Public publisher functions — called by services AFTER database commit
# ============================================================================


async def publish_registration_created(
    registration_id: uuid.UUID,
    platform_event_id: uuid.UUID,
    user_id: uuid.UUID,
) -> None:
    """
    Emit registration.created to:
      - admin channel (command center live updates)
      - event channel (event-level subscriber)
    """
    payload = _build_payload(
        RealtimeEventType.REGISTRATION_CREATED,
        data={"registration_id": str(registration_id)},
        platform_event_id=platform_event_id,
        user_id=user_id,
    )
    await _safe_publish(manager.broadcast_to_admins(payload))
    await _safe_publish(manager.broadcast_to_event(platform_event_id, payload))


async def publish_registration_cancelled(
    registration_id: uuid.UUID,
    platform_event_id: uuid.UUID,
    user_id: uuid.UUID,
) -> None:
    payload = _build_payload(
        RealtimeEventType.REGISTRATION_CANCELLED,
        data={"registration_id": str(registration_id)},
        platform_event_id=platform_event_id,
        user_id=user_id,
    )
    await _safe_publish(manager.broadcast_to_admins(payload))
    await _safe_publish(manager.broadcast_to_event(platform_event_id, payload))


async def publish_team_created(
    team_id: uuid.UUID,
    platform_event_id: uuid.UUID,
    leader_id: uuid.UUID,
) -> None:
    payload = _build_payload(
        RealtimeEventType.TEAM_CREATED,
        data={"team_id": str(team_id)},
        platform_event_id=platform_event_id,
        user_id=leader_id,
    )
    await _safe_publish(manager.broadcast_to_admins(payload))
    await _safe_publish(manager.broadcast_to_event(platform_event_id, payload))
    await _safe_publish(manager.broadcast_to_team(team_id, payload))


async def publish_team_updated(
    team_id: uuid.UUID,
    platform_event_id: uuid.UUID,
    user_id: uuid.UUID,
) -> None:
    payload = _build_payload(
        RealtimeEventType.TEAM_UPDATED,
        data={"team_id": str(team_id)},
        platform_event_id=platform_event_id,
        user_id=user_id,
    )
    await _safe_publish(manager.broadcast_to_admins(payload))
    await _safe_publish(manager.broadcast_to_event(platform_event_id, payload))
    await _safe_publish(manager.broadcast_to_team(team_id, payload))


async def publish_team_member_joined(
    team_id: uuid.UUID,
    platform_event_id: uuid.UUID,
    joined_user_id: uuid.UUID,
) -> None:
    payload = _build_payload(
        RealtimeEventType.TEAM_MEMBER_JOINED,
        data={"team_id": str(team_id), "member_user_id": str(joined_user_id)},
        platform_event_id=platform_event_id,
        user_id=joined_user_id,
    )
    await _safe_publish(manager.broadcast_to_admins(payload))
    await _safe_publish(manager.broadcast_to_event(platform_event_id, payload))
    await _safe_publish(manager.broadcast_to_team(team_id, payload))
    # Notify the joining user personally
    await _safe_publish(manager.send_to_user(joined_user_id, payload))


async def publish_team_member_removed(
    team_id: uuid.UUID,
    platform_event_id: uuid.UUID,
    removed_user_id: uuid.UUID,
) -> None:
    payload = _build_payload(
        RealtimeEventType.TEAM_MEMBER_REMOVED,
        data={"team_id": str(team_id), "member_user_id": str(removed_user_id)},
        platform_event_id=platform_event_id,
        user_id=removed_user_id,
    )
    await _safe_publish(manager.broadcast_to_admins(payload))
    await _safe_publish(manager.broadcast_to_event(platform_event_id, payload))
    await _safe_publish(manager.broadcast_to_team(team_id, payload))
    # Notify the removed user personally
    await _safe_publish(manager.send_to_user(removed_user_id, payload))


async def publish_team_join_request_created(
    team_id: uuid.UUID,
    platform_event_id: uuid.UUID,
    requester_user_id: uuid.UUID,
    team_leader_id: uuid.UUID,
) -> None:
    payload = _build_payload(
        RealtimeEventType.TEAM_JOIN_REQUEST_CREATED,
        data={"team_id": str(team_id)},
        platform_event_id=platform_event_id,
        user_id=requester_user_id,
    )
    await _safe_publish(manager.broadcast_to_admins(payload))
    await _safe_publish(manager.broadcast_to_team(team_id, payload))
    # Notify the leader personally
    await _safe_publish(manager.send_to_user(team_leader_id, payload))


async def publish_team_join_request_accepted(
    team_id: uuid.UUID,
    platform_event_id: uuid.UUID,
    accepted_user_id: uuid.UUID,
) -> None:
    payload = _build_payload(
        RealtimeEventType.TEAM_JOIN_REQUEST_ACCEPTED,
        data={"team_id": str(team_id)},
        platform_event_id=platform_event_id,
        user_id=accepted_user_id,
    )
    await _safe_publish(manager.broadcast_to_admins(payload))
    await _safe_publish(manager.broadcast_to_team(team_id, payload))
    # Notify the accepted user personally
    await _safe_publish(manager.send_to_user(accepted_user_id, payload))


async def publish_team_join_request_rejected(
    team_id: uuid.UUID,
    platform_event_id: uuid.UUID,
    rejected_user_id: uuid.UUID,
) -> None:
    payload = _build_payload(
        RealtimeEventType.TEAM_JOIN_REQUEST_REJECTED,
        data={"team_id": str(team_id)},
        platform_event_id=platform_event_id,
        user_id=rejected_user_id,
    )
    # Notify the rejected user personally
    await _safe_publish(manager.send_to_user(rejected_user_id, payload))
    await _safe_publish(manager.broadcast_to_team(team_id, payload))


async def publish_team_leadership_transferred(
    team_id: uuid.UUID,
    platform_event_id: uuid.UUID,
    new_leader_id: uuid.UUID,
) -> None:
    payload = _build_payload(
        RealtimeEventType.TEAM_LEADERSHIP_TRANSFERRED,
        data={"team_id": str(team_id), "new_leader_id": str(new_leader_id)},
        platform_event_id=platform_event_id,
        user_id=new_leader_id,
    )
    await _safe_publish(manager.broadcast_to_admins(payload))
    await _safe_publish(manager.broadcast_to_team(team_id, payload))


async def publish_submission_created(
    submission_id: uuid.UUID,
    platform_event_id: uuid.UUID,
    team_id: uuid.UUID,
    user_id: uuid.UUID,
) -> None:
    payload = _build_payload(
        RealtimeEventType.SUBMISSION_CREATED,
        data={"submission_id": str(submission_id), "team_id": str(team_id)},
        platform_event_id=platform_event_id,
        user_id=user_id,
    )
    await _safe_publish(manager.broadcast_to_admins(payload))
    await _safe_publish(manager.broadcast_to_event(platform_event_id, payload))
    await _safe_publish(manager.broadcast_to_team(team_id, payload))


async def publish_submission_submitted(
    submission_id: uuid.UUID,
    platform_event_id: uuid.UUID,
    team_id: uuid.UUID,
    user_id: uuid.UUID,
) -> None:
    payload = _build_payload(
        RealtimeEventType.SUBMISSION_SUBMITTED,
        data={"submission_id": str(submission_id), "team_id": str(team_id)},
        platform_event_id=platform_event_id,
        user_id=user_id,
    )
    await _safe_publish(manager.broadcast_to_admins(payload))
    await _safe_publish(manager.broadcast_to_event(platform_event_id, payload))
    await _safe_publish(manager.broadcast_to_team(team_id, payload))


async def publish_submission_status_changed(
    submission_id: uuid.UUID,
    platform_event_id: uuid.UUID,
    team_id: uuid.UUID,
    new_status: str,
) -> None:
    payload = _build_payload(
        RealtimeEventType.SUBMISSION_STATUS_CHANGED,
        data={
            "submission_id": str(submission_id),
            "team_id": str(team_id),
            "new_status": new_status,
        },
        platform_event_id=platform_event_id,
    )
    await _safe_publish(manager.broadcast_to_admins(payload))
    await _safe_publish(manager.broadcast_to_event(platform_event_id, payload))
    await _safe_publish(manager.broadcast_to_team(team_id, payload))


async def publish_evaluation_created(
    evaluation_id: uuid.UUID,
    submission_id: uuid.UUID,
    platform_event_id: uuid.UUID,
    team_id: uuid.UUID,
) -> None:
    payload = _build_payload(
        RealtimeEventType.EVALUATION_CREATED,
        data={
            "evaluation_id": str(evaluation_id),
            "submission_id": str(submission_id),
            "team_id": str(team_id),
        },
        platform_event_id=platform_event_id,
    )
    await _safe_publish(manager.broadcast_to_admins(payload))
    # Event-channel: admins and judges monitor progress
    await _safe_publish(manager.broadcast_to_event(platform_event_id, payload))


async def publish_evaluation_updated(
    evaluation_id: uuid.UUID,
    submission_id: uuid.UUID,
    platform_event_id: uuid.UUID,
    team_id: uuid.UUID,
) -> None:
    payload = _build_payload(
        RealtimeEventType.EVALUATION_UPDATED,
        data={
            "evaluation_id": str(evaluation_id),
            "submission_id": str(submission_id),
            "team_id": str(team_id),
        },
        platform_event_id=platform_event_id,
    )
    await _safe_publish(manager.broadcast_to_admins(payload))
    await _safe_publish(manager.broadcast_to_event(platform_event_id, payload))


async def publish_result_published(
    platform_event_id: uuid.UUID,
    published_by_user_id: uuid.UUID,
) -> None:
    payload = _build_payload(
        RealtimeEventType.RESULT_PUBLISHED,
        data={"event_id": str(platform_event_id)},
        platform_event_id=platform_event_id,
        user_id=published_by_user_id,
    )
    await _safe_publish(manager.broadcast_to_admins(payload))
    # Broadcast to all subscribers of the event channel (students, judges, admins)
    await _safe_publish(manager.broadcast_to_event(platform_event_id, payload))


async def publish_certificate_issued(
    certificate_id: uuid.UUID,
    platform_event_id: uuid.UUID,
    recipient_user_id: uuid.UUID,
    certificate_type: str,
) -> None:
    payload = _build_payload(
        RealtimeEventType.CERTIFICATE_ISSUED,
        data={
            "certificate_id": str(certificate_id),
            "certificate_type": certificate_type,
        },
        platform_event_id=platform_event_id,
        user_id=recipient_user_id,
    )
    await _safe_publish(manager.broadcast_to_admins(payload))
    # Notify the recipient directly
    await _safe_publish(manager.send_to_user(recipient_user_id, payload))


async def publish_security_alert_created(
    alert_id: uuid.UUID,
    alert_type: str,
    severity: str,
) -> None:
    """
    Security alerts are ADMIN-ONLY events.
    They must NEVER be broadcast to event, team, or user channels.
    """
    payload = _build_payload(
        RealtimeEventType.SECURITY_ALERT_CREATED,
        data={
            "alert_id": str(alert_id),
            "alert_type": alert_type,
            "severity": severity,
            # No IP address, no user email, no detailed description in WS payload
        },
    )
    await _safe_publish(manager.broadcast_to_admins(payload))


async def publish_event_updated(
    platform_event_id: uuid.UUID,
    updated_by_user_id: uuid.UUID,
) -> None:
    payload = _build_payload(
        RealtimeEventType.EVENT_UPDATED,
        data={"event_id": str(platform_event_id)},
        platform_event_id=platform_event_id,
        user_id=updated_by_user_id,
    )
    await _safe_publish(manager.broadcast_to_admins(payload))
    await _safe_publish(manager.broadcast_to_event(platform_event_id, payload))


async def publish_event_published(
    platform_event_id: uuid.UUID,
    published_by_user_id: uuid.UUID,
) -> None:
    payload = _build_payload(
        RealtimeEventType.EVENT_PUBLISHED,
        data={"event_id": str(platform_event_id)},
        platform_event_id=platform_event_id,
        user_id=published_by_user_id,
    )
    await _safe_publish(manager.broadcast_to_admins(payload))
    await _safe_publish(manager.broadcast_to_event(platform_event_id, payload))


async def publish_event_cancelled(
    platform_event_id: uuid.UUID,
    cancelled_by_user_id: uuid.UUID,
) -> None:
    payload = _build_payload(
        RealtimeEventType.EVENT_CANCELLED,
        data={"event_id": str(platform_event_id)},
        platform_event_id=platform_event_id,
        user_id=cancelled_by_user_id,
    )
    await _safe_publish(manager.broadcast_to_admins(payload))
    await _safe_publish(manager.broadcast_to_event(platform_event_id, payload))
