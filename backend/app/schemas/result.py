import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.enums import ResultStatus


class CriterionBreakdown(BaseModel):
    """Average scores across judges for each evaluation criterion."""
    innovation_score: Optional[float] = Field(None, description="Average Innovation & Originality score (0-25)")
    technical_score: Optional[float] = Field(None, description="Average Technical score (0-25)")
    impact_score: Optional[float] = Field(None, description="Average Impact & Value score (0-20)")
    uiux_score: Optional[float] = Field(None, description="Average UI/UX score (0-15)")
    presentation_score: Optional[float] = Field(None, description="Average Presentation score (0-15)")


class ResultEntryResponse(BaseModel):
    """Public leaderboard entry for a team and project placement."""
    rank: int = Field(..., description="Official placement rank (1 = Winner)")
    submission_id: uuid.UUID
    project_id: uuid.UUID
    team_id: uuid.UUID
    project_title: Optional[str] = None
    project_description: Optional[str] = None
    team_name: Optional[str] = None
    team_members: list[str] = Field(default_factory=list, description="Public list of team member names")
    final_score: float = Field(..., description="Overall score averaged across all evaluations (2 decimal places)")
    scores: Optional[CriterionBreakdown] = Field(None, description="Detailed criterion score breakdown")
    evaluations_count: int = Field(..., description="Number of judge evaluations averaged")
    award: Optional[str] = Field(None, description="Award or title, e.g. Winner, 1st Runner Up")
    is_winner: bool = Field(False, description="Whether the team is declared the overall winner")

    class Config:
        from_attributes = True


class ResultsResponse(BaseModel):
    """Official public results for an event."""
    event_id: uuid.UUID
    event_title: str
    status: ResultStatus = ResultStatus.PUBLISHED
    version: int = 1
    published_at: Optional[datetime] = None
    total_ranked: int = 0
    results: list[ResultEntryResponse] = Field(default_factory=list)


# Backward-compatibility alias
LeaderboardResponse = ResultsResponse
EventResultResponse = ResultEntryResponse


class AdminResultEntryResponse(ResultEntryResponse):
    """Detailed result entry for administrators with snapshot versioning and internal notes."""
    id: uuid.UUID
    version: int
    status: ResultStatus
    is_published: bool
    notes: Optional[str] = None
    calculated_at: datetime
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Backward-compatibility alias
AdminEventResultResponse = AdminResultEntryResponse


class AdminResultsResponse(BaseModel):
    """Full administrative view of current calculated results."""
    event_id: uuid.UUID
    event_title: str
    status: ResultStatus
    version: int
    calculated_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    total_ranked: int
    results: list[AdminResultEntryResponse]


class ResultStatusResponse(BaseModel):
    """Administrative status of event results."""
    event_id: uuid.UUID
    has_results: bool
    status: Optional[ResultStatus] = None
    version: int = 1
    calculated_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    ranked_submissions_count: int = 0
    total_eligible_submissions: int = 0
    total_evaluations: int = 0


class ResultPublishResponse(BaseModel):
    """Confirmation payload returned when event results are published."""
    event_id: uuid.UUID
    message: str
    status: ResultStatus
    version: int
    published_at: datetime
    published_results_count: int


class CalculateResultsRequest(BaseModel):
    """Admin configuration payload for computing event rankings and scores."""
    publish_immediately: bool = Field(
        False, description="If true, immediately publish results upon calculation"
    )
    force_recalculate: bool = Field(
        False, description="If true and results are already published, creates a new DRAFT version"
    )
    auto_assign_awards: bool = Field(
        True, description="Automatically assign Winner, 1st Runner Up, 2nd Runner Up to top 3"
    )


class UpdateResultAwardRequest(BaseModel):
    """Admin payload to customize honors, awards, or add administrative notes."""
    award: Optional[str] = Field(None, max_length=100, description="Custom award title")
    is_winner: Optional[bool] = Field(None, description="Explicit winner toggle")
    notes: Optional[str] = Field(None, description="Internal administrative notes")


class AnonymousJudgeFeedback(BaseModel):
    """Constructive qualitative feedback from judges stripped of judge identity."""
    feedback: str
    created_at: datetime


class StudentTeamResultResponse(BaseModel):
    """Participant view of their team's performance, ranking, and feedback."""
    event_id: uuid.UUID
    event_title: str
    project_id: uuid.UUID
    project_title: str
    team_id: uuid.UUID
    team_name: str
    rank: Optional[int] = None
    final_score: Optional[float] = None
    award: Optional[str] = None
    is_winner: bool = False
    scores: Optional[CriterionBreakdown] = None
    feedbacks: list[AnonymousJudgeFeedback] = Field(default_factory=list)
    results_published: bool
    message: Optional[str] = None
