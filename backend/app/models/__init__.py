"""
models/__init__.py

Import every model here so that:
  1. SQLAlchemy can resolve all relationships between models at startup.
  2. Alembic autogenerate sees the full Base.metadata and generates
     accurate migrations.

The import order respects dependency:
  enums → user → event → registration → team → project → judge
       → certificate → notification → audit → security → badge
"""

# Enums — no dependencies
from app.models.enums import (  # noqa: F401
    AccountStatus,
    CertificateType,
    EventMode,
    EventStatus,
    EventType,
    NotificationType,
    RegistrationStatus,
    SecurityAlertSeverity,
    SecurityAlertStatus,
    SubmissionStatus,
    TeamMemberRole,
    UserRole,
)

# Core identity
from app.models.user import Profile, User  # noqa: F401

# Events
from app.models.event import Event, EventSponsor  # noqa: F401

# Participation
from app.models.registration import Registration  # noqa: F401
from app.models.team import Team, TeamMember  # noqa: F401

# Projects & judging
from app.models.project import Project, Submission  # noqa: F401
from app.models.judge import Evaluation, Judge  # noqa: F401

# Outcomes
from app.models.certificate import Certificate  # noqa: F401

# Communication
from app.models.notification import Notification  # noqa: F401

# Security & observability
from app.models.audit import AuditLog, LoginAttempt, UserSession  # noqa: F401
from app.models.security import SecurityAlert  # noqa: F401

# Gamification
from app.models.badge import Badge, UserBadge  # noqa: F401
