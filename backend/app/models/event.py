"""
Event and EventSponsor models.

All events are owned by Magizh Technologies — no organizer marketplace.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum as SAEnum,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import text

from app.database.session import Base
from app.models.enums import EventMode, EventStatus, EventType

if TYPE_CHECKING:
    from app.models.certificate import Certificate
    from app.models.project import Project, Submission
    from app.models.registration import Registration
    from app.models.team import Team


class Event(Base):
    __tablename__ = "events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    event_type: Mapped[EventType] = mapped_column(
        SAEnum(EventType, name="eventtype", create_type=True), nullable=False
    )
    banner_url: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)

    start_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    end_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    registration_deadline: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    location: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    mode: Mapped[EventMode] = mapped_column(
        SAEnum(EventMode, name="eventmode", create_type=True),
        nullable=False,
        default=EventMode.ONLINE,
    )

    max_participants: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    team_size_min: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    team_size_max: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    prize_pool: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    rules: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    status: Mapped[EventStatus] = mapped_column(
        SAEnum(EventStatus, name="eventstatus", create_type=True),
        nullable=False,
        default=EventStatus.DRAFT,
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

    registrations: Mapped[list["Registration"]] = relationship(
        "Registration", back_populates="event"
    )
    teams: Mapped[list["Team"]] = relationship("Team", back_populates="event")
    projects: Mapped[list["Project"]] = relationship("Project", back_populates="event")
    submissions: Mapped[list["Submission"]] = relationship(
        "Submission", back_populates="event"
    )
    certificates: Mapped[list["Certificate"]] = relationship(
        "Certificate", back_populates="event"
    )
    sponsors: Mapped[list["EventSponsor"]] = relationship(
        "EventSponsor", back_populates="event", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint(
            "team_size_min IS NULL OR team_size_max IS NULL OR team_size_min <= team_size_max",
            name="ck_events_team_size_order",
        ),
        CheckConstraint(
            "start_date IS NULL OR end_date IS NULL OR start_date <= end_date",
            name="ck_events_date_order",
        ),
        CheckConstraint(
            "max_participants IS NULL OR max_participants > 0",
            name="ck_events_max_participants_positive",
        ),
        Index("ix_events_status", "status"),
        Index("ix_events_event_type", "event_type"),
        Index("ix_events_start_date", "start_date"),
    )

    def __repr__(self) -> str:
        return f"<Event id={self.id} title={self.title} status={self.status}>"


class EventSponsor(Base):
    __tablename__ = "event_sponsors"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    logo_url: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    website_url: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # ------------------------------------------------------------------ #
    # Relationships
    # ------------------------------------------------------------------ #

    event: Mapped["Event"] = relationship("Event", back_populates="sponsors")

    __table_args__ = (Index("ix_event_sponsors_event_id", "event_id"),)

    def __repr__(self) -> str:
        return f"<EventSponsor id={self.id} name={self.name} event_id={self.event_id}>"
