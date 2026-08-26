"""Database models for SQLAlchemy"""

from app.models.audit import AuditLog, LoginAttempt, SecurityAlert, UserSession
from app.models.certificate import Certificate
from app.models.event import Event
from app.models.gamification import Badge, Notification, UserBadge
from app.models.judge import Evaluation, Judge, Leaderboard
from app.models.registration import Registration
from app.models.submission import Submission
from app.models.team import Team, TeamMember
from app.models.user import User
