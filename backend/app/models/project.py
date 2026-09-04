"""
Project and Submission models.

A Project belongs to a Team and an Event.
A Submission wraps a Project for the formal judging process.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import text

from app.database.session import Base
from app.models.enums import SubmissionStatus

if TYPE_CHECKING:
    from app.models.event import Event
    from app.models.judge import Evaluation
    from app.models.team import Team


class Project(Base):
    __tablename__ = "projects"

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
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    problem: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    solution: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tech_stack: Mapped[Optional[list[str]]] = mapped_column(ARRAY(String), nullable=True)
    github_url: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    demo_url: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    video_url: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
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

    team: Mapped["Team"] = relationship("Team", back_populates="projects")
    event: Mapped["Event"] = relationship("Event", back_populates="projects")
    submissions: Mapped[list["Submission"]] = relationship(
        "Submission", back_populates="project", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_projects_team_id", "team_id"),
        Index("ix_projects_event_id", "event_id"),
    )

    def __repr__(self) -> str:
        return f"<Project id={self.id} title={self.title}>"


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped[SubmissionStatus] = mapped_column(
        SAEnum(SubmissionStatus, name="submissionstatus", create_type=True),
        nullable=False,
        default=SubmissionStatus.DRAFT,
    )
    submitted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
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

    project: Mapped["Project"] = relationship("Project", back_populates="submissions")
    event: Mapped["Event"] = relationship("Event", back_populates="submissions")
    evaluations: Mapped[list["Evaluation"]] = relationship(
        "Evaluation", back_populates="submission", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_submissions_project_id", "project_id"),
        Index("ix_submissions_event_id", "event_id"),
        Index("ix_submissions_status", "status"),
    )

    def __repr__(self) -> str:
        return f"<Submission id={self.id} status={self.status}>"
