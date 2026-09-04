"""
User and Profile models.

User holds authentication credentials.
Profile holds all personal/academic information.
These are split so auth data stays isolated from display data.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import text

from app.database.session import Base
from app.models.enums import AccountStatus, UserRole

if TYPE_CHECKING:
    # pyrefly: ignore [missing-import]
    from app.models.audit import AuditLog, LoginAttempt, UserSession
    from app.models.badge import Badge, UserBadge
    from app.models.certificate import Certificate
    from app.models.event import Event
    from app.models.judge import Judge
    from app.models.notification import Notification
    from app.models.registration import Registration
    from app.models.security import SecurityAlert
    from app.models.team import Team, TeamMember


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole, name="userrole", create_type=True),
        nullable=False,
        default=UserRole.STUDENT,
    )
    status: Mapped[AccountStatus] = mapped_column(
        SAEnum(AccountStatus, name="accountstatus", create_type=True),
        nullable=False,
        default=AccountStatus.ACTIVE,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # ------------------------------------------------------------------ #
    # Relationships
    # ------------------------------------------------------------------ #

    profile: Mapped[Optional["Profile"]] = relationship(
        "Profile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    registrations: Mapped[list["Registration"]] = relationship(
        "Registration", back_populates="user"
    )
    led_teams: Mapped[list["Team"]] = relationship(
        "Team", back_populates="leader", foreign_keys="Team.leader_id"
    )
    team_memberships: Mapped[list["TeamMember"]] = relationship(
        "TeamMember", back_populates="user"
    )
    certificates: Mapped[list["Certificate"]] = relationship(
        "Certificate", back_populates="user"
    )
    notifications: Mapped[list["Notification"]] = relationship(
        "Notification", back_populates="user"
    )
    audit_logs: Mapped[list["AuditLog"]] = relationship(
        "AuditLog", back_populates="user"
    )
    sessions: Mapped[list["UserSession"]] = relationship(
        "UserSession", back_populates="user"
    )
    login_attempts: Mapped[list["LoginAttempt"]] = relationship(
        "LoginAttempt", back_populates="user"
    )
    user_badges: Mapped[list["UserBadge"]] = relationship(
        "UserBadge", back_populates="user"
    )
    judge: Mapped[Optional["Judge"]] = relationship(
        "Judge", back_populates="user", uselist=False
    )
    security_alerts: Mapped[list["SecurityAlert"]] = relationship(
        "SecurityAlert", back_populates="user"
    )

    __table_args__ = (
        Index("ix_users_email", "email"),
        Index("ix_users_status", "status"),
        Index("ix_users_role", "role"),
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"


class Profile(Base):
    __tablename__ = "profiles"

    # Primary key is also the foreign key — one-to-one with User
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    college: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    year: Mapped[Optional[int]] = mapped_column(nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    skills: Mapped[Optional[list[str]]] = mapped_column(
        ARRAY(String), nullable=True
    )
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # ------------------------------------------------------------------ #
    # Relationships
    # ------------------------------------------------------------------ #

    user: Mapped["User"] = relationship("User", back_populates="profile")

    def __repr__(self) -> str:
        return f"<Profile user_id={self.user_id} name={self.full_name}>"
