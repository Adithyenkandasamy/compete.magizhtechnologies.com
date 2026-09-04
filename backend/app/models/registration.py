"""
Registration model.

Tracks which users have registered for which events.
Enforces a unique constraint so a user can register only once per event.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Index, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import text

from app.database.session import Base
from app.models.enums import RegistrationStatus

if TYPE_CHECKING:
    from app.models.event import Event
    from app.models.user import User


class Registration(Base):
    __tablename__ = "registrations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped[RegistrationStatus] = mapped_column(
        SAEnum(RegistrationStatus, name="registrationstatus", create_type=True),
        nullable=False,
        default=RegistrationStatus.CONFIRMED,
    )
    registered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # ------------------------------------------------------------------ #
    # Relationships
    # ------------------------------------------------------------------ #

    user: Mapped["User"] = relationship("User", back_populates="registrations")
    event: Mapped["Event"] = relationship("Event", back_populates="registrations")

    __table_args__ = (
        # One registration per user per event
        UniqueConstraint("user_id", "event_id", name="uq_registrations_user_event"),
        Index("ix_registrations_user_id", "user_id"),
        Index("ix_registrations_event_id", "event_id"),
        Index("ix_registrations_status", "status"),
    )

    def __repr__(self) -> str:
        return (
            f"<Registration id={self.id} user_id={self.user_id} "
            f"event_id={self.event_id} status={self.status}>"
        )
