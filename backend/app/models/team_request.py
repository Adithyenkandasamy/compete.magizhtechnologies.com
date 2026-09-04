"""
Models for Team Invites and Join Requests.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Index, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import text

from app.database.session import Base
from app.models.enums import JoinRequestStatus

if TYPE_CHECKING:
    from app.models.team import Team
    from app.models.user import User


class TeamInvite(Base):
    __tablename__ = "team_invites"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    team_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("teams.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,  # One active invite per team
    )
    # Store only the hash to prevent DB leaks from exposing the actual invite tokens
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    
    # Relationships
    team: Mapped["Team"] = relationship("Team")

    __table_args__ = (
        Index("ix_team_invites_token_hash", "token_hash"),
    )

    def __repr__(self) -> str:
        return f"<TeamInvite id={self.id} team_id={self.team_id}>"


class TeamJoinRequest(Base):
    __tablename__ = "team_join_requests"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    team_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("teams.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped[JoinRequestStatus] = mapped_column(
        SAEnum(JoinRequestStatus, name="joinrequeststatus", create_type=True),
        nullable=False,
        default=JoinRequestStatus.PENDING,
    )
    requested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    reviewed_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    team: Mapped["Team"] = relationship("Team")
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
    reviewer: Mapped[Optional["User"]] = relationship("User", foreign_keys=[reviewed_by])

    __table_args__ = (
        # A user can only have one PENDING/ACCEPTED request per team.
        # We enforce this at the service level and using partial indexes where supported.
        # SQLAlchemy unique constraints don't support WHERE clauses easily in all dialects,
        # but in Postgres we can do a partial index:
        Index(
            "uq_active_team_request",
            "team_id",
            "user_id",
            unique=True,
            postgresql_where=text("status IN ('PENDING', 'ACCEPTED')")
        ),
        Index("ix_join_requests_team_id", "team_id"),
        Index("ix_join_requests_user_id", "user_id"),
        Index("ix_join_requests_status", "status"),
    )

    def __repr__(self) -> str:
        return f"<TeamJoinRequest id={self.id} team_id={self.team_id} user_id={self.user_id} status={self.status}>"
