"""
WebSocket Event Type Definitions — Magizh Innovation Platform.

All realtime event types are centralized here to prevent arbitrary string
proliferation across services. Every module that emits or handles realtime
events MUST import types from this module.

Architecture:
  The WebSocket layer is a best-effort notification system only.
  PostgreSQL remains the single source of truth.
  REST APIs remain responsible for all data fetching and mutation.
"""

import enum


class RealtimeEventType(str, enum.Enum):
    """
    Exhaustive list of realtime notification types the platform can emit.

    Naming convention: <domain>.<action>
    """

    # --- Authentication / Security ---
    SECURITY_ALERT_CREATED = "security_alert.created"

    # --- Events ---
    EVENT_UPDATED = "event.updated"
    EVENT_PUBLISHED = "event.published"
    EVENT_CANCELLED = "event.cancelled"

    # --- Registrations ---
    REGISTRATION_CREATED = "registration.created"
    REGISTRATION_CANCELLED = "registration.cancelled"

    # --- Teams ---
    TEAM_CREATED = "team.created"
    TEAM_UPDATED = "team.updated"
    TEAM_MEMBER_JOINED = "team.member_joined"
    TEAM_MEMBER_REMOVED = "team.member_removed"
    TEAM_JOIN_REQUEST_CREATED = "team.join_request.created"
    TEAM_JOIN_REQUEST_ACCEPTED = "team.join_request.accepted"
    TEAM_JOIN_REQUEST_REJECTED = "team.join_request.rejected"
    TEAM_LEADERSHIP_TRANSFERRED = "team.leadership_transferred"

    # --- Submissions ---
    SUBMISSION_CREATED = "submission.created"
    SUBMISSION_SUBMITTED = "submission.submitted"
    SUBMISSION_STATUS_CHANGED = "submission.status_changed"

    # --- Evaluations / Judging ---
    EVALUATION_CREATED = "evaluation.created"
    EVALUATION_UPDATED = "evaluation.updated"

    # --- Results ---
    RESULT_PUBLISHED = "result.published"

    # --- Certificates ---
    CERTIFICATE_ISSUED = "certificate.issued"
