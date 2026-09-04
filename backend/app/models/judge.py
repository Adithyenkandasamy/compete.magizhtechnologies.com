"""
Judge and Evaluation models.

Judge links a User to judging duties.
Evaluation stores per-judge scores for a Submission with validated
score ceilings enforced at the database level via CHECK constraints.

Score ceilings:
  innovation    25
  technical     25
  impact        20
  uiux          15
  presentation  15
  total        100

A judge may evaluate a submission only once
(unique constraint on submission_id + judge_id).
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import text

from app.database.session import Base

if TYPE_CHECKING:
    from app.models.project import Submission
    from app.models.user import User


class Judge(Base):
    __tablename__ = "judges"

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
        unique=True,  # one judge record per user
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    expertise: Mapped[Optional[list[str]]] = mapped_column(ARRAY(String), nullable=True)
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

    user: Mapped["User"] = relationship("User", back_populates="judge")
    evaluations: Mapped[list["Evaluation"]] = relationship(
        "Evaluation", back_populates="judge"
    )

    def __repr__(self) -> str:
        return f"<Judge id={self.id} name={self.name}>"


class Evaluation(Base):
    __tablename__ = "evaluations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    submission_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("submissions.id", ondelete="CASCADE"),
        nullable=False,
    )
    judge_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("judges.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Individual score components
    innovation_score: Mapped[Optional[float]] = mapped_column(
        Numeric(5, 2), nullable=True
    )
    technical_score: Mapped[Optional[float]] = mapped_column(
        Numeric(5, 2), nullable=True
    )
    impact_score: Mapped[Optional[float]] = mapped_column(
        Numeric(5, 2), nullable=True
    )
    uiux_score: Mapped[Optional[float]] = mapped_column(
        Numeric(5, 2), nullable=True
    )
    presentation_score: Mapped[Optional[float]] = mapped_column(
        Numeric(5, 2), nullable=True
    )

    # Aggregate — computed and stored by service layer
    total_score: Mapped[Optional[float]] = mapped_column(
        Numeric(6, 2), nullable=True
    )
    feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

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

    submission: Mapped["Submission"] = relationship(
        "Submission", back_populates="evaluations"
    )
    judge: Mapped["Judge"] = relationship("Judge", back_populates="evaluations")

    __table_args__ = (
        # A judge evaluates a submission exactly once
        UniqueConstraint(
            "submission_id", "judge_id", name="uq_evaluations_submission_judge"
        ),
        # Score ceiling constraints
        CheckConstraint(
            "innovation_score IS NULL OR (innovation_score >= 0 AND innovation_score <= 25)",
            name="ck_evaluations_innovation_score",
        ),
        CheckConstraint(
            "technical_score IS NULL OR (technical_score >= 0 AND technical_score <= 25)",
            name="ck_evaluations_technical_score",
        ),
        CheckConstraint(
            "impact_score IS NULL OR (impact_score >= 0 AND impact_score <= 20)",
            name="ck_evaluations_impact_score",
        ),
        CheckConstraint(
            "uiux_score IS NULL OR (uiux_score >= 0 AND uiux_score <= 15)",
            name="ck_evaluations_uiux_score",
        ),
        CheckConstraint(
            "presentation_score IS NULL OR (presentation_score >= 0 AND presentation_score <= 15)",
            name="ck_evaluations_presentation_score",
        ),
        CheckConstraint(
            "total_score IS NULL OR (total_score >= 0 AND total_score <= 100)",
            name="ck_evaluations_total_score",
        ),
        Index("ix_evaluations_submission_id", "submission_id"),
        Index("ix_evaluations_judge_id", "judge_id"),
    )

    def __repr__(self) -> str:
        return (
            f"<Evaluation id={self.id} submission_id={self.submission_id} "
            f"judge_id={self.judge_id} total={self.total_score}>"
        )
