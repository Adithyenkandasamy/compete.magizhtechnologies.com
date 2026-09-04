"""
Centralized enum definitions for the Magizh Innovation platform.

All enums are str-based so they serialize cleanly to/from JSON and
PostgreSQL stores them as readable string values.
"""

import enum


class UserRole(str, enum.Enum):
    STUDENT = "STUDENT"
    ADMIN = "ADMIN"
    SUPER_ADMIN = "SUPER_ADMIN"


class AccountStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    DELETED = "DELETED"


class EventType(str, enum.Enum):
    HACKATHON = "HACKATHON"
    WORKSHOP = "WORKSHOP"
    MEETUP = "MEETUP"
    COMPETITION = "COMPETITION"
    PROJECT_EXPO = "PROJECT_EXPO"


class EventMode(str, enum.Enum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"
    HYBRID = "HYBRID"


class EventStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ONGOING = "ONGOING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class RegistrationStatus(str, enum.Enum):
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    WAITLISTED = "WAITLISTED"


class TeamMemberRole(str, enum.Enum):
    LEADER = "LEADER"
    MEMBER = "MEMBER"


class JoinRequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class SubmissionStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    EVALUATED = "EVALUATED"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"


class CertificateType(str, enum.Enum):
    PARTICIPATION = "PARTICIPATION"
    WINNER = "WINNER"
    RUNNER_UP = "RUNNER_UP"
    FINALIST = "FINALIST"
    SPECIAL_RECOGNITION = "SPECIAL_RECOGNITION"


class NotificationType(str, enum.Enum):
    EVENT_ANNOUNCEMENT = "EVENT_ANNOUNCEMENT"
    REGISTRATION_CONFIRMED = "REGISTRATION_CONFIRMED"
    REGISTRATION_CANCELLED = "REGISTRATION_CANCELLED"
    TEAM_INVITE = "TEAM_INVITE"
    SUBMISSION_UPDATE = "SUBMISSION_UPDATE"
    EVALUATION_COMPLETE = "EVALUATION_COMPLETE"
    CERTIFICATE_ISSUED = "CERTIFICATE_ISSUED"
    BADGE_AWARDED = "BADGE_AWARDED"
    GENERAL = "GENERAL"


class SecurityAlertSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class SecurityAlertStatus(str, enum.Enum):
    OPEN = "OPEN"
    INVESTIGATING = "INVESTIGATING"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"
