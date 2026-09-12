import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base

if TYPE_CHECKING:
    from app.models.event import Event
    from app.models.project import Project, Submission
    from app.models.team import Team


class EventResult(Base):
    """
    Official calculated result and leaderboard placement for a submission in an event.
    Stores aggregate scores averaged across all assigned judges' evaluations.
    """
    __tablename__ = "event_results"

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
    submission_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("submissions.id", ondelete="CASCADE"),
        nullable=False,
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    team_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("teams.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Official placement (1 = Winner, 2 = 1st Runner Up, etc.)
    rank: Mapped[int] = mapped_column(Integer, nullable=False)

    # Final overall score (average of total scores from assigned judges)
    final_score: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)

    # Criterion score averages
    innovation_score: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)
    technical_score: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)
    impact_score: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)
    uiux_score: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)
    presentation_score: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)

    # Number of evaluations included in score calculation
    evaluations_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Honors & Award titles
    award: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_winner: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=text("false"), nullable=False
    )
    is_published: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=text("false"), nullable=False
    )

    # Optional administrative comments/notes
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

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

    event: Mapped["Event"] = relationship("Event", back_populates="results")
    submission: Mapped["Submission"] = relationship("Submission")
    project: Mapped["Project"] = relationship("Project")
    team: Mapped["Team"] = relationship("Team")

    __table_args__ = (
        UniqueConstraint("event_id", "submission_id", name="uq_event_results_event_submission"),
        UniqueConstraint("event_id", "rank", name="uq_event_results_event_rank"),
        Index("ix_event_results_event_id", "event_id"),
        Index("ix_event_results_submission_id", "submission_id"),
        Index("ix_event_results_project_id", "project_id"),
        Index("ix_event_results_team_id", "team_id"),
        Index("ix_event_results_rank", "rank"),
        Index("ix_event_results_is_published", "is_published"),
    )

    def __repr__(self) -> str:
        return (
            f"<EventResult id={self.id} event_id={self.event_id} "
            f"rank={self.rank} final_score={self.final_score}>"
        )
