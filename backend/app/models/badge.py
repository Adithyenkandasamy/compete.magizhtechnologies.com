"""
Badge and UserBadge models.

Badges are platform achievements.
UserBadge is the join table with a composite primary key (user_id, badge_id).
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import text

from app.database.session import Base

if TYPE_CHECKING:
    from app.models.user import User


class Badge(Base):
    __tablename__ = "badges"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    icon: Mapped[str] = mapped_column(String(2048), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # ------------------------------------------------------------------ #
    # Relationships
    # ------------------------------------------------------------------ #

    user_badges: Mapped[list["UserBadge"]] = relationship(
        "UserBadge", back_populates="badge", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Badge id={self.id} name={self.name}>"


class UserBadge(Base):
    __tablename__ = "user_badges"

    # Composite primary key
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    badge_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("badges.id", ondelete="CASCADE"),
        primary_key=True,
    )
    awarded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # ------------------------------------------------------------------ #
    # Relationships
    # ------------------------------------------------------------------ #

    user: Mapped["User"] = relationship("User", back_populates="user_badges")
    badge: Mapped["Badge"] = relationship("Badge", back_populates="user_badges")

    __table_args__ = (Index("ix_user_badges_user_id", "user_id"),)

    def __repr__(self) -> str:
        return f"<UserBadge user_id={self.user_id} badge_id={self.badge_id}>"
