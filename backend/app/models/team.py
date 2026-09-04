"""
Team and TeamMember models.

A team belongs to a single event.
TeamMember uses a composite primary key (team_id, user_id).
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import text

from app.database.session import Base
from app.models.enums import TeamMemberRole

if TYPE_CHECKING:
    from app.models.event import Event
    from app.models.project import Project
    from app.models.user import User


class Team(Base):
    __tablename__ = "teams"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    leader_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
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

    event: Mapped["Event"] = relationship("Event", back_populates="teams")
    leader: Mapped["User"] = relationship(
        "User", back_populates="led_teams", foreign_keys=[leader_id]
    )
    members: Mapped[list["TeamMember"]] = relationship(
        "TeamMember", back_populates="team", cascade="all, delete-orphan"
    )
    projects: Mapped[list["Project"]] = relationship("Project", back_populates="team")

    __table_args__ = (
        Index("ix_teams_event_id", "event_id"),
        Index("ix_teams_leader_id", "leader_id"),
    )

    def __repr__(self) -> str:
        return f"<Team id={self.id} name={self.name} event_id={self.event_id}>"


class TeamMember(Base):
    __tablename__ = "team_members"

    # Composite primary key
    team_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("teams.id", ondelete="CASCADE"),
        primary_key=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    role: Mapped[TeamMemberRole] = mapped_column(
        SAEnum(TeamMemberRole, name="teammemberrole", create_type=True),
        nullable=False,
        default=TeamMemberRole.MEMBER,
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # ------------------------------------------------------------------ #
    # Relationships
    # ------------------------------------------------------------------ #

    team: Mapped["Team"] = relationship("Team", back_populates="members")
    user: Mapped["User"] = relationship("User", back_populates="team_memberships")

    __table_args__ = (Index("ix_team_members_user_id", "user_id"),)

    def __repr__(self) -> str:
        return f"<TeamMember team_id={self.team_id} user_id={self.user_id} role={self.role}>"
