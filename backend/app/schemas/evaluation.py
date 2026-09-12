import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, model_validator

from app.models.enums import SubmissionStatus
from app.schemas.judge import JudgeResponse
from app.schemas.submission import (
    MinimalEventResponse,
    MinimalProjectResponse,
    MinimalTeamResponse,
    SubmissionResponse,
)


class EvaluationBase(BaseModel):
    innovation_score: int = Field(
        ..., ge=0, le=25, description="Innovation & Originality score (0-25)"
    )
    technical_score: int = Field(
        ..., ge=0, le=25, description="Technical complexity & implementation score (0-25)"
    )
    impact_score: int = Field(
        ..., ge=0, le=20, description="Real-world impact & value score (0-20)"
    )
    uiux_score: int = Field(
        ..., ge=0, le=15, description="UI/UX & User experience score (0-15)"
    )
    presentation_score: int = Field(
        ..., ge=0, le=15, description="Presentation & Demo score (0-15)"
    )
    feedback: Optional[str] = Field(None, description="Qualitative feedback for the student team")


class EvaluationCreate(EvaluationBase):
    """
    Schema for creating an evaluation.
    total_score is strictly server-calculated; client-supplied total_score is rejected/ignored.
    """
    total_score: Optional[int] = Field(
        None, description="Ignored if supplied; server strictly computes total_score"
    )


class EvaluationUpdate(BaseModel):
    """Schema for updating an existing evaluation."""
    innovation_score: Optional[int] = Field(None, ge=0, le=25)
    technical_score: Optional[int] = Field(None, ge=0, le=25)
    impact_score: Optional[int] = Field(None, ge=0, le=20)
    uiux_score: Optional[int] = Field(None, ge=0, le=15)
    presentation_score: Optional[int] = Field(None, ge=0, le=15)
    feedback: Optional[str] = None


class EvaluationResponse(EvaluationBase):
    """Standard evaluation response."""
    id: uuid.UUID
    submission_id: uuid.UUID
    judge_id: uuid.UUID
    total_score: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AdminEvaluationResponse(EvaluationResponse):
    """Comprehensive evaluation detail for admin dashboards."""
    judge: Optional[JudgeResponse] = None
    submission: Optional[SubmissionResponse] = None
    project: Optional[MinimalProjectResponse] = None
    team: Optional[MinimalTeamResponse] = None
    event: Optional[MinimalEventResponse] = None

    class Config:
        from_attributes = True


class EventJudgingOverviewResponse(BaseModel):
    """Aggregate judging statistics for an event."""
    event_id: uuid.UUID
    total_submissions: int
    submissions_evaluated: int
    submissions_pending: int
    assigned_judges_count: int
    evaluations_count: int
    average_score: Optional[float] = None


class JudgeSubmissionResponse(BaseModel):
    """Submission view for an assigned judge with their own evaluation embedded if present."""
    id: uuid.UUID
    project_id: uuid.UUID
    event_id: uuid.UUID
    status: SubmissionStatus
    submitted_at: Optional[datetime] = None
    project: Optional[MinimalProjectResponse] = None
    team: Optional[MinimalTeamResponse] = None
    event: Optional[MinimalEventResponse] = None
    my_evaluation: Optional[EvaluationResponse] = None

    class Config:
        from_attributes = True
